
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import NoteCard from './components/NoteCard';
import FirebaseModal from './components/FirebaseModal';
import { db } from './services/dbService';
import { geminiService } from './services/geminiService';
import { Note, Folder } from './types';
import { Plus, X, Sparkles, Check, Search, FolderOpen, Link as LinkIcon, Cloud } from 'lucide-react';
import { COLORS } from './constants';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolder, setActiveFolder] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState<Partial<Note> | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(db.isConnected());

  useEffect(() => {
    let unsubscribe = db.subscribeNotes(setNotes);
    setFolders(db.getFolders());
    return () => unsubscribe();
  }, [isConnected]);

  const filteredNotes = useMemo(() => {
    let result = [...notes];
    
    if (activeFolder === 'pinned') {
      result = result.filter(n => n.isPinned);
    } else if (activeFolder !== 'all') {
      result = result.filter(n => n.folderId === activeFolder);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => 
        (n.title?.toLowerCase() || '').includes(q) || 
        (n.content?.toLowerCase() || '').includes(q) ||
        (n.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [notes, activeFolder, searchQuery]);

  const handleSaveNote = async () => {
    if (!currentNote) return;
    
    const noteData = {
      title: currentNote.title || '',
      content: currentNote.content || '',
      folderId: currentNote.folderId || 'work',
      color: currentNote.color || 'bg-white',
      isPinned: currentNote.isPinned || false,
      tags: currentNote.tags || [],
      createdAt: currentNote.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    if (currentNote.id) {
      await db.updateNote(currentNote.id, noteData);
    } else {
      await db.addNote(noteData);
    }
    
    setIsEditorOpen(false);
    setCurrentNote(null);
  };

  const handleDropToFolder = async (noteId: string, folderId: string) => {
    await db.updateNote(noteId, { folderId });
  };

  const handleQuickAiAnalysis = async (note: Note) => {
    setIsAiLoading(true);
    try {
      const result = await geminiService.suggestTagsAndSummary(note.content);
      await db.updateNote(note.id, {
        tags: Array.from(new Set([...note.tags, ...result.tags]))
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFirebaseConnect = (config: any) => {
    db.initialize(config);
    setIsConnected(true);
    // Refresh connection by triggering effect
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] text-gray-800">
      <Sidebar 
        folders={folders} 
        activeFolder={activeFolder} 
        setActiveFolder={setActiveFolder}
        onDropToFolder={handleDropToFolder}
        // Custom hack to handle sidebar events locally for this demo
        onSettingsClick={() => setIsFirebaseModalOpen(true)}
        isConnected={isConnected}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Main Header with Search and New Note */}
        <header className="px-10 py-5 bg-white border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-6 flex-1">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="text"
                placeholder="Notlarda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-full py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-green-400 outline-none transition-all placeholder:text-gray-300"
              />
            </div>
            {!isConnected && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100 animate-pulse">
                <Cloud size={14} />
                Buluta Bağlı Değil (Yerel Mod)
              </div>
            )}
          </div>
          
          <button 
            onClick={() => {
              setCurrentNote({ folderId: activeFolder === 'all' || activeFolder === 'pinned' ? 'work' : activeFolder, color: 'bg-white', tags: [] });
              setIsEditorOpen(true);
            }}
            className="bg-green-800 hover:bg-green-900 text-white px-6 py-2.5 rounded-full flex items-center gap-2 font-bold shadow-lg shadow-green-900/10 transition-all transform hover:scale-105 active:scale-95 text-sm"
          >
            <Plus size={18} strokeWidth={3} />
            Yeni Not
          </button>
        </header>

        {/* Notes Grid */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="mb-8 flex justify-between items-end">
             <div>
               <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                 {activeFolder === 'all' ? 'Tüm Notlarım' : 
                  activeFolder === 'pinned' ? 'Favoriler' : 
                  folders.find(f => f.id === activeFolder)?.name}
               </h2>
               <p className="text-gray-400 text-sm font-bold mt-1 uppercase tracking-widest">{filteredNotes.length} Kayıtlı Not</p>
             </div>
             {isConnected && (
               <div className="text-[10px] font-bold text-green-500 bg-green-50 px-3 py-1 rounded-full uppercase tracking-tighter flex items-center gap-1">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
                 Gerçek Zamanlı Senkronizasyon Aktif
               </div>
             )}
          </div>

          {filteredNotes.length === 0 ? (
            <div className="h-[50vh] flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                <FolderOpen size={42} className="text-gray-300" />
              </div>
              <p className="text-lg font-bold text-gray-400">Bu görünümde not bulunamadı.</p>
              <button 
                onClick={() => setIsEditorOpen(true)}
                className="mt-4 text-green-600 font-bold hover:underline"
              >
                Yeni bir tane oluşturmayı dene →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 pb-20">
              {filteredNotes.map(note => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  onEdit={(n) => { setCurrentNote(n); setIsEditorOpen(true); }}
                  onDelete={(id) => db.deleteNote(id)}
                  onPin={(id, isPinned) => db.updateNote(id, { isPinned })}
                  onAI={handleQuickAiAnalysis}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Firebase Config Modal */}
      <FirebaseModal 
        isOpen={isFirebaseModalOpen} 
        onClose={() => setIsFirebaseModalOpen(false)} 
        onConnect={handleFirebaseConnect}
      />

      {/* Note Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-green-900/20 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl transform transition-all border border-white">
            <div className="flex justify-between items-center p-10 border-b border-gray-50">
              <h3 className="text-2xl font-black text-green-900">Not Detayları</h3>
              <button onClick={() => setIsEditorOpen(false)} className="text-gray-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full">
                <X size={28} />
              </button>
            </div>
            
            <div className="p-10">
              <input 
                type="text" 
                placeholder="İlham verici bir başlık..."
                className="w-full text-3xl font-black border-none focus:ring-0 outline-none mb-6 placeholder:text-gray-200"
                value={currentNote?.title || ''}
                onChange={(e) => setCurrentNote(prev => ({ ...prev, title: e.target.value }))}
              />
              
              <textarea 
                placeholder="Düşüncelerini buraya dök..."
                className="w-full h-56 border-none focus:ring-0 outline-none resize-none text-lg text-gray-600 leading-relaxed custom-scrollbar mb-8 font-medium"
                value={currentNote?.content || ''}
                onChange={(e) => setCurrentNote(prev => ({ ...prev, content: e.target.value }))}
              />

              <div className="flex items-center justify-between mb-10">
                <div className="flex gap-3">
                  {COLORS.map(color => (
                    <button 
                      key={color}
                      onClick={() => setCurrentNote(prev => ({ ...prev, color }))}
                      className={`w-10 h-10 rounded-2xl border-4 transition-all ${color} ${currentNote?.color === color ? 'border-green-800 scale-110 shadow-lg' : 'border-white shadow-sm hover:scale-105'}`}
                    />
                  ))}
                </div>
                
                <button 
                  onClick={() => handleQuickAiAnalysis(currentNote as Note)}
                  disabled={isAiLoading || !currentNote?.content}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 text-white text-sm font-black hover:bg-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-200"
                >
                  <Sparkles size={18} className={isAiLoading ? 'animate-spin' : ''} />
                  AI Zekası
                </button>
              </div>

              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => setIsEditorOpen(false)}
                  className="px-8 py-4 rounded-3xl text-sm font-black text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Vazgeç
                </button>
                <button 
                  onClick={handleSaveNote}
                  className="bg-green-800 hover:bg-green-900 text-white px-10 py-4 rounded-3xl flex items-center gap-2 font-black transition-all shadow-xl shadow-green-900/20 active:scale-95"
                >
                  <Check size={22} strokeWidth={3} />
                  Notu Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isAiLoading && (
        <div className="fixed bottom-10 right-10 bg-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 z-[100] border-2 border-purple-100 animate-bounce cursor-wait">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <span className="font-black text-purple-900 text-sm tracking-tight">AhEnK AI analiz ediyor...</span>
        </div>
      )}
    </div>
  );
};

export default App;
