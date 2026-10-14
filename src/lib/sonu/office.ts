import type { OfficeAccount } from "./types";

/** Starter desk sign-in. The typed address "Sonutransport@.com" is not a valid email. */
export const OWNER_EMAIL = "sonutransport@sonu.com";
export const OWNER_PASSWORD = "admi1234";
export const STARTER_RECOVERY_CODE = "SONU-4821";

export const OFFICE_ACCOUNTS: OfficeAccount[] = [
  { role: "Owner", name: "Sonu Owner", email: OWNER_EMAIL, password: OWNER_PASSWORD },
  { role: "Dispatcher", name: "Meera Deshmukh", email: "meera.dispatcher@sonu.com", password: "desk1234" },
  { role: "Accounts", name: "Anil Kulkarni", email: "anil.accounts@sonu.com", password: "desk1234" },
  { role: "Driver", name: "Ramesh Patil", email: "ramesh.driver@sonu.com", password: "desk1234" },
];
