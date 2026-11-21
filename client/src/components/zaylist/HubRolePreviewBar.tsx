import { HUB_ROLES, hubRoleLabel, type HubRole } from "@/lib/hubRolePreview";

/**
 * "See it as…" — owner-only Hub role preview control.
 *
 * Rendered only for the primary owner (HostHub gates it); for every
 * other account this component does not exist, the same law as every
 * role-gated Hub section. Picking a role below Owner switches the Hub
 * into a view-only preview of that role; picking Owner (or Exit)
 * returns to the owner's real view. The preview never changes the
 * owner's session or permissions.
 */
export default function HubRolePreviewBar({
  previewRole,
  onPreview,
}: {
  /** The role being previewed, or null for the owner's real view. */
  previewRole: HubRole | null;
  onPreview: (role: HubRole | null) => void;
}) {
  return (
    <section className="zl-section zl-preview" aria-labelledby="zl-preview-title">
      <h2 id="zl-preview-title">See it as…</h2>
      <p className="zl-note">
        Preview the Hub through a role&rsquo;s eyes. Sections a role cannot use do not appear,
        and changes are off while you preview.
      </p>
      <div className="zl-row zl-preview-roles" role="group" aria-label="Preview as role">
        {HUB_ROLES.map(({ key, label }) => {
          const active = key === "owner" ? previewRole === null : previewRole === key;
          return (
            <button
              key={key}
              type="button"
              className="zl-btn zl-btn--small"
              aria-pressed={active}
              onClick={() => onPreview(key === "owner" ? null : key)}
            >
              {label}
            </button>
          );
        })}
      </div>
      {previewRole !== null && (
        <div className="zl-preview-banner" role="status">
          <p>
            <strong>Previewing as {hubRoleLabel(previewRole)}.</strong>{" "}
            This is what {hubRoleLabel(previewRole)} sees in the Hub. Your own view and
            permissions are unchanged, and changes are off in preview.
          </p>
          <button type="button" className="zl-btn zl-btn--small" onClick={() => onPreview(null)}>
            Exit preview
          </button>
        </div>
      )}
    </section>
  );
}
