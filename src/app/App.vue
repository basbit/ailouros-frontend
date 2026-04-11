<template>
  <SwarmUiPage />
  <AppDialogHost />
  <AppToastStack />
</template>

<script setup lang="ts">
import { useSwarmDefaults } from "@/shared/lib/use-swarm-defaults";
import SwarmUiPage from "@/pages/swarm-ui/SwarmUiPage.vue";
import AppDialogHost from "@/widgets/feedback/AppDialogHost.vue";
import AppToastStack from "@/widgets/feedback/AppToastStack.vue";

useSwarmDefaults();
</script>
