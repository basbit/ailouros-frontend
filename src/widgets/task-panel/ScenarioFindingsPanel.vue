<template>
  <section v-if="hasFindings" class="scenario-findings">
    <header class="scenario-findings__head">
      <span class="scenario-findings__title">
        {{ t("scenarioFindings.title") }}
      </span>
      <span class="scenario-findings__count">
        {{ totalCount }} ({{ t("scenarioFindings.bySeverity") }})
      </span>
    </header>
    <div
      v-for="bucket in buckets"
      :key="bucket.severity"
      class="scenario-findings__bucket"
      :class="`scenario-findings__bucket--${bucket.severity}`"
    >
      <div class="scenario-findings__bucket-head">
        {{ t(`scenarioFindings.severity.${bucket.severity}`) }}
        <span class="scenario-findings__bucket-count">{{ bucket.items.length }}</span>
      </div>
      <ul class="scenario-findings__list">
        <li v-for="(item, index) in bucket.items" :key="`${bucket.severity}-${index}`">
          <span v-if="item.file" class="scenario-findings__file">
            {{ item.file }}<span v-if="item.line">:{{ item.line }}</span>
          </span>
          <span class="scenario-findings__message">{{ item.message }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";

type Severity = "critical" | "high" | "medium" | "low";

interface Finding {
  severity: Severity;
  message: string;
  file?: string;
  line?: number;
}

interface Bucket {
  severity: Severity;
  items: Finding[];
}

const props = defineProps<{
  rawAgentText: string;
}>();

const { t } = useI18n();

const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low"];

function extractJsonBlocks(text: string): unknown[] {
  if (!text) return [];
  const fence = /```json\s*([\s\S]*?)```/gi;
  const blocks: unknown[] = [];
  let match: RegExpExecArray | null = fence.exec(text);
  while (match !== null) {
    try {
      blocks.push(JSON.parse(match[1].trim()));
    } catch {
      /* ignore */
    }
    match = fence.exec(text);
  }
  return blocks;
}

function normalizeSeverity(value: unknown): Severity {
  const lower = typeof value === "string" ? value.toLowerCase().trim() : "";
  if (lower === "critical") return "critical";
  if (lower === "high") return "high";
  if (lower === "low") return "low";
  return "medium";
}

const findings = computed<Finding[]>(() => {
  const blocks = extractJsonBlocks(props.rawAgentText || "");
  for (const block of blocks) {
    if (Array.isArray(block) && block.length && typeof block[0] === "object") {
      const sample = block[0] as Record<string, unknown>;
      if ("severity" in sample || "level" in sample) {
        return block.map((item) => {
          const row = item as Record<string, unknown>;
          return {
            severity: normalizeSeverity(row.severity ?? row.level),
            message: String(
              row.message ?? row.summary ?? row.error ?? row.description ?? "",
            ),
            file: typeof row.file === "string" ? row.file : undefined,
            line: typeof row.line === "number" ? row.line : undefined,
          };
        });
      }
    }
  }
  return [];
});

const buckets = computed<Bucket[]>(() => {
  const grouped: Record<Severity, Finding[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };
  for (const item of findings.value) {
    grouped[item.severity].push(item);
  }
  return SEVERITY_ORDER.filter((severity) => grouped[severity].length > 0).map(
    (severity) => ({ severity, items: grouped[severity] }),
  );
});

const totalCount = computed(() => findings.value.length);
const hasFindings = computed(() => totalCount.value > 0);
</script>

<style scoped>
.scenario-findings {
  border-top: 1px solid var(--border);
  margin-top: 12px;
  padding-top: 12px;
}
.scenario-findings__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.scenario-findings__title {
  font-size: 12px;
  font-weight: 650;
  color: var(--text, #f5f0e7);
}
.scenario-findings__count {
  font-size: 11px;
  color: var(--text2, #a8b0c4);
}
.scenario-findings__bucket {
  border-radius: 6px;
  padding: 6px 8px;
  margin-bottom: 6px;
  background: color-mix(in srgb, var(--surface, #1a1d29) 60%, transparent);
}
.scenario-findings__bucket--critical {
  background: color-mix(in srgb, var(--error, #d7563f) 18%, transparent);
}
.scenario-findings__bucket--high {
  background: color-mix(in srgb, #d99f24 16%, transparent);
}
.scenario-findings__bucket--medium {
  background: color-mix(in srgb, var(--accent, #3b5bdb) 14%, transparent);
}
.scenario-findings__bucket--low {
  background: color-mix(in srgb, var(--text3, #6b7280) 14%, transparent);
}
.scenario-findings__bucket-head {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text, #f5f0e7);
  display: flex;
  align-items: center;
  gap: 6px;
}
.scenario-findings__bucket-count {
  background: rgba(0, 0, 0, 0.25);
  color: var(--text, #f5f0e7);
  padding: 0 6px;
  border-radius: 999px;
  font-size: 10px;
}
.scenario-findings__list {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
}
.scenario-findings__list li {
  font-size: 11px;
  color: var(--text, #f5f0e7);
  padding: 2px 0;
}
.scenario-findings__file {
  font-family: var(--mono, ui-monospace, monospace);
  font-size: 10px;
  color: var(--text2, #a8b0c4);
  margin-right: 6px;
}
.scenario-findings__message {
  overflow-wrap: anywhere;
}
</style>
