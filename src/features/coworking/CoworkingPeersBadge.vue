<template>
  <div class="coworking-peers" :title="t('coworking.onlinePeers')">
    <div class="coworking-peers__avatars">
      <!-- Local User Avatar (Clickable to edit profile) -->
      <div
        class="coworking-peers__avatar coworking-peers__avatar--me"
        :style="{ backgroundColor: localUser.color }"
        :title="`${localUser.name} (You - click to edit)`"
        tabindex="0"
        role="button"
        @click.stop="toggleEditPopover"
        @keydown.enter.stop="toggleEditPopover"
      >
        {{ getInitials(localUser.name) }}
      </div>

      <!-- Remote Peers Avatars -->
      <div
        v-for="peer in peers.slice(0, 4)"
        :key="peer.id"
        class="coworking-peers__avatar"
        :style="{ backgroundColor: peer.color }"
        :title="peer.name"
      >
        {{ getInitials(peer.name) }}
      </div>

      <!-- Overflow Count -->
      <div
        v-if="peers.length > 4"
        class="coworking-peers__avatar coworking-peers__avatar--more"
        :title="`${peers.length - 4} more`"
      >
        +{{ peers.length - 4 }}
      </div>
    </div>

    <!-- Edit Profile Popover -->
    <div v-if="isPopoverOpen" class="coworking-popover" @click.stop>
      <div class="coworking-popover__header">
        <span class="coworking-popover__title">{{ t("coworking.editProfile") }}</span>
        <button
          type="button"
          class="coworking-popover__close-btn"
          aria-label="Close"
          @click="isPopoverOpen = false"
        >
          ✕
        </button>
      </div>

      <div class="coworking-popover__body">
        <label class="coworking-popover__label">
          <span class="coworking-popover__label-text">{{
            t("coworking.yourName")
          }}</span>
          <input
            v-model="editName"
            type="text"
            class="coworking-popover__input"
            maxlength="24"
            @keydown.enter="saveProfile"
          />
        </label>

        <div class="coworking-popover__color-section">
          <span class="coworking-popover__label-text">{{ t("coworking.color") }}</span>
          <div class="coworking-popover__colors">
            <button
              v-for="c in PEER_COLORS"
              :key="c"
              type="button"
              class="coworking-popover__color-swatch"
              :class="{ 'coworking-popover__color-swatch--active': editColor === c }"
              :style="{ backgroundColor: c }"
              :title="c"
              @click="editColor = c"
            />
          </div>
        </div>

        <div class="coworking-popover__actions">
          <button
            type="button"
            class="coworking-popover__btn coworking-popover__btn--cancel"
            @click="isPopoverOpen = false"
          >
            {{ t("coworking.cancel") }}
          </button>
          <button
            type="button"
            class="coworking-popover__btn coworking-popover__btn--save"
            @click="saveProfile"
          >
            {{ t("coworking.saveProfile") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { PEER_COLORS, type LocalUserProfile, type RemotePeer } from "./useCoworking";

const props = withDefaults(
  defineProps<{
    localUser: LocalUserProfile;
    peers: RemotePeer[];
  }>(),
  {
    peers: () => [],
  },
);

const emit = defineEmits<{
  updateProfile: [{ name: string; color: string }];
}>();

const { t } = useI18n();

const isPopoverOpen = ref(false);
const editName = ref(props.localUser.name);
const editColor = ref(props.localUser.color);

watch(
  () => props.localUser,
  (newUser) => {
    editName.value = newUser.name;
    editColor.value = newUser.color;
  },
  { deep: true },
);

function toggleEditPopover(): void {
  isPopoverOpen.value = !isPopoverOpen.value;
  if (isPopoverOpen.value) {
    editName.value = props.localUser.name;
    editColor.value = props.localUser.color;
  }
}

function saveProfile(): void {
  const finalName = editName.value.trim() || props.localUser.name;
  emit("updateProfile", { name: finalName, color: editColor.value });
  isPopoverOpen.value = false;
}

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
</script>

<style scoped>
.coworking-peers {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
}

.coworking-peers__avatars {
  display: flex;
  align-items: center;
  flex-direction: row-reverse;
}

.coworking-peers__avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--card, #1c1c24);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  margin-left: -6px;
  cursor: default;
  transition:
    transform 0.15s ease,
    z-index 0.15s ease;
  user-select: none;
}

.coworking-peers__avatar:hover {
  transform: scale(1.15);
  z-index: 10;
}

.coworking-peers__avatar--me {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.4);
  cursor: pointer;
}

.coworking-peers__avatar--more {
  background: var(--bg-2, #333);
  color: var(--ink-2, #ccc);
}

/* Edit Profile Popover */
.coworking-popover {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 220px;
  background: var(--card, #1e1e26);
  border: 1px solid var(--line, #333);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  z-index: 200;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.coworking-popover__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg-2, #262632);
  border-bottom: 1px solid var(--line, #333);
}

.coworking-popover__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink, #fff);
}

.coworking-popover__close-btn {
  background: transparent;
  border: none;
  color: var(--ink-3, #888);
  font-size: 12px;
  cursor: pointer;
  padding: 0 4px;
}

.coworking-popover__close-btn:hover {
  color: var(--ink, #fff);
}

.coworking-popover__body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.coworking-popover__label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.coworking-popover__label-text {
  font-size: 11px;
  color: var(--ink-3, #888);
}

.coworking-popover__input {
  background: var(--bg-1, #14141a);
  border: 1px solid var(--line, #333);
  border-radius: 4px;
  color: var(--ink, #fff);
  font-size: 12px;
  padding: 5px 8px;
  outline: none;
}

.coworking-popover__input:focus {
  border-color: var(--accent, #6366f1);
}

.coworking-popover__color-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.coworking-popover__colors {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.coworking-popover__color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.1s ease;
  padding: 0;
}

.coworking-popover__color-swatch:hover {
  transform: scale(1.15);
}

.coworking-popover__color-swatch--active {
  border-color: #fff;
  transform: scale(1.15);
}

.coworking-popover__actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 4px;
}

.coworking-popover__btn {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.coworking-popover__btn--cancel {
  background: transparent;
  color: var(--ink-3, #888);
}

.coworking-popover__btn--cancel:hover {
  color: var(--ink, #fff);
}

.coworking-popover__btn--save {
  background: var(--accent, #6366f1);
  color: #fff;
}
</style>
