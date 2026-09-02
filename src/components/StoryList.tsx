import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Star, 
  CheckCircle2, 
  BookOpen, 
  LayoutGrid, 
  List, 
  SlidersHorizontal, 
  Sparkles, 
  ArrowUpDown, 
  BookMarked, 
  Clock, 
  X,
  Filter,
  Flame,
  MessageSquare,
  Tag as TagIcon,
  ArrowRight
} from 'lucide-react';
import { Story, UserPreferences } from '../types';
import { CATEGORIES } from '../data/categories';

interface StoryListProps {
  stories: Story[];
  preferences: UserPreferences;
  onUpdatePreferences: (updater: (prev: UserPreferences) => UserPreferences) => void;
  onSelectStory: (storyId: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenTagInExplorer?: (tag: string) => void;
}

export const StoryList: React.FC<StoryListProps> = ({
  stories,
  preferences,
  onUpdatePreferences,
  onSelectStory,
  searchQuery,
  setSearchQuery,
  onOpenTagInExplorer,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [filterReadStatus, setFilterReadStatus] = useState<'all' | 'unread' | 'read' | 'favorites'>('all');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'number-asc' | 'number-desc' | 'time' | 'title'>('number-asc');
  const [jumpNumberInput, setJumpNumberInput] = useState('');

  // Quick category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: stories.length };
    CATEGORIES.forEach((c) => {
      if (c.id !== 'all') {
        counts[c.id] = stories.filter((s) => s.category === c.id).length;
      }
    });
    return counts;
  }, [stories]);

  // Distinct tags list from user and stories
  const popularTags = useMemo(() => {
    const counts: Record<string, number> = {};
    stories.forEach((s) => {
      s.tags.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
      const custom = preferences.customTags?.[s.id];
      if (custom && Array.isArray(custom)) {
        custom.forEach((t) => {
          counts[t] = (counts[t] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }, [stories, preferences.customTags]);

  // Filter and search logic
  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      // Category filter
      if (selectedCategory !== 'all' && story.category !== selectedCategory) {
        return false;
      }

      // Tag filter
      if (selectedTagFilter) {
        const storyCustomTags = preferences.customTags?.[story.id] || [];
        const hasStoryTag = story.tags.includes(selectedTagFilter);
        const hasCustomTag = storyCustomTags.includes(selectedTagFilter);
        if (!hasStoryTag && !hasCustomTag) {
          return false;
        }
      }

      // Read/Favorite status filter
      if (filterReadStatus === 'favorites' && !preferences.favorites.includes(story.id)) {
        return false;
      }
      if (filterReadStatus === 'read' && !preferences.readStories.includes(story.id)) {
        return false;
      }
      if (filterReadStatus === 'unread' && preferences.readStories.includes(story.id)) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const numMatch = String(story.id) === q || String(story.bookPage) === q;
        const titleMatch = story.title.toLowerCase().includes(q) || story.titleEnglish.toLowerCase().includes(q);
        const moralMatch = story.moral.toLowerCase().includes(q);
        const tagMatch = story.tags.some((t) => t.toLowerCase().includes(q));
        const customTagMatch = (preferences.customTags?.[story.id] || []).some((t) => t.toLowerCase().includes(q));
        const characterMatch = story.keyCharacters?.some((c) => c.toLowerCase().includes(q));
        const contentMatch = story.content.some((p) => p.toLowerCase().includes(q));
        
        return numMatch || titleMatch || moralMatch || tagMatch || customTagMatch || characterMatch || contentMatch;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'number-asc') return a.id - b.id;
      if (sortBy === 'number-desc') return b.id - a.id;
      if (sortBy === 'time') return a.estimatedMinutes - b.estimatedMinutes;
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'gu');
      return 0;
    });
  }, [stories, selectedCategory, selectedTagFilter, filterReadStatus, searchQuery, sortBy, preferences]);

  const toggleFavorite = (e: React.MouseEvent, storyId: number) => {
    e.stopPropagation();
    const isFav = preferences.favorites.includes(storyId);
    const nextFavorites = isFav
      ? preferences.favorites.filter((id) => id !== storyId)
      : [...preferences.favorites, storyId];

    onUpdatePreferences((prev) => ({
      ...prev,
      favorites: nextFavorites,
    }));
  };

