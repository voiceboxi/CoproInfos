import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { auth } from '../firebase';
import { MessageSquare, Info, Users, LogOut, Building2, Bell, AlertTriangle, Calendar, X } from 'lucide-react';
import { DiscussionsView } from './DiscussionsView';
import { InfosView } from './InfosView';
import { ContactsView } from './ContactsView';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'alert' | 'info' | 'event';
}

const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: '1', title: "Alerte Coupure d'eau", message: "Coupure d'eau prévue pour demain de 9h à 12h dans le bâtiment A.", date: 'Il y a 2h', read: false, type: 'alert' },
  { id: '2', title: 'Rappel Assemblée Générale', message: "L'AG annuelle aura lieu le 15 Juin à 18h dans le hall.", date: 'Hier', read: false, type: 'event' },
  { id: '3', title: 'Nouveau document disponible', message: 'Le compte-rendu de la dernière AG a été ajouté.', date: 'Il y a 3 jours', read: true, type: 'info' }
];

export function AppLayout() {
  const { userProfile, currentResidence } = useAuth();
  const [activeTab, setActiveTab] = useState<'accueil' | 'infos' | 'contact'>('accueil');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    auth.signOut();
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'event': return <Calendar className="w-5 h-5 text-emerald-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
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
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowNotifications(true)}
            className="p-2 text-[#A7C7E7] hover:text-white relative transition-colors rounded-full hover:bg-white/10" 
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1E3A5F]"></span>
            )}
          </button>
          <button onClick={handleLogout} className="p-2 text-[#A7C7E7] hover:text-white transition-colors rounded-full hover:bg-white/10" title="Se déconnecter">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
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

      {/* Notifications Overlay */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#F0F2F5]/95 backdrop-blur-2xl flex flex-col"
          >
            <div className="px-4 py-4 flex items-center justify-between border-b border-white/40 bg-white/30 shrink-0 shadow-sm z-10">
              <h3 className="text-lg font-bold text-[#1E3A5F]">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-[#1E3A5F] px-3 py-1.5 bg-white/50 rounded-full hover:bg-white/80 transition-colors"
                  >
                    Tout marquer comme lu
                  </button>
                )}
                <button 
                  onClick={() => setShowNotifications(false)} 
                  className="p-2 bg-white/50 rounded-full text-gray-500 hover:text-gray-900 shadow-sm border border-white/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-3 pb-[env(safe-area-inset-bottom)] scrollbar-hide">
              {notifications.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm">Aucune notification pour le moment.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={cn(
                      "bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border transition-all cursor-pointer",
                      !notif.read ? "border-[#1E3A5F]/20 shadow-md" : "border-white/50 opacity-70"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2.5 rounded-xl shrink-0 shadow-inner",
                        notif.type === 'alert' ? "bg-orange-50" : 
                        notif.type === 'event' ? "bg-emerald-50" : "bg-blue-50"
                      )}>
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={cn("text-sm font-bold leading-tight", !notif.read ? "text-[#1E3A5F]" : "text-gray-700")}>
                            {notif.title}
                          </h4>
                          {!notif.read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1"></span>}
                        </div>
                        <p className={cn("text-xs leading-relaxed mb-2", !notif.read ? "text-gray-600 font-medium" : "text-gray-500")}>
                          {notif.message}
                        </p>
                        <span className="text-[10px] font-bold text-gray-400">{notif.date}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}