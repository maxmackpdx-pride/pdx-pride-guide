import { PLATFORM_API_VERSION, platformObjectTypes, typedIdPrefixes } from "@shared/platform";

const resourcePaths = Object.fromEntries(platformObjectTypes.flatMap(type => {
  const plural = type === "community" ? "communities" : type === "media" ? "media" : `${type}s`;
  return [
    [`/api/v1/${plural}`, { get: { summary: `List ${plural}`, parameters: [{ name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } }, { name: "cursor", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Typed resource collection" }, "422": { $ref: "#/components/responses/ValidationError" } } } }],
    [`/api/v1/${plural}/{id}`, { get: { summary: `Get one ${type}`, parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", pattern: `^${typedIdPrefixes[type]}_` } }], responses: { "200": { description: "Typed resource" }, "404": { $ref: "#/components/responses/NotFound" } } } }],
  ];
}));

export const platformOpenApi = {
  openapi: "3.1.0",
  info: { title: "Zaylist Platform API", version: PLATFORM_API_VERSION, description: "Internal, read-first typed domain API used by the Zaylist website. Product write routes remain authoritative during migration." },
  servers: [{ url: "https://www.zaylist.com" }],
  paths: {
    "/api/v1": { get: { summary: "API metadata", responses: { "200": { description: "API metadata" } } } },
    "/api/v1/search": { get: { summary: "Search typed Zaylist resources", parameters: [{ name: "q", in: "query", required: true, schema: { type: "string", minLength: 2, maxLength: 200 } }, { name: "types", in: "query", schema: { type: "string" } }, { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } }, { name: "cursor", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Visibility-filtered typed search results" }, "422": { $ref: "#/components/responses/ValidationError" } } } },
    "/api/v1/objects/{id}": { get: { summary: "Resolve a typed resource ID", parameters: [{ name: "id", in: "path", required: true, schema: { $ref: "#/components/schemas/TypedId" } }], responses: { "200": { description: "Typed resource" }, "404": { $ref: "#/components/responses/NotFound" } } } },
    "/api/v1/objects/{id}/capabilities": { get: { summary: "Evaluate viewer capabilities", parameters: [{ name: "id", in: "path", required: true, schema: { $ref: "#/components/schemas/TypedId" } }], responses: { "200": { description: "Current capability set" }, "404": { $ref: "#/components/responses/NotFound" } } } },
    "/api/v1/relationships/{id}": { get: { summary: "List visibility-safe typed relationships", parameters: [{ name: "id", in: "path", required: true, schema: { $ref: "#/components/schemas/TypedId" } }], responses: { "200": { description: "Relationship collection" }, "404": { $ref: "#/components/responses/NotFound" } } } },
    ...resourcePaths,
  },
  components: {
    schemas: {
      TypedId: { type: "string", pattern: "^(evt|com|lst|gig|plc|gui|prf|org|med)_[A-Za-z0-9][A-Za-z0-9._~-]*$" },
      Error: { type: "object", required: ["apiVersion", "requestId", "error"], properties: { apiVersion: { const: PLATFORM_API_VERSION }, requestId: { type: "string" }, error: { type: "object", required: ["code", "message", "status"], properties: { code: { type: "string" }, message: { type: "string" }, status: { type: "integer" }, details: {} } } } },
    },
    responses: { NotFound: { description: "Resource does not exist or is not visible" }, ValidationError: { description: "Strict query validation failed" } },
  },
} as const;
