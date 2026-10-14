import { z } from "zod";

const required = (label: string, max = 160) =>
  z.string().trim().min(1, `${label} is required.`).max(max);

const optionalText = (max = 2000) => z.string().trim().max(max).optional().default("");

export function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Check the form and try again.");
  }
  return result.data;
}

export const truckWrite = z.object({
  id: z.string().min(1).optional(),
  name: required("Truck name", 120),
  plate: required("Registration number", 32),
  capacityValue: z.number().finite().nonnegative().nullish(),
  capacityUnit: optionalText(20),
  notes: optionalText(),
  serviceHold: z.boolean().optional().default(false),
});

export const archiveWrite = z.object({
  id: z.string().min(1),
  archived: z.boolean(),
  acknowledge: z.boolean().optional().default(false),
});

export const customerWrite = z.object({
  id: z.string().min(1).optional(),
  name: required("Customer name"),
  phone: optionalText(20),
  billingAddress: optionalText(300),
  gstin: optionalText(20),
  notes: optionalText(),
  archived: z.boolean().optional().default(false),
});

export const driverWrite = z.object({
  id: z.string().min(1).optional(),
  name: required("Driver name"),
  phone: optionalText(20),
  licenseNo: optionalText(40),
  licenseExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish().or(z.literal("")),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  notes: optionalText(),
  archived: z.boolean().optional().default(false),
});

export const tripWrite = z
  .object({
    id: z.string().min(1).optional(),
    // A trip is booked for a customer that is either an existing record (customerId)
    // or a name typed in by the office (customerName). Typed names are matched to the
    // customer book (case-insensitive) or added to it by the server.
    customerId: z.string().nullish(),
    customerName: z.string().trim().max(160, "Customer name is too long.").optional().default(""),
    customerPhone: z.string().trim().max(20, "Customer phone is too long.").optional().default(""),
    truckId: z.string().nullish(),
    driverId: z.string().nullish(),
    driverName: z.string().trim().max(160, "Driver name is too long.").optional().default(""),
    driverPhone: z.string().trim().max(20, "Driver phone is too long.").optional().default(""),
    origin: required("Pickup", 160),
    destination: required("Destination", 160),
    departure: required("Departure", 40),
    arrival: z.string().trim().max(40).optional().default(""),
    goods: optionalText(300),
    weightValue: z.number().finite().nonnegative().nullish(),
    weightUnit: optionalText(20),
    freightRupees: z.number().finite().nonnegative("Freight cannot be negative."),
    advanceRupees: z.number().finite().nonnegative().optional().default(0),
    notes: optionalText(),
    intent: z.enum(["draft", "book"]),
    overrideReason: optionalText(300),
    sourceTripId: z.string().nullish(),
  })
  .refine((value) => Boolean(value.customerId?.trim()) || value.customerName.length > 0, {
    message: "Enter the customer name.",
    path: ["customerName"],
  });

export const statusWrite = z.object({
  id: z.string().min(1),
  status: z.enum(["draft", "booked", "in_progress", "delivered", "closed", "cancelled"]),
  overrideReason: optionalText(300),
});

export const fuelWrite = z.object({
  truckId: z.string().min(1, "Choose a truck."),
  tripId: z.string().nullish(),
  loggedAt: required("Fuel date", 40),
  odometerKm: z.number().int().nonnegative().nullish(),
  quantityLitres: z.number().finite().nonnegative().nullish(),
  amountRupees: z.number().finite().nonnegative(),
  vendorName: optionalText(120),
  notes: optionalText(),
});

export const expenseWrite = z.object({
  truckId: z.string().nullish(),
  tripId: z.string().nullish(),
  category: z.enum(["toll", "repair", "tyres", "parts", "loading", "driver_allowance", "other"]),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose an expense date."),
  amountRupees: z.number().finite().nonnegative(),
  vendorName: optionalText(120),
  description: optionalText(),
});

export const invoiceWrite = z.object({
  customerId: z.string().min(1, "Choose a customer."),
  tripId: z.string().nullish(),
  subtotalRupees: z.number().finite().nonnegative().nullish(),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: optionalText(),
});

