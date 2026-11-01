import { ShuffleHistoryItem } from '../types';

const STORAGE_KEY = 'random_student_grouper_history';

export function loadHistory(): ShuffleHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    if (Array.isArray(items)) {
      return items;
    }
    return [];
  } catch (err) {
    console.error('Error loading history from localStorage', err);
    return [];
  }
}

export function saveHistoryItem(item: ShuffleHistoryItem): void {
  try {
    const current = loadHistory();
    // Keep max 50 recent items
    const updated = [item, ...current.filter((i) => i.id !== item.id)].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving history item to localStorage', err);
  }
}

export function deleteHistoryItem(id: string): ShuffleHistoryItem[] {
  try {
    const current = loadHistory();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error deleting history item', err);
    return [];
  }
}

export function renameHistoryItem(id: string, newTitle: string): ShuffleHistoryItem[] {
  try {
    const current = loadHistory();
    const updated = current.map((item) => {
      if (item.id === id) {
        return { ...item, title: newTitle };
      }
      return item;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error renaming history item', err);
    return [];
  }
}

export function clearAllHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing history', err);
  }
}
