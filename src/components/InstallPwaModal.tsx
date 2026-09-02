import React from 'react';
import { 
  Download, 
  Smartphone, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  WifiOff, 
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallSuccess: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallSuccess,
}) => {
  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        onInstallSuccess();
        onClose();
      }
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="install-pwa-modal"
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
          title="બંધ કરો"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 flex items-center justify-center shadow-md">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 font-['Noto_Sans_Gujarati']">
              હોમ સ્ક્રીન પર એપ સેવ કરો
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              ઈન્ટરનેટ વગર પણ કોઈપણ સમયે બોધકથાઓ વાંચો
            </p>
          </div>
        </div>

        {/* Offline Features Highlight */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
            <WifiOff className="w-4 h-4" />
            <span>૧૦૦% ઓફલાઇન સપોર્ટ (100% Offline Ready)</span>
          </div>
          <p className="text-xs text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed">
            એપ સેવ કર્યા પછી બધી વાર્તાઓ, તમારો વાંચન ઇતિહાસ અને નોંધો ઇન્ટરનેટ વિના પણ ઉપલબ્ધ રહેશે.
          </p>
        </div>

        {/* Native 1-Click Install Button if supported */}
        {deferredPrompt && (
          <button
            onClick={handleNativeInstall}
            className="w-full py-3.5 bg-amber-700 hover:bg-amber-800 text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <Download className="w-5 h-5" />
            <span>એપ ઇન્સ્ટોલ કરો (Install Application)</span>
          </button>
        )}

        {/* Step-by-Step Instructions */}
        <div className="space-y-4 pt-2">
          <div className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
            {isIOS ? 'iPhone / iPad (Safari) માટે માર્ગદર્શન:' : 'Android / Chrome / Edge માટે માર્ગદર્શન:'}
          </div>

          {isIOS ? (
            <div className="space-y-3 text-xs text-stone-600 dark:text-stone-300">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 font-bold">1</div>
                <div className="flex-1">
                  Safari બ્રાઉઝરમાં નીચે આપેલ <Share className="w-4 h-4 inline-block text-blue-500 mx-1" /> <strong>શેર (Share)</strong> બટન પર ટેપ કરો.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 font-bold">2</div>
                <div className="flex-1">
                  નીચે સ્ક્રોલ કરીને <PlusSquare className="w-4 h-4 inline-block text-stone-700 dark:text-stone-300 mx-1" /> <strong>"Add to Home Screen"</strong> (હોમ સ્ક્રીનમાં ઉમેરો) વિકલ્પ પસંદ કરો.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 font-bold">3</div>
                <div className="flex-1">
                  જમણી બાજુ ઉપર <strong>"Add"</strong> પર ક્લિક કરો. એપ તમારા મોબાઈલ હોમ સ્ક્રીન પર સેવ થઈ જશે!
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs text-stone-600 dark:text-stone-300">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 font-bold">1</div>
                <div className="flex-1">
                  બ્રાઉઝરના ઉપરના જમણા ખૂણે આપેલા <strong>ત્રણ ટપકાં (⋮)</strong> મેનુ પર ટેપ કરો.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 font-bold">2</div>
                <div className="flex-1">
                  <strong>"Install app"</strong> અથવા <strong>"Add to Home screen"</strong> (હોમ સ્ક્રીન પર ઉમેરો) પસંદ કરો.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold"
        >
          સમજાઈ ગયું (Got it)
        </button>
      </div>
    </div>
  );
};
