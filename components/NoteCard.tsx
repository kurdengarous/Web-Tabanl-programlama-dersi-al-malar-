
import React from 'react';
import { Star, Trash2, Edit3, Sparkles } from 'lucide-react';
import { Note } from '../types';
import { NOTE_COLORS } from '../constants';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onPin: (id: string, isPinned: boolean) => void;
  onAI: (note: Note) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onEdit, onDelete, onPin, onAI }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('noteId', note.id);
    e.dataTransfer.effectAllowed = 'move';
    // Adding a slight visual feedback for dragging
    const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
    ghost.style.opacity = '0.5';
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      className={`group relative p-7 rounded-[2.5rem] border-2 cursor-grab active:cursor-grabbing transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl ${note.color} ${NOTE_COLORS[note.color as keyof typeof NOTE_COLORS] || 'border-transparent shadow-sm'}`}
      style={{ minHeight: '200px' }}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-800 line-clamp-1 pr-8">{note.title || 'Yeni Not'}</h3>
        <button 
          onClick={() => onPin(note.id, !note.isPinned)}
          className={`absolute top-6 right-6 p-2 rounded-full transition-all ${note.isPinned ? 'text-yellow-500 bg-yellow-50 scale-110 shadow-sm' : 'text-gray-300 hover:bg-gray-100 hover:text-yellow-400'}`}
        >
          <Star size={20} fill={note.isPinned ? "currentColor" : "none"} strokeWidth={2.5} />
        </button>
      </div>
      
      <p className="text-[15px] text-gray-500 line-clamp-4 leading-relaxed font-medium mb-6">
        {note.content || 'Henüz içerik eklenmedi...'}
      </p>

      <div className="flex flex-wrap gap-1.5 mt-auto">
        {note.tags.map((tag, idx) => (
          <span key={idx} className="text-[10px] font-extrabold px-3 py-1 bg-black/5 rounded-full text-gray-500 uppercase tracking-tight">
            #{tag}
          </span>
        ))}
      </div>

      <div className="absolute bottom-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
        <button 
          onClick={() => onAI(note)}
          className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl hover:bg-purple-100 transition-colors shadow-sm"
          title="AI Analiz"
        >
          <Sparkles size={18} />
        </button>
        <button 
          onClick={() => onEdit(note)}
          className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors shadow-sm"
        >
          <Edit3 size={18} />
        </button>
        <button 
          onClick={() => onDelete(note.id)}
          className="p-2.5 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors shadow-sm"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="absolute bottom-6 left-8 text-[11px] font-bold text-gray-300 uppercase tracking-widest">
        {new Date(note.updatedAt).toLocaleDateString('tr-TR')}
      </div>
    </div>
  );
};

export default NoteCard;
