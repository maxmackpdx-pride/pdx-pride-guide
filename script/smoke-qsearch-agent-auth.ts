import assert from "node:assert/strict";
import {
  allowAdminOrEventResearchAgent,
  EVENT_RESEARCH_AGENT_NAME,
  isEventResearchAgentRequest,
} from "../server/eventResearchAuth";

const previous = process.env.QSEARCH_AGENT_TOKEN;
const token = "qsearch-test-token-abcdefghijklmnopqrstuvwxyz-123456";
process.env.QSEARCH_AGENT_TOKEN = token;

try {
  assert.equal(
    isEventResearchAgentRequest({ get: () => `Bearer ${token}` }),
    true,
    "valid dedicated bearer token is accepted",
  );
  assert.equal(
    isEventResearchAgentRequest({ get: () => "Bearer wrong-token" }),
    false,
    "wrong bearer token is rejected",
  );
  assert.equal(
    isEventResearchAgentRequest({ get: () => "" }),
    false,
    "missing bearer token is rejected",
  );
  assert.equal(
    isEventResearchAgentRequest({ get: () => "Basic anything" }),
    false,
    "non-bearer authorization is rejected",
  );

  let adminFallbacks = 0;
  let nextCalls = 0;
  const middleware = allowAdminOrEventResearchAgent(((_req, _res, next) => {
    adminFallbacks += 1;
    next();
  }) as any);
  const res = { setHeader() {} } as any;
  const agentReq = { get: () => `Bearer ${token}`, headers: {} } as any;
  middleware(agentReq, res, () => { nextCalls += 1; });
  assert.equal(agentReq.eventResearchAgent, EVENT_RESEARCH_AGENT_NAME);
  assert.equal(adminFallbacks, 0, "agent token does not invoke human admin auth");
  assert.equal(nextCalls, 1);

  const adminReq = { get: () => "", headers: {} } as any;
  middleware(adminReq, res, () => { nextCalls += 1; });
  assert.equal(adminFallbacks, 1, "non-agent requests preserve human admin auth");

  console.log("All QSearch scoped-auth checks passed.");
} finally {
  if (previous == null) delete process.env.QSEARCH_AGENT_TOKEN;
  else process.env.QSEARCH_AGENT_TOKEN = previous;
}
