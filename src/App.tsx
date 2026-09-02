import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StoryList } from './components/StoryList';
import { StoryReader } from './components/StoryReader';
import { ProgressDashboard } from './components/ProgressDashboard';
import { TagsExplorer } from './components/TagsExplorer';
import { CloudSyncModal } from './components/CloudSyncModal';
import { InstallPwaModal } from './components/InstallPwaModal';
import { OriginalPageModal } from './components/OriginalPageModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { BODHKATHAO_STORIES } from './data/bodhkathaoData';
import { 
  loadUserPreferences, 
  saveUserPreferences, 
  updateReadingStreak, 
  syncWithCloud 
} from './services/storageService';
import { 
  getCurrentAuthUser, 
  onAuthSessionChange 
} from './services/supabaseService';
import { UserPreferences, Story, AuthUser } from './types';
import { BookOpen, BookMarked, BarChart3, Cloud, Star, User as UserIcon, Tag as TagIcon } from 'lucide-react';

export function App() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadUserPreferences());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'read' | 'tags' | 'progress'>('list');
  const [selectedStoryId, setSelectedStoryId] = useState<number>(() => {
    const initialPrefs = loadUserPreferences();
    return initialPrefs.lastReadStoryId || 1;
  });
  const [selectedTagForExplorer, setSelectedTagForExplorer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [originalPageStory, setOriginalPageStory] = useState<Story | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Initialize and update reading streak & auth session on mount
  useEffect(() => {
    const updated = updateReadingStreak(preferences);
    setPreferences(updated);

    // Check active session from Supabase
    getCurrentAuthUser().then((user) => {
      if (user) {
        setCurrentUser(user);
        setPreferences((prev) => {
          const next = { ...prev, user };
          saveUserPreferences(next);
          return next;
        });
      }
    });

    // Subscribe to auth state changes
    const unsubscribeAuth = onAuthSessionChange((user) => {
      setCurrentUser(user);
      setPreferences((prev) => {
        const next = { ...prev, user: user || null };
        saveUserPreferences(next);
        return next;
      });
      if (user) {
        // Auto sync with cloud on sign in
        syncWithCloud(preferences).catch(() => {});
      }
    });

    // Capture PWA install event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      unsubscribeAuth();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Update preferences helper
  const handleUpdatePreferences = (updater: (prev: UserPreferences) => UserPreferences) => {
    setPreferences((prev) => {
      const next = updater(prev);
      saveUserPreferences(next);
      return next;
    });
  };

  // Direct overwrite (used by sync modal)
  const handleDirectUpdatePreferences = (updated: UserPreferences) => {
    setPreferences(updated);
    saveUserPreferences(updated);
  };

  // Handle selecting a story to read
  const handleSelectStory = (storyId: number) => {
    setSelectedStoryId(storyId);
    handleUpdatePreferences((prev) => ({
      ...prev,
      lastReadStoryId: storyId,
    }));
    setActiveView('read');
  };

  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setPreferences((prev) => {
      const next = { ...prev, user };
      saveUserPreferences(next);
      return next;
    });
    // Trigger background sync
    syncWithCloud(preferences).catch(() => {});
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPreferences((prev) => {
      const next = { ...prev, user: null };
      saveUserPreferences(next);
      return next;
    });
  };

  const handleOpenTagInExplorer = (tag: string) => {
    setSelectedTagForExplorer(tag);
    setActiveView('tags');
  };

  // Current active story
  const currentStory = BODHKATHAO_STORIES.find((s) => s.id === selectedStoryId) || BODHKATHAO_STORIES[0];

  // Dark mode class application on body/html root
  useEffect(() => {
    const root = document.documentElement;
    const isDark = preferences.settings.theme === 'dark' || preferences.settings.theme === 'night';
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [preferences.settings.theme]);

  return (
    <div 
      id="app-root" 
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
        preferences.settings.theme === 'sepia' 
          ? 'bg-[#fcf7ee] text-[#422c1b]' 
          : preferences.settings.theme === 'dark'
          ? 'bg-stone-950 text-stone-100'
          : preferences.settings.theme === 'night'
          ? 'bg-[#181410] text-[#f2e6d8]'
          : 'bg-stone-50 text-stone-900'
      }`}
    >
      {/* Top Navbar */}
      <Navbar
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
        activeView={activeView}
        setActiveView={setActiveView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenSyncModal={() => setShowSyncModal(true)}
        onOpenInstallModal={() => setShowInstallModal(true)}
        onOpenAuthModal={() => {
          setAuthInitialMode('login');
          setShowAuthModal(true);
        }}
        onOpenProfileModal={() => setShowProfileModal(true)}
        currentUser={currentUser}
        isInstallable={Boolean(deferredPrompt)}
        totalStoriesCount={BODHKATHAO_STORIES.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 pb-16 md:pb-6">
        {activeView === 'list' && (
          <StoryList
            stories={BODHKATHAO_STORIES}
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            onSelectStory={handleSelectStory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onOpenTagInExplorer={handleOpenTagInExplorer}
          />
        )}

        {activeView === 'read' && (
          <StoryReader
            story={currentStory}
            allStories={BODHKATHAO_STORIES}
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            onSelectStory={handleSelectStory}
            onBackToList={() => setActiveView('list')}
            onOpenOriginalPage={(s) => setOriginalPageStory(s)}
            onOpenTagInExplorer={handleOpenTagInExplorer}
          />
        )}

        {activeView === 'tags' && (
          <TagsExplorer
            stories={BODHKATHAO_STORIES}
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            onSelectStory={handleSelectStory}
            initialSelectedTag={selectedTagForExplorer}
          />
        )}

        {activeView === 'progress' && (
          <ProgressDashboard
            stories={BODHKATHAO_STORIES}
            preferences={preferences}
            onSelectStory={handleSelectStory}
            onSwitchView={(v) => setActiveView(v)}
          />
        )}
      </div>

      {/* Mobile Bottom Navigation Bar for easy thumb navigation */}
      <div 
        id="mobile-bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 border-t border-stone-200 dark:border-stone-800 backdrop-blur-md md:hidden px-3 py-2 flex items-center justify-around"
      >
        <button
          onClick={() => setActiveView('list')}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
            activeView === 'list' ? 'text-amber-700 dark:text-amber-400' : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>વાર્તાઓ</span>
        </button>

        <button
          onClick={() => setActiveView('read')}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
            activeView === 'read' ? 'text-amber-700 dark:text-amber-400' : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          <BookMarked className="w-5 h-5" />
          <span>વાંચન</span>
        </button>

        <button
          onClick={() => setActiveView('tags')}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
            activeView === 'tags' ? 'text-amber-700 dark:text-amber-400' : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          <TagIcon className="w-5 h-5" />
          <span>ટેગ્સ</span>
        </button>

        <button
          onClick={() => setActiveView('progress')}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
            activeView === 'progress' ? 'text-amber-700 dark:text-amber-400' : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>પ્રગતિ</span>
        </button>

        {currentUser ? (
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex flex-col items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400"
          >
            <div className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'હ'}
            </div>
            <span>પ્રોફાઇલ</span>
          </button>
        ) : (
          <button
            onClick={() => {
              setAuthInitialMode('login');
              setShowAuthModal(true);
            }}
            className="flex flex-col items-center gap-1 text-[11px] font-semibold text-stone-500 dark:text-stone-400"
          >
            <UserIcon className="w-5 h-5" />
            <span>લૉગિન</span>
          </button>
        )}
      </div>

      {/* Authentication Modal (Registration, Login, Password Reset) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authInitialMode}
      />

      {/* User Profile Modal */}
      {currentUser && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={currentUser}
          preferences={preferences}
          onUpdatePreferences={handleDirectUpdatePreferences}
          onLogout={handleLogout}
          totalStoriesCount={BODHKATHAO_STORIES.length}
        />
      )}

      {/* Cloud Sync Modal */}
      <CloudSyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        preferences={preferences}
        onUpdatePreferences={handleDirectUpdatePreferences}
      />

      {/* Install PWA Modal */}
      <InstallPwaModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        deferredPrompt={deferredPrompt}
        onInstallSuccess={() => setDeferredPrompt(null)}
      />

      {/* Original Book Page Modal */}
      <OriginalPageModal
        story={originalPageStory}
        isOpen={Boolean(originalPageStory)}
        onClose={() => setOriginalPageStory(null)}
      />
    </div>
  );
}

export default App;
