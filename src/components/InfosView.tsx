import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { DocumentInfo } from '../types';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { FileText, Download, Phone, Shield, Wrench, Zap, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EmergencyNumber {
  id: string;
  role: string;
  name: string;
  phone: string;
  icon: React.ElementType;
  colorClass: string;
}

const EMERGENCY_NUMBERS: EmergencyNumber[] = [
  { id: '1', role: 'Syndic', name: 'Cabinet Dupont & Associés', phone: '01 23 45 67 89', icon: Building2, colorClass: 'bg-blue-50 text-blue-600' },
  { id: '2', role: 'Gardien', name: 'M. Martin (Loge bâtiment A)', phone: '06 12 34 56 78', icon: Shield, colorClass: 'bg-emerald-50 text-emerald-600' },
  { id: '3', role: 'Plombier d\'urgence', name: 'Aqua Pro Interventions', phone: '01 98 76 54 32', icon: Wrench, colorClass: 'bg-orange-50 text-orange-600' },
  { id: '4', role: 'Électricien', name: 'Elec Rapide 24/7', phone: '01 45 67 89 01', icon: Zap, colorClass: 'bg-yellow-50 text-yellow-600' },
];

const MOCK_DOCS: DocumentInfo[] = [
  { id: 'mock1', title: 'Règlement de copropriété', category: 'Statuts', fileUrl: 'https://example.com/reglement.pdf', createdAt: new Date('2020-01-15T10:00:00Z').getTime() },
  { id: 'mock2', title: 'Compte-rendu AG 2025', category: 'Assemblées', fileUrl: 'https://example.com/cr-ag-2025.pdf', createdAt: new Date('2025-05-20T14:30:00Z').getTime() },
  { id: 'mock3', title: 'Budget prévisionnel 2026', category: 'Finances', fileUrl: 'https://example.com/budget.pdf', createdAt: new Date('2025-12-05T09:15:00Z').getTime() },
  { id: 'mock4', title: 'Notice utilisation interphone', category: 'Guides', fileUrl: 'https://example.com/notice.pdf', createdAt: new Date('2023-08-10T11:00:00Z').getTime() },
  { id: 'mock5', title: 'Plan des parkings', category: 'Plans', fileUrl: 'https://example.com/parkings.pdf', createdAt: new Date('2018-04-20T08:00:00Z').getTime() },
];

export function InfosView() {
  const { currentResidence } = useAuth();
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [filter, setFilter] = useState<string>('Tous');
  const [activeTab, setActiveTab] = useState<'documents' | 'urgences'>('documents');

  useEffect(() => {
    if (!currentResidence) return;
    const q = query(
        collection(db, `residences/${currentResidence.id}/documents`),
        orderBy('createdAt', 'desc')
    );
    const snap = onSnapshot(q, (snapshot) => {
      setDocuments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DocumentInfo)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'documents', {}));
    return snap;
  }, [currentResidence]);

  const allDocs = [...documents, ...MOCK_DOCS].sort((a, b) => b.createdAt - a.createdAt);
  const categories = ['Tous', ...Array.from(new Set(allDocs.map(d => d.category)))];
  const filteredDocs = filter === 'Tous' ? allDocs : allDocs.filter(d => d.category === filter);

  return (
    <div className="h-full flex flex-col bg-[#F9F9FB]">
      <div className="bg-white px-4 pt-3 border-b border-gray-100 shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations & Numéros</h2>
        <div className="flex space-x-4 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('documents')}
            className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'documents' ? 'text-[#1E3A5F]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Documents
            {activeTab === 'documents' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1E3A5F] rounded-t-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('urgences')}
            className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'urgences' ? 'text-[#1E3A5F]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Numéros utiles
            {activeTab === 'urgences' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1E3A5F] rounded-t-full" />}
          </button>
        </div>
        
        {activeTab === 'documents' && (
          <div className="flex space-x-2 overflow-x-auto py-3 scrollbar-hide">
            {categories.map(cat => (
               <button 
                 key={cat}
                 onClick={() => setFilter(cat)}
                 className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filter === cat ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               >
                 {cat}
               </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 relative">
        {activeTab === 'documents' ? (
          <div className="space-y-4 pb-[env(safe-area-inset-bottom)]">
            {filteredDocs.length === 0 ? (
               <div className="text-center py-10 text-gray-500">
                 <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                 <p className="text-sm">Aucun document dans cette catégorie.</p>
               </div>
            ) : (
              filteredDocs.map(doc => (
                <div key={doc.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start">
                  <div className="p-3 bg-red-50 rounded-lg text-red-500 mr-4 shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1E3A5F] mb-1 uppercase tracking-wider">{doc.category}</p>
                    <h3 className="text-sm font-semibold text-gray-900 leading-tight mb-1 truncate">{doc.title}</h3>
                    <p className="text-xs text-gray-500">{format(doc.createdAt, 'dd MMMM yyyy', { locale: fr })}</p>
                  </div>
                  <button 
                    onClick={() => window.open(doc.fileUrl, '_blank')}
                    className="p-2 ml-2 text-gray-400 hover:text-[#1E3A5F] transition-colors rounded-full hover:bg-gray-50"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
           </div>
        ) : (
          <div className="space-y-4 pb-[env(safe-area-inset-bottom)]">
            {EMERGENCY_NUMBERS.map(num => (
              <div key={num.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
                <div className={`p-3 rounded-lg mr-4 shrink-0 ${num.colorClass}`}>
                  <num.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">{num.role}</p>
                  <h3 className="text-sm font-medium text-gray-900 leading-tight truncate">{num.name}</h3>
                  <a href={`tel:${num.phone.replace(/\s+/g, '')}`} className="text-base font-semibold text-[#1E3A5F] mt-1 block">
                    {num.phone}
                  </a>
                </div>
                <a 
                  href={`tel:${num.phone.replace(/\s+/g, '')}`}
                  className="p-3 ml-2 text-white bg-[#1E3A5F] hover:bg-[#152a46] transition-colors rounded-full shadow-sm active:scale-95"
                >
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}