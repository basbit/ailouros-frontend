export interface DriftStaleEntry {
  spec_id?: string;
  path?: string;
  reason?: string;
}

export interface DriftAgedKeepRegion {
  path?: string;
  line?: number;
  age_days?: number;
}

export interface SpecDriftReport {
  stale_code: DriftStaleEntry[];
  stale_specs: DriftStaleEntry[];
  aged_keep_regions: DriftAgedKeepRegion[];
}

export interface SpecCodegenOutcome {
  spec_id: string;
  written_files: string[];
  sidecar_paths: string[];
  retry_count: number;
}
