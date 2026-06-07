import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { Member, User } from '../types';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { UserCircle, Search, MessageSquare } from 'lucide-react';

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

      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-50">
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
      </div>
    </div>
  );
}