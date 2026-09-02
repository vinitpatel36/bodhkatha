import { createClient, SupabaseClient, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { Story, UserPreferences, SyncPayload, AuthUser } from '../types';
import { ALL_469_BODHKATHAO_STORIES } from '../data/allStoriesData';

// Provided Supabase configuration with environment variable support
const metaEnv = (import.meta as any).env || {};

export const DEFAULT_SUPABASE_URL = 
  metaEnv.NEXT_PUBLIC_SUPABASE_URL || 
  metaEnv.VITE_SUPABASE_URL || 
  'https://xkdoanzrjibhlujdntih.supabase.co';

export const DEFAULT_SUPABASE_ANON_KEY = 
  metaEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  metaEnv.VITE_SUPABASE_ANON_KEY || 
  'sb_publishable_Kdw-_cKJOEUiPQXcVkbdyw_vJkl9Na9';


let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  }
  return supabaseClient;
}

export interface SupabaseStatus {
  connected: boolean;
  url: string;
  hasStoriesTable: boolean;
  hasSyncTable: boolean;
  storiesCount: number;
  message: string;
}

/**
 * Test connectivity to Supabase and check if tables exist
 */
export async function testSupabaseConnection(): Promise<SupabaseStatus> {
  const client = getSupabaseClient();
  const result: SupabaseStatus = {
    connected: false,
    url: DEFAULT_SUPABASE_URL,
    hasStoriesTable: false,
    hasSyncTable: false,
    storiesCount: 0,
    message: '',
  };

  try {
    // Check if client is initialized
    if (!DEFAULT_SUPABASE_URL || !DEFAULT_SUPABASE_ANON_KEY) {
      result.message = 'Supabase credentials missing';
      return result;
    }

    result.connected = true;

    // Check stories table
    const { data: stories, error: storiesErr } = await client
      .from('stories')
      .select('id', { count: 'exact' })
      .limit(1);

    if (!storiesErr) {
      result.hasStoriesTable = true;
      const { count } = await client.from('stories').select('*', { count: 'exact', head: true });
      result.storiesCount = count || 0;
    }

    // Check user sync table
    const { error: syncErr } = await client
      .from('bodhkathao_sync')
      .select('sync_key')
      .limit(1);

    if (!syncErr) {
      result.hasSyncTable = true;
    }

    result.message = 'Supabase connected successfully!';
    return result;
  } catch (err: any) {
    result.message = err?.message || 'Connection check failed';
    return result;
  }
}

/**
 * Fetch stories from Supabase if table exists, otherwise return the complete bundled 469 stories
 */
export async function fetchAllStories(): Promise<Story[]> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('stories')
      .select('*')
      .order('id', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      // Map Supabase rows to Story type
      return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        titleEnglish: row.title_english || row.titleEnglish || '',
        bookPage: row.book_page || row.bookPage || 1,
        category: row.category || 'bhakti',
        content: Array.isArray(row.content) ? row.content : (typeof row.content === 'string' ? JSON.parse(row.content) : []),
        moral: row.moral || '',
        saakhi: Array.isArray(row.saakhi) ? row.saakhi : undefined,
        footnotes: Array.isArray(row.footnotes) ? row.footnotes : undefined,
        estimatedMinutes: row.estimated_minutes || row.estimatedMinutes || 2,
        keyCharacters: Array.isArray(row.key_characters) ? row.key_characters : row.keyCharacters,
        tags: Array.isArray(row.tags) ? row.tags : [],
      }));
    }
  } catch (err) {
    console.warn('Falling back to bundled 469 stories:', err);
  }

  return ALL_469_BODHKATHAO_STORIES;
}

/**
 * Save / Merge user reading state to Supabase
 */
export async function syncPreferencesToSupabase(payload: SyncPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseClient();
    const cleanKey = payload.syncKey.trim().toUpperCase();

    const record = {
      sync_key: cleanKey,
      last_updated: payload.lastUpdated,
      read_story_ids: payload.readStoryIds,
      favorite_story_ids: payload.favoriteStoryIds,
      bookmarks: payload.bookmarks,
      notes: payload.notes,
      custom_tags: payload.customTags || {},
      last_read_story_id: payload.lastReadStoryId,
      reading_streak: payload.readingStreak,
      settings: payload.settings,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('bodhkathao_sync')
      .upsert(record, { onConflict: 'sync_key' });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Supabase sync failed' };
  }
}

/**
 * Load preferences from Supabase by sync key
 */
export async function loadPreferencesFromSupabase(syncKey: string): Promise<{ success: boolean; data?: SyncPayload; error?: string }> {
  try {
    const client = getSupabaseClient();
    const cleanKey = syncKey.trim().toUpperCase();

    const { data, error } = await client
      .from('bodhkathao_sync')
      .select('*')
      .eq('sync_key', cleanKey)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'No synced data found for this key' };
    }

    const payload: SyncPayload = {
      syncKey: data.sync_key,
      lastUpdated: data.last_updated || Date.now(),
      readStoryIds: data.read_story_ids || [],
      favoriteStoryIds: data.favorite_story_ids || [],
      bookmarks: data.bookmarks || [],
      notes: data.notes || {},
      customTags: data.custom_tags || {},
      lastReadStoryId: data.last_read_story_id || 1,
      readingStreak: data.reading_streak || { current: 1, best: 1, lastDate: new Date().toISOString().split('T')[0] },
      settings: data.settings || {},
    };

    return { success: true, data: payload };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Supabase load failed' };
  }
}

/**
 * Fetch anonymous aggregate community tags across all stories
 * STRICT PRIVACY MANDATE: NEVER returns or displays which user created which tag!
 */
export async function fetchAnonymousCommunityTags(allStories: Story[]): Promise<Record<string, number[]>> {
  const tagMap: Record<string, Set<number>> = {};

  // 1. First seed with all book / curated tags from all 469 stories
  allStories.forEach((story) => {
    if (Array.isArray(story.tags)) {
      story.tags.forEach((tag) => {
        const clean = tag.trim();
        if (clean) {
          if (!tagMap[clean]) tagMap[clean] = new Set();
          tagMap[clean].add(story.id);
        }
      });
    }
  });

  // 2. Fetch anonymous community tags from Supabase sync rows (completely stripped of user IDs)
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('bodhkathao_sync')
      .select('custom_tags');

    if (!error && Array.isArray(data)) {
      data.forEach((row: any) => {
        if (row.custom_tags && typeof row.custom_tags === 'object') {
          Object.entries(row.custom_tags).forEach(([storyIdStr, tags]) => {
            const storyId = Number(storyIdStr);
            if (storyId && Array.isArray(tags)) {
              tags.forEach((t: any) => {
                if (typeof t === 'string') {
                  const clean = t.trim();
                  if (clean) {
                    if (!tagMap[clean]) tagMap[clean] = new Set();
                    tagMap[clean].add(storyId);
                  }
                }
              });
            }
          });
        }
      });
    }
  } catch (err) {
    // Non-blocking fallback
  }

  // Convert Sets to arrays of storyIds
  const result: Record<string, number[]> = {};
  Object.keys(tagMap).forEach((tag) => {
    result[tag] = Array.from(tagMap[tag]);
  });

  return result;
}

/**
 * Seed all 469 stories into Supabase database table
 */
export async function seedStoriesToSupabase(onProgress?: (current: number, total: number) => void): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const client = getSupabaseClient();
    const stories = ALL_469_BODHKATHAO_STORIES;
    const batchSize = 50;
    let uploaded = 0;

    for (let i = 0; i < stories.length; i += batchSize) {
      const batch = stories.slice(i, i + batchSize).map(s => ({
        id: s.id,
        title: s.title,
        title_english: s.titleEnglish,
        book_page: s.bookPage,
        category: s.category,
        content: s.content,
        moral: s.moral,
        saakhi: s.saakhi || null,
        footnotes: s.footnotes || null,
        estimated_minutes: s.estimatedMinutes,
        key_characters: s.keyCharacters || null,
        tags: s.tags,
      }));

      const { error } = await client.from('stories').upsert(batch, { onConflict: 'id' });
      if (error) {
        return { success: false, count: uploaded, error: error.message };
      }

      uploaded += batch.length;
      if (onProgress) {
        onProgress(uploaded, stories.length);
      }
    }

    return { success: true, count: uploaded };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Seeding failed' };
  }
}

/**
 * Returns clean SQL snippet for setting up Supabase tables with RLS and Public Read/Write
 */
export function getSupabaseSqlSchema(): string {
  return `-- ==========================================
-- BODHKATHAO (યોગીજી મહારાજની બોધકથાઓ) SUPABASE SCHEMA
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/xkdoanzrjibhlujdntih/sql)
-- ==========================================

-- 1. Create Stories Table
CREATE TABLE IF NOT EXISTS public.stories (
  id INT PRIMARY KEY,
  title TEXT NOT NULL,
  title_english TEXT,
  book_page INT NOT NULL,
  category TEXT NOT NULL,
  content JSONB NOT NULL,
  moral TEXT NOT NULL,
  saakhi JSONB,
  footnotes JSONB,
  estimated_minutes INT DEFAULT 2,
  key_characters JSONB,
  tags JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create User Sync / Cross-Device State Table
CREATE TABLE IF NOT EXISTS public.bodhkathao_sync (
  sync_key TEXT PRIMARY KEY,
  last_updated BIGINT NOT NULL,
  read_story_ids JSONB DEFAULT '[]'::jsonb,
  favorite_story_ids JSONB DEFAULT '[]'::jsonb,
  bookmarks JSONB DEFAULT '[]'::jsonb,
  notes JSONB DEFAULT '{}'::jsonb,
  last_read_story_id INT DEFAULT 1,
  reading_streak JSONB DEFAULT '{"current":1,"best":1,"lastDate":""}'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS) & Policies
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bodhkathao_sync ENABLE ROW LEVEL SECURITY;

-- Allow public read access to stories
CREATE POLICY "Public read stories" ON public.stories
  FOR SELECT USING (true);

-- Allow public insert/update to stories
CREATE POLICY "Public insert/update stories" ON public.stories
  FOR ALL USING (true);

-- Allow public read/write to bodhkathao_sync by sync_key
CREATE POLICY "Public sync access" ON public.bodhkathao_sync
  FOR ALL USING (true);
`;
}

