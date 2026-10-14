import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { dbSource, getPglite, getSql, type Sql } from "@/lib/db";
import { OWNER_EMAIL, OWNER_PASSWORD, STARTER_RECOVERY_CODE } from "./office";
import { can, STATUS_TRANSITIONS, type Action } from "./permissions";
import type {
  AdjustmentInput,
  CompanyInput,
  CustomerInput,
  DocumentInput,
  DriverInput,
  ExpenseInput,
  FuelInput,
  InvoiceInput,
  MaintenanceInput,
  PaymentInput,
  StaffInput,
  TripInput,
  TruckInput,
  TyreInput,
} from "./schemas";
import { addDays, istInputToIso, todayIst } from "./time";
import type { AuditRow, DatabasePlace, Profile, Role, StaffRow, Workspace } from "./types";

export class DeskError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeskError";
  }
}

const COMPANY_ID = "co-sonu";

type Row = Record<string, unknown>;

type Actor = {
  userId: string;
  role: Role;
  driverId: string | null;
  name: string;
  email: string;
};

type Tx = {
  query: <T = Row>(text: string, params?: unknown[]) => Promise<T[]>;
};

const TRANSITIONS = STATUS_TRANSITIONS;

function recoveryHash(code: string): string {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

function sameHash(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function normPlate(plate: string): string {
  return plate.trim().toUpperCase().replace(/\s+/g, " ");
}

function paise(rupees: number): number {
  if (!Number.isFinite(rupees) || rupees < 0) throw new DeskError("Enter a valid amount.");
  return Math.round(rupees * 100);
}

function signedPaise(rupees: number): number {
  if (!Number.isFinite(rupees) || rupees === 0) throw new DeskError("Enter a non-zero adjustment.");
  return Math.round(rupees * 100);
}

function num(value: unknown): number {
  if (value == null || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function numOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value: unknown): string {
  return value == null ? "" : String(value);
}

function iso(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function day(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) {
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const date = String(value.getDate()).padStart(2, "0");
    return `${value.getFullYear()}-${month}-${date}`;
  }
  return String(value).slice(0, 10);
}

function flag(value: unknown): boolean {
  return value === true || value === "t" || value === "true" || value === 1;
}

function blank(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function normalizeRows<T>(rows: T[]): T[] {
  return rows.map((row) => {
    if (!row || typeof row !== "object") return row;
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
      if (typeof value === "bigint") out[key] = Number(value);
      else out[key] = value;
    }
    return out as T;
  });
}

async function withTx<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  if (dbSource === "pglite") {
    const pg = await getPglite();
    return pg.transaction(async (tx) =>
      fn({
        query: async <R = Row>(statement: string, params: unknown[] = []) => {
          const result = await tx.query(statement, params);
          return normalizeRows(result.rows as R[]);
        },
      }),
    );
  }
  const { Client } = await import("pg");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("begin");
    const result = await fn({
      query: async (statement, params = []) => {
        const res = await client.query(statement, params);
        return normalizeRows(res.rows);
      },
    });
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

async function audit(
  tx: Tx,
  actor: Actor | null,
  action: string,
  entityType: string,
  entityId: string,
  summary: string,
) {
  await tx.query(
    `insert into audit_logs (id, company_id, actor_user_id, action, entity_type, entity_id, summary)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [randomUUID(), COMPANY_ID, actor?.userId ?? null, action, entityType, entityId, summary.slice(0, 500)],
  );
}

function allow(actor: Actor, action: Action) {
  if (!actor || !can(actor.role, action)) {
    throw new DeskError("You do not have permission for that action.");
  }
}

async function readActor(userId: string): Promise<Actor> {
  const sql = await getSql();
  // The unauthenticated fallback is permitted only for local PGLite preview
  // (requireUserId fails closed whenever DATABASE_URL is configured). Map that
  // stable preview identity to the seeded owner profile without weakening the
  // deployed, authenticated identity path.
  const rows = userId === "dev-user"
    ? await sql<Row>`
        select s.role, s.driver_id, s.active, u.name, u.email
        from staff_profiles s join "user" u on u.id = s.user_id
        where lower(u.email) = ${OWNER_EMAIL.toLowerCase()} and s.company_id = ${COMPANY_ID}
      `
    : await sql<Row>`
        select s.role, s.driver_id, s.active, u.name, u.email
        from staff_profiles s join "user" u on u.id = s.user_id
        where s.user_id = ${userId} and s.company_id = ${COMPANY_ID}
      `;
  const row = rows[0];
  if (!row || !flag(row.active)) {
    throw new DeskError("This sign-in is not an active Sonu desk account.");
  }
  return {
    userId,
    role: text(row.role) as Role,
    driverId: row.driver_id ? text(row.driver_id) : null,
    name: text(row.name),
    email: text(row.email),
  };
}

async function insertCredentialUser(email: string, password: string, name: string): Promise<string> {
  const sql = await getSql();
  const existing = await sql<Row>`select id from "user" where lower(email) = ${email.toLowerCase()}`;
  if (existing[0]) return text(existing[0].id);
  const id = randomUUID();
  const now = new Date().toISOString();
  const hash = await hashPassword(password);
  try {
    await sql`
      insert into "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt")
      values (${id}, ${name}, ${email}, true, ${now}, ${now})
    `;
    await sql`
      insert into "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
      values (${randomUUID()}, ${id}, ${"credential"}, ${id}, ${hash}, ${now}, ${now})
    `;
  } catch (error) {
    const again = await sql<Row>`select id from "user" where lower(email) = ${email.toLowerCase()}`;
    if (again[0]) return text(again[0].id);
    throw error;
  }
  return id;
}

async function setCredentialPassword(userId: string, password: string) {
  if (password.length < 8 || password.length > 72) {
    throw new DeskError("Password must be 8 to 72 characters.");
  }
  const hash = await hashPassword(password);
  const sql = await getSql();
  const rows = await sql<Row>`
    update "account"
    set "password" = ${hash}, "updatedAt" = now()
    where "userId" = ${userId} and "providerId" = 'credential'
    returning id
  `;
  if (!rows[0]) throw new DeskError("This account has no password to reset.");
}

let seedTask: Promise<void> | null = null;

export function ensureSeed(): Promise<void> {
  seedTask ??= seedOffice().catch((error) => {
    seedTask = null;
    throw error;
  });
  return seedTask;
}

async function seedOffice() {
  const ownerId = await insertCredentialUser(OWNER_EMAIL, OWNER_PASSWORD, "Sonu");
  const sql = await getSql();
  await sql`update "user" set name = 'Sonu' where id = ${ownerId} and name = 'Sonu Owner'`;
  const existing = await sql<Row>`select id from company where id = ${COMPANY_ID}`;
  if (!existing[0]) {
    await withTx(async (tx) => {
      await tx.query(
        `insert into company (
          id, legal_name, display_name, address, phone, email, gstin, tax_bps,
          next_trip_no, next_invoice_no, recovery_code_hash, recovery_is_default
        ) values ($1,$2,$3,'','',$4,'',0,1001,1001,$5,true)`,
        [COMPANY_ID, "Sonu Transport", "Sonu Transport", OWNER_EMAIL, recoveryHash(STARTER_RECOVERY_CODE)],
      );
      await tx.query(
        `insert into staff_profiles (user_id, company_id, role, phone, driver_id)
         values ($1,$2,'owner','',null)`,
        [ownerId, COMPANY_ID],
      );
    });
    return;
  }
  await sql`
    insert into staff_profiles (user_id, company_id, role, phone, driver_id)
    values (${ownerId}, ${COMPANY_ID}, 'owner', '', null)
    on conflict (user_id) do nothing
  `;
  await clearSampleRecords();
}

async function clearSampleRecords() {
  const sql = await getSql();
  await sql`delete from payment_allocations where id in ('alloc1','alloc2') or payment_id in ('pay1','pay2')`;
  await sql`delete from payments where id in ('pay1','pay2')`;
  await sql`delete from invoices where id in ('inv1','inv2')`;
  await sql`delete from fuel_logs where id = 'fuel1'`;
  await sql`delete from expenses where id = 'exp1'`;
  await sql`delete from maintenance_events where id = 'mnt1'`;
  await sql`delete from documents where id in ('doc1','doc2')`;
  await sql`delete from trips where id in ('trip1','trip2')`;
  await sql`delete from staff_profiles where driver_id in ('d1','d2') or user_id in (select id from "user" where lower(email) in ('meera.dispatcher@sonu.com','anil.accounts@sonu.com','ramesh.driver@sonu.com'))`;
  await sql`delete from drivers where id in ('d1','d2')`;
  await sql`delete from customers where id in ('c1','c2')`;
  await sql`delete from trucks where id in ('t1','t2','t3')`;
  await sql`delete from audit_logs where summary like 'Loaded the demonstration fleet%'`;
  await sql`delete from "account" where "userId" in (select id from "user" where lower(email) in ('meera.dispatcher@sonu.com','anil.accounts@sonu.com','ramesh.driver@sonu.com'))`;
  await sql`delete from "user" where lower(email) in ('meera.dispatcher@sonu.com','anil.accounts@sonu.com','ramesh.driver@sonu.com')`;
  await sql`
    update company
    set address = '', phone = ''
    where id = ${COMPANY_ID}
      and address = 'Transport Nagar, Pune, Maharashtra'
      and phone = '02040001234'
  `;
  await sql`
    update company
    set next_trip_no = 1001
    where id = ${COMPANY_ID} and next_trip_no = 1003
      and not exists (select 1 from trips where company_id = ${COMPANY_ID})
  `;
  await sql`
    update company
    set next_invoice_no = 1001
    where id = ${COMPANY_ID} and next_invoice_no = 1003
      and not exists (select 1 from invoices where company_id = ${COMPANY_ID})
  `;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  await ensureSeed();
  const sql = await getSql();
  const rows = userId === "dev-user"
    ? await sql<Row>`
        select s.role, s.phone, s.driver_id, s.active, u.name, u.email, c.display_name, c.id as company_id
        from staff_profiles s join "user" u on u.id = s.user_id join company c on c.id = s.company_id
        where lower(u.email) = ${OWNER_EMAIL.toLowerCase()} and s.company_id = ${COMPANY_ID}
      `
    : await sql<Row>`
        select s.role, s.phone, s.driver_id, s.active, u.name, u.email, c.display_name, c.id as company_id
        from staff_profiles s join "user" u on u.id = s.user_id join company c on c.id = s.company_id
        where s.user_id = ${userId}
      `;
  const row = rows[0];
  if (!row || !flag(row.active)) return null;
  return {
    userId,
    name: text(row.name),
    email: text(row.email),
    role: text(row.role) as Role,
    phone: text(row.phone),
    driverId: row.driver_id ? text(row.driver_id) : null,
    companyId: text(row.company_id),
    companyName: text(row.display_name),
  };
}

async function reservationProblem(
  tx: Tx,
  truckId: string,
  startIso: string,
  endIso: string,
  excludeTripId: string | null,
): Promise<{ message: string; hard: boolean } | null> {
  const trucks = await tx.query<Row>(
    `select id, plate, archived_at, service_hold from trucks where id = $1 and company_id = $2 for update`,
    [truckId, COMPANY_ID],
  );
  const truck = trucks[0];
  if (!truck) return { message: "That truck is not on this fleet.", hard: true };
  if (truck.archived_at) {
    return { message: `${text(truck.plate)} is archived. Restore it before booking.`, hard: true };
  }
  const conflicts = await tx.query<Row>(
    `select trip_number, origin, destination
     from trips
     where company_id = $1 and truck_id = $2
       and status in ('booked', 'in_progress')
       and ($3::text is null or id <> $3)
       and scheduled_departure_at < $5::timestamptz
       and coalesce(expected_arrival_at, scheduled_departure_at + interval '24 hours') > $4::timestamptz`,
    [COMPANY_ID, truckId, excludeTripId, startIso, endIso],
  );
  if (conflicts[0]) {
    return {
      hard: false,
      message: `${text(truck.plate)} already overlaps ${text(conflicts[0].trip_number)} (${text(conflicts[0].origin)} → ${text(conflicts[0].destination)}).`,
    };
  }
  const blocks = await tx.query<Row>(
    `select event_type, blocks_until::text as blocks_until
     from maintenance_events
     where company_id = $1 and truck_id = $2 and completed_on is null
       and (scheduled_on::timestamp at time zone 'Asia/Kolkata') < $4::timestamptz
       and (blocks_until::timestamp at time zone 'Asia/Kolkata') > $3::timestamptz`,
    [COMPANY_ID, truckId, startIso, endIso],
  );
  if (blocks[0]) {
    return {
      hard: false,
      message: `${text(truck.plate)} is in the workshop for ${text(blocks[0].event_type)} until ${day(blocks[0].blocks_until)}.`,
    };
  }
  if (flag(truck.service_hold)) {
    return { hard: false, message: `${text(truck.plate)} is on hold.` };
  }
  return null;
}

async function refuseOrOverride(tx: Tx, actor: Actor, problem: { message: string; hard: boolean } | null, reason: string) {
  if (!problem) return;
  if (problem.hard || actor.role !== "owner" || reason.trim().length < 8) {
    const hint =
      !problem.hard && actor.role === "owner" && reason.trim().length < 8
        ? " The owner can override with a reason of at least 8 characters."
        : "";
    throw new DeskError(`${problem.message}${hint}`);
  }
  await audit(tx, actor, "conflict_override", "truck", "", `${problem.message} Reason: ${reason.trim()}`);
}

async function nextNumber(tx: Tx, column: "next_trip_no" | "next_invoice_no", prefixColumn: "trip_prefix" | "invoice_prefix") {
  const rows = await tx.query<Row>(
    `update company set ${column} = ${column} + 1, updated_at = now()
     where id = $1 returning ${column} as n, ${prefixColumn} as prefix`,
    [COMPANY_ID],
  );
  const row = rows[0];
  if (!row) throw new DeskError("Company settings are missing.");
  return `${text(row.prefix)}-${num(row.n) - 1}`;
}

function windowFor(departure: string, arrival: string): { start: string; end: string } {
  const start = istInputToIso(departure);
  const end = arrival.trim() ? istInputToIso(arrival) : new Date(new Date(start).getTime() + 86_400_000).toISOString();
  if (new Date(end).getTime() <= new Date(start).getTime()) {
    throw new DeskError("Expected arrival must be after departure.");
  }
  return { start, end };
}

export async function saveTruck(userId: string, input: TruckInput) {
  const actor = await readActor(userId);
  allow(actor, "truck.write");
  const plate = normPlate(input.plate);
  return withTx(async (tx) => {
    const clash = await tx.query<Row>(
      `select id from trucks where company_id = $1 and plate_norm = $2 and ($3::text is null or id <> $3)`,
      [COMPANY_ID, plate, input.id ?? null],
    );
    if (clash[0]) throw new DeskError("That registration number is already on the fleet.");
    if (input.id) {
      const rows = await tx.query(
        `update trucks set name = $2, plate = $3, plate_norm = $4, capacity_value = $5, capacity_unit = $6,
           notes = $7, service_hold = $8, updated_at = now()
         where id = $1 and company_id = $9 returning id`,
        [
          input.id,
          input.name,
          plate,
          plate,
          input.capacityValue ?? null,
          input.capacityUnit || "tonnes",
          input.notes,
          input.serviceHold,
          COMPANY_ID,
        ],
      );
      if (!rows[0]) throw new DeskError("Truck not found.");
      await audit(tx, actor, "update", "truck", input.id, `Updated ${plate}.`);
      return { ok: true as const };
    }
    const id = randomUUID();
    await tx.query(
      `insert into trucks (id, company_id, name, plate, plate_norm, capacity_value, capacity_unit, notes, service_hold, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id,
        COMPANY_ID,
        input.name,
        plate,
        plate,
        input.capacityValue ?? null,
        input.capacityUnit || "tonnes",
        input.notes,
        input.serviceHold,
        actor.userId,
      ],
    );
    await audit(tx, actor, "create", "truck", id, `Added truck ${plate}.`);
    return { ok: true as const };
  });
}

