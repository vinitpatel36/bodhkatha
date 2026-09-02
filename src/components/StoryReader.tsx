import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Star, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw, 
  Share2, 
  Copy, 
  Check, 
  Type, 
  Sparkles, 
  BookOpen, 
  FileText, 
  Tag, 
  Plus, 
  X,
  MessageSquare,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Story, UserPreferences, ReaderTheme, FontSize, FontStyle, LineHeight } from '../types';
import { CATEGORIES } from '../data/categories';

interface StoryReaderProps {
  story: Story;
  allStories: Story[];
  preferences: UserPreferences;
  onUpdatePreferences: (updater: (prev: UserPreferences) => UserPreferences) => void;
  onSelectStory: (storyId: number) => void;
  onBackToList: () => void;
  onOpenOriginalPage: (story: Story) => void;
  onOpenTagInExplorer?: (tag: string) => void;
}

export const StoryReader: React.FC<StoryReaderProps> = ({
  story,
  allStories,
  preferences,
  onUpdatePreferences,
  onSelectStory,
  onBackToList,
  onOpenOriginalPage,
  onOpenTagInExplorer,
}) => {
  const [copied, setCopied] = useState(false);
  const [showTypographyMenu, setShowTypographyMenu] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [currentNote, setCurrentNote] = useState(preferences.notes[story.id] || '');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isFavorite = preferences.favorites.includes(story.id);
  const isRead = preferences.readStories.includes(story.id);
  const userTags = preferences.customTags[story.id] || [];

  // Update current note state when story changes
  useEffect(() => {
    setCurrentNote(preferences.notes[story.id] || '');
    // Cancel any ongoing speech when switching stories
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
    // Scroll reading area to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Auto-mark as read if setting is enabled and not already read
    if (preferences.settings.autoMarkRead && !isRead) {
      const timer = setTimeout(() => {
        onUpdatePreferences((prev) => ({
          ...prev,
          readStories: Array.from(new Set([...prev.readStories, story.id])),
          lastReadStoryId: story.id,
        }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [story.id]);

  // Find next and previous stories in dataset
  const currentIndex = allStories.findIndex((s) => s.id === story.id);
  const prevStory = currentIndex > 0 ? allStories[currentIndex - 1] : null;
  const nextStory = currentIndex < allStories.length - 1 ? allStories[currentIndex + 1] : null;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is typing in note or tag input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'ArrowLeft' && prevStory) {
        onSelectStory(prevStory.id);
      } else if (e.key === 'ArrowRight' && nextStory) {
        onSelectStory(nextStory.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevStory, nextStory, onSelectStory]);

  const toggleFavorite = () => {
    const nextFavorites = isFavorite
      ? preferences.favorites.filter((id) => id !== story.id)
      : [...preferences.favorites, story.id];

    if (!isFavorite) {
      // Trigger tiny celebratory confetti on favoriting
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#f59e0b', '#d97706', '#fbbf24', '#f43f5e'],
        });
      } catch (_) {}
    }

    onUpdatePreferences((prev) => ({
      ...prev,
      favorites: nextFavorites,
    }));
  };

  const toggleReadStatus = () => {
    const nextRead = isRead
      ? preferences.readStories.filter((id) => id !== story.id)
      : [...preferences.readStories, story.id];

    if (!isRead) {
      try {
        confetti({
          particleCount: 45,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#10b981', '#34d399', '#059669', '#f59e0b'],
        });
      } catch (_) {}
    }

    onUpdatePreferences((prev) => ({
      ...prev,
      readStories: nextRead,
      lastReadStoryId: story.id,
    }));
  };

  const handleSaveNote = () => {
    onUpdatePreferences((prev) => ({
      ...prev,
      notes: {
        ...prev.notes,
        [story.id]: currentNote.trim(),
      },
    }));
  };

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim();
    if (!clean) return;
    const currentList = preferences.customTags[story.id] || [];
    if (!currentList.includes(clean)) {
      onUpdatePreferences((prev) => ({
        ...prev,
        customTags: {
          ...prev.customTags,
          [story.id]: [...currentList, clean],
        },
      }));
    }
    setNewTagInput('');
    setShowTagInput(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentList = preferences.customTags[story.id] || [];
    onUpdatePreferences((prev) => ({
      ...prev,
      customTags: {
        ...prev.customTags,
        [story.id]: currentList.filter((t) => t !== tagToRemove),
      },
    }));
  };

  const handleShareOrCopy = async () => {
    const textToShare = `📖 *યોગીજી મહારાજની બોધકથા ${story.id}: ${story.title}*\n\n${story.content.join('\n\n')}\n\n✨ *બોધ / સિદ્ધાંત:* ${story.moral}\n\n(વાંચો "યોગીજી મહારાજની બોધકથાઓ" એપમાં)`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `બોધકથા ${story.id}: ${story.title}`,
          text: textToShare,
        });
        return;
      } catch (_) {}
    }

    // Fallback clipboard copy
    navigator.clipboard.writeText(textToShare);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Text-To-Speech
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    if (isSpeaking && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    // Start fresh narration
    window.speechSynthesis.cancel();
    const fullNarrative = `${story.title}. ${story.content.join('. ')}. બોધ અને સિદ્ધાંત: ${story.moral}`;
    const utterance = new SpeechSynthesisUtterance(fullNarrative);
    
    // Find Gujarati voice or Hindi/Indian voice if available
    const voices = window.speechSynthesis.getVoices();
    const guVoice = voices.find((v) => v.lang.startsWith('gu')) ||
                    voices.find((v) => v.lang.startsWith('hi')) ||
                    voices.find((v) => v.lang.includes('IN'));
    if (guVoice) utterance.voice = guVoice;
    
    utterance.rate = preferences.settings.speechRate || 0.9;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  };

  const handleStopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  // Resolve Category Meta
  const catMeta = CATEGORIES.find((c) => c.id === story.category) || CATEGORIES[1];

  // Theme Styling Classes
  const { theme, fontSize, fontFamily, lineSpacing } = preferences.settings;

  let themeContainerClass = 'bg-stone-50 text-stone-900 border-stone-200';
  let cardClass = 'bg-white border-stone-200/90 shadow-sm';
  let moralBoxClass = 'bg-amber-50/80 border-amber-300/80 text-amber-950';

  if (theme === 'sepia') {
    themeContainerClass = 'bg-[#fcf7ee] text-[#422c1b]';
    cardClass = 'bg-[#fffaf0] border-[#ecdcc3] shadow-sm';
    moralBoxClass = 'bg-[#f6ebd4] border-[#dfc399] text-[#543213]';
  } else if (theme === 'dark') {
    themeContainerClass = 'bg-stone-950 text-stone-100';
    cardClass = 'bg-stone-900 border-stone-800 shadow-md';
    moralBoxClass = 'bg-stone-800/80 border-amber-500/40 text-amber-100';
  } else if (theme === 'night') {
    themeContainerClass = 'bg-[#181410] text-[#f2e6d8]';
    cardClass = 'bg-[#221c16] border-[#382d23] shadow-md';
    moralBoxClass = 'bg-[#2e2319] border-[#664b30] text-[#fbd8a8]';
  }

  // Font Family Class
  let fontFamClass = 'font-["Noto_Sans_Gujarati",sans-serif]';
  if (fontFamily === 'rasa-serif') fontFamClass = 'font-["Rasa",serif]';
  else if (fontFamily === 'system') fontFamClass = 'font-sans';

  // Font Size Class
  let fontSizeClass = 'text-lg sm:text-xl';
  if (fontSize === 'sm') fontSizeClass = 'text-sm sm:text-base';
  else if (fontSize === 'md') fontSizeClass = 'text-base sm:text-lg';
  else if (fontSize === 'lg') fontSizeClass = 'text-lg sm:text-xl';
  else if (fontSize === 'xl') fontSizeClass = 'text-xl sm:text-2xl';
  else if (fontSize === '2xl') fontSizeClass = 'text-2xl sm:text-3xl';

  // Line Spacing Class
  let lineSpacingClass = 'leading-relaxed';
  if (lineSpacing === 'normal') lineSpacingClass = 'leading-normal';
  else if (lineSpacing === 'relaxed') lineSpacingClass = 'leading-relaxed';
  else if (lineSpacing === 'loose') lineSpacingClass = 'leading-loose';

  return (
    <div id="story-reader-view" className={`min-h-[calc(100vh-4rem)] ${themeContainerClass} transition-colors duration-300 pb-20`}>
      {/* Top Floating Control Bar */}
      <div className="sticky top-16 z-30 backdrop-blur-md bg-white/70 dark:bg-stone-900/70 border-b border-stone-200/60 dark:border-stone-800/60 px-3 sm:px-6 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Back & Story Number Navigation */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              id="reader-back-to-list-btn"
              onClick={onBackToList}
              className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="યાદી પર પાછા જાઓ"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">બધી વાર્તાઓ</span>
            </button>

            <span className="text-xs px-2.5 py-1 rounded-md bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold">
              વાર્તા નં. {story.id} / {allStories.length}
            </span>
          </div>

          {/* Quick Reader Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar max-w-full">
            {/* Original Book Page Preview */}
            <button
              id="view-original-page-btn"
              onClick={() => onOpenOriginalPage(story)}
              className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
              title={`મૂળ પુસ્તક પાન ${story.bookPage} જુઓ (Original Page)`}
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Audio Narration Toggle */}
            <button
              id="audio-narrator-btn"
              onClick={handleToggleSpeech}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium ${
                isSpeaking
                  ? 'bg-amber-600 text-white'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
              title={isSpeaking ? (isPaused ? 'ચાલુ રાખો (Resume)' : 'થોભો (Pause)') : 'વાર્તા સાંભળો (Read Aloud)'}
            >
              {isSpeaking ? (isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />) : <Volume2 className="w-4 h-4" />}
            </button>

            {isSpeaking && (
              <button
                id="stop-audio-btn"
                onClick={handleStopSpeech}
                className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                title="ઓડિયો બંધ કરો"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            )}

            {/* Favorite Star Button */}
            <button
              id="toggle-favorite-story-btn"
              onClick={toggleFavorite}
              className={`p-2 rounded-lg transition-all active:scale-90 ${
                isFavorite
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                  : 'text-stone-400 hover:text-amber-500 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
              title={isFavorite ? 'મનપસંદમાંથી દૂર કરો' : 'મનપસંદમાં ઉમેરો (Favorite)'}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-500' : ''}`} />
            </button>

            {/* Mark as Read Toggle */}
            <button
              id="toggle-read-status-btn"
              onClick={toggleReadStatus}
              className={`p-2 rounded-lg transition-all ${
                isRead
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                  : 'text-stone-400 hover:text-emerald-600 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
              title={isRead ? 'વંચાયેલી તરીકે ચિહ્નિત (Mark Unread)' : 'વાંચી લીધું તરીકે ચિહ્નિત કરો (Mark Read)'}
            >
              <CheckCircle2 className={`w-4 h-4 ${isRead ? 'fill-emerald-500 text-white dark:text-stone-900' : ''}`} />
            </button>

            {/* Typography Settings Button */}
            <button
              id="typography-settings-btn"
              onClick={() => setShowTypographyMenu(!showTypographyMenu)}
              className={`p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors ${
                showTypographyMenu ? 'bg-amber-100 dark:bg-stone-800 text-amber-900' : ''
              }`}
              title="અક્ષર અને ફોન્ટ સેટિંગ્સ"
            >
              <Type className="w-4 h-4" />
            </button>

            {/* Personal Notes Trigger */}
            <button
              id="personal-notes-toggle-btn"
              onClick={() => setShowNotesDrawer(!showNotesDrawer)}
              className={`relative p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors ${
                showNotesDrawer ? 'bg-amber-100 dark:bg-stone-800 text-amber-900' : ''
              }`}
              title="નોંધ અને વિચારો (Notes)"
            >
              <MessageSquare className="w-4 h-4" />
              {preferences.notes[story.id] && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </button>

            {/* Share / Copy */}
            <button
              id="share-story-btn"
              onClick={handleShareOrCopy}
              className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
              title="વાર્તા શેર અથવા કોપી કરો"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expandable Typography Toolbar */}
        {showTypographyMenu && (
          <div 
            id="typography-toolbar"
            className="max-w-4xl mx-auto mt-2.5 p-3.5 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {/* Font Size Selector */}
            <div>
              <label className="font-semibold text-stone-500 dark:text-stone-400 block mb-1.5">અક્ષરનું કદ (Font Size)</label>
              <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-700 p-1 rounded-xl">
                {(['sm', 'md', 'lg', 'xl', '2xl'] as FontSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() =>
                      onUpdatePreferences((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, fontSize: size },
                      }))
                    }
                    className={`flex-1 py-1 text-center rounded-lg font-bold transition-all ${
                      fontSize === size
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-300 hover:bg-white/60 dark:hover:bg-stone-600'
                    }`}
                  >
                    {size === 'sm' ? 'S' : size === 'md' ? 'M' : size === 'lg' ? 'L' : size === 'xl' ? 'XL' : '2XL'}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family Selector */}
            <div>
              <label className="font-semibold text-stone-500 dark:text-stone-400 block mb-1.5">ફોન્ટ પ્રકાર (Font Style)</label>
              <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-700 p-1 rounded-xl">
                <button
                  onClick={() =>
                    onUpdatePreferences((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, fontFamily: 'noto-sans' },
                    }))
                  }
                  className={`flex-1 py-1 px-2 rounded-lg transition-all font-['Noto_Sans_Gujarati'] ${
                    fontFamily === 'noto-sans'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-300 hover:bg-white/60'
                  }`}
                >
                  સ્પષ્ટ (Sans)
                </button>
                <button
                  onClick={() =>
                    onUpdatePreferences((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, fontFamily: 'rasa-serif' },
                    }))
                  }
                  className={`flex-1 py-1 px-2 rounded-lg transition-all font-['Rasa'] ${
                    fontFamily === 'rasa-serif'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-300 hover:bg-white/60'
                  }`}
                >
                  શાસ્ત્રીય (Serif)
                </button>
              </div>
            </div>

            {/* Reading Theme Selector */}
            <div>
              <label className="font-semibold text-stone-500 dark:text-stone-400 block mb-1.5">થીમ (Theme)</label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'sepia', label: 'તાંબુ', bg: 'bg-[#fcf7ee] text-[#543213] border-[#dfc399]' },
                  { id: 'light', label: 'શ્વેત', bg: 'bg-white text-stone-900 border-stone-300' },
                  { id: 'dark', label: 'શ્યામ', bg: 'bg-stone-900 text-stone-100 border-stone-700' },
                  { id: 'night', label: 'રાત્રિ', bg: 'bg-[#181410] text-[#fbd8a8] border-[#543b24]' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() =>
                      onUpdatePreferences((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, theme: t.id as ReaderTheme },
                      }))
                    }
                    className={`py-1 px-1 text-center rounded-lg border font-medium text-[11px] transition-all ${t.bg} ${
                      theme === t.id ? 'ring-2 ring-amber-500 font-bold scale-102' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Reading Canvas */}
      <main className="max-w-3xl mx-auto px-3 sm:px-6 pt-4 sm:pt-10">
        {/* Story Card */}
        <article 
          id={`story-article-${story.id}`}
          className={`p-4 sm:p-10 rounded-3xl border transition-all duration-300 ${cardClass}`}
        >
          {/* Header Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-stone-200/70 dark:border-stone-800/70">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${catMeta.bgLight} ${catMeta.bgDark}`}>
                {catMeta.name}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                મૂળ પુસ્તક પાન નં: <strong className="font-semibold text-amber-700 dark:text-amber-300">{story.bookPage}</strong>
              </span>
            </div>

            <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
              <span>અંદાજિત વાંચન સમય: ~{story.estimatedMinutes} મિનિટ</span>
            </div>
          </div>

          {/* Story Title & English Subtitle */}
          <div className="py-6 text-center">
            <div className="text-sm font-bold tracking-widest text-amber-600 dark:text-amber-400 mb-1">
              બોધકથા - {story.id}
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-amber-950 dark:text-amber-100 font-['Noto_Sans_Gujarati']">
              {story.title}
            </h1>
            <div className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 italic">
              {story.titleEnglish}
            </div>
          </div>

          {/* Story Narrative Content */}
          <div className={`space-y-6 sm:space-y-7 ${fontFamClass} ${fontSizeClass} leading-relaxed sm:leading-loose text-stone-900 dark:text-stone-100 tracking-wide`}>
            {story.content.map((paragraph, idx) => (
              <p 
                key={idx} 
                className={idx === 0 ? "first-letter:text-4xl first-letter:font-bold first-letter:text-amber-700 dark:first-letter:text-amber-400 first-letter:mr-2" : ""}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Saakhi / Poetic Verses if available */}
          {story.saakhi && story.saakhi.length > 0 && (
            <div className="my-8 p-5 sm:p-6 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-center">
              <div className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-widest mb-2">
                — સાખી / કીર્તન પંક્તિ —
              </div>
              <div className={`italic font-['Rasa',serif] text-base sm:text-xl text-amber-950 dark:text-amber-100 space-y-1`}>
                {story.saakhi.map((line, sIdx) => (
                  <div key={sIdx}>"{line}"</div>
                ))}
              </div>
            </div>
          )}

          {/* Moral Callout Box (સિદ્ધાંત / બોધ) */}
          <div className={`mt-8 p-5 sm:p-6 rounded-2xl border ${moralBoxClass} transition-all`}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="font-bold text-sm sm:text-base tracking-wide uppercase font-['Noto_Sans_Gujarati']">
                મુખ્ય બોધ અને સિદ્ધાંત (Moral & Key Lesson)
              </h2>
            </div>
            <p className={`text-base sm:text-lg font-medium leading-relaxed ${fontFamClass}`}>
              {story.moral}
            </p>
          </div>

          {/* Footnotes / Glossary if present */}
          {story.footnotes && story.footnotes.length > 0 && (
            <div className="mt-8 pt-4 border-t border-stone-200/80 dark:border-stone-800/80 text-xs text-stone-500 dark:text-stone-400 space-y-1">
              <div className="font-bold text-stone-700 dark:text-stone-300 mb-1">પાદટીપ (Footnotes & Glossary):</div>
              {story.footnotes.map((fn, fIdx) => (
                <div key={fIdx} className="flex gap-2">
                  <span className="font-semibold text-amber-600">{fn.key}:</span>
                  <span>{fn.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tags & Key Characters */}
          <div className="mt-8 pt-6 border-t border-stone-200/70 dark:border-stone-800/70 flex flex-wrap items-center justify-between gap-3">
            {/* Story Tags */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-stone-400 mr-1" />
              {story.tags.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => onOpenTagInExplorer?.(t)}
                  className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-stone-600 dark:text-stone-300 font-medium transition-colors cursor-pointer"
                  title={`#${t} ના ટેગ્સ હબમાં જુઓ`}
                >
                  #{t}
                </button>
              ))}

              {userTags.map((ut, uIdx) => (
                <span
                  key={uIdx}
                  className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1"
                >
                  <button
                    onClick={() => onOpenTagInExplorer?.(ut)}
                    className="hover:underline cursor-pointer flex items-center gap-1"
                    title={`#${ut} ના ટેગ્સ હબમાં જુઓ`}
                  >
                    ⭐ {ut}
                  </button>
                  <button onClick={() => handleRemoveTag(ut)} className="hover:text-rose-500" title="ટેગ દૂર કરો">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {showTagInput ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag(newTagInput)}
                    placeholder="ટેગ ઉમેરો..."
                    className="text-xs px-2 py-0.5 rounded border border-amber-400 bg-white dark:bg-stone-800 focus:outline-none w-24"
                    autoFocus
                  />
                  <button
                    onClick={() => handleAddTag(newTagInput)}
                    className="text-xs p-1 bg-amber-600 text-white rounded"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setShowTagInput(false)}
                    className="text-xs p-1 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowTagInput(true)}
                    className="text-xs px-2 py-0.5 rounded-full border border-dashed border-stone-300 dark:border-stone-700 text-stone-500 hover:border-amber-500 hover:text-amber-600 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>ટેગ ઉમેરો</span>
                  </button>
                  {onOpenTagInExplorer && (
                    <button
                      onClick={() => onOpenTagInExplorer('')}
                      className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-200/80 dark:border-amber-800/60 font-semibold flex items-center gap-1"
                    >
                      <span>ટેગ્સ હબ</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Read / Unread Status Badge button */}
            <button
              onClick={toggleReadStatus}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isRead
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${isRead ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
              <span>{isRead ? 'વાંચી લીધેલ (Completed)' : 'વાંચી લીધું કરો'}</span>
            </button>
          </div>
        </article>

        {/* Bottom Next / Previous Navigation Cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prevStory ? (
            <button
              id="prev-story-nav-btn"
              onClick={() => onSelectStory(prevStory.id)}
              className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all hover:scale-[1.01] ${cardClass}`}
            >
              <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300 shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="text-[11px] text-stone-400 font-semibold uppercase tracking-wider">અગાઉની વાર્તા (Prev)</div>
                <div className="font-bold text-sm sm:text-base text-amber-950 dark:text-amber-100 truncate font-['Noto_Sans_Gujarati']">
                  {prevStory.id}. {prevStory.title}
                </div>
              </div>
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}

          {nextStory ? (
            <button
              id="next-story-nav-btn"
              onClick={() => onSelectStory(nextStory.id)}
              className={`p-4 rounded-2xl border text-right flex items-center justify-end gap-3 transition-all hover:scale-[1.01] sm:ml-auto w-full ${cardClass}`}
            >
              <div className="truncate">
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">આગળની વાર્તા (Next)</div>
                <div className="font-bold text-sm sm:text-base text-amber-950 dark:text-amber-100 truncate font-['Noto_Sans_Gujarati']">
                  {nextStory.id}. {nextStory.title}
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          ) : (
            <div className="p-4 rounded-2xl border text-center text-stone-400 text-xs font-semibold">
              તમે છેલ્લી વાર્તા સુધી પહોંચી ગયા છો! 🎉
            </div>
          )}
        </div>

        {/* Personal Notes Drawer / Section */}
        {showNotesDrawer && (
          <div 
            id="story-notes-panel"
            className={`mt-8 p-6 rounded-3xl border ${cardClass} animate-in fade-in slide-in-from-bottom-3 duration-200`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-base text-amber-950 dark:text-amber-100">
                  આ વાર્તા માટે મારી વ્યક્તિગત નોંધ (Personal Notes & Reflections)
                </h3>
              </div>
              <button
                onClick={() => setShowNotesDrawer(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              id="story-note-textarea"
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="આ વાર્તામાંથી મને શું પ્રેરણા મળી ? તમારો વિચાર અથવા સંકલ્પ અહીં લખો..."
              rows={4}
              className="w-full p-3.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-xs text-stone-400">
                નોંધ આપમેળે લોકલ સ્ટોરેજ અને ક્લાઉડ સિંકમાં સેવ રહેશે.
              </span>
              <button
                id="save-story-note-btn"
                onClick={handleSaveNote}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                નોંધ સેવ કરો
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
