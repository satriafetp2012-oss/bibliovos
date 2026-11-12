export type DatabaseSource =
  | 'Scopus'
  | 'Web of Science'
  | 'PubMed'
  | 'OpenAlex'
  | 'CrossRef'
  | 'Dimensions'
  | 'RIS/BibTeX';

export type OpenAccessType = 'Gold OA' | 'Green OA' | 'Hybrid OA' | 'Bronze OA' | 'Closed';

export interface RawSourceSnapshot {
  sourceDb: DatabaseSource;
  originalId: string;
  title: string;
  doi: string;
  year: number;
  citations: number;
  authors: string[];
  journal: string;
}

export interface BibRecord {
  id: string;
  ut: string;
  doi: string;
  title: string;
  authors: string[]; // Normalized "Lastname, Initials"
  authorFullNames: string[];
  year: number;
  source: string; // Journal / Conference (SO)
  citations: number; // Unified Times Cited (TC)
  authorKeywords: string[]; // DE
  indexKeywords: string[]; // ID / MeSH / Keywords Plus
  abstract: string; // AB
  affiliations: string[]; // C1
  countries: string[];
  references: string[]; // CR
  docType: string; // DT: Article, Review, Proceedings Paper
  databases: DatabaseSource[]; // DB provenance
  // Extended Metadata Fields (Funding, Research Subjects, OA, Language, Publisher)
  fundingAgencies?: string[]; // FU: Normalized Funding Sponsors / Grant Agencies
  fundingText?: string; // FX: Raw Funding Grant & Acknowledgment text
  researchSubjects?: string[]; // SC / WC: Subject Categories / Research Areas
  openAccess?: OpenAccessType; // OA status
  language?: string; // LA: Publication Language
  publisher?: string; // PU: Publisher Name
  correspondingCountry?: string; // RP: Corresponding Author Country
  sourceCitations?: Partial<Record<DatabaseSource, number>>;
  mergedFrom?: RawSourceSnapshot[];
}

export interface MergeConflictPair {
  id: string;
  primaryRecord: BibRecord;
  duplicateRecord: BibRecord;
  matchReason: 'Exact DOI' | 'Fuzzy Title + Year + Author';
  similarityScore: number; // 0 to 1
  status: 'merged' | 'split';
  mergedFieldsSummary: string[];
}

export type VOSAnalysisType =
  | 'co-occurrence'
  | 'co-authorship'
  | 'citation'
  | 'bibliographic-coupling';

export type VOSUnitOfAnalysis =
  | 'all-keywords'
  | 'author-keywords'
  | 'index-keywords'
  | 'research-subjects'
  | 'authors'
  | 'countries'
  | 'organizations'
  | 'funding-agencies'
  | 'sources'
  | 'documents';

export type VOSViewMode = 'network' | 'overlay' | 'density';
export type VOSOverlayColorBy =
  | 'avgYear'
  | 'avgCitations'
  | 'normCitations'
  | 'fundedShare'
  | 'openAccessShare'
  | 'mcpShare';
export type VOSNodeScaleBy = 'occurrences' | 'tls' | 'citations';

export interface VOSNode {
  id: string;
  label: string;
  cluster: number;
  occurrences: number; // Weight: Occurrences or Documents
  tls: number; // Total Link Strength
  citations: number;
  avgYear: number;
  avgCitations: number;
  normCitations: number;
  fundedSharePct?: number;
  openAccessSharePct?: number;
  mcpSharePct?: number;
  x: number; // Normalized [-1, 1] layout coordinate
  y: number; // Normalized [-1, 1] layout coordinate
  recordIds: string[];
}

export interface VOSLink {
  source: string;
  target: string;
  strength: number;
}

export interface VOSNetworkData {
  nodes: VOSNode[];
  links: VOSLink[];
  clusters: {
    id: number;
    label: string;
    color: string;
    nodeCount: number;
    topItems: string[];
  }[];
  minYear: number;
  maxYear: number;
  minCitations: number;
  maxCitations: number;
}

export type SankeyFieldType =
  | 'sources'
  | 'authors'
  | 'authorKeywords'
  | 'indexKeywords'
  | 'countries'
  | 'affiliations'
  | 'fundingAgencies'
  | 'researchSubjects'
  | 'openAccess';

