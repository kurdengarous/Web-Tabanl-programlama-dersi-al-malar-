
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  Firestore,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { Note, Folder } from '../types';

class DatabaseService {
  private db: Firestore | null = null;
  private app: FirebaseApp | null = null;
  private notesCollection = 'notes';
  private foldersCollection = 'folders';

  constructor() {
    const savedConfig = localStorage.getItem('firebase_config');
    if (savedConfig) {
      try {
        this.initialize(JSON.parse(savedConfig));
      } catch (e) {
        console.error("Firebase initialization failed", e);
      }
    }
  }

  public initialize(config: any) {
    if (getApps().length > 0) {
      // Re-initialize logic if needed or just use existing
    }
    this.app = initializeApp(config);
    this.db = getFirestore(this.app);
    localStorage.setItem('firebase_config', JSON.stringify(config));
  }

  public isConnected() {
    return !!this.db;
  }

  subscribeNotes(callback: (notes: Note[]) => void) {
    if (!this.db) {
      // Fallback to local storage if not connected
      const saved = localStorage.getItem('notes_db_fallback');
      callback(saved ? JSON.parse(saved) : []);
      return () => {};
    }

    const q = query(collection(this.db, this.notesCollection), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];
      callback(notes);
    });
  }

  async addNote(note: Omit<Note, 'id'>): Promise<string> {
    if (!this.db) {
      const id = Math.random().toString(36).substr(2, 9);
      const notes = JSON.parse(localStorage.getItem('notes_db_fallback') || '[]');
      notes.unshift({ ...note, id });
      localStorage.setItem('notes_db_fallback', JSON.stringify(notes));
      return id;
    }

    const docRef = await addDoc(collection(this.db, this.notesCollection), {
      ...note,
      updatedAt: Date.now(),
      createdAt: Date.now()
    });
    return docRef.id;
  }

  async updateNote(id: string, updates: Partial<Note>) {
    if (!this.db) {
      let notes = JSON.parse(localStorage.getItem('notes_db_fallback') || '[]');
      notes = notes.map((n: any) => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n);
      localStorage.setItem('notes_db_fallback', JSON.stringify(notes));
      return;
    }

    const docRef = doc(this.db, this.notesCollection, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Date.now()
    });
  }

  async deleteNote(id: string) {
    if (!this.db) {
      let notes = JSON.parse(localStorage.getItem('notes_db_fallback') || '[]');
      notes = notes.filter((n: any) => n.id !== id);
      localStorage.setItem('notes_db_fallback', JSON.stringify(notes));
      return;
    }

    const docRef = doc(this.db, this.notesCollection, id);
    await deleteDoc(docRef);
  }

  getFolders(): Folder[] {
    return [
      { id: 'work', name: 'İş', color: '#10b981', icon: 'Briefcase' },
      { id: 'personal', name: 'Kişisel', color: '#84cc16', icon: 'User' },
      { id: 'ideas', name: 'Fikirler', color: '#06b6d4', icon: 'Lightbulb' }
    ];
  }
}

export const db = new DatabaseService();
