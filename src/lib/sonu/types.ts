export type Role = "owner" | "dispatcher" | "accounts" | "driver";

export type Profile = {
  userId: string;
  name: string;
  email: string;
  role: Role;
  phone: string;
  driverId: string | null;
  companyId: string;
  companyName: string;
};

export type Company = {
  id: string;
  legalName: string;
  displayName: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  currency: string;
  timezone: string;
  taxBps: number;
  tripPrefix: string;
  invoicePrefix: string;
  nextTripNo: number;
  nextInvoiceNo: number;
  recoveryIsDefault: boolean;
};

export type Truck = {
  id: string;
  name: string;
  plate: string;
  capacityValue: number | null;
  capacityUnit: string;
  notes: string;
  serviceHold: boolean;
  archivedAt: string | null;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  billingAddress: string;
  gstin: string;
  notes: string;
  archivedAt: string | null;
};

export type Driver = {
  id: string;
  name: string;
  phone: string;
  licenseNo: string;
  licenseExpiry: string | null;
  status: string;
  notes: string;
  archivedAt: string | null;
};

export type Trip = {
  id: string;
  tripNumber: string;
  customerId: string;
  truckId: string | null;
  driverId: string | null;
  origin: string;
  destination: string;
  departure: string;
  arrival: string | null;
  actualDeparture: string | null;
  actualArrival: string | null;
  goods: string;
  weightValue: number | null;
  weightUnit: string;
  freightPaise: number;
  status: string;
  notes: string;
  sourceTripId: string | null;
};

export type FuelLog = {
  id: string;
  truckId: string;
  tripId: string | null;
  loggedAt: string;
  odometerKm: number | null;
  quantityMl: number | null;
  totalPaise: number;
  vendorName: string;
  notes: string;
  flagged: boolean;
  flagReason: string;
};

export type Expense = {
  id: string;
  truckId: string | null;
  tripId: string | null;
  category: string;
  expenseDate: string;
  amountPaise: number;
  vendorName: string;
  description: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  tripId: string | null;
  issueDate: string;
  dueDate: string;
  subtotalPaise: number;
  taxPaise: number;
  totalPaise: number;
  status: string;
  notes: string;
};

export type Payment = {
  id: string;
  direction: string;
  customerId: string | null;
  tripId: string | null;
  paymentDate: string;
  amountPaise: number;
  method: string;
  reference: string;
  notes: string;
  kind: string;
};

export type Allocation = {
  id: string;
  paymentId: string;
  invoiceId: string;
  amountPaise: number;
};

export type Adjustment = {
  id: string;
  customerId: string;
  invoiceId: string | null;
  amountPaise: number;
  reason: string;
  createdAt: string;
};

export type Maintenance = {
  id: string;
  truckId: string;
  eventType: string;
  scheduledOn: string;
  blocksUntil: string;
  completedOn: string | null;
  odometerKm: number | null;
  costPaise: number;
  vendorName: string;
  notes: string;
};

export type Tyre = {
  id: string;
  truckId: string;
  identifier: string;
  position: string;
  installedOn: string;
  installedOdometer: number | null;
  removedOn: string | null;
  removedOdometer: number | null;
  costPaise: number | null;
  notes: string;
};

export type DocMeta = {
  id: string;
  entityType: string;
  entityId: string;
  documentType: string;
  documentNumber: string;
  issueDate: string | null;
  expiryDate: string | null;
  filename: string;
  notes: string;
};

export type StaffRow = {
  userId: string;
  name: string;
  email: string;
  role: Role;
  phone: string;
  driverId: string | null;
  active: boolean;
};

export type AuditRow = {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  createdAt: string;
};

export type Workspace = {
  profile: Profile;
  company: Company;
  trucks: Truck[];
  customers: Customer[];
  drivers: Driver[];
  trips: Trip[];
  fuel: FuelLog[];
  expenses: Expense[];
  invoices: Invoice[];
  payments: Payment[];
  allocations: Allocation[];
  adjustments: Adjustment[];
  maintenance: Maintenance[];
  tyres: Tyre[];
  documents: DocMeta[];
  staff: StaffRow[];
  audit: AuditRow[];
};

export type DatabaseTable = {
  key: string;
  label: string;
  rows: number;
};

export type DatabasePlace = {
  engine: "PostgreSQL";
  /** Neon after publish. Preview is the same schema, kept with this preview. */
  place: "Neon" | "Preview";
  title: string;
  detail: string;
  tables: DatabaseTable[];
};

export type OfficeAccount = {
  role: string;
  name: string;
  email: string;
  password: string;
};
