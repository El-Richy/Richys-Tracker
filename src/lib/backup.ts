import { Capacitor } from '@capacitor/core';
import type {
  Badge,
  Habit,
  HabitLog,
  JournalEntry,
  LocalUser,
  PointEntry,
  Streak,
  Task,
} from '../types';
import { db } from '../db';
import { validateBackupRecord } from './backupValidate';

export const BACKUP_VERSION = '2.0.0';
export const MAX_IMPORT_BYTES = 25 * 1024 * 1024;

export interface BackupPayload {
  exportadoEn: string;
  version: string;
  usuario?: { displayName: string; accentColor: string };
  habitos: Habit[];
  logs: HabitLog[];
  journal: JournalEntry[];
  tasks: Task[];
  streaks: Streak[];
  badges: Badge[];
  pointEntries: PointEntry[];
}

const COLLECTION_KEYS = [
  'habitos',
  'logs',
  'journal',
  'tasks',
  'streaks',
  'badges',
  'pointEntries',
] as const;

export async function collectBackup(user: LocalUser): Promise<BackupPayload> {
  const habitos = await db.habits.where('userId').equals(user.id).toArray();
  const habitIds = habitos.map((h) => h.id);
  const logs = habitIds.length
    ? await db.habitLogs.where('habitId').anyOf(habitIds).toArray()
    : [];
  const [journal, tasks, streaks, badges, pointEntries] = await Promise.all([
    db.journalEntries.where('userId').equals(user.id).toArray(),
    db.tasks.where('userId').equals(user.id).toArray(),
    db.streaks.toArray(),
    db.badges.toArray(),
    db.pointEntries.where('userId').equals(user.id).toArray(),
  ]);

  return {
    exportadoEn: new Date().toISOString(),
    version: BACKUP_VERSION,
    usuario: { displayName: user.displayName, accentColor: user.accentColor },
    habitos,
    logs,
    journal,
    tasks,
    streaks,
    badges,
    pointEntries,
  };
}

function backupFilename(): string {
  return `richys-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
}

function isShareCanceled(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /cancel/i.test(message);
}

function downloadJsonInBrowser(filename: string, json: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function shareOrDownloadBackup(payload: BackupPayload): Promise<void> {
  const filename = backupFilename();
  const json = JSON.stringify(payload, null, 2);

  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const written = await Filesystem.writeFile({
      path: filename,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    try {
      await Share.share({
        title: filename,
        text: "Respaldo de Richy's Tracker",
        url: written.uri,
        files: [written.uri],
        dialogTitle: 'Exportar respaldo',
      });
    } catch (error) {
      if (isShareCanceled(error)) return;
      throw error;
    }
    return;
  }

  downloadJsonInBrowser(filename, json);
}

export function parseBackupJson(text: string): BackupPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('invalid_json');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('invalid_shape');
  }
  const data = validateBackupRecord(parsed as Record<string, unknown>);
  const hasRows = COLLECTION_KEYS.some((key) => data[key].length > 0);
  if (!hasRows) throw new Error('empty_backup');
  return data as unknown as BackupPayload;
}

export async function readBackupFile(file: File): Promise<BackupPayload> {
  if (file.size > MAX_IMPORT_BYTES) throw new Error('too_large');
  const text = await file.text();
  return parseBackupJson(text);
}
