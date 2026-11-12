import React, { useState, useMemo } from 'react';
import {
  BibRecord,
  StratifyDimension
} from '../types/bibliometrics';
import {
  computeBradfordsLaw,
  computeImpactMetrics,
  computeLotkasLaw,
  partitionCorpusByStrata
} from '../utils/bibliometricEngine';
import { StratifiedCohortPanel } from './StratificationAndCharts';

interface SourcesAndAuthorsViewProps {
  records: BibRecord[];
  stratifyBy: StratifyDimension;
  onChangeStratifyBy: (dim: StratifyDimension) => void;
}

export const SourcesAndAuthorsView: React.FC<SourcesAndAuthorsViewProps> = ({
  records,
  stratifyBy,
  onChangeStratifyBy
}) => {
  const [impactTab, setImpactTab] = useState<'authors' | 'sources'>('authors');

  const bradfordItems = useMemo(() => computeBradfordsLaw(records), [records]);
  const lotkaItems = useMemo(() => computeLotkasLaw(records), [records]);
  const authorImpacts = useMemo(() => computeImpactMetrics(records, 'authors'), [records]);
  const sourceImpacts = useMemo(() => computeImpactMetrics(records, 'sources'), [records]);

  const effectiveStratifyDim = stratifyBy === 'none' ? 'funding-status' : stratifyBy;
  const strata = useMemo(
    () => partitionCorpusByStrata(records, effectiveStratifyDim),
    [records, effectiveStratifyDim]
  );

  const activeImpactList = impactTab === 'authors' ? authorImpacts : sourceImpacts;
  const topAuthorsForTimeline = authorImpacts.slice(0, 10);
  const allYears = useMemo(() => {
    const yrs = records.map((r) => r.year);
    const min = yrs.length ? Math.min(...yrs) : 2017;
    const max = yrs.length ? Math.max(...yrs) : 2026;
    const list: number[] = [];
    for (let y = min; y <= max; y++) list.push(y);
    return list;
  }, [records]);

  const coreSourcesCount = bradfordItems.filter((b) => b.zone === 'Zone 1 (Core)').length;

  return (
    <div className="space-y-6">
      {/* Multi-Dimensional Stratified Cohort Comparison Panel */}
      <StratifiedCohortPanel
        records={records}
        stratifyBy={stratifyBy}
        onChangeStratifyBy={onChangeStratifyBy}
        moduleTitle="Stratified Source & Author Productivity Benchmarking"
      />

      {/* Row 1: Bradford's Law of Scattering & Lotka's Law of Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Bradford's Law */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Bradford&apos;s Law of Source Scattering
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Partitions journals into 3 equal productivity zones; Zone 1 identifies core journals driving a third of corpus output.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-blue-600 dark:text-blue-400 shrink-0">
              Core Sources: {coreSourcesCount}
            </span>
          </div>

          {/* Bradford Curve SVG */}
          <div className="h-44 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2">
            <svg viewBox="0 0 460 150" className="w-full h-full">
              {/* Zone 1 Shading */}
              <rect
                x={40}
                y={12}
                width={Math.max(40, (coreSourcesCount / Math.max(1, bradfordItems.length)) * 390)}
                height={115}
                fill="#2563EB"
                fillOpacity={0.1}
              />
              <text x={48} y={26} className="text-[10px] font-mono font-semibold fill-blue-600">
                Zone 1: Core Sources
              </text>

              {/* Step Curve */}
              {bradfordItems.length > 1 && (
                <path
                  d={bradfordItems
                    .map((item, idx) => {
                      const x = 40 + (idx / Math.max(1, bradfordItems.length - 1)) * 390;
                      const maxArt = Math.max(1, bradfordItems[0]?.articles || 1);
                      const y = 125 - (item.articles / maxArt) * 100;
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth={2.2}
                />
              )}
              {bradfordItems.map((item, idx) => {
                const x = 40 + (idx / Math.max(1, bradfordItems.length - 1)) * 390;
                const maxArt = Math.max(1, bradfordItems[0]?.articles || 1);
                const y = 125 - (item.articles / maxArt) * 100;
                return (
                  <circle
                    key={item.source}
                    cx={x}
                    cy={y}
                    r={3.5}
                    fill={item.zone === 'Zone 1 (Core)' ? '#2563EB' : '#64748B'}
                  />
                );
              })}
              <text x={235} y={144} textAnchor="middle" className="text-[10px] font-mono fill-slate-400">
                Source Rank (log scale) →
              </text>
            </svg>
          </div>

          {/* Bradford Table */}
          <div className="overflow-x-auto max-h-48">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="py-1.5 pr-2">Rank</th>
                  <th className="py-1.5 px-2">Source Title (SO)</th>
                  <th className="py-1.5 px-2 text-right">Articles</th>
                  <th className="py-1.5 px-2 text-right">Cum.</th>
                  <th className="py-1.5 pl-2 text-right">Bradford Zone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono tabular-nums">
                {bradfordItems.map((item) => (
                  <tr key={item.source}>
                    <td className="py-1.5 pr-2 text-slate-500">#{item.rank}</td>
                    <td className="py-1.5 px-2 font-sans font-medium text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
                      {item.source}
                    </td>
                    <td className="py-1.5 px-2 text-right">{item.articles}</td>
                    <td className="py-1.5 px-2 text-right text-slate-500">{item.cumulativeArticles}</td>
                    <td className="py-1.5 pl-2 text-right font-sans">
                      <span
                        className={
                          item.zone === 'Zone 1 (Core)'
                            ? 'text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-slate-500'
                        }
                      >
                        {item.zone}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lotka's Law of Scientific Productivity */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Lotka&apos;s Law of Author Productivity
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Compares observed author publication frequency against Lotka&apos;s inverse-square theoretical distribution ($C / n^2$).
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono shrink-0">
              <span className="text-blue-600 dark:text-blue-400">● Empirical</span>
              <span className="text-amber-500">--- Theoretical</span>
            </div>
          </div>

          {/* Lotka Curve SVG */}
          <div className="h-44 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2">
            <svg viewBox="0 0 460 150" className="w-full h-full">
              {/* Theoretical Curve */}
              {lotkaItems.length > 1 && (
                <path
                  d={lotkaItems
                    .map((item, idx) => {
                      const x = 50 + (idx / Math.max(1, lotkaItems.length - 1)) * 370;
                      const y = 125 - (item.theoreticalPct / 100) * 105;
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              )}

              {/* Observed Curve */}
              {lotkaItems.length > 1 && (
                <path
                  d={lotkaItems
                    .map((item, idx) => {
                      const x = 50 + (idx / Math.max(1, lotkaItems.length - 1)) * 370;
                      const y = 125 - (item.observedPct / 100) * 105;
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth={2.2}
                />
              )}

              {lotkaItems.map((item, idx) => {
                const x = 50 + (idx / Math.max(1, lotkaItems.length - 1)) * 370;
                const y = 125 - (item.observedPct / 100) * 105;
                return (
                  <g key={item.documentsWritten}>
                    <circle cx={x} cy={y} r={4} fill="#2563EB" />
                    <text
                      x={x}
                      y={142}
                      textAnchor="middle"
                      className="text-[10px] font-mono fill-slate-500"
                    >
                      {item.documentsWritten} doc{item.documentsWritten > 1 ? 's' : ''}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Lotka Table */}
          <div className="overflow-x-auto max-h-48">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="py-1.5 pr-2">Documents Written (n)</th>
                  <th className="py-1.5 px-2 text-right">N. of Authors</th>
                  <th className="py-1.5 px-2 text-right">Observed % of Authors</th>
                  <th className="py-1.5 pl-2 text-right">Lotka Theoretical %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono tabular-nums">
                {lotkaItems.map((item) => (
                  <tr key={item.documentsWritten}>
                    <td className="py-1.5 pr-2">{item.documentsWritten}</td>
                    <td className="py-1.5 px-2 text-right">{item.observedAuthors}</td>
                    <td className="py-1.5 px-2 text-right font-semibold text-blue-600 dark:text-blue-400">
                      {item.observedPct.toFixed(1)}%
                    </td>
                    <td className="py-1.5 pl-2 text-right text-amber-600 dark:text-amber-400">
                      {item.theoreticalPct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 2: Top Authors' Production Over Time (Bibliometrix Timeline Bubble Plot) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Top Authors&apos; Production Over Time
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bubble size represents annual articles published (N); color opacity reflects annual citation impact (TC).
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            Top {topAuthorsForTimeline.length} Most Productive Authors
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          <svg viewBox="0 0 860 310" className="w-full h-[300px]">
            {/* Year Column Lines */}
            {allYears.map((yr, idx) => {
              const x = 190 + (idx / Math.max(1, allYears.length - 1)) * 630;
              return (
                <g key={yr}>
                  <line
                    x1={x}
                    y1={20}
                    x2={x}
                    y2={275}
                    stroke="currentColor"
                    className="text-slate-100 dark:text-slate-800"
                  />
                  <text
                    x={x}
                    y={295}
                    textAnchor="middle"
                    className="text-[11px] font-mono fill-slate-500"
                  >
                    {yr}
                  </text>
                </g>
              );
            })}

            {/* Author Timeline Rows */}
            {topAuthorsForTimeline.map((author, rIdx) => {
              const y = 32 + rIdx * 25;
              const yearsActive = author.yearlyTimeline.map((t) => t.year);
              const minY = Math.min(...yearsActive);
              const maxY = Math.max(...yearsActive);
              const xStart =
                190 +
                ((minY - allYears[0]) / Math.max(1, allYears[allYears.length - 1] - allYears[0])) *
                  630;
              const xEnd =
                190 +
                ((maxY - allYears[0]) / Math.max(1, allYears[allYears.length - 1] - allYears[0])) *
                  630;

              return (
                <g key={author.name}>
                  <text
                    x={175}
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs font-medium fill-slate-800 dark:fill-slate-200"
                  >
                    {author.name}
                  </text>
                  <line
                    x1={xStart}
                    y1={y}
                    x2={xEnd}
                    y2={y}
                    stroke="#DC2626"
                    strokeWidth={1.5}
                    strokeOpacity={0.5}
                  />
                  {author.yearlyTimeline.map((pt) => {
                    const cx =
                      190 +
                      ((pt.year - allYears[0]) /
                        Math.max(1, allYears[allYears.length - 1] - allYears[0])) *
                        630;
                    const r = Math.min(11, 4.5 + pt.count * 2.5);
                    return (
                      <g key={pt.year}>
                        <circle
                          cx={cx}
                          cy={y}
                          r={r}
                          fill="#2563EB"
                          fillOpacity={Math.min(0.95, 0.35 + pt.citations / 3000)}
                          stroke="#1D4ED8"
                          strokeWidth={1.2}
                        >
                          <title>
                            {author.name} ({pt.year}): {pt.count} doc(s), {pt.citations} citations
                          </title>
                        </circle>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Row 3: H-Index, G-Index, M-Index & Citation Impact Table with Stratified Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Scholarly Impact Indices (h-index · g-index · m-index) & Stratum Composition
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hirsch h-index, Egghe g-index, time-normalized m-index, and proportional cohort composition across the harmonized corpus.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg w-fit">
            <button
              onClick={() => setImpactTab('authors')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                impactTab === 'authors'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Author Impact ({authorImpacts.length})
            </button>
            <button
              onClick={() => setImpactTab('sources')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                impactTab === 'sources'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Source / Journal Impact ({sourceImpacts.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/60 dark:bg-slate-950/60">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">
                  {impactTab === 'authors' ? 'Author Name (AU)' : 'Source / Journal (SO)'}
                </th>
                <th className="py-2.5 px-3 text-right">h-index</th>
                <th className="py-2.5 px-3 text-right">g-index</th>
                <th className="py-2.5 px-3 text-right">m-index</th>
                <th className="py-2.5 px-3 text-right">Total Citations (TC)</th>
                <th className="py-2.5 px-3 text-right">Net Production (NP)</th>
                <th className="py-2.5 px-3 min-w-[160px]">Cohort Composition</th>
                <th className="py-2.5 px-3 text-right">PY Start</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono tabular-nums">
              {activeImpactList.slice(0, 15).map((item, idx) => {
                const entityCounts = strata.map((st) => {
                  const count = st.records.filter((r) =>
                    impactTab === 'authors'
                      ? r.authors.includes(item.name)
                      : r.source === item.name
                  ).length;
                  return { st, count };
                });
                const totalEntityCount = Math.max(
                  1,
                  entityCounts.reduce((s, e) => s + e.count, 0)
                );

                return (
                  <tr key={item.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 text-slate-500">#{idx + 1}</td>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-blue-600 dark:text-blue-400">
                      {item.hIndex}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200">
                      {item.gIndex}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
                      {item.mIndex.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                      {item.totalCitations.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                      {item.netProduction}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded overflow-hidden flex">
                        {entityCounts.map(({ st, count }) => {
                          if (count <= 0) return null;
                          const pct = Math.round((count / totalEntityCount) * 100);
                          return (
                            <div
                              key={st.id}
                              style={{
                                width: `${(count / totalEntityCount) * 100}%`,
                                backgroundColor: st.color
                              }}
                              className="h-full"
                              title={`${st.label}: ${count} doc(s) (${pct}%)`}
                            />
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">{item.firstYear}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

