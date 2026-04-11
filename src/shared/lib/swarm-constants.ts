/** Compatibility re-exports.
 *
 * Prefer importing from:
 * - `swarm-ui-constants` for browser/localStorage constants
 * - `pipeline-schema` for role/pipeline metadata
 * - `use-swarm-defaults` for backend-derived policy defaults
 * - `swarm-policy-fallbacks` only for offline fallback data
 */

export * from "@/shared/lib/swarm-ui-constants";
export * from "@/shared/lib/pipeline-schema";
export * from "@/shared/lib/swarm-policy-fallbacks";
