export interface ReviewItem {
  id: string;
  author: string;
  date: string; // e.g. "2026-09-24"
  rating: number; // 1 to 5
  platform: 'Google Play Store' | 'Apple App Store' | 'Trustpilot';
  title: string;
  review: string;
  category?: string;
}

export interface ThemeCluster {
  name: string;
  reviewCount: number;
  percentage: number;
  sentiment: string;
  description: string;
}

export interface AnalysisResult {
  themes: ThemeCluster[];
  topThemes: string[];
  realUserQuotes: string[];
  identifiedFeeIssue: string;
  feeDetails?: {
    category: string;
    severity: string;
    rootCause: string;
  };
}

export interface WeeklyPulseData {
  pulseText: string;
  wordCount: number;
  generatedAt: string;
}

export interface SourceLink {
  title: string;
  url: string;
}

export interface FeeExplainerData {
  title: string;
  bullets: string[];
  sourceLinks: SourceLink[];
  lastChecked: string;
}

export interface McpAppendDocPayload {
  date: string;
  top_themes: string[];
  weekly_pulse: string;
  identified_fee_issue: string;
  explanation_bullets: string[];
  source_links: SourceLink[];
}

export interface McpEmailDraftPayload {
  subject: string;
  body: string;
  recipients?: string[];
  no_auto_send?: boolean;
}

export interface McpLogFrame {
  id: string;
  timestamp: string;
  type: 'REQUEST' | 'RESPONSE' | 'GATE_CHECK';
  jsonrpc: string;
  method?: string;
  toolName?: string;
  payload: any;
  status: 'PENDING' | 'APPROVED' | 'SUCCESS' | 'REJECTED';
}

export interface DocEntry {
  id: string;
  date: string;
  top_themes: string[];
  weekly_pulse: string;
  identified_fee_issue: string;
  explanation_bullets: string[];
  source_links: SourceLink[];
  appendedAt: string;
}

export interface EmailDraft {
  id: string;
  subject: string;
  body: string;
  recipients: string[];
  createdAt: string;
  status: 'DRAFT_CREATED' | 'SENT_SIMULATED';
}
