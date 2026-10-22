import assert from "node:assert/strict";
import {
  approveAgentPairing,
  isPairedEventResearchToken,
  listAgentCredentials,
  listAgentPairings,
  redeemAgentPairing,
  revokeAgentCredential,
  startAgentPairing,
} from "../server/eventResearchPairing";
import { isEventResearchAgentRequest } from "../server/eventResearchAuth";

const pairing = startAgentPairing();
assert.equal(pairing.displayCode.length, 10);
assert.ok(!JSON.stringify(listAgentPairings()).includes(pairing.claimSecret), "owner list never exposes claim secret");
assert.equal(redeemAgentPairing(pairing.id, pairing.claimSecret).status, "pending");
assert.deepEqual(redeemAgentPairing(pairing.id, "wrong-secret"), { status: "invalid" });
assert.equal(approveAgentPairing(pairing.id, 1), true);
assert.equal(approveAgentPairing(pairing.id, 1), false);
const redeemed = redeemAgentPairing(pairing.id, pairing.claimSecret);
assert.equal(redeemed.status, "ready");
if (redeemed.status !== "ready") throw new Error("Expected a credential");
assert.equal(isPairedEventResearchToken(redeemed.token), true);
assert.equal(isEventResearchAgentRequest({ get: () => `Bearer ${redeemed.token}` }), true);
assert.equal(redeemAgentPairing(pairing.id, pairing.claimSecret).status, "expired", "pairing is one-use");
assert.ok(!JSON.stringify(listAgentCredentials()).includes(redeemed.token), "owner list never exposes token");
assert.equal(revokeAgentCredential(redeemed.credentialId), true);
assert.equal(isPairedEventResearchToken(redeemed.token), false);
assert.equal(revokeAgentCredential(redeemed.credentialId), false);
console.log("QSearch owner-pairing checks passed.");