export async function archiveTruck(userId: string, id: string, archived: boolean, acknowledge: boolean) {
  const actor = await readActor(userId);
  allow(actor, "truck.write");
  return withTx(async (tx) => {
    const trucks = await tx.query<Row>(`select plate from trucks where id = $1 and company_id = $2 for update`, [
      id,
      COMPANY_ID,
    ]);
    if (!trucks[0]) throw new DeskError("Truck not found.");
    if (archived) {
      const live = await tx.query<Row>(
        `select trip_number from trips
         where truck_id = $1 and status in ('booked','in_progress') and scheduled_departure_at > now()`,
        [id],
      );
      if (live.length && !acknowledge) {
        throw new DeskError(
          `${text(trucks[0].plate)} still has ${live.length} upcoming booking${live.length === 1 ? "" : "s"} (${live
            .map((row) => text(row.trip_number))
            .join(", ")}). Confirm archive to continue.`,
        );
      }
    }
    await tx.query(`update trucks set archived_at = $2, updated_at = now() where id = $1`, [
      id,
      archived ? new Date().toISOString() : null,
    ]);
    await audit(tx, actor, archived ? "archive" : "restore", "truck", id, `${archived ? "Archived" : "Restored"} ${text(trucks[0].plate)}.`);
    return { ok: true as const };
  });
}

