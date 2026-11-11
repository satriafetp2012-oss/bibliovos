import React, { useState, useRef } from 'react';
import {
  Upload,
  Search,
  Database,
  GitMerge,
  Split,
  Check,
  RefreshCw,
  FileText,
  Globe,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Download
} from 'lucide-react';
import {
  BibRecord,
  DatabaseSource,
  MergeConflictPair
} from '../types/bibliometrics';
import {
  detectAndParseBibliographicFile,
  fetchLiveScholarlyRecords
} from '../utils/parsersAndDeduplication';
import { SAMPLE_FORMAT_FILES } from '../data/sampleCorpus';

interface DataMergerViewProps {
  rawRecords: BibRecord[];
  masterRecords: BibRecord[];
  conflictPairs: MergeConflictPair[];
  splitPairIds: Set<string>;
  onAddRawRecords: (newRecords: BibRecord[], sourceLabel: string) => void;
  onToggleSplitPair: (pairId: string) => void;
  onResetSampleCorpus: () => void;
  onClearCorpus: () => void;
  onOpenExportModal: () => void;
}

const ALL_DATABASES: DatabaseSource[] = [
  'Scopus',
  'Web of Science',
  'PubMed',
  'OpenAlex',
  'CrossRef',
  'Dimensions',
  'RIS/BibTeX'
];

export const DataMergerView: React.FC<DataMergerViewProps> = ({
  rawRecords,
  masterRecords,
  conflictPairs,
  splitPairIds,
  onAddRawRecords,
  onToggleSplitPair,
  onResetSampleCorpus,
  onClearCorpus,
  onOpenExportModal
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'corpus' | 'conflicts' | 'live-api'>('corpus');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDbFilter, setSelectedDbFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'citations' | 'year' | 'title'>('citations');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [ingestionNotice, setIngestionNotice] = useState<string | null>(null);

  // Live API search state
  const [apiSource, setApiSource] = useState<'OpenAlex' | 'CrossRef' | 'PubMed'>('OpenAlex');
  const [apiQuery, setApiQuery] = useState('bibliometric analysis science mapping');
  const [apiFromYear, setApiFromYear] = useState(2020);
  const [apiLimit, setApiLimit] = useState(10);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiPreviewResults, setApiPreviewResults] = useState<BibRecord[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let totalAdded = 0;
    const formatsFound: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await file.text();
      const { detectedFormat, records } = detectAndParseBibliographicFile(text, file.name);
      if (records.length > 0) {
        totalAdded += records.length;
        formatsFound.push(`${file.name} (${detectedFormat}: ${records.length})`);
        onAddRawRecords(records, detectedFormat);
      }
    }

    if (totalAdded > 0) {
      setIngestionNotice(
        `Parsed and harmonized ${totalAdded} records from ${formatsFound.join(', ')}.`
      );
    } else {
      setIngestionNotice('No valid bibliographic records detected in the selected file(s).');
    }
    e.target.value = '';
  };

  const handleInjectSampleFormat = (key: keyof typeof SAMPLE_FORMAT_FILES) => {
    const sample = SAMPLE_FORMAT_FILES[key];
    if (!sample) return;
    const { detectedFormat, records } = detectAndParseBibliographicFile(
      sample.content,
      sample.filename
    );
    onAddRawRecords(records, detectedFormat);
    setIngestionNotice(
      `Imported ${records.length} records from ${sample.filename} (${detectedFormat}) and ran cross-database deduplication.`
    );
  };

  const handleRunLiveAPISearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiQuery.trim()) return;
    setApiLoading(true);
    setApiError(null);
    try {
      const results = await fetchLiveScholarlyRecords({
        database: apiSource,
        query: apiQuery,
        limit: apiLimit,
        fromYear: apiFromYear
      });
      setApiPreviewResults(results);
      if (results.length === 0) {
        setApiError(`No records returned from ${apiSource} for "${apiQuery}".`);
      }
    } catch (err: any) {
      setApiError(
        `Unable to reach ${apiSource} endpoint (${err?.message || 'network error'}). You can still import local files or sample batches.`
      );
    } finally {
      setApiLoading(false);
    }
  };

  const handleMergeApiResults = () => {
    if (apiPreviewResults.length === 0) return;
    onAddRawRecords(apiPreviewResults, `${apiSource} Live API`);
    setIngestionNotice(
      `Merged ${apiPreviewResults.length} live records from ${apiSource} into the master corpus.`
    );
    setApiPreviewResults([]);
    setActiveSubTab('corpus');
  };

  // Database breakdown stats
  const dbCounts = ALL_DATABASES.map((db) => {
    const rawCount = rawRecords.filter((r) => r.databases.includes(db)).length;
    const masterCount = masterRecords.filter((r) => r.databases.includes(db)).length;
    const multiDbCount = masterRecords.filter(
      (r) => r.databases.includes(db) && r.databases.length > 1
    ).length;
    return { db, rawCount, masterCount, multiDbCount };
  });

  const activeMergedCount = conflictPairs.filter((p) => p.status === 'merged').length;
  const multiSourceMasterCount = masterRecords.filter((r) => r.databases.length > 1).length;

  const filteredRecords = masterRecords
    .filter((r) => {
      if (selectedDbFilter === 'MULTI') return r.databases.length > 1;
      if (selectedDbFilter !== 'ALL' && !r.databases.includes(selectedDbFilter as DatabaseSource)) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.authors.some((a) => a.toLowerCase().includes(q)) ||
        r.source.toLowerCase().includes(q) ||
        r.doi.toLowerCase().includes(q) ||
        r.authorKeywords.some((k) => k.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'citations') return b.citations - a.citations;
      if (sortBy === 'year') return b.year - a.year;
      return a.title.localeCompare(b.title);
    });

  return (
    <div className="space-y-6">
      {/* Top Ingestion & Harmonization Summary Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Multi-Format File Dropzone & Quick Format Loader */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Multi-Database Ingestion & Schema Harmonizer
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Combine exports from Scopus, Web of Science, PubMed, OpenAlex, CrossRef, Dimensions, RIS, and BibTeX into canonical Bibliometrix tags.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={onResetSampleCorpus}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors whitespace-nowrap shrink-0"
                >
                  Reset Sample Corpus
                </button>
                <button
                  onClick={onClearCorpus}
                  className="px-2.5 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded transition-colors whitespace-nowrap shrink-0"
                >
                  Clear All
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".csv,.txt,.bib,.ris,.nbib,.ciw,.json"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-600 dark:hover:border-blue-500 bg-slate-50/70 dark:bg-slate-950/50 rounded-lg p-4 cursor-pointer transition-colors flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Drop bibliographic export files here or click to browse
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Auto-detects Scopus CSV · Web of Science Plain Text (.txt) · PubMed MEDLINE (.nbib) · BibTeX (.bib) · RIS (.ris) · OpenAlex JSON
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Select Files
              </button>
            </div>
          </div>

          {/* Quick Format Test Batches */}
          <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Test multi-format parser with sample database exports:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleInjectSampleFormat('scopusCsv')}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors whitespace-nowrap shrink-0"
              >
                + Scopus CSV Batch
              </button>
              <button
                onClick={() => handleInjectSampleFormat('wosPlaintext')}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors whitespace-nowrap shrink-0"
              >
                + Web of Science ISI (.txt)
              </button>
              <button
                onClick={() => handleInjectSampleFormat('pubmedMedline')}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors whitespace-nowrap shrink-0"
              >
                + PubMed MEDLINE (.nbib)
              </button>
            </div>
          </div>
        </div>

        {/* Right: Deduplication & Database Harmonization Telemetry */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Deduplication & Coverage Balance
              </h2>
              <span className="text-xs font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                ● {activeMergedCount} Duplicates Resolved
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
                <div className="text-xs text-slate-500 dark:text-slate-400">Raw Imported</div>
                <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                  {rawRecords.length}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Across {dbCounts.filter((d) => d.rawCount > 0).length} sources
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
                <div className="text-xs text-slate-500 dark:text-slate-400">Duplicates Merged</div>
                <div className="text-2xl font-mono font-bold tabular-nums text-blue-600 dark:text-blue-400 mt-0.5">
                  {activeMergedCount}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {conflictPairs.length} total pairs
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
                <div className="text-xs text-slate-500 dark:text-slate-400">Unified Corpus</div>
                <div className="text-2xl font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {masterRecords.length}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {multiSourceMasterCount} multi-DB records
                </div>
              </div>
            </div>
          </div>

          {/* Database Coverage Bar List */}
          <div className="space-y-1.5">
            {dbCounts.map(({ db, rawCount, masterCount, multiDbCount }) => (
              <div key={db} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/70 last:border-none">
                <span className="font-medium text-slate-700 dark:text-slate-300 w-32 truncate">
                  {db}
                </span>
                <div className="flex-1 mx-3 h-1.5 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-500"
                    style={{
                      width: `${Math.min(100, (masterCount / Math.max(1, masterRecords.length)) * 100)}%`
                    }}
                  />
                </div>
                <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {masterCount} recs · {multiDbCount} shared
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {ingestionNotice && (
        <div className="px-4 py-2.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-lg flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
          <span>{ingestionNotice}</span>
          <button
            onClick={() => setIngestionNotice(null)}
            className="text-blue-700 dark:text-blue-300 hover:underline ml-4 whitespace-nowrap"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sub-navigation Bar: Unified Corpus Explorer | Conflict Review Log | Live API Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 rounded-lg w-fit">
          <button
            onClick={() => setActiveSubTab('corpus')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === 'corpus'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Harmonized Master Corpus ({masterRecords.length})
          </button>
          <button
            onClick={() => setActiveSubTab('conflicts')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === 'conflicts'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Deduplication & Conflict Review Log ({conflictPairs.length})
          </button>
          <button
            onClick={() => setActiveSubTab('live-api')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === 'live-api'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Live Database API Search (OpenAlex · PubMed · CrossRef)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Export Harmonized Dataset
          </button>
        </div>
      </div>

      {/* TAB 1: MASTER HARMONIZED CORPUS TABLE */}
      {activeSubTab === 'corpus' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          {/* Filter & Search Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, author, source journal, DOI, or keyword..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedDbFilter}
                onChange={(e) => setSelectedDbFilter(e.target.value)}
                aria-label="Filter by source database"
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">All Databases ({masterRecords.length})</option>
                <option value="MULTI">Cross-Database Merged Only ({multiSourceMasterCount})</option>
                {ALL_DATABASES.map((db) => (
                  <option key={db} value={db}>
                    {db}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort records by"
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-700 dark:text-slate-200"
              >
                <option value="citations">Sort by Citations (High → Low)</option>
                <option value="year">Sort by Year (Newest → Oldest)</option>
                <option value="title">Sort by Title (A → Z)</option>
              </select>
            </div>
          </div>

          {/* High-Density Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-950/60">
                  <th className="py-2.5 px-4">Document Title & Canonical Metadata</th>
                  <th className="py-2.5 px-3">Authors (AU)</th>
                  <th className="py-2.5 px-3">Source (SO)</th>
                  <th className="py-2.5 px-3 text-right">Year (PY)</th>
                  <th className="py-2.5 px-3 text-right">Cited (TC)</th>
                  <th className="py-2.5 px-4">Database Provenance (DB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      No bibliographic records match the current filter. Try clearing the search query or resetting the sample corpus.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => {
                    const isExpanded = expandedRecordId === rec.id;
                    return (
                      <React.Fragment key={rec.id}>
                        <tr
                          onClick={() => setExpandedRecordId(isExpanded ? null : rec.id)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 max-w-md">
                            <div className="font-medium text-slate-900 dark:text-slate-100 leading-snug">
                              {rec.title}
                            </div>
                            {/* Zero-Pill Metadata Discipline: Clean unboxed text with · separators */}
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                              <span>{rec.docType}</span>
                              <span aria-hidden="true">·</span>
                              <span>{rec.doi ? `DOI: ${rec.doi}` : rec.ut}</span>
                              <span aria-hidden="true">·</span>
                              <span>{rec.authorKeywords.slice(0, 3).join(', ')}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 max-w-[180px] truncate">
                            {rec.authors.join('; ')}
                          </td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 max-w-[180px] truncate">
                            {rec.source}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                            {rec.year}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                            {rec.citations.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            <div className="flex items-center justify-between gap-2">
                              <span>
                                {rec.databases.join(' · ')}
                                {rec.databases.length > 1 ? ' (Merged)' : ''}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/90 dark:bg-slate-950/80">
                            <td colSpan={6} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                                <div className="md:col-span-7 space-y-2">
                                  <div>
                                    <span className="font-mono font-semibold text-slate-500">AB (Abstract): </span>
                                    <span className="text-slate-700 dark:text-slate-300">
                                      {rec.abstract || 'No abstract available in source export.'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-mono font-semibold text-slate-500">DE (Author Keywords): </span>
                                    <span className="text-slate-700 dark:text-slate-300">
                                      {rec.authorKeywords.join(' · ') || 'None'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-mono font-semibold text-slate-500">ID (Keywords Plus / MeSH): </span>
                                    <span className="text-slate-700 dark:text-slate-300">
                                      {rec.indexKeywords.join(' · ') || 'None'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-mono font-semibold text-slate-500">C1 (Affiliations & Countries): </span>
                                    <span className="text-slate-700 dark:text-slate-300">
                                      {rec.affiliations.join(' ; ')} ({rec.countries.join(', ')})
                                    </span>
                                  </div>
                                </div>
                                <div className="md:col-span-5 space-y-2 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 md:pl-4">
                                  <div className="font-mono font-semibold text-slate-500">
                                    CR (Harmonized Cited References — {rec.references.length}):
                                  </div>
                                  <ul className="space-y-1 font-mono text-[11px] text-slate-600 dark:text-slate-400 max-h-28 overflow-y-auto">
                                    {rec.references.map((ref, idx) => (
                                      <li key={idx} className="truncate">
                                        {idx + 1}. {ref}
                                      </li>
                                    ))}
                                  </ul>
                                  {rec.mergedFrom && rec.mergedFrom.length > 1 && (
                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                                        Harmonized from {rec.mergedFrom.length} database records:{' '}
                                      </span>
                                      <span className="font-mono text-slate-600 dark:text-slate-400">
                                        {rec.mergedFrom
                                          .map((m) => `${m.sourceDb} (TC: ${m.citations})`)
                                          .join(' · ')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE DEDUPLICATION & CONFLICT REVIEW LOG */}
      {activeSubTab === 'conflicts' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-800">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Cross-Database Duplicate Detection & Field Harmonization Log
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Records matched via Exact DOI normalization or Fuzzy Title + First Author + Year similarity. Toggle any pair to keep merged or split as distinct publications.
              </p>
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
              {activeMergedCount} Merged · {conflictPairs.length - activeMergedCount} Split
            </div>
          </div>

          {conflictPairs.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              No duplicate pairs detected in the current corpus. Upload overlapping exports or click "Reset Sample Corpus" to inspect cross-database deduplication.
            </div>
          ) : (
            conflictPairs.map((pair) => {
              const isMerged = pair.status === 'merged';
              return (
                <div key={pair.id} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {pair.matchReason}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        Similarity: {(pair.similarityScore * 100).toFixed(0)}%
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-500">
                        {pair.primaryRecord.databases.join(', ')} ↔ {pair.duplicateRecord.databases.join(', ')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className={isMerged ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                        {isMerged ? '● Merged into Master Record' : '▲ Split as Separate Records'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs">
                        <div className="font-mono text-[11px] text-slate-500">
                          Primary Source: {pair.primaryRecord.databases[0]} ({pair.primaryRecord.ut})
                        </div>
                        <div className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                          {pair.primaryRecord.title}
                        </div>
                        <div className="text-slate-500 mt-1 font-mono tabular-nums">
                          {pair.primaryRecord.authors.slice(0, 3).join('; ')} · {pair.primaryRecord.year} · TC: {pair.primaryRecord.citations}
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs">
                        <div className="font-mono text-[11px] text-slate-500">
                          Matched Duplicate: {pair.duplicateRecord.databases[0]} ({pair.duplicateRecord.ut})
                        </div>
                        <div className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                          {pair.duplicateRecord.title}
                        </div>
                        <div className="text-slate-500 mt-1 font-mono tabular-nums">
                          {pair.duplicateRecord.authors.slice(0, 3).join('; ')} · {pair.duplicateRecord.year} · TC: {pair.duplicateRecord.citations}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Harmonized actions: {pair.mergedFieldsSummary.join(' · ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onToggleSplitPair(pair.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                        isMerged
                          ? 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          : 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isMerged ? (
                        <>
                          <Split className="w-3.5 h-3.5" />
                          Split Record
                        </>
                      ) : (
                        <>
                          <GitMerge className="w-3.5 h-3.5" />
                          Keep Merged
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: LIVE API CONNECTOR (OPENALEX, CROSSREF, PUBMED) */}
      {activeSubTab === 'live-api' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Live Scholarly Database Query & Direct Ingestion
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Fetch live bibliographic metadata directly from OpenAlex, CrossRef, or PubMed (NCBI E-utilities) and merge with your existing corpus.
            </p>
          </div>

          <form onSubmit={handleRunLiveAPISearch} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Database Provider
              </label>
              <select
                value={apiSource}
                onChange={(e) => setApiSource(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md"
              >
                <option value="OpenAlex">OpenAlex REST API (240M+ works)</option>
                <option value="CrossRef">CrossRef Works API (DOI & Citations)</option>
                <option value="PubMed">PubMed NCBI E-Utilities (Biomedical)</option>
              </select>
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Search Query (Title / Keywords / Topic)
              </label>
              <input
                type="text"
                value={apiQuery}
                onChange={(e) => setApiQuery(e.target.value)}
                placeholder="e.g. large language models clinical decision support"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                From Year
              </label>
              <input
                type="number"
                min={1980}
                max={2026}
                value={apiFromYear}
                onChange={(e) => setApiFromYear(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Limit
              </label>
              <select
                value={apiLimit}
                onChange={(e) => setApiLimit(Number(e.target.value))}
                className="w-full px-2 py-2 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={apiLoading}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors whitespace-nowrap"
              >
                <Globe className="w-3.5 h-3.5" />
                {apiLoading ? 'Querying...' : `Search ${apiSource}`}
              </button>
            </div>
          </form>

          {apiError && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
              {apiError}
            </div>
          )}

          {apiPreviewResults.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Retrieved {apiPreviewResults.length} records from {apiSource}
                </span>
                <button
                  onClick={handleMergeApiResults}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Merge All {apiPreviewResults.length} Records into Active Corpus
                </button>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-md max-h-80 overflow-y-auto">
                {apiPreviewResults.map((item) => (
                  <div key={item.id} className="p-3 text-xs flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {item.title}
                      </div>
                      <div className="text-slate-500 mt-0.5 font-mono tabular-nums">
                        {item.authors.slice(0, 4).join('; ')} · {item.source} · {item.year} · Citations: {item.citations}
                      </div>
                    </div>
                    <span className="font-mono text-slate-500 shrink-0">{item.databases[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
