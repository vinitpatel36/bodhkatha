import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Copy, 
  Check, 
  RefreshCw, 
  Upload, 
  Download, 
  Database,
  ShieldCheck, 
  X,
  Code,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { UserPreferences } from '../types';
import { syncWithCloud, exportBackupFile, importBackupFile } from '../services/storageService';
import { 
  testSupabaseConnection, 
  getSupabaseSqlSchema, 
  seedStoriesToSupabase, 
  DEFAULT_SUPABASE_URL,
  SupabaseStatus 
} from '../services/supabaseService';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (updated: UserPreferences) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [partnerSyncKey, setPartnerSyncKey] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus | null>(null);
  const [seedingProgress, setSeedingProgress] = useState<{ active: boolean; current: number; total: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      testSupabaseConnection().then(setSupabaseStatus).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(preferences.syncKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(getSupabaseSqlSchema());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleManualSync = async () => {
    setSyncLoading(true);
    setStatusMessage(null);
    const result = await syncWithCloud(preferences);
    setSyncLoading(false);
    if (result.success && result.data) {
      onUpdatePreferences(result.data);
      setStatusMessage({ type: 'success', text: result.message });
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  const handlePairDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = partnerSyncKey.trim().toUpperCase();
    if (!cleanKey) return;

    setSyncLoading(true);
    setStatusMessage(null);
    const result = await syncWithCloud(preferences, cleanKey);
    setSyncLoading(false);
    if (result.success && result.data) {
      onUpdatePreferences(result.data);
      setStatusMessage({ type: 'success', text: `ડિવાઇસ '${cleanKey}' સાથે સફળતાપૂર્વક સિંક થઈ ગયું!` });
      setPartnerSyncKey('');
    } else {
      setStatusMessage({ type: 'error', text: result.message || 'સિંક કોડ મળ્યો નથી.' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importBackupFile(file);
      onUpdatePreferences(imported);
      setStatusMessage({ type: 'success', text: 'બેકઅપ ફાઈલમાંથી ડેટા સફળતાપૂર્વક રિસ્ટોર થયો!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'બેકઅપ ફાઈલ વાંચવામાં નિષ્ફળતા.' });
    }
  };

  const handleSeedToSupabase = async () => {
    setSeedingProgress({ active: true, current: 0, total: 469 });
    setStatusMessage(null);
    
    const res = await seedStoriesToSupabase((current, total) => {
      setSeedingProgress({ active: true, current, total });
    });

    setSeedingProgress(null);
    if (res.success) {
      setStatusMessage({ type: 'success', text: `બધી ${res.count} બોધકથાઓ Supabase માં સફળતાપૂર્વક અપલોડ થઈ ગઈ!` });
      testSupabaseConnection().then(setSupabaseStatus).catch(() => {});
    } else {
      setStatusMessage({ 
        type: 'error', 
        text: `Supabase ટેબલ મળ્યું નથી. કૃપા કરીને નીચે 'Supabase SQL સ્કીમા' રન કરો: ${res.error}` 
      });
      setShowSqlSchema(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="cloud-sync-modal"
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
          title="બંધ કરો"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 font-['Noto_Sans_Gujarati']">
              ડિવાઇસ સિંક અને Supabase ક્લાઉડ
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              ફોન, ટેબ્લેટ કે કોમ્પ્યુટર વચ્ચે 469 બોધકથાઓ અને વાંચન ઇતિહાસ સિંક કરો
            </p>
          </div>
        </div>

        {/* Supabase Status Banner */}
        <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="font-semibold text-stone-800 dark:text-stone-200">Supabase: </span>
              <span className="font-mono text-[11px] text-stone-600 dark:text-stone-400">
                {DEFAULT_SUPABASE_URL.replace('https://', '')}
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
            કનેક્ટેડ (Active)
          </span>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}>
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Current Device Sync Code */}
        <div className="p-4.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
          <div className="text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center justify-between">
            <span>તમારો સિંક કોડ (Personal Sync Code):</span>
            {preferences.lastSyncedAt && (
              <span className="text-[10px] text-stone-400">
                છેલ્લે સિંક: {new Date(preferences.lastSyncedAt).toLocaleTimeString('gu-IN')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white dark:bg-stone-800 px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-700 font-mono text-base font-bold text-amber-950 dark:text-amber-100 tracking-wider">
              {preferences.syncKey}
            </div>

            <button
              onClick={handleCopyKey}
              className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
              title="કોડ કોપી કરો"
            >
              {copiedKey ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedKey ? 'કોપી થયો' : 'કોપી'}</span>
            </button>
          </div>
        </div>

        {/* Sync / Refresh Button */}
        <button
          onClick={handleManualSync}
          disabled={syncLoading}
          className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
          <span>{syncLoading ? 'સિંક થઈ રહ્યું છે...' : 'હમણાં સિંક કરો (Instant Cloud Sync)'}</span>
        </button>

        {/* Pair Other Device with Code */}
        <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-3">
          <div className="text-xs font-bold text-stone-700 dark:text-stone-300">
            બીજા ડિવાઇસનો સિંક કોડ જોડો (Pair Another Device):
          </div>

          <form onSubmit={handlePairDevice} className="flex gap-2">
            <input
              type="text"
              value={partnerSyncKey}
              onChange={(e) => setPartnerSyncKey(e.target.value.toUpperCase())}
              placeholder="દા.ત. BODH-XXXX"
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase font-mono"
            />
            <button
              type="submit"
              disabled={syncLoading || !partnerSyncKey.trim()}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 dark:hover:bg-stone-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
            >
              જોડો
            </button>
          </form>
        </div>

        {/* Supabase Schema & Database Management Section */}
        <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-amber-600" />
              <span>Supabase ડેટાબેઝ સેટઅપ (469 કથાઓ)</span>
            </span>
            <button
              onClick={() => setShowSqlSchema(!showSqlSchema)}
              className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1"
            >
              <Code className="w-3 h-3" />
              <span>{showSqlSchema ? 'સ્કીમા છુપાવો' : 'SQL સ્કીમા જુઓ'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleSeedToSupabase}
              disabled={Boolean(seedingProgress?.active)}
              className="p-3 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-left"
            >
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {seedingProgress?.active 
                  ? `અપલોડ થઈ રહ્યું છે: ${seedingProgress.current}/${seedingProgress.total}`
                  : '469 કથાઓ Supabase માં પુશ કરો'}
              </span>
            </button>

            <button
              onClick={handleCopySql}
              className="p-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {copiedSql ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-500" />}
              <span>{copiedSql ? 'SQL કોપી થયો!' : 'Supabase SQL કોપી કરો'}</span>
            </button>
          </div>

          {showSqlSchema && (
            <div className="p-3 rounded-xl bg-stone-900 text-stone-200 text-[11px] font-mono overflow-x-auto space-y-2 border border-stone-800">
              <div className="flex justify-between items-center text-stone-400 text-[10px] pb-1 border-b border-stone-800">
                <span>Supabase SQL Editor સ્ક્રિપ્ટ:</span>
                <button onClick={handleCopySql} className="text-amber-400 hover:underline">કોપી</button>
              </div>
              <pre className="text-[10px] text-emerald-400 whitespace-pre-wrap">{getSupabaseSqlSchema()}</pre>
            </div>
          )}
        </div>

        {/* File Backup & Restore */}
        <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-3">
          <div className="text-xs font-bold text-stone-700 dark:text-stone-300">
            ઓફલાઇન ફાઈલ બેકઅપ અને રિસ્ટોર:
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => exportBackupFile(preferences)}
              className="p-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-amber-600" />
              <span>બેકઅપ ડાઉનલોડ</span>
            </button>

            <label className="p-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center">
              <Upload className="w-4 h-4 text-amber-600" />
              <span>બેકઅપ રિસ્ટોર</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