export async function saveCustomer(userId: string, input: CustomerInput) {
  const actor = await readActor(userId);
  allow(actor, "customer.write");
  return withTx(async (tx) => {
    const dup = await tx.query<Row>(
      `select id from customers
       where company_id = $1 and lower(name) = lower($2) and phone = $3
         and ($4::text is null or id <> $4) and archived_at is null`,
      [COMPANY_ID, input.name, input.phone, input.id ?? null],
    );
    if (dup[0]) throw new DeskError("A customer with that name and phone is already on the book.");
    if (input.id) {
      const rows = await tx.query(
        `update customers set name=$2, phone=$3, billing_address=$4, gstin=$5, notes=$6,
           archived_at = case when $7 then coalesce(archived_at, now()) else null end, updated_at=now()
         where id=$1 and company_id=$8 returning id`,
        [input.id, input.name, input.phone, input.billingAddress, input.gstin.toUpperCase(), input.notes, input.archived, COMPANY_ID],
      );
      if (!rows[0]) throw new DeskError("Customer not found.");
      await audit(tx, actor, "update", "customer", input.id, `Updated customer ${input.name}.`);
      return { ok: true as const };
    }
    const id = randomUUID();
    await tx.query(
      `insert into customers (id, company_id, name, phone, billing_address, gstin, notes, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, COMPANY_ID, input.name, input.phone, input.billingAddress, input.gstin.toUpperCase(), input.notes, actor.userId],
    );
    await audit(tx, actor, "create", "customer", id, `Added customer ${input.name}.`);
    return { ok: true as const, id };
  });
}

export async function saveDriver(userId: string, input: DriverInput) {
  const actor = await readActor(userId);
  allow(actor, "driver.write");
  const expiry = input.licenseExpiry ? String(input.licenseExpiry).slice(0, 10) : null;
  return withTx(async (tx) => {
    if (input.id) {
      const rows = await tx.query(
        `update drivers set name=$2, phone=$3, license_no=$4, license_expiry=$5, status=$6, notes=$7,
           archived_at = case when $8 then coalesce(archived_at, now()) else null end, updated_at=now()
         where id=$1 and company_id=$9 returning id`,
        [input.id, input.name, input.phone, input.licenseNo, expiry || null, input.status, input.notes, input.archived, COMPANY_ID],
      );
      if (!rows[0]) throw new DeskError("Driver not found.");
      await audit(tx, actor, "update", "driver", input.id, `Updated driver ${input.name}.`);
      return { ok: true as const };
    }
    const id = randomUUID();
    await tx.query(
      `insert into drivers (id, company_id, name, phone, license_no, license_expiry, status, notes, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, COMPANY_ID, input.name, input.phone, input.licenseNo, expiry || null, input.status, input.notes, actor.userId],
    );
    await audit(tx, actor, "create", "driver", id, `Added driver ${input.name}.`);
    return { ok: true as const, id };
  });
}

function cleanName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/**
 * Customer for a trip: an existing record, or a name typed by the office. A typed name
 * is matched to the customer book (case-insensitive) so the same party is never
 * duplicated; an unknown name is added to the book so Customers, Finance and Reports
 * stay connected to the trip.
 */
async function resolveTripCustomer(
  tx: Tx,
  actor: Actor,
  input: { customerId?: string | null; customerName: string; customerPhone: string },
): Promise<string> {
  const given = blank(input.customerId);
  if (given) {
    const rows = await tx.query<Row>(`select id from customers where id = $1 and company_id = $2`, [given, COMPANY_ID]);
    if (!rows[0]) throw new DeskError("Choose a customer from the book.");
    return given;
  }
  const name = cleanName(input.customerName);
  if (!name) throw new DeskError("Enter the customer name.");
  const match = await tx.query<Row>(
    `select id from customers
     where company_id = $1 and lower(btrim(name)) = lower($2) and archived_at is null
     order by created_at, id limit 1`,
    [COMPANY_ID, name],
  );
  if (match[0]) return text(match[0].id);
  allow(actor, "customer.write");
  const id = randomUUID();
  await tx.query(
    `insert into customers (id, company_id, name, phone, billing_address, gstin, notes, created_by)
     values ($1,$2,$3,$4,'','','',$5)`,
    [id, COMPANY_ID, name, input.customerPhone.trim(), actor.userId],
  );
  await audit(tx, actor, "create", "customer", id, `Added customer ${name} while booking a trip.`);
  return id;
}

/** Driver for a trip: an existing record, a typed name (matched or added), or none. */
async function resolveTripDriver(
  tx: Tx,
  actor: Actor,
  input: { driverId?: string | null; driverName: string; driverPhone: string },
): Promise<string | null> {
  const given = blank(input.driverId);
  if (given) {
    const rows = await tx.query<Row>(`select id from drivers where id = $1 and company_id = $2 and archived_at is null`, [
      given,
      COMPANY_ID,
    ]);
    if (!rows[0]) throw new DeskError("That driver is not active.");
    return given;
  }
  const name = cleanName(input.driverName);
  if (!name) return null;
  const match = await tx.query<Row>(
    `select id, status from drivers
     where company_id = $1 and lower(btrim(name)) = lower($2) and archived_at is null
     order by created_at, id limit 1`,
    [COMPANY_ID, name],
  );
  if (match[0]) {
    if (text(match[0].status) !== "active") throw new DeskError(`Driver ${name} is marked inactive.`);
    return text(match[0].id);
  }
  allow(actor, "driver.write");
  const id = randomUUID();
  await tx.query(
    `insert into drivers (id, company_id, name, phone, license_no, license_expiry, status, notes, created_by)
     values ($1,$2,$3,$4,'',null,'active','',$5)`,
    [id, COMPANY_ID, name, input.driverPhone.trim(), actor.userId],
  );
  await audit(tx, actor, "create", "driver", id, `Added driver ${name} while booking a trip.`);
  return id;
}

export async function saveTrip(userId: string, input: TripInput) {
  const actor = await readActor(userId);
  allow(actor, "trip.write");
  const window = windowFor(input.departure, input.arrival);
  const freight = paise(input.freightRupees);
  const advance = paise(input.advanceRupees);
  if (!input.id && input.intent === "draft" && advance > 0) {
    throw new DeskError("Record the advance when you confirm the booking.");
  }
  if (advance > freight) throw new DeskError("Advance cannot exceed the freight.");
  return withTx(async (tx) => {
    const customerId = await resolveTripCustomer(tx, actor, input);
    let existing: Row | null = null;
    if (input.id) {
      const rows = await tx.query<Row>(`select * from trips where id = $1 and company_id = $2 for update`, [
        input.id,
        COMPANY_ID,
      ]);
      existing = rows[0] ?? null;
      if (!existing) throw new DeskError("Trip not found.");
      if (["delivered", "closed", "cancelled"].includes(text(existing.status)) && actor.role !== "owner") {
        throw new DeskError("Only the owner can edit a finished trip.");
      }
    }
    const nextStatus = !existing ? input.intent === "book" ? "booked" : "draft" : text(existing.status) === "draft" && input.intent === "book" ? "booked" : text(existing.status);
    const truckId = blank(input.truckId);
    if (nextStatus === "booked" && !truckId) throw new DeskError("Choose a truck before confirming the booking.");
    const driverId = await resolveTripDriver(tx, actor, input);
    if (truckId && (nextStatus === "booked" || nextStatus === "in_progress")) {
      const problem = await reservationProblem(tx, truckId, window.start, window.end, input.id ?? null);
      await refuseOrOverride(tx, actor, problem, input.overrideReason);
    }
    if (existing) {
      const paid = await tx.query<Row>(
        `select coalesce(sum(amount_paise),0) as n from payments where trip_id = $1 and direction = 'in'`,
        [input.id],
      );
      if (freight < num(paid[0]?.n)) {
        throw new DeskError("Freight cannot be less than payments already recorded. Use an adjustment instead of rewriting history.");
      }
      await tx.query(
        `update trips set customer_id=$2, truck_id=$3, driver_id=$4, origin=$5, destination=$6,
           scheduled_departure_at=$7, expected_arrival_at=$8, goods_description=$9, weight_value=$10,
           weight_unit=$11, freight_paise=$12, status=$13, notes=$14, updated_by=$15, updated_at=now()
         where id=$1`,
        [
          input.id,
          customerId,
          truckId,
          driverId,
          input.origin,
          input.destination,
          window.start,
          input.arrival.trim() ? window.end : null,
          input.goods,
          input.weightValue ?? null,
          input.weightUnit || "tonnes",
          freight,
          nextStatus,
          input.notes,
          actor.userId,
        ],
      );
      await audit(tx, actor, "update", "trip", input.id ?? "", `Updated ${text(existing.trip_number)} (${nextStatus}).`);
      return { ok: true as const, id: input.id as string };
    }
    const id = randomUUID();
    const tripNumber = await nextNumber(tx, "next_trip_no", "trip_prefix");
    await tx.query(
      `insert into trips (
        id, company_id, trip_number, customer_id, truck_id, driver_id, origin, destination,
        scheduled_departure_at, expected_arrival_at, goods_description, weight_value, weight_unit,
        freight_paise, status, notes, source_trip_id, created_by, updated_by
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$18)`,
      [
        id,
        COMPANY_ID,
        tripNumber,
        customerId,
        truckId,
        driverId,
        input.origin,
        input.destination,
        window.start,
        input.arrival.trim() ? window.end : null,
        input.goods,
        input.weightValue ?? null,
        input.weightUnit || "tonnes",
        freight,
        nextStatus,
        input.notes,
        blank(input.sourceTripId),
        actor.userId,
      ],
    );
    if (advance > 0) {
      await tx.query(
        `insert into payments (
          id, company_id, direction, customer_id, trip_id, payment_date, amount_paise, method, kind, notes, created_by
        ) values ($1,$2,'in',$3,$4,$5,$6,'cash','advance','Advance recorded with the booking',$7)`,
        [randomUUID(), COMPANY_ID, customerId, id, todayIst(), advance, actor.userId],
      );
    }
    await audit(tx, actor, "create", "trip", id, `Created ${tripNumber} as ${nextStatus}.`);
    return { ok: true as const, id, tripNumber };
  });
}

