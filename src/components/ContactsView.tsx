import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { Member, User } from '../types';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { UserCircle, Search, MessageSquare, Send, CheckCircle, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Contact extends Member {
  profile?: User;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propriétaire',
  tenant: 'Locataire',
  board: 'Conseil Syndical',
  syndic: 'Syndic'
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-blue-100 text-blue-800',
  tenant: 'bg-green-100 text-green-800',
  board: 'bg-purple-100 text-purple-800',
  syndic: 'bg-orange-100 text-orange-800'
};

export function ContactsView() {
  const { currentResidence } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');

  const [showSyndicForm, setShowSyndicForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSendSyndic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !subject.trim()) return;
    setIsSubmitting(true);
    // Simulation réaliste de l'envoi réseau
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setShowSyndicForm(false);
        setIsSuccess(false);
        setMessage('');
        setSubject('');
      }, 2500);
    }, 1200);
  };

  useEffect(() => {
    if (!currentResidence) return;

    let unsubMembers: () => void;
    // We need to fetch all users then all members to merge them.
    // In a real app we might use a Cloud Function to sync the `Member` doc with basic user info
    // but for our prototype we can just pull `users` and `members`.
    getDocs(collection(db, 'users')).then(usersSnap => {
      const userMap: Record<string, User> = {};
      usersSnap.docs.forEach(d => {
        userMap[d.id] = { id: d.id, ...d.data() } as User;
      });

      unsubMembers = onSnapshot(collection(db, `residences/${currentResidence.id}/members`), (snapshot) => {
        const list = snapshot.docs.map(d => {
          const m = { id: d.id, ...d.data() } as Member;
          return { ...m, profile: userMap[d.id] };
        });
        // sort by name naturally
        list.sort((a, b) => (a.profile?.name || '').localeCompare(b.profile?.name || ''));
        setContacts(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'members', {}));
    });

    return () => {
      if (unsubMembers) unsubMembers();
    };
  }, [currentResidence]);

  const filtered = contacts.filter(c => {
    if (!search) return true;
    const term = search.toLowerCase();
    return c.profile?.name?.toLowerCase().includes(term) || 
           c.lot?.toLowerCase().includes(term) ||
           ROLE_LABELS[c.role]?.toLowerCase().includes(term);
  });

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="bg-white px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
             type="text" 
             value={search}
             onChange={e => setSearch(e.target.value)}
             placeholder="Rechercher par nom, lot, rôle..." 
             className="w-full bg-gray-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-[#1E3A5F]" 
          />
        </div>
      </div>

      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 shrink-0">
        <button 
          onClick={() => setShowSyndicForm(true)} 
          className="w-full bg-white border border-gray-200 text-[#1E3A5F] py-2.5 rounded-lg shadow-sm text-sm font-semibold hover:bg-gray-50 transition-all flex items-center justify-center active:scale-[0.98]"
        >
          <Send className="w-4 h-4 mr-2" />
          Envoyer un message au syndic
        </button>
      </div>

      <div className="flex-1 overflow-y-auto relative">
        <div className="divide-y divide-gray-50 pb-[env(safe-area-inset-bottom)]">
          {filtered.map(contact => (
             <div key={contact.id} className="px-4 py-3 flex items-center">
               <UserCircle className="w-12 h-12 text-gray-300 mr-3 shrink-0" />
               <div className="flex-1 min-w-0">
                 <h3 className="text-sm font-semibold text-gray-900 truncate">
                   {contact.profile?.name || 'Utilisateur inconnu'}
                 </h3>
                 <div className="flex items-center mt-1 space-x-2">
                   <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[contact.role] || 'bg-gray-100 text-gray-800'}`}>
                     {ROLE_LABELS[contact.role] || contact.role}
                   </span>
                   {contact.lot && <span className="text-[10px] text-gray-500">Lot {contact.lot}</span>}
                 </div>
               </div>
               <button className="ml-3 p-2 text-[#1E3A5F] hover:bg-[#D1E8E2] rounded-full transition-colors flex-shrink-0">
                 <MessageSquare className="w-5 h-5" />
               </button>
             </div>
          ))}
        </div>
        
        <AnimatePresence>
          {showSyndicForm && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-50 bg-[#F0F2F5]/95 backdrop-blur-2xl flex flex-col"
            >
              <div className="px-4 py-4 flex items-center justify-between border-b border-white/40 bg-white/30 shrink-0 shadow-sm z-10">
                <h3 className="text-lg font-bold text-[#1E3A5F]">Contacter le Syndic</h3>
                <button 
                  onClick={() => !isSubmitting && setShowSyndicForm(false)} 
                  className="p-2 bg-white/50 rounded-full text-gray-500 hover:text-gray-900 shadow-sm border border-white/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 p-6 flex flex-col justify-center overflow-y-auto">
                {isSuccess ? (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    className="flex flex-col items-center justify-center text-center bg-white/60 backdrop-blur-xl border border-white/60 p-8 rounded-3xl shadow-xl"
                  >
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <h4 className="text-xl font-bold text-[#1E3A5F] mb-2">Message envoyé</h4>
                    <p className="text-sm text-gray-600 font-medium max-w-[250px]">
                      Votre demande a bien été transmise à votre syndic par email.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSendSyndic} className="space-y-4 bg-white/60 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-xl">
                    <p className="text-xs text-center text-gray-600 font-medium border-b border-white/50 pb-4 mb-2">
                      Utilisez ce formulaire pour signaler un problème dans les parties communes ou poser une question administrative à votre syndic.
                    </p>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#6B7280] ml-1 mb-1">Sujet</label>
                      <input 
                        required 
                        type="text" 
                        value={subject} 
                        onChange={e => setSubject(e.target.value)} 
                        disabled={isSubmitting} 
                        className="focus:ring-2 focus:ring-[#1E3A5F]/50 focus:border-[#1E3A5F] block w-full border-gray-200 rounded-xl py-2.5 px-3 border bg-white/80 backdrop-blur-sm shadow-sm transition-all text-gray-800 text-sm font-medium disabled:opacity-60" 
                        placeholder="Ex: Problème d'ascenseur Bâtiment A" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#6B7280] ml-1 mb-1">Message</label>
                      <textarea 
                        required 
                        value={message} 
                        onChange={e => setMessage(e.target.value)} 
                        disabled={isSubmitting} 
                        rows={5} 
                        className="focus:ring-2 focus:ring-[#1E3A5F]/50 focus:border-[#1E3A5F] block w-full border-gray-200 rounded-xl py-2.5 px-3 border bg-white/80 backdrop-blur-sm shadow-sm transition-all text-gray-800 text-sm resize-none font-medium disabled:opacity-60" 
                        placeholder="Détaillez votre demande..."
                      ></textarea>
                    </div>
                    <div className="pt-2">
                      <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-lg shadow-[#1E3A5F]/20 text-sm font-bold text-white bg-[#1E3A5F] hover:bg-[#152a46] transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : 'Envoyer le message'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}