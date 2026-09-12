export type { RoleSnapshot } from "./model/types";
export {
  ROLES,
  ROLE_MODEL_HINT,
  ROLE_NEEDS_TOOL_CALLING,
  currentRoleIds,
  type RoleId,
} from "./model/roles-catalog";
export {
  defaultEnvironmentForRole,
  defaultModelForRole,
  defaultPromptPathForRole,
  promptChoicesForRole,
} from "./model/role-defaults";
