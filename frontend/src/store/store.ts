import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  upiId?: string;
  globalOptIn: boolean;
}

interface StoreState {
  currentUser: User | null;
  token: string | null;
  setCurrentUser: (user: User | null, token: string | null) => void;
  logout: () => void;
}

export const useStore = create<StoreState>((set) => ({
  currentUser: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null,
  token: localStorage.getItem('token') || null,
  
  setCurrentUser: (user, token) => {
    if (user && token) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    set({ currentUser: user, token });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ currentUser: null, token: null });
  }
}));
