import React, { useState } from 'react';
import { 
  X, 
  User as UserIcon, 
  LogOut, 
  Mail, 
  Cloud, 
  Flame, 
  BookOpen, 
  Bookmark, 
  FileText, 
  CheckCircle2, 
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Award
} from 'lucide-react';
import { AuthUser, UserPreferences } from '../types';
import { signOutUser } from '../services/supabaseService';
import { syncWithCloud } from '../services/storageService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
  preferences: UserPreferences;
  onUpdatePreferences: (updated: UserPreferences) => void;
  onLogout: () => void;
  totalStoriesCount: number;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  preferences,
  onUpdatePreferences,
  onLogout,
  totalStoriesCount,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen) return null;

  const handleLogout = async () => {
    await signOutUser();
    onLogout();
    onClose();
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    const res = await syncWithCloud(preferences);
    setIsSyncing(false);
    if (res.success && res.data) {
      onUpdatePreferences(res.data);
      setSyncStatus('તમારો વાંચન ડેટા ક્લાઉડ સાથે સિંક થઈ ગયો છે.');
    } else {
      setSyncStatus(res.message);
    }
  };

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const readCount = preferences.readStories.length;
  const progressPercent = Math.round((readCount / totalStoriesCount) * 100);
  const notesCount = Object.keys(preferences.notes || {}).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="user-profile-modal"
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
          title="બંધ કરો"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Avatar & Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-700 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-amber-900/20">
            {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-8 h-8" />}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-['Noto_Sans_Gujarati']">
                {user.name || 'હરિભક્ત'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                <ShieldCheck className="w-3 h-3 text-amber-600" />
                નોંધાયેલ સભ્ય
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              <span>{user.email}</span>
            </p>
          </div>
        </div>

        {/* Sync Status Alert if any */}
        {syncStatus && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncStatus}</span>
          </div>
        )}

        {/* Reading Progress Overview */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-stone-300">
            <span>વાંચન પ્રગતિ (Reading Progress)</span>
            <span className="text-amber-700 dark:text-amber-400 font-bold">{progressPercent}% પૂર્ણ</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(progressPercent, 2))}%` }}
            />
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-center">
            <div className="p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700/80">
              <div className="text-base font-bold text-stone-900 dark:text-stone-100">
                {readCount}
                <span className="text-[11px] font-normal text-stone-400">/{totalStoriesCount}</span>
              </div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400">વાંચેલી કથાઓ</div>
            </div>

            <div className="p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700/80">
              <div className="text-base font-bold text-amber-600 flex items-center justify-center gap-0.5">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                <span>{preferences.readingStreak.current}</span>
              </div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400">દિવસની સ્ટ્રીક</div>
            </div>

            <div className="p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700/80">
              <div className="text-base font-bold text-stone-900 dark:text-stone-100">
                {preferences.bookmarks.length}
              </div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400">બુકમાર્ક્સ</div>
            </div>
          </div>
        </div>

        {/* Cloud Sync Action */}
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="font-semibold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-amber-600" />
              <span>Supabase એકાઉન્ટ સિંક</span>
            </div>
            {preferences.lastSyncedAt && (
              <span className="text-[10px] text-stone-400">
                {new Date(preferences.lastSyncedAt).toLocaleTimeString('gu-IN')}
              </span>
            )}
          </div>
          <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
            તમારું ખાતું જોડાયેલું છે. તમારા બધા ઉપકરણો પર વાંચન આપોઆપ સિંક થાય છે.
          </p>
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-98 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'સિંક થઈ રહ્યું છે...' : 'ક્લાઉડ સાથે સિંક કરો'}</span>
          </button>
        </div>

        {/* Account Controls & Sign Out */}
        <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2">
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>ખાતામાંથી બહાર નીકળો (Sign Out)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
