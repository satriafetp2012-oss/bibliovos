import React, { useState, useMemo } from 'react';
import {
  BibRecord,
  StratifyDimension
} from '../types/bibliometrics';
import {
  computeHistoriograph,
  computeRPYS,
  computeThematicMap,
  computeTrendTopics,
  partitionCorpusByStrata
} from '../utils/bibliometricEngine';
import { StratifiedCohortPanel } from './StratificationAndCharts';

interface ConceptualAndRPYSViewProps {
  records: BibRecord[];
  stratifyBy: StratifyDimension;
  onChangeStratifyBy: (dim: StratifyDimension) => void;
}

export const ConceptualAndRPYSView: React.FC<ConceptualAndRPYSViewProps> = ({
  records,
  stratifyBy,
  onChangeStratifyBy
}) => {
  const [thematicField, setThematicField] = useState<'authorKeywords' | 'indexKeywords'>(
    'authorKeywords'
  );
  const [selectedCohortLabel, setSelectedCohortLabel] = useState<string>('ALL');
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [selectedRpysYear, setSelectedRpysYear] = useState<number | null>(null);
  const [selectedHistNodeId, setSelectedHistNodeId] = useState<string | null>(null);

  const strata = useMemo(
    () => partitionCorpusByStrata(records, stratifyBy === 'none' ? 'funding-status' : stratifyBy),
    [records, stratifyBy]
  );

  const activeRecords = useMemo(() => {
    if (selectedCohortLabel === 'ALL') return records;
    const found = strata.find((s) => s.label === selectedCohortLabel);
    return found ? found.records : records;
  }, [records, strata, selectedCohortLabel]);

  const thematicClusters = useMemo(
    () => computeThematicMap(activeRecords, thematicField),
    [activeRecords, thematicField]
  );
  const trendTopics = useMemo(() => computeTrendTopics(activeRecords), [activeRecords]);
  const rpysPoints = useMemo(() => computeRPYS(activeRecords), [activeRecords]);
  const historiograph = useMemo(() => computeHistoriograph(activeRecords), [activeRecords]);

  const activeTheme =
    thematicClusters.find((t) => t.id === selectedThemeId) || thematicClusters[0] || null;

  const activeRpysPoint =
    rpysPoints.find((p) => p.year === selectedRpysYear) ||
    [...rpysPoints].sort((a, b) => b.citedReferencesCount - a.citedReferencesCount)[0] ||
    null;

  const activeHistNode =
    historiograph.nodes.find((n) => n.id === selectedHistNodeId) ||
    historiograph.nodes[0] ||
    null;

  const maxRpysCount = Math.max(1, ...rpysPoints.map((p) => p.citedReferencesCount));

  return (
    <div className="space-y-6">
      {/* Multi-Dimensional Stratified Cohort Comparison Panel */}
      <StratifiedCohortPanel
        records={records}
        stratifyBy={stratifyBy}
        onChangeStratifyBy={(dim) => {
          onChangeStratifyBy(dim);
          setSelectedCohortLabel('ALL');
        }}
        moduleTitle="Stratified Conceptual Structure & RPYS Cohort Benchmarking"
      />

      {/* Active Cohort Filter Bar for Conceptual & RPYS Diagrams */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          Filter Thematic Map, Trend Topics & RPYS Spectroscopy by Cohort:
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCohortLabel('ALL')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              selectedCohortLabel === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Corpus ({records.length})
          </button>
          {strata.map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedCohortLabel(st.label)}
              className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                selectedCohortLabel === st.label
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span
                className="w-2 h-2 rounded-xs shrink-0"
                style={{ backgroundColor: st.color }}
              />
              <span>
                {st.label} ({st.documents})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: Callon's Strategic Thematic Map & Trend Topics Evolution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Callon Strategic Thematic Map */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Thematic Map (Callon&apos;s Strategic Diagram)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Plots keyword clusters by Callon Centrality (Relevance Degree) and Callon Density (Development Degree).
              </p>
            </div>

            <select
              value={thematicField}
              onChange={(e) => setThematicField(e.target.value as any)}
              aria-label="Select keyword source for thematic map"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
            >
              <option value="authorKeywords">Author Keywords (DE)</option>
              <option value="indexKeywords">Keywords Plus / MeSH (ID)</option>
            </select>
          </div>

          {/* 4-Quadrant Strategic Diagram Canvas */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
            <svg viewBox="0 0 560 320" className="w-full h-[290px]">
              {/* Quadrant Divider Axes */}
              <line
                x1={280}
                y1={20}
                x2={280}
                y2={290}
                stroke="currentColor"
                className="text-slate-300 dark:text-slate-700"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
              <line
                x1={40}
                y1={155}
                x2={530}
                y2={155}
                stroke="currentColor"
                className="text-slate-300 dark:text-slate-700"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />

              {/* Quadrant Labels */}
              <text x={52} y={36} className="text-[11px] font-semibold fill-slate-400">
                Niche Themes (Specialized)
              </text>
              <text x={518} y={36} textAnchor="end" className="text-[11px] font-semibold fill-emerald-600 dark:fill-emerald-400">
                Motor Themes (Well-developed & Core)
              </text>
              <text x={52} y={280} className="text-[11px] font-semibold fill-slate-400">
                Emerging or Declining Themes
              </text>
              <text x={518} y={280} textAnchor="end" className="text-[11px] font-semibold fill-blue-600 dark:fill-blue-400">
                Basic & Transversal Themes
              </text>

              {/* Axis Titles */}
              <text x={285} y={310} textAnchor="middle" className="text-[11px] font-mono fill-slate-500">
                Relevance Degree (Callon Centrality) →
              </text>
              <text
                x={18}
                y={155}
                textAnchor="middle"
                transform="rotate(-90, 18, 155)"
                className="text-[11px] font-mono fill-slate-500"
              >
                Development Degree (Callon Density) →
              </text>

              {/* Cluster Bubbles */}
              {thematicClusters.map((theme) => {
                const cx = 40 + (theme.callonCentrality / 100) * 480;
                const cy = 285 - (theme.callonDensity / 100) * 255;
                const r = Math.max(16, Math.min(34, 12 + theme.occurrences * 1.4));
                const isSelected = activeTheme?.id === theme.id;

                return (
                  <g
                    key={theme.id}
                    onClick={() => setSelectedThemeId(theme.id)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={theme.color}
                      fillOpacity={0.78}
                      stroke={isSelected ? '#0F172A' : '#FFFFFF'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    <text
                      x={cx}
                      y={cy + 4}
                      textAnchor="middle"
                      className="text-[11px] font-semibold fill-slate-900 dark:fill-white pointer-events-none"
                    >
                      {theme.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {activeTheme && (
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {activeTheme.label} ({activeTheme.quadrant}):{' '}
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  {activeTheme.keywords.map((k) => `${k.term} (${k.count})`).join(' · ')}
                </span>
              </div>
              <span className="font-mono tabular-nums text-slate-500 shrink-0">
                Centrality: {activeTheme.callonCentrality} · Density: {activeTheme.callonDensity}
              </span>
            </div>
          )}
        </div>

        {/* Trend Topics Evolution */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Trend Topics Evolution
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Horizontal bars span Q1 to Q3 publication years; circle size marks topic frequency at median year.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <svg viewBox="0 0 420 340" className="w-full h-[330px]">
              {[2017, 2019, 2021, 2023, 2025, 2026].map((yr) => {
                const x = 145 + ((yr - 2017) / 9) * 250;
                return (
                  <g key={yr}>
                    <line
                      x1={x}
                      y1={15}
                      x2={x}
                      y2={310}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-slate-800"
                    />
                    <text
                      x={x}
                      y={328}
                      textAnchor="middle"
                      className="text-[10px] font-mono fill-slate-400"
                    >
                      {yr}
                    </text>
                  </g>
                );
              })}

              {trendTopics.slice(0, 12).map((item, idx) => {
                const y = 26 + idx * 24;
                const x1 = 145 + ((Math.max(2017, item.q1Year) - 2017) / 9) * 250;
                const xMed = 145 + ((Math.max(2017, item.medianYear) - 2017) / 9) * 250;
                const x3 = 145 + ((Math.min(2026, item.q3Year) - 2017) / 9) * 250;
                const r = Math.min(8, 3.5 + item.frequency * 0.8);

                return (
                  <g key={item.term}>
                    <text
                      x={136}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[11px] font-medium fill-slate-700 dark:fill-slate-300"
                    >
                      {item.term.length > 20 ? item.term.slice(0, 19) + '…' : item.term}
                    </text>
                    <line
                      x1={x1}
                      y1={y}
                      x2={Math.max(x1 + 6, x3)}
                      y2={y}
                      stroke="#94A3B8"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />
                    <circle cx={xMed} cy={y} r={r} fill="#2563EB">
                      <title>
                        {item.term}: freq {item.frequency} ({item.q1Year}–{item.q3Year}, median {item.medianYear})
                      </title>
                    </circle>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Row 2: Reference Publication Year Spectroscopy (RPYS) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Reference Publication Year Spectroscopy (RPYS)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Identifies historical seminal works by plotting cited reference counts (blue) and 5-year median deviations (crimson peaks).
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-blue-600 dark:text-blue-400">● Cited References Count</span>
            <span className="text-rose-600 dark:text-rose-400">▲ 5-Year Median Deviation</span>
          </div>
        </div>

        <div className="h-52 w-full">
          <svg viewBox="0 0 860 190" className="w-full h-full">
            <line
              x1={45}
              y1={155}
              x2={830}
              y2={155}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
            />

            {/* Cited References Line */}
            {rpysPoints.length > 1 && (
              <path
                d={rpysPoints
                  .map((pt, idx) => {
                    const x = 55 + (idx / Math.max(1, rpysPoints.length - 1)) * 760;
                    const y = 150 - (pt.citedReferencesCount / maxRpysCount) * 125;
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#2563EB"
                strokeWidth={2}
              />
            )}

            {/* 5-Yr Deviation Line */}
            {rpysPoints.length > 1 && (
              <path
                d={rpysPoints
                  .map((pt, idx) => {
                    const x = 55 + (idx / Math.max(1, rpysPoints.length - 1)) * 760;
                    const dev = Math.max(0, pt.deviation);
                    const y = 150 - (dev / maxRpysCount) * 125;
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#E11D48"
                strokeWidth={2}
                strokeDasharray="3 3"
              />
            )}

            {rpysPoints.map((pt, idx) => {
              const x = 55 + (idx / Math.max(1, rpysPoints.length - 1)) * 760;
              const y = 150 - (pt.citedReferencesCount / maxRpysCount) * 125;
              const isSelected = activeRpysPoint?.year === pt.year;

              return (
                <g
                  key={pt.year}
                  onClick={() => setSelectedRpysYear(pt.year)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 6 : 4}
                    fill={isSelected ? '#E11D48' : '#2563EB'}
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                  />
                  <text
                    x={x}
                    y={172}
                    textAnchor="middle"
                    className="text-[10px] font-mono fill-slate-500"
                  >
                    {pt.year}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {activeRpysPoint && (
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono tabular-nums">
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                RPYS Peak Inspection ({activeRpysPoint.year}):{' '}
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                {activeRpysPoint.topCitedReference || 'Historical reference peak'}
              </span>
            </div>
            <div className="text-slate-500 shrink-0">
              Cited Refs: {activeRpysPoint.citedReferencesCount} · 5-Yr Deviation: +{Math.max(0, activeRpysPoint.deviation)}
            </div>
          </div>
        )}
      </div>

      {/* Row 3: Chronological Direct Citation Historiograph */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Historiograph (Chronological Direct Citation Network)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Maps intellectual lineages across time based on direct citations within the merged master corpus. Click any node to inspect its lineage.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            Nodes: {historiograph.nodes.length} · Direct Citation Links: {historiograph.edges.length}
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 overflow-x-auto">
          <svg viewBox="0 0 880 280" className="w-full h-[260px]">
            {/* Directed Citation Edges */}
            {historiograph.edges.map((edge, idx) => {
              const from = historiograph.nodes.find((n) => n.id === edge.fromId);
              const to = historiograph.nodes.find((n) => n.id === edge.toId);
              if (!from || !to) return null;

              const x1 = from.x * 840 + 20;
              const y1 = from.y * 220 + 20;
              const x2 = to.x * 840 + 20;
              const y2 = to.y * 220 + 20;
              const mx = (x1 + x2) / 2;

              const isHighlighted =
                !activeHistNode ||
                activeHistNode.id === from.id ||
                activeHistNode.id === to.id;

              return (
                <path
                  key={idx}
                  d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={isHighlighted ? '#2563EB' : '#94A3B8'}
                  strokeWidth={isHighlighted ? 2 : 1.2}
                  strokeOpacity={isHighlighted ? 0.8 : 0.25}
                />
              );
            })}

            {/* Historiograph Nodes */}
            {historiograph.nodes.map((node) => {
              const cx = node.x * 840 + 20;
              const cy = node.y * 220 + 20;
              const r = Math.max(7, Math.min(16, 6 + node.localCitations * 2.2));
              const isSelected = activeHistNode?.id === node.id;

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedHistNodeId(node.id)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={isSelected ? '#DC2626' : '#2563EB'}
                    stroke="#FFFFFF"
                    strokeWidth={1.8}
                  />
                  <text
                    x={cx}
                    y={cy - r - 5}
                    textAnchor="middle"
                    className="text-[10px] font-mono font-semibold fill-slate-800 dark:fill-slate-200"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {activeHistNode && (
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {activeHistNode.label}:{' '}
              </span>
              <span className="text-slate-700 dark:text-slate-300">{activeHistNode.title}</span>
            </div>
            <div className="font-mono tabular-nums text-slate-500 shrink-0">
              {activeHistNode.source} · Local Citations (LCS): {activeHistNode.localCitations} · Global Citations (GCS): {activeHistNode.globalCitations}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