export interface SankeyNode {
  id: string;
  label: string;
  column: 0 | 1 | 2;
  value: number;
  y0: number;
  y1: number;
  color: string;
}

export interface SankeyLink {
  sourceId: string;
  targetId: string;
  value: number;
  y0: number;
  y1: number;
  width: number;
  color: string;
}

export interface BradfordItem {
  rank: number;
  source: string;
  articles: number;
  cumulativeArticles: number;
  logRank: number;
  zone: 'Zone 1 (Core)' | 'Zone 2 (Middle)' | 'Zone 3 (Peripheral)';
  totalCitations: number;
}

export interface LotkaItem {
  documentsWritten: number;
  observedAuthors: number;
  observedPct: number;
  theoreticalPct: number;
}

export interface ImpactEntity {
  name: string;
  hIndex: number;
  gIndex: number;
  mIndex: number;
  totalCitations: number;
  netProduction: number;
  firstYear: number;
  yearlyTimeline: {
    year: number;
    count: number;
    citations: number;
  }[];
}

export interface ThematicCluster {
  id: string;
  label: string;
  quadrant:
    | 'Motor Themes'
    | 'Niche Themes'
    | 'Emerging or Declining Themes'
    | 'Basic and Transversal Themes';
  callonCentrality: number; // normalized [0, 100]
  callonDensity: number; // normalized [0, 100]
  occurrences: number;
  totalCitations: number;
  keywords: { term: string; count: number }[];
  color: string;
}

export interface TrendTopicItem {
  term: string;
  frequency: number;
  q1Year: number;
  medianYear: number;
  q3Year: number;
  avgCitations: number;
}

export interface RPYSPoint {
  year: number;
  citedReferencesCount: number;
  median5Yr: number;
  deviation: number;
  topCitedReference: string;
}

export interface HistoriographNode {
  id: string;
  label: string;
  title: string;
  year: number;
  globalCitations: number;
  localCitations: number;
  source: string;
  x: number;
  y: number;
}

export interface HistoriographEdge {
  fromId: string;
  toId: string;
}

export interface FundingAgencyMetric {
  agency: string;
  documents: number;
  sharePct: number;
  totalCitations: number;
  avgCitations: number;
  hIndex: number;
  openAccessPct: number;
  topSubjects: string[];
  topCountries: string[];
}

export interface ResearchSubjectMetric {
  subject: string;
  documents: number;
  sharePct: number;
  totalCitations: number;
  avgCitations: number;
  hIndex: number;
  fundedPct: number;
  topFundingAgencies: string[];
  yearlyCounts: { year: number; count: number }[];
}

export interface CountryCollaborationMetric {
  country: string;
  totalDocuments: number;
  scp: number; // Single Country Publications
  mcp: number; // Multiple Country Publications (International Collaboration)
  mcpRatioPct: number;
  totalCitations: number;
  avgCitations: number;
  fundedDocs: number;
}

export interface MetadataBreakdownItem {
  label: string;
  count: number;
  sharePct: number;
  totalCitations: number;
  avgCitations: number;
}

export type StratifyDimension =
  | 'none'
  | 'funding-status'
  | 'funding-agency'
  | 'research-subject'
  | 'open-access'
  | 'database'
  | 'collaboration-type'
  | 'publication-era';

export interface StratumGroup {
  id: string;
  label: string;
  color: string;
  records: BibRecord[];
  documents: number;
  sharePct: number;
  totalCitations: number;
  avgCitations: number;
  hIndex: number;
  gIndex: number;
  fundedPct: number;
  openAccessPct: number;
  mcpPct: number;
  annualGrowthPct: number;
}

export interface StratifiedAnnualPoint {
  year: number;
  totalArticles: number;
  meanTcPerArt: number;
  strataCounts: Record<string, number>;
  strataCitations: Record<string, number>;
}

export interface FunderSubjectMatrix {
  funders: string[];
  subjects: string[];
  cells: Record<
    string,
    {
      funder: string;
      subject: string;
      count: number;
      totalCitations: number;
      avgCitations: number;
    }
  >;
  maxCellCount: number;
}