export async function setTripStatus(userId: string, id: string, status: string, overrideReason: string) {
  const actor = await readActor(userId);
  return withTx(async (tx) => {
    const rows = await tx.query<Row>(`select * from trips where id = $1 and company_id = $2 for update`, [id, COMPANY_ID]);
    const trip = rows[0];
    if (!trip) throw new DeskError("Trip not found.");
    const from = text(trip.status);
    const allowed = TRANSITIONS[from]?.[status] ?? [];
    if (!allowed.includes(actor.role)) throw new DeskError("That status change is not allowed for your role.");
    if (actor.role === "driver" && text(trip.driver_id) !== (actor.driverId ?? "")) {
      throw new DeskError("You can update only your own assigned trip.");
    }
    if (status === "booked") {
      if (!trip.truck_id) throw new DeskError("Choose a truck before confirming the booking.");
      const end =
        iso(trip.expected_arrival_at) ??
        new Date(new Date(text(iso(trip.scheduled_departure_at))).getTime() + 86_400_000).toISOString();
      const problem = await reservationProblem(
        tx,
        text(trip.truck_id),
        text(iso(trip.scheduled_departure_at)),
        end,
        id,
      );
      await refuseOrOverride(tx, actor, problem, overrideReason);
    }
    const actualDeparture = status === "in_progress" ? (iso(trip.actual_departure_at) ?? new Date().toISOString()) : iso(trip.actual_departure_at);
    const actualArrival =
      status === "delivered" || status === "closed"
        ? (iso(trip.actual_arrival_at) ?? new Date().toISOString())
        : status === "in_progress"
          ? null
          : iso(trip.actual_arrival_at);
    await tx.query(
      `update trips set status=$2, actual_departure_at=$3, actual_arrival_at=$4, updated_by=$5, updated_at=now() where id=$1`,
      [id, status, actualDeparture, actualArrival, actor.userId],
    );
    await audit(tx, actor, "status", "trip", id, `${text(trip.trip_number)} moved from ${from} to ${status}.`);
    return { ok: true as const };
  });
}

export async function saveFuel(userId: string, input: FuelInput) {
  const actor = await readActor(userId);
  allow(actor, "fuel.write");
  const loggedAt = istInputToIso(input.loggedAt);
  return withTx(async (tx) => {
    const previous = await tx.query<Row>(
      `select odometer_km from fuel_logs
       where truck_id = $1 and odometer_km is not null
       order by logged_at desc limit 1`,
      [input.truckId],
    );
    const prior = numOrNull(previous[0]?.odometer_km);
    const flagged = input.odometerKm != null && prior != null && input.odometerKm < prior;
    const id = randomUUID();
    await tx.query(
      `insert into fuel_logs (
        id, company_id, truck_id, trip_id, logged_at, odometer_km, quantity_ml, total_paise,
        vendor_name, notes, flagged, flag_reason, created_by
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        id,
        COMPANY_ID,
        input.truckId,
        blank(input.tripId),
        loggedAt,
        input.odometerKm ?? null,
        input.quantityLitres != null ? Math.round(input.quantityLitres * 1000) : null,
        paise(input.amountRupees),
        input.vendorName,
        input.notes,
        flagged,
        flagged ? `Odometer is lower than the previous reading (${prior} km).` : "",
        actor.userId,
      ],
    );
    await audit(tx, actor, "create", "fuel", id, `Fuel ${input.amountRupees} recorded.${flagged ? " Odometer flagged." : ""}`);
    return {
      ok: true as const,
      warning: flagged ? `Saved, but the odometer is lower than the previous reading (${prior} km). Review it before treating mileage as exact.` : "",
    };
  });
}

export async function saveExpense(userId: string, input: ExpenseInput) {
  const actor = await readActor(userId);
  allow(actor, "expense.write");
  const id = randomUUID();
  await withTx(async (tx) => {
    await tx.query(
      `insert into expenses (
        id, company_id, truck_id, trip_id, category, expense_date, amount_paise, vendor_name, description, created_by
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id,
        COMPANY_ID,
        blank(input.truckId),
        blank(input.tripId),
        input.category,
        input.expenseDate,
        paise(input.amountRupees),
        input.vendorName,
        input.description,
        actor.userId,
      ],
    );
    await audit(tx, actor, "create", "expense", id, `${input.category} expense recorded.`);
  });
  return { ok: true as const };
}

async function refreshInvoice(tx: Tx, invoiceId: string) {
  const rows = await tx.query<Row>(`select total_paise, status from invoices where id = $1`, [invoiceId]);
  const invoice = rows[0];
  if (!invoice || text(invoice.status) === "void") return;
  const allocated = await tx.query<Row>(
    `select coalesce(sum(amount_paise),0) as n from payment_allocations where invoice_id = $1`,
    [invoiceId],
  );
  const paid = num(allocated[0]?.n);
  const total = num(invoice.total_paise);
  const status = paid >= total ? "paid" : paid > 0 ? "partial" : "issued";
  await tx.query(`update invoices set status = $2 where id = $1`, [invoiceId, status]);
}

export async function createInvoice(userId: string, input: InvoiceInput) {
  const actor = await readActor(userId);
  allow(actor, "invoice.write");
  return withTx(async (tx) => {
    const customers = await tx.query(`select id from customers where id = $1 and company_id = $2`, [
      input.customerId,
      COMPANY_ID,
    ]);
    if (!customers[0]) throw new DeskError("Choose a customer from the book.");
    let subtotal = input.subtotalRupees != null ? paise(input.subtotalRupees) : 0;
    const tripId = blank(input.tripId);
    if (tripId) {
      const trips = await tx.query<Row>(`select customer_id, freight_paise, trip_number from trips where id = $1 and company_id = $2`, [
        tripId,
        COMPANY_ID,
      ]);
      const trip = trips[0];
      if (!trip) throw new DeskError("That trip was not found.");
      if (text(trip.customer_id) !== input.customerId) throw new DeskError("The invoice customer must match the trip.");
      const existing = await tx.query(
        `select id from invoices where trip_id = $1 and status <> 'void'`,
        [tripId],
      );
      if (existing[0]) throw new DeskError(`${text(trip.trip_number)} already has an invoice. Void it before issuing another.`);
      if (input.subtotalRupees == null) subtotal = num(trip.freight_paise);
    }
    if (subtotal <= 0) throw new DeskError("Invoice total must be greater than zero.");
    const company = await tx.query<Row>(`select tax_bps from company where id = $1`, [COMPANY_ID]);
    const tax = Math.round((subtotal * num(company[0]?.tax_bps)) / 10000);
    const total = subtotal + tax;
    const id = randomUUID();
    const number = await nextNumber(tx, "next_invoice_no", "invoice_prefix");
    const issue = input.issueDate || todayIst();
    const due = input.dueDate || addDays(issue, 15);
    await tx.query(
      `insert into invoices (
        id, company_id, invoice_number, customer_id, trip_id, issue_date, due_date,
        subtotal_paise, tax_paise, total_paise, status, notes, created_by
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'issued',$11,$12)`,
      [id, COMPANY_ID, number, input.customerId, tripId, issue, due, subtotal, tax, total, input.notes, actor.userId],
    );
    if (tripId) {
      const credits = await tx.query<Row>(
        `select p.id,
           p.amount_paise - coalesce((select sum(a.amount_paise) from payment_allocations a where a.payment_id = p.id),0) as remaining
         from payments p
         where p.trip_id = $1 and p.direction = 'in'
         order by p.payment_date, p.created_at`,
        [tripId],
      );
      let left = total;
      for (const credit of credits) {
        const remaining = num(credit.remaining);
        if (remaining <= 0 || left <= 0) continue;
        const take = Math.min(remaining, left);
        await tx.query(
          `insert into payment_allocations (id, payment_id, invoice_id, amount_paise) values ($1,$2,$3,$4)`,
          [randomUUID(), text(credit.id), id, take],
        );
        left -= take;
      }
    }
    await refreshInvoice(tx, id);
    await audit(tx, actor, "create", "invoice", id, `Issued ${number}.`);
    return { ok: true as const, id, invoiceNumber: number };
  });
}

export async function voidInvoice(userId: string, id: string) {
  const actor = await readActor(userId);
  allow(actor, "invoice.write");
  return withTx(async (tx) => {
    const rows = await tx.query<Row>(`select invoice_number, status from invoices where id = $1 and company_id = $2 for update`, [
      id,
      COMPANY_ID,
    ]);
    if (!rows[0]) throw new DeskError("Invoice not found.");
    if (text(rows[0].status) === "void") throw new DeskError("That invoice is already void.");
    await tx.query(`delete from payment_allocations where invoice_id = $1`, [id]);
    await tx.query(`update invoices set status = 'void' where id = $1`, [id]);
    await audit(
      tx,
      actor,
      "void",
      "invoice",
      id,
      `Voided ${text(rows[0].invoice_number)}. Allocated receipts stay on the customer as unallocated credit.`,
    );
    return { ok: true as const };
  });
}

