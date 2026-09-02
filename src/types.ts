export interface Story {
  id: number;
  title: string;
  titleEnglish: string;
  bookPage: number;
  category: string;
  content: string[];
  moral: string;
  saakhi?: string[];
  footnotes?: Array<{ key: string; text: string }>;
  estimatedMinutes: number;
  keyCharacters?: string[];
  tags: string[];
}

export type ReaderTheme = 'light' | 'sepia' | 'dark' | 'night';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type FontStyle = 'noto-sans' | 'rasa-serif' | 'system';
export type LineHeight = 'normal' | 'relaxed' | 'loose';

export interface ReadingSettings {
  theme: ReaderTheme;
  fontSize: FontSize;
  fontFamily: FontStyle;
  lineSpacing: LineHeight;
  autoMarkRead: boolean;
  speechRate: number;
}

export interface Bookmark {
  storyId: number;
  createdAt: number;
  note?: string;
}

export interface ReadingStreak {
  current: number;
  best: number;
  lastDate: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
  avatarUrl?: string;
}

export interface CommunityTagItem {
  tag: string;
  count: number;
  storyIds: number[];
  isCustom?: boolean;
}

export interface UserPreferences {
  favorites: number[];
  readStories: number[];
  bookmarks: Bookmark[];
  notes: Record<number, string>;
  customTags: Record<number, string[]>;
  lastReadStoryId: number;
  readingStreak: ReadingStreak;
  syncKey: string;
  lastSyncedAt: number | null;
  settings: ReadingSettings;
  user?: AuthUser | null;
}

export interface SyncPayload {
  syncKey: string;
  lastUpdated: number;
  readStoryIds: number[];
  favoriteStoryIds: number[];
  bookmarks: Bookmark[];
  notes: Record<number, string>;
  customTags?: Record<number, string[]>;
  lastReadStoryId: number;
  readingStreak: ReadingStreak;
  settings: ReadingSettings;
}
