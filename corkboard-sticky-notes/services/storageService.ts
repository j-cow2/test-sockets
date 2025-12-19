
import { AppState, Board } from '../types';
import { STORAGE_KEY } from '../constants';

export const saveAppState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save app state:', error);
  }
};

export const loadAppState = (): AppState => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load app state:', error);
  }
  return { boards: {} };
};

export const createNewBoard = (name: string, password?: string): Board => {
  const id = Math.random().toString(36).substring(2, 9);
  const now = Date.now();
  return {
    id,
    name,
    password: password || undefined,
    items: [],
    connections: [],
    createdAt: now,
    // Fix: Adding missing required property lastModified
    lastModified: now,
  };
};