export async function recordPayment(userId: string, input: PaymentInput) {
  const actor = await readActor(userId);
  allow(actor, "payment.write");
  const amount = paise(input.amountRupees);
  const allocations = input.allocations.map((row) => ({ invoiceId: row.invoiceId, amount: paise(row.amountRupees) }));
  const allocated = allocations.reduce((sum, row) => sum + row.amount, 0);
  if (allocated > amount) throw new DeskError("Allocated amounts cannot exceed the payment.");
  return withTx(async (tx) => {
    for (const row of allocations) {
      const invoices = await tx.query<Row>(
        `select total_paise, status, customer_id from invoices where id = $1 and company_id = $2 for update`,
        [row.invoiceId, COMPANY_ID],
      );
      const invoice = invoices[0];
      if (!invoice || text(invoice.customer_id) !== input.customerId) throw new DeskError("That invoice is not for this customer.");
      if (text(invoice.status) === "void") throw new DeskError("Cannot allocate a payment to a void invoice.");
      const already = await tx.query<Row>(
        `select coalesce(sum(amount_paise),0) as n from payment_allocations where invoice_id = $1`,
        [row.invoiceId],
      );
      if (num(already[0]?.n) + row.amount > num(invoice.total_paise)) {
        throw new DeskError("A payment allocation is larger than the invoice balance.");
      }
    }
    const id = randomUUID();
    await tx.query(
      `insert into payments (
        id, company_id, direction, customer_id, trip_id, payment_date, amount_paise, method, reference, notes, kind, created_by
      ) values ($1,$2,'in',$3,$4,$5,$6,$7,$8,$9,'receipt',$10)`,
      [
        id,
        COMPANY_ID,
        input.customerId,
        blank(input.tripId),
        input.paymentDate,
        amount,
        input.method,
        input.reference,
        input.notes,
        actor.userId,
      ],
    );
    for (const row of allocations) {
      await tx.query(
        `insert into payment_allocations (id, payment_id, invoice_id, amount_paise) values ($1,$2,$3,$4)`,
        [randomUUID(), id, row.invoiceId, row.amount],
      );
      await refreshInvoice(tx, row.invoiceId);
    }
    await audit(tx, actor, "create", "payment", id, `Recorded a receipt of ${input.amountRupees}.`);
    return { ok: true as const };
  });
}

export async function saveAdjustment(userId: string, input: AdjustmentInput) {
  const actor = await readActor(userId);
  allow(actor, "payment.write");
  const id = randomUUID();
  await withTx(async (tx) => {
    await tx.query(
      `insert into adjustments (id, company_id, customer_id, invoice_id, amount_paise, reason, created_by)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [id, COMPANY_ID, input.customerId, blank(input.invoiceId), signedPaise(input.amountRupees), input.reason, actor.userId],
    );
    await audit(tx, actor, "adjust", "customer", input.customerId, input.reason);
  });
  return { ok: true as const };
}

export async function saveMaintenance(userId: string, input: MaintenanceInput) {
  const actor = await readActor(userId);
  allow(actor, "maintenance.write");
  if (input.blocksUntil <= input.scheduledOn) {
    throw new DeskError("The workshop window must end after it starts.");
  }
  const id = randomUUID();
  await withTx(async (tx) => {
    await tx.query(
      `insert into maintenance_events (
        id, company_id, truck_id, event_type, scheduled_on, blocks_until, odometer_km, cost_paise, vendor_name, notes, created_by
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        id,
        COMPANY_ID,
        input.truckId,
        input.eventType,
        input.scheduledOn,
        input.blocksUntil,
        input.odometerKm ?? null,
        paise(input.costRupees),
        input.vendorName,
        input.notes,
        actor.userId,
      ],
    );
    await audit(tx, actor, "create", "maintenance", id, `Scheduled ${input.eventType}.`);
  });
  return { ok: true as const };
}

export async function completeMaintenance(userId: string, id: string) {
  const actor = await readActor(userId);
  allow(actor, "maintenance.write");
  await withTx(async (tx) => {
    const rows = await tx.query(
      `update maintenance_events set completed_on = $2 where id = $1 and company_id = $3 and completed_on is null returning id`,
      [id, todayIst(), COMPANY_ID],
    );
    if (!rows[0]) throw new DeskError("That workshop job is already finished or missing.");
    await audit(tx, actor, "complete", "maintenance", id, "Marked the workshop job complete. The truck is free of this block.");
  });
  return { ok: true as const };
}

export async function saveTyre(userId: string, input: TyreInput) {
  const actor = await readActor(userId);
  allow(actor, "maintenance.write");
  const id = randomUUID();
  await withTx(async (tx) => {
    await tx.query(
      `insert into tyre_records (
        id, company_id, truck_id, identifier, position, installed_on, installed_odometer, cost_paise, notes, created_by
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id,
        COMPANY_ID,
        input.truckId,
        input.identifier,
        input.position,
        input.installedOn,
        input.installedOdometer ?? null,
        input.costRupees != null ? paise(input.costRupees) : null,
        input.notes,
        actor.userId,
      ],
    );
    await audit(tx, actor, "create", "tyre", id, `Tyre ${input.identifier} fitted.`);
  });
  return { ok: true as const };
}

export async function removeTyre(userId: string, id: string) {
  const actor = await readActor(userId);
  allow(actor, "maintenance.write");
  await withTx(async (tx) => {
    const rows = await tx.query(
      `update tyre_records set removed_on = $2 where id = $1 and company_id = $3 and removed_on is null returning id`,
      [id, todayIst(), COMPANY_ID],
    );
    if (!rows[0]) throw new DeskError("That tyre is already off the truck or missing.");
    await audit(tx, actor, "remove", "tyre", id, "Tyre marked removed.");
  });
  return { ok: true as const };
}

export async function saveDocument(userId: string, input: DocumentInput) {
  const actor = await readActor(userId);
  allow(actor, "document.write");
  const content = input.contentBase64?.trim() || null;
  if (content && !/^[A-Za-z0-9+/=\s]+$/.test(content)) throw new DeskError("The attachment could not be read.");
  const id = randomUUID();
  await withTx(async (tx) => {
    await tx.query(
      `insert into documents (
        id, company_id, entity_type, entity_id, document_type, document_number, issue_date, expiry_date,
        filename, mime_type, size_bytes, content_base64, notes, uploaded_by
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        id,
        COMPANY_ID,
        input.entityType,
        input.entityId,
        input.documentType,
        input.documentNumber,
        blank(input.issueDate) ,
        blank(input.expiryDate),
        input.filename,
        input.mimeType,
        content ? Math.floor((content.length * 3) / 4) : 0,
        content,
        input.notes,
        actor.userId,
      ],
    );
    await audit(tx, actor, "create", "document", id, `${input.documentType} saved. File contents are not copied into the audit log.`);
  });
  return { ok: true as const };
}

export async function getDocumentFile(userId: string, id: string) {
  const actor = await readActor(userId);
  if (actor.role === "driver") throw new DeskError("You do not have permission for that action.");
  const sql = await getSql();
  const rows = await sql<Row>`
    select filename, mime_type, content_base64 from documents where id = ${id} and company_id = ${COMPANY_ID}
  `;
  const row = rows[0];
  if (!row || !row.content_base64) throw new DeskError("There is no file on that document.");
  return { filename: text(row.filename) || "document", mimeType: text(row.mime_type) || "application/octet-stream", contentBase64: text(row.content_base64) };
}

export async function saveCompany(userId: string, input: CompanyInput) {
  const actor = await readActor(userId);
  allow(actor, "settings.manage");
  await withTx(async (tx) => {
    await tx.query(
      `update company set legal_name=$2, display_name=$3, address=$4, phone=$5, email=$6, gstin=$7, tax_bps=$8, updated_at=now()
       where id=$1`,
      [
        COMPANY_ID,
        input.legalName,
        input.displayName,
        input.address,
        input.phone,
        input.email,
        input.gstin.toUpperCase(),
        Math.round(input.taxPercent * 100),
      ],
    );
    await audit(tx, actor, "update", "company", COMPANY_ID, "Updated company settings.");
  });
  return { ok: true as const };
}

export async function rotateRecovery(userId: string, code: string) {
  const actor = await readActor(userId);
  allow(actor, "settings.manage");
  await withTx(async (tx) => {
    await tx.query(`update company set recovery_code_hash=$2, recovery_is_default=false, updated_at=now() where id=$1`, [
      COMPANY_ID,
      recoveryHash(code),
    ]);
    await audit(tx, actor, "rotate_recovery", "company", COMPANY_ID, "Recovery code replaced. The new code was not written to the audit log.");
  });
  return { ok: true as const };
}

export async function createStaff(userId: string, input: StaffInput) {
  const actor = await readActor(userId);
  allow(actor, "settings.manage");
  const email = input.email.trim().toLowerCase();
  const id = await insertCredentialUser(email, input.password, input.name.trim());
  const sql = await getSql();
  const existing = await sql<Row>`select user_id from staff_profiles where user_id = ${id}`;
  if (existing[0]) throw new DeskError("That email is already a desk account. Reset the password instead of creating it again.");
  await withTx(async (tx) => {
    if (input.driverId) {
      const drivers = await tx.query(`select id from drivers where id = $1 and company_id = $2`, [input.driverId, COMPANY_ID]);
      if (!drivers[0]) throw new DeskError("Link the driver to a driver already on the book.");
    }
    await tx.query(
      `insert into staff_profiles (user_id, company_id, role, phone, driver_id) values ($1,$2,$3,$4,$5)`,
      [id, COMPANY_ID, input.role, input.phone, input.role === "driver" ? blank(input.driverId) : null],
    );
    await audit(tx, actor, "create", "staff", id, `Added ${input.role} account ${email}.`);
  });
  return { ok: true as const };
}

