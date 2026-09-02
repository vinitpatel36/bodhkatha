import React from 'react';
import { Story } from '../types';
import { X, BookOpen, Printer } from 'lucide-react';

interface OriginalPageModalProps {
  story: Story | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OriginalPageModal: React.FC<OriginalPageModalProps> = ({
  story,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !story) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="original-page-modal"
        className="bg-[#fdf9f0] text-[#3d2716] border-4 border-[#8c501c] rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden font-['Rasa',serif]"
      >
        {/* Modal Top Bar */}
        <div className="bg-[#ebd7bf] px-4 sm:px-6 py-3 border-b-2 border-[#b58756] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#5e2e0e]">
            <BookOpen className="w-4 h-4" />
            <span>મૂળ પુસ્તક પાન પ્રારૂપ (Original Book Page View)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-[#5e2e0e] hover:bg-[#dec4a6] transition-colors"
              title="પ્રિન્ટ કરો (Print Page)"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#5e2e0e] hover:bg-[#dec4a6] transition-colors"
              title="બંધ કરો"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Authentic Book Page Canvas */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 space-y-6 text-[#2d1b0d]">
          {/* Header Running Header */}
          <div className="flex items-center justify-between border-b border-[#a87f54] pb-2 text-xs font-bold tracking-widest text-[#783e15] uppercase">
            <span>યોગીજી મહારાજની બોધકથાઓ</span>
            <span>પાન નં. {story.bookPage}</span>
          </div>

          {/* Story Number and Title Calligraphy */}
          <div className="text-center space-y-1">
            <div className="text-sm font-bold text-[#94430e]">
              વાર્તા ક્રમાંક : {story.id}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-wide text-[#421d05] font-['Noto_Sans_Gujarati']">
              « {story.title} »
            </h2>
            <div className="text-xs text-[#8c501c] italic">
              {story.titleEnglish}
            </div>
          </div>

          {/* Main Book Content with Traditional Typography */}
          <div className="space-y-4 text-base sm:text-lg leading-relaxed text-justify">
            {story.content.map((p, idx) => (
              <p key={idx} className="indent-6">
                {p}
              </p>
            ))}
          </div>

          {/* Saakhi if available */}
          {story.saakhi && story.saakhi.length > 0 && (
            <div className="my-6 p-4 border-y border-[#b58756] text-center italic text-[#4a2408] text-base sm:text-lg space-y-1 bg-[#f7eedf]">
              {story.saakhi.map((line, sIdx) => (
                <div key={sIdx}>"{line}"</div>
              ))}
            </div>
          )}

          {/* Authentic Moral Box */}
          <div className="p-4 rounded-xl border-2 border-dashed border-[#a66d3a] bg-[#f5e9d5] text-[#4a2106]">
            <div className="font-bold text-sm text-[#873a0a] mb-1">
              • બોધ અને સિદ્ધાંત :
            </div>
            <p className="text-base font-medium">
              {story.moral}
            </p>
          </div>

          {/* Footnotes */}
          {story.footnotes && story.footnotes.length > 0 && (
            <div className="border-t border-[#c29c72] pt-3 text-xs text-[#6e4624] space-y-1">
              <div className="font-bold">પાદટીપ :</div>
              {story.footnotes.map((fn, fIdx) => (
                <div key={fIdx}>
                  <span className="font-semibold text-[#873a0a]">({fn.key})</span> {fn.text}
                </div>
              ))}
            </div>
          )}

          {/* Footer Page Number */}
          <div className="text-center pt-4 text-xs font-bold text-[#874b1e] border-t border-[#d6b592]">
            — {story.bookPage} —
          </div>
        </div>
      </div>
    </div>
  );
};
