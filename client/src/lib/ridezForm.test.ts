import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePacificDateTime } from "@shared/missedConnections";
import { driveMinutes, driverEtaLabel, fuelEstimate, rideDirectionOf, ridezLeaveBy, ridezOfferBody, ridezPlanningBase } from "./ridezForm";

test("ridez form: the event is preselected in the planning path", () => {
  assert.equal(ridezPlanningBase(42, "2026-11-21T21:00:00"), "/api/events/42/occurrences/2026-11-21/planning");
});

test("ridez form: arriving vs departing map to the carpool API kinds", () => {
  const arrive = ridezOfferBody({ direction: "arriving", area: " Alberta ", meeting: "NE 15th", seats: "3", leaveTime: "" }, "2026-11-21", "2026-11-21T21:00:00");
  assert.deepEqual(arrive, { area: "Alberta", seats: 3, kind: "carpool", meeting: "NE 15th", leaveBy: null, oneWay: true });
  const home = ridezOfferBody({ direction: "departing", area: "Sellwood", meeting: "Front door", seats: "4", leaveTime: "01:30" }, "2026-11-21", "2026-11-21T21:00:00");
  assert.equal(home.kind, "home");
  assert.equal(home.oneWay, false);
  assert.equal(home.leaveBy, parsePacificDateTime("2026-11-22T01:30"), "after midnight rolls to the next day");
  assert.throws(() => ridezOfferBody({ direction: "departing", area: "x", meeting: "y", seats: "2", leaveTime: "" }, "2026-11-21"), /leave-by/);
  assert.equal(ridezLeaveBy("2026-11-21", "20:15", "arriving", "2026-11-21T21:00:00"), parsePacificDateTime("2026-11-21T20:15"));
  assert.equal(ridezLeaveBy("2026-11-21", "bad", "arriving"), null);
});

test("ridez form: ride direction from the plan kind", () => {
  assert.equal(rideDirectionOf({ id: 1, plan: { kind: "carpool" } }), "arriving");
  assert.equal(rideDirectionOf({ id: 1, plan: { kind: "home" } }), "departing");
  assert.equal(rideDirectionOf({ id: 1, plan: null }), "arriving");
});

test("who's coming ETA reuses the Directions drive estimate; fuel is miles / mpg x price", () => {
  assert.equal(driveMinutes(2.2), 11);
  assert.equal(driverEtaLabel(2.2), "2.2 MI · ~11 MIN AWAY");
  assert.equal(driverEtaLabel(null), null);
  assert.equal(driverEtaLabel(1, true), "ARRIVED");
  assert.equal(fuelEstimate(10), 1.8, "default 25 mpg x $4.50");
  assert.equal(fuelEstimate(10, { mpg: 20, pricePerGallon: 5 }), 2.5);
  assert.equal(fuelEstimate(null), null);
});
