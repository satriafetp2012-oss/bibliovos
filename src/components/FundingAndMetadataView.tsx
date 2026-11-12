import React, { useState, useMemo } from 'react';
import {
  BibRecord,
  StratifyDimension
} from '../types/bibliometrics';
import {
  computeFundingAndMetadataAnalytics,
  STRATUM_PALETTE
} from '../utils/bibliometricEngine';
import {
  InteractivePieDonutChart,
  PieSliceItem,
  StratifiedCohortPanel
} from './StratificationAndCharts';

interface FundingAndMetadataViewProps {
  records: BibRecord[];
  stratifyBy: StratifyDimension;
  onChangeStratifyBy: (dim: StratifyDimension) => void;
}

export const FundingAndMetadataView: React.FC<FundingAndMetadataViewProps> = ({
  records,
  stratifyBy,
  onChangeStratifyBy
}) => {
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedFundingStatusSlice, setSelectedFundingStatusSlice] = useState<string | null>(null);
  const [leftPieMode, setLeftPieMode] = useState<'funding-status' | 'open-access' | 'collaboration'>(
    'funding-status'
  );
  const [rightPieMode, setRightPieMode] = useState<'agencies' | 'subjects'>('agencies');
  const [bubbleSizeBy, setBubbleSizeBy] = useState<'hIndex' | 'totalCitations'>('hIndex');
  const [hoveredBubbleAgency, setHoveredBubbleAgency] = useState<string | null>(null);
  const [metadataSubTab, setMetadataSubTab] = useState<
    'oa' | 'publishers' | 'doctypes' | 'languages'
  >('oa');

  const analytics = useMemo(() => computeFundingAndMetadataAnalytics(records), [records]);

  // Left Pie/Donut Slices
  const leftPieSlices: PieSliceItem[] = useMemo(() => {
    if (leftPieMode === 'funding-status') {
      const fundedRecs = records.filter((r) => (r.fundingAgencies || []).length > 0);
      const unfundedRecs = records.filter((r) => (r.fundingAgencies || []).length === 0);
      return [
        {
          id: 'funded',
          label: 'Grant-Funded (FU)',
          documents: fundedRecs.length,
          citations: fundedRecs.reduce((s, r) => s + r.citations, 0),
          color: '#2563EB'
        },
        {
          id: 'unfunded',
          label: 'Unfunded / No Grant',
          documents: unfundedRecs.length,
          citations: unfundedRecs.reduce((s, r) => s + r.citations, 0),
          color: '#64748B'
        }
      ];
    }
    if (leftPieMode === 'open-access') {
      return analytics.openAccessBreakdown.map((item, idx) => ({
        id: `oa-${idx}`,
        label: item.label,
        documents: item.count,
        citations: item.totalCitations,
        color: STRATUM_PALETTE[idx % STRATUM_PALETTE.length]
      }));
    }
    // collaboration (SCP vs MCP)
    const mcpRecs = records.filter((r) => r.countries.length > 1);
    const scpRecs = records.filter((r) => r.countries.length <= 1);
    return [
      {
        id: 'mcp',
        label: 'Multi-Country (MCP · Intl)',
        documents: mcpRecs.length,
        citations: mcpRecs.reduce((s, r) => s + r.citations, 0),
        color: '#10B981'
      },
      {
        id: 'scp',
        label: 'Single-Country (SCP · Domestic)',
        documents: scpRecs.length,
        citations: scpRecs.reduce((s, r) => s + r.citations, 0),
        color: '#2563EB'
      }
    ];
  }, [records, leftPieMode, analytics.openAccessBreakdown]);

  // Right Pie/Donut Slices
  const rightPieSlices: PieSliceItem[] = useMemo(() => {
    if (rightPieMode === 'agencies') {
      const top = analytics.fundingAgencies.slice(0, 6);
      const slices: PieSliceItem[] = top.map((ag, idx) => ({
        id: `ag-${idx}`,
        label: ag.agency,
        documents: ag.documents,
        citations: ag.totalCitations,
        color: STRATUM_PALETTE[idx % STRATUM_PALETTE.length]
      }));
      const restAgencies = analytics.fundingAgencies.slice(6);
      if (restAgencies.length > 0) {
        slices.push({
          id: 'ag-other',
          label: 'Other Sponsors',
          documents: restAgencies.reduce((s, a) => s + a.documents, 0),
          citations: restAgencies.reduce((s, a) => s + a.totalCitations, 0),
          color: '#64748B'
        });
      }
      return slices;
    }
    return analytics.researchSubjects.slice(0, 7).map((subj, idx) => ({
      id: `subj-${idx}`,
      label: subj.subject,
      documents: subj.documents,
      citations: subj.totalCitations,
      color: STRATUM_PALETTE[idx % STRATUM_PALETTE.length]
    }));
  }, [rightPieMode, analytics.fundingAgencies, analytics.researchSubjects]);

  const filteredDrilldownRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedAgency && !(r.fundingAgencies || []).includes(selectedAgency)) return false;
      if (selectedSubject && !(r.researchSubjects || []).includes(selectedSubject)) return false;
      if (selectedFundingStatusSlice === 'Grant-Funded (FU)' && (r.fundingAgencies || []).length === 0)
        return false;
      if (
        selectedFundingStatusSlice === 'Unfunded / No Grant' &&
        (r.fundingAgencies || []).length > 0
      )
        return false;
      return true;
    });
  }, [records, selectedAgency, selectedSubject, selectedFundingStatusSlice]);

  const maxSubjectDocs = Math.max(1, ...analytics.researchSubjects.map((s) => s.documents));
  const maxCountryDocs = Math.max(1, ...analytics.countryCollaboration.map((c) => c.totalDocuments));
  const maxAnnualFundingDocs = Math.max(
    1,
    ...analytics.annualFundingSeries.map((pt) => pt.totalDocs)
  );
  const maxAnnualMeanTc = Math.max(
    1,
    ...analytics.annualFundingSeries.map((pt) => Math.max(pt.fundedMeanTc, pt.unfundedMeanTc))
  );

  // Bubble chart bounds
  const bubbleAgencies = analytics.fundingAgencies.slice(0, 12);
  const maxBubbleDocs = Math.max(1, ...bubbleAgencies.map((a) => a.documents));
  const maxBubbleAvgCit = Math.max(1, ...bubbleAgencies.map((a) => a.avgCitations));
  const maxBubbleTotalCit = Math.max(1, ...bubbleAgencies.map((a) => a.totalCitations));
  const maxBubbleH = Math.max(1, ...bubbleAgencies.map((a) => a.hIndex));

  const activeMetadataList =
    metadataSubTab === 'oa'
      ? analytics.openAccessBreakdown
      : metadataSubTab === 'publishers'
      ? analytics.publisherBreakdown
      : metadataSubTab === 'doctypes'
      ? analytics.docTypeBreakdown
      : analytics.languageBreakdown;

  return (
    <div className="space-y-6">
      {/* Top KPI Strip: Funding, Subject Coverage, Citation Advantage & Open Access */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Funding Sponsors (FU/FX), Research Subjects (SC/WC) & Stratified Metadata Intelligence
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Interactive Pie/Donut charts, Annual Funding Trends, Funder × Subject Heatmap Matrix, Impact Bubble Plot, and multi-dimensional stratification.
            </p>
          </div>
          {(selectedAgency || selectedSubject || selectedFundingStatusSlice) && (
            <button
              onClick={() => {
                setSelectedAgency(null);
                setSelectedSubject(null);
                setSelectedFundingStatusSlice(null);
              }}
              className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors whitespace-nowrap shrink-0"
            >
              Clear Active Filter (
              {[selectedAgency, selectedSubject, selectedFundingStatusSlice]
                .filter(Boolean)
                .join(' + ')}
              )
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
            <div className="text-xs text-slate-500 dark:text-slate-400">Funded Corpus Share</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-blue-600 dark:text-blue-400 mt-0.5">
              {analytics.fundedSharePct}%
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
              {analytics.fundedDocsCount} Funded · {analytics.unfundedDocsCount} Unfunded
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
            <div className="text-xs text-slate-500 dark:text-slate-400">Funding Agencies (FU)</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
              {analytics.uniqueFundingAgenciesCount}
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
              Harmonized grant sponsors
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
            <div className="text-xs text-slate-500 dark:text-slate-400">Funded Avg. Citations</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
              {analytics.fundedAvgCitations.toLocaleString()}
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
              vs {analytics.unfundedAvgCitations.toLocaleString()} Unfunded ({analytics.citationAdvantageRatio}x)
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
            <div className="text-xs text-slate-500 dark:text-slate-400">Research Subjects (SC)</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
              {analytics.uniqueSubjectsCount}
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
              WoS / Scopus / OpenAlex areas
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
            <div className="text-xs text-slate-500 dark:text-slate-400">Open Access Rate</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
              {records.length > 0
                ? Math.round(
                    (records.filter((r) => (r.openAccess || 'Gold OA') !== 'Closed').length /
                      records.length) *
                      100
                  )
                : 0}
              %
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
              Gold · Green · Hybrid OA
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
            <div className="text-xs text-slate-500 dark:text-slate-400">Active Countries</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
              {analytics.countryCollaboration.length}
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
              SCP & MCP tracked
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Interactive Pie & Donut Charts for Funding Status & Top Agencies / Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6">
          <InteractivePieDonutChart
            title="Funding Status & Metadata Composition"
            subtitle="Compare corpus proportions by Grant Funding Status, Open Access Tiers, or Collaboration Type."
            slices={leftPieSlices}
            selectedLabel={selectedFundingStatusSlice}
            onSelectLabel={(label) => setSelectedFundingStatusSlice(label)}
            headerRight={
              <select
                value={leftPieMode}
                onChange={(e) => {
                  setLeftPieMode(e.target.value as any);
                  setSelectedFundingStatusSlice(null);
                }}
                aria-label="Select left pie chart dimension"
                className="px-2 py-1 text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded font-medium"
              >
                <option value="funding-status">Funded vs. Unfunded</option>
                <option value="open-access">Open Access Tiers (OA)</option>
                <option value="collaboration">Collaboration (SCP vs. MCP)</option>
              </select>
            }
          />
        </div>

        <div className="lg:col-span-6">
          <InteractivePieDonutChart
            title={
              rightPieMode === 'agencies'
                ? 'Top Funding Agencies Market Share (FU)'
                : 'Research Subject Categories Share (SC/WC)'
            }
            subtitle="Click any slice or legend item to filter the publication explorer and cross-tabulations."
            slices={rightPieSlices}
            selectedLabel={rightPieMode === 'agencies' ? selectedAgency : selectedSubject}
            onSelectLabel={(label) => {
              if (rightPieMode === 'agencies') {
                setSelectedAgency(label === 'Other Sponsors' ? null : label);
              } else {
                setSelectedSubject(label);
              }
            }}
            headerRight={
              <select
                value={rightPieMode}
                onChange={(e) => setRightPieMode(e.target.value as 'agencies' | 'subjects')}
                aria-label="Select right pie chart dimension"
                className="px-2 py-1 text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded font-medium"
              >
                <option value="agencies">Top Funding Sponsors (FU)</option>
                <option value="subjects">Research Subjects (SC/WC)</option>
              </select>
            }
          />
        </div>
      </div>

      {/* Row 2: Stacked Annual Funding Trend Chart & Funding Agency Impact Bubble Plot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Stacked Annual Trend of Funded vs Unfunded Output & Citation Velocity */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Stacked Annual Funding Trend & Citation Advantage
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Stacked bars track annual Grant-Funded vs. Unfunded documents; lines compare mean citation velocity.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono shrink-0">
              <span className="text-blue-600 dark:text-blue-400">■ Funded Docs</span>
              <span className="text-slate-400">■ Unfunded</span>
              <span className="text-emerald-600 dark:text-emerald-400">— Funded Mean TC</span>
            </div>
          </div>

          <div className="h-56 w-full bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded p-3">
            <svg viewBox="0 0 520 190" className="w-full h-full overflow-visible">
              {[0, 0.5, 1].map((t, idx) => {
                const y = 155 - t * 130;
                return (
                  <g key={idx}>
                    <line
                      x1={38}
                      y1={y}
                      x2={480}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-200 dark:text-slate-800"
                      strokeDasharray={idx === 0 ? undefined : '3 3'}
                    />
                    <text
                      x={32}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[10px] font-mono fill-slate-400"
                    >
                      {Math.round(t * maxAnnualFundingDocs)}
                    </text>
                  </g>
                );
              })}

              {analytics.annualFundingSeries.map((pt, idx) => {
                const step = 430 / Math.max(1, analytics.annualFundingSeries.length);
                const x = 44 + idx * step + step * 0.18;
                const barW = Math.min(34, step * 0.62);
                const fundedH = (pt.fundedDocs / maxAnnualFundingDocs) * 130;
                const unfundedH = (pt.unfundedDocs / maxAnnualFundingDocs) * 130;
                const yFunded = 155 - fundedH;
                const yUnfunded = yFunded - unfundedH;

                return (
                  <g key={pt.year}>
                    {/* Funded bottom segment */}
                    {pt.fundedDocs > 0 && (
                      <rect
                        x={x}
                        y={yFunded}
                        width={barW}
                        height={Math.max(2, fundedH)}
                        fill="#2563EB"
                      >
                        <title>
                          {pt.year} Funded: {pt.fundedDocs} docs ({pt.fundedSharePct}%) · Mean TC:{' '}
                          {pt.fundedMeanTc}
                        </title>
                      </rect>
                    )}
                    {/* Unfunded top segment */}
                    {pt.unfundedDocs > 0 && (
                      <rect
                        x={x}
                        y={yUnfunded}
                        width={barW}
                        height={Math.max(2, unfundedH)}
                        fill="#94A3B8"
                      >
                        <title>
                          {pt.year} Unfunded: {pt.unfundedDocs} docs · Mean TC: {pt.unfundedMeanTc}
                        </title>
                      </rect>
                    )}
                    <text
                      x={x + barW / 2}
                      y={173}
                      textAnchor="middle"
                      className="text-[10px] font-mono fill-slate-600 dark:fill-slate-400"
                    >
                      {pt.year}
                    </text>
                  </g>
                );
              })}

              {/* Funded Mean Citation Line */}
              {analytics.annualFundingSeries.length > 1 && (
                <path
                  d={analytics.annualFundingSeries
                    .map((pt, idx) => {
                      const step = 430 / Math.max(1, analytics.annualFundingSeries.length);
                      const cx = 44 + idx * step + step * 0.5;
                      const cy = 155 - (pt.fundedMeanTc / maxAnnualMeanTc) * 125;
                      return `${idx === 0 ? 'M' : 'L'} ${cx} ${cy}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth={2.2}
                />
              )}

              {analytics.annualFundingSeries.map((pt, idx) => {
                const step = 430 / Math.max(1, analytics.annualFundingSeries.length);
                const cx = 44 + idx * step + step * 0.5;
                const cy = 155 - (pt.fundedMeanTc / maxAnnualMeanTc) * 125;
                return (
                  <circle
                    key={pt.year}
                    cx={cx}
                    cy={cy}
                    r={3.5}
                    fill="#10B981"
                    stroke="#FFFFFF"
                    strokeWidth={1.2}
                  >
                    <title>
                      {pt.year} Funded Mean Citations: {pt.fundedMeanTc}
                    </title>
                  </circle>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Funding Agency Citation Impact Bubble Chart */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Funding Agency Citation Impact Bubble Plot
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                X: Funded Documents · Y: Avg. Citations/Doc · Bubble Size:{' '}
                {bubbleSizeBy === 'hIndex' ? 'h-index' : 'Total Citations'}. Click bubble to filter.
              </p>
            </div>
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded shrink-0">
              <button
                onClick={() => setBubbleSizeBy('hIndex')}
                className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  bubbleSizeBy === 'hIndex'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Size: h-index
              </button>
              <button
                onClick={() => setBubbleSizeBy('totalCitations')}
                className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  bubbleSizeBy === 'totalCitations'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Size: Total TC
              </button>
            </div>
          </div>

          <div className="h-56 w-full bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded p-3">
            <svg viewBox="0 0 520 190" className="w-full h-full overflow-visible">
              {/* Axes */}
              <line
                x1={46}
                y1={155}
                x2={495}
                y2={155}
                stroke="currentColor"
                className="text-slate-300 dark:text-slate-700"
              />
              <line
                x1={46}
                y1={20}
                x2={46}
                y2={155}
                stroke="currentColor"
                className="text-slate-300 dark:text-slate-700"
              />
              <text
                x={270}
                y={178}
                textAnchor="middle"
                className="text-[10px] font-mono fill-slate-500"
              >
                Funded Documents (N) →
              </text>
              <text
                x={14}
                y={90}
                textAnchor="middle"
                transform="rotate(-90, 14, 90)"
                className="text-[10px] font-mono fill-slate-500"
              >
                Mean Citations / Doc →
              </text>

              {bubbleAgencies.map((ag, idx) => {
                const cx = 65 + (ag.documents / maxBubbleDocs) * 405;
                const cy = 142 - (ag.avgCitations / maxBubbleAvgCit) * 110;
                const sizeRatio =
                  bubbleSizeBy === 'hIndex'
                    ? ag.hIndex / maxBubbleH
                    : ag.totalCitations / maxBubbleTotalCit;
                const r = Math.max(8, Math.min(24, 7 + sizeRatio * 16));
                const isSelected = selectedAgency === ag.agency;
                const isHovered = hoveredBubbleAgency === ag.agency;
                const color = STRATUM_PALETTE[idx % STRATUM_PALETTE.length];

                return (
                  <g
                    key={ag.agency}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredBubbleAgency(ag.agency)}
                    onMouseLeave={() => setHoveredBubbleAgency(null)}
                    onClick={() => setSelectedAgency(isSelected ? null : ag.agency)}
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={color}
                      fillOpacity={isSelected || isHovered ? 0.92 : 0.72}
                      stroke={isSelected ? '#0F172A' : '#FFFFFF'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    >
                      <title>
                        {ag.agency}: {ag.documents} docs · Avg TC: {ag.avgCitations} · h-index:{' '}
                        {ag.hIndex} · OA: {ag.openAccessPct}%
                      </title>
                    </circle>
                    <text
                      x={cx}
                      y={cy - r - 4}
                      textAnchor="middle"
                      className="text-[10px] font-medium fill-slate-800 dark:fill-slate-200 pointer-events-none"
                    >
                      {ag.agency.length > 18 ? ag.agency.slice(0, 16) + '…' : ag.agency}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Row 3: Funder × Research Subject 2D Heatmap Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Funding Agency × Research Subject Heatmap Matrix (FU × SC/WC)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cross-tabulates grant sponsors against disciplinary subject categories. Click any matrix cell to filter publications by both Funder and Subject.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            Cell Format: Documents (Mean Citations)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/60 dark:bg-slate-950/60">
                <th className="py-2.5 px-3 min-w-[180px]">Funding Sponsor (FU) \ Subject (SC)</th>
                {analytics.funderSubjectMatrix.subjects.map((subj) => (
                  <th key={subj} className="py-2.5 px-2.5 text-center min-w-[125px]">
                    <div className="truncate max-w-[135px] mx-auto" title={subj}>
                      {subj}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono tabular-nums">
              {analytics.funderSubjectMatrix.funders.map((funder) => (
                <tr key={funder}>
                  <td className="py-2 px-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                    {funder}
                  </td>
                  {analytics.funderSubjectMatrix.subjects.map((subject) => {
                    const cell =
                      analytics.funderSubjectMatrix.cells[`${funder}|||${subject}`];
                    const count = cell?.count || 0;
                    const avgCit = cell?.avgCitations || 0;
                    const intensity =
                      count > 0
                        ? 0.15 + (count / analytics.funderSubjectMatrix.maxCellCount) * 0.7
                        : 0;
                    const isCellSelected =
                      selectedAgency === funder && selectedSubject === subject;

                    return (
                      <td
                        key={subject}
                        onClick={() => {
                          if (count === 0) return;
                          if (isCellSelected) {
                            setSelectedAgency(null);
                            setSelectedSubject(null);
                          } else {
                            setSelectedAgency(funder);
                            setSelectedSubject(subject);
                          }
                        }}
                        style={{
                          backgroundColor:
                            count > 0 ? `rgba(37, 99, 235, ${intensity})` : undefined
                        }}
                        className={`py-2.5 px-2 text-center border border-slate-100 dark:border-slate-800/80 transition-all ${
                          count > 0 ? 'cursor-pointer hover:ring-1 hover:ring-blue-600' : ''
                        } ${isCellSelected ? 'ring-2 ring-blue-700 font-bold' : ''}`}
                      >
                        {count > 0 ? (
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {count} doc{count > 1 ? 's' : ''}
                            </span>
                            <div className="text-[10px] text-slate-700 dark:text-slate-200">
                              {avgCit} avg TC
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: Multi-Dimensional Stratified Cohort Comparison Panel */}
      <StratifiedCohortPanel
        records={records}
        stratifyBy={stratifyBy}
        onChangeStratifyBy={onChangeStratifyBy}
        moduleTitle="Stratified Funding & Metadata Cohort Benchmarking"
      />

      {/* Row 5: Funding Agencies Performance Table & Subject of Research Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Funding Agencies & Grant Sponsors Table */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Top Funding Agencies & Grant Sponsors (FU)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Harmonized across Scopus Funding Details, Web of Science FU/FX, PubMed Grants (GR), and OpenAlex Funder tags. Click any agency to filter publications.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/60 dark:bg-slate-950/60">
                  <th className="py-2 px-3">Funding Agency / Sponsor</th>
                  <th className="py-2 px-2 text-right">Docs</th>
                  <th className="py-2 px-2 text-right">h-index</th>
                  <th className="py-2 px-2 text-right">Total Cit.</th>
                  <th className="py-2 px-2 text-right">OA %</th>
                  <th className="py-2 px-3">Primary Research Subjects Funded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono tabular-nums">
                {analytics.fundingAgencies.map((item) => {
                  const isSelected = selectedAgency === item.agency;
                  return (
                    <tr
                      key={item.agency}
                      onClick={() => setSelectedAgency(isSelected ? null : item.agency)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                        {item.agency}
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-blue-600 dark:text-blue-400">
                        {item.documents}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-700 dark:text-slate-300">
                        {item.hIndex}
                      </td>
                      <td className="py-2.5 px-2 text-right font-semibold text-slate-900 dark:text-slate-100">
                        {item.totalCitations.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 text-right text-emerald-600 dark:text-emerald-400">
                        {item.openAccessPct}%
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                        {item.topSubjects.join(' · ')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Subject of Research / Disciplinary Distribution */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Subject of Research Distribution (SC / WC)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Disciplinary output, average citation impact, and grant-funding intensity per research subject area. Click any subject to filter.
            </p>
          </div>

          <div className="space-y-3 flex-1">
            {analytics.researchSubjects.map((subj) => {
              const isSelected = selectedSubject === subj.subject;
              const widthPct = (subj.documents / maxSubjectDocs) * 100;
              return (
                <div
                  key={subj.subject}
                  onClick={() => setSelectedSubject(isSelected ? null : subj.subject)}
                  className={`p-2.5 rounded border cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {subj.subject}
                    </span>
                    <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300 shrink-0">
                      {subj.documents} docs ({subj.sharePct}%)
                    </span>
                  </div>

                  <div className="mt-1.5 h-2 w-full bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-600 dark:bg-blue-500 rounded"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    <span>
                      Avg. TC: {subj.avgCitations} · h-index: {subj.hIndex} · Funded: {subj.fundedPct}%
                    </span>
                    {subj.topFundingAgencies[0] && (
                      <span className="font-sans truncate max-w-[190px]">
                        Top Sponsor: {subj.topFundingAgencies[0]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 6: Country SCP/MCP Collaboration & Extended Metadata Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Country Scientific Production & SCP/MCP Collaboration */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Country Scientific Production & Collaboration (SCP vs. MCP)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Single Country Publications (SCP, domestic) vs. Multiple Country Publications (MCP, international collaboration).
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono shrink-0">
              <span className="text-blue-600 dark:text-blue-400">■ SCP</span>
              <span className="text-emerald-600 dark:text-emerald-400">■ MCP (Intl)</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {analytics.countryCollaboration.slice(0, 10).map((item) => {
              const scpW = (item.scp / maxCountryDocs) * 100;
              const mcpW = (item.mcp / maxCountryDocs) * 100;
              return (
                <div key={item.country} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between font-mono tabular-nums">
                    <span className="font-sans font-medium text-slate-800 dark:text-slate-200">
                      {item.country}
                    </span>
                    <span className="text-slate-500">
                      {item.totalDocuments} docs · SCP: {item.scp} · MCP: {item.mcp} ({item.mcpRatioPct}% Intl) · TC: {item.totalCitations.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded overflow-hidden flex">
                    <div
                      className="h-full bg-blue-600"
                      style={{ width: `${scpW}%` }}
                      title={`Single Country Publications (SCP): ${item.scp}`}
                    />
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${mcpW}%` }}
                      title={`Multiple Country Publications (MCP): ${item.mcp}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Extended Bibliographic Metadata Breakdown */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Extended Metadata Distribution & Citation Impact
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Compare publication volume and mean citation velocity across metadata dimensions.
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg w-fit">
              <button
                onClick={() => setMetadataSubTab('oa')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  metadataSubTab === 'oa'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Open Access (OA)
              </button>
              <button
                onClick={() => setMetadataSubTab('publishers')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  metadataSubTab === 'publishers'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Publishers (PU)
              </button>
              <button
                onClick={() => setMetadataSubTab('doctypes')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  metadataSubTab === 'doctypes'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Doc Types (DT)
              </button>
              <button
                onClick={() => setMetadataSubTab('languages')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  metadataSubTab === 'languages'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Languages (LA)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/60 dark:bg-slate-950/60">
                  <th className="py-2 px-3">Metadata Category</th>
                  <th className="py-2 px-2 text-right">Documents</th>
                  <th className="py-2 px-2 text-right">Corpus Share</th>
                  <th className="py-2 px-2 text-right">Total Citations</th>
                  <th className="py-2 px-3 text-right">Avg. Citations / Doc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono tabular-nums">
                {activeMetadataList.map((item) => (
                  <tr key={item.label} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                      {item.label}
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-blue-600 dark:text-blue-400">
                      {item.count}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-600 dark:text-slate-400">
                      {item.sharePct}%
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-900 dark:text-slate-100">
                      {item.totalCitations.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {item.avgCitations.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 7: Interactive Publications Drill-Down by Funding Agency & Subject of Research */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Funding & Subject Publication Explorer ({filteredDrilldownRecords.length} Documents)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedAgency || selectedSubject || selectedFundingStatusSlice
                ? `Filtered by: ${[selectedAgency, selectedSubject, selectedFundingStatusSlice]
                    .filter(Boolean)
                    .join(' + ')}`
                : 'Showing all harmonized documents with Funding Sponsors (FU), Grant Acknowledgments (FX), Subject Areas (SC/WC), and Open Access status.'}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/60 dark:bg-slate-950/60">
                <th className="py-2 px-3">Title & Grant Text (FX)</th>
                <th className="py-2 px-3">Funding Agencies (FU)</th>
                <th className="py-2 px-3">Research Subjects (SC/WC)</th>
                <th className="py-2 px-2">Open Access</th>
                <th className="py-2 px-2 text-right">Year</th>
                <th className="py-2 px-3 text-right">Citations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredDrilldownRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2.5 px-3 max-w-sm">
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {rec.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
                      {rec.authors.slice(0, 3).join('; ')} · {rec.source} · {rec.publisher || 'Academic Press'}
                    </div>
                    {rec.fundingText && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 italic">
                        FX: {rec.fundingText}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-[200px]">
                    {(rec.fundingAgencies || []).length > 0 ? (
                      (rec.fundingAgencies || []).join(' · ')
                    ) : (
                      <span className="text-slate-400">Unfunded / Not Reported</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-[200px]">
                    {(rec.researchSubjects || []).join(' · ')}
                  </td>
                  <td className="py-2.5 px-2 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                    {rec.openAccess || 'Gold OA'}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    {rec.year}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {rec.citations.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
