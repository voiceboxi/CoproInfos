import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { auth } from '../firebase';
import { MessageSquare, Info, Users, LogOut, Building2 } from 'lucide-react';
import { DiscussionsView } from './DiscussionsView';
import { InfosView } from './InfosView';
import { ContactsView } from './ContactsView';
import { cn } from '../lib/utils';

export function AppLayout() {
  const { userProfile, currentResidence } = useAuth();
  const [activeTab, setActiveTab] = useState<'accueil' | 'infos' | 'contact'>('accueil');

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F9F9FB] font-sans">
      {/* Header */}
      <header className="bg-[#1E3A5F] text-white px-4 py-3 flex items-center justify-between shadow-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white flex items-center justify-center rounded-xl shadow-sm">
            <Building2 className="w-6 h-6 text-[#1E3A5F]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">{currentResidence?.name || 'CoproInfos'}</h1>
            <p className="text-xs text-[#A7C7E7]">Connecté en tant que {userProfile?.name}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2 text-[#A7C7E7] hover:text-white transition-colors rounded-full hover:bg-white/10" title="Se déconnecter">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'accueil' && <DiscussionsView />}
        {activeTab === 'infos' && <InfosView />}
        {activeTab === 'contact' && <ContactsView />}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 flex justify-around items-center pb-[env(safe-area-inset-bottom)] shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setActiveTab('accueil')}
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-3 transition-colors",
            activeTab === 'accueil' ? "text-[#1E3A5F]" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <MessageSquare className={cn("w-6 h-6 mb-1", activeTab === 'accueil' && "fill-current opacity-20")} />
          <span className="text-[10px] font-medium tracking-wide">Accueil</span>
        </button>
        
        <button
          onClick={() => setActiveTab('infos')}
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-3 transition-colors",
            activeTab === 'infos' ? "text-[#1E3A5F]" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Info className={cn("w-6 h-6 mb-1", activeTab === 'infos' && "fill-current opacity-20")} />
          <span className="text-[10px] font-medium tracking-wide">Infos</span>
        </button>

        <button
          onClick={() => setActiveTab('contact')}
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-3 transition-colors",
            activeTab === 'contact' ? "text-[#1E3A5F]" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Users className={cn("w-6 h-6 mb-1", activeTab === 'contact' && "fill-current opacity-20")} />
          <span className="text-[10px] font-medium tracking-wide">Contact</span>
        </button>
      </nav>
    </div>
  );
}