import React from 'react';
import { 
  BarChart3, 
  Flame, 
  CheckCircle2, 
  BookOpen, 
  Star, 
  Clock, 
  Award, 
  Sparkles, 
  Calendar, 
  BookMarked,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { Story, UserPreferences } from '../types';
import { CATEGORIES } from '../data/categories';

interface ProgressDashboardProps {
  stories: Story[];
  preferences: UserPreferences;
  onSelectStory: (storyId: number) => void;
  onSwitchView: (view: 'read' | 'list') => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  stories,
  preferences,
  onSelectStory,
  onSwitchView,
}) => {
  const totalStories = stories.length;
  const readCount = preferences.readStories.length;
  const favoritesCount = preferences.favorites.length;
  const notesCount = Object.keys(preferences.notes).filter((k) => Boolean(preferences.notes[Number(k)])).length;
  const percentComplete = totalStories > 0 ? Math.round((readCount / totalStories) * 100) : 0;
  
  // Total reading time estimation (~2.5 mins per story)
  const totalMinutesRead = readCount * 2.5;
  const hoursRead = (totalMinutesRead / 60).toFixed(1);

  // Favorite stories list
  const favoriteStories = stories.filter((s) => preferences.favorites.includes(s.id));
  
  // Stories with notes
  const noteStories = stories.filter((s) => Boolean(preferences.notes[s.id]));

  return (
    <div id="progress-dashboard-view" className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-amber-950 dark:text-amber-100 font-['Noto_Sans_Gujarati']">
            વાંચન પ્રગતિ અને સિદ્ધિઓ (Reading Progress & Stats)
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            યોગીજી મહારાજની બોધકથાઓનું તમારું વાંચન વિશ્લેષણ અને દૈનિક લક્ષ્યો.
          </p>
        </div>

        <button
          onClick={() => onSelectStory(preferences.lastReadStoryId || 1)}
          className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-2xl text-xs font-bold shadow-md flex items-center gap-2 self-start active:scale-95 transition-all"
        >
          <BookMarked className="w-4 h-4" />
          <span>વાંચન ચાલુ રાખો (Resume)</span>
        </button>
      </div>

      {/* Hero Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Completion Percentage */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">વાંચન પૂર્ણ</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-amber-900 dark:text-amber-200">
              {percentComplete}%
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {readCount} / {totalStories} વાર્તાઓ પૂર્ણ
            </div>
          </div>
          <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-amber-700 h-full rounded-full transition-all duration-500" 
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>

        {/* Daily Reading Streak */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">વાંચન સ્ટ્રીક</span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-300 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-orange-500/20" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {preferences.readingStreak.current} દી'
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              સૌથી શ્રેષ્ઠ સ્ટ્રીક: {preferences.readingStreak.best} દિવસ
            </div>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            નિયમિત વાંચનથી અંતઃશુદ્ધિ થાય છે
          </div>
        </div>

        {/* Favorites Count */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">મનપસંદ વાર્તાઓ</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-stone-900 dark:text-stone-100">
              {favoritesCount}
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              તારાઓ વડે ચિહ્નિત વાર્તાઓ
            </div>
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
            ઝડપી પુનરાવર્તન માટે ઉપયોગી
          </div>
        </div>

        {/* Total Time Spent */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">વાંચન સમય</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-stone-900 dark:text-stone-100">
              {hoursRead} <span className="text-base font-normal text-stone-500">કલાક</span>
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              ~{Math.round(totalMinutesRead)} મિનિટનો સત્સંગ લાભ
            </div>
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
            {notesCount} વાર્તાઓમાં વ્યક્તિગત નોંધ
          </div>
        </div>
      </div>

      {/* Category Progress Breakdown */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-['Noto_Sans_Gujarati']">
            વિષયવાર વાંચન સ્થિતિ (Category Breakdown)
          </h2>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            બધા સદ્ગુણોનું સંતુલન
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
            const catStories = stories.filter((s) => s.category === cat.id);
            const catRead = catStories.filter((s) => preferences.readStories.includes(s.id)).length;
            const catPct = catStories.length > 0 ? Math.round((catRead / catStories.length) * 100) : 0;

            return (
              <div 
                key={cat.id} 
                className="p-4 rounded-2xl border border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${cat.bgLight} ${cat.bgDark}`}>
                    {cat.name}
                  </span>
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    {catRead} / {catStories.length} ({catPct}%)
                  </span>
                </div>
                <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-amber-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${catPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tagged Favorites Quick Carousel */}
      {favoriteStories.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-['Noto_Sans_Gujarati'] flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>મારી મનપસંદ વાર્તાઓ (Saved Favorites)</span>
            </h2>
            <button
              onClick={() => onSwitchView('list')}
              className="text-xs text-amber-700 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>બધી જુઓ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteStories.slice(0, 6).map((story) => (
              <div
                key={story.id}
                onClick={() => onSelectStory(story.id)}
                className="p-4 rounded-2xl border border-amber-200/80 dark:border-stone-700 bg-amber-50/40 dark:bg-stone-900 hover:border-amber-500 cursor-pointer transition-all shadow-xs"
              >
                <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-1">
                  વાર્તા નં. {story.id} • પાન {story.bookPage}
                </div>
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-['Noto_Sans_Gujarati']">
                  {story.title}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 mt-1">
                  {story.moral}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stories with Notes */}
      {noteStories.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-['Noto_Sans_Gujarati'] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-600" />
            <span>મારી વ્યક્તિગત નોંધો (Notes & Reflections)</span>
          </h2>

          <div className="space-y-3">
            {noteStories.map((story) => (
              <div
                key={story.id}
                onClick={() => onSelectStory(story.id)}
                className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-amber-400 cursor-pointer transition-all shadow-xs"
              >
                <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1">
                  <span>વાર્તા {story.id}: {story.title}</span>
                  <span className="text-stone-400">પાન નં. {story.bookPage}</span>
                </div>
                <p className="text-xs text-stone-700 dark:text-stone-200 italic bg-amber-50 dark:bg-stone-800 p-2.5 rounded-xl border border-amber-100 dark:border-stone-700">
                  "{preferences.notes[story.id]}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
