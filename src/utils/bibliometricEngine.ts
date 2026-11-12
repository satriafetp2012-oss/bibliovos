import {
  BibRecord,
  BradfordItem,
  CountryCollaborationMetric,
  FunderSubjectMatrix,
  FundingAgencyMetric,
  HistoriographEdge,
  HistoriographNode,
  ImpactEntity,
  LotkaItem,
  MetadataBreakdownItem,
  ResearchSubjectMetric,
  RPYSPoint,
  SankeyFieldType,
  SankeyLink,
  SankeyNode,
  StratifiedAnnualPoint,
  StratifyDimension,
  StratumGroup,
  ThematicCluster,
  TrendTopicItem,
  VOSAnalysisType,
  VOSLink,
  VOSNetworkData,
  VOSNode,
  VOSUnitOfAnalysis
} from '../types/bibliometrics';

export const VOS_CLUSTER_COLORS = [
  '#2563EB', // Cluster 1: Cobalt Blue
  '#DC2626', // Cluster 2: Crimson Red
  '#16A34A', // Cluster 3: Emerald Green
  '#D97706', // Cluster 4: Amber Gold
  '#7C3AED', // Cluster 5: Royal Violet
  '#0891B2', // Cluster 6: Cyan Teal
  '#DB2777', // Cluster 7: Magenta Rose
  '#4F46E5'  // Cluster 8: Indigo
];

/**
 * Extracts items from a record based on the selected VOSviewer analysis type and unit.
 */
function extractItemsForVOS(
  record: BibRecord,
  analysisType: VOSAnalysisType,
  unit: VOSUnitOfAnalysis
): string[] {
  if (unit === 'research-subjects') {
    return record.researchSubjects && record.researchSubjects.length > 0
      ? record.researchSubjects
      : ['Multidisciplinary Sciences'];
  }
  if (unit === 'funding-agencies') {
    return record.fundingAgencies && record.fundingAgencies.length > 0
      ? record.fundingAgencies
      : [];
  }
  if (analysisType === 'co-occurrence') {
    if (unit === 'author-keywords') return record.authorKeywords;
    if (unit === 'index-keywords') return record.indexKeywords;
    return Array.from(new Set([...record.authorKeywords, ...record.indexKeywords]));
  }
  if (analysisType === 'co-authorship') {
    if (unit === 'countries') return record.countries;
    if (unit === 'organizations') {
      return record.affiliations.map((aff) => aff.split(',')[0].trim()).filter(Boolean);
    }
    return record.authors;
  }
  // For citation or bibliographic coupling
  if (unit === 'sources') return [record.source];
  if (unit === 'authors') return record.authors;
  const firstAuthor = (record.authors[0] || 'Author').split(',')[0];
  return [`${firstAuthor} (${record.year})`];
}

/**
 * Builds the complete VOSviewer network, clusters, link strengths, and 2D layout coordinates.
 */
