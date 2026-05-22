import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  { path: "/", redirect: "/run" },
  {
    path: "/run",
    component: () => import("@/pages/run/RunIdlePage.vue"),
    meta: { topTab: "run" },
  },
  {
    path: "/run/active",
    component: () => import("@/pages/run/RunLivePage.vue"),
    meta: { topTab: "run" },
  },
  {
    path: "/run/done/:runId",
    component: () => import("@/pages/run/RunDonePage.vue"),
    props: true,
    meta: { topTab: "run" },
  },
  { path: "/configure", redirect: "/configure/project" },
  {
    path: "/configure/:pane",
    component: () => import("@/pages/configure/ConfigurePage.vue"),
    props: true,
    meta: { topTab: "configure" },
  },
  {
    path: "/history",
    component: () => import("@/pages/history/HistoryListPage.vue"),
    meta: { topTab: "history" },
  },
  {
    path: "/history/:runId",
    component: () => import("@/pages/history/HistoryDetailPage.vue"),
    props: true,
    meta: { topTab: "history" },
  },
  { path: "/settings", redirect: "/settings/profile" },
  {
    path: "/settings/:pane",
    component: () => import("@/pages/settings/SettingsWindow.vue"),
    props: true,
  },
  {
    path: "/agent-editor",
    component: () => import("@/pages/agent-editor/AgentEditorPage.vue"),
  },
  {
    path: "/scenarios/new",
    component: () => import("@/pages/scenario-edit/ScenarioEditPage.vue"),
  },
  {
    path: "/scenarios/edit/:scenarioId",
    component: () => import("@/pages/scenario-edit/ScenarioEditPage.vue"),
    props: true,
  },
  { path: "/plugins", component: () => import("@/pages/plugins/PluginsPage.vue") },
  { path: "/legacy", component: () => import("@/pages/swarm-ui/SwarmUiPage.vue") },
  { path: "/:catchAll(.*)", redirect: "/run" },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
