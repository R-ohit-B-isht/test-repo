import { useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { applyUpdate, dismissOfflineReady, dismissUpdate, startPwa, usePwa } from '../../pwa/pwaStore';
import { dismissToast, toast } from '../../state/toastStore';

/** Offline strip under the header + update / offline-ready toasts. Renders nothing while online and up to date. */
export function PwaStatus() {
  const { online, updateReady, offlineReady } = usePwa();
  useEffect(startPwa, []);

  useEffect(() => {
    if (!updateReady) return;
    const id = toast('A newer version of Skin Ledger is ready', { label: 'Reload', run: applyUpdate }, { sticky: true });
    return () => { dismissToast(id); dismissUpdate(); };
  }, [updateReady]);

  useEffect(() => {
    if (!offlineReady) return;
    const id = toast('Ready to work offline');
    dismissOfflineReady();
    return () => dismissToast(id);
  }, [offlineReady]);

  if (online) return null;
  return (
    <div role="status" className="border-b border-line bg-raised">
      <p className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-2 text-[13px] font-bold text-secondary sm:px-6">
        <WifiOff size={14} aria-hidden />
        Offline — showing what this device has already loaded. Prices and ranks may be older; the assistant needs a connection.
      </p>
    </div>
  );
}