export function buildVOSNetwork(
  records: BibRecord[],
  analysisType: VOSAnalysisType,
  unit: VOSUnitOfAnalysis,
  minOccurrences: number,
  maxNodes = 60,
  resolution = 1.0
): VOSNetworkData {
  const itemStats = new Map<
    string,
    {
      count: number;
      citations: number;
      yearSum: number;
      recordIds: string[];
      refs: Set<string>;
    }
  >();

  const yearCitationAvg = new Map<number, { sum: number; count: number }>();
  for (const rec of records) {
    const cur = yearCitationAvg.get(rec.year) || { sum: 0, count: 0 };
    cur.sum += rec.citations;
    cur.count += 1;
    yearCitationAvg.set(rec.year, cur);
  }

  const recordItemsMap = new Map<string, string[]>();

  for (const rec of records) {
    const rawItems = extractItemsForVOS(rec, analysisType, unit)
      .map((s) => s.trim())
      .filter(Boolean);
    const uniqueItems = Array.from(new Set(rawItems));
    recordItemsMap.set(rec.id, uniqueItems);

    for (const item of uniqueItems) {
      const st = itemStats.get(item) || {
        count: 0,
        citations: 0,
        yearSum: 0,
        recordIds: [],
        refs: new Set<string>()
      };
      st.count += 1;
      st.citations += rec.citations;
      st.yearSum += rec.year;
      st.recordIds.push(rec.id);
      rec.references.forEach((r) => st.refs.add(r.toLowerCase().slice(0, 45)));
      itemStats.set(item, st);
    }
  }

  const eligible = Array.from(itemStats.entries())
    .filter(([, st]) => st.count >= minOccurrences)
    .sort((a, b) => b[1].count - a[1].count || b[1].citations - a[1].citations)
    .slice(0, maxNodes);

  const validSet = new Set(eligible.map(([label]) => label));
  const pairWeights = new Map<string, number>();

  const addEdgeWeight = (a: string, b: string, w = 1) => {
    if (a === b || !validSet.has(a) || !validSet.has(b)) return;
    const key = a < b ? `${a}|||${b}` : `${b}|||${a}`;
    pairWeights.set(key, (pairWeights.get(key) || 0) + w);
  };

  if (analysisType === 'co-occurrence' || analysisType === 'co-authorship') {
    for (const rec of records) {
      const items = (recordItemsMap.get(rec.id) || []).filter((i) => validSet.has(i));
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          addEdgeWeight(items[i], items[j], 1);
        }
      }
    }
  } else if (analysisType === 'bibliographic-coupling') {
    for (let i = 0; i < eligible.length; i++) {
      for (let j = i + 1; j < eligible.length; j++) {
        const [itemA, stA] = eligible[i];
        const [itemB, stB] = eligible[j];
        let shared = 0;
        stA.refs.forEach((r) => {
          if (stB.refs.has(r)) shared++;
        });
        if (shared > 0) addEdgeWeight(itemA, itemB, shared);
      }
    }
  } else {
    for (let i = 0; i < eligible.length; i++) {
      for (let j = i + 1; j < eligible.length; j++) {
        const [itemA, stA] = eligible[i];
        const [itemB, stB] = eligible[j];
        let coupling = 0;
        stA.refs.forEach((r) => {
          if (stB.refs.has(r)) coupling++;
        });
        const sharedRecs = stA.recordIds.filter((id) => stB.recordIds.includes(id)).length;
        const weight = coupling + sharedRecs;
        if (weight > 0) addEdgeWeight(itemA, itemB, weight);
      }
    }
  }

  const links: VOSLink[] = [];
  const tlsMap = new Map<string, number>();
  const adjacency = new Map<string, Map<string, number>>();

  eligible.forEach(([label]) => {
    tlsMap.set(label, 0);
    adjacency.set(label, new Map());
  });

  pairWeights.forEach((strength, key) => {
    const [source, target] = key.split('|||');
    links.push({ source, target, strength });
    tlsMap.set(source, (tlsMap.get(source) || 0) + strength);
    tlsMap.set(target, (tlsMap.get(target) || 0) + strength);
    adjacency.get(source)?.set(target, strength);
    adjacency.get(target)?.set(source, strength);
  });

  if (links.length === 0 && eligible.length > 1) {
    for (let i = 0; i < eligible.length - 1; i++) {
      const s = eligible[i][0];
      const t = eligible[i + 1][0];
      links.push({ source: s, target: t, strength: 1 });
      tlsMap.set(s, (tlsMap.get(s) || 0) + 1);
      tlsMap.set(t, (tlsMap.get(t) || 0) + 1);
      adjacency.get(s)?.set(t, 1);
      adjacency.get(t)?.set(s, 1);
    }
  }

  const targetClusterCount = Math.max(
    2,
    Math.min(8, Math.round(3 * resolution + eligible.length / 14))
  );
  const clusterMap = new Map<string, number>();
  eligible.forEach(([label], idx) => {
    clusterMap.set(label, idx % targetClusterCount);
  });

  for (let iter = 0; iter < 12; iter++) {
    for (const [label] of eligible) {
      const neighbors = adjacency.get(label);
      if (!neighbors || neighbors.size === 0) continue;
      const clusterScores = new Map<number, number>();
      neighbors.forEach((weight, nb) => {
        const c = clusterMap.get(nb) ?? 0;
        clusterScores.set(c, (clusterScores.get(c) || 0) + weight * resolution);
      });
      let bestCluster = clusterMap.get(label) ?? 0;
      let bestScore = -1;
      clusterScores.forEach((score, c) => {
        const sizePenalty =
          Array.from(clusterMap.values()).filter((v) => v === c).length * (0.12 / resolution);
        const adjusted = score - sizePenalty;
        if (adjusted > bestScore) {
          bestScore = adjusted;
          bestCluster = c;
        }
      });
      clusterMap.set(label, bestCluster);
    }
  }

  const rawClusterGroups = new Map<number, string[]>();
  eligible.forEach(([label]) => {
    const c = clusterMap.get(label) ?? 0;
    const list = rawClusterGroups.get(c) || [];
    list.push(label);
    rawClusterGroups.set(c, list);
  });
  const sortedClusters = Array.from(rawClusterGroups.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );
  const normalizedClusterId = new Map<string, number>();
  sortedClusters.forEach(([, members], idx) => {
    members.forEach((m) => normalizedClusterId.set(m, idx + 1));
  });

  const recById = new Map(records.map((r) => [r.id, r]));

  const nodes: VOSNode[] = eligible.map(([label, st], index) => {
    const cluster = normalizedClusterId.get(label) || 1;
    const clusterAngle = ((cluster - 1) / Math.max(1, sortedClusters.length)) * Math.PI * 2;
    const localAngle = ((index * 137.5) % 360) * (Math.PI / 180);
    const localRadius = 0.18 + (index % 5) * 0.05;

    const avgYear = Number((st.yearSum / Math.max(1, st.count)).toFixed(2));
    const avgCitations = Number((st.citations / Math.max(1, st.count)).toFixed(1));
    const yearBase = yearCitationAvg.get(Math.round(avgYear));
    const fieldMean = yearBase && yearBase.count > 0 ? yearBase.sum / yearBase.count : 500;
    const normCitations = Number((avgCitations / Math.max(1, fieldMean)).toFixed(2));

    const nodeRecs = st.recordIds
      .map((id) => recById.get(id))
      .filter((r): r is BibRecord => Boolean(r));
    const nTotal = Math.max(1, nodeRecs.length);
    const fundedSharePct = Number(
      (
        (nodeRecs.filter((r) => (r.fundingAgencies || []).length > 0).length / nTotal) *
        100
      ).toFixed(0)
    );
    const openAccessSharePct = Number(
      (
        (nodeRecs.filter((r) => (r.openAccess || 'Gold OA') !== 'Closed').length / nTotal) *
        100
      ).toFixed(0)
    );
    const mcpSharePct = Number(
      ((nodeRecs.filter((r) => r.countries.length > 1).length / nTotal) * 100).toFixed(0)
    );

    return {
      id: label,
      label,
      cluster,
      occurrences: st.count,
      tls: tlsMap.get(label) || 0,
      citations: st.citations,
      avgYear,
      avgCitations,
      normCitations,
      fundedSharePct,
      openAccessSharePct,
      mcpSharePct,
      x: Math.cos(clusterAngle) * 0.48 + Math.cos(localAngle) * localRadius,
      y: Math.sin(clusterAngle) * 0.48 + Math.sin(localAngle) * localRadius,
      recordIds: st.recordIds
    };
  });

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  for (let step = 0; step < 65; step++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        const distSq = dx * dx + dy * dy + 0.001;
        const dist = Math.sqrt(distSq);
        if (dist < 0.45) {
          const sameClusterFactor = a.cluster === b.cluster ? 0.0018 : 0.0038;
          const force = sameClusterFactor / distSq;
          dx = (dx / dist) * Math.min(0.04, force);
          dy = (dy / dist) * Math.min(0.04, force);
          a.x += dx;
          a.y += dy;
          b.x -= dx;
          b.y -= dy;
        }
      }
    }
    for (const link of links) {
      const s = nodeById.get(link.source);
      const t = nodeById.get(link.target);
      if (!s || !t) continue;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const pull = 0.015 * Math.min(3, Math.log2(1 + link.strength));
      s.x += dx * pull;
      s.y += dy * pull;
      t.x -= dx * pull;
      t.y -= dy * pull;
    }
  }

  if (nodes.length > 0) {
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = Math.max(0.01, maxX - minX);
    const spanY = Math.max(0.01, maxY - minY);
    for (const n of nodes) {
      n.x = ((n.x - minX) / spanX - 0.5) * 1.72;
      n.y = ((n.y - minY) / spanY - 0.5) * 1.72;
    }
  }

  const clusters = sortedClusters.map(([, members], idx) => {
    const clusterId = idx + 1;
    const clusterNodes = nodes
      .filter((n) => n.cluster === clusterId)
      .sort((a, b) => b.occurrences - a.occurrences);
    const topItems = clusterNodes.slice(0, 3).map((n) => n.label);
    return {
      id: clusterId,
      label: topItems[0] ? `Cluster ${clusterId}: ${topItems[0]}` : `Cluster ${clusterId}`,
      color: VOS_CLUSTER_COLORS[idx % VOS_CLUSTER_COLORS.length],
      nodeCount: members.length,
      topItems
    };
  });

  const years = nodes.map((n) => n.avgYear);
  const cits = nodes.map((n) => n.avgCitations);

  return {
    nodes,
    links,
    clusters,
    minYear: years.length ? Math.min(...years) : 2017,
    maxYear: years.length ? Math.max(...years) : 2026,
    minCitations: cits.length ? Math.min(...cits) : 0,
    maxCitations: cits.length ? Math.max(...cits) : 1000
  };
}

/**
 * Computes Bibliometrix Main Information summary KPIs
 */
