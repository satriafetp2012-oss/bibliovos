import React, { useState } from 'react';
import { Smartphone, Check, X, Monitor, Share2, WifiOff } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const PWAInstallControl: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
        <Check className="w-3.5 h-3.5" />
        Installed Web App
      </span>
    );
  }

  return (
    <>
      <button
        onClick={async () => {
          if (isInstallable) {
            await install();
          } else {
            setShowGuideModal(true);
          }
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
      >
        <Smartphone className="w-3.5 h-3.5" />
        {isIOS ? 'Install on iOS' : 'Install Web App'}
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Install BiblioVOS Studio as a Web App
                </h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              BiblioVOS Studio is configured as a standalone Progressive Web App (PWA) with offline corpus persistence and service worker caching.
            </p>

            {isIOS ? (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-blue-600" />
                  Install on iPhone or iPad (Safari):
                </div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Tap the <strong>Share</strong> icon in the Safari toolbar.</li>
                  <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
                  <li>Launch BiblioVOS Studio in full-screen standalone mode.</li>
                </ol>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  Desktop & Android Installation (Chrome / Edge / Brave):
                </div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    If viewing inside an embedded preview frame, open the app URL in a dedicated browser tab.
                  </li>
                  <li>
                    Click the <strong>Install BiblioVOS Studio</strong> icon in the browser address bar (or menu → <strong>Install App</strong>).
                  </li>
                  <li>
                    Your merged corpus and conflict resolutions are automatically saved locally for offline analysis.
                  </li>
                </ol>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline Mode — Working from cached web app & local corpus storage.</span>
    </div>
  );
};
