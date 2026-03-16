export interface PolicyMetadata {
  name: string;
  description?: string;
  domain: 'MRM' | 'ERM' | 'CRM';
  effectiveDate?: string;
  expirationDate?: string;
  owner?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  tags?: string[];
}

export interface Condition {
  path?: string;
  operator?: string;
  value?: any;
  all?: Condition[];
  any?: Condition[];
  not?: Condition;
}

export interface Rule {
  id: string;
  name: string;
  description?: string;
  type?: 'required_field' | 'value_range' | 'cross_field' | 'temporal' | 'conditional' | 'custom';
  severity?: 'critical' | 'high' | 'medium' | 'low';
  when?: Condition;
  conditions: Condition;
  remediation?: string;
}

export interface Policy {
  id: string;
  version: string;
  metadata: PolicyMetadata;
  rules: Rule[];
}

export interface PolicyListResponse {
  policies: Policy[];
  total: number;
}

export interface RuleResult {
  rule_id: string;
  rule_name: string;
  status: 'pass' | 'fail' | 'error' | 'skip';
  message: string;
  details: Record<string, any>;
}

export interface EvaluationResult {
  policy_id: string;
  compliant: boolean;
  evaluated_at: string;
  results: RuleResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    errors: number;
    skipped: number;
  };
}

export interface EvaluationRequest {
  policy_id: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface BulkEvaluationItem {
  id: string;
  policy_id: string;
  data: Record<string, any>;
}

export interface BulkEvaluationRequest {
  items: BulkEvaluationItem[];
  fail_fast?: boolean;
}

export interface BulkEvaluationResultItem {
  id: string;
  policy_id: string;
  compliant: boolean;
  evaluated_at: string;
  summary: Record<string, number>;
  error?: string;
}

export interface BulkEvaluationResponse {
  total: number;
  compliant: number;
  non_compliant: number;
  errors: number;
  results: BulkEvaluationResultItem[];
}