export async function setStaffActive(userId: string, targetId: string, active: boolean) {
  const actor = await readActor(userId);
  allow(actor, "settings.manage");
  if (targetId === actor.userId && !active) throw new DeskError("You cannot deactivate the account you are using.");
  await withTx(async (tx) => {
    const owners = await tx.query<Row>(
      `select user_id from staff_profiles where company_id = $1 and role = 'owner' and active = true`,
      [COMPANY_ID],
    );
    const target = await tx.query<Row>(`select role from staff_profiles where user_id = $1 and company_id = $2`, [
      targetId,
      COMPANY_ID,
    ]);
    if (!target[0]) throw new DeskError("Staff account not found.");
    if (!active && text(target[0].role) === "owner" && owners.length < 2) {
      throw new DeskError("Keep at least one active owner.");
    }
    await tx.query(`update staff_profiles set active = $2, updated_at = now() where user_id = $1`, [targetId, active]);
    await audit(tx, actor, active ? "activate" : "deactivate", "staff", targetId, active ? "Account activated." : "Account deactivated.");
  });
  return { ok: true as const };
}

export async function resetStaffPassword(userId: string, targetId: string, password: string) {
  const actor = await readActor(userId);
  allow(actor, "settings.manage");
  await setCredentialPassword(targetId, password);
  await withTx(async (tx) => {
    await audit(tx, actor, "reset_password", "staff", targetId, "Password reset by the owner. The password was not logged.");
  });
  return { ok: true as const };
}

export async function recoverPassword(email: string, recoveryCode: string, password: string) {
  await ensureSeed();
  const normalized = email.trim().toLowerCase();
  const sql = await getSql();
  const attempts = await sql<Row>`
    select count(*)::int as n from auth_attempts
    where email = ${normalized} and kind = 'recover' and created_at > now() - interval '15 minutes'
  `;
  if (num(attempts[0]?.n) >= 8) throw new DeskError("Too many recovery attempts. Wait 15 minutes and try again.");
  await sql`insert into auth_attempts (id, email, kind) values (${randomUUID()}, ${normalized}, 'recover')`;
  const company = await sql<Row>`select recovery_code_hash, recovery_is_default from company where id = ${COMPANY_ID}`;
  // The starter recovery code is written in the source, so it must never reset a password.
  if (company[0] && flag(company[0].recovery_is_default)) {
    throw new DeskError("Password recovery is off until the owner sets a private recovery code in Settings.");
  }
  const user = await sql<Row>`select id from "user" where lower(email) = ${normalized}`;
  const staff = user[0]
    ? await sql<Row>`select active from staff_profiles where user_id = ${text(user[0].id)} and company_id = ${COMPANY_ID}`
    : [];
  const codeOk = company[0] ? sameHash(recoveryHash(recoveryCode), text(company[0].recovery_code_hash)) : false;
  if (!codeOk || !user[0] || !flag(staff[0]?.active)) {
    throw new DeskError("The email or recovery code does not match an active desk account.");
  }
  await setCredentialPassword(text(user[0].id), password);
  await withTx(async (tx) => {
    await audit(tx, null, "recover_password", "staff", text(user[0].id), "Password replaced with the office recovery code.");
  });
  return { ok: true as const };
}

async function mapWorkspace(sql: Sql, actor: Actor): Promise<Workspace> {
  const companyRows = await sql<Row>`select * from company where id = ${COMPANY_ID}`;
  const company = companyRows[0];
  if (!company) throw new DeskError("Company settings are missing.");
  const trucks = await sql<Row>`select * from trucks where company_id = ${COMPANY_ID} order by plate`;
  const customers = await sql<Row>`select * from customers where company_id = ${COMPANY_ID} order by name`;
  const drivers = await sql<Row>`select * from drivers where company_id = ${COMPANY_ID} order by name`;
  const trips = await sql<Row>`select * from trips where company_id = ${COMPANY_ID} order by scheduled_departure_at desc`;
  const fuel = await sql<Row>`select * from fuel_logs where company_id = ${COMPANY_ID} order by logged_at desc`;
  const expenses = await sql<Row>`select * from expenses where company_id = ${COMPANY_ID} order by expense_date desc`;
  const invoices = await sql<Row>`select * from invoices where company_id = ${COMPANY_ID} order by issue_date desc`;
  const payments = await sql<Row>`select * from payments where company_id = ${COMPANY_ID} order by payment_date desc`;
  const allocations = await sql<Row>`select a.* from payment_allocations a join payments p on p.id = a.payment_id where p.company_id = ${COMPANY_ID}`;
  const adjustments = await sql<Row>`select * from adjustments where company_id = ${COMPANY_ID} order by created_at desc`;
  const maintenance = await sql<Row>`select * from maintenance_events where company_id = ${COMPANY_ID} order by scheduled_on desc`;
  const tyres = await sql<Row>`select * from tyre_records where company_id = ${COMPANY_ID} order by installed_on desc`;
  const documents = await sql<Row>`select id, entity_type, entity_id, document_type, document_number, issue_date, expiry_date, filename, notes
        from documents where company_id = ${COMPANY_ID} order by expiry_date nulls last`;
  const staff =
    actor.role === "owner"
      ? await sql<Row>`
            select s.user_id, u.name, u.email, s.role, s.phone, s.driver_id, s.active
            from staff_profiles s join "user" u on u.id = s.user_id
            where s.company_id = ${COMPANY_ID}
            order by u.name
          `
      : [];
  const auditRows =
    actor.role === "owner"
      ? await sql<Row>`
            select a.id, coalesce(u.name, 'System') as actor_name, a.action, a.entity_type, a.entity_id, a.summary, a.created_at
            from audit_logs a left join "user" u on u.id = a.actor_user_id
            where a.company_id = ${COMPANY_ID}
            order by a.created_at desc limit 80
          `
      : [];

  const workspace: Workspace = {
    profile: {
      userId: actor.userId,
      name: actor.name,
      email: actor.email,
      role: actor.role,
      phone: "",
      driverId: actor.driverId,
      companyId: COMPANY_ID,
      companyName: text(company.display_name),
    },
    company: {
      id: COMPANY_ID,
      legalName: text(company.legal_name),
      displayName: text(company.display_name),
      address: text(company.address),
      phone: text(company.phone),
      email: text(company.email),
      gstin: text(company.gstin),
      currency: text(company.currency),
      timezone: text(company.timezone),
      taxBps: num(company.tax_bps),
      tripPrefix: text(company.trip_prefix),
      invoicePrefix: text(company.invoice_prefix),
      nextTripNo: num(company.next_trip_no),
      nextInvoiceNo: num(company.next_invoice_no),
      recoveryIsDefault: flag(company.recovery_is_default),
    },
    trucks: trucks.map((row) => ({
      id: text(row.id),
      name: text(row.name),
      plate: text(row.plate),
      capacityValue: numOrNull(row.capacity_value),
      capacityUnit: text(row.capacity_unit),
      notes: text(row.notes),
      serviceHold: flag(row.service_hold),
      archivedAt: iso(row.archived_at),
    })),
    customers: customers.map((row) => ({
      id: text(row.id),
      name: text(row.name),
      phone: text(row.phone),
      billingAddress: text(row.billing_address),
      gstin: text(row.gstin),
      notes: text(row.notes),
      archivedAt: iso(row.archived_at),
    })),
    drivers: drivers.map((row) => ({
      id: text(row.id),
      name: text(row.name),
      phone: text(row.phone),
      licenseNo: text(row.license_no),
      licenseExpiry: day(row.license_expiry),
      status: text(row.status),
      notes: text(row.notes),
      archivedAt: iso(row.archived_at),
    })),
    trips: trips.map((row) => ({
      id: text(row.id),
      tripNumber: text(row.trip_number),
      customerId: text(row.customer_id),
      truckId: row.truck_id ? text(row.truck_id) : null,
      driverId: row.driver_id ? text(row.driver_id) : null,
      origin: text(row.origin),
      destination: text(row.destination),
      departure: iso(row.scheduled_departure_at) ?? "",
      arrival: iso(row.expected_arrival_at),
      actualDeparture: iso(row.actual_departure_at),
      actualArrival: iso(row.actual_arrival_at),
      goods: text(row.goods_description),
      weightValue: numOrNull(row.weight_value),
      weightUnit: text(row.weight_unit),
      freightPaise: num(row.freight_paise),
      status: text(row.status),
      notes: text(row.notes),
      sourceTripId: row.source_trip_id ? text(row.source_trip_id) : null,
    })),
    fuel: fuel.map((row) => ({
      id: text(row.id),
      truckId: text(row.truck_id),
      tripId: row.trip_id ? text(row.trip_id) : null,
      loggedAt: iso(row.logged_at) ?? "",
      odometerKm: numOrNull(row.odometer_km),
      quantityMl: numOrNull(row.quantity_ml),
      totalPaise: num(row.total_paise),
      vendorName: text(row.vendor_name),
      notes: text(row.notes),
      flagged: flag(row.flagged),
      flagReason: text(row.flag_reason),
    })),
    expenses: expenses.map((row) => ({
      id: text(row.id),
      truckId: row.truck_id ? text(row.truck_id) : null,
      tripId: row.trip_id ? text(row.trip_id) : null,
      category: text(row.category),
      expenseDate: day(row.expense_date) ?? "",
      amountPaise: num(row.amount_paise),
      vendorName: text(row.vendor_name),
      description: text(row.description),
    })),
    invoices: invoices.map((row) => ({
      id: text(row.id),
      invoiceNumber: text(row.invoice_number),
      customerId: text(row.customer_id),
      tripId: row.trip_id ? text(row.trip_id) : null,
      issueDate: day(row.issue_date) ?? "",
      dueDate: day(row.due_date) ?? "",
      subtotalPaise: num(row.subtotal_paise),
      taxPaise: num(row.tax_paise),
      totalPaise: num(row.total_paise),
      status: text(row.status),
      notes: text(row.notes),
    })),
    payments: payments.map((row) => ({
      id: text(row.id),
      direction: text(row.direction),
      customerId: row.customer_id ? text(row.customer_id) : null,
      tripId: row.trip_id ? text(row.trip_id) : null,
      paymentDate: day(row.payment_date) ?? "",
      amountPaise: num(row.amount_paise),
      method: text(row.method),
      reference: text(row.reference),
      notes: text(row.notes),
      kind: text(row.kind),
    })),
    allocations: allocations.map((row) => ({
      id: text(row.id),
      paymentId: text(row.payment_id),
      invoiceId: text(row.invoice_id),
      amountPaise: num(row.amount_paise),
    })),
    adjustments: adjustments.map((row) => ({
      id: text(row.id),
      customerId: text(row.customer_id),
      invoiceId: row.invoice_id ? text(row.invoice_id) : null,
      amountPaise: num(row.amount_paise),
      reason: text(row.reason),
      createdAt: iso(row.created_at) ?? "",
    })),
    maintenance: maintenance.map((row) => ({
      id: text(row.id),
      truckId: text(row.truck_id),
      eventType: text(row.event_type),
      scheduledOn: day(row.scheduled_on) ?? "",
      blocksUntil: day(row.blocks_until) ?? "",
      completedOn: day(row.completed_on),
      odometerKm: numOrNull(row.odometer_km),
      costPaise: num(row.cost_paise),
      vendorName: text(row.vendor_name),
      notes: text(row.notes),
    })),
    tyres: tyres.map((row) => ({
      id: text(row.id),
      truckId: text(row.truck_id),
      identifier: text(row.identifier),
      position: text(row.position),
      installedOn: day(row.installed_on) ?? "",
      installedOdometer: numOrNull(row.installed_odometer),
      removedOn: day(row.removed_on),
      removedOdometer: numOrNull(row.removed_odometer),
      costPaise: numOrNull(row.cost_paise),
      notes: text(row.notes),
    })),
    documents: documents.map((row) => ({
      id: text(row.id),
      entityType: text(row.entity_type),
      entityId: text(row.entity_id),
      documentType: text(row.document_type),
      documentNumber: text(row.document_number),
      issueDate: day(row.issue_date),
      expiryDate: day(row.expiry_date),
      filename: text(row.filename),
      notes: text(row.notes),
    })),
    staff: staff.map(
      (row): StaffRow => ({
        userId: text(row.user_id),
        name: text(row.name),
        email: text(row.email),
        role: text(row.role) as Role,
        phone: text(row.phone),
        driverId: row.driver_id ? text(row.driver_id) : null,
        active: flag(row.active),
      }),
    ),
    audit: auditRows.map(
      (row): AuditRow => ({
        id: text(row.id),
        actorName: text(row.actor_name),
        action: text(row.action),
        entityType: text(row.entity_type),
        entityId: text(row.entity_id),
        summary: text(row.summary),
        createdAt: iso(row.created_at) ?? "",
      }),
    ),
  };

  if (actor.role !== "driver") return workspace;
  const ownTrips = workspace.trips.filter((trip) => trip.driverId === actor.driverId);
  const tripIds = new Set(ownTrips.map((trip) => trip.id));
  const truckIds = new Set(ownTrips.map((trip) => trip.truckId).filter(Boolean));
  const customerIds = new Set(ownTrips.map((trip) => trip.customerId));
  return {
    ...workspace,
    trucks: workspace.trucks.filter((truck) => truckIds.has(truck.id)),
    customers: workspace.customers.filter((customer) => customerIds.has(customer.id)),
    drivers: workspace.drivers.filter((driver) => driver.id === actor.driverId),
    trips: ownTrips,
    fuel: workspace.fuel.filter((row) => row.tripId && tripIds.has(row.tripId)),
    expenses: workspace.expenses.filter((row) => row.tripId && tripIds.has(row.tripId)),
    invoices: [],
    payments: workspace.payments.filter((row) => row.tripId && tripIds.has(row.tripId)),
    allocations: [],
    adjustments: [],
    maintenance: [],
    tyres: [],
    documents: [],
    staff: [],
    audit: [],
  };
}

