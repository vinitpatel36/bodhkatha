import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Sun, 
  Moon, 
  BookMarked, 
  Cloud, 
  Download, 
  Flame, 
  BarChart3, 
  User as UserIcon,
  LogIn,
  Tag as TagIcon,
  SlidersHorizontal,
  Bookmark as BookmarkIcon,
  X
} from 'lucide-react';
import { UserPreferences, ReaderTheme, AuthUser } from '../types';

interface NavbarProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updater: (prev: UserPreferences) => UserPreferences) => void;
  activeView: 'read' | 'list' | 'tags' | 'progress';
  setActiveView: (view: 'read' | 'list' | 'tags' | 'progress') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenSyncModal: () => void;
  onOpenInstallModal: () => void;
  onOpenAuthModal: () => void;
  onOpenProfileModal: () => void;
  currentUser: AuthUser | null;
  isInstallable: boolean;
  totalStoriesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  preferences,
  onUpdatePreferences,
  activeView,
  setActiveView,
  searchQuery,
  setSearchQuery,
  onOpenSyncModal,
  onOpenInstallModal,
  onOpenAuthModal,
  onOpenProfileModal,
  currentUser,
  isInstallable,
  totalStoriesCount,
}) => {
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const readCount = preferences.readStories.length;
  const progressPercent = Math.round((readCount / totalStoriesCount) * 100);

  const cycleTheme = () => {
    const themes: ReaderTheme[] = ['sepia', 'light', 'dark', 'night'];
    const currentIndex = themes.indexOf(preferences.settings.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    onUpdatePreferences((prev) => ({
      ...prev,
      settings: { ...prev.settings, theme: nextTheme },
    }));
  };

  const currentTheme = preferences.settings.theme;
  const isDark = currentTheme === 'dark' || currentTheme === 'night';

  return (
    <header 
      id="app-header"
      className="sticky top-0 z-40 backdrop-blur-md transition-colors duration-300 border-b border-stone-200/80 dark:border-stone-800/80 bg-amber-50/90 dark:bg-stone-900/90"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <button
            id="brand-logo-btn"
            onClick={() => setActiveView('list')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
            title="મુખ્ય પૃષ્ઠ પર જાઓ"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 flex items-center justify-center shadow-sm shadow-amber-900/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="font-bold text-base sm:text-lg leading-tight text-amber-950 dark:text-amber-100 font-['Noto_Sans_Gujarati']">
                બોધકથાઓ
              </div>
              <div className="text-[11px] text-amber-800/70 dark:text-amber-300/70 hidden sm:block tracking-wide">
                યોગીજી મહારાજની દિવ્ય વાર્તાઓ
              </div>
            </div>
          </button>
        </div>

        {/* Search Bar (Desktop & Expanded Mobile) */}
        <div className="flex-1 max-w-md mx-2 hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
            <input
              id="desktop-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="વાર્તા, વિષય, અથવા પાત્ર શોધો... (Search)"
              className="w-full pl-9 pr-8 py-1.5 text-sm rounded-full border border-stone-200 dark:border-stone-700 bg-white/80 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                title="શોધ સાફ કરો"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Action Controls & Navigation Views */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile Search Toggle */}
          <button
            id="mobile-search-toggle-btn"
            onClick={() => setShowSearchInput(!showSearchInput)}
            className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-amber-100/60 dark:hover:bg-stone-800 md:hidden focus:outline-none"
            aria-label="શોધો"
            title="વાર્તા શોધો"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* View Mode Tabs (Hidden on mobile, present in bottom navigation bar) */}
          <div className="hidden md:flex items-center bg-stone-200/60 dark:bg-stone-800 p-0.5 rounded-lg text-xs font-medium">
            <button
              id="view-list-btn"
              onClick={() => setActiveView('list')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                activeView === 'list'
                  ? 'bg-white dark:bg-stone-700 text-amber-900 dark:text-amber-200 shadow-sm font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
              title="બધી વાર્તાઓ"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">યાદી</span>
            </button>

            <button
              id="view-read-btn"
              onClick={() => setActiveView('read')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                activeView === 'read'
                  ? 'bg-white dark:bg-stone-700 text-amber-900 dark:text-amber-200 shadow-sm font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
              title="વાંચન મોડ"
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">વાંચન</span>
            </button>

            <button
              id="view-tags-btn"
              onClick={() => setActiveView('tags')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                activeView === 'tags'
                  ? 'bg-white dark:bg-stone-700 text-amber-900 dark:text-amber-200 shadow-sm font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
              title="ટેગ્સ હબ (વિષયવાર કથાઓ)"
            >
              <TagIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ટેગ્સ</span>
            </button>

            <button
              id="view-progress-btn"
              onClick={() => setActiveView('progress')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                activeView === 'progress'
                  ? 'bg-white dark:bg-stone-700 text-amber-900 dark:text-amber-200 shadow-sm font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
              title="પ્રગતિ અને આંકડા"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">પ્રગતિ</span>
            </button>
          </div>

          {/* Reading Streak Indicator */}
          <div 
            className="hidden lg:flex items-center gap-1 px-2.5 py-1 bg-amber-100/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-full text-xs font-semibold"
            title={`દૈનિક વાંચન સ્ટ્રીક: ${preferences.readingStreak.current} દિવસ`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-500/20 animate-pulse" />
            <span>{preferences.readingStreak.current} દી'</span>
          </div>

          {/* Cloud Sync Button */}
          <button
            id="cloud-sync-btn"
            onClick={onOpenSyncModal}
            className="relative p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-amber-100/60 dark:hover:bg-stone-800 transition-colors focus:outline-none"
            title="ડિવાઇસ સિંક (Cloud Sync)"
          >
            <Cloud className="w-5 h-5" />
            {preferences.lastSyncedAt && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-stone-900" />
            )}
          </button>

          {/* Theme Switcher */}
          <button
            id="theme-toggle-btn"
            onClick={cycleTheme}
            className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-amber-100/60 dark:hover:bg-stone-800 transition-colors focus:outline-none"
            title={`થીમ બદલો (હાલ: ${currentTheme})`}
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-amber-800" />}
          </button>

          {/* User Profile / Auth Button */}
          {currentUser ? (
            <button
              id="user-profile-btn"
              onClick={onOpenProfileModal}
              className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200/80 dark:hover:bg-amber-900/60 border border-amber-300/80 dark:border-amber-800/80 text-amber-950 dark:text-amber-100 transition-all active:scale-95"
              title={`${currentUser.name || currentUser.email} ની પ્રોફાઇલ`}
            >
              <div className="w-6 h-6 rounded-lg bg-amber-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'હ'}
              </div>
              <span className="text-xs font-semibold hidden md:inline max-w-[90px] truncate">
                {currentUser.name || currentUser.email.split('@')[0]}
              </span>
            </button>
          ) : (
            <button
              id="login-modal-btn"
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
              title="લૉગિન / રજિસ્ટર કરો"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>લૉગિન</span>
            </button>
          )}

          {/* Install PWA / Add to Home Screen Button */}
          <button
            id="pwa-install-nav-btn"
            onClick={onOpenInstallModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-medium border border-stone-200 dark:border-stone-700 shadow-xs transition-all active:scale-95"
            title="હોમ સ્ક્રીન પર સેવ કરો (Install App)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">એપ સેવ</span>
          </button>
        </div>
      </div>

      {/* Expanded Mobile Search Input */}
      {showSearchInput && (
        <div className="p-3 bg-white/95 dark:bg-stone-900/95 border-t border-stone-200 dark:border-stone-800 md:hidden animate-in slide-in-from-top-2 duration-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              id="mobile-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="વાર્તા, વિષય, અથવા પાત્ર શોધો..."
              autoFocus
              className="w-full pl-9 pr-9 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
