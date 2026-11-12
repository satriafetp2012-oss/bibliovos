import React, { useState, useMemo, useRef } from 'react';
import {
  CheckCircle2,
  Download,
  FileCode,
  FileSpreadsheet,
  FileText,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import {
  BibRecord,
  MergeConflictPair,
  StratifyDimension
} from '../types/bibliometrics';
import { STRATIFY_DIMENSION_LABELS } from '../utils/bibliometricEngine';
import {
  computeDataQualityAudit,
  enrichAndStandardizeRecords,
  generateManuscriptReport,
  ManuscriptCitationStyle,
  ManuscriptJournalTemplate
} from '../utils/qualityAndManuscriptEngine';
import { exportManuscriptToMultiPagePdf } from '../utils/exportMediaEngine';
import { CardExportToolbar } from './ExportToolbar';

interface QualityAndManuscriptViewProps {
  records: BibRecord[];
  rawRecords: BibRecord[];
  conflictPairs: MergeConflictPair[];
  stratifyBy: StratifyDimension;
  onChangeStratifyBy: (dim: StratifyDimension) => void;
  onUpdateRawRecords: (updated: BibRecord[]) => void;
}

export const QualityAndManuscriptView: React.FC<QualityAndManuscriptViewProps> = ({
  records,
  rawRecords,
  conflictPairs,
  stratifyBy,
  onChangeStratifyBy,
  onUpdateRawRecords
}) => {
  const [subView, setSubView] = useState<'quality' | 'manuscript'>('quality');
  const [selectedMissingTagFilter, setSelectedMissingTagFilter] = useState<string>('ALL');
  const [enrichmentMessage, setEnrichmentMessage] = useState<string | null>(null);
  const [copiedClipboard, setCopiedClipboard] = useState<boolean>(false);

  // Manuscript configuration state
  const [customTitle, setCustomTitle] = useState<string>('');
  const [authorsLine, setAuthorsLine] = useState<string>(
    'Scientometric Research Consortium; Department of Quantitative Science Studies'
  );
  const [affiliationLine, setAffiliationLine] = useState<string>(
    'Center for Bibliometric Intelligence & Science Mapping, Global Research Institute'
  );
  const [journalTemplate, setJournalTemplate] = useState<ManuscriptJournalTemplate>(
    'Scientometrics (Springer Nature)'
  );
  const [citationStyle, setCitationStyle] = useState<ManuscriptCitationStyle>('APA7');

  // Refs for individual exportable cards
  const completenessChartRef = useRef<HTMLDivElement | null>(null);
  const completenessTableRef = useRef<HTMLDivElement | null>(null);
  const dbHeatmapRef = useRef<HTMLDivElement | null>(null);
  const anomalyTableRef = useRef<HTMLDivElement | null>(null);
  const prismaDiagramRef = useRef<HTMLDivElement | null>(null);
  const manuscriptPreviewRef = useRef<HTMLDivElement | null>(null);

  const qualityAudit = useMemo(() => computeDataQualityAudit(records), [records]);

  const manuscript = useMemo(
    () =>
      generateManuscriptReport(records, rawRecords, conflictPairs, {
        customTitle,
        authorsLine,
        affiliationLine,
        journalTemplate,
        citationStyle,
        stratifyDimension: stratifyBy
      }),
    [
      records,
      rawRecords,
      conflictPairs,
      customTitle,
      authorsLine,
      affiliationLine,
      journalTemplate,
      citationStyle,
      stratifyBy
    ]
  );

  const filteredAnomalies = useMemo(() => {
    if (selectedMissingTagFilter === 'ALL') return qualityAudit.anomalies;
    return qualityAudit.anomalies.filter((a) =>
      a.missingTags.includes(selectedMissingTagFilter)
    );
  }, [qualityAudit.anomalies, selectedMissingTagFilter]);

  const handleAutoEnrich = () => {
    const { updatedRecords, enrichedFieldsCount } =
      enrichAndStandardizeRecords(rawRecords);
    onUpdateRawRecords(updatedRecords);
    setEnrichmentMessage(
      `Standardized & enriched ${enrichedFieldsCount} metadata field(s) across the raw corpus (DOI prefixes normalized, missing keywords inferred, OA/Language defaults harmonized).`
    );
  };

  const handleDownloadTextFile = (
    content: string,
    filename: string,
    mimeType: string
  ) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadManuscriptPdf = () => {
    exportManuscriptToMultiPagePdf(
      manuscript.title,
      manuscript.authorsLine,
      `${manuscript.affiliationLine} · Format: ${manuscript.journalTemplate} · Citations: ${manuscript.citationStyle}`,
      manuscript.sections,
      'bibliovos_manuscript_report'
    );
  };

  const handleCopyManuscript = async () => {
    try {
      await navigator.clipboard.writeText(manuscript.markdownContent);
      setCopiedClipboard(true);
      setTimeout(() => setCopiedClipboard(false), 2000);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Mode Switcher Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Data Quality Audit (bibliometrix::missingData) & Manuscript-Level Report Generator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Inspect field-level metadata completeness across databases, auto-remediate anomalies, and generate publication-ready IMRaD + PRISMA-S manuscripts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
            <button
              onClick={() => setSubView('quality')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                subView === 'quality'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              1. Data Quality Audit (missingData)
            </button>
            <button
              onClick={() => setSubView('manuscript')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                subView === 'manuscript'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              2. Manuscript-Level Report (IMRaD / PRISMA)
            </button>
          </div>
        </div>
      </div>

      {subView === 'quality' ? (
        <div className="space-y-6">
          {/* Quality Summary KPI Strip + Auto-Enrich Action */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Corpus Metadata Integrity & Completeness Summary
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Evaluates 16 standard Web of Science / Scopus / Bibliometrix tags across N = {qualityAudit.totalRecords} active records.
                </p>
              </div>

              <button
                onClick={handleAutoEnrich}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Auto-Standardize & Enrich Missing Metadata
              </button>
            </div>

            {enrichmentMessage && (
              <div className="p-3 rounded bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{enrichmentMessage}</span>
                </div>
                <button
                  onClick={() => setEnrichmentMessage(null)}
                  className="text-xs underline shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
                <div className="text-xs text-slate-500 dark:text-slate-400">Overall Completeness</div>
                <div className="text-2xl font-mono font-bold tabular-nums text-blue-600 dark:text-blue-400 mt-0.5">
                  {qualityAudit.overallCompletenessPct}%
                </div>
                <div className="text-xs font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Grade: {qualityAudit.overallGrade}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
                <div className="text-xs text-slate-500 dark:text-slate-400">DOI Coverage (DI)</div>
                <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                  {qualityAudit.doiCoveragePct}%
                </div>
                <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
                  Deterministic match key
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
                <div className="text-xs text-slate-500 dark:text-slate-400">Cited Refs (CR)</div>
                <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                  {qualityAudit.referencesCoveragePct}%
                </div>
                <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
                  RPYS & Coupling ready
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
                <div className="text-xs text-slate-500 dark:text-slate-400">Abstracts (AB)</div>
                <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                  {qualityAudit.abstractCoveragePct}%
                </div>
                <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
                  Full-text lexical scope
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
                <div className="text-xs text-slate-500 dark:text-slate-400">Funding Sponsors (FU)</div>
                <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                  {qualityAudit.fundingCoveragePct}%
                </div>
                <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
                  Grant-funded records
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
                <div className="text-xs text-slate-500 dark:text-slate-400">Multi-DB Corroborated</div>
                <div className="text-2xl font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {qualityAudit.multiSourceCorroboratedPct}%
                </div>
                <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
                  {qualityAudit.multiSourceCorroboratedCount} multi-source docs
                </div>
              </div>
            </div>
          </div>

          {/* Row 1: Visual Completeness Bar Graph & Cross-Database Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: Visual Completeness Bar Graph */}
            <div
              ref={completenessChartRef}
              data-export-enhanced="true"
              className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Metadata Completeness Spectrum by Tag (bibliometrix::missingData)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Percentage of present vs. missing records per bibliographic tag across the active corpus.
                  </p>
                </div>
                <CardExportToolbar
                  targetRef={completenessChartRef}
                  title="Metadata_Completeness_Spectrum"
                />
              </div>

              <div className="bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded p-3">
                <svg viewBox="0 0 540 365" className="w-full h-[345px]">
                  {qualityAudit.fields.map((f, idx) => {
                    const y = 16 + idx * 21.5;
                    const barW = (f.completenessPct / 100) * 300;
                    return (
                      <g key={f.tag}>
                        <text
                          x={140}
                          y={y + 11}
                          textAnchor="end"
                          className="text-[10.5px] font-mono fill-slate-700 dark:fill-slate-300"
                        >
                          {f.tag} · {f.label.length > 18 ? f.label.slice(0, 17) + '…' : f.label}
                        </text>
                        <rect
                          x={148}
                          y={y}
                          width={300}
                          height={14}
                          rx={2}
                          fill="#E2E8F0"
                          className="dark:fill-slate-800"
                        />
                        <rect
                          x={148}
                          y={y}
                          width={Math.max(2, barW)}
                          height={14}
                          rx={2}
                          fill={f.statusColor}
                        >
                          <title>
                            {f.tag} ({f.label}): {f.completenessPct}% Complete ({f.missingPct}% Missing) — {f.status}
                          </title>
                        </rect>
                        <text
                          x={456}
                          y={y + 11}
                          className="text-[10px] font-mono font-semibold fill-slate-800 dark:fill-slate-200"
                        >
                          {f.completenessPct}% ({f.status})
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Right: Cross-Database Metadata Completeness Heatmap (DB x Tag) */}
            <div
              ref={dbHeatmapRef}
              data-export-enhanced="true"
              className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Cross-Database Field Completeness Matrix (DB × Tag %)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Compares metadata richness across source databases to diagnose single-source gaps.
                  </p>
                </div>
                <CardExportToolbar
                  targetRef={dbHeatmapRef}
                  title="Cross_Database_Field_Completeness_Matrix"
                  includeCsv
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/60 dark:bg-slate-950/60">
                      <th className="py-2 px-2">Tag</th>
                      {qualityAudit.databaseList.map((db) => (
                        <th key={db} className="py-2 px-2 text-center">
                          {db === 'Web of Science' ? 'WoS' : db}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono tabular-nums">
                    {qualityAudit.fields.slice(0, 13).map((f) => (
                      <tr key={f.tag}>
                        <td
                          className="py-1.5 px-2 font-semibold text-slate-900 dark:text-slate-100"
                          title={f.label}
                        >
                          {f.tag}
                        </td>
                        {qualityAudit.databaseList.map((db) => {
                          const pct = qualityAudit.dbFieldMatrix[`${db}|||${f.tag}`] ?? 0;
                          const alpha = 0.12 + (pct / 100) * 0.55;
                          return (
                            <td
                              key={db}
                              style={{
                                backgroundColor:
                                  pct >= 80
                                    ? `rgba(16, 185, 129, ${alpha})`
                                    : pct >= 50
                                    ? `rgba(37, 99, 235, ${alpha})`
                                    : `rgba(245, 158, 11, ${alpha})`
                              }}
                              className="py-1.5 px-2 text-center border border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-900 dark:text-white"
                            >
                              {pct}%
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Row 2: Full bibliometrix::missingData() Completeness Table */}
          <div
            ref={completenessTableRef}
            data-export-enhanced="true"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Bibliometrix Field Completeness Audit Table (missingData Protocol)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Thresholds: Excellent (0% missing) · Good (&le;10%) · Acceptable (&le;20%) · Poor (&le;50%) · Critical (&gt;50%).
                </p>
              </div>
              <CardExportToolbar
                targetRef={completenessTableRef}
                title="Bibliometrix_MissingData_Audit_Table"
                includeCsv
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/60 dark:bg-slate-950/60">
                    <th className="py-2.5 px-3">Tag</th>
                    <th className="py-2.5 px-3">Bibliographic Field Description</th>
                    <th className="py-2.5 px-3 text-right">Present (N)</th>
                    <th className="py-2.5 px-3 text-right">Missing (N)</th>
                    <th className="py-2.5 px-3 text-right">Completeness %</th>
                    <th className="py-2.5 px-3 text-right">Missing %</th>
                    <th className="py-2.5 px-3">Quality Status</th>
                    <th className="py-2.5 px-3">Dependent Analytical Modules</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono tabular-nums">
                  {qualityAudit.fields.map((f) => (
                    <tr
                      key={f.tag}
                      onClick={() =>
                        setSelectedMissingTagFilter(
                          selectedMissingTagFilter === f.tag ? 'ALL' : f.tag
                        )
                      }
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400">
                        {f.tag}
                      </td>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                        {f.label}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200">
                        {f.presentCount}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
                        {f.missingCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                        {f.completenessPct}%
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
                        {f.missingPct}%
                      </td>
                      <td className="py-2.5 px-3 font-sans font-semibold">
                        <span style={{ color: f.statusColor }}>{f.status}</span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-500 dark:text-slate-400">
                        {f.dependentModules}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 3: Record-Level Anomaly & Missing Tag Inspector */}
          <div
            ref={anomalyTableRef}
            data-export-enhanced="true"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Record-Level Metadata Completeness & Missing Tag Diagnostics ({filteredAnomalies.length} Records)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Inspect individual publications with missing optional or core bibliographic fields.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedMissingTagFilter}
                  onChange={(e) => setSelectedMissingTagFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
                >
                  <option value="ALL">All Incomplete Records ({qualityAudit.anomalies.length})</option>
                  {qualityAudit.fields
                    .filter((f) => f.missingCount > 0)
                    .map((f) => (
                      <option key={f.tag} value={f.tag}>
                        Missing {f.tag} ({f.label}) — {f.missingCount} docs
                      </option>
                    ))}
                </select>
                <CardExportToolbar
                  targetRef={anomalyTableRef}
                  title="Record_Level_Metadata_Anomalies"
                  includeCsv
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/60 dark:bg-slate-950/60">
                    <th className="py-2 px-3">Record ID</th>
                    <th className="py-2 px-3">Publication Title (TI)</th>
                    <th className="py-2 px-2 text-right">Year</th>
                    <th className="py-2 px-3">Source Database(s)</th>
                    <th className="py-2 px-2 text-right">Completeness</th>
                    <th className="py-2 px-3">Missing Tags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono tabular-nums">
                  {filteredAnomalies.map((item) => (
                    <tr key={item.recordId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2 px-3 text-slate-500">{item.recordId}</td>
                      <td className="py-2 px-3 font-sans font-medium text-slate-900 dark:text-slate-100 max-w-md truncate">
                        {item.title}
                      </td>
                      <td className="py-2 px-2 text-right">{item.year}</td>
                      <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">
                        {item.databases.join(' · ')}
                      </td>
                      <td className="py-2 px-2 text-right font-semibold text-blue-600 dark:text-blue-400">
                        {item.completenessScore}%
                      </td>
                      <td className="py-2 px-3 text-amber-600 dark:text-amber-400">
                        {item.missingTags.join(' · ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* SUB-VIEW 2: MANUSCRIPT-LEVEL REPORT GENERATOR */
        <div className="space-y-6">
          {/* Manuscript Calibration & Multi-Format Export Controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Manuscript-Level Scientometric Report Configuration & Export Suite
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Synthesizes a complete IMRaD + PRISMA-S / BIBLIO academic manuscript with statistical tables, stratified cohorts, and formatted references.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={handleDownloadManuscriptPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Full PDF Manuscript (.pdf)
                </button>
                <button
                  onClick={() =>
                    handleDownloadTextFile(
                      manuscript.wordHtmlContent,
                      'bibliovos_manuscript.doc',
                      'application/msword'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Word (.doc)
                </button>
                <button
                  onClick={() =>
                    handleDownloadTextFile(
                      manuscript.latexContent,
                      'bibliovos_manuscript.tex',
                      'application/x-tex'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
                >
                  <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                  LaTeX (.tex)
                </button>
                <button
                  onClick={() =>
                    handleDownloadTextFile(
                      manuscript.markdownContent,
                      'bibliovos_manuscript.md',
                      'text/markdown'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                  Markdown (.md)
                </button>
                <button
                  onClick={handleCopyManuscript}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  {copiedClipboard ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Text
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Manuscript Metadata Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="md:col-span-6">
                <label className="block text-slate-500 font-medium mb-1">
                  Manuscript Title (Leave blank for auto-generated domain title)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={manuscript.title}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-slate-500 font-medium mb-1">
                  Target Journal Template
                </label>
                <select
                  value={journalTemplate}
                  onChange={(e) => setJournalTemplate(e.target.value as ManuscriptJournalTemplate)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
                >
                  <option value="Scientometrics (Springer Nature)">
                    Scientometrics (Springer Nature)
                  </option>
                  <option value="Journal of Informetrics (Elsevier)">
                    Journal of Informetrics (Elsevier)
                  </option>
                  <option value="Quantitative Science Studies (MIT Press)">
                    Quantitative Science Studies (MIT Press)
                  </option>
                  <option value="PLOS ONE (PRISMA / BIBLIO)">
                    PLOS ONE (PRISMA / BIBLIO)
                  </option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-slate-500 font-medium mb-1">
                  Citation Style & Cohort Stratification
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value as ManuscriptCitationStyle)}
                    className="px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
                  >
                    <option value="APA7">APA 7th</option>
                    <option value="Vancouver">Vancouver</option>
                    <option value="IEEE">IEEE</option>
                  </select>
                  <select
                    value={stratifyBy}
                    onChange={(e) => onChangeStratifyBy(e.target.value as StratifyDimension)}
                    className="px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
                  >
                    {(Object.entries(STRATIFY_DIMENSION_LABELS) as [StratifyDimension, string][]).map(
                      ([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="md:col-span-6">
                <label className="block text-slate-500 font-medium mb-1">Authors Line</label>
                <input
                  type="text"
                  value={authorsLine}
                  onChange={(e) => setAuthorsLine(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
                />
              </div>

              <div className="md:col-span-6">
                <label className="block text-slate-500 font-medium mb-1">
                  Institutional Affiliation Line
                </label>
                <input
                  type="text"
                  value={affiliationLine}
                  onChange={(e) => setAffiliationLine(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
                />
              </div>
            </div>
          </div>

          {/* Embedded Manuscript Figure 1: PRISMA-S Multi-Database Harmonization Flow Diagram */}
          <div
            ref={prismaDiagramRef}
            data-export-enhanced="true"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Figure 1. PRISMA-S / BIBLIO Multi-Database Identification & Deduplication Flow Diagram
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Publication-ready PRISMA flow chart documenting multi-database retrieval, duplicate resolution, and final corpus inclusion.
                </p>
              </div>
              <CardExportToolbar
                targetRef={prismaDiagramRef}
                title="Figure_1_PRISMA_Multi_Database_Flow_Diagram"
              />
            </div>

            <div className="bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3 overflow-x-auto">
              <svg viewBox="0 0 860 220" className="w-full h-[210px]">
                {/* Stage 1: Identification */}
                <rect
                  x={24}
                  y={24}
                  width={225}
                  height={165}
                  rx={6}
                  fill="#EFF6FF"
                  stroke="#2563EB"
                  strokeWidth={1.5}
                />
                <text x={136} y={46} textAnchor="middle" className="text-xs font-bold fill-blue-900">
                  1. Identification across Databases
                </text>
                <text
                  x={136}
                  y={64}
                  textAnchor="middle"
                  className="text-[11px] font-mono font-semibold fill-blue-700"
                >
                  Raw Pool: N = {manuscript.prismaCounts.rawTotal} Records
                </text>
                {manuscript.prismaCounts.perDatabase.slice(0, 6).map((d, idx) => (
                  <text
                    key={d.db}
                    x={42}
                    y={86 + idx * 16}
                    className="text-[10.5px] font-mono fill-slate-700"
                  >
                    • {d.db}: n = {d.count}
                  </text>
                ))}

                {/* Arrow 1 -> 2 */}
                <line x1={249} y1={106} x2={305} y2={106} stroke="#2563EB" strokeWidth={2} />
                <polygon points="305,101 315,106 305,111" fill="#2563EB" />

                {/* Stage 2: Deduplication & Harmonization */}
                <rect
                  x={315}
                  y={36}
                  width={235}
                  height={140}
                  rx={6}
                  fill="#F8FAFC"
                  stroke="#475569"
                  strokeWidth={1.5}
                />
                <text x={432} y={60} textAnchor="middle" className="text-xs font-bold fill-slate-900">
                  2. Cross-DB Deduplication
                </text>
                <text
                  x={432}
                  y={82}
                  textAnchor="middle"
                  className="text-[11px] font-mono font-semibold fill-rose-600"
                >
                  Duplicates Merged: -{manuscript.prismaCounts.duplicatesMerged}
                </text>
                <text x={432} y={104} textAnchor="middle" className="text-[10.5px] fill-slate-600">
                  Exact DOI + Fuzzy Title/Year/Author
                </text>
                <text x={432} y={124} textAnchor="middle" className="text-[10.5px] fill-slate-600">
                  Union of Keywords (DE/ID), Citations
                </text>
                <text
                  x={432}
                  y={148}
                  textAnchor="middle"
                  className="text-[11px] font-mono font-semibold fill-slate-800"
                >
                  Master Corpus: N = {manuscript.prismaCounts.harmonizedMaster}
                </text>

                {/* Arrow 2 -> 3 */}
                <line x1={550} y1={106} x2={606} y2={106} stroke="#10B981" strokeWidth={2} />
                <polygon points="606,101 616,106 606,111" fill="#10B981" />

                {/* Stage 3: Final Included Scientometric Corpus */}
                <rect
                  x={616}
                  y={36}
                  width={220}
                  height={140}
                  rx={6}
                  fill="#ECFDF5"
                  stroke="#10B981"
                  strokeWidth={1.8}
                />
                <text x={726} y={60} textAnchor="middle" className="text-xs font-bold fill-emerald-950">
                  3. Included in Synthesis
                </text>
                <text
                  x={726}
                  y={84}
                  textAnchor="middle"
                  className="text-sm font-mono font-bold fill-emerald-700"
                >
                  Active Corpus: N = {manuscript.prismaCounts.activeFiltered}
                </text>
                <text
                  x={726}
                  y={108}
                  textAnchor="middle"
                  className="text-[10.5px] font-mono fill-slate-700"
                >
                  Completeness: {qualityAudit.overallCompletenessPct}% ({qualityAudit.overallGrade})
                </text>
                <text
                  x={726}
                  y={128}
                  textAnchor="middle"
                  className="text-[10.5px] font-mono fill-slate-700"
                >
                  Multi-DB Verified: {qualityAudit.multiSourceCorroboratedPct}%
                </text>
                <text
                  x={726}
                  y={148}
                  textAnchor="middle"
                  className="text-[10.5px] font-mono fill-slate-700"
                >
                  Bibliometrix + VOSviewer Ready
                </text>
              </svg>
            </div>
          </div>

          {/* Full Typeset Manuscript Preview Sheet */}
          <div
            ref={manuscriptPreviewRef}
            data-export-enhanced="true"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 lg:p-8 space-y-6"
          >
            {/* Title Page Header */}
            <div className="border-b border-slate-200 dark:border-slate-800 pb-5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-blue-600 dark:text-blue-400">
                <span>
                  MANUSCRIPT DRAFT · {manuscript.journalTemplate.toUpperCase()}
                </span>
                <span>CITATION STYLE: {manuscript.citationStyle}</span>
              </div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {manuscript.title}
              </h1>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {manuscript.authorsLine}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                {manuscript.affiliationLine}
              </div>
            </div>

            {/* Manuscript Sections & Embedded Statistical Tables */}
            <div className="space-y-6">
              {manuscript.sections.map((sec, idx) => (
                <section key={idx} className="space-y-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    {sec.heading}
                  </h2>
                  <div className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {sec.paragraphs.map((para, pIdx) => (
                      <p key={pIdx} className="max-w-[85ch]">
                        {para}
                      </p>
                    ))}
                  </div>

                  {sec.table && (
                    <div className="my-4 bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {sec.table.caption}
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-y border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold bg-slate-100/80 dark:bg-slate-900">
                              {sec.table.headers.map((h, hIdx) => (
                                <th key={hIdx} className="py-2 px-2.5">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono tabular-nums">
                            {sec.table.rows.map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                className="hover:bg-white dark:hover:bg-slate-900/60"
                              >
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className={`py-2 px-2.5 ${
                                      cIdx === 0
                                        ? 'font-sans font-medium text-slate-900 dark:text-slate-100'
                                        : 'text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
