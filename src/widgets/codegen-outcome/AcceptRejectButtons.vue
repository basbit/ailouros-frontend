<script setup lang="ts">
import { ref, computed } from "vue";
import {
  useCodegenFeedback,
  type FeedbackVerdict,
} from "@/features/codegen-feedback/useCodegenFeedback";

const props = defineProps<{
  specId: string;
  agent: string;
  targetFile: string;
}>();

const emit = defineEmits<{
  (e: "feedback-submitted", id: string): void;
}>();

const { loading, lastSubmissionId, error, submit } = useCodegenFeedback();

const editOpen = ref(false);
const editDiff = ref("");
const editReason = ref("");

const submitted = computed(() => lastSubmissionId.value !== null);

async function handleVerdict(verdict: FeedbackVerdict) {
  if (verdict === "edit") {
    editOpen.value = true;
    return;
  }
  const id = await submit({
    spec_id: props.specId,
    agent: props.agent,
    target_file: props.targetFile,
    verdict,
  });
  if (id) {
    emit("feedback-submitted", id);
  }
}

async function submitEdit() {
  const id = await submit({
    spec_id: props.specId,
    agent: props.agent,
    target_file: props.targetFile,
    verdict: "edit",
    user_edit_diff: editDiff.value.trim() || undefined,
    reason: editReason.value.trim() || undefined,
  });
  if (id) {
    editOpen.value = false;
    editDiff.value = "";
    editReason.value = "";
    emit("feedback-submitted", id);
  }
}

function cancelEdit() {
  editOpen.value = false;
  editDiff.value = "";
  editReason.value = "";
}
</script>

<template>
  <div class="accept-reject-buttons">
    <div v-if="submitted && !editOpen" class="feedback-submitted" role="status">
      Feedback recorded
    </div>

    <div v-else-if="!editOpen" class="button-row">
      <button
        class="btn btn-accept"
        :disabled="loading"
        aria-label="Accept generated file"
        @click="handleVerdict('accept')"
      >
        Accept
      </button>
      <button
        class="btn btn-edit"
        :disabled="loading"
        aria-label="Edit generated file"
        @click="handleVerdict('edit')"
      >
        Edit
      </button>
      <button
        class="btn btn-reject"
        :disabled="loading"
        aria-label="Reject generated file"
        @click="handleVerdict('reject')"
      >
        Reject
      </button>
    </div>

    <div v-if="editOpen" class="edit-panel">
      <label class="edit-label" for="edit-diff">Your diff (optional)</label>
      <textarea
        id="edit-diff"
        v-model="editDiff"
        class="edit-textarea"
        placeholder="Paste your unified diff here..."
        rows="6"
      />
      <label class="edit-label" for="edit-reason">Reason (optional)</label>
      <input
        id="edit-reason"
        v-model="editReason"
        class="edit-input"
        type="text"
        placeholder="Briefly explain your edit..."
      />
      <div class="edit-actions">
        <button class="btn btn-submit" :disabled="loading" @click="submitEdit">
          {{ loading ? "Submitting..." : "Submit Edit" }}
        </button>
        <button class="btn btn-cancel" :disabled="loading" @click="cancelEdit">
          Cancel
        </button>
      </div>
    </div>

    <p v-if="error" class="feedback-error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.accept-reject-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.button-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  border: 1px solid currentColor;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-accept {
  color: #16a34a;
  background: transparent;
}

.btn-reject {
  color: #dc2626;
  background: transparent;
}

.btn-edit {
  color: #d97706;
  background: transparent;
}

.btn-submit {
  color: #2563eb;
  background: transparent;
}

.btn-cancel {
  color: #6b7280;
  background: transparent;
}

.edit-panel {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.edit-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.edit-textarea {
  font-family: monospace;
  font-size: 0.8rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0.5rem;
  resize: vertical;
}

.edit-input {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0.375rem 0.5rem;
  font-size: 0.875rem;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

.feedback-submitted {
  font-size: 0.875rem;
  color: #16a34a;
}

.feedback-error {
  font-size: 0.8rem;
  color: #dc2626;
  margin: 0;
}
</style>
