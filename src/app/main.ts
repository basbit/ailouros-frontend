import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "@/app/styles/app.css";

createApp(App).use(createPinia()).mount("#app");
