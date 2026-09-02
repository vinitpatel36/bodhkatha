import { UserPreferences, ReadingSettings, Bookmark, SyncPayload } from '../types';
import { syncPreferencesToSupabase, loadPreferencesFromSupabase } from './supabaseService';

const STORAGE_KEY = 'bodhkathao_user_preferences_v1';

export const DEFAULT_SETTINGS: ReadingSettings = {
  theme: 'sepia',
  fontSize: 'lg',
  fontFamily: 'noto-sans',
  lineSpacing: 'relaxed',
  autoMarkRead: true,
  speechRate: 0.9,
};

function generateSyncKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BODH-${code}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export function getDefaultPreferences(): UserPreferences {
  return {
    favorites: [],
    readStories: [],
    bookmarks: [],
    notes: {},
    customTags: {},
    lastReadStoryId: 1,
    readingStreak: {
      current: 1,
      best: 1,
      lastDate: getTodayDateString(),
    },
    syncKey: generateSyncKey(),
    lastSyncedAt: null,
    settings: DEFAULT_SETTINGS,
  };
}

export function loadUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const def = getDefaultPreferences();
      saveUserPreferences(def);
      return def;
    }
    const parsed = JSON.parse(raw);
    
    // Ensure all fields exist
    const prefs: UserPreferences = {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      readStories: Array.isArray(parsed.readStories) ? parsed.readStories : [],
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
      notes: typeof parsed.notes === 'object' && parsed.notes !== null ? parsed.notes : {},
      customTags: typeof parsed.customTags === 'object' && parsed.customTags !== null ? parsed.customTags : {},
      lastReadStoryId: typeof parsed.lastReadStoryId === 'number' ? parsed.lastReadStoryId : 1,
      readingStreak: parsed.readingStreak || { current: 1, best: 1, lastDate: getTodayDateString() },
      syncKey: parsed.syncKey || generateSyncKey(),
      lastSyncedAt: parsed.lastSyncedAt || null,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
    };

    // Calculate streak maintenance
    const today = getTodayDateString();
    if (prefs.readingStreak.lastDate !== today) {
      const lastDate = new Date(prefs.readingStreak.lastDate);
      const currentDate = new Date(today);
      const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      
      if (diffDays === 1) {
        // Consecutive day
      } else if (diffDays > 1) {
        // Streak broken
        prefs.readingStreak.current = 1;
      }
    }

    return prefs;
  } catch (err) {
    console.error('Failed to load preferences from localStorage:', err);
    return getDefaultPreferences();
  }
}

export function saveUserPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error('Failed to save preferences to localStorage:', err);
  }
}

export function updateReadingStreak(prefs: UserPreferences): UserPreferences {
  const today = getTodayDateString();
  const streak = { ...prefs.readingStreak };

  if (streak.lastDate === today) {
    return prefs; // Already recorded today
  }

  const lastDate = new Date(streak.lastDate);
  const currentDate = new Date(today);
  const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

  if (diffDays === 1) {
    streak.current += 1;
    if (streak.current > streak.best) {
      streak.best = streak.current;
    }
  } else {
    streak.current = 1;
  }
  streak.lastDate = today;

  const updated = { ...prefs, readingStreak: streak };
  saveUserPreferences(updated);
  return updated;
}

// Remote Cloud & Supabase Sync APIs
export async function syncWithCloud(prefs: UserPreferences, syncKeyOverride?: string): Promise<{ success: boolean; data?: UserPreferences; message: string }> {
  const syncKey = (syncKeyOverride || prefs.syncKey).trim().toUpperCase();
  if (!syncKey) {
    return { success: false, message: 'અમાન્ય સિંક કોડ' };
  }

  // 1. First attempt Supabase Sync
  try {
    const supabasePayload: SyncPayload = {
      syncKey,
      lastUpdated: Date.now(),
      readStoryIds: prefs.readStories,
      favoriteStoryIds: prefs.favorites,
      bookmarks: prefs.bookmarks,
      notes: prefs.notes,
      customTags: prefs.customTags || {},
      lastReadStoryId: prefs.lastReadStoryId,
      readingStreak: prefs.readingStreak,
      settings: prefs.settings,
    };

    const supaRes = await syncPreferencesToSupabase(supabasePayload);
    if (supaRes.success) {
      const updatedPrefs: UserPreferences = {
        ...prefs,
        syncKey,
        lastSyncedAt: Date.now(),
      };
      saveUserPreferences(updatedPrefs);
      return { success: true, data: updatedPrefs, message: 'Supabase ક્લાઉડ સાથે વાંચન ડેટા સફળતાપૂર્વક સિંક થયો!' };
    }
  } catch (supaErr) {
    console.warn('Supabase sync attempt error, falling back to server sync:', supaErr);
  }

  // 2. Server Sync Fallback
  try {
    const payload = {
      syncKey,
      localData: {
        readStoryIds: prefs.readStories,
        favoriteStoryIds: prefs.favorites,
        bookmarks: prefs.bookmarks,
        notes: prefs.notes,
        customTags: prefs.customTags || {},
        lastReadStoryId: prefs.lastReadStoryId,
        readingStreak: prefs.readingStreak,
        settings: prefs.settings,
      },
    };

    const res = await fetch('/api/sync/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const result = await res.json();
    if (result.success && result.mergedData) {
      const merged: SyncPayload = result.mergedData;
      const updatedPrefs: UserPreferences = {
        ...prefs,
        syncKey: merged.syncKey,
        readStories: merged.readStoryIds,
        favorites: merged.favoriteStoryIds,
        bookmarks: merged.bookmarks,
        notes: merged.notes,
        customTags: merged.customTags || prefs.customTags,
        lastReadStoryId: merged.lastReadStoryId,
        readingStreak: merged.readingStreak,
        settings: merged.settings || prefs.settings,
        lastSyncedAt: Date.now(),
      };
      saveUserPreferences(updatedPrefs);
      return { success: true, data: updatedPrefs, message: 'વાંચન ઇતિહાસ અને પસંદગીઓ સફળતાપૂર્વક સિંક થઈ ગઈ!' };
    }

    return { success: false, message: 'Sync failed on server' };
  } catch (err: any) {
    console.error('Cloud sync error:', err);
    return { success: false, message: 'ક્લાઉડ સર્વર સાથે સિંક કરવામાં ભૂલ આવી. ઓફલાઇન ડેટા સુરક્ષિત છે.' };
  }
}

// Export backup to JSON file
export function exportBackupFile(prefs: UserPreferences) {
  const exportData = {
    app: 'Bodhkathao Reader',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    preferences: prefs,
  };
  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bodhkathao-backup-${getTodayDateString()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Import backup from JSON file
export function importBackupFile(file: File): Promise<UserPreferences> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        const imported = parsed.preferences || parsed;
        if (!imported || !Array.isArray(imported.readStories)) {
          throw new Error('અમાન્ય બેકઅપ ફાઈલ');
        }
        const fullPrefs: UserPreferences = {
          ...getDefaultPreferences(),
          ...imported,
          lastSyncedAt: Date.now(),
        };
        saveUserPreferences(fullPrefs);
        resolve(fullPrefs);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('ફાઈલ વાંચવામાં ભૂલ આવી'));
    reader.readAsText(file);
  });
}
