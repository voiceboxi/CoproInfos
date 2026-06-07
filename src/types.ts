export interface User {
  id: string;
  email: string;
  name: string;
  residenceId: string;
  createdAt: number;
}

export interface Member {
  id: string; // The userId
  role: 'owner' | 'tenant' | 'board' | 'syndic';
  lot?: string;
  joinedAt: number;
  user?: User; // joined locally
}

export interface Residence {
  id: string;
  name: string;
  createdAt: number;
}

export interface Thread {
  id: string;
  name?: string;
  type: 'direct' | 'group';
  memberIds: string[];
  lastMessage?: string;
  lastMessageTime?: number;
  createdAt: number;
  updatedAt?: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
}

export interface DocumentInfo {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  createdAt: number;
}