export function computeMainInfo(records: BibRecord[]) {
  if (records.length === 0) {
    return {
      timespan: 'N/A',
      totalDocuments: 0,
      totalSources: 0,
      annualGrowthRate: 0,
      avgCitationsPerDoc: 0,
      totalReferences: 0,
      totalAuthors: 0,
      coAuthorsPerDoc: 0,
      internationalCoAuthorshipPct: 0,
      totalAuthorKeywords: 0,
      totalIndexKeywords: 0,
      singleAuthoredDocs: 0
    };
  }

  const years = records.map((r) => r.year).filter(Boolean);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const sources = new Set(records.map((r) => r.source.toLowerCase()));
  const authors = new Set(records.flatMap((r) => r.authors));
  const authKws = new Set(records.flatMap((r) => r.authorKeywords));
  const idxKws = new Set(records.flatMap((r) => r.indexKeywords));
  const refs = new Set(records.flatMap((r) => r.references));

  const totalCitations = records.reduce((s, r) => s + r.citations, 0);
  const totalAuthorSlots = records.reduce((s, r) => s + Math.max(1, r.authors.length), 0);
  const intlDocs = records.filter((r) => r.countries.length > 1).length;
  const singleAuthoredDocs = records.filter((r) => r.authors.length === 1).length;

  const firstYearCount = Math.max(1, records.filter((r) => r.year === minYear).length);
  const lastYearCount = Math.max(1, records.filter((r) => r.year === maxYear).length);
  const nYears = Math.max(1, maxYear - minYear);
  const cagr = (Math.pow(lastYearCount / firstYearCount, 1 / nYears) - 1) * 100;

  return {
    timespan: `${minYear}–${maxYear}`,
    totalDocuments: records.length,
    totalSources: sources.size,
    annualGrowthRate: Number(cagr.toFixed(2)),
    avgCitationsPerDoc: Number((totalCitations / records.length).toFixed(1)),
    totalReferences: refs.size,
    totalAuthors: authors.size,
    coAuthorsPerDoc: Number((totalAuthorSlots / records.length).toFixed(2)),
    internationalCoAuthorshipPct: Number(((intlDocs / records.length) * 100).toFixed(1)),
    totalAuthorKeywords: authKws.size,
    totalIndexKeywords: idxKws.size,
    singleAuthoredDocs
  };
}

/**
 * Computes Annual Scientific Production & Citation Velocity
 */
