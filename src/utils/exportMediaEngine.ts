/**
 * Publication-Grade Visual, Graph, Table & Manuscript Export Engine
 * Supports 300-DPI PNG, High-Contrast JPG, Native Binary PDF (Single-Figure & Multi-Page Manuscript), and CSV.
 */

export type VisualExportFormat = 'png' | 'jpg' | 'pdf' | 'csv';

function sanitizeFilename(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 64) || 'bibliovos_export'
  );
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Builds a valid, standards-compliant PDF 1.4 binary file from one or more canvases (pages).
 * Works 100% offline with zero external dependencies.
 */
export function buildPdfFromCanvases(
  canvases: HTMLCanvasElement[],
  documentTitle: string
): Blob {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0]; // 1-indexed PDF object byte offsets
  let byteLength = 0;

  const pushString = (str: string) => {
    const arr = encoder.encode(str);
    chunks.push(arr);
    byteLength += arr.byteLength;
  };

  const pushBytes = (arr: Uint8Array) => {
    chunks.push(arr);
    byteLength += arr.byteLength;
  };

  // Object allocation:
  // 1: Catalog
  // 2: Pages
  // For each page i (0..N-1):
  //   pageObjId = 3 + i * 3
  //   contentObjId = 4 + i * 3
  //   imageObjId = 5 + i * 3
  const numPages = Math.max(1, canvases.length);
  const totalObjects = 2 + numPages * 3;

  pushString('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // Object 1: Catalog
  offsets[1] = byteLength;
  pushString(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);

  // Object 2: Pages
  const kidsRefs = canvases.map((_, idx) => `${3 + idx * 3} 0 R`).join(' ');
  offsets[2] = byteLength;
  pushString(
    `2 0 obj\n<< /Type /Pages /Kids [ ${kidsRefs} ] /Count ${numPages} >>\nendobj\n`
  );

  // Render each page canvas as a high-resolution JPEG XObject inside the PDF page
  canvases.forEach((canvas, idx) => {
    const pageObjId = 3 + idx * 3;
    const contentObjId = 4 + idx * 3;
    const imageObjId = 5 + idx * 3;

    const imgW = canvas.width;
    const imgH = canvas.height;
    // Scale to standard PDF points (max width 792pt landscape or 612pt portrait)
    const isLandscape = imgW >= imgH * 1.15;
    const pageW = isLandscape ? 842 : 595; // A4 points
    const margin = 28;
    const availW = pageW - margin * 2;
    const scale = availW / Math.max(1, imgW);
    const drawW = Math.round(imgW * scale);
    const drawH = Math.round(imgH * scale);
    const pageH = Math.max(isLandscape ? 595 : 842, drawH + margin * 2);
    const drawX = margin;
    const drawY = pageH - margin - drawH;

    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const jpegBytes = dataUrlToUint8Array(jpegDataUrl);

    // Page Object
    offsets[pageObjId] = byteLength;
    pushString(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im${idx} ${imageObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`
    );

    // Content Stream Object
    const contentStream = `q\n${drawW} 0 0 ${drawH} ${drawX} ${drawY} cm\n/Im${idx} Do\nQ\n`;
    const contentBytes = encoder.encode(contentStream);
    offsets[contentObjId] = byteLength;
    pushString(
      `${contentObjId} 0 obj\n<< /Length ${contentBytes.byteLength} >>\nstream\n`
    );
    pushBytes(contentBytes);
    pushString(`\nendstream\nendobj\n`);

    // Image XObject
    offsets[imageObjId] = byteLength;
    pushString(
      `${imageObjId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.byteLength} >>\nstream\n`
    );
    pushBytes(jpegBytes);
    pushString(`\nendstream\nendobj\n`);
  });

  // Cross-reference table (xref)
  const startXref = byteLength;
  pushString(`xref\n0 ${totalObjects + 1}\n`);
  pushString(`0000000000 65535 f \n`);
  for (let objNum = 1; objNum <= totalObjects; objNum++) {
    const offStr = String(offsets[objNum] || 0).padStart(10, '0');
    pushString(`${offStr} 00000 n \n`);
  }

  // Trailer
  const safeTitle = documentTitle.replace(/[()\\]/g, '');
  pushString(
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R /Info << /Title (${safeTitle}) /Producer (BiblioVOS Studio Scientometric Engine) >> >>\nstartxref\n${startXref}\n%%EOF`
  );

  return new Blob(chunks as BlobPart[], { type: 'application/pdf' });
}

/**
 * Extracts an HTML table or custom rows into a UTF-8 CSV file download.
 */
export function exportTableFromContainerAsCSV(
  container: HTMLElement,
  title: string
): boolean {
  const table = container.querySelector('table');
  if (!table) return false;

  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length === 0) return false;

  const csvLines = rows.map((tr) => {
    const cells = Array.from(tr.querySelectorAll('th, td'));
    return cells
      .map((cell) => {
        const text = (cell.textContent || '').replace(/\s+/g, ' ').trim();
        return `"${text.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  const csvContent = '\uFEFF' + csvLines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  triggerBlobDownload(blob, `${sanitizeFilename(title)}.csv`);
  return true;
}

/**
 * Clones an SVG and resolves computed styles / currentColor so it renders cleanly to an Image.
 */
async function renderSvgToImage(
  svgEl: SVGSVGElement,
  darkBg: boolean
): Promise<HTMLImageElement | null> {
  try {
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    const rect = svgEl.getBoundingClientRect();
    const viewBoxAttr = svgEl.getAttribute('viewBox');
    let vbW = rect.width || 800;
    let vbH = rect.height || 400;
    if (viewBoxAttr) {
      const parts = viewBoxAttr.trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        vbW = parts[2];
        vbH = parts[3];
      }
    }

    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(vbW * 2));
    clone.setAttribute('height', String(vbH * 2));

    // Copy computed fill, stroke, font-size, font-family from live SVG elements
    const origNodes = Array.from(svgEl.querySelectorAll('*'));
    const cloneNodes = Array.from(clone.querySelectorAll('*'));

    origNodes.forEach((orig, idx) => {
      const target = cloneNodes[idx] as SVGElement | undefined;
      if (!target) return;
      const cs = window.getComputedStyle(orig);
      const tagName = orig.tagName.toLowerCase();

      if (tagName === 'text' || tagName === 'tspan') {
        const fill = cs.fill && cs.fill !== 'none' ? cs.fill : darkBg ? '#F1F5F9' : '#0F172A';
        target.setAttribute('fill', fill);
        target.setAttribute(
          'font-family',
          cs.fontFamily || 'Inter, system-ui, -apple-system, sans-serif'
        );
        if (cs.fontSize) target.setAttribute('font-size', cs.fontSize);
        if (cs.fontWeight) target.setAttribute('font-weight', cs.fontWeight);
      } else if (tagName === 'line' || tagName === 'path' || tagName === 'circle' || tagName === 'rect') {
        if (cs.stroke && cs.stroke !== 'none') {
          target.setAttribute('stroke', cs.stroke);
        }
        if (cs.fill && cs.fill !== 'none' && !target.getAttribute('fill')) {
          target.setAttribute('fill', cs.fill);
        }
      }
    });

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    return await new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  } catch {
    return null;
  }
}

/**
 * Renders any visualization card (containing SVGs, Canvases, KPI grids, Legend items, and/or HTML Tables)
 * onto a high-DPI publication canvas with header, metadata subtitle, graphics, and tabular cells.
 */
export async function renderCardContainerToCanvas(
  container: HTMLElement,
  customTitle?: string
): Promise<HTMLCanvasElement> {
  const scale = 2; // 2x Retina / 300-DPI class output
  const headingEl = container.querySelector('h2, h3');
  const subtitleEl = container.querySelector('p');
  const title =
    customTitle ||
    (headingEl?.textContent || 'BiblioVOS Scientometric Visualization').trim();
  const subtitle = (subtitleEl?.textContent || '').trim();

  const svgElements = Array.from(container.querySelectorAll('svg')).filter((svg) => {
    const r = svg.getBoundingClientRect();
    // Exclude tiny button icons (< 36px)
    return r.width > 48 && r.height > 48;
  });

  const canvasElements = Array.from(container.querySelectorAll('canvas'));
  const tableEl = container.querySelector('table');

  // Extract legend or slice breakdown items if this is a Pie/Donut chart or KPI strip
  const tableRows: { cells: string[]; isHeader: boolean }[] = [];
  if (tableEl) {
    const trs = Array.from(tableEl.querySelectorAll('tr')).slice(0, 35);
    trs.forEach((tr) => {
      const ths = Array.from(tr.querySelectorAll('th'));
      if (ths.length > 0) {
        tableRows.push({
          cells: ths.map((c) => (c.textContent || '').replace(/\s+/g, ' ').trim()),
          isHeader: true
        });
      } else {
        const tds = Array.from(tr.querySelectorAll('td'));
        if (tds.length > 0) {
          tableRows.push({
            cells: tds.map((c) => (c.textContent || '').replace(/\s+/g, ' ').trim()),
            isHeader: false
          });
        }
      }
    });
  }

  // Determine layout dimensions
  const baseWidth = 1100;
  let totalHeight = 115; // Header + Subtitle + Timestamp banner

  // Pre-render SVGs
  const renderedSvgs: { img: HTMLImageElement; drawW: number; drawH: number; darkBg: boolean }[] =
    [];
  for (const svg of svgElements) {
    const viewBoxAttr = svg.getAttribute('viewBox');
    const r = svg.getBoundingClientRect();
    let vbW = r.width || 700;
    let vbH = r.height || 300;
    if (viewBoxAttr) {
      const parts = viewBoxAttr.trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        vbW = parts[2];
        vbH = parts[3];
      }
    }
    const darkBg = Boolean(svg.closest('.bg-\\[\\#0B0E17\\]'));
    const img = await renderSvgToImage(svg, darkBg);
    if (img) {
      const targetW = Math.min(baseWidth - 64, vbW <= 300 ? 360 : baseWidth - 64);
      const targetH = Math.round((vbH / Math.max(1, vbW)) * targetW);
      renderedSvgs.push({ img, drawW: targetW, drawH: targetH, darkBg });
      totalHeight += targetH + 28;
    }
  }

  // If there are no SVGs and no Table, capture KPI / metric blocks inside the container
  const kpiCards: { label: string; value: string; sub: string }[] = [];
  if (renderedSvgs.length === 0 && tableRows.length === 0) {
    const metricBoxes = Array.from(container.querySelectorAll('.grid > div'));
    metricBoxes.forEach((box) => {
      const lines = Array.from(box.children)
        .map((c) => (c.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean);
      if (lines.length >= 2) {
        kpiCards.push({
          label: lines[0],
          value: lines[1],
          sub: lines[2] || ''
        });
      }
    });
    if (kpiCards.length > 0) {
      const rowsCount = Math.ceil(kpiCards.length / 3);
      totalHeight += rowsCount * 96 + 24;
    }
  }

  // Add height for table rows if present
  const rowHeight = 30;
  if (tableRows.length > 0) {
    totalHeight += tableRows.length * rowHeight + 36;
  }

  totalHeight = Math.max(260, totalHeight + 36);

  const outCanvas = document.createElement('canvas');
  outCanvas.width = baseWidth * scale;
  outCanvas.height = totalHeight * scale;
  const ctx = outCanvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // Clean White Publication Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, baseWidth, totalHeight);

  // Top Accent Rule
  ctx.fillStyle = '#1D4ED8';
  ctx.fillRect(0, 0, baseWidth, 5);

  // Header Title & Subtitle
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 20px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText(title, 32, 38);

  if (subtitle) {
    ctx.fillStyle = '#475569';
    ctx.font = '12.5px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillText(subtitle.slice(0, 135), 32, 60);
  }

  ctx.fillStyle = '#64748B';
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillText(
    `BiblioVOS Studio · Scientometric & VOSviewer Analysis · Generated ${new Date().toISOString().slice(0, 10)}`,
    32,
    80
  );

  // Divider line
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(32, 92);
  ctx.lineTo(baseWidth - 32, 92);
  ctx.stroke();

  let cursorY = 108;

  // Draw SVGs (and underlying density canvas if present)
  for (let i = 0; i < renderedSvgs.length; i++) {
    const item = renderedSvgs[i];
    const drawX = item.drawW < baseWidth - 100 ? 48 : 32;

    // Frame background
    ctx.fillStyle = item.darkBg ? '#0B0E17' : '#F8FAFC';
    ctx.fillRect(drawX, cursorY, item.drawW, item.drawH);
    ctx.strokeStyle = '#CBD5E1';
    ctx.strokeRect(drawX, cursorY, item.drawW, item.drawH);

    // If a VOSviewer density canvas exists, draw it beneath the SVG
    if (canvasElements[i]) {
      try {
        ctx.drawImage(canvasElements[i], drawX, cursorY, item.drawW, item.drawH);
      } catch {
        // Ignore tainted canvas
      }
    }

    ctx.drawImage(item.img, drawX, cursorY, item.drawW, item.drawH);

    // If this is a compact chart (like a Pie/Donut chart), render its legend items on the right side!
    if (item.drawW <= 420) {
      const legendItems = Array.from(
        container.querySelectorAll('.font-mono.tabular-nums')
      ).slice(0, 10);
      let legY = cursorY + 24;
      ctx.font = 'bold 13px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.fillText('Distribution Breakdown:', drawX + item.drawW + 36, legY);
      legY += 22;

      const rows = Array.from(container.querySelectorAll('.cursor-pointer')).filter(
        (el) => el.tagName === 'DIV' && (el.textContent || '').includes('%')
      );
      rows.slice(0, 9).forEach((row) => {
        const text = (row.textContent || '').replace(/\s+/g, ' ').trim();
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillStyle = '#1E293B';
        ctx.fillText(`• ${text}`, drawX + item.drawW + 36, legY);
        legY += 22;
      });
      if (legendItems.length === 0 && rows.length === 0) {
        legY += 10;
      }
    }

    cursorY += item.drawH + 24;
  }

  // Draw KPI boxes if no SVG/Table
  if (kpiCards.length > 0) {
    const colW = Math.floor((baseWidth - 64 - 24) / 3);
    kpiCards.forEach((kpi, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const bx = 32 + col * (colW + 12);
      const by = cursorY + row * 92;

      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(bx, by, colW, 80);
      ctx.strokeStyle = '#E2E8F0';
      ctx.strokeRect(bx, by, colW, 80);

      ctx.fillStyle = '#64748B';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.fillText(kpi.label, bx + 14, by + 22);

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      ctx.fillText(kpi.value, bx + 14, by + 48);

      ctx.fillStyle = '#475569';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(kpi.sub, bx + 14, by + 68);
    });
    cursorY += Math.ceil(kpiCards.length / 3) * 92 + 16;
  }

  // Draw HTML Table if present
  if (tableRows.length > 0) {
    const tableW = baseWidth - 64;
    const colCount = Math.max(1, ...tableRows.map((r) => r.cells.length));
    const colW = tableW / colCount;

    tableRows.forEach((row, rIdx) => {
      const ry = cursorY + rIdx * rowHeight;
      if (row.isHeader) {
        ctx.fillStyle = '#F1F5F9';
        ctx.fillRect(32, ry, tableW, rowHeight);
        ctx.strokeStyle = '#CBD5E1';
        ctx.strokeRect(32, ry, tableW, rowHeight);
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      } else {
        ctx.fillStyle = rIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        ctx.fillRect(32, ry, tableW, rowHeight);
        ctx.strokeStyle = '#E2E8F0';
        ctx.strokeRect(32, ry, tableW, rowHeight);
        ctx.fillStyle = '#0F172A';
        ctx.font = '11px "JetBrains Mono", monospace';
      }

      row.cells.forEach((cellText, cIdx) => {
        const cx = 32 + cIdx * colW + 8;
        const maxChars = Math.max(8, Math.floor(colW / 6.8));
        const clipped =
          cellText.length > maxChars ? cellText.slice(0, maxChars - 1) + '…' : cellText;
        ctx.fillText(clipped, cx, ry + 19);
      });
    });

    cursorY += tableRows.length * rowHeight + 20;
  }

  return outCanvas;
}

/**
 * Exports any visualization, graph, or table DOM container to PNG, JPG, PDF, or CSV.
 */
export async function exportCardElement(
  container: HTMLElement,
  format: VisualExportFormat,
  customTitle?: string
): Promise<void> {
  const headingEl = container.querySelector('h2, h3');
  const title =
    customTitle || (headingEl?.textContent || 'bibliovos_visualization').trim();
  const baseName = sanitizeFilename(title);

  if (format === 'csv') {
    const ok = exportTableFromContainerAsCSV(container, title);
    if (ok) return;
  }

  const canvas = await renderCardContainerToCanvas(container, title);

  if (format === 'png') {
    canvas.toBlob((blob) => {
      if (blob) triggerBlobDownload(blob, `${baseName}.png`);
    }, 'image/png');
    return;
  }

  if (format === 'jpg') {
    canvas.toBlob(
      (blob) => {
        if (blob) triggerBlobDownload(blob, `${baseName}.jpg`);
      },
      'image/jpeg',
      0.95
    );
    return;
  }

  if (format === 'pdf') {
    const pdfBlob = buildPdfFromCanvases([canvas], title);
    triggerBlobDownload(pdfBlob, `${baseName}.pdf`);
  }
}

export interface ManuscriptPageSection {
  heading: string;
  paragraphs: string[];
  table?: {
    caption: string;
    headers: string[];
    rows: string[][];
  };
}

/**
 * Renders a complete multi-page academic manuscript into a downloadable PDF document.
 */
export function exportManuscriptToMultiPagePdf(
  manuscriptTitle: string,
  authorsLine: string,
  metadataLine: string,
  sections: ManuscriptPageSection[],
  filename: string
): void {
  const scale = 2;
  const pageW = 794; // A4 width at 96 DPI
  const pageH = 1123; // A4 height at 96 DPI
  const marginX = 54;
  const contentW = pageW - marginX * 2;

  const pages: HTMLCanvasElement[] = [];
  let currentCanvas = document.createElement('canvas');
  let ctx: CanvasRenderingContext2D;
  let cursorY = 64;
  let pageNumber = 1;

  const startNewPage = (isFirstPage = false) => {
    currentCanvas = document.createElement('canvas');
    currentCanvas.width = pageW * scale;
    currentCanvas.height = pageH * scale;
    ctx = currentCanvas.getContext('2d')!;
    ctx.scale(scale, scale);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, pageW, pageH);

    // Running header & footer
    ctx.fillStyle = '#64748B';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(
      `BiblioVOS Studio — Scientometric Manuscript Report`,
      marginX,
      32
    );
    ctx.fillText(`Page ${pageNumber}`, pageW - marginX - 45, 32);

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(marginX, 40);
    ctx.lineTo(pageW - marginX, 40);
    ctx.stroke();

    pages.push(currentCanvas);
    pageNumber++;
    cursorY = isFirstPage ? 64 : 62;
  };

  const ensureSpace = (neededH: number) => {
    if (cursorY + neededH > pageH - 56) {
      startNewPage(false);
    }
  };

  const wrapLines = (text: string, font: string, maxWidth: number): string[] => {
    ctx.font = font;
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  startNewPage(true);

  // Title Block on Page 1
  const titleLines = wrapLines(
    manuscriptTitle,
    'bold 20px Inter, system-ui, sans-serif',
    contentW
  );
  ctx!.fillStyle = '#0F172A';
  ctx!.font = 'bold 20px Inter, system-ui, sans-serif';
  titleLines.forEach((line) => {
    ctx!.fillText(line, marginX, cursorY);
    cursorY += 26;
  });

  cursorY += 4;
  ctx!.fillStyle = '#334155';
  ctx!.font = '12px Inter, system-ui, sans-serif';
  ctx!.fillText(authorsLine, marginX, cursorY);
  cursorY += 18;

  ctx!.fillStyle = '#64748B';
  ctx!.font = '11px "JetBrains Mono", monospace';
  ctx!.fillText(metadataLine, marginX, cursorY);
  cursorY += 16;

  ctx!.strokeStyle = '#1D4ED8';
  ctx!.lineWidth = 1.5;
  ctx!.beginPath();
  ctx!.moveTo(marginX, cursorY);
  ctx!.lineTo(pageW - marginX, cursorY);
  ctx!.stroke();
  cursorY += 24;

  // Render Each Manuscript Section
  sections.forEach((sec) => {
    ensureSpace(52);
    ctx!.fillStyle = '#0F172A';
    ctx!.font = 'bold 14px Inter, system-ui, sans-serif';
    ctx!.fillText(sec.heading, marginX, cursorY);
    cursorY += 20;

    sec.paragraphs.forEach((para) => {
      const lines = wrapLines(para, '11.5px Inter, system-ui, sans-serif', contentW);
      lines.forEach((line) => {
        ensureSpace(18);
        ctx!.fillStyle = '#1E293B';
        ctx!.font = '11.5px Inter, system-ui, sans-serif';
        ctx!.fillText(line, marginX, cursorY);
        cursorY += 17;
      });
      cursorY += 8;
    });

    if (sec.table) {
      const tbl = sec.table;
      const rowH = 22;
      const neededTableH = (tbl.rows.length + 2) * rowH + 24;
      ensureSpace(Math.min(260, neededTableH));

      ctx!.fillStyle = '#0F172A';
      ctx!.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx!.fillText(tbl.caption, marginX, cursorY);
      cursorY += 10;

      const colCount = Math.max(1, tbl.headers.length);
      const colW = contentW / colCount;

      // Table Header
      ctx!.fillStyle = '#F1F5F9';
      ctx!.fillRect(marginX, cursorY, contentW, rowH);
      ctx!.strokeStyle = '#94A3B8';
      ctx!.strokeRect(marginX, cursorY, contentW, rowH);
      ctx!.fillStyle = '#0F172A';
      ctx!.font = 'bold 10px Inter, system-ui, sans-serif';
      tbl.headers.forEach((h, cIdx) => {
        const maxChars = Math.max(8, Math.floor(colW / 6));
        ctx!.fillText(
          h.length > maxChars ? h.slice(0, maxChars - 1) + '…' : h,
          marginX + cIdx * colW + 6,
          cursorY + 15
        );
      });
      cursorY += rowH;

      // Table Rows
      tbl.rows.forEach((rCells, rIdx) => {
        ensureSpace(rowH + 6);
        ctx!.fillStyle = rIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        ctx!.fillRect(marginX, cursorY, contentW, rowH);
        ctx!.strokeStyle = '#E2E8F0';
        ctx!.strokeRect(marginX, cursorY, contentW, rowH);
        ctx!.fillStyle = '#1E293B';
        ctx!.font = '10px "JetBrains Mono", monospace';
        rCells.forEach((val, cIdx) => {
          const maxChars = Math.max(8, Math.floor(colW / 6));
          ctx!.fillText(
            val.length > maxChars ? val.slice(0, maxChars - 1) + '…' : val,
            marginX + cIdx * colW + 6,
            cursorY + 15
          );
        });
        cursorY += rowH;
      });

      cursorY += 16;
    }

    cursorY += 8;
  });

  const pdfBlob = buildPdfFromCanvases(pages, manuscriptTitle);
  triggerBlobDownload(pdfBlob, `${sanitizeFilename(filename)}.pdf`);
}
