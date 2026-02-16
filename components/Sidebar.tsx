
import React from 'react';
import { 
  Folder as FolderIcon, 
  StickyNote, 
  Star, 
  Plus, 
  Settings,
  LayoutGrid,
  Cloud,
  CloudOff
} from 'lucide-react';
import { Folder } from '../types';

interface SidebarProps {
  folders: Folder[];
  activeFolder: string;
  setActiveFolder: (id: string) => void;
  onDropToFolder: (noteId: string, folderId: string) => void;
  onSettingsClick?: () => void;
  isConnected?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  folders, 
  activeFolder, 
  setActiveFolder,
  onDropToFolder,
  onSettingsClick,
  isConnected
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData('noteId');
    if (noteId) onDropToFolder(noteId, folderId);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen z-10">
      {/* Brand Header */}
      <div className="sidebar-header p-6 text-white mb-4 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-green-900 shadow-lg border-2 border-green-800">
            <StickyNote size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none uppercase">AhEnK</h1>
            <p className="text-[10px] opacity-70 mt-1 font-bold uppercase tracking-widest">
              {isConnected ? 'Bulut Senkronize' : 'Yerel Mod'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-3 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Navigation Sections */}
        <nav className="space-y-1">
          <button 
            onClick={() => setActiveFolder('all')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeFolder === 'all' ? 'bg-gray-100 text-green-900' : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            <LayoutGrid size={18} />
            Tüm Notlar
          </button>
          
          <button 
            onClick={() => setActiveFolder('pinned')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-black transition-all ${
              activeFolder === 'pinned' ? 'bg-[#fbb03b] text-green-900 shadow-xl shadow-orange-100 scale-[1.02]' : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Star size={18} fill={activeFolder === 'pinned' ? "currentColor" : "none"} />
              Favoriler
            </div>
            <span className="text-xs opacity-60 font-black">0</span>
          </button>
        </nav>

        {/* Folders Section */}
        <div>
          <div className="px-4 mb-4">
            <h2 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Klasörler</h2>
          </div>
          <div className="space-y-1">
            {folders.map(folder => (
              <button 
                key={folder.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, folder.id)}
                onClick={() => setActiveFolder(folder.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group ${
                  activeFolder === folder.id ? 'bg-green-50 text-green-800' : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                <FolderIcon size={18} className={activeFolder === folder.id ? 'text-green-600' : 'text-gray-300'} />
                {folder.name}
              </button>
            ))}
            
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-gray-300 hover:text-green-600 transition-all border-2 border-dashed border-transparent hover:border-green-100 mt-2">
              <Plus size={18} />
              Klasör Oluştur
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer Settings */}
      <div className="p-4 border-t border-gray-50">
        <button 
          onClick={onSettingsClick}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-black text-gray-500 hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
        >
          <div className="flex items-center gap-3">
            <Settings size={18} />
            Ayarlar & Bağlan
          </div>
          {isConnected ? (
            <Cloud size={14} className="text-green-500" />
          ) : (
            <CloudOff size={14} className="text-amber-400" />
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
