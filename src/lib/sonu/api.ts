import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  adjustmentWrite,
  archiveWrite,
  companyWrite,
  customerWrite,
  documentWrite,
  driverWrite,
  expenseWrite,
  fuelWrite,
  idWrite,
  invoiceWrite,
  maintenanceWrite,
  parseInput,
  passwordResetWrite,
  paymentWrite,
  recoverWrite,
  recoveryRotate,
  restoreWrite,
  staffActiveWrite,
  staffWrite,
  statusWrite,
  tripWrite,
  truckWrite,
  tyreWrite,
} from "./schemas";

async function domain() {
  return import("./domain.server");
}

export const ensureOffice = createServerFn({ method: "POST" }).handler(async () => {
  const api = await domain();
  await api.ensureSeed();
  return { ready: true };
});

export const recoverPassword = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseInput(recoverWrite, input))
  .handler(async ({ data }) => {
    const api = await domain();
    return api.recoverPassword(data.email, data.recoveryCode, data.password);
  });

export const fetchProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const api = await domain();
    return api.getProfile(context.userId);
  });

export const fetchWorkspace = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const api = await domain();
    return api.getWorkspace(context.userId);
  });

export const fetchDatabase = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const api = await domain();
    return api.describeDatabase(context.userId);
  });

export const saveTruck = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(truckWrite, input))
  .handler(async ({ context, data }) => (await domain()).saveTruck(context.userId, data));

export const archiveTruck = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(archiveWrite, input))
  .handler(async ({ context, data }) => (await domain()).archiveTruck(context.userId, data.id, data.archived, data.acknowledge));

export const saveCustomer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(customerWrite, input))
  .handler(async ({ context, data }) => (await domain()).saveCustomer(context.userId, data));

export const saveDriver = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(driverWrite, input))
  .handler(async ({ context, data }) => (await domain()).saveDriver(context.userId, data));

export const saveTrip = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(tripWrite, input))
  .handler(async ({ context, data }) => (await domain()).saveTrip(context.userId, data));

export const setTripStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(statusWrite, input))
  .handler(async ({ context, data }) => (await domain()).setTripStatus(context.userId, data.id, data.status, data.overrideReason));

export const saveFuel = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(fuelWrite, input))
  .handler(async ({ context, data }) => (await domain()).saveFuel(context.userId, data));

export const saveExpense = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(expenseWrite, input))
  .handler(async ({ context, data }) => (await domain()).saveExpense(context.userId, data));

export const createInvoice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(invoiceWrite, input))
  .handler(async ({ context, data }) => (await domain()).createInvoice(context.userId, data));

export const voidInvoice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(idWrite, input))
  .handler(async ({ context, data }) => (await domain()).voidInvoice(context.userId, data.id));

export const recordPayment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(paymentWrite, input))
  .handler(async ({ context, data }) => (await domain()).recordPayment(context.userId, data));

export const saveAdjustment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(adjustmentWrite, input))
  .handler(async ({ context, data }) => (await domain()).saveAdjustment(context.userId, data));

export const saveMaintenance = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(maintenanceWrite, input))
  .handler(async ({ context, data }) => (await domain()).saveMaintenance(context.userId, data));

export const completeMaintenance = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(idWrite, input))
  .handler(async ({ context, data }) => (await domain()).completeMaintenance(context.userId, data.id));

export const saveTyre = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(tyreWrite, input))
  .handler(async ({ context, data }) => (await domain()).saveTyre(context.userId, data));

export const removeTyre = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(idWrite, input))
  .handler(async ({ context, data }) => (await domain()).removeTyre(context.userId, data.id));

export const saveDocument = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(documentWrite, input))
  .handler(async ({ context, data }) => (await domain()).saveDocument(context.userId, data));

export const fetchDocumentFile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(idWrite, input))
  .handler(async ({ context, data }) => (await domain()).getDocumentFile(context.userId, data.id));

export const saveCompany = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(companyWrite, input))
  .handler(async ({ context, data }) => (await domain()).saveCompany(context.userId, data));

export const rotateRecovery = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(recoveryRotate, input))
  .handler(async ({ context, data }) => (await domain()).rotateRecovery(context.userId, data.code));

export const createStaff = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(staffWrite, input))
  .handler(async ({ context, data }) => (await domain()).createStaff(context.userId, data));

export const setStaffActive = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(staffActiveWrite, input))
  .handler(async ({ context, data }) => (await domain()).setStaffActive(context.userId, data.userId, data.active));

export const resetStaffPassword = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(passwordResetWrite, input))
  .handler(async ({ context, data }) => (await domain()).resetStaffPassword(context.userId, data.userId, data.password));

export const exportBackup = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => (await domain()).exportBackup(context.userId));

export const restoreBackup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parseInput(restoreWrite, input))
  .handler(async ({ context, data }) => (await domain()).restoreBackup(context.userId, data.backup as Record<string, unknown>));