export function computeAnnualProduction(records: BibRecord[]) {
  if (records.length === 0) return [];
  const currentYear = 2026;
  const years = records.map((r) => r.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  const series = [];
  let cumulative = 0;

  for (let y = minYear; y <= maxYear; y++) {
    const docs = records.filter((r) => r.year === y);
    const count = docs.length;
    cumulative += count;
    const totalCit = docs.reduce((s, r) => s + r.citations, 0);
    const meanTcPerArt = count > 0 ? Number((totalCit / count).toFixed(1)) : 0;
    const citableYears = Math.max(1, currentYear - y + 1);
    const meanTcPerYear = Number((meanTcPerArt / citableYears).toFixed(1));

    series.push({
      year: y,
      articles: count,
      cumulativeArticles: cumulative,
      meanTcPerArt,
      meanTcPerYear
    });
  }
  return series;
}

/**
 * Computes Bibliometrix Three-Field Plot (Sankey Diagram)
 */
export function computeThreeFieldSankey(
  records: BibRecord[],
  leftField: SankeyFieldType,
  middleField: SankeyFieldType,
  rightField: SankeyFieldType,
  topN = 8
): { nodes: SankeyNode[]; links: SankeyLink[] } {
  const getFieldValues = (rec: BibRecord, field: SankeyFieldType): string[] => {
    switch (field) {
      case 'sources':
        return [rec.source];
      case 'authors':
        return rec.authors.slice(0, 5);
      case 'authorKeywords':
        return rec.authorKeywords.slice(0, 6);
      case 'indexKeywords':
        return rec.indexKeywords.slice(0, 6);
      case 'countries':
        return rec.countries;
      case 'affiliations':
        return rec.affiliations.map((a) => a.split(',')[0].trim()).filter(Boolean);
      case 'fundingAgencies':
        return rec.fundingAgencies && rec.fundingAgencies.length > 0
          ? rec.fundingAgencies
          : ['Unfunded / Not Reported'];
      case 'researchSubjects':
        return rec.researchSubjects && rec.researchSubjects.length > 0
          ? rec.researchSubjects
          : ['Multidisciplinary Sciences'];
      case 'openAccess':
        return [rec.openAccess || 'Gold OA'];
    }
  };

  const getTopTerms = (field: SankeyFieldType) => {
    const counts = new Map<string, number>();
    for (const r of records) {
      for (const val of getFieldValues(r, field)) {
        if (!val) continue;
        counts.set(val, (counts.get(val) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([term]) => term);
  };

  const leftTop = getTopTerms(leftField);
  const midTop = getTopTerms(middleField);
  const rightTop = getTopTerms(rightField);

  const palette = ['#2563EB', '#0891B2', '#4F46E5', '#16A34A', '#D97706', '#DC2626', '#7C3AED', '#DB2777'];

  const linkCountsLM = new Map<string, number>();
  const linkCountsMR = new Map<string, number>();

  for (const r of records) {
    const lVals = getFieldValues(r, leftField).filter((v) => leftTop.includes(v));
    const mVals = getFieldValues(r, middleField).filter((v) => midTop.includes(v));
    const rVals = getFieldValues(r, rightField).filter((v) => rightTop.includes(v));

    for (const l of lVals) {
      for (const m of mVals) {
        const k = `L:${l}|||M:${m}`;
        linkCountsLM.set(k, (linkCountsLM.get(k) || 0) + 1);
      }
    }
    for (const m of mVals) {
      for (const rv of rVals) {
        const k = `M:${m}|||R:${rv}`;
        linkCountsMR.set(k, (linkCountsMR.get(k) || 0) + 1);
      }
    }
  }

  const nodeWeights = new Map<string, number>();
  leftTop.forEach((l) => nodeWeights.set(`L:${l}`, 1));
  midTop.forEach((m) => nodeWeights.set(`M:${m}`, 1));
  rightTop.forEach((r) => nodeWeights.set(`R:${r}`, 1));

  linkCountsLM.forEach((w, k) => {
    const [s, t] = k.split('|||');
    nodeWeights.set(s, (nodeWeights.get(s) || 0) + w);
    nodeWeights.set(t, (nodeWeights.get(t) || 0) + w);
  });
  linkCountsMR.forEach((w, k) => {
    const [s, t] = k.split('|||');
    nodeWeights.set(s, (nodeWeights.get(s) || 0) + w);
    nodeWeights.set(t, (nodeWeights.get(t) || 0) + w);
  });

  const buildColumnNodes = (terms: string[], prefix: 'L' | 'M' | 'R', col: 0 | 1 | 2): SankeyNode[] => {
    const total = terms.reduce((s, t) => s + (nodeWeights.get(`${prefix}:${t}`) || 1), 0);
    const gap = 0.025;
    const available = 1 - gap * Math.max(0, terms.length - 1);
    let currentY = 0;

    return terms.map((term, idx) => {
      const val = nodeWeights.get(`${prefix}:${term}`) || 1;
      const height = Math.max(0.04, (val / Math.max(1, total)) * available);
      const y0 = currentY;
      const y1 = currentY + height;
      currentY = y1 + gap;
      return {
        id: `${prefix}:${term}`,
        label: term,
        column: col,
        value: val,
        y0,
        y1,
        color: palette[idx % palette.length]
      };
    });
  };

  const nodes = [
    ...buildColumnNodes(leftTop, 'L', 0),
    ...buildColumnNodes(midTop, 'M', 1),
    ...buildColumnNodes(rightTop, 'R', 2)
  ];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const links: SankeyLink[] = [];

  const appendLinks = (map: Map<string, number>) => {
    map.forEach((value, key) => {
      const [sourceId, targetId] = key.split('|||');
      const sNode = nodeMap.get(sourceId);
      const tNode = nodeMap.get(targetId);
      if (!sNode || !tNode) return;
      const sMid = (sNode.y0 + sNode.y1) / 2;
      const tMid = (tNode.y0 + tNode.y1) / 2;
      const width = Math.max(0.008, Math.min(0.055, value * 0.008));
      links.push({
        sourceId,
        targetId,
        value,
        y0: sMid,
        y1: tMid,
        width,
        color: sNode.color
      });
    });
  };

  appendLinks(linkCountsLM);
  appendLinks(linkCountsMR);

  return { nodes, links };
}

/**
 * Computes Bradford's Law of Source Scattering
 */
export function computeBradfordsLaw(records: BibRecord[]): BradfordItem[] {
  const sourceStats = new Map<string, { articles: number; citations: number }>();
  for (const r of records) {
    const cur = sourceStats.get(r.source) || { articles: 0, citations: 0 };
    cur.articles += 1;
    cur.citations += r.citations;
    sourceStats.set(r.source, cur);
  }

  const sorted = Array.from(sourceStats.entries()).sort(
    (a, b) => b[1].articles - a[1].articles || b[1].citations - a[1].citations
  );

  const totalArticles = records.length;
  const zoneThreshold = totalArticles / 3;
  let cumulative = 0;

  return sorted.map(([source, st], idx) => {
    const prevCum = cumulative;
    cumulative += st.articles;
    let zone: BradfordItem['zone'] = 'Zone 3 (Peripheral)';
    if (prevCum < zoneThreshold) {
      zone = 'Zone 1 (Core)';
    } else if (prevCum < zoneThreshold * 2) {
      zone = 'Zone 2 (Middle)';
    }

    return {
      rank: idx + 1,
      source,
      articles: st.articles,
      cumulativeArticles: cumulative,
      logRank: Number(Math.log10(idx + 1).toFixed(3)),
      zone,
      totalCitations: st.citations
    };
  });
}

/**
 * Computes Lotka's Law of Scientific Productivity
 */
export function computeLotkasLaw(records: BibRecord[]): LotkaItem[] {
  const authorCounts = new Map<string, number>();
  for (const r of records) {
    for (const a of r.authors) {
      authorCounts.set(a, (authorCounts.get(a) || 0) + 1);
    }
  }

  const freqMap = new Map<number, number>();
  authorCounts.forEach((docCount) => {
    freqMap.set(docCount, (freqMap.get(docCount) || 0) + 1);
  });

  const totalAuthors = Math.max(1, authorCounts.size);
  const singleDocAuthors = freqMap.get(1) || Math.round(totalAuthors * 0.6);
  const cConst = (singleDocAuthors / totalAuthors) * 100;

  const maxDocs = Math.max(1, ...Array.from(freqMap.keys()));
  const items: LotkaItem[] = [];

  for (let n = 1; n <= maxDocs; n++) {
    const obs = freqMap.get(n) || 0;
    if (obs === 0 && n > 5) continue;
    const observedPct = Number(((obs / totalAuthors) * 100).toFixed(2));
    const theoreticalPct = Number((cConst / Math.pow(n, 2)).toFixed(2));
    items.push({
      documentsWritten: n,
      observedAuthors: obs,
      observedPct,
      theoreticalPct
    });
  }
  return items;
}

/**
 * Computes H-index, G-index, M-index, Total Citations, and Production Over Time
 */
export function computeImpactMetrics(
  records: BibRecord[],
  entityType: 'authors' | 'sources'
): ImpactEntity[] {
  const currentYear = 2026;
  const entityDocs = new Map<string, BibRecord[]>();

  for (const r of records) {
    const keys = entityType === 'authors' ? r.authors : [r.source];
    for (const k of keys) {
      const list = entityDocs.get(k) || [];
      list.push(r);
      entityDocs.set(k, list);
    }
  }

  const results: ImpactEntity[] = [];

  entityDocs.forEach((docs, name) => {
    const sortedCits = docs.map((d) => d.citations).sort((a, b) => b - a);
    let hIndex = 0;
    for (let i = 0; i < sortedCits.length; i++) {
      if (sortedCits[i] >= i + 1) hIndex = i + 1;
    }

    let gIndex = 0;
    let cumCit = 0;
    for (let i = 0; i < sortedCits.length; i++) {
      cumCit += sortedCits[i];
      if (cumCit >= (i + 1) * (i + 1)) gIndex = i + 1;
    }

    const firstYear = Math.min(...docs.map((d) => d.year));
    const activeYears = Math.max(1, currentYear - firstYear + 1);
    const mIndex = Number((hIndex / activeYears).toFixed(2));
    const totalCitations = sortedCits.reduce((s, c) => s + c, 0);

    const byYear = new Map<number, { count: number; citations: number }>();
    for (const d of docs) {
      const cur = byYear.get(d.year) || { count: 0, citations: 0 };
      cur.count += 1;
      cur.citations += d.citations;
      byYear.set(d.year, cur);
    }

    results.push({
      name,
      hIndex,
      gIndex,
      mIndex,
      totalCitations,
      netProduction: docs.length,
      firstYear,
      yearlyTimeline: Array.from(byYear.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([year, val]) => ({ year, count: val.count, citations: val.citations }))
    });
  });

  return results.sort(
    (a, b) =>
      b.hIndex - a.hIndex ||
      b.netProduction - a.netProduction ||
      b.totalCitations - a.totalCitations
  );
}

/**
 * Computes Callon's Strategic Thematic Map (Centrality vs Density 4-Quadrant Diagram)
 */
export function computeThematicMap(
  records: BibRecord[],
  field: 'authorKeywords' | 'indexKeywords' = 'authorKeywords'
): ThematicCluster[] {
  const net = buildVOSNetwork(
    records,
    'co-occurrence',
    field === 'authorKeywords' ? 'author-keywords' : 'index-keywords',
    1,
    45,
    1.1
  );

  const nodeClusterMap = new Map(net.nodes.map((n) => [n.id, n.cluster]));

  const rawThemes = net.clusters.map((cl) => {
    const cNodes = net.nodes.filter((n) => n.cluster === cl.id);
    let internalStrength = 0;
    let externalStrength = 0;

    for (const link of net.links) {
      const cS = nodeClusterMap.get(link.source);
      const cT = nodeClusterMap.get(link.target);
      if (cS === cl.id && cT === cl.id) {
        internalStrength += link.strength;
      } else if (cS === cl.id || cT === cl.id) {
        externalStrength += link.strength;
      }
    }

    const densityRaw = internalStrength / Math.max(1, cNodes.length);
    const centralityRaw = externalStrength;

    return {
      cl,
      cNodes,
      densityRaw,
      centralityRaw,
      occurrences: cNodes.reduce((s, n) => s + n.occurrences, 0),
      totalCitations: cNodes.reduce((s, n) => s + n.citations, 0)
    };
  });

  if (rawThemes.length === 0) return [];

  const minC = Math.min(...rawThemes.map((t) => t.centralityRaw));
  const maxC = Math.max(...rawThemes.map((t) => t.centralityRaw));
  const minD = Math.min(...rawThemes.map((t) => t.densityRaw));
  const maxD = Math.max(...rawThemes.map((t) => t.densityRaw));

  return rawThemes.map((t, idx) => {
    const normC =
      maxC > minC
        ? Number((16 + ((t.centralityRaw - minC) / (maxC - minC)) * 72).toFixed(1))
        : 30 + idx * 15;
    const normD =
      maxD > minD
        ? Number((16 + ((t.densityRaw - minD) / (maxD - minD)) * 72).toFixed(1))
        : 30 + ((idx * 25) % 60);

    let quadrant: ThematicCluster['quadrant'] = 'Basic and Transversal Themes';
    if (normC >= 50 && normD >= 50) quadrant = 'Motor Themes';
    else if (normC < 50 && normD >= 50) quadrant = 'Niche Themes';
    else if (normC < 50 && normD < 50) quadrant = 'Emerging or Declining Themes';

    return {
      id: `theme-${t.cl.id}`,
      label: t.cl.topItems.slice(0, 2).join(' / ') || t.cl.label,
      quadrant,
      callonCentrality: normC,
      callonDensity: normD,
      occurrences: t.occurrences,
      totalCitations: t.totalCitations,
      keywords: t.cNodes.slice(0, 6).map((n) => ({ term: n.label, count: n.occurrences })),
      color: t.cl.color
    };
  });
}

/**
 * Computes Trend Topics Evolution (Keyword Lifespan Q1 / Median / Q3 Years)
 */
export function computeTrendTopics(records: BibRecord[]): TrendTopicItem[] {
  const kwYears = new Map<string, { years: number[]; citations: number[] }>();

  for (const r of records) {
    const kws = Array.from(new Set([...r.authorKeywords, ...r.indexKeywords]));
    for (const kw of kws) {
      const cur = kwYears.get(kw) || { years: [], citations: [] };
      cur.years.push(r.year);
      cur.citations.push(r.citations);
      kwYears.set(kw, cur);
    }
  }

  const items: TrendTopicItem[] = [];
  kwYears.forEach((data, term) => {
    if (data.years.length < 2) return;
    const sorted = [...data.years].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const med = sorted[Math.floor(sorted.length * 0.5)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const avgCit = Number(
      (data.citations.reduce((s, c) => s + c, 0) / data.citations.length).toFixed(0)
    );
    items.push({
      term,
      frequency: sorted.length,
      q1Year: q1,
      medianYear: Math.max(q1, med),
      q3Year: Math.max(med + (q1 === q3 ? 1 : 0), q3),
      avgCitations: avgCit
    });
  });

  return items
    .sort((a, b) => b.medianYear - a.medianYear || b.frequency - a.frequency)
    .slice(0, 18);
}

/**
 * Computes Reference Publication Year Spectroscopy (RPYS)
 */
export function computeRPYS(records: BibRecord[]): RPYSPoint[] {
  const yearCounts = new Map<number, { count: number; refs: Map<string, number> }>();

  for (const r of records) {
    for (const ref of r.references) {
      const m = ref.match(/\b(19\d{2}|20\d{2})\b/);
      if (!m) continue;
      const y = parseInt(m[1], 10);
      if (y < 1920 || y > 2026) continue;
      const entry = yearCounts.get(y) || { count: 0, refs: new Map() };
      entry.count += 1;
      entry.refs.set(ref, (entry.refs.get(ref) || 0) + 1);
      yearCounts.set(y, entry);
    }
  }

  const sortedYears = Array.from(yearCounts.keys()).sort((a, b) => a - b);
  if (sortedYears.length === 0) return [];

  const points: RPYSPoint[] = sortedYears.map((year) => {
    const entry = yearCounts.get(year)!;
    const windowCounts: number[] = [];
    for (let wy = year - 2; wy <= year + 2; wy++) {
      windowCounts.push(yearCounts.get(wy)?.count || 0);
    }
    windowCounts.sort((a, b) => a - b);
    const median5Yr = windowCounts[2];
    const deviation = entry.count - median5Yr;

    const topRef =
      Array.from(entry.refs.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    return {
      year,
      citedReferencesCount: entry.count,
      median5Yr,
      deviation,
      topCitedReference: topRef
    };
  });

  return points;
}

/**
 * Computes Direct Citation Historiograph across the unified corpus
 */
export function computeHistoriograph(records: BibRecord[]): {
  nodes: HistoriographNode[];
  edges: HistoriographEdge[];
} {
  const topRecords = [...records]
    .sort((a, b) => b.citations - a.citations)
    .slice(0, 18)
    .sort((a, b) => a.year - b.year || b.citations - a.citations);

  const edges: HistoriographEdge[] = [];
  const localCitationsMap = new Map<string, number>();

  for (const sourceRec of topRecords) {
    const refText = sourceRec.references.join(' | ').toLowerCase();
    for (const targetRec of topRecords) {
      if (sourceRec.id === targetRec.id || targetRec.year > sourceRec.year) continue;
      const targetFirstAuthor = (targetRec.authors[0] || '').split(',')[0].toLowerCase();
      const matchedByDoi = targetRec.doi && refText.includes(targetRec.doi.toLowerCase());
      const matchedByAuthorYear =
        targetFirstAuthor.length > 2 &&
        refText.includes(targetFirstAuthor) &&
        refText.includes(String(targetRec.year));

      if (matchedByDoi || matchedByAuthorYear) {
        edges.push({ fromId: targetRec.id, toId: sourceRec.id });
        localCitationsMap.set(targetRec.id, (localCitationsMap.get(targetRec.id) || 0) + 1);
      }
    }
  }

  const years = Array.from(new Set(topRecords.map((r) => r.year))).sort((a, b) => a - b);
  const minY = years[0] || 2017;
  const maxY = years[years.length - 1] || 2026;
  const spanY = Math.max(1, maxY - minY);

  const byYearGroup = new Map<number, BibRecord[]>();
  topRecords.forEach((r) => {
    const g = byYearGroup.get(r.year) || [];
    g.push(r);
    byYearGroup.set(r.year, g);
  });

  const nodes: HistoriographNode[] = topRecords.map((r) => {
    const group = byYearGroup.get(r.year) || [r];
    const idxInYear = group.indexOf(r);
    const x = 0.08 + ((r.year - minY) / spanY) * 0.84;
    const y =
      group.length === 1
        ? 0.5
        : 0.2 + (idxInYear / Math.max(1, group.length - 1)) * 0.6;
    const firstAuth = (r.authors[0] || 'Author').split(',')[0];

    return {
      id: r.id,
      label: `${firstAuth} (${r.year})`,
      title: r.title,
      year: r.year,
      globalCitations: r.citations,
      localCitations: localCitationsMap.get(r.id) || 0,
      source: r.source,
      x,
      y
    };
  });

  return { nodes, edges };
}

function calcHIndex(citations: number[]): number {
  const sorted = [...citations].sort((a, b) => b - a);
  let h = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] >= i + 1) h = i + 1;
  }
  return h;
}

/**
 * Computes comprehensive Funding Agencies (FU/FX), Research Subjects (SC/WC),
 * Country Collaboration (SCP/MCP), and Extended Metadata (OA, Document Type, Publisher, Language) analytics.
 */
export function computeFundingAndMetadataAnalytics(records: BibRecord[]) {
  const totalDocs = Math.max(1, records.length);

  const fundedRecords = records.filter((r) => (r.fundingAgencies || []).length > 0);
  const unfundedRecords = records.filter((r) => (r.fundingAgencies || []).length === 0);

  const fundedDocsCount = fundedRecords.length;
  const unfundedDocsCount = unfundedRecords.length;
  const fundedSharePct = Number(((fundedDocsCount / totalDocs) * 100).toFixed(1));

  const fundedAvgCitations =
    fundedDocsCount > 0
      ? Number(
          (fundedRecords.reduce((s, r) => s + r.citations, 0) / fundedDocsCount).toFixed(1)
        )
      : 0;
  const unfundedAvgCitations =
    unfundedDocsCount > 0
      ? Number(
          (unfundedRecords.reduce((s, r) => s + r.citations, 0) / unfundedDocsCount).toFixed(1)
        )
      : 0;
  const citationAdvantageRatio =
    unfundedAvgCitations > 0
      ? Number((fundedAvgCitations / unfundedAvgCitations).toFixed(2))
      : 1.0;

  // 1. Funding Agency Performance
  const agencyMap = new Map<string, BibRecord[]>();
  for (const r of records) {
    for (const agency of r.fundingAgencies || []) {
      const list = agencyMap.get(agency) || [];
      list.push(r);
      agencyMap.set(agency, list);
    }
  }

  const fundingAgencies: FundingAgencyMetric[] = Array.from(agencyMap.entries())
    .map(([agency, docs]) => {
      const cits = docs.map((d) => d.citations);
      const totalCitations = cits.reduce((s, c) => s + c, 0);
      const oaCount = docs.filter((d) => (d.openAccess || 'Gold OA') !== 'Closed').length;

      const subjCounts = new Map<string, number>();
      const countryCounts = new Map<string, number>();
      docs.forEach((d) => {
        (d.researchSubjects || []).forEach((s) => subjCounts.set(s, (subjCounts.get(s) || 0) + 1));
        d.countries.forEach((c) => countryCounts.set(c, (countryCounts.get(c) || 0) + 1));
      });

      const topSubjects = Array.from(subjCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([s]) => s);
      const topCountries = Array.from(countryCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([c]) => c);

      return {
        agency,
        documents: docs.length,
        sharePct: Number(((docs.length / totalDocs) * 100).toFixed(1)),
        totalCitations,
        avgCitations: Number((totalCitations / docs.length).toFixed(1)),
        hIndex: calcHIndex(cits),
        openAccessPct: Number(((oaCount / docs.length) * 100).toFixed(0)),
        topSubjects,
        topCountries
      };
    })
    .sort((a, b) => b.documents - a.documents || b.totalCitations - a.totalCitations);

  // 2. Research Subject Categories (SC / WC)
  const subjectMap = new Map<string, BibRecord[]>();
  const allYears = Array.from(new Set(records.map((r) => r.year))).sort((a, b) => a - b);

  for (const r of records) {
    const subjs =
      r.researchSubjects && r.researchSubjects.length > 0
        ? r.researchSubjects
        : ['Multidisciplinary Sciences'];
    for (const subj of subjs) {
      const list = subjectMap.get(subj) || [];
      list.push(r);
      subjectMap.set(subj, list);
    }
  }

  const researchSubjects: ResearchSubjectMetric[] = Array.from(subjectMap.entries())
    .map(([subject, docs]) => {
      const cits = docs.map((d) => d.citations);
      const totalCitations = cits.reduce((s, c) => s + c, 0);
      const fundedInSubj = docs.filter((d) => (d.fundingAgencies || []).length > 0).length;

      const funderCounts = new Map<string, number>();
      docs.forEach((d) => {
        (d.fundingAgencies || []).forEach((f) =>
          funderCounts.set(f, (funderCounts.get(f) || 0) + 1)
        );
      });
      const topFundingAgencies = Array.from(funderCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([f]) => f);

      const yearlyCounts = allYears.map((year) => ({
        year,
        count: docs.filter((d) => d.year === year).length
      }));

      return {
        subject,
        documents: docs.length,
        sharePct: Number(((docs.length / totalDocs) * 100).toFixed(1)),
        totalCitations,
        avgCitations: Number((totalCitations / docs.length).toFixed(1)),
        hIndex: calcHIndex(cits),
        fundedPct: Number(((fundedInSubj / docs.length) * 100).toFixed(0)),
        topFundingAgencies,
        yearlyCounts
      };
    })
    .sort((a, b) => b.documents - a.documents || b.totalCitations - a.totalCitations);

  // 3. Funder <-> Research Subject Cross-Matrix
  const pairMap = new Map<string, { funder: string; subject: string; count: number; citations: number }>();
  for (const r of records) {
    const funders = r.fundingAgencies || [];
    const subjs = r.researchSubjects || ['Multidisciplinary Sciences'];
    for (const f of funders) {
      for (const s of subjs) {
        const key = `${f}|||${s}`;
        const cur = pairMap.get(key) || { funder: f, subject: s, count: 0, citations: 0 };
        cur.count += 1;
        cur.citations += r.citations;
        pairMap.set(key, cur);
      }
    }
  }
  const funderSubjectFlows = Array.from(pairMap.values()).sort(
    (a, b) => b.count - a.count || b.citations - a.citations
  );

  // 4. Country Collaboration (SCP vs MCP)
  const countryDocsMap = new Map<string, BibRecord[]>();
  for (const r of records) {
    for (const c of r.countries) {
      const list = countryDocsMap.get(c) || [];
      list.push(r);
      countryDocsMap.set(c, list);
    }
  }

  const countryCollaboration: CountryCollaborationMetric[] = Array.from(
    countryDocsMap.entries()
  )
    .map(([country, docs]) => {
      const scp = docs.filter((d) => d.countries.length === 1).length;
      const mcp = docs.filter((d) => d.countries.length > 1).length;
      const totalCitations = docs.reduce((s, d) => s + d.citations, 0);
      const fundedDocs = docs.filter((d) => (d.fundingAgencies || []).length > 0).length;

      return {
        country,
        totalDocuments: docs.length,
        scp,
        mcp,
        mcpRatioPct: Number(((mcp / docs.length) * 100).toFixed(1)),
        totalCitations,
        avgCitations: Number((totalCitations / docs.length).toFixed(1)),
        fundedDocs
      };
    })
    .sort((a, b) => b.totalDocuments - a.totalDocuments || b.totalCitations - a.totalCitations);

  // 5. Extended Metadata Breakdowns (Open Access, Document Type, Publisher, Language)
  const buildBreakdown = (getter: (r: BibRecord) => string): MetadataBreakdownItem[] => {
    const map = new Map<string, { count: number; citations: number }>();
    for (const r of records) {
      const label = getter(r) || 'Unspecified';
      const cur = map.get(label) || { count: 0, citations: 0 };
      cur.count += 1;
      cur.citations += r.citations;
      map.set(label, cur);
    }
    return Array.from(map.entries())
      .map(([label, val]) => ({
        label,
        count: val.count,
        sharePct: Number(((val.count / totalDocs) * 100).toFixed(1)),
        totalCitations: val.citations,
        avgCitations: Number((val.citations / val.count).toFixed(1))
      }))
      .sort((a, b) => b.count - a.count || b.totalCitations - a.totalCitations);
  };

  // 6. Annual Funding Trend Series (Funded vs Unfunded + Top Sponsors by Year)
  const annualFundingSeries = allYears.map((year) => {
    const yrDocs = records.filter((r) => r.year === year);
    const yrFunded = yrDocs.filter((r) => (r.fundingAgencies || []).length > 0);
    const yrUnfunded = yrDocs.filter((r) => (r.fundingAgencies || []).length === 0);
    const fundedCit = yrFunded.reduce((s, r) => s + r.citations, 0);
    const unfundedCit = yrUnfunded.reduce((s, r) => s + r.citations, 0);

    return {
      year,
      totalDocs: yrDocs.length,
      fundedDocs: yrFunded.length,
      unfundedDocs: yrUnfunded.length,
      fundedSharePct: yrDocs.length > 0 ? Math.round((yrFunded.length / yrDocs.length) * 100) : 0,
      fundedCitations: fundedCit,
      unfundedCitations: unfundedCit,
      fundedMeanTc: yrFunded.length > 0 ? Number((fundedCit / yrFunded.length).toFixed(1)) : 0,
      unfundedMeanTc:
        yrUnfunded.length > 0 ? Number((unfundedCit / yrUnfunded.length).toFixed(1)) : 0
    };
  });

  // 7. 2D Funder x Research Subject Heatmap Matrix
  const topFundersForMatrix = fundingAgencies.slice(0, 7).map((f) => f.agency);
  const topSubjectsForMatrix = researchSubjects.slice(0, 6).map((s) => s.subject);
  const matrixCells: FunderSubjectMatrix['cells'] = {};
  let maxCellCount = 1;

  for (const funder of topFundersForMatrix) {
    for (const subject of topSubjectsForMatrix) {
      const matched = records.filter(
        (r) =>
          (r.fundingAgencies || []).includes(funder) &&
          (r.researchSubjects && r.researchSubjects.length > 0
            ? r.researchSubjects
            : ['Multidisciplinary Sciences']
          ).includes(subject)
      );
      const totalCitations = matched.reduce((s, r) => s + r.citations, 0);
      const count = matched.length;
      if (count > maxCellCount) maxCellCount = count;
      matrixCells[`${funder}|||${subject}`] = {
        funder,
        subject,
        count,
        totalCitations,
        avgCitations: count > 0 ? Number((totalCitations / count).toFixed(1)) : 0
      };
    }
  }

  const funderSubjectMatrix: FunderSubjectMatrix = {
    funders: topFundersForMatrix,
    subjects: topSubjectsForMatrix,
    cells: matrixCells,
    maxCellCount
  };

  return {
    fundedDocsCount,
    unfundedDocsCount,
    fundedSharePct,
    fundedAvgCitations,
    unfundedAvgCitations,
    citationAdvantageRatio,
    uniqueFundingAgenciesCount: fundingAgencies.length,
    uniqueSubjectsCount: researchSubjects.length,
    fundingAgencies,
    researchSubjects,
    funderSubjectFlows,
    funderSubjectMatrix,
    annualFundingSeries,
    countryCollaboration,
    openAccessBreakdown: buildBreakdown((r) => r.openAccess || 'Gold OA'),
    docTypeBreakdown: buildBreakdown((r) => r.docType || 'Article'),
    publisherBreakdown: buildBreakdown((r) => r.publisher || 'Academic Press'),
    languageBreakdown: buildBreakdown((r) => r.language || 'English')
  };
}

export const STRATUM_PALETTE = [
  '#2563EB', // Cobalt Blue
  '#10B981', // Emerald Green
  '#F59E0B', // Amber Gold
  '#7C3AED', // Royal Violet
  '#06B6D4', // Cyan Teal
  '#F43F5E', // Rose Crimson
  '#64748B'  // Neutral Slate
];

export const STRATIFY_DIMENSION_LABELS: Record<StratifyDimension, string> = {
  none: 'No Stratification (Unified Corpus)',
  'funding-status': 'Funding Status (Funded vs. Unfunded)',
  'funding-agency': 'Top Funding Agencies / Sponsors (FU)',
  'research-subject': 'Research Subject Categories (SC/WC)',
  'open-access': 'Open Access Status Tiers (OA)',
  database: 'Source Database Provenance (DB)',
  'collaboration-type': 'Collaboration Type (Single SCP vs. Intl MCP)',
  'publication-era': 'Publication Era (2017–2020 vs. 2021–2026)'
};

function calcGIndex(citations: number[]): number {
  const sorted = [...citations].sort((a, b) => b - a);
  let g = 0;
  let cum = 0;
  for (let i = 0; i < sorted.length; i++) {
    cum += sorted[i];
    if (cum >= (i + 1) * (i + 1)) g = i + 1;
  }
  return g;
}

function calcAnnualGrowthRate(records: BibRecord[]): number {
  if (records.length < 2) return 0;
  const years = records.map((r) => r.year);
  const minY = Math.min(...years);
  const maxY = Math.max(...years);
  if (maxY <= minY) return 0;
  const firstCount = Math.max(1, records.filter((r) => r.year === minY).length);
  const lastCount = Math.max(1, records.filter((r) => r.year === maxY).length);
  return Number(((Math.pow(lastCount / firstCount, 1 / (maxY - minY)) - 1) * 100).toFixed(1));
}

/**
 * Classifies a single BibRecord into one or more stratum labels for a given StratifyDimension.
 * Returns the primary stratum label (and full list of labels for multi-valued fields).
 */
export function getRecordStrataLabels(
  rec: BibRecord,
  dimension: StratifyDimension,
  topCategories?: string[]
): string[] {
  switch (dimension) {
    case 'funding-status':
      return (rec.fundingAgencies || []).length > 0
        ? ['Funded Research (FU)']
        : ['Unfunded / No Grant Reported'];
    case 'funding-agency': {
      const agencies = rec.fundingAgencies || [];
      if (agencies.length === 0) return ['Unfunded'];
      if (topCategories && topCategories.length > 0) {
        const matched = agencies.filter((a) => topCategories.includes(a));
        return matched.length > 0 ? matched : ['Other Funding Agencies'];
      }
      return agencies;
    }
    case 'research-subject': {
      const subjs =
        rec.researchSubjects && rec.researchSubjects.length > 0
          ? rec.researchSubjects
          : ['Multidisciplinary Sciences'];
      if (topCategories && topCategories.length > 0) {
        const matched = subjs.filter((s) => topCategories.includes(s));
        return matched.length > 0 ? matched : ['Other Research Subjects'];
      }
      return subjs;
    }
    case 'open-access':
      return [rec.openAccess || 'Gold OA'];
    case 'database':
      return rec.databases && rec.databases.length > 0 ? rec.databases : ['Scopus'];
    case 'collaboration-type':
      return rec.countries.length > 1
        ? ['Multi-Country (MCP · International)']
        : ['Single-Country (SCP · Domestic)'];
    case 'publication-era':
      return rec.year <= 2020
        ? ['Foundational Era (2017–2020)']
        : ['Modern Acceleration (2021–2026)'];
    default:
      return ['All Documents'];
  }
}

/**
 * Partitions the corpus into color-coded StratumGroup cohorts with full scientometric KPIs.
 */
export function partitionCorpusByStrata(
  records: BibRecord[],
  dimension: StratifyDimension
): StratumGroup[] {
  const totalDocs = Math.max(1, records.length);
  if (dimension === 'none') {
    const cits = records.map((r) => r.citations);
    const totalCitations = cits.reduce((s, c) => s + c, 0);
    return [
      {
        id: 'all',
        label: 'All Harmonized Documents',
        color: STRATUM_PALETTE[0],
        records,
        documents: records.length,
        sharePct: 100,
        totalCitations,
        avgCitations: Number((totalCitations / totalDocs).toFixed(1)),
        hIndex: calcHIndex(cits),
        gIndex: calcGIndex(cits),
        fundedPct: Number(
          (
            (records.filter((r) => (r.fundingAgencies || []).length > 0).length / totalDocs) *
            100
          ).toFixed(1)
        ),
        openAccessPct: Number(
          (
            (records.filter((r) => (r.openAccess || 'Gold OA') !== 'Closed').length / totalDocs) *
            100
          ).toFixed(1)
        ),
        mcpPct: Number(
          ((records.filter((r) => r.countries.length > 1).length / totalDocs) * 100).toFixed(1)
        ),
        annualGrowthPct: calcAnnualGrowthRate(records)
      }
    ];
  }

  // Determine top categories for high-cardinality dimensions (funding-agency, research-subject)
  let topCategories: string[] | undefined;
  if (dimension === 'funding-agency' || dimension === 'research-subject') {
    const rawCounts = new Map<string, number>();
    for (const r of records) {
      const items =
        dimension === 'funding-agency'
          ? r.fundingAgencies || []
          : r.researchSubjects && r.researchSubjects.length > 0
          ? r.researchSubjects
          : ['Multidisciplinary Sciences'];
      for (const item of items) {
        rawCounts.set(item, (rawCounts.get(item) || 0) + 1);
      }
    }
    topCategories = Array.from(rawCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k);
  }

  const groupMap = new Map<string, BibRecord[]>();
  for (const r of records) {
    const labels = getRecordStrataLabels(r, dimension, topCategories);
    for (const label of labels) {
      const list = groupMap.get(label) || [];
      list.push(r);
      groupMap.set(label, list);
    }
  }

  const sortedEntries = Array.from(groupMap.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );

  return sortedEntries.map(([label, groupRecs], idx) => {
    const gTotal = Math.max(1, groupRecs.length);
    const cits = groupRecs.map((r) => r.citations);
    const totalCitations = cits.reduce((s, c) => s + c, 0);

    return {
      id: `stratum-${idx}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      label,
      color: STRATUM_PALETTE[idx % STRATUM_PALETTE.length],
      records: groupRecs,
      documents: groupRecs.length,
      sharePct: Number(((groupRecs.length / totalDocs) * 100).toFixed(1)),
      totalCitations,
      avgCitations: Number((totalCitations / gTotal).toFixed(1)),
      hIndex: calcHIndex(cits),
      gIndex: calcGIndex(cits),
      fundedPct: Number(
        (
          (groupRecs.filter((r) => (r.fundingAgencies || []).length > 0).length / gTotal) *
          100
        ).toFixed(0)
      ),
      openAccessPct: Number(
        (
          (groupRecs.filter((r) => (r.openAccess || 'Gold OA') !== 'Closed').length / gTotal) *
          100
        ).toFixed(0)
      ),
      mcpPct: Number(
        ((groupRecs.filter((r) => r.countries.length > 1).length / gTotal) * 100).toFixed(0)
      ),
      annualGrowthPct: calcAnnualGrowthRate(groupRecs)
    };
  });
}

/**
 * Computes annual publication and citation time series stratified across the selected dimension.
 */
export function computeStratifiedAnnualSeries(
  records: BibRecord[],
  dimension: StratifyDimension
): {
  years: number[];
  strata: StratumGroup[];
  series: StratifiedAnnualPoint[];
} {
  const strata = partitionCorpusByStrata(records, dimension);
  const years = Array.from(new Set(records.map((r) => r.year))).sort((a, b) => a - b);

  const series: StratifiedAnnualPoint[] = years.map((year) => {
    const yrRecs = records.filter((r) => r.year === year);
    const totalArticles = yrRecs.length;
    const totalCit = yrRecs.reduce((s, r) => s + r.citations, 0);
    const meanTcPerArt =
      totalArticles > 0 ? Number((totalCit / totalArticles).toFixed(1)) : 0;

    const strataCounts: Record<string, number> = {};
    const strataCitations: Record<string, number> = {};

    for (const st of strata) {
      const stYearRecs = st.records.filter((r) => r.year === year);
      strataCounts[st.label] = stYearRecs.length;
      strataCitations[st.label] = stYearRecs.reduce((s, r) => s + r.citations, 0);
    }

    return {
      year,
      totalArticles,
      meanTcPerArt,
      strataCounts,
      strataCitations
    };
  });

  return { years, strata, series };
}

