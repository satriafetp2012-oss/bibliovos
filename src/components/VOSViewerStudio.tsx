import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Search,
  Sun,
  Moon,
  Sliders,
  Network,
  Layers,
  Flame
} from 'lucide-react';
import {
  BibRecord,
  StratifyDimension,
  VOSAnalysisType,
  VOSNode,
  VOSNodeScaleBy,
  VOSOverlayColorBy,
  VOSUnitOfAnalysis,
  VOSViewMode
} from '../types/bibliometrics';
import {
  buildVOSNetwork,
  partitionCorpusByStrata,
  VOS_CLUSTER_COLORS
} from '../utils/bibliometricEngine';

interface VOSViewerStudioProps {
  records: BibRecord[];
  stratifyBy?: StratifyDimension;
  onChangeStratifyBy?: (dim: StratifyDimension) => void;
}

function interpolateOverlayColor(t: number): string {
  // Viridis-inspired scientific color scale: Deep Blue -> Teal -> Green -> Yellow
  const clamped = Math.max(0, Math.min(1, t));
  const stops = [
    [49, 54, 149],   // #313695
    [44, 123, 182],  // #2c7bb6
    [0, 166, 147],   // #00a693
    [127, 188, 65],  // #7fbc41
    [245, 158, 11]   // #f59e0b
  ];
  const scaled = clamped * (stops.length - 1);
  const idx = Math.min(stops.length - 2, Math.floor(scaled));
  const frac = scaled - idx;
  const r = Math.round(stops[idx][0] + (stops[idx + 1][0] - stops[idx][0]) * frac);
  const g = Math.round(stops[idx][1] + (stops[idx + 1][1] - stops[idx][1]) * frac);
  const b = Math.round(stops[idx][2] + (stops[idx + 1][2] - stops[idx][2]) * frac);
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export const VOSViewerStudio: React.FC<VOSViewerStudioProps> = ({
  records,
  stratifyBy = 'none'
}) => {
  const [viewMode, setViewMode] = useState<VOSViewMode>('network');
  const [analysisType, setAnalysisType] = useState<VOSAnalysisType>('co-occurrence');
  const [unit, setUnit] = useState<VOSUnitOfAnalysis>('all-keywords');
  const [minOccurrences, setMinOccurrences] = useState(1);
  const [minLinkStrength, setMinLinkStrength] = useState(1);
  const [resolution, setResolution] = useState(1.0);
  const [scaleBy, setScaleBy] = useState<VOSNodeScaleBy>('occurrences');
  const [overlayColorBy, setOverlayColorBy] = useState<VOSOverlayColorBy>('avgYear');
  const [densityMode, setDensityMode] = useState<'item' | 'cluster'>('item');
  const [kernelBandwidth, setKernelBandwidth] = useState(70);
  const [curvedLinks, setCurvedLinks] = useState(true);
  const [darkCanvas, setDarkCanvas] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedStratumLabel, setSelectedStratumLabel] = useState<string>('ALL');

  const strata = useMemo(
    () => partitionCorpusByStrata(records, stratifyBy === 'none' ? 'funding-status' : stratifyBy),
    [records, stratifyBy]
  );

  const stratifiedRecords = useMemo(() => {
    if (selectedStratumLabel === 'ALL') return records;
    const found = strata.find((s) => s.label === selectedStratumLabel);
    return found ? found.records : records;
  }, [records, strata, selectedStratumLabel]);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [nodeOffsets, setNodeOffsets] = useState<Record<string, { dx: number; dy: number }>>({});

  const densityCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Keep unit valid when analysisType changes
  const handleAnalysisTypeChange = (nextType: VOSAnalysisType) => {
    setAnalysisType(nextType);
    setSelectedNodeId(null);
    setSelectedCluster(null);
    setNodeOffsets({});
    if (nextType === 'co-occurrence') setUnit('all-keywords');
    else if (nextType === 'co-authorship') setUnit('authors');
    else if (nextType === 'citation') setUnit('documents');
    else setUnit('sources');
  };

  const network = useMemo(
    () => buildVOSNetwork(stratifiedRecords, analysisType, unit, minOccurrences, 55, resolution),
    [stratifiedRecords, analysisType, unit, minOccurrences, resolution]
  );

  const nodesWithOffsets: VOSNode[] = useMemo(
    () =>
      network.nodes.map((n) => {
        const off = nodeOffsets[n.id];
        return off ? { ...n, x: n.x + off.dx, y: n.y + off.dy } : n;
      }),
    [network.nodes, nodeOffsets]
  );

  const filteredLinks = useMemo(
    () => network.links.filter((l) => l.strength >= minLinkStrength),
    [network.links, minLinkStrength]
  );

  const activeFocusNodeId = hoveredNodeId || selectedNodeId;
  const connectedNodeIds = useMemo(() => {
    if (!activeFocusNodeId) return null;
    const set = new Set<string>([activeFocusNodeId]);
    for (const l of filteredLinks) {
      if (l.source === activeFocusNodeId) set.add(l.target);
      if (l.target === activeFocusNodeId) set.add(l.source);
    }
    return set;
  }, [activeFocusNodeId, filteredLinks]);

  // Draw VOSviewer Kernel Density Heatmap when viewMode === 'density'
  useEffect(() => {
    const canvas = densityCanvasRef.current;
    if (!canvas || viewMode !== 'density') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 450;
    const height = 290;
    canvas.width = width;
    canvas.height = height;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;
    const sigma = (kernelBandwidth / 100) * 42;
    const twoSigmaSq = 2 * sigma * sigma;

    const projected = nodesWithOffsets
      .filter((n) => !selectedCluster || n.cluster === selectedCluster)
      .map((n) => {
        const sx = ((n.x * 0.42 + 0.5) * width - width / 2) * zoom + width / 2 + pan.x * 0.5;
        const sy = ((n.y * 0.42 + 0.5) * height - height / 2) * zoom + height / 2 + pan.y * 0.5;
        const w =
          scaleBy === 'tls'
            ? Math.max(1, n.tls)
            : scaleBy === 'citations'
            ? Math.max(1, Math.sqrt(n.citations))
            : n.occurrences;
        const rgb = hexToRgb(VOS_CLUSTER_COLORS[(n.cluster - 1) % VOS_CLUSTER_COLORS.length]);
        return { sx, sy, w, rgb };
      });

    let maxD = 0.001;
    const densityGrid = new Float32Array(width * height);
    const rGrid = new Float32Array(width * height);
    const gGrid = new Float32Array(width * height);
    const bGrid = new Float32Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let dSum = 0;
        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        for (let i = 0; i < projected.length; i++) {
          const p = projected[i];
          const dx = x - p.sx;
          const dy = y - p.sy;
          const d2 = dx * dx + dy * dy;
          if (d2 > twoSigmaSq * 3.2) continue;
          const k = p.w * Math.exp(-d2 / twoSigmaSq);
          dSum += k;
          if (densityMode === 'cluster') {
            rSum += k * p.rgb[0];
            gSum += k * p.rgb[1];
            bSum += k * p.rgb[2];
          }
        }
        const idx = y * width + x;
        densityGrid[idx] = dSum;
        if (densityMode === 'cluster' && dSum > 0) {
          rGrid[idx] = rSum / dSum;
          gGrid[idx] = gSum / dSum;
          bGrid[idx] = bSum / dSum;
        }
        if (dSum > maxD) maxD = dSum;
      }
    }

    for (let i = 0; i < width * height; i++) {
      const norm = Math.min(1, Math.pow(densityGrid[i] / maxD, 0.65));
      const pIdx = i * 4;

      if (densityMode === 'cluster') {
        const bg = darkCanvas ? [11, 14, 23] : [248, 250, 252];
        data[pIdx] = Math.round(bg[0] + (rGrid[i] - bg[0]) * norm);
        data[pIdx + 1] = Math.round(bg[1] + (gGrid[i] - bg[1]) * norm);
        data[pIdx + 2] = Math.round(bg[2] + (bGrid[i] - bg[2]) * norm);
        data[pIdx + 3] = 255;
      } else {
        // VOSviewer classic Item Density heatmap ramp (Deep Blue -> Cyan -> Green -> Yellow -> Red)
        let r = 15,
          g = 23,
          b = 62;
        if (norm < 0.25) {
          const f = norm / 0.25;
          r = Math.round(15 + f * 5);
          g = Math.round(23 + f * 110);
          b = Math.round(62 + f * 140);
        } else if (norm < 0.55) {
          const f = (norm - 0.25) / 0.3;
          r = Math.round(20 + f * 50);
          g = Math.round(133 + f * 75);
          b = Math.round(202 - f * 120);
        } else if (norm < 0.82) {
          const f = (norm - 0.55) / 0.27;
          r = Math.round(70 + f * 180);
          g = Math.round(208 + f * 25);
          b = Math.round(82 - f * 60);
        } else {
          const f = (norm - 0.82) / 0.18;
          r = 250;
          g = Math.round(233 - f * 165);
          b = Math.round(22 + f * 10);
        }
        data[pIdx] = r;
        data[pIdx + 1] = g;
        data[pIdx + 2] = b;
        data[pIdx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [
    viewMode,
    nodesWithOffsets,
    kernelBandwidth,
    densityMode,
    scaleBy,
    zoom,
    pan,
    selectedCluster,
    darkCanvas
  ]);

  const getNodeColor = (node: VOSNode) => {
    if (viewMode === 'overlay') {
      if (overlayColorBy === 'avgYear') {
        const span = Math.max(0.5, network.maxYear - network.minYear);
        return interpolateOverlayColor((node.avgYear - network.minYear) / span);
      }
      if (overlayColorBy === 'avgCitations') {
        const span = Math.max(1, network.maxCitations - network.minCitations);
        return interpolateOverlayColor((node.avgCitations - network.minCitations) / span);
      }
      if (overlayColorBy === 'fundedShare') {
        return interpolateOverlayColor((node.fundedSharePct ?? 0) / 100);
      }
      if (overlayColorBy === 'openAccessShare') {
        return interpolateOverlayColor((node.openAccessSharePct ?? 0) / 100);
      }
      if (overlayColorBy === 'mcpShare') {
        return interpolateOverlayColor((node.mcpSharePct ?? 0) / 100);
      }
      return interpolateOverlayColor(Math.min(1, node.normCitations / 2.2));
    }
    return VOS_CLUSTER_COLORS[(node.cluster - 1) % VOS_CLUSTER_COLORS.length];
  };

  const getNodeRadius = (node: VOSNode) => {
    if (scaleBy === 'tls') return Math.max(7, Math.min(26, 6 + Math.sqrt(node.tls) * 2.5));
    if (scaleBy === 'citations') return Math.max(7, Math.min(26, 6 + Math.sqrt(node.citations) * 0.25));
    return Math.max(8, Math.min(26, 6 + node.occurrences * 2.4));
  };

  const handleExportSVG = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vosviewer_${viewMode}_${unit}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedNode = useMemo(
    () => nodesWithOffsets.find((n) => n.id === selectedNodeId) || nodesWithOffsets[0] || null,
    [nodesWithOffsets, selectedNodeId]
  );

  const selectedNodeNeighbors = useMemo(() => {
    if (!selectedNode) return [];
    return filteredLinks
      .filter((l) => l.source === selectedNode.id || l.target === selectedNode.id)
      .map((l) => ({
        neighborId: l.source === selectedNode.id ? l.target : l.source,
        strength: l.strength
      }))
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 8);
  }, [selectedNode, filteredLinks]);

  const selectedNodeRecords = useMemo(() => {
    if (!selectedNode) return [];
    return records.filter((r) => selectedNode.recordIds.includes(r.id));
  }, [selectedNode, records]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT CONTROL COLUMN: VOSviewer Parameters & Clusters */}
      <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            VOSviewer Map Configuration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure network construction, clustering resolution, and overlay/density parameters.
          </p>
        </div>

        {/* 3 Visualization Modes */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Visualization Layer
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg">
            <button
              onClick={() => setViewMode('network')}
              className={`py-1.5 px-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                viewMode === 'network'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Network
            </button>
            <button
              onClick={() => setViewMode('overlay')}
              className={`py-1.5 px-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                viewMode === 'overlay'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Overlay
            </button>
            <button
              onClick={() => setViewMode('density')}
              className={`py-1.5 px-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                viewMode === 'density'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Density
            </button>
          </div>
        </div>

        {/* Analysis Type & Unit */}
        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Type of Analysis
            </label>
            <select
              value={analysisType}
              onChange={(e) => handleAnalysisTypeChange(e.target.value as VOSAnalysisType)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md"
            >
              <option value="co-occurrence">Co-occurrence (Keywords / Concepts)</option>
              <option value="co-authorship">Co-authorship (Collaboration)</option>
              <option value="citation">Citation & Co-citation Network</option>
              <option value="bibliographic-coupling">Bibliographic Coupling</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Unit of Analysis
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as VOSUnitOfAnalysis)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md"
            >
              {analysisType === 'co-occurrence' && (
                <>
                  <option value="all-keywords">All Keywords (Author + Index/MeSH)</option>
                  <option value="author-keywords">Author Keywords (DE)</option>
                  <option value="index-keywords">Keywords Plus / MeSH (ID)</option>
                  <option value="research-subjects">Research Subjects / Categories (SC/WC)</option>
                </>
              )}
              {analysisType === 'co-authorship' && (
                <>
                  <option value="authors">Authors</option>
                  <option value="countries">Countries</option>
                  <option value="organizations">Organizations / Affiliations</option>
                  <option value="funding-agencies">Funding Agencies / Sponsors (FU)</option>
                </>
              )}
              {(analysisType === 'citation' || analysisType === 'bibliographic-coupling') && (
                <>
                  <option value="documents">Documents (Author, Year)</option>
                  <option value="sources">Sources / Journals</option>
                  <option value="authors">Authors</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Sliders: Threshold, Link Strength, Resolution, Scale */}
        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600 dark:text-slate-400">Min. Occurrences / Docs</span>
              <span className="font-mono font-semibold tabular-nums">{minOccurrences}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={minOccurrences}
              onChange={(e) => setMinOccurrences(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600 dark:text-slate-400">Min. Link Strength</span>
              <span className="font-mono font-semibold tabular-nums">{minLinkStrength}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={minLinkStrength}
              onChange={(e) => setMinLinkStrength(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600 dark:text-slate-400">Clustering Resolution (γ)</span>
              <span className="font-mono font-semibold tabular-nums">{resolution.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={resolution}
              onChange={(e) => setResolution(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Scale Node Size By
            </label>
            <select
              value={scaleBy}
              onChange={(e) => setScaleBy(e.target.value as VOSNodeScaleBy)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md"
            >
              <option value="occurrences">Occurrences / Documents</option>
              <option value="tls">Total Link Strength (TLS)</option>
              <option value="citations">Total Citations</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Stratified Cohort Subset
            </label>
            <select
              value={selectedStratumLabel}
              onChange={(e) => {
                setSelectedStratumLabel(e.target.value);
                setSelectedNodeId(null);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md"
            >
              <option value="ALL">All Cohorts ({records.length} docs)</option>
              {strata.map((st) => (
                <option key={st.id} value={st.label}>
                  {st.label} ({st.documents} docs)
                </option>
              ))}
            </select>
          </div>

          {viewMode === 'overlay' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Overlay Color Score
              </label>
              <select
                value={overlayColorBy}
                onChange={(e) => setOverlayColorBy(e.target.value as VOSOverlayColorBy)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md"
              >
                <option value="avgYear">Average Publication Year</option>
                <option value="avgCitations">Average Citations</option>
                <option value="normCitations">Normalized Citations</option>
                <option value="fundedShare">Grant-Funded Share (%) [FU]</option>
                <option value="openAccessShare">Open Access Share (%) [OA]</option>
                <option value="mcpShare">Intl. Collaboration Share (%) [MCP]</option>
              </select>
            </div>
          )}

          {viewMode === 'density' && (
            <div className="space-y-2.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Density Mode
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded">
                  <button
                    onClick={() => setDensityMode('item')}
                    className={`py-1 text-xs font-medium rounded ${
                      densityMode === 'item'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Item Density
                  </button>
                  <button
                    onClick={() => setDensityMode('cluster')}
                    className={`py-1 text-xs font-medium rounded ${
                      densityMode === 'cluster'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Cluster Density
                  </button>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Kernel Bandwidth (h)</span>
                  <span className="font-mono tabular-nums">{kernelBandwidth}%</span>
                </div>
                <input
                  type="range"
                  min={35}
                  max={110}
                  value={kernelBandwidth}
                  onChange={(e) => setKernelBandwidth(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Cluster Filter List */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              VOS Clusters ({network.clusters.length})
            </span>
            {selectedCluster && (
              <button
                onClick={() => setSelectedCluster(null)}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Show All
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {network.clusters.map((cl) => {
              const active = selectedCluster === cl.id;
              return (
                <button
                  key={cl.id}
                  onClick={() => setSelectedCluster(active ? null : cl.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded transition-colors text-left ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: cl.color }}
                    />
                    <span className="truncate">{cl.label}</span>
                  </div>
                  <span className="font-mono tabular-nums text-slate-500 ml-2 shrink-0">
                    {cl.nodeCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CENTER + RIGHT: Interactive VOSviewer Canvas Stage & Node Telemetry */}
      <div className="lg:col-span-9 space-y-4">
        <div
          className={`border rounded-lg overflow-hidden relative transition-colors ${
            darkCanvas
              ? 'bg-[#0B0E17] border-slate-800 text-slate-100'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Top Canvas HUD Ribbon */}
          <div
            className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
              darkCanvas
                ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-3 font-mono tabular-nums">
              <span>Items: {nodesWithOffsets.length}</span>
              <span aria-hidden="true">·</span>
              <span>Links: {filteredLinks.length}</span>
              <span aria-hidden="true">·</span>
              <span>
                Total Link Strength:{' '}
                {filteredLinks.reduce((s, l) => s + l.strength, 0).toLocaleString()}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Find node in map..."
                  className={`pl-8 pr-2.5 py-1 text-xs rounded border focus:outline-none ${
                    darkCanvas
                      ? 'bg-slate-950 border-slate-700 text-slate-100'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <button
                onClick={() => setCurvedLinks((v) => !v)}
                className={`px-2.5 py-1 rounded border text-xs transition-colors whitespace-nowrap ${
                  darkCanvas
                    ? 'border-slate-700 hover:bg-slate-800'
                    : 'border-slate-300 hover:bg-slate-100'
                }`}
              >
                {curvedLinks ? 'Curved Links' : 'Straight Links'}
              </button>

              <button
                onClick={() => setDarkCanvas((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs transition-colors whitespace-nowrap ${
                  darkCanvas
                    ? 'border-slate-700 bg-slate-800 text-amber-300 hover:bg-slate-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {darkCanvas ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                {darkCanvas ? 'Light Canvas' : 'Dark Canvas'}
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom((z) => Math.min(2.4, Number((z + 0.2).toFixed(2))))}
                  title="Zoom In"
                  className={`p-1 rounded border ${
                    darkCanvas
                      ? 'border-slate-700 hover:bg-slate-800'
                      : 'border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.2).toFixed(2))))}
                  title="Zoom Out"
                  className={`p-1 rounded border ${
                    darkCanvas
                      ? 'border-slate-700 hover:bg-slate-800'
                      : 'border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                    setNodeOffsets({});
                    setSelectedCluster(null);
                  }}
                  title="Reset View"
                  className={`p-1 rounded border ${
                    darkCanvas
                      ? 'border-slate-700 hover:bg-slate-800'
                      : 'border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleExportSVG}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                Export SVG
              </button>
            </div>
          </div>

          {/* Interactive VOSviewer Stage (900x580 coordinate space) */}
          <div className="relative h-[540px] w-full select-none overflow-hidden">
            {viewMode === 'density' && (
              <canvas
                ref={densityCanvasRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            )}

            <svg
              ref={svgRef}
              viewBox="0 0 900 580"
              className="w-full h-full cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => {
                if ((e.target as HTMLElement).tagName === 'svg') {
                  setIsDraggingCanvas(true);
                  setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                }
              }}
              onMouseMove={(e) => {
                if (draggingNodeId && svgRef.current) {
                  const rect = svgRef.current.getBoundingClientRect();
                  const relX = ((e.clientX - rect.left) / rect.width - 0.5) * 2.2 / zoom;
                  const relY = ((e.clientY - rect.top) / rect.height - 0.5) * 2.2 / zoom;
                  const baseNode = network.nodes.find((n) => n.id === draggingNodeId);
                  if (baseNode) {
                    setNodeOffsets((prev) => ({
                      ...prev,
                      [draggingNodeId]: { dx: relX - baseNode.x, dy: relY - baseNode.y }
                    }));
                  }
                } else if (isDraggingCanvas) {
                  setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
                }
              }}
              onMouseUp={() => {
                setIsDraggingCanvas(false);
                setDraggingNodeId(null);
              }}
              onMouseLeave={() => {
                setIsDraggingCanvas(false);
                setDraggingNodeId(null);
              }}
            >
              <g
                transform={`translate(${450 + pan.x}, ${290 + pan.y}) scale(${zoom}) translate(-450, -290)`}
              >
                {/* Network Links (shown in Network and Overlay views) */}
                {viewMode !== 'density' &&
                  filteredLinks.map((link, idx) => {
                    const s = nodesWithOffsets.find((n) => n.id === link.source);
                    const t = nodesWithOffsets.find((n) => n.id === link.target);
                    if (!s || !t) return null;
                    if (
                      selectedCluster &&
                      s.cluster !== selectedCluster &&
                      t.cluster !== selectedCluster
                    ) {
                      return null;
                    }

                    const x1 = (s.x * 0.42 + 0.5) * 900;
                    const y1 = (s.y * 0.42 + 0.5) * 580;
                    const x2 = (t.x * 0.42 + 0.5) * 900;
                    const y2 = (t.y * 0.42 + 0.5) * 580;

                    const isHighlighted =
                      !activeFocusNodeId ||
                      link.source === activeFocusNodeId ||
                      link.target === activeFocusNodeId;

                    const strokeColor =
                      viewMode === 'overlay'
                        ? darkCanvas
                          ? '#475569'
                          : '#94A3B8'
                        : VOS_CLUSTER_COLORS[(s.cluster - 1) % VOS_CLUSTER_COLORS.length];

                    const mx = (x1 + x2) / 2;
                    const my = (y1 + y2) / 2;
                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    const cx = mx - dy * 0.14;
                    const cy = my + dx * 0.14;

                    return curvedLinks ? (
                      <path
                        key={idx}
                        d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={Math.min(5, 0.8 + link.strength * 0.55)}
                        strokeOpacity={isHighlighted ? (activeFocusNodeId ? 0.78 : 0.36) : 0.07}
                      />
                    ) : (
                      <line
                        key={idx}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={strokeColor}
                        strokeWidth={Math.min(5, 0.8 + link.strength * 0.55)}
                        strokeOpacity={isHighlighted ? (activeFocusNodeId ? 0.78 : 0.36) : 0.07}
                      />
                    );
                  })}

                {/* Nodes & Labels */}
                {nodesWithOffsets.map((node) => {
                  if (selectedCluster && node.cluster !== selectedCluster) return null;
                  const cx = (node.x * 0.42 + 0.5) * 900;
                  const cy = (node.y * 0.42 + 0.5) * 580;
                  const r = getNodeRadius(node);
                  const color = getNodeColor(node);

                  const matchesSearch =
                    searchTerm.trim().length > 0 &&
                    node.label.toLowerCase().includes(searchTerm.toLowerCase());
                  const isFocused =
                    !connectedNodeIds || connectedNodeIds.has(node.id) || matchesSearch;
                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${cx}, ${cy})`}
                      className="cursor-pointer"
                      style={{ opacity: isFocused ? 1 : 0.18 }}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(node.id);
                        setDraggingNodeId(node.id);
                      }}
                    >
                      {viewMode !== 'density' && (
                        <circle
                          r={r}
                          fill={color}
                          fillOpacity={0.88}
                          stroke={
                            isSelected || matchesSearch
                              ? '#FACC15'
                              : darkCanvas
                              ? '#0B0E17'
                              : '#FFFFFF'
                          }
                          strokeWidth={isSelected || matchesSearch ? 3 : 1.5}
                        />
                      )}
                      {viewMode === 'density' && (
                        <circle
                          r={3.5}
                          fill={darkCanvas ? '#FFFFFF' : '#0F172A'}
                          fillOpacity={0.75}
                        />
                      )}
                      <text
                        y={viewMode === 'density' ? -6 : r + 12}
                        textAnchor="middle"
                        className="font-sans font-semibold pointer-events-none"
                        fill={
                          viewMode === 'density'
                            ? '#FFFFFF'
                            : darkCanvas
                            ? '#F1F5F9'
                            : '#0F172A'
                        }
                        fontSize={Math.max(10, Math.min(14, 9 + node.occurrences * 0.65))}
                        style={{
                          paintOrder: 'stroke',
                          stroke:
                            viewMode === 'density'
                              ? 'rgba(11,14,23,0.85)'
                              : darkCanvas
                              ? 'rgba(11,14,23,0.9)'
                              : 'rgba(255,255,255,0.92)',
                          strokeWidth: '3px'
                        }}
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Bottom-Right Overlay / Density Color Scale Legend */}
            {viewMode === 'overlay' && (
              <div
                className={`absolute bottom-4 right-4 p-3 rounded-lg border text-xs font-mono tabular-nums ${
                  darkCanvas
                    ? 'bg-slate-900/95 border-slate-800 text-slate-200'
                    : 'bg-white/95 border-slate-200 text-slate-800'
                }`}
              >
                <div className="mb-1.5 font-sans font-medium">
                  {overlayColorBy === 'avgYear'
                    ? 'Avg. Publication Year'
                    : overlayColorBy === 'avgCitations'
                    ? 'Avg. Citations'
                    : overlayColorBy === 'fundedShare'
                    ? 'Grant-Funded Share (%)'
                    : overlayColorBy === 'openAccessShare'
                    ? 'Open Access Share (%)'
                    : overlayColorBy === 'mcpShare'
                    ? 'Intl. Collaboration MCP (%)'
                    : 'Normalized Citations'}
                </div>
                <div
                  className="w-48 h-2.5 rounded"
                  style={{
                    background:
                      'linear-gradient(to right, #313695, #2c7bb6, #00a693, #7fbc41, #f59e0b)'
                  }}
                />
                <div className="flex justify-between text-[11px] mt-1">
                  <span>
                    {overlayColorBy === 'avgYear'
                      ? network.minYear.toFixed(1)
                      : overlayColorBy === 'avgCitations'
                      ? network.minCitations.toFixed(0)
                      : overlayColorBy === 'fundedShare' ||
                        overlayColorBy === 'openAccessShare' ||
                        overlayColorBy === 'mcpShare'
                      ? '0%'
                      : '0.50'}
                  </span>
                  <span>
                    {overlayColorBy === 'avgYear'
                      ? ((network.minYear + network.maxYear) / 2).toFixed(1)
                      : overlayColorBy === 'avgCitations'
                      ? ((network.minCitations + network.maxCitations) / 2).toFixed(0)
                      : overlayColorBy === 'fundedShare' ||
                        overlayColorBy === 'openAccessShare' ||
                        overlayColorBy === 'mcpShare'
                      ? '50%'
                      : '1.25'}
                  </span>
                  <span>
                    {overlayColorBy === 'avgYear'
                      ? network.maxYear.toFixed(1)
                      : overlayColorBy === 'avgCitations'
                      ? network.maxCitations.toFixed(0)
                      : overlayColorBy === 'fundedShare' ||
                        overlayColorBy === 'openAccessShare' ||
                        overlayColorBy === 'mcpShare'
                      ? '100%'
                      : '2.20+'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Selected Node Telemetry & Linked Publications */}
        {selectedNode && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-xs shrink-0"
                    style={{
                      backgroundColor:
                        VOS_CLUSTER_COLORS[
                          (selectedNode.cluster - 1) % VOS_CLUSTER_COLORS.length
                        ]
                    }}
                  />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Node Inspector: {selectedNode.label}
                  </h3>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-500">
                  Cluster {selectedNode.cluster}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
                <div className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
                  <div className="text-slate-500 font-sans">Occurrences</div>
                  <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {selectedNode.occurrences}
                  </div>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
                  <div className="text-slate-500 font-sans">Link Strength</div>
                  <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                    {selectedNode.tls}
                  </div>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
                  <div className="text-slate-500 font-sans">Avg. Year</div>
                  <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {selectedNode.avgYear}
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Strongest Co-occurring Links:{' '}
                </span>
                {selectedNodeNeighbors
                  .map((nb) => `${nb.neighborId} (${nb.strength})`)
                  .join(' · ') || 'No links above current threshold'}
              </div>
            </div>

            <div className="md:col-span-7 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 md:pl-5 space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Contributing Unified Corpus Documents ({selectedNodeRecords.length})
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto text-xs">
                {selectedNodeRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between gap-3 py-1 border-b border-slate-100 dark:border-slate-800/70 last:border-none"
                  >
                    <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                      {rec.title}
                    </span>
                    <span className="font-mono tabular-nums text-slate-500 shrink-0">
                      {rec.year} · TC: {rec.citations} · {rec.databases.join('+')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
