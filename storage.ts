import {parseStats, restoreProgress, startProgress} from './game.ts';
import type {Player, Progress} from './game.ts';

export const progressKey = 'football-guesser-v2';
const legacyStatsKey = 'football-guesser-v1';
type StorageAccess = Pick<Storage, 'getItem' | 'setItem'>;

function readJson(storage: StorageAccess, key: string): unknown {
  try { return JSON.parse(storage.getItem(key) || 'null'); } catch { return null; }
}

export function loadProgress(storage: StorageAccess, players: Player[], version: string): Progress {
  const saved = readJson(storage, progressKey);
  const restored = restoreProgress(saved, players, version);
  if (restored) return restored;
  const savedStats = saved && typeof saved === 'object' && 'stats' in saved ? parseStats(saved.stats) : null;
  const stats = savedStats || parseStats(readJson(storage, legacyStatsKey));
  // If a changed/corrupt board cannot be restored, account for its started game.
  const reconciled = stats ? {...stats, abandoned: stats.started - stats.games,
    streak: stats.started > stats.games + stats.abandoned ? 0 : stats.streak} : undefined;
  return startProgress(players, version, reconciled);
}

export function saveProgress(storage: StorageAccess, progress: Progress) {
  try { storage.setItem(progressKey, JSON.stringify(progress)); return true; } catch { return false; }
}
