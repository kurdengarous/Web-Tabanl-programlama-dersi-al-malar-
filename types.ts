
export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string;
  color: string;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export enum AppStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  ERROR = 'error'
}