export async function describeDatabase(userId: string): Promise<DatabasePlace> {
  await ensureSeed();
  await readActor(userId);
  const sql = await getSql();
  const rows = await sql<Row>`
    select
      (select count(*) from trucks where company_id = ${COMPANY_ID}) as trucks,
      (select count(*) from customers where company_id = ${COMPANY_ID}) as customers,
      (select count(*) from drivers where company_id = ${COMPANY_ID}) as drivers,
      (select count(*) from trips where company_id = ${COMPANY_ID}) as trips,
      (select count(*) from fuel_logs where company_id = ${COMPANY_ID}) as fuel,
      (select count(*) from expenses where company_id = ${COMPANY_ID}) as expenses,
      (select count(*) from invoices where company_id = ${COMPANY_ID}) as invoices,
      (select count(*) from payments where company_id = ${COMPANY_ID}) as payments,
      (select count(*) from adjustments where company_id = ${COMPANY_ID}) as adjustments,
      (select count(*) from maintenance_events where company_id = ${COMPANY_ID}) as maintenance,
      (select count(*) from tyre_records where company_id = ${COMPANY_ID}) as tyres,
      (select count(*) from documents where company_id = ${COMPANY_ID}) as documents,
      (select count(*) from staff_profiles where company_id = ${COMPANY_ID}) as staff,
      (select count(*) from audit_logs where company_id = ${COMPANY_ID}) as audit
  `;
  const row = rows[0] ?? {};
  const tables: DatabasePlace["tables"] = [
    ["trucks", "Trucks"],
    ["customers", "Customers"],
    ["drivers", "Drivers"],
    ["trips", "Trips"],
    ["fuel", "Fuel logs"],
    ["expenses", "Expenses"],
    ["invoices", "Invoices"],
    ["payments", "Payments"],
    ["adjustments", "Adjustments"],
    ["maintenance", "Maintenance"],
    ["tyres", "Tyres"],
    ["documents", "Documents"],
    ["staff", "Staff"],
    ["audit", "Activity log"],
  ].map(([key, label]) => ({ key, label, rows: num(row[key]) }));
  if (dbSource === "neon") {
    return {
      engine: "PostgreSQL",
      place: "Neon",
      title: "Neon Postgres",
      detail: "Published Sonu Transport keeps these tables in Neon, a hosted PostgreSQL database. Records stay there across devices.",
      tables,
    };
  }
  return {
    engine: "PostgreSQL",
    place: "Preview",
    title: "Preview Postgres",
    detail: "This preview stores the same PostgreSQL tables here. Publishing moves the live site onto Neon Postgres, which is the lasting database.",
    tables,
  };
}

export async function getWorkspace(userId: string): Promise<Workspace> {
  await ensureSeed();
  const actor = await readActor(userId);
  const sql = await getSql();
  return mapWorkspace(sql, actor);
}

export async function exportBackup(userId: string) {
  const actor = await readActor(userId);
  allow(actor, "backup.manage");
  const sql = await getSql();
  const workspace = await mapWorkspace(sql, { ...actor, role: "owner" });
  const documents = await sql<Row>`select * from documents where company_id = ${COMPANY_ID}`;
  return {
    version: 1 as const,
    exportedAt: new Date().toISOString(),
    company: workspace.company,
    trucks: workspace.trucks,
    customers: workspace.customers,
    drivers: workspace.drivers,
    trips: workspace.trips,
    fuel: workspace.fuel,
    expenses: workspace.expenses,
    invoices: workspace.invoices,
    payments: workspace.payments,
    allocations: workspace.allocations,
    adjustments: workspace.adjustments,
    maintenance: workspace.maintenance,
    tyres: workspace.tyres,
    documents: documents.map((row) => ({
      ...workspace.documents.find((doc) => doc.id === text(row.id)),
      id: text(row.id),
      mimeType: text(row.mime_type),
      contentBase64: row.content_base64 ? text(row.content_base64) : null,
    })),
    staff: workspace.staff.map((row) => ({
      email: row.email,
      role: row.role,
      phone: row.phone,
      driverId: row.driverId,
      active: row.active,
    })),
  };
}

