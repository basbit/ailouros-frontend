import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  { path: "/", redirect: "/run" },
  {
    path: "/run",
    component: () => import("@/pages/chat/ChatPage.vue"),
    meta: { topTab: "run" },
  },
  {
    path: "/chat",
    redirect: "/run",
  },
  {
    path: "/run/active",
    component: () => import("@/pages/chat/ChatPage.vue"),
    meta: { topTab: "run" },
  },
  {
    path: "/run/done/:runId",
    component: () => import("@/pages/chat/ChatPage.vue"),
    props: true,
    meta: { topTab: "run" },
  },
  {
    path: "/run/classic",
    component: () => import("@/pages/run/RunIdlePage.vue"),
  },
  {
    path: "/run/grid",
    component: () => import("@/pages/run/RunGridPage.vue"),
    meta: { topTab: "run" },
  },
  {
    path: "/run/canvas",
    component: () => import("@/pages/run/RunCanvasPage.vue"),
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
  { path: "/settings", redirect: "/settings/api-keys" },
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
  { path: "/legacy", component: () => import("@/pages/swarm-ui/SwarmUiPage.vue") },
  { path: "/:catchAll(.*)", redirect: "/run" },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
