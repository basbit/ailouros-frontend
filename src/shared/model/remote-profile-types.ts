/**
 * Credentials for one remote provider endpoint.
 *
 * This is connection configuration consumed by the shared transport helpers
 * (see `use-model-list`), not project domain state, so it stays in `shared`
 * while the project/role model lives in `entities/project`.
 */
export interface RemoteProfileRow {
  id: string;
  provider: string;
  api_key: string;
  base_url: string;
}
