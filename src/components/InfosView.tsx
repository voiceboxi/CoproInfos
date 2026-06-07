import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { DocumentInfo } from '../types';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { FileText, Download, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function InfosView() {
  const { currentResidence } = useAuth();
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [filter, setFilter] = useState<string>('Tous');

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

  const categories = ['Tous', ...Array.from(new Set(documents.map(d => d.category)))];
  const filteredDocs = filter === 'Tous' ? documents : documents.filter(d => d.category === filter);

  return (
    <div className="h-full flex flex-col bg-[#F9F9FB]">
      <div className="bg-white px-4 py-3 border-b border-gray-100 shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Informations officielles</h2>
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
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
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
    </div>
  );
}