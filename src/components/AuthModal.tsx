import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { AuthUser } from '../types';
import { signInUser, signUpUser, resetUserPassword } from '../services/supabaseService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleModeSwitch = (newMode: 'login' | 'register' | 'forgot') => {
    resetForm();
    setMode(newMode);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('કૃપા કરીને તમારો ઈમેઈલ દાખલ કરો.');
      return;
    }

    if (mode === 'forgot') {
      setIsLoading(true);
      const res = await resetUserPassword(cleanEmail);
      setIsLoading(false);
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
      return;
    }

    if (!password) {
      setErrorMsg('કૃપા કરીને પાસવર્ડ દાખલ કરો.');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setErrorMsg('પાસવર્ડ ઓછામાં ઓછો ૬ અક્ષરનો હોવો આવશ્યક છે.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('બંને પાસવર્ડ મેળ ખાતા નથી.');
        return;
      }

      setIsLoading(true);
      const res = await signUpUser(cleanEmail, password, name.trim());
      setIsLoading(false);

      if (res.success) {
        if (res.user) {
          onAuthSuccess(res.user);
          onClose();
        } else {
          setSuccessMsg(res.message || 'નોંધણી સફળ રહી! કૃપા કરીને ઈમેઈલ કન્ફર્મ કરો.');
        }
      } else {
        setErrorMsg(res.message || 'નોંધણી દરમિયાન ક્ષતિ આવી.');
      }
    } else {
      // Login mode
      setIsLoading(true);
      const res = await signInUser(cleanEmail, password);
      setIsLoading(false);

      if (res.success && res.user) {
        onAuthSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.message || 'લૉગિન કરવામાં નિષ્ફળતા.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="auth-modal-container"
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

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 font-['Noto_Sans_Gujarati']">
            {mode === 'login' && 'ખાતામાં લૉગિન કરો'}
            {mode === 'register' && 'નવું ખાતું બનાવો'}
            {mode === 'forgot' && 'પાસવર્ડ રીસેટ કરો'}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {mode === 'login' && 'યોગીજી મહારાજની બોધકથાઓ અને તમારો વાંચન ઇતિહાસ સુરક્ષિત રાખો'}
            {mode === 'register' && '૪૬૯ બોધકથાઓ, બુકમાર્ક્સ અને નોંધો ક્લાઉડમાં સંગ્રહો'}
            {mode === 'forgot' && 'તમારા રજિસ્ટર્ડ ઈમેઈલ પર રીસેટ લિંક મેળવો'}
          </p>
        </div>

        {/* Tab Switcher (Login vs Register) */}
        {mode !== 'forgot' && (
          <div className="flex bg-stone-100 dark:bg-stone-800/80 p-1 rounded-2xl">
            <button
              id="auth-tab-login"
              type="button"
              onClick={() => handleModeSwitch('login')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-white dark:bg-stone-700 text-amber-950 dark:text-amber-100 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>લૉગિન (Sign In)</span>
            </button>
            <button
              id="auth-tab-register"
              type="button"
              onClick={() => handleModeSwitch('register')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-white dark:bg-stone-700 text-amber-950 dark:text-amber-100 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>નોંધણી (Register)</span>
            </button>
          </div>
        )}

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name for Registration */}
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                તમારું પૂરું નામ (Full Name)
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  id="auth-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="દા.ત. મુકેશભાઈ પટેલ"
                  required={mode === 'register'}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              ઈમેઈલ સરનામું (Email Address)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                id="auth-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Password */}
          {mode !== 'forgot' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  પાસવર્ડ (Password)
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('forgot')}
                    className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-medium"
                  >
                    પાસવર્ડ ભૂલી ગયા?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
                  title={showPassword ? 'પાસવર્ડ છુપાવો' : 'પાસવર્ડ જુઓ'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === 'register' && (
                <span className="text-[10px] text-stone-400">ઓછામાં ઓછા ૬ અક્ષરો</span>
              )}
            </div>
          )}

          {/* Confirm Password for Registration */}
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                પાસવર્ડની પુષ્ટિ (Confirm Password)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  id="auth-confirm-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* Remember Me */}
          {mode === 'login' && (
            <div className="flex items-center gap-2">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300 dark:border-stone-700"
              />
              <label htmlFor="remember-me" className="text-xs text-stone-600 dark:text-stone-400 cursor-pointer">
                આ ડિવાઇસ પર લૉગિન યાદ રાખો
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-amber-900/10 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>સાઇન ઇન કરો (Sign In)</span>
              </>
            ) : mode === 'register' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>ખાતું રજિસ્ટર કરો (Create Account)</span>
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                <span>રીસેટ લિંક મોકલો (Send Reset Link)</span>
              </>
            )}
          </button>
        </form>

        {/* Back to Login if in Forgot Mode */}
        {mode === 'forgot' && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => handleModeSwitch('login')}
              className="text-xs text-amber-700 dark:text-amber-400 font-semibold hover:underline"
            >
              ← પાછા લૉગિન પેજ પર જાઓ
            </button>
          </div>
        )}

        {/* Guest Mode info */}
        <div className="pt-3 border-t border-stone-200 dark:border-stone-800 text-center space-y-2">
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            ખાતું બનાવ્યા વિના પણ તમે બધી ૪૬૯ બોધકથાઓ ઓફલાઇન વાંચી શકો છો.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-400 underline underline-offset-2"
          >
            અતિથિ તરીકે વાંચન ચાલુ રાખો (Continue as Guest)
          </button>
        </div>
      </div>
    </div>
  );
};