export async function restoreBackup(userId: string, backup: Record<string, unknown>) {
  const actor = await readActor(userId);
  allow(actor, "backup.manage");
  if (backup.version !== 1) throw new DeskError("This file is not a Sonu Transport backup.");
  const lists = ["trucks", "customers", "drivers", "trips", "invoices", "payments"] as const;
  for (const key of lists) {
    if (!Array.isArray(backup[key])) throw new DeskError("This file is not a Sonu Transport backup.");
  }
  await withTx(async (tx) => {
    await tx.query(`delete from payment_allocations where payment_id in (select id from payments where company_id = $1)`, [COMPANY_ID]);
    await tx.query(`delete from adjustments where company_id = $1`, [COMPANY_ID]);
    await tx.query(`delete from payments where company_id = $1`, [COMPANY_ID]);
    await tx.query(`delete from invoices where company_id = $1`, [COMPANY_ID]);
    await tx.query(`delete from fuel_logs where company_id = $1`, [COMPANY_ID]);
    await tx.query(`delete from expenses where company_id = $1`, [COMPANY_ID]);
    await tx.query(`delete from maintenance_events where company_id = $1`, [COMPANY_ID]);
    await tx.query(`delete from tyre_records where company_id = $1`, [COMPANY_ID]);
    await tx.query(`delete from documents where company_id = $1`, [COMPANY_ID]);
    await tx.query(`update trips set source_trip_id = null where company_id = $1`, [COMPANY_ID]);
    await tx.query(`delete from trips where company_id = $1`, [COMPANY_ID]);
    await tx.query(`update staff_profiles set driver_id = null where company_id = $1`, [COMPANY_ID]);
    await tx.query(`delete from drivers where company_id = $1`, [COMPANY_ID]);
    await tx.query(`delete from customers where company_id = $1`, [COMPANY_ID]);
    await tx.query(`delete from trucks where company_id = $1`, [COMPANY_ID]);

    for (const row of backup.trucks as Record<string, unknown>[]) {
      const plate = normPlate(text(row.plate));
      await tx.query(
        `insert into trucks (id, company_id, name, plate, plate_norm, capacity_value, capacity_unit, notes, service_hold, archived_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [text(row.id), COMPANY_ID, text(row.name), plate, plate, numOrNull(row.capacityValue), text(row.capacityUnit || "tonnes"), text(row.notes), flag(row.serviceHold), row.archivedAt ?? null],
      );
    }
    for (const row of backup.customers as Record<string, unknown>[]) {
      await tx.query(
        `insert into customers (id, company_id, name, phone, billing_address, gstin, notes, archived_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [text(row.id), COMPANY_ID, text(row.name), text(row.phone), text(row.billingAddress), text(row.gstin), text(row.notes), row.archivedAt ?? null],
      );
    }
    for (const row of backup.drivers as Record<string, unknown>[]) {
      await tx.query(
        `insert into drivers (id, company_id, name, phone, license_no, license_expiry, status, notes, archived_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [text(row.id), COMPANY_ID, text(row.name), text(row.phone), text(row.licenseNo), row.licenseExpiry ?? null, text(row.status || "active"), text(row.notes), row.archivedAt ?? null],
      );
    }
    for (const row of backup.trips as Record<string, unknown>[]) {
      await tx.query(
        `insert into trips (
          id, company_id, trip_number, customer_id, truck_id, driver_id, origin, destination,
          scheduled_departure_at, expected_arrival_at, actual_departure_at, actual_arrival_at,
          goods_description, weight_value, weight_unit, freight_paise, status, notes, source_trip_id
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
        [
          text(row.id), COMPANY_ID, text(row.tripNumber), text(row.customerId), row.truckId ?? null, row.driverId ?? null,
          text(row.origin), text(row.destination), text(row.departure), row.arrival ?? null, row.actualDeparture ?? null,
          row.actualArrival ?? null, text(row.goods), numOrNull(row.weightValue), text(row.weightUnit || "tonnes"),
          num(row.freightPaise), text(row.status), text(row.notes), null,
        ],
      );
    }
    for (const row of backup.trips as Record<string, unknown>[]) {
      if (row.sourceTripId) {
        await tx.query(`update trips set source_trip_id = $2 where id = $1`, [text(row.id), text(row.sourceTripId)]);
      }
    }
    for (const row of (backup.fuel as Record<string, unknown>[] | undefined) ?? []) {
      await tx.query(
        `insert into fuel_logs (id, company_id, truck_id, trip_id, logged_at, odometer_km, quantity_ml, total_paise, vendor_name, notes, flagged, flag_reason)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [text(row.id), COMPANY_ID, text(row.truckId), row.tripId ?? null, text(row.loggedAt), numOrNull(row.odometerKm), numOrNull(row.quantityMl), num(row.totalPaise), text(row.vendorName), text(row.notes), flag(row.flagged), text(row.flagReason)],
      );
    }
    for (const row of (backup.expenses as Record<string, unknown>[] | undefined) ?? []) {
      await tx.query(
        `insert into expenses (id, company_id, truck_id, trip_id, category, expense_date, amount_paise, vendor_name, description)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [text(row.id), COMPANY_ID, row.truckId ?? null, row.tripId ?? null, text(row.category), text(row.expenseDate), num(row.amountPaise), text(row.vendorName), text(row.description)],
      );
    }
    for (const row of backup.invoices as Record<string, unknown>[]) {
      await tx.query(
        `insert into invoices (id, company_id, invoice_number, customer_id, trip_id, issue_date, due_date, subtotal_paise, tax_paise, total_paise, status, notes, created_by)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [text(row.id), COMPANY_ID, text(row.invoiceNumber), text(row.customerId), row.tripId ?? null, text(row.issueDate), text(row.dueDate), num(row.subtotalPaise), num(row.taxPaise), num(row.totalPaise), text(row.status), text(row.notes), actor.userId],
      );
    }
    for (const row of backup.payments as Record<string, unknown>[]) {
      await tx.query(
        `insert into payments (id, company_id, direction, customer_id, trip_id, payment_date, amount_paise, method, reference, notes, kind, created_by)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [text(row.id), COMPANY_ID, text(row.direction || "in"), row.customerId ?? null, row.tripId ?? null, text(row.paymentDate), num(row.amountPaise), text(row.method || "other"), text(row.reference), text(row.notes), text(row.kind || "receipt"), actor.userId],
      );
    }
    for (const row of (backup.allocations as Record<string, unknown>[] | undefined) ?? []) {
      await tx.query(
        `insert into payment_allocations (id, payment_id, invoice_id, amount_paise) values ($1,$2,$3,$4)`,
        [text(row.id) || randomUUID(), text(row.paymentId), text(row.invoiceId), num(row.amountPaise)],
      );
    }
    for (const row of (backup.adjustments as Record<string, unknown>[] | undefined) ?? []) {
      await tx.query(
        `insert into adjustments (id, company_id, customer_id, invoice_id, amount_paise, reason, created_by) values ($1,$2,$3,$4,$5,$6,$7)`,
        [text(row.id) || randomUUID(), COMPANY_ID, text(row.customerId), row.invoiceId ?? null, num(row.amountPaise), text(row.reason || "Restored adjustment"), actor.userId],
      );
    }
    for (const row of (backup.maintenance as Record<string, unknown>[] | undefined) ?? []) {
      await tx.query(
        `insert into maintenance_events (id, company_id, truck_id, event_type, scheduled_on, blocks_until, completed_on, odometer_km, cost_paise, vendor_name, notes)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [text(row.id), COMPANY_ID, text(row.truckId), text(row.eventType), text(row.scheduledOn), text(row.blocksUntil), row.completedOn ?? null, numOrNull(row.odometerKm), num(row.costPaise), text(row.vendorName), text(row.notes)],
      );
    }
    for (const row of (backup.tyres as Record<string, unknown>[] | undefined) ?? []) {
      await tx.query(
        `insert into tyre_records (id, company_id, truck_id, identifier, position, installed_on, installed_odometer, removed_on, removed_odometer, cost_paise, notes)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [text(row.id), COMPANY_ID, text(row.truckId), text(row.identifier), text(row.position), text(row.installedOn), numOrNull(row.installedOdometer), row.removedOn ?? null, numOrNull(row.removedOdometer), numOrNull(row.costPaise), text(row.notes)],
      );
    }
    for (const row of (backup.documents as Record<string, unknown>[] | undefined) ?? []) {
      await tx.query(
        `insert into documents (id, company_id, entity_type, entity_id, document_type, document_number, issue_date, expiry_date, filename, mime_type, content_base64, notes, uploaded_by)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [text(row.id), COMPANY_ID, text(row.entityType), text(row.entityId), text(row.documentType), text(row.documentNumber), row.issueDate ?? null, row.expiryDate ?? null, text(row.filename), text(row.mimeType), row.contentBase64 ?? null, text(row.notes), actor.userId],
      );
    }
    const company = (backup.company ?? {}) as Record<string, unknown>;
    if (company.legalName) {
      await tx.query(
        `update company set legal_name=$2, display_name=$3, address=$4, phone=$5, email=$6, gstin=$7, tax_bps=$8,
           trip_prefix=$9, invoice_prefix=$10, next_trip_no=$11, next_invoice_no=$12, updated_at=now()
         where id=$1`,
        [
          COMPANY_ID,
          text(company.legalName),
          text(company.displayName || company.legalName),
          text(company.address),
          text(company.phone),
          text(company.email),
          text(company.gstin),
          num(company.taxBps),
          text(company.tripPrefix || "TR"),
          text(company.invoicePrefix || "INV"),
          num(company.nextTripNo) || 1001,
          num(company.nextInvoiceNo) || 1001,
        ],
      );
    }
    await audit(tx, actor, "restore", "company", COMPANY_ID, "Backup restored. Passwords were not overwritten.");
  });
  return { ok: true as const };
}

export async function availability(userId: string, day: string) {
  const workspace = await getWorkspace(userId);
  return { day, trucks: workspace.trucks, trips: workspace.trips, maintenance: workspace.maintenance };
}
