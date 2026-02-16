
import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Plus, X, Sparkles, Check, Search, FolderOpen, Star, Trash2, 
  Edit3, LayoutGrid, Settings, Cloud, CloudOff, StickyNote, Folder as FolderIcon,
  AlertTriangle
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, updateDoc, deleteDoc, 
  doc, onSnapshot, query, orderBy, Firestore
} from 'firebase/firestore';

// --- SABİTLER ---
const COLORS = [
  'bg-white', 'bg-green-50', 'bg-emerald-50', 'bg-lime-50', 
  'bg-teal-50', 'bg-yellow-50', 'bg-orange-50'
];

const NOTE_COLORS: Record<string, string> = {
  'bg-white': 'border-gray-200',
  'bg-green-50': 'border-green-200',
  'bg-emerald-50': 'border-emerald-200',
  'bg-lime-50': 'border-lime-200',
  'bg-teal-50': 'border-teal-200',
  'bg-yellow-50': 'border-yellow-200',
  'bg-orange-50': 'border-orange-200'
};

// --- SERVİSLER ---
class FirebaseDB {
  public db: Firestore | null = null;
  public app: FirebaseApp | null = null;

  constructor() {
    const saved = localStorage.getItem('firebase_config');
    if (saved) try { this.connect(JSON.parse(saved)); } catch (e) {}
  }

  connect(config: any) {
    if (getApps().length > 0) return;
    this.app = initializeApp(config);
    this.db = getFirestore(this.app);
    localStorage.setItem('firebase_config', JSON.stringify(config));
  }

  get isConnected() { return !!this.db; }
}

const fdb = new FirebaseDB();
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// --- BİLEŞENLER ---