// -------------------------------------------------------------
// SUPABASE AUTHENTICATION & USER MANAGEMENT
// -------------------------------------------------------------

function mapSupabaseUser(user: SupabaseAuthUser | null): AuthUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'હરિભક્ત',
    createdAt: user.created_at,
    avatarUrl: user.user_metadata?.avatar_url,
  };
}

function translateAuthError(errorMessage: string): string {
  const msg = errorMessage.toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'ખોટો ઈમેઈલ અથવા પાસવર્ડ દાખલ કર્યો છે. કૃપા કરીને ફરીથી પ્રયાસ કરો.';
  }
  if (msg.includes('user already registered') || msg.includes('already exists')) {
    return 'આ ઈમેઈલ આઈડી પહેલેથી નોંધાયેલ છે. કૃપા કરીને લૉગિન કરો.';
  }
  if (msg.includes('password should be at least') || msg.includes('weak password')) {
    return 'પાસવર્ડ ઓછામાં ઓછો ૬ અક્ષરોનો હોવો જોઈએ.';
  }
  if (msg.includes('email not confirmed')) {
    return 'તમારા ઈમેઈલ પર એક કન્ફર્મેશન લિંક મોકલેલ છે. કૃપા કરીને તમારું ઇનબોક્સ ચેક કરો.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'ખૂબ વધુ પ્રયાસો થયા છે. કૃપા કરીને થોડી ક્ષણો પછી પ્રયાસ કરો.';
  }
  if (msg.includes('network') || msg.includes('failed to fetch')) {
    return 'ઇન્ટરનેટ કનેક્શન તપાસો. સર્વર સાથે સંપર્ક થઈ શક્યો નથી.';
  }
  return errorMessage;
}

/**
 * Register a new user with Supabase
 */
export async function signUpUser(
  email: string,
  password: string,
  name?: string
): Promise<{ success: boolean; user?: AuthUser; message?: string; needsEmailConfirmation?: boolean }> {
  try {
    const client = getSupabaseClient();
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        data: {
          full_name: name?.trim() || 'હરિભક્ત',
          name: name?.trim() || 'હરિભક્ત',
        },
      },
    });

    if (error) {
      return { success: false, message: translateAuthError(error.message) };
    }

    const authUser = mapSupabaseUser(data.user);
    const needsEmailConfirmation = Boolean(data.user && !data.session);

    return {
      success: true,
      user: authUser || undefined,
      needsEmailConfirmation,
      message: needsEmailConfirmation
        ? 'નોંધણી સફળ રહી! કૃપા કરીને તમારા ઈમેઈલ પર આવેલ કન્ફર્મેશન લિંક ચેક કરો.'
        : 'ખાતું સફળતાપૂર્વક બની ગયું!',
    };
  } catch (err: any) {
    return { success: false, message: translateAuthError(err?.message || 'રજિસ્ટ્રેશન દરમિયાન ક્ષતિ આવી') };
  }
}

/**
 * Login an existing user with email & password
 */
export async function signInUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
  try {
    const client = getSupabaseClient();
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await client.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    });

    if (error) {
      return { success: false, message: translateAuthError(error.message) };
    }

    const authUser = mapSupabaseUser(data.user);
    return {
      success: true,
      user: authUser || undefined,
      message: 'સફળતાપૂર્વક લૉગિન થયું!',
    };
  } catch (err: any) {
    return { success: false, message: translateAuthError(err?.message || 'લૉગિન દરમિયાન ક્ષતિ આવી') };
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Logout failed' };
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  try {
    const client = getSupabaseClient();
    const { data } = await client.auth.getSession();
    if (data?.session?.user) {
      return mapSupabaseUser(data.session.user);
    }
  } catch (err) {
    console.warn('Failed to retrieve active session:', err);
  }
  return null;
}

/**
 * Send password reset email
 */
export async function resetUserPassword(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const client = getSupabaseClient();
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await client.auth.resetPasswordForEmail(cleanEmail);
    if (error) {
      return { success: false, message: translateAuthError(error.message) };
    }
    return {
      success: true,
      message: 'પાસવર્ડ રીસેટ કરવાની લિંક તમારા ઈમેઈલ પર મોકલવામાં આવી છે.',
    };
  } catch (err: any) {
    return { success: false, message: translateAuthError(err?.message || 'રીસેટ લિંક મોકલવામાં નિષ્ફળતા.') };
  }
}

/**
 * Listen for auth state changes (login, logout, token refresh)
 */
export function onAuthSessionChange(callback: (user: AuthUser | null) => void): () => void {
  try {
    const client = getSupabaseClient();
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      callback(mapSupabaseUser(session?.user || null));
    });
    return () => {
      subscription.unsubscribe();
    };
  } catch (err) {
    console.warn('Could not register auth change listener:', err);
    return () => {};
  }
}

