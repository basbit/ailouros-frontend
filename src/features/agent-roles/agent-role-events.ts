export type AgentRoleEmitMap = {
  envChange: [roleId: string, env: string];
  profileChange: [roleId: string, profile: string];
  modelSelChange: [roleId: string, val: string];
  modelCustomInput: [roleId: string, val: string];
  promptSelChange: [roleId: string, val: string];
  promptCustomInput: [roleId: string, val: string];
  promptTextInput: [roleId: string, val: string];
  skillIdsInput: [roleId: string, val: string];
};
