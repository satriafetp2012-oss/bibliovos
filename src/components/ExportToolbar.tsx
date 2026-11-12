import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { exportCardElement, VisualExportFormat } from '../utils/exportMediaEngine';

interface CardExportToolbarProps {
  targetRef: React.RefObject<HTMLElement | null>;
  title?: string;
  includeCsv?: boolean;
  darkTheme?: boolean;
}

export const CardExportToolbar: React.FC<CardExportToolbarProps> = ({
  targetRef,
  title,
  includeCsv = false,
  darkTheme = false
}) => {
  const [busyFormat, setBusyFormat] = useState<VisualExportFormat | null>(null);

  const handleExport = async (format: VisualExportFormat) => {
    if (!targetRef.current || busyFormat) return;
    setBusyFormat(format);
    try {
      await exportCardElement(targetRef.current, format, title);
    } finally {
      setBusyFormat(null);
    }
  };

  const btnClass = darkTheme
    ? 'px-2 py-1 text-[11px] font-mono font-medium rounded border border-slate-700 bg-slate-800/90 text-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-colors whitespace-nowrap shrink-0'
    : 'px-2 py-1 text-[11px] font-mono font-medium rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors whitespace-nowrap shrink-0';

  return (
    <div
      data-bibliovos-export-bar="true"
      className="inline-flex items-center gap-1 shrink-0"
      title="Download this visualization or table as high-resolution PNG, JPG, or PDF"
    >
      <Download className="w-3 h-3 text-slate-400 mr-0.5 shrink-0" />
      <button
        type="button"
        onClick={() => handleExport('png')}
        disabled={busyFormat !== null}
        className={btnClass}
      >
        {busyFormat === 'png' ? '...' : 'PNG'}
      </button>
      <button
        type="button"
        onClick={() => handleExport('jpg')}
        disabled={busyFormat !== null}
        className={btnClass}
      >
        {busyFormat === 'jpg' ? '...' : 'JPG'}
      </button>
      <button
        type="button"
        onClick={() => handleExport('pdf')}
        disabled={busyFormat !== null}
        className={btnClass}
      >
        {busyFormat === 'pdf' ? '...' : 'PDF'}
      </button>
      {includeCsv && (
        <button
          type="button"
          onClick={() => handleExport('csv')}
          disabled={busyFormat !== null}
          className={btnClass}
        >
          {busyFormat === 'csv' ? '...' : 'CSV'}
        </button>
      )}
    </div>
  );
};

/**
 * Automatically attaches PNG / JPG / PDF (and CSV for tables) download buttons
 * to every visualization card, graph container, and data table card in the workspace.
 */
export const WorkspaceAutoExportEnhancer: React.FC<{
  workspaceRef: React.RefObject<HTMLElement | null>;
  activeModuleKey: string;
}> = ({ workspaceRef, activeModuleKey }) => {
  useEffect(() => {
    const root = workspaceRef.current;
    if (!root) return;

    const attachExportBars = () => {
      // Find all top-level and grid analytical cards that contain an h2/h3 and a chart (svg/canvas) or table or KPI grid
      const headings = Array.from(root.querySelectorAll('h2, h3'));

      headings.forEach((heading) => {
        const card = heading.closest(
          '.rounded-lg.border, .border.rounded-lg'
        ) as HTMLElement | null;
        if (!card) return;
        if (card.dataset.exportEnhanced === 'true') return;
        if (card.querySelector('[data-bibliovos-export-bar="true"]')) {
          card.dataset.exportEnhanced = 'true';
          return;
        }

        // Check if this card has an SVG chart, canvas, table, or metric grid
        const hasChartSvg = Array.from(card.querySelectorAll('svg')).some((s) => {
          const r = s.getBoundingClientRect();
          return r.width > 50 && r.height > 50;
        });
        const hasTable = Boolean(card.querySelector('table'));
        const hasCanvas = Boolean(card.querySelector('canvas'));
        const hasGrid = Boolean(card.querySelector('.grid'));

        if (!hasChartSvg && !hasTable && !hasCanvas && !hasGrid) return;

        card.dataset.exportEnhanced = 'true';

        // Create compact export bar
        const bar = document.createElement('div');
        bar.setAttribute('data-bibliovos-export-bar', 'true');
        bar.className =
          'inline-flex items-center gap-1 shrink-0 ml-auto pt-0.5';

        const label = document.createElement('span');
        label.className =
          'text-[10px] font-mono text-slate-400 dark:text-slate-500 mr-0.5 hidden sm:inline';
        label.textContent = 'Save:';
        bar.appendChild(label);

        const formats: VisualExportFormat[] = hasTable
          ? ['png', 'jpg', 'pdf', 'csv']
          : ['png', 'jpg', 'pdf'];

        formats.forEach((fmt) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = fmt.toUpperCase();
          btn.title = `Download "${(heading.textContent || 'Visualization').trim()}" as ${fmt.toUpperCase()}`;
          btn.className =
            'px-2 py-0.5 text-[10px] font-mono font-semibold rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors cursor-pointer whitespace-nowrap shrink-0';
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const origText = btn.textContent;
            btn.textContent = '...';
            try {
              await exportCardElement(
                card,
                fmt,
                (heading.textContent || 'BiblioVOS Visualization').trim()
              );
            } finally {
              btn.textContent = origText;
            }
          });
          bar.appendChild(btn);
        });

        // Insert into the header row next to the h2/h3 block
        const headerRow = heading.parentElement?.parentElement;
        if (
          headerRow &&
          (headerRow.className.includes('justify-between') ||
            headerRow.className.includes('flex'))
        ) {
          headerRow.appendChild(bar);
        } else if (heading.parentElement) {
          const wrapper = document.createElement('div');
          wrapper.className = 'flex items-center justify-between gap-2 mb-1';
          heading.parentElement.insertBefore(wrapper, heading);
          wrapper.appendChild(heading);
          wrapper.appendChild(bar);
        }
      });
    };

    const timer = setTimeout(attachExportBars, 80);
    const observer = new MutationObserver(() => {
      attachExportBars();
    });
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [workspaceRef, activeModuleKey]);

  return null;
};