  const toggleRead = (e: React.MouseEvent, storyId: number) => {
    e.stopPropagation();
    const isR = preferences.readStories.includes(storyId);
    const nextRead = isR
      ? preferences.readStories.filter((id) => id !== storyId)
      : [...preferences.readStories, storyId];

    onUpdatePreferences((prev) => ({
      ...prev,
      readStories: nextRead,
      lastReadStoryId: storyId,
    }));
  };

  const handleJumpToStory = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumpNumberInput.trim(), 10);
    if (!isNaN(num)) {
      const found = stories.find((s) => s.id === num);
      if (found) {
        onSelectStory(found.id);
        setJumpNumberInput('');
      } else if (num >= 1 && num <= stories.length) {
        onSelectStory(num);
        setJumpNumberInput('');
      }
    }
  };


  return (
    <div id="story-list-container" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Welcome Banner & Reading Resume Bar */}
      <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 text-amber-50 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-600/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -top-12 w-48 h-48 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900/60 border border-amber-500/30 text-amber-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>યોગીજી મહારાજની બોધકથાઓ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-['Noto_Sans_Gujarati']">
              અમૃતવાણી બોધકથાઓનો દિવ્ય ખજાનો
            </h1>
            <p className="text-amber-200/85 text-xs sm:text-sm leading-relaxed">
              જીવનમાં ભક્તિ, નમ્રતા, સત્સંગ અને સદાચારના સંસ્કારો સીંચતી પરમ પૂજ્ય યોગીજી મહારાજના મુખારવિંદેથી નીકળેલી પ્રાસાદિક વાર્તાઓ.
            </p>
          </div>

          {/* Quick Continue Reading Button */}
          <div className="shrink-0 bg-amber-950/50 backdrop-blur-sm p-4 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-start gap-3">
            <div>
              <div className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider">છેલ્લે વાંચેલી વાર્તા</div>
              <div className="font-bold text-sm text-white truncate max-w-[200px] font-['Noto_Sans_Gujarati']">
                {stories.find((s) => s.id === preferences.lastReadStoryId)?.title || stories[0]?.title}
              </div>
            </div>
            <button
              id="resume-reading-btn"
              onClick={() => onSelectStory(preferences.lastReadStoryId || 1)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              <BookMarked className="w-4 h-4" />
              <span>વાંચન ચાલુ રાખો</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="space-y-4">
        {/* Status Filters & Jump to Story */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              id="filter-all-btn"
              onClick={() => setFilterReadStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                filterReadStatus === 'all'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-50'
              }`}
            >
              બધી ({stories.length})
            </button>

            <button
              id="filter-favorites-btn"
              onClick={() => setFilterReadStatus('favorites')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1 ${
                filterReadStatus === 'favorites'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-800 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-50'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>મનપસંદ ({preferences.favorites.length})</span>
            </button>

            <button
              id="filter-unread-btn"
              onClick={() => setFilterReadStatus('unread')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                filterReadStatus === 'unread'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-50'
              }`}
            >
              બાકી વાંચન ({stories.length - preferences.readStories.length})
            </button>

            <button
              id="filter-read-btn"
              onClick={() => setFilterReadStatus('read')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1 ${
                filterReadStatus === 'read'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>વંચાયેલ ({preferences.readStories.length})</span>
            </button>
          </div>

          {/* Quick Jump & View Toggle */}
          <div className="flex items-center gap-2">
            <form onSubmit={handleJumpToStory} className="flex items-center">
              <input
                id="jump-to-story-input"
                type="number"
                min="1"
                max="469"
                value={jumpNumberInput}
                onChange={(e) => setJumpNumberInput(e.target.value)}
                placeholder="વાર્તા નં. (1-469)"
                className="w-28 px-2.5 py-1.5 text-xs rounded-l-xl border border-r-0 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-r-xl"
              >
                જાઓ
              </button>
            </form>

            <div className="flex items-center bg-stone-200/70 dark:bg-stone-800 p-1 rounded-xl">
              <button
                onClick={() => setViewLayout('grid')}
                className={`p-1 rounded-lg transition-all ${
                  viewLayout === 'grid'
                    ? 'bg-white dark:bg-stone-700 text-amber-800 dark:text-amber-200 shadow-xs'
                    : 'text-stone-500'
                }`}
                title="ગ્રીડ વ્યૂ"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewLayout('list')}
                className={`p-1 rounded-lg transition-all ${
                  viewLayout === 'list'
                    ? 'bg-white dark:bg-stone-700 text-amber-800 dark:text-amber-200 shadow-xs'
                    : 'text-stone-500'
                }`}
                title="યાદી વ્યૂ"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-amber-900 text-white border-amber-900 shadow-xs'
                    : 'bg-white/80 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-400'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-amber-700 text-white' : 'bg-stone-100 dark:bg-stone-700 text-stone-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Tag Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs">
          <span className="text-stone-400 font-semibold flex items-center gap-1 shrink-0 text-[11px]">
            <TagIcon className="w-3 h-3 text-amber-600" /> ટેગ્સ:
          </span>

          {selectedTagFilter && (
            <button
              onClick={() => setSelectedTagFilter(null)}
              className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-semibold flex items-center gap-1 shrink-0 shadow-xs"
            >
              <span>#{selectedTagFilter}</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {popularTags.slice(0, 7).map((tag) => {
            if (tag === selectedTagFilter) return null;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTagFilter(tag)}
                className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-950/50 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700/80 font-medium shrink-0 transition-colors"
              >
                #{tag}
              </button>
            );
          })}

          {onOpenTagInExplorer && (
            <button
              onClick={() => onOpenTagInExplorer('')}
              className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800/50 font-semibold shrink-0 transition-colors flex items-center gap-1"
            >
              <span>બધા ટેગ્સ હબ</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Indicators / Search Summary */}
      {(searchQuery || selectedCategory !== 'all' || selectedTagFilter || filterReadStatus !== 'all') && (
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/60 px-4 py-2 rounded-xl">
          <div>
            મળી આવેલ વાર્તાઓ: <strong className="text-amber-700 dark:text-amber-300 font-bold">{filteredStories.length}</strong>
            {searchQuery && <span> • શોધ: "{searchQuery}"</span>}
            {selectedTagFilter && <span> • ટેગ: "#{selectedTagFilter}"</span>}
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedTagFilter(null);
              setFilterReadStatus('all');
            }}
            className="text-amber-700 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>ફિલ્ટર સાફ કરો</span>
          </button>
        </div>
      )}

      {/* Stories Grid / List */}
      {filteredStories.length > 0 ? (
        <div className={viewLayout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' : 'space-y-3'}>
          {filteredStories.map((story) => {
            const isFav = preferences.favorites.includes(story.id);
            const isR = preferences.readStories.includes(story.id);
            const catMeta = CATEGORIES.find((c) => c.id === story.category) || CATEGORIES[1];
            const hasNote = Boolean(preferences.notes[story.id]);
            const storyCustomTags = preferences.customTags?.[story.id] || [];
            const allStoryTags = Array.from(new Set([...story.tags, ...storyCustomTags]));

            if (viewLayout === 'list') {
              return (
                <div
                  key={story.id}
                  id={`story-row-${story.id}`}
                  onClick={() => onSelectStory(story.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md flex items-center justify-between gap-4 ${
                    isR
                      ? 'bg-white/70 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 opacity-90'
                      : 'bg-white dark:bg-stone-900 border-amber-200/70 dark:border-stone-700 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      isR 
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' 
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200'
                    }`}>
                      {story.id}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-base text-stone-900 dark:text-stone-100 truncate font-['Noto_Sans_Gujarati']">
                          {story.title}
                        </h2>
                        {hasNote && <MessageSquare className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                        <span>{story.titleEnglish} • પાન: {story.bookPage}</span>
                        {allStoryTags.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTagFilter(allStoryTags[0]);
                            }}
                            className="hidden sm:inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-medium cursor-pointer"
                            title={`#${allStoryTags[0]} વાળી વાર્તાઓ જુઓ`}
                          >
                            • #{allStoryTags[0]}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => toggleFavorite(e, story.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isFav ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' : 'text-stone-400 hover:text-amber-500'
                      }`}
                      title={isFav ? 'મનપસંદમાંથી દૂર કરો' : 'મનપસંદમાં ઉમેરો'}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => toggleRead(e, story.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isR ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : 'text-stone-400 hover:text-emerald-600'
                      }`}
                      title={isR ? 'વંચાયેલ તરીકે ચિહ્નિત' : 'વાંચી લીધું કરો'}
                    >
                      <CheckCircle2 className={`w-4 h-4 ${isR ? 'fill-emerald-500 text-white dark:text-stone-900' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={story.id}
                id={`story-card-${story.id}`}
                onClick={() => onSelectStory(story.id)}
                className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between group hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-lg hover:-translate-y-0.5 ${
                  isR
                    ? 'bg-white/80 dark:bg-stone-900/60 border-stone-200/80 dark:border-stone-800'
                    : 'bg-white dark:bg-stone-900 border-amber-200/80 dark:border-stone-700 shadow-xs'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${catMeta.bgLight} ${catMeta.bgDark}`}>
                        {catMeta.name}
                      </span>
                      <span className="text-[11px] text-stone-400 font-medium">
                        પાન {story.bookPage}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => toggleFavorite(e, story.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isFav ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' : 'text-stone-400 hover:text-amber-500'
                        }`}
                        title={isFav ? 'મનપસંદ' : 'મનપસંદમાં ઉમેરો'}
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500' : ''}`} />
                      </button>

                      <button
                        onClick={(e) => toggleRead(e, story.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isR ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : 'text-stone-400 hover:text-emerald-600'
                        }`}
                        title={isR ? 'વંચાયેલ' : 'વાંચી લીધું કરો'}
                      >
                        <CheckCircle2 className={`w-4 h-4 ${isR ? 'fill-emerald-500 text-white dark:text-stone-900' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Story Title */}
                  <div className="mb-2">
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-0.5">
                      વાર્તા {story.id}
                    </div>
                    <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors font-['Noto_Sans_Gujarati'] leading-snug">
                      {story.title}
                    </h2>
                    <div className="text-xs text-stone-500 dark:text-stone-400 italic">
                      {story.titleEnglish}
                    </div>
                  </div>

                  {/* Story Snippet */}
                  <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-3 leading-relaxed mb-3">
                    {story.content[0]}
                  </p>

                  {/* Story Tags */}
                  {allStoryTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      {allStoryTags.slice(0, 3).map((tag) => (
                        <button
                          key={tag}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTagFilter(tag);
                          }}
                          className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-stone-600 dark:text-stone-300 text-[11px] font-medium border border-stone-200/80 dark:border-stone-700/80 transition-colors flex items-center gap-1"
                          title={`#${tag} વાળી વાર્તાઓ જુઓ`}
                        >
                          <TagIcon className="w-2.5 h-2.5 text-amber-600" />
                          <span>{tag}</span>
                        </button>
                      ))}
                      {allStoryTags.length > 3 && (
                        <span className="text-[10px] text-stone-400 font-medium">
                          +{allStoryTags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Moral Snippet Callout & Footer */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                  <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300 font-medium">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate max-w-[170px]">{story.moral}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>~{story.estimatedMinutes} મિ.</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
          <BookOpen className="w-12 h-12 mx-auto text-amber-600/40 mb-3" />
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-['Noto_Sans_Gujarati']">
            કોઈ વાર્તા મળી નથી
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
            તમે આપેલ શોધ અથવા ફિલ્ટર મુજબ વાર્તાઓ ઉપલબ્ધ નથી. કૃપા કરીને અન્ય કીવર્ડ અજમાવો.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setFilterReadStatus('all');
            }}
            className="mt-4 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-xl"
          >
            બધી વાર્તાઓ બતાવો
          </button>
        </div>
      )}
    </div>
  );
};
