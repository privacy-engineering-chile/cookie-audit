export type LegalBasis =
  | 'consent'
  | 'contract'
  | 'legitimate-interest'
  | 'legal-obligation'
  | 'unknown';


export type Cookie = {
  name: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: string;
  category?: string;
  vendor?: string;
  service?: string | null;
  description?: string;
  classificationSource?: 'database' | 'heuristic' | 'unknown';
  classificationConfidence?: 'high' | 'medium' | 'low';
};

export type CookieCategory =
  | 'necessary'
  | 'functional'
  | 'analytics'
  | 'advertisement'
  | 'security'
  | 'other';

export type CookieDTO = Cookie & {
  category: CookieCategory;
  firstParty: boolean;
  legalBasis?: LegalBasis;
  vendor?: string;
  service?: string | null;
  description?: string;
  classificationSource?: 'database' | 'heuristic' | 'unknown';
  classificationConfidence?: 'high' | 'medium' | 'low';
};

export type StorageResult = {
  cookies: CookieDTO[];
  setCookieHeaders: string[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
};

export type VendorStat = {
  name: string;
  domains: string[];
  requests: number;
};

export type VendorDiff = {
  before: VendorStat[];
  after: VendorStat[];
  new: VendorStat[];
};

export type ScanResult = {
  before: StorageResult;
  after: StorageResult;
  newCookies: CookieDTO[];

  beforeTrackers: string[];
  afterTrackers: string[];

  vendors: VendorDiff;

  hasConsentUI: boolean;
  hasVisibleConsentUI: boolean;
  hasHiddenConsentMarkup: boolean;
  consentClicked: boolean;
  consentClassification: ConsentClassification;
};

export type RiskIssue = {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
};

export type RiskResult = {
  score: number;
  level: 'low' | 'medium' | 'high';
  issues: RiskIssue[];
};

export type ConsentClassification =
  | 'good'
  | 'tracking-before-consent'
  | 'non-compliant'
  | 'no-tracking'
  | 'functional-only';

  export type LegalComplianceLevel =
  | 'likely-compliant'
  | 'moderate-concern'
  | 'high-concern'
  | 'severe-concern';

export type LegalComplianceResult = {
  score: number;
  level: LegalComplianceLevel;
  consentRelevantActivity: boolean;
  reasons: string[];
};