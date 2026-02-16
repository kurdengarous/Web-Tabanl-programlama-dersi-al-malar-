
import React from 'react';
import { Folder, StickyNote, Star, Trash2, Settings, Hash, Sun, Moon } from 'lucide-react';

export const COLORS = [
  'bg-white',
  'bg-green-50',
  'bg-emerald-50',
  'bg-lime-50',
  'bg-teal-50',
  'bg-yellow-50',
  'bg-orange-50'
];

export const NOTE_COLORS = {
  'bg-white': 'border-gray-200',
  'bg-green-50': 'border-green-200',
  'bg-emerald-50': 'border-emerald-200',
  'bg-lime-50': 'border-lime-200',
  'bg-teal-50': 'border-teal-200',
  'bg-yellow-50': 'border-yellow-200',
  'bg-orange-50': 'border-orange-200'
};

export const INITIAL_FOLDERS = [
  { id: 'all', name: 'Tüm Notlar', color: 'text-green-600', icon: 'StickyNote' },
  { id: 'pinned', name: 'Sabitlenenler', color: 'text-yellow-500', icon: 'Star' },
  { id: 'work', name: 'İş', color: 'text-blue-500', icon: 'Folder' },
  { id: 'personal', name: 'Kişisel', color: 'text-purple-500', icon: 'Folder' }
];
