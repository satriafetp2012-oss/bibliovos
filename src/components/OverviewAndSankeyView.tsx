import React, { useState, useMemo } from 'react';
import {
  BibRecord,
  SankeyFieldType
} from '../types/bibliometrics';
import {
  computeAnnualProduction,
  computeMainInfo,
  computeThreeFieldSankey
} from '../utils/bibliometricEngine';

interface OverviewAndSankeyViewProps {
  records: BibRecord[];
}

const FIELD_LABELS: Record<SankeyFieldType, string> = {
  sources: 'Sources (SO)',
  authors: 'Authors (AU)',
  authorKeywords: 'Author Keywords (DE)',
  indexKeywords: 'Keywords Plus / MeSH (ID)',
  countries: 'Countries',
  affiliations: 'Affiliations / Institutions (C1)'
};

export const OverviewAndSankeyView: React.FC<OverviewAndSankeyViewProps> = ({ records }) => {
  const [leftField, setLeftField] = useState<SankeyFieldType>('sources');
  const [middleField, setMiddleField] = useState<SankeyFieldType>('authors');
  const [rightField, setRightField] = useState<SankeyFieldType>('authorKeywords');
  const [topN, setTopN] = useState<number>(7);
  const [hoveredSankeyNode, setHoveredSankeyNode] = useState<string | null>(null);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  const mainInfo = useMemo(() => computeMainInfo(records), [records]);
  const annualSeries = useMemo(() => computeAnnualProduction(records), [records]);
  const sankey = useMemo(
    () => computeThreeFieldSankey(records, leftField, middleField, rightField, topN),
    [records, leftField, middleField, rightField, topN]
  );

  const maxAnnualArticles = Math.max(1, ...annualSeries.map((d) => d.articles));
  const maxMeanCitations = Math.max(1, ...annualSeries.map((d) => d.meanTcPerArt));

  return (
    <div className="space-y-6">
      {/* Bibliometrix Main Information Summary Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Bibliometrix Main Information Summary
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Descriptive scientometric indicators computed across the unified multi-database corpus.
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-500">
            Timespan: {mainInfo.timespan} · Active Databases: {Array.from(new Set(records.flatMap((r) => r.databases))).join(', ')}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
            <div className="text-xs text-slate-500 dark:text-slate-400">Documents</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
              {mainInfo.totalDocuments}
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
              {mainInfo.totalSources} Sources (SO)
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
            <div className="text-xs text-slate-500 dark:text-slate-400">Annual Growth Rate</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
              {mainInfo.annualGrowthRate > 0 ? `+${mainInfo.annualGrowthRate}%` : `${mainInfo.annualGrowthRate}%`}
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
              Span {mainInfo.timespan}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
            <div className="text-xs text-slate-500 dark:text-slate-400">Avg. Citations / Doc</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-blue-600 dark:text-blue-400 mt-0.5">
              {mainInfo.avgCitationsPerDoc.toLocaleString()}
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
              {mainInfo.totalReferences} Cited Refs (CR)
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
            <div className="text-xs text-slate-500 dark:text-slate-400">Total Authors</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
              {mainInfo.totalAuthors}
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
              {mainInfo.coAuthorsPerDoc} Co-Authors/Doc
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
            <div className="text-xs text-slate-500 dark:text-slate-400">Intl. Co-Authorship</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
              {mainInfo.internationalCoAuthorshipPct}%
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
              {mainInfo.singleAuthoredDocs} Single-authored
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
            <div className="text-xs text-slate-500 dark:text-slate-400">Unique Keywords</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
              {mainInfo.totalAuthorKeywords}
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
              +{mainInfo.totalIndexKeywords} Keywords Plus
            </div>
          </div>
        </div>
      </div>

      {/* Annual Scientific Production & Average Citations Per Year */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Annual Scientific Production & Citation Velocity
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bars indicate yearly publication volume (N); solid line tracks Mean Total Citations per Document.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <span className="w-3 h-2.5 bg-blue-600 inline-block rounded-xs" /> Annual Articles
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <span className="w-3 h-0.5 bg-amber-500 inline-block" /> Mean Citations / Doc
            </span>
          </div>
        </div>

        <div className="relative h-64 w-full">
          <svg viewBox="0 0 860 230" className="w-full h-full overflow-visible">
            {/* Horizontal Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
              const y = 190 - t * 160;
              return (
                <g key={i}>
                  <line
                    x1={50}
                    y1={y}
                    x2={810}
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                    strokeDasharray={i === 0 ? undefined : '3 3'}
                  />
                  <text
                    x={42}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] font-mono fill-slate-400"
                  >
                    {Math.round(t * maxAnnualArticles)}
                  </text>
                  <text
                    x={818}
                    y={y + 4}
                    textAnchor="start"
                    className="text-[10px] font-mono fill-amber-500"
                  >
                    {Math.round(t * maxMeanCitations)}
                  </text>
                </g>
              );
            })}

            {/* Bars for Annual Articles */}
            {annualSeries.map((pt, idx) => {
              const step = 740 / Math.max(1, annualSeries.length);
              const x = 60 + idx * step + step * 0.2;
              const barW = Math.min(44, step * 0.6);
              const barH = (pt.articles / maxAnnualArticles) * 160;
              const y = 190 - barH;
              const isHovered = hoveredYear === pt.year;

              return (
                <g
                  key={pt.year}
                  onMouseEnter={() => setHoveredYear(pt.year)}
                  onMouseLeave={() => setHoveredYear(null)}
                  className="cursor-pointer"
                >
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(2, barH)}
                    rx={2}
                    fill={isHovered ? '#1D4ED8' : '#2563EB'}
                    fillOpacity={isHovered ? 0.95 : 0.8}
                  />
                  <text
                    x={x + barW / 2}
                    y={208}
                    textAnchor="middle"
                    className="text-[11px] font-mono fill-slate-600 dark:fill-slate-400"
                  >
                    {pt.year}
                  </text>
                  {isHovered && (
                    <text
                      x={x + barW / 2}
                      y={y - 6}
                      textAnchor="middle"
                      className="text-[11px] font-mono font-bold fill-slate-900 dark:fill-slate-100"
                    >
                      {pt.articles} docs ({pt.meanTcPerArt} TC)
                    </text>
                  )}
                </g>
              );
            })}

            {/* Line for Mean Citations per Article */}
            {annualSeries.length > 1 && (
              <path
                d={annualSeries
                  .map((pt, idx) => {
                    const step = 740 / Math.max(1, annualSeries.length);
                    const cx = 60 + idx * step + step * 0.5;
                    const cy = 190 - (pt.meanTcPerArt / maxMeanCitations) * 160;
                    return `${idx === 0 ? 'M' : 'L'} ${cx} ${cy}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#F59E0B"
                strokeWidth={2.5}
              />
            )}

            {annualSeries.map((pt, idx) => {
              const step = 740 / Math.max(1, annualSeries.length);
              const cx = 60 + idx * step + step * 0.5;
              const cy = 190 - (pt.meanTcPerArt / maxMeanCitations) * 160;
              return (
                <circle
                  key={pt.year}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill="#F59E0B"
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Bibliometrix Three-Field Plot (Sankey Diagram) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Three-Field Plot (Bibliometrix Sankey Diagram)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualize structural relationships across any three bibliographic fields (e.g., Sources ↔ Authors ↔ Keywords).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div>
              <label className="text-slate-500 mr-1.5">Left Field:</label>
              <select
                value={leftField}
                onChange={(e) => setLeftField(e.target.value as SankeyFieldType)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
              >
                {Object.entries(FIELD_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-500 mr-1.5">Middle Field:</label>
              <select
                value={middleField}
                onChange={(e) => setMiddleField(e.target.value as SankeyFieldType)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
              >
                {Object.entries(FIELD_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-500 mr-1.5">Right Field:</label>
              <select
                value={rightField}
                onChange={(e) => setRightField(e.target.value as SankeyFieldType)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
              >
                {Object.entries(FIELD_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-500 mr-1.5">Items:</label>
              <select
                value={topN}
                onChange={(e) => setTopN(Number(e.target.value))}
                className="px-2 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
              >
                <option value={5}>Top 5</option>
                <option value={7}>Top 7</option>
                <option value={10}>Top 10</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sankey SVG Stage */}
        <div className="w-full overflow-x-auto border border-slate-100 dark:border-slate-800/80 rounded-lg p-3 bg-slate-50/50 dark:bg-slate-950/40">
          <svg viewBox="0 0 920 420" className="w-full h-[400px]">
            {/* Column Headers */}
            <text x={150} y={20} textAnchor="start" className="text-xs font-semibold fill-slate-700 dark:fill-slate-300">
              {FIELD_LABELS[leftField]}
            </text>
            <text x={460} y={20} textAnchor="middle" className="text-xs font-semibold fill-slate-700 dark:fill-slate-300">
              {FIELD_LABELS[middleField]}
            </text>
            <text x={770} y={20} textAnchor="end" className="text-xs font-semibold fill-slate-700 dark:fill-slate-300">
              {FIELD_LABELS[rightField]}
            </text>

            {/* Cubic Bezier Flow Links */}
            {sankey.links.map((link, idx) => {
              const sNode = sankey.nodes.find((n) => n.id === link.sourceId);
              const tNode = sankey.nodes.find((n) => n.id === link.targetId);
              if (!sNode || !tNode) return null;

              const colX = [150, 450, 750];
              const x0 = colX[sNode.column] + 18;
              const x1 = colX[tNode.column];
              const y0 = 36 + link.y0 * 355;
              const y1 = 36 + link.y1 * 355;
              const cx = (x0 + x1) / 2;

              const isHighlighted =
                !hoveredSankeyNode ||
                link.sourceId === hoveredSankeyNode ||
                link.targetId === hoveredSankeyNode;

              return (
                <path
                  key={idx}
                  d={`M ${x0} ${y0} C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`}
                  fill="none"
                  stroke={link.color}
                  strokeWidth={Math.max(2, link.width * 355)}
                  strokeOpacity={isHighlighted ? (hoveredSankeyNode ? 0.65 : 0.32) : 0.06}
                />
              );
            })}

            {/* Sankey Nodes */}
            {sankey.nodes.map((node) => {
              const colX = [150, 450, 750];
              const x = colX[node.column];
              const y = 36 + node.y0 * 355;
              const h = Math.max(10, (node.y1 - node.y0) * 355);

              return (
                <g
                  key={node.id}
                  onMouseEnter={() => setHoveredSankeyNode(node.id)}
                  onMouseLeave={() => setHoveredSankeyNode(null)}
                  className="cursor-pointer"
                >
                  <rect
                    x={x}
                    y={y}
                    width={18}
                    height={h}
                    rx={2}
                    fill={node.color}
                  />
                  <text
                    x={node.column === 0 ? x - 8 : node.column === 2 ? x + 26 : x + 24}
                    y={y + h / 2 + 4}
                    textAnchor={node.column === 0 ? 'end' : 'start'}
                    className="text-[11px] font-medium fill-slate-800 dark:fill-slate-200"
                  >
                    {node.label.length > 26 ? node.label.slice(0, 24) + '…' : node.label} ({node.value})
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
