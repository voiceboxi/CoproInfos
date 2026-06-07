import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { UserCircle, Save, Loader2, CheckCircle, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ProfileView() {
  const { userProfile, currentMember, currentResidence, refreshAuthData } = useAuth();
  
  const [name, setName] = useState(userProfile?.name || '');
  const [lot, setLot] = useState(currentMember?.lot || '');
  const [floor, setFloor] = useState(currentMember?.floor || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    async function loadInviteCode() {
      if (currentResidence && (currentMember?.role === 'syndic' || currentMember?.role === 'board')) {
        try {
          const q = query(collection(db, 'invites'), where('residenceId', '==', currentResidence.id));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            setInviteCode(querySnapshot.docs[0].id);
          }
        } catch (err) {
          console.error(err);
        }
      }
    }
    loadInviteCode();
  }, [currentResidence, currentMember]);

  const handleCopyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !currentResidence || !currentMember) return;
    
    setIsSubmitting(true);
    setIsSuccess(false);
    
    try {
      // Update user details
      if (name.trim() !== userProfile.name) {
        await updateDoc(doc(db, 'users', userProfile.id), {
          name: name.trim()
        });
      }
      
      // Update member details
      if (lot !== currentMember.lot || floor !== currentMember.floor) {
        await updateDoc(doc(db, `residences/${currentResidence.id}/members`, userProfile.id), {
          lot: lot.trim(),
          floor: floor.trim()
        });
      }
      
      await refreshAuthData();
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users/members');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#F9F9FB] overflow-y-auto">
      <div className="px-4 py-6 border-b border-gray-100 bg-white shrink-0">
        <h2 className="text-xl font-bold text-[#1E3A5F]">Mon Profil</h2>
        <p className="text-sm text-gray-500 mt-1">Gérez vos informations personnelles et détails de résidence</p>
      </div>

      <div className="p-4 flex-1">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-[#1E3A5F]/10 rounded-full flex items-center justify-center mb-3">
              <UserCircle className="w-12 h-12 text-[#1E3A5F]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{userProfile?.name}</h3>
            <p className="text-xs font-semibold text-[#1E3A5F] px-3 py-1 bg-blue-50 rounded-full mt-2 uppercase tracking-wide">
              {currentMember?.role === 'syndic' ? 'Syndic' : currentMember?.role === 'board' ? 'Conseil Syndical' : currentMember?.role === 'owner' ? 'Propriétaire' : 'Locataire'}
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1.5 ml-1">Nom complet</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-all font-medium text-gray-900"
                placeholder="Votre nom complet"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-bold text-gray-500 mb-1.5 ml-1">Étage</label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-all font-medium text-gray-900"
                  placeholder="Ex: 3ème"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-gray-500 mb-1.5 ml-1">Appartement (Lot)</label>
                <input
                  type="text"
                  value={lot}
                  onChange={(e) => setLot(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-all font-medium text-gray-900"
                  placeholder="Ex: 304"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1.5 ml-1">Email</label>
              <input
                type="text"
                value={userProfile?.email}
                disabled
                className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 cursor-not-allowed"
              />
              <p className="text-[10px] text-gray-400 font-medium ml-1 mt-1">L'adresse email ne peut pas être modifiée ici.</p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1E3A5F] hover:bg-[#152a46] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-[#1E3A5F]/20 flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
            
            <AnimatePresence>
              {isSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center text-green-700"
                >
                  <CheckCircle className="w-5 h-5 mr-2 shrink-0" />
                  <p className="text-sm font-semibold">Profil mis à jour avec succès.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {inviteCode && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h4 className="text-sm font-bold text-[#1E3A5F] mb-1">Code d'invitation de la résidence</h4>
              <p className="text-xs text-gray-500 mb-3">Partagez ce code avec les résidents pour qu'ils puissent rejoindre l'application.</p>
              
              <div className="flex items-center">
                <div className="bg-gray-50 border border-gray-200 rounded-l-xl px-4 py-3 flex-1 text-sm font-mono font-bold text-gray-900 tracking-wider">
                  {inviteCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="bg-[#1E3A5F] hover:bg-[#152a46] text-white px-4 py-3 border border-[#1E3A5F] rounded-r-xl transition-colors flex items-center shadow-sm"
                >
                  {copiedCode ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
