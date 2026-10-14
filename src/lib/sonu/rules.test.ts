import assert from "node:assert/strict";
import test from "node:test";
import {
  customerOutstandingPaise,
  deriveTruckStatus,
  formatInr,
  invoiceLifecycle,
  invoiceTaxPaise,
  overlaps,
  rupeesToPaise,
  tripContributionPaise,
  tripWindow,
} from "./finance.ts";
import { istInputToIso } from "./time.ts";

test("rupees convert to paise without binary drift", () => {
  assert.equal(rupeesToPaise(18500), 1_850_000);
  assert.equal(rupeesToPaise(10.5), 1050);
  assert.equal(formatInr(1_850_000), new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(18500));
});

test("touching trip windows do not conflict", () => {
  const first = tripWindow(Date.parse("2026-10-12T03:30:00.000Z"), Date.parse("2026-10-12T12:00:00.000Z"));
  assert.equal(overlaps(first.start, first.end, first.end, first.end + 1000), false);
  assert.equal(overlaps(first.start, first.end, first.end - 1, first.end + 1000), true);
});

test("missing arrival reserves 24 hours", () => {
  const window = tripWindow(1_000, null);
  assert.equal(window.end - window.start, 24 * 60 * 60 * 1000);
});

test("customer outstanding follows invoices, adjustments, and payments", () => {
  const sharma = customerOutstandingPaise({
    invoices: [{ totalPaise: 1_850_000, status: "partial" }],
    adjustmentsPaise: 0,
    incomingPaymentsPaise: 500_000,
  });
  assert.equal(sharma, 1_350_000);
  const voided = customerOutstandingPaise({
    invoices: [{ totalPaise: 3_200_000, status: "void" }],
    adjustmentsPaise: -10_000,
    incomingPaymentsPaise: 0,
  });
  assert.equal(voided, -10_000);
});

test("trip contribution ignores drafts and does not add fuel twice", () => {
  assert.equal(tripContributionPaise(3_200_000, "delivered", 900_000, 0), 2_300_000);
  assert.equal(tripContributionPaise(1_850_000, "draft", 0, 120_000), null);
  assert.equal(tripContributionPaise(1_850_000, "cancelled", 0, 0), null);
});

test("invoice tax and lifecycle", () => {
  assert.equal(invoiceTaxPaise(1_000_000, 1800), 180_000);
  assert.equal(invoiceLifecycle(1000, 400, false), "partial");
  assert.equal(invoiceLifecycle(1000, 1000, false), "paid");
  assert.equal(invoiceLifecycle(1000, 1000, true), "void");
});

test("truck status prefers a live trip, then workshop, then a booking", () => {
  const now = 1_000;
  assert.equal(
    deriveTruckStatus({
      archived: false,
      hold: true,
      now,
      trips: [{ status: "in_progress", start: 0, end: 5000 }],
      maintenance: [{ start: 0, end: 5000 }],
    }),
    "on_trip",
  );
  assert.equal(
    deriveTruckStatus({
      archived: false,
      hold: false,
      now,
      trips: [{ status: "booked", start: 0, end: 5000 }],
      maintenance: [{ start: 0, end: 5000 }],
    }),
    "maintenance",
  );
  assert.equal(
    deriveTruckStatus({
      archived: true,
      hold: false,
      now,
      trips: [],
      maintenance: [],
    }),
    "archived",
  );
});

test("office datetimes are India time", () => {
  assert.equal(istInputToIso("2026-10-11T18:30"), "2026-10-11T13:00:00.000Z");
});
