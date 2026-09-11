import { useState } from 'react';
import { Download, Share, SquarePlus } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { toast } from '../../state/toastStore';
import { promptInstall, usePwa } from '../../pwa/pwaStore';

/** Header "Install" entry: Chrome/Edge/Android get the native sheet; iOS Safari gets the two-step Share instructions. */
export function InstallButton() {
  const { installable, iosHint, standalone } = usePwa();
  const [showIos, setShowIos] = useState(false);
  if (standalone || (!installable && !iosHint)) return null;

  const onClick = async () => {
    if (installable) {
      if (await promptInstall()) toast('Skin Ledger installed — open it from your home screen');
    } else {
      setShowIos(true);
    }
  };

  return (
    <>
      <button type="button" onClick={onClick} className="btn h-9 w-9 shrink-0 gap-1.5 px-0 text-[13px] sm:h-10 sm:w-auto sm:px-3" title="Install the app" aria-label="Install the app">
        <Download size={14} aria-hidden />
        <span className="hidden sm:inline">Install</span>
      </button>
      <Sheet open={showIos} onClose={() => setShowIos(false)} title="Install Skin Ledger" narrow>
        <ol className="space-y-4 text-[14px] text-primary">
          <li className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-raised text-display"><Share size={15} aria-hidden /></span>
            <span>Tap <strong>Share</strong> in Safari's toolbar.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-raised text-display"><SquarePlus size={15} aria-hidden /></span>
            <span>Choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</span>
          </li>
        </ol>
        <p className="mt-5 text-[13px] text-secondary">It opens full-screen like an app; rankings you have opened, your routine and chat history keep working offline.</p>
      </Sheet>
    </>
  );
}
