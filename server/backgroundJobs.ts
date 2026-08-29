type RuntimeEnv = Record<string, string | undefined>;

const enabled = (value: string | undefined) => /^(1|true)$/i.test(value?.trim() || "");
const disabled = (value: string | undefined) => /^(0|false)$/i.test(value?.trim() || "");

/**
 * Background work must have exactly one production owner. Railway staging uses
 * NODE_ENV=production too, so NODE_ENV alone would duplicate QSearch, prompts,
 * coordinate backfills, and other scheduled writes.
 */
export function shouldRunBackgroundJobs(env: RuntimeEnv = process.env): boolean {
  if (enabled(env.BACKGROUND_JOBS)) return true;
  if (disabled(env.BACKGROUND_JOBS)) return false;
  if (env.LOCAL_PREVIEW === "1" || env.NODE_ENV !== "production") return false;

  const railwayEnvironment = (
    env.RAILWAY_ENVIRONMENT_NAME ||
    env.RAILWAY_ENVIRONMENT ||
    ""
  ).trim().toLowerCase();

  // Non-Railway production remains enabled for portability. On Railway, only
  // the production environment owns background work by default.
  return !railwayEnvironment || railwayEnvironment === "production";
}

/** Legacy poster repair is maintenance work, not an application startup job. */
export function shouldMirrorPostersOnStart(env: RuntimeEnv = process.env): boolean {
  return shouldRunBackgroundJobs(env) && enabled(env.POSTER_MIRROR_ON_START);
}

