/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthProvider, useAuth } from './components/AuthProvider';
import { AuthView } from './components/Auth';
import { AppLayout } from './components/AppLayout';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] relative flex flex-col justify-center items-center overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-[#1E3A5F] rounded-full blur-[120px] opacity-10 pointer-events-none z-0"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-[#D1E8E2] rounded-full blur-[120px] opacity-40 pointer-events-none z-0"></div>
        <Loader2 className="animate-spin h-8 w-8 text-[#1E3A5F] relative z-10" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#F0F2F5] relative flex flex-col overflow-hidden font-sans">
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-[#1E3A5F] rounded-full blur-[120px] opacity-10 pointer-events-none z-0"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-[#D1E8E2] rounded-full blur-[120px] opacity-40 pointer-events-none z-0"></div>
      
      <div className="relative z-10 flex flex-col flex-1 h-[100dvh]">
        {user ? <AppLayout /> : <AuthView />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