const FirebaseModal = ({ isOpen, onClose, onConnect }: any) => {
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  if (!isOpen) return null;

  const handleConnect = () => {
    try {
      let clean = text.trim();
      if (clean.includes('const firebaseConfig =')) clean = clean.split('=')[1].split(';')[0].trim();
      const cfg = new Function(`return ${clean}`)();
      if (!cfg.apiKey) throw new Error();
      onConnect(cfg);
      onClose();
    } catch (e) { setErr('Geçersiz format. Lütfen Firebase config objesini yapıştırın.'); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl scale-in-center">
        <div className="bg-[#a50034] p-7 text-white flex justify-between items-center">
          <div className="flex items-center gap-3"><Cloud size={24} /><h2 className="text-xl font-bold">Firebase Kurulumu</h2></div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={24} /></button>
        </div>
        <div className="p-10">
          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 mb-8 text-amber-800 text-sm">
            <div className="flex items-center gap-2 mb-2 font-bold"><AlertTriangle size={18} />Önemli</div>
            <p>Notlarınızı bulutla senkronize etmek için config objesini buraya yapıştırın.</p>
          </div>
          <textarea 
            placeholder={`const firebaseConfig = {\n  apiKey: "...",\n  ...\n};`}
            className="w-full h-48 bg-gray-50 border border-gray-200 rounded-[2rem] p-6 font-mono text-xs focus:ring-4 focus:ring-[#fbb03b]/20 focus:border-[#fbb03b] outline-none mb-6 transition-all"
            value={text} onChange={(e) => { setText(e.target.value); setErr(''); }}
          />
          {err && <p className="text-red-500 text-xs mb-4 font-bold">{err}</p>}
          <div className="flex justify-end gap-4">
            <button onClick={onClose} className="px-8 py-4 rounded-2xl font-bold text-gray-400 bg-gray-100 hover:bg-gray-200 transition-all">Kapat</button>
            <button onClick={handleConnect} className="bg-[#fbb03b] text-green-900 px-10 py-4 rounded-2xl font-black shadow-xl shadow-orange-100 hover:shadow-orange-200 hover:-translate-y-1 active:scale-95 transition-all">Kaydet ve Bağlan</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NoteCard = ({ note, onEdit, onDelete, onPin, onAI }: any) => {
  return (
    <div 
      draggable 
      onDragStart={(e) => e.dataTransfer.setData('noteId', note.id)}
      className={`group relative p-8 rounded-[3rem] border-2 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.03] hover:shadow-2xl ${note.color} ${NOTE_COLORS[note.color] || 'border-transparent shadow-sm'}`}
      style={{ minHeight: '220px' }}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-black text-gray-900 line-clamp-1 pr-10">{note.title || 'Başlıksız Not'}</h3>
        <button onClick={() => onPin(note.id, !note.isPinned)} className={`absolute top-8 right-8 p-2.5 rounded-2xl transition-all ${note.isPinned ? 'text-yellow-500 bg-white shadow-md scale-110' : 'text-gray-300 hover:bg-white/50 hover:text-yellow-400'}`}>
          <Star size={22} fill={note.isPinned ? "currentColor" : "none"} strokeWidth={2.5} />
        </button>
      </div>
      <p className="text-[16px] text-gray-500 line-clamp-4 leading-relaxed font-semibold mb-8 opacity-80">{note.content || 'İçerik henüz eklenmemiş...'}</p>
      <div className="flex flex-wrap gap-2 mt-auto">
        {(note.tags || []).map((t: string, i: number) => <span key={i} className="text-[10px] font-black px-4 py-1.5 bg-white/40 backdrop-blur-sm border border-white/50 rounded-full text-gray-600 uppercase tracking-tighter shadow-sm">#{t}</span>)}
      </div>
      <div className="absolute bottom-8 right-8 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
        <button onClick={() => onAI(note)} className="p-3 bg-purple-100/50 text-purple-600 rounded-2xl hover:bg-purple-600 hover:text-white shadow-lg transition-all"><Sparkles size={20} /></button>
        <button onClick={() => onEdit(note)} className="p-3 bg-blue-100/50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white shadow-lg transition-all"><Edit3 size={20} /></button>
        <button onClick={() => onDelete(note.id)} className="p-3 bg-red-100/50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white shadow-lg transition-all"><Trash2 size={20} /></button>
      </div>
    </div>
  );
};

// --- ANA UYGULAMA ---
const App = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [folders] = useState([
    { id: 'work', name: 'İş', icon: FolderIcon },
    { id: 'personal', name: 'Kişisel', icon: FolderIcon },
    { id: 'ideas', name: 'Fikirler', icon: FolderIcon }
  ]);
  const [activeFolder, setActiveFolder] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isFirebaseOpen, setIsFirebaseOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(fdb.isConnected);

  useEffect(() => {
    if (!fdb.db) {
      const saved = localStorage.getItem('notes_fallback');
      setNotes(saved ? JSON.parse(saved) : []);
      return;
    }
    const q = query(collection(fdb.db, 'notes'), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (s) => setNotes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [isConnected]);

  const filtered = useMemo(() => {
    return notes.filter(n => {
      const matchesFolder = activeFolder === 'all' ? true : (activeFolder === 'pinned' ? n.isPinned : n.folderId === activeFolder);
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFolder && matchesSearch;
    });
  }, [notes, activeFolder, searchQuery]);

  const handleSave = async () => {
    const data = { ...currentNote, updatedAt: Date.now(), createdAt: currentNote.createdAt || Date.now() };
    if (!fdb.db) {
      const newNotes = currentNote.id ? notes.map(n => n.id === currentNote.id ? data : n) : [{ ...data, id: Date.now().toString() }, ...notes];
      setNotes(newNotes);
      localStorage.setItem('notes_fallback', JSON.stringify(newNotes));
    } else {
      if (currentNote.id) await updateDoc(doc(fdb.db, 'notes', currentNote.id), data);
      else await addDoc(collection(fdb.db, 'notes'), data);
    }
    setIsEditorOpen(false);
  };

  const handleAiRefine = async (n: any) => {
    setIsAiLoading(true);
    try {
      const res = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Bu metinden 3 adet etiket çıkar ve JSON olarak 'tags' dizisi döndür: ${n.content}`,
        config: { 
          responseMimeType: "application/json",
          responseSchema: { type: Type.OBJECT, properties: { tags: { type: Type.ARRAY, items: { type: Type.STRING } } } }
        }
      });
      const tags = JSON.parse(res.text).tags;
      if (n.id) {
        if (fdb.db) await updateDoc(doc(fdb.db, 'notes', n.id), { tags });
        else setNotes(notes.map(item => item.id === n.id ? { ...item, tags } : item));
      } else {
        setCurrentNote((prev: any) => ({ ...prev, tags: Array.from(new Set([...(prev.tags || []), ...tags])) }));
      }
    } catch (e) {} finally { setIsAiLoading(false); }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7f6] text-gray-800">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col h-screen z-10">
        <div className="sidebar-header p-8 text-white mb-6 rounded-br-[3rem]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-green-900 border-2 border-green-800 shadow-xl scale-110"><StickyNote size={24} strokeWidth={3} /></div>
            <div><h1 className="text-2xl font-black uppercase tracking-tighter leading-none">AhEnK</h1><p className="text-[10px] opacity-80 font-black uppercase tracking-widest mt-1">{isConnected ? 'Bulut Canlı' : 'Yerel Veri'}</p></div>
          </div>
        </div>
        <div className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar">
          <nav className="space-y-2">
            <button onClick={() => setActiveFolder('all')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-sm font-black transition-all ${activeFolder === 'all' ? 'bg-green-50 text-green-800 shadow-inner' : 'text-gray-400 hover:bg-gray-50'}`}><LayoutGrid size={20} />Tüm Notlar</button>
            <button onClick={() => setActiveFolder('pinned')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-sm font-black transition-all ${activeFolder === 'pinned' ? 'bg-[#fbb03b] text-green-900 shadow-2xl shadow-orange-200' : 'text-gray-400 hover:bg-gray-50'}`}><Star size={20} />Favoriler</button>
          </nav>
          <div className="px-6"><h2 className="text-[11px] font-black text-gray-300 uppercase tracking-[0.3em] mb-6">Kategoriler</h2>
            <div className="space-y-2">
              {folders.map(f => (
                <button 
                  key={f.id} 
                  onClick={() => setActiveFolder(f.id)} 
                  onDragOver={e => e.preventDefault()}
                  onDrop={async e => { e.preventDefault(); const nid = e.dataTransfer.getData('noteId'); if (fdb.db) await updateDoc(doc(fdb.db, 'notes', nid), { folderId: f.id }); else setNotes(notes.map(x => x.id === nid ? { ...x, folderId: f.id } : x)); }}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-sm font-black transition-all ${activeFolder === f.id ? 'bg-green-50 text-green-800' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                  <FolderIcon size={20} className={activeFolder === f.id ? 'text-green-600' : 'text-gray-300'} />{f.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6">
          <button onClick={() => setIsFirebaseOpen(true)} className="w-full flex items-center justify-between px-6 py-4 rounded-3xl text-sm font-black text-gray-500 bg-gray-50 hover:bg-white border-2 border-transparent hover:border-gray-100 transition-all shadow-sm">
            <div className="flex items-center gap-3"><Settings size={18} />Sistem</div>{isConnected ? <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-green-500/50 shadow-lg"></div> : <CloudOff size={16} className="text-amber-400" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-12 py-8 bg-transparent flex items-center justify-between">
          <div className="relative w-full max-w-xl group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors" size={20} />
            <input type="text" placeholder="Notlarda ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border-none rounded-[2rem] py-4 pl-14 pr-6 text-sm font-bold shadow-xl shadow-gray-200/50 focus:ring-4 focus:ring-green-500/10 outline-none transition-all" />
          </div>
          <button onClick={() => { setCurrentNote({ folderId: 'work', color: 'bg-white', tags: [], title: '', content: '' }); setIsEditorOpen(true); }} className="bg-green-800 hover:bg-green-900 text-white px-8 py-4 rounded-3xl flex items-center gap-3 font-black shadow-2xl shadow-green-900/20 active:scale-95 transition-all"><Plus size={22} />Yeni Not</button>
        </header>

        <div className="flex-1 overflow-y-auto px-12 pb-12 custom-scrollbar">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">
                {activeFolder === 'all' ? 'Tüm Notlarım' : activeFolder === 'pinned' ? 'Favori Notlarım' : `${activeFolder} Klasörü`}
              </h2>
              <div className="h-1.5 w-20 bg-green-500 rounded-full mt-2"></div>
            </div>
          </div>
          
          {filtered.length === 0 ? (
            <div className="h-[50vh] flex flex-col items-center justify-center text-center opacity-30">
              <div className="w-32 h-32 bg-gray-200 rounded-[3rem] flex items-center justify-center mb-6 shadow-inner"><FolderOpen size={48} /></div>
              <p className="font-black text-xl uppercase tracking-widest">Not bulunamadı</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10">
              {filtered.map(n => <NoteCard key={n.id} note={n} onEdit={(note: any) => { setCurrentNote(note); setIsEditorOpen(true); }} onDelete={async (id: string) => { if (fdb.db) await deleteDoc(doc(fdb.db, 'notes', id)); else setNotes(notes.filter(x => x.id !== id)); }} onPin={async (id: string, p: boolean) => { if (fdb.db) await updateDoc(doc(fdb.db, 'notes', id), { isPinned: p }); else setNotes(notes.map(x => x.id === id ? { ...x, isPinned: p } : x)); }} onAI={handleAiRefine} />)}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <FirebaseModal isOpen={isFirebaseOpen} onClose={() => setIsFirebaseOpen(false)} onConnect={(cfg: any) => { fdb.connect(cfg); setIsConnected(true); }} />
      
      {/* İYİLEŞTİRİLMİŞ NOT EDİTÖRÜ */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-green-900/30 backdrop-blur-xl animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] overflow-hidden shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] border border-white/40 scale-in-center">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-12 py-10 border-b border-gray-50/50 bg-white/50">
              <h3 className="text-3xl font-black text-green-900 tracking-tighter">Notu Düzenle</h3>
              <button 
                onClick={() => setIsEditorOpen(false)} 
                className="text-gray-300 hover:text-red-500 p-3 hover:bg-red-50 rounded-[1.5rem] transition-all"
              >
                <X size={32} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-12">
              <div className="mb-8">
                <input 
                  type="text" 
                  placeholder="Başlık..." 
                  className="w-full text-4xl font-black border-none focus:ring-0 outline-none mb-4 placeholder:text-gray-200 transition-all text-gray-800"
                  value={currentNote?.title} 
                  onChange={e => setCurrentNote((prev: any) => ({ ...prev, title: e.target.value }))} 
                />
                <div className="h-1.5 w-24 bg-green-100 rounded-full"></div>
              </div>

              <textarea 
                placeholder="Neler düşünüyorsun?" 
                className="w-full h-64 border-none focus:ring-0 outline-none resize-none text-xl text-gray-600 leading-relaxed font-bold placeholder:text-gray-200 custom-scrollbar"
                value={currentNote?.content} 
                onChange={e => setCurrentNote((prev: any) => ({ ...prev, content: e.target.value }))} 
              />
              
              {/* Etiketler Bölümü */}
              <div className="flex flex-wrap gap-2 mb-10">
                {(currentNote?.tags || []).map((t: string, i: number) => (
                  <span key={i} className="px-4 py-2 bg-purple-50 text-purple-700 text-xs font-black rounded-2xl border border-purple-100 uppercase tracking-tight flex items-center gap-2">
                    #{t}
                    <X size={14} className="cursor-pointer hover:text-red-500" onClick={() => setCurrentNote((p: any) => ({ ...p, tags: p.tags.filter((_: any, idx: number) => idx !== i) }))} />
                  </span>
                ))}
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between mb-12">
                <div className="flex gap-4">
                  {COLORS.map(c => (
                    <button 
                      key={c} 
                      onClick={() => setCurrentNote((p: any) => ({ ...p, color: c }))} 
                      className={`w-12 h-12 rounded-[1.25rem] border-4 transition-all shadow-sm ${c} ${currentNote?.color === c ? 'border-green-800 scale-110 shadow-xl' : 'border-white hover:scale-110'}`} 
                    />
                  ))}
                </div>
                
                <button 
                  onClick={() => handleAiRefine(currentNote)} 
                  disabled={isAiLoading || !currentNote?.content} 
                  className="flex items-center gap-3 px-8 py-4 rounded-3xl bg-purple-600 text-white text-sm font-black hover:bg-purple-700 hover:shadow-2xl hover:shadow-purple-200 transition-all disabled:opacity-50 disabled:grayscale group"
                >
                  <Sparkles size={20} className={isAiLoading ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'} />
                  AI Etiketle
                </button>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end items-center gap-6">
                <button 
                  onClick={() => setIsEditorOpen(false)} 
                  className="px-10 py-5 rounded-3xl text-sm font-black text-gray-400 hover:text-gray-700 transition-all"
                >
                  Vazgeç
                </button>
                <button 
                  onClick={handleSave} 
                  className="bg-green-800 hover:bg-green-900 text-white px-14 py-5 rounded-[2rem] flex items-center gap-3 font-black shadow-[0_15px_40px_-10px_rgba(6,78,59,0.3)] hover:shadow-[0_20px_50px_-10px_rgba(6,78,59,0.4)] hover:-translate-y-1 active:scale-95 transition-all"
                >
                  <Check size={24} strokeWidth={3} />
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAiLoading && (
        <div className="fixed bottom-12 right-12 bg-white px-10 py-6 rounded-[2.5rem] shadow-2xl flex items-center gap-5 z-[300] border-2 border-purple-100 animate-float">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-200"><Sparkles size={24} className="animate-pulse" /></div>
          <span className="font-black text-purple-900 text-lg tracking-tight">AhEnK AI analiz ediyor...</span>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
