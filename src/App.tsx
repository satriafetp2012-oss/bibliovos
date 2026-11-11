/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Download,
  Sun,
  Moon,
  Filter,
  X,
  FileSpreadsheet,
  FileCode,
  FileText
} from 'lucide-react';
import { INITIAL_RAW_RECORDS } from './data/sampleCorpus';
import {
  BibRecord,
  DatabaseSource
} from './types/bibliometrics';
import {
  exportMasterCorpus,
  harmonizeAndDeduplicate
} from './utils/parsersAndDeduplication';
import { DataMergerView } from './components/DataMergerView';
import { VOSViewerStudio } from './components/VOSViewerStudio';
import { OverviewAndSankeyView } from './components/OverviewAndSankeyView';
import { SourcesAndAuthorsView } from './components/SourcesAndAuthorsView';
import { ConceptualAndRPYSView } from './components/ConceptualAndRPYSView';
import { PWAInstallControl, OfflineIndicator } from './components/PWAInstallControl';

type ActiveModule =
  | 'merger'
  | 'vosviewer'
  | 'overview'
  | 'sources-authors'
  | 'conceptual-rpys';

const STORAGE_KEY_RECORDS = 'bibliovos_raw_records_v1';
const STORAGE_KEY_SPLITS = 'bibliovos_split_pairs_v1';

export default function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('merger');
  const [rawRecords, setRawRecords] = useState<BibRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback to initial sample corpus
    }
    return INITIAL_RAW_RECORDS;
  });
  const [splitPairIds, setSplitPairIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SPLITS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {
      // Fallback to empty set
    }
    return new Set();
  });
  const [globalDbFilter, setGlobalDbFilter] = useState<string>('ALL');
  const [minYearFilter, setMinYearFilter] = useState<number>(2017);
  const [maxYearFilter, setMaxYearFilter] = useState<number>(2026);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(rawRecords));
    } catch {
      // Ignore storage quota errors
    }
  }, [rawRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SPLITS, JSON.stringify(Array.from(splitPairIds)));
    } catch {
      // Ignore storage quota errors
    }
  }, [splitPairIds]);

  // Run multi-database harmonization and deduplication
  const { masterRecords, conflictPairs } = useMemo(
    () => harmonizeAndDeduplicate(rawRecords, splitPairIds),
    [rawRecords, splitPairIds]
  );

  // Global filtered master corpus feeding VOSviewer and Bibliometrix views
  const activeCorpus = useMemo(() => {
    return masterRecords.filter((rec) => {
      if (rec.year < minYearFilter || rec.year > maxYearFilter) return false;
      if (
        globalDbFilter !== 'ALL' &&
        !rec.databases.includes(globalDbFilter as DatabaseSource)
      ) {
        return false;
      }
      return true;
    });
  }, [masterRecords, minYearFilter, maxYearFilter, globalDbFilter]);

  const handleAddRawRecords = (incoming: BibRecord[]) => {
    setRawRecords((prev) => [...prev, ...incoming]);
  };

  const handleToggleSplitPair = (pairId: string) => {
    setSplitPairIds((prev) => {
      const next = new Set(prev);
      if (next.has(pairId)) next.delete(pairId);
      else next.add(pairId);
      return next;
    });
  };

  const handleResetSampleCorpus = () => {
    setRawRecords(INITIAL_RAW_RECORDS);
    setSplitPairIds(new Set());
    setGlobalDbFilter('ALL');
    setMinYearFilter(2017);
    setMaxYearFilter(2026);
  };

  const handleClearCorpus = () => {
    setRawRecords([]);
    setSplitPairIds(new Set());
  };

  const handleTriggerDownload = (format: 'csv' | 'bibtex' | 'ris' | 'json') => {
    const { content, filename, mimeType } = exportMasterCorpus(activeCorpus, format);
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setExportModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveModule('merger');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display whitespace-nowrap shrink-0"
        >
          BiblioVOS Studio
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400 overflow-x-auto">
          <button
            onClick={() => setActiveModule('merger')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeModule === 'merger'
                ? 'border-blue-600 text-slate-900 dark:text-white font-semibold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Data Merger
          </button>
          <button
            onClick={() => setActiveModule('vosviewer')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeModule === 'vosviewer'
                ? 'border-blue-600 text-slate-900 dark:text-white font-semibold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            VOSviewer Map
          </button>
          <button
            onClick={() => setActiveModule('overview')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeModule === 'overview'
                ? 'border-blue-600 text-slate-900 dark:text-white font-semibold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Overview & Sankey
          </button>
          <button
            onClick={() => setActiveModule('sources-authors')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeModule === 'sources-authors'
                ? 'border-blue-600 text-slate-900 dark:text-white font-semibold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Sources & Authors
          </button>
          <button
            onClick={() => setActiveModule('conceptual-rpys')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeModule === 'conceptual-rpys'
                ? 'border-blue-600 text-slate-900 dark:text-white font-semibold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Conceptual & RPYS
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => setExportModalOpen(true)}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Export Corpus
          </button>
        </div>
      </header>

      {/* Contextual Workspace Calibration & Filter Ribbon */}
      <div className="bg-slate-100/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 px-6 py-2">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 font-mono tabular-nums text-slate-600 dark:text-slate-400">
            <span className="font-sans font-semibold text-slate-800 dark:text-slate-200">
              Active Unified Corpus:
            </span>
            <span>{activeCorpus.length} Harmonized Docs</span>
            <span aria-hidden="true">·</span>
            <span>
              {conflictPairs.filter((p) => p.status === 'merged').length} Cross-DB Duplicates Merged
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Total Citations: {activeCorpus.reduce((s, r) => s + r.citations, 0).toLocaleString()}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Source DB:</span>
              <select
                value={globalDbFilter}
                onChange={(e) => setGlobalDbFilter(e.target.value)}
                aria-label="Global database filter"
                className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded"
              >
                <option value="ALL">All Merged Databases</option>
                <option value="Scopus">Scopus</option>
                <option value="Web of Science">Web of Science</option>
                <option value="PubMed">PubMed</option>
                <option value="OpenAlex">OpenAlex</option>
                <option value="CrossRef">CrossRef</option>
                <option value="Dimensions">Dimensions</option>
                <option value="RIS/BibTeX">RIS / BibTeX</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 font-mono tabular-nums">
              <span className="font-sans text-slate-500">Years:</span>
              <input
                type="number"
                min={1990}
                max={maxYearFilter}
                value={minYearFilter}
                onChange={(e) => setMinYearFilter(Number(e.target.value))}
                aria-label="Start publication year"
                className="w-16 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-center"
              />
              <span>–</span>
              <input
                type="number"
                min={minYearFilter}
                max={2026}
                value={maxYearFilter}
                onChange={(e) => setMaxYearFilter(Number(e.target.value))}
                aria-label="End publication year"
                className="w-16 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-center"
              />
            </div>

            <button
              onClick={() => setDarkMode((d) => !d)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
              {darkMode ? 'Academic Light Mode' : 'Dark Workspace'}
            </button>

            <PWAInstallControl />
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6">
        {activeModule === 'merger' && (
          <DataMergerView
            rawRecords={rawRecords}
            masterRecords={masterRecords}
            conflictPairs={conflictPairs}
            splitPairIds={splitPairIds}
            onAddRawRecords={handleAddRawRecords}
            onToggleSplitPair={handleToggleSplitPair}
            onResetSampleCorpus={handleResetSampleCorpus}
            onClearCorpus={handleClearCorpus}
            onOpenExportModal={() => setExportModalOpen(true)}
          />
        )}

        {activeModule === 'vosviewer' && <VOSViewerStudio records={activeCorpus} />}

        {activeModule === 'overview' && <OverviewAndSankeyView records={activeCorpus} />}

        {activeModule === 'sources-authors' && <SourcesAndAuthorsView records={activeCorpus} />}

        {activeModule === 'conceptual-rpys' && <ConceptualAndRPYSView records={activeCorpus} />}
      </main>

      {/* Export Unified Corpus Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Export Harmonized Master Corpus ({activeCorpus.length} Records)
              </h3>
              <button
                onClick={() => setExportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Download your deduplicated, field-harmonized dataset for direct use in R <code className="font-mono">bibliometrix</code>, desktop VOSviewer, or reference managers.
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => handleTriggerDownload('csv')}
                className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 hover:border-blue-600 dark:hover:border-blue-500 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Bibliometrix & VOSviewer CSV (.csv)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Harmonized columns (TI, AU, SO, PY, TC, DI, DE, ID, AB, C1, CR, DB)
                    </div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => handleTriggerDownload('bibtex')}
                className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 hover:border-blue-600 dark:hover:border-blue-500 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileCode className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Unified BibTeX (.bib)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Compatible with R bibliometrix convert2df(), LaTeX, and Zotero
                    </div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => handleTriggerDownload('ris')}
                className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 hover:border-blue-600 dark:hover:border-blue-500 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Universal RIS Format (.ris)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Compatible with VOSviewer, EndNote, Mendeley, and Rayyan
                    </div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => handleTriggerDownload('json')}
                className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 hover:border-blue-600 dark:hover:border-blue-500 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileCode className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Full Provenance JSON (.json)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Preserves merged source snapshots and per-database citation counts
                    </div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      <OfflineIndicator />
    </div>
  );
}
