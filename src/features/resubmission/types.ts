export interface Critique {
  id: string;
  criterion: 'significance' | 'innovation' | 'approach' | 'investigators' | 'environment';
  reviewer: string;
  text: string;
  severity: 'must-address' | 'consider';
  addressed?: boolean;
}

export interface CriterionScore {
  criterion: string;
  score: number;
  reviewerScores?: number[];
}

export interface ParsedSummaryStatement {
  overallImpactScore: number;
  criterionScores: CriterionScore[];
  critiques: Critique[];
  resumeSynopsis: string;
}

export interface AuditFinding {
  id: string;
  category: string;
  finding: string;
  recommendation: string;
  priority: 'critical' | 'important' | 'minor';
}

export interface AuditResults {
  findings: AuditFinding[];
  preliminaryDataGaps: string[];
  suggestedNewData: string[];
  missedOpportunities: string[];
}

export interface ResponseSuggestion {
  critiqueId: string;
  response: string;
  priority: 'critical' | 'important' | 'minor';
  structuralChanges?: string[];
  pageEstimate?: number;
}

export interface ResponseStrategy {
  suggestions: ResponseSuggestion[];
  totalPageEstimate: number;
  remainingPageBudget: number;
}

export interface SectionRewrite {
  sectionName: string;
  originalText: string;
  revisedText: string;
  changes: string[];
  pageCount: number;
}

export interface CoverLetter {
  content: string;
  wordCount: number;
  pageEstimate: number;
}

export interface QualityScore {
  criterion: string;
  originalScore: number;
  projectedScore: number;
  delta: number;
}

export interface QualityCheckResults {
  scores: QualityScore[];
  overallOriginal: number;
  overallProjected: number;
  overallDelta: number;
  remainingRisks: string[];
  checklist: { item: string; completed: boolean }[];
}

export interface ResubmissionState {
  step: number;
  submissionType: 'A0-A1' | 'A1-new' | null;
  previousScore: number | null;
  grantDocument: File | null;
  grantText: string;
  summaryStatement: File | null;
  summaryText: string;
  parsedSummary: ParsedSummaryStatement | null;
  auditResults: AuditResults | null;
  responseStrategy: ResponseStrategy | null;
  sectionRewrites: SectionRewrite[];
  coverLetter: CoverLetter | null;
  qualityCheck: QualityCheckResults | null;
  loading: boolean;
  error: string | null;
}

export type ResubmissionAction =
  | 'parse'
  | 'audit'
  | 'strategy'
  | 'rewrite'
  | 'cover-letter'
  | 'quality-check';

export const DISCLAIMER = "This tool provides suggestions only. Grant funding decisions are made solely by NIH review panels. No guarantee of funding outcomes is expressed or implied.";

export const NIH_CRITERIA = [
  { key: 'significance', label: 'Significance' },
  { key: 'innovation', label: 'Innovation' },
  { key: 'approach', label: 'Approach' },
  { key: 'investigators', label: 'Investigators' },
  { key: 'environment', label: 'Environment' },
] as const;
