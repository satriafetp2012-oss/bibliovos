export type DatabaseSource =
  | 'Scopus'
  | 'Web of Science'
  | 'PubMed'
  | 'OpenAlex'
  | 'CrossRef'
  | 'Dimensions'
  | 'RIS/BibTeX';

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
  references: string[]; // CR (e.g., "Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007")
  docType: string; // Article, Review, Proceedings Paper
  databases: DatabaseSource[]; // DB provenance
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
  | 'authors'
  | 'countries'
  | 'organizations'
  | 'sources'
  | 'documents';

export type VOSViewMode = 'network' | 'overlay' | 'density';
export type VOSOverlayColorBy = 'avgYear' | 'avgCitations' | 'normCitations';
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
  | 'affiliations';

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
