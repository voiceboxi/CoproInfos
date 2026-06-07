import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, getDocs, where, limit } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { Thread, User, Member } from '../types';
import { handleFirestoreError, OperationType, cn } from '../lib/utils';
import { Search, Plus, User as UserIcon, LogOut, Send, Paperclip, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

function ActiveChat({ thread, onClose, members, users }: { thread: Thread, onClose: () => void, members: Member[], users: Record<string, User> }) {
  const { userProfile, currentResidence } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!currentResidence) return;
    const q = query(
      collection(db, `residences/${currentResidence.id}/threads/${thread.id}/messages`),
      orderBy('createdAt', 'asc')
    );
    const snap = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `threads/${thread.id}/messages`, {}));
    return snap;
  }, [currentResidence, thread]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !userProfile || !currentResidence) return;
    try {
      await addDoc(collection(db, `residences/${currentResidence.id}/threads/${thread.id}/messages`), {
        senderId: userProfile.id,
        text: text.trim(),
        createdAt: Date.now()
      });
      setText('');
      // In a real app we'd also update the thread's lastMessage. 
      // Firestore triggers or client side batch writes. Let's do it client-side if we had update permissions.
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="absolute inset-0 bg-white/40 backdrop-blur-xl z-20 flex flex-col pt-[env(safe-area-inset-top)]"> 
      {/* Thread Header */}
      <div className="bg-white/60 backdrop-blur-md border-b border-white/40 px-4 py-3 flex items-center shadow-sm shrink-0 z-10">
        <button onClick={onClose} className="mr-3 text-[#1E3A5F] font-bold p-1 -ml-1 hover:bg-white/50 rounded-lg transition-colors">
          Retour
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-[#1E3A5F] truncate">{thread.name || 'Discussion'}</h3>
          <p className="text-xs text-gray-500 truncate font-medium">{thread.type === 'group' ? 'Groupe' : 'Privé'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const isMe = m.senderId === userProfile?.id;
            const senderName = users[m.senderId]?.name || 'Utilisateur';
            return (
              <motion.div 
                key={m.id} 
                className={cn("flex flex-col max-w-[85%]", isMe ? "ml-auto items-end" : "items-start")}
                initial={{ opacity: 0, scale: 0.8, x: isMe ? 20 : -20, originX: isMe ? 1 : 0 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {!isMe && <span className="text-[10px] text-gray-500 font-medium mb-1 ml-1">{senderName}</span>}
                <div className={cn("px-4 py-2.5 rounded-2xl shadow-sm border", isMe ? "bg-[#A7C7E7] text-[#1E3A5F] border-transparent rounded-br-sm" : "bg-white/80 backdrop-blur-md text-gray-800 border-white/50 rounded-bl-sm")}>
                  <p className="text-sm font-medium">{m.text}</p>
                </div>
                <span className="text-[10px] text-gray-400 font-medium mt-1">{format(m.createdAt, 'HH:mm')}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="bg-white/60 backdrop-blur-xl p-3 border-t border-white/40 shrink-0 mb-[env(safe-area-inset-bottom)] z-10">
        <form onSubmit={send} className="flex items-center space-x-2">
          <button type="button" className="p-2 text-gray-400 hover:text-[#1E3A5F] transition-colors rounded-full hover:bg-white/50">
            <Paperclip className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            value={text} 
            onChange={e => setText(e.target.value)} 
            placeholder="Écrivez un message..." 
            className="flex-1 bg-white/60 backdrop-blur-sm border border-white/50 shadow-inner focus:bg-white focus:border-[#1E3A5F] focus:ring-0 rounded-full px-4 py-2 text-sm font-medium"
          />
          <button type="submit" disabled={!text.trim()} className="bg-[#1E3A5F] text-white p-2.5 rounded-full disabled:opacity-50 shadow-md shadow-[#1E3A5F]/20 hover:scale-105 active:scale-95 transition-all">
            <Send className="w-4 h-4 ml-[2px]" />
          </button>
        </form>
      </div>
    </div>
  );
}

export function DiscussionsView() {
  const { userProfile, currentResidence } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [users, setUsers] = useState<Record<string, User>>({});

  useEffect(() => {
    if (!currentResidence || !userProfile) return;
    
    // Fetch users for resolving names
    getDocs(collection(db, 'users')).then(snap => {
      const umap: Record<string,User> = {};
      snap.docs.forEach(d => {
        umap[d.id] = { id: d.id, ...d.data() } as User;
      });
      setUsers(umap);
    });

    const q = query(
      collection(db, `residences/${currentResidence.id}/threads`),
      orderBy('updatedAt', 'desc')
    );
    
    const snap = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Thread));
      // filter on client for simplicity since firestore rules protect it anyway, but we should only see ours
      const myThreads = list.filter(t => t.type === 'group' || t.memberIds.includes(userProfile.id));
      setThreads(myThreads);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'threads', {}));
    
    return snap;
  }, [currentResidence, userProfile]);

  if (activeThread) {
    return <ActiveChat thread={activeThread} onClose={() => setActiveThread(null)} members={[]} users={users} />;
  }

  return (
    <div className="h-full flex flex-col bg-transparent">
      <div className="px-4 py-3 border-b border-white/40 flex items-center justify-between bg-white/20 backdrop-blur-sm shadow-sm z-10 shrink-0">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Rechercher une discussion..." className="w-full bg-white/60 backdrop-blur-md border border-white/40 shadow-sm rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-[#1E3A5F] focus:bg-white transition-all font-medium text-gray-800" />
        </div>
        <button className="ml-3 p-2.5 bg-[#1E3A5F] text-white rounded-xl shadow-md shadow-[#1E3A5F]/20 hover:scale-105 active:scale-95 transition-all">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-medium">Aucune discussion pour le moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/20">
            {threads.map((t, idx) => {
              // Cycle through brand colors for default avatars if not named properly
             const colors = ['bg-[#A7C7E7] text-white', 'bg-[#D1E8E2] text-[#1E3A5F]', 'bg-white/80 border border-gray-200 text-gray-600'];
             const color = colors[idx % colors.length];
             
             return (
              <div key={t.id} onClick={() => setActiveThread(t)} className="px-4 py-4 flex items-center hover:bg-white/40 active:bg-white/60 cursor-pointer transition-colors backdrop-blur-sm">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-bold flex-shrink-0 shadow-sm", color)}>
                  {t.name ? t.name.substring(0, 2).toUpperCase() : 'DI'}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-sm font-bold text-[#1E3A5F] truncate pr-2">{t.name || 'Discussion'}</h3>
                    {t.lastMessageTime && <span className="text-[10px] text-gray-500 whitespace-nowrap font-medium">{format(t.lastMessageTime, 'dd MMM')}</span>}
                  </div>
                  <p className="text-xs text-gray-500 truncate font-medium">{t.lastMessage || 'Nouvelle discussion'}</p>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}
