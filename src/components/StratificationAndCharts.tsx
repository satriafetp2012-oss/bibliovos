import React, { useState, useMemo } from 'react';
import {
  BibRecord,
  StratifyDimension
} from '../types/bibliometrics';
import {
  computeStratifiedAnnualSeries,
  partitionCorpusByStrata,
  STRATIFY_DIMENSION_LABELS,
  STRATUM_PALETTE
} from '../utils/bibliometricEngine';

export interface PieSliceItem {
  id: string;
  label: string;
  documents: number;
  citations: number;
  color: string;
}

interface InteractivePieDonutChartProps {
  title: string;
  subtitle: string;
  slices: PieSliceItem[];
  selectedLabel?: string | null;
  onSelectLabel?: (label: string | null) => void;
  headerRight?: React.ReactNode;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
}

function createSlicePath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
): string {
  // Handle full 360 degree circle
  const clampedEnd = endAngle - startAngle >= 359.9 ? startAngle + 359.85 : endAngle;
  const startOuter = polarToCartesian(cx, cy, outerR, clampedEnd);
  const endOuter = polarToCartesian(cx, cy, outerR, startAngle);
  const largeArcFlag = clampedEnd - startAngle <= 180 ? '0' : '1';

  if (innerR <= 0) {
    return [
      'M',
      cx,
      cy,
      'L',
      startOuter.x,
      startOuter.y,
      'A',
      outerR,
      outerR,
      0,
      largeArcFlag,
      0,
      endOuter.x,
      endOuter.y,
      'Z'
    ].join(' ');
  }

  const startInner = polarToCartesian(cx, cy, innerR, clampedEnd);
  const endInner = polarToCartesian(cx, cy, innerR, startAngle);

  return [
    'M',
    startOuter.x,
    startOuter.y,
    'A',
    outerR,
    outerR,
    0,
    largeArcFlag,
    0,
    endOuter.x,
    endOuter.y,
    'L',
    endInner.x,
    endInner.y,
    'A',
    innerR,
    innerR,
    0,
    largeArcFlag,
    1,
    startInner.x,
    startInner.y,
    'Z'
  ].join(' ');
}

export const InteractivePieDonutChart: React.FC<InteractivePieDonutChartProps> = ({
  title,
  subtitle,
  slices,
  selectedLabel,
  onSelectLabel,
  headerRight
}) => {
  const [chartStyle, setChartStyle] = useState<'donut' | 'pie'>('donut');
  const [metricBy, setMetricBy] = useState<'documents' | 'citations'>('documents');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const totalValue = useMemo(() => {
    const sum = slices.reduce(
      (s, item) => s + (metricBy === 'documents' ? item.documents : item.citations),
      0
    );
    return Math.max(1, sum);
  }, [slices, metricBy]);

  const computedArcs = useMemo(() => {
    let accAngle = 0;
    return slices.map((slice, idx) => {
      const val = metricBy === 'documents' ? slice.documents : slice.citations;
      const pct = Number(((val / totalValue) * 100).toFixed(1));
      const sweep = Math.max(1.5, (val / totalValue) * 360);
      const startAngle = accAngle;
      const endAngle = Math.min(360, accAngle + sweep);
      accAngle = endAngle;
      return {
        ...slice,
        val,
        pct,
        startAngle,
        endAngle,
        color: slice.color || STRATUM_PALETTE[idx % STRATUM_PALETTE.length]
      };
    });
  }, [slices, metricBy, totalValue]);

  const activeSlice =
    computedArcs.find((a) => a.id === hoveredId) ||
    computedArcs.find((a) => a.label === selectedLabel) ||
    computedArcs[0];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {headerRight}
          <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
            <button
              onClick={() => setChartStyle('donut')}
              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                chartStyle === 'donut'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Donut
            </button>
            <button
              onClick={() => setChartStyle('pie')}
              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                chartStyle === 'pie'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Pie
            </button>
          </div>

          <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
            <button
              onClick={() => setMetricBy('documents')}
              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                metricBy === 'documents'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              By Docs
            </button>
            <button
              onClick={() => setMetricBy('citations')}
              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                metricBy === 'citations'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              By Citations
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* SVG Pie / Donut Viewport */}
        <div className="md:col-span-6 flex items-center justify-center">
          <svg viewBox="0 0 220 220" className="w-52 h-52 overflow-visible">
            {computedArcs.map((arc) => {
              const isSelected = selectedLabel === arc.label;
              const isHovered = hoveredId === arc.id;
              const outerR = isHovered || isSelected ? 96 : 90;
              const innerR = chartStyle === 'donut' ? 54 : 0;
              const pathD = createSlicePath(
                110,
                110,
                outerR,
                innerR,
                arc.startAngle,
                arc.endAngle
              );

              return (
                <path
                  key={arc.id}
                  d={pathD}
                  fill={arc.color}
                  fillOpacity={
                    selectedLabel && !isSelected && !isHovered ? 0.45 : isHovered ? 1 : 0.9
                  }
                  stroke={isSelected ? '#0F172A' : '#FFFFFF'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  className="cursor-pointer transition-opacity"
                  onMouseEnter={() => setHoveredId(arc.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => {
                    if (onSelectLabel) {
                      onSelectLabel(isSelected ? null : arc.label);
                    }
                  }}
                >
                  <title>
                    {arc.label}: {arc.documents} docs · {arc.citations.toLocaleString()} citations ({arc.pct}%)
                  </title>
                </path>
              );
            })}

            {chartStyle === 'donut' && activeSlice && (
              <g className="pointer-events-none">
                <text
                  x={110}
                  y={98}
                  textAnchor="middle"
                  className="text-[10px] font-medium fill-slate-500 dark:fill-slate-400"
                >
                  {activeSlice.label.length > 16
                    ? activeSlice.label.slice(0, 15) + '…'
                    : activeSlice.label}
                </text>
                <text
                  x={110}
                  y={118}
                  textAnchor="middle"
                  className="text-lg font-mono font-bold fill-slate-900 dark:fill-slate-100"
                >
                  {activeSlice.pct}%
                </text>
                <text
                  x={110}
                  y={133}
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-slate-500 dark:fill-slate-400"
                >
                  {metricBy === 'documents'
                    ? `${activeSlice.documents} docs`
                    : `${activeSlice.citations.toLocaleString()} TC`}
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Interactive Slice Legend & Breakdown */}
        <div className="md:col-span-6 space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {computedArcs.map((arc) => {
            const isSelected = selectedLabel === arc.label;
            return (
              <div
                key={arc.id}
                onMouseEnter={() => setHoveredId(arc.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => {
                  if (onSelectLabel) {
                    onSelectLabel(isSelected ? null : arc.label);
                  }
                }}
                className={`p-2 rounded border text-xs cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: arc.color }}
                  />
                  <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {arc.label}
                  </span>
                </div>
                <div className="font-mono tabular-nums text-right shrink-0 text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {arc.pct}%
                  </span>
                  <span aria-hidden="true"> · </span>
                  <span>
                    {metricBy === 'documents'
                      ? `${arc.documents}d`
                      : `${arc.citations.toLocaleString()}c`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface StratifiedCohortPanelProps {
  records: BibRecord[];
  stratifyBy: StratifyDimension;
  onChangeStratifyBy: (dim: StratifyDimension) => void;
  moduleTitle?: string;
}

export const StratifiedCohortPanel: React.FC<StratifiedCohortPanelProps> = ({
  records,
  stratifyBy,
  onChangeStratifyBy,
  moduleTitle = 'Multi-Dimensional Stratified Cohort Comparison'
}) => {
  const [displayMode, setDisplayMode] = useState<'side-by-side' | 'stacked-annual'>('side-by-side');

  const strata = useMemo(
    () => partitionCorpusByStrata(records, stratifyBy),
    [records, stratifyBy]
  );
  const stratifiedAnnual = useMemo(
    () => computeStratifiedAnnualSeries(records, stratifyBy),
    [records, stratifyBy]
  );

  const maxAnnualDocs = Math.max(
    1,
    ...stratifiedAnnual.series.map((s) => s.totalArticles)
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {moduleTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Stratify scientific output, citation velocity, h-index, open access adoption, and international collaboration across subgroups.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <label className="text-slate-500 font-medium whitespace-nowrap">Stratify By:</label>
            <select
              value={stratifyBy}
              onChange={(e) => onChangeStratifyBy(e.target.value as StratifyDimension)}
              aria-label="Stratify analysis by metadata dimension"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded font-medium text-slate-900 dark:text-slate-100"
            >
              {(Object.entries(STRATIFY_DIMENSION_LABELS) as [StratifyDimension, string][]).map(
                ([dim, label]) => (
                  <option key={dim} value={dim}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
            <button
              onClick={() => setDisplayMode('side-by-side')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                displayMode === 'side-by-side'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Side-by-Side Cohort Matrix
            </button>
            <button
              onClick={() => setDisplayMode('stacked-annual')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                displayMode === 'stacked-annual'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Stacked Annual Strata
            </button>
          </div>
        </div>
      </div>

      {/* Proportional Composition Bar across Strata */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
          <span>
            Active Stratification: {STRATIFY_DIMENSION_LABELS[stratifyBy]} ({strata.length} Cohort
            {strata.length === 1 ? '' : 's'})
          </span>
          <span>Total Corpus: {records.length} Documents</span>
        </div>
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded overflow-hidden flex">
          {strata.map((st) => {
            const totalSum = Math.max(
              1,
              strata.reduce((s, item) => s + item.documents, 0)
            );
            const widthPct = (st.documents / totalSum) * 100;
            return (
              <div
                key={st.id}
                style={{ width: `${widthPct}%`, backgroundColor: st.color }}
                className="h-full border-r border-white/40 dark:border-slate-900/40 last:border-r-0"
                title={`${st.label}: ${st.documents} docs (${st.sharePct}%) · Avg TC: ${st.avgCitations}`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-1">
          {strata.map((st) => (
            <div key={st.id} className="flex items-center gap-1.5 font-mono tabular-nums">
              <span
                className="w-2.5 h-2.5 rounded-xs shrink-0"
                style={{ backgroundColor: st.color }}
              />
              <span className="font-sans font-medium text-slate-800 dark:text-slate-200">
                {st.label}
              </span>
              <span className="text-slate-500">
                ({st.documents} · {st.sharePct}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {displayMode === 'side-by-side' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/60 dark:bg-slate-950/60">
                <th className="py-2.5 px-3">Stratified Cohort / Subgroup</th>
                <th className="py-2.5 px-2 text-right">Docs (N)</th>
                <th className="py-2.5 px-2 text-right">Share %</th>
                <th className="py-2.5 px-2 text-right">Total Cit. (TC)</th>
                <th className="py-2.5 px-2 text-right">Mean TC/Doc</th>
                <th className="py-2.5 px-2 text-right">h-index</th>
                <th className="py-2.5 px-2 text-right">g-index</th>
                <th className="py-2.5 px-2 text-right">Funded %</th>
                <th className="py-2.5 px-2 text-right">Open Access %</th>
                <th className="py-2.5 px-3 text-right">Intl. MCP %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono tabular-nums">
              {strata.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: st.color }}
                      />
                      <span>{st.label}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold text-blue-600 dark:text-blue-400">
                    {st.documents}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-600 dark:text-slate-400">
                    {st.sharePct}%
                  </td>
                  <td className="py-2.5 px-2 text-right font-semibold text-slate-900 dark:text-slate-100">
                    {st.totalCitations.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    {st.avgCitations.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-800 dark:text-slate-200">
                    {st.hIndex}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-600 dark:text-slate-400">
                    {st.gIndex}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-700 dark:text-slate-300">
                    {st.fundedPct}%
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-700 dark:text-slate-300">
                    {st.openAccessPct}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                    {st.mcpPct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-56 w-full bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded p-3">
          <svg viewBox="0 0 860 195" className="w-full h-full overflow-visible">
            {[0, 0.5, 1].map((t, idx) => {
              const y = 160 - t * 135;
              return (
                <g key={idx}>
                  <line
                    x1={48}
                    y1={y}
                    x2={820}
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                    strokeDasharray={idx === 0 ? undefined : '3 3'}
                  />
                  <text
                    x={40}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] font-mono fill-slate-400"
                  >
                    {Math.round(t * maxAnnualDocs)}
                  </text>
                </g>
              );
            })}

            {stratifiedAnnual.series.map((pt, idx) => {
              const step = 750 / Math.max(1, stratifiedAnnual.series.length);
              const x = 58 + idx * step + step * 0.18;
              const barW = Math.min(44, step * 0.62);
              const totalSumForYear = Math.max(
                1,
                strata.reduce((s, st) => s + (pt.strataCounts[st.label] || 0), 0)
              );
              const totalBarH = (pt.totalArticles / maxAnnualDocs) * 135;

              let yCursor = 160;

              return (
                <g key={pt.year}>
                  {strata.map((st) => {
                    const count = pt.strataCounts[st.label] || 0;
                    if (count <= 0) return null;
                    const segH = (count / totalSumForYear) * totalBarH;
                    yCursor -= segH;
                    return (
                      <rect
                        key={st.id}
                        x={x}
                        y={yCursor}
                        width={barW}
                        height={Math.max(1.5, segH)}
                        fill={st.color}
                        stroke="#FFFFFF"
                        strokeWidth={0.5}
                      >
                        <title>
                          {pt.year} — {st.label}: {count} doc(s),{' '}
                          {(pt.strataCitations[st.label] || 0).toLocaleString()} citations
                        </title>
                      </rect>
                    );
                  })}
                  <text
                    x={x + barW / 2}
                    y={180}
                    textAnchor="middle"
                    className="text-[11px] font-mono fill-slate-600 dark:fill-slate-400"
                  >
                    {pt.year}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};