export const paymentWrite = z.object({
  customerId: z.string().min(1, "Choose a customer."),
  tripId: z.string().nullish(),
  amountRupees: z.number().finite().positive("Enter a payment amount."),
  method: z.enum(["cash", "upi", "bank", "cheque", "other"]),
  reference: optionalText(80),
  notes: optionalText(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a payment date."),
  allocations: z
    .array(
      z.object({
        invoiceId: z.string().min(1),
        amountRupees: z.number().finite().positive(),
      }),
    )
    .optional()
    .default([]),
});

export const adjustmentWrite = z.object({
  customerId: z.string().min(1),
  invoiceId: z.string().nullish(),
  amountRupees: z.number().finite().refine((value) => value !== 0, "Adjustment cannot be zero."),
  reason: required("Reason", 300),
});

export const maintenanceWrite = z.object({
  truckId: z.string().min(1, "Choose a truck."),
  eventType: required("Work type", 80),
  scheduledOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  blocksUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  odometerKm: z.number().int().nonnegative().nullish(),
  costRupees: z.number().finite().nonnegative().optional().default(0),
  vendorName: optionalText(120),
  notes: optionalText(),
});

export const idWrite = z.object({ id: z.string().min(1) });

export const tyreWrite = z.object({
  truckId: z.string().min(1),
  identifier: required("Tyre identifier", 80),
  position: optionalText(40),
  installedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  installedOdometer: z.number().int().nonnegative().nullish(),
  costRupees: z.number().finite().nonnegative().nullish(),
  notes: optionalText(),
});

export const documentWrite = z.object({
  entityType: z.enum(["truck", "driver", "trip", "customer", "company"]),
  entityId: z.string().min(1),
  documentType: required("Document type", 80),
  documentNumber: optionalText(80),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  notes: optionalText(),
  filename: optionalText(180),
  mimeType: optionalText(80),
  contentBase64: z.string().max(280_000, "Attachment is too large. Keep it under 200 KB.").optional(),
});

export const companyWrite = z.object({
  legalName: required("Legal name"),
  displayName: required("Display name"),
  address: optionalText(300),
  phone: optionalText(30),
  email: optionalText(120),
  gstin: optionalText(20),
  taxPercent: z.number().finite().min(0).max(28),
});

export const recoveryRotate = z.object({
  code: z.string().trim().min(8, "Recovery code must be at least 8 characters.").max(64),
});

export const staffWrite = z.object({
  name: required("Name"),
  email: z.string().trim().email("Enter a valid email.").max(160),
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
  role: z.enum(["owner", "dispatcher", "accounts", "driver"]),
  phone: optionalText(20),
  driverId: z.string().nullish(),
});

export const staffActiveWrite = z.object({
  userId: z.string().min(1),
  active: z.boolean(),
});

export const passwordResetWrite = z.object({
  userId: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
});

export const recoverWrite = z.object({
  email: z.string().trim().email("Enter the desk email.").max(160),
  recoveryCode: z.string().trim().min(4).max(64),
  password: z.string().min(8, "New password must be at least 8 characters.").max(72),
});

export const reportQuery = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const restoreWrite = z.object({
  confirm: z.literal("RESTORE"),
  backup: z.object({ version: z.literal(1) }).passthrough(),
});

export type TruckInput = z.infer<typeof truckWrite>;
export type CustomerInput = z.infer<typeof customerWrite>;
export type DriverInput = z.infer<typeof driverWrite>;
export type TripInput = z.infer<typeof tripWrite>;
export type FuelInput = z.infer<typeof fuelWrite>;
export type ExpenseInput = z.infer<typeof expenseWrite>;
export type InvoiceInput = z.infer<typeof invoiceWrite>;
export type PaymentInput = z.infer<typeof paymentWrite>;
export type AdjustmentInput = z.infer<typeof adjustmentWrite>;
export type MaintenanceInput = z.infer<typeof maintenanceWrite>;
export type TyreInput = z.infer<typeof tyreWrite>;
export type DocumentInput = z.infer<typeof documentWrite>;
export type CompanyInput = z.infer<typeof companyWrite>;
export type StaffInput = z.infer<typeof staffWrite>;
