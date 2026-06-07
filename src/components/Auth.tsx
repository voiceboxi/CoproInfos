import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { Building2, Key, Mail, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/utils';

export function AuthView() {
  const [view, setView] = useState<'login' | 'signup_code' | 'signup_info' | 'forgot'>('login');
  
  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [lot, setLot] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [residenceName, setResidenceName] = useState('');
  const [residenceId, setResidenceId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const { refreshAuthData } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Auth provider will pick it up
    } catch (err: any) {
      setError(err.message || 'Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if(!inviteCode) throw new Error("Veuillez saisir un code.");
      const inviteRef = doc(db, 'invites', inviteCode);
      const inviteSnap = await getDoc(inviteRef);
      if (!inviteSnap.exists()) {
        throw new Error("Code d'invitation invalide ou expiré.");
      }
      setResidenceId(inviteSnap.data().residenceId);
      setResidenceName(inviteSnap.data().residenceName);
      setView('signup_info');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;
      
      // We must atomicly create the user profile and member document
      await setDoc(doc(db, 'users', uid), {
        email,
        name,
        residenceId,
        createdAt: Date.now()
      });
      
      await setDoc(doc(db, `residences/${residenceId}/members`, uid), {
        role: 'tenant', // Default role, could be adjusted
        lot: lot || '',
        joinedAt: Date.now()
      });

      await refreshAuthData();
      
      // Optionally send email verification
      await sendEmailVerification(userCred.user);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Un lien de réinitialisation a été envoyé.');
      setTimeout(() => setView('login'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans bg-transparent">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-16 h-16 bg-[#1E3A5F]/5 rounded-2xl mx-auto mb-6 flex items-center justify-center backdrop-blur-sm border border-[#1E3A5F]/10">
             <Building2 className="w-8 h-8 text-[#1E3A5F]" />
        </div>
        <h2 className="mt-2 text-3xl font-extrabold text-[#1E3A5F]">CoproInfos</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/60 backdrop-blur-xl py-8 px-6 shadow-2xl sm:rounded-3xl sm:px-10 border border-white/60">
          
          {error && (
            <div className="mb-4 bg-red-50/80 backdrop-blur-sm border-l-4 border-red-400 p-4 rounded-r-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {message && (
            <div className="mb-4 bg-green-50/80 backdrop-blur-sm border-l-4 border-green-400 p-4 rounded-r-md">
              <p className="text-sm text-green-700 font-medium">{message}</p>
            </div>
          )}

          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#6B7280] ml-1 mb-1">Email</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="focus:ring-2 focus:ring-[#1E3A5F]/50 focus:border-[#1E3A5F] block w-full pl-10 sm:text-sm border-gray-200 rounded-xl py-2.5 border bg-white/80 backdrop-blur-sm shadow-sm transition-all text-gray-800" placeholder="vous@exemple.com" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#6B7280] ml-1 mb-1">Mot de passe</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="focus:ring-2 focus:ring-[#1E3A5F]/50 focus:border-[#1E3A5F] block w-full pl-10 sm:text-sm border-gray-200 rounded-xl py-2.5 border bg-white/80 backdrop-blur-sm shadow-sm transition-all text-gray-800" />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-[#1E3A5F]/20 text-sm font-bold text-white bg-[#1E3A5F] hover:bg-[#152a46] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3A5F] disabled:opacity-50 transition-all active:scale-[0.98]">
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Se connecter'}
                </button>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={() => setView('forgot')} className="text-xs font-semibold text-[#1E3A5F] hover:underline">Mot de passe oublié ?</button>
                <button type="button" onClick={() => setView('signup_code')} className="text-xs font-bold text-[#1E3A5F] hover:underline">Créer un compte</button>
              </div>
            </form>
          )}

          {view === 'signup_code' && (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-[#1E3A5F]">Rejoindre votre résidence</h3>
                <p className="text-xs text-[#6B7280] mt-1">Saisissez le code fourni par votre syndic ou conseil syndical.</p>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#6B7280] ml-1 mb-1">Code d'invitation</label>
                <input type="text" required value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
                  className="focus:ring-2 focus:ring-[#1E3A5F]/50 focus:border-[#1E3A5F] block w-full sm:text-sm border-gray-200 rounded-xl py-2.5 px-3 border bg-white/80 backdrop-blur-sm shadow-sm transition-all text-gray-800" placeholder="Ex: RES-2026-ABC" />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-[#1E3A5F]/20 text-sm font-bold text-white bg-[#1E3A5F] hover:bg-[#152a46] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3A5F] disabled:opacity-50 transition-all active:scale-[0.98]">
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Vérifier le code'}
                </button>
              </div>
              <div className="text-center pt-2">
                <button type="button" onClick={() => setView('login')} className="text-xs font-semibold text-[#6B7280] hover:text-[#1E3A5F] transition-colors">Retour à la connexion</button>
              </div>
            </form>
          )}

          {view === 'signup_info' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="text-center mb-6">
                <div className="inline-block bg-[#D1E8E2] text-[#1E3A5F] px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider mb-3 shadow-sm border border-white/50">RÉSIDENCE TROUVÉE</div>
                <h3 className="text-lg font-bold text-[#1E3A5F]">{residenceName}</h3>
              </div>
              
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#6B7280] ml-1 mb-1">Nom et prénom *</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="focus:ring-2 focus:ring-[#1E3A5F]/50 focus:border-[#1E3A5F] block w-full pl-10 sm:text-sm border-gray-200 rounded-xl py-2.5 border bg-white/80 backdrop-blur-sm shadow-sm transition-all text-gray-800" placeholder="Jean Dupont" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#6B7280] ml-1 mb-1">Email *</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="focus:ring-2 focus:ring-[#1E3A5F]/50 focus:border-[#1E3A5F] block w-full pl-10 sm:text-sm border-gray-200 rounded-xl py-2.5 border bg-white/80 backdrop-blur-sm shadow-sm transition-all text-gray-800" placeholder="vous@exemple.com" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#6B7280] ml-1 mb-1">Mot de passe *</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={8}
                    className="focus:ring-2 focus:ring-[#1E3A5F]/50 focus:border-[#1E3A5F] block w-full pl-10 sm:text-sm border-gray-200 rounded-xl py-2.5 border bg-white/80 backdrop-blur-sm shadow-sm transition-all text-gray-800" />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#6B7280] ml-1 mb-1">Numéro de lot (optionnel)</label>
                <input type="text" value={lot} onChange={(e) => setLot(e.target.value)}
                  className="focus:ring-2 focus:ring-[#1E3A5F]/50 focus:border-[#1E3A5F] block w-full sm:text-sm border-gray-200 rounded-xl py-2.5 px-3 border bg-white/80 backdrop-blur-sm shadow-sm transition-all text-gray-800" placeholder="Ex: B24" />
              </div>

              <div className="flex items-center pt-2">
                <input required type="checkbox" className="h-4 w-4 text-[#1E3A5F] focus:ring-[#1E3A5F] border-gray-300 rounded" />
                <label className="ml-2 block text-xs font-medium text-gray-700">
                  J'accepte les <span className="text-[#1E3A5F] underline">conditions d'utilisation</span>
                </label>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-[#1E3A5F]/20 text-sm font-bold text-white bg-[#1E3A5F] hover:bg-[#152a46] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3A5F] disabled:opacity-50 transition-all active:scale-[0.98]">
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Créer mon compte'}
                </button>
              </div>
              <div className="text-center mt-4">
                <button type="button" onClick={() => setView('login')} className="text-xs font-semibold text-[#6B7280] hover:text-[#1E3A5F] transition-colors">Annuler</button>
              </div>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={handleReset} className="space-y-5">
               <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-[#1E3A5F]">Mot de passe oublié</h3>
                <p className="text-xs text-[#6B7280] mt-1">Saisissez votre email pour recevoir un lien de réinitialisation.</p>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#6B7280] ml-1 mb-1">Email</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="focus:ring-2 focus:ring-[#1E3A5F]/50 focus:border-[#1E3A5F] block w-full pl-10 sm:text-sm border-gray-200 rounded-xl py-2.5 border bg-white/80 backdrop-blur-sm shadow-sm transition-all text-gray-800" placeholder="vous@exemple.com" />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-[#1E3A5F]/20 text-sm font-bold text-white bg-[#1E3A5F] hover:bg-[#152a46] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3A5F] disabled:opacity-50 transition-all active:scale-[0.98]">
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Envoyer le lien'}
                </button>
              </div>
              <div className="text-center pt-2">
                <button type="button" onClick={() => setView('login')} className="text-xs font-semibold text-[#6B7280] hover:text-[#1E3A5F] transition-colors">Retour à la connexion</button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
