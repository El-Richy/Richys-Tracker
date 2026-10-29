export const MAX_IMPORT_BYTES = 25 * 1024 * 1024;

export function assertImportableBackupSize(bytes: number): void {
  if (bytes > MAX_IMPORT_BYTES) throw new Error('too_large');
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

type CollectionKey = (typeof COLLECTION_KEYS)[number];

export interface ValidatedBackup {
  habitos: Record<string, unknown>[];
  logs: Record<string, unknown>[];
  journal: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  streaks: Record<string, unknown>[];
  badges: Record<string, unknown>[];
  pointEntries: Record<string, unknown>[];
  usuario?: { displayName: string; accentColor: string };
}

function invalid(): never {
  throw new Error('invalid_shape');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireString(item: Record<string, unknown>, key: string): void {
  if (typeof item[key] !== 'string' || (item[key] as string).length === 0) invalid();
}

function requireBoolean(item: Record<string, unknown>, key: string): void {
  if (typeof item[key] !== 'boolean') invalid();
}

function requireFiniteNumber(item: Record<string, unknown>, key: string): void {
  if (typeof item[key] !== 'number' || !Number.isFinite(item[key] as number)) invalid();
}

function requireNumberArray(value: unknown): void {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'number' || !Number.isFinite(entry))) {
    invalid();
  }
}

function requireSubtasks(value: unknown): void {
  if (!Array.isArray(value)) invalid();
  for (const subtask of value) {
    if (!isRecord(subtask)) invalid();
    requireString(subtask, 'id');
    requireString(subtask, 'nombre');
  }
}

function requireUnique(ids: string[]): void {
  if (new Set(ids).size !== ids.length) invalid();
}

function requireRows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) invalid();
  if (value.some((item) => !isRecord(item))) invalid();
  return value as Record<string, unknown>[];
}

function validateHabits(rows: Record<string, unknown>[]): void {
  for (const row of rows) {
    requireString(row, 'id');
    requireString(row, 'nombre');
    requireNumberArray(row.diasActivos);
    requireFiniteNumber(row, 'diasGracia');
    requireSubtasks(row.subtareas);
  }
  requireUnique(rows.map((row) => row.id as string));
}

function validateLogs(rows: Record<string, unknown>[]): void {
  for (const row of rows) {
    requireString(row, 'id');
    requireString(row, 'habitId');
    requireString(row, 'fecha');
    requireBoolean(row, 'completado');
  }
  requireUnique(rows.map((row) => row.id as string));
}

function requireJournalPhotos(value: unknown): void {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || !entry.startsWith('data:image/'))) {
    invalid();
  }
}

function validateJournal(rows: Record<string, unknown>[]): void {
  for (const row of rows) {
    requireString(row, 'id');
    requireString(row, 'texto');
    requireJournalPhotos(row.fotos);
  }
  requireUnique(rows.map((row) => row.id as string));
}

function validateTasks(rows: Record<string, unknown>[]): void {
  for (const row of rows) {
    requireString(row, 'id');
    requireString(row, 'titulo');
    requireBoolean(row, 'completada');
    requireSubtasks(row.subtareas);
  }
  requireUnique(rows.map((row) => row.id as string));
}

function validateStreaks(rows: Record<string, unknown>[]): void {
  for (const row of rows) {
    requireString(row, 'habitId');
    requireFiniteNumber(row, 'rachaActual');
    requireFiniteNumber(row, 'rachaMaxima');
    if (row.estado !== 'activa' && row.estado !== 'en_riesgo' && row.estado !== 'rota') invalid();
  }
  requireUnique(rows.map((row) => row.habitId as string));
}

function validateBadges(rows: Record<string, unknown>[]): void {
  for (const row of rows) requireString(row, 'id');
  requireUnique(rows.map((row) => row.id as string));
}

function validatePoints(rows: Record<string, unknown>[]): void {
  for (const row of rows) {
    requireString(row, 'id');
    requireString(row, 'fecha');
    requireFiniteNumber(row, 'puntos');
  }
  requireUnique(rows.map((row) => row.id as string));
}

const VALIDATORS: Record<CollectionKey, (rows: Record<string, unknown>[]) => void> = {
  habitos: validateHabits,
  logs: validateLogs,
  journal: validateJournal,
  tasks: validateTasks,
  streaks: validateStreaks,
  badges: validateBadges,
  pointEntries: validatePoints,
};

export function validateBackupRecord(data: Record<string, unknown>): ValidatedBackup {
  if (!isRecord(data)) invalid();

  const collections = {} as Record<CollectionKey, Record<string, unknown>[]>;
  for (const key of COLLECTION_KEYS) {
    if (data[key] === undefined) {
      collections[key] = [];
      continue;
    }
    const rows = requireRows(data[key]);
    VALIDATORS[key](rows);
    collections[key] = rows;
  }

  let usuario: ValidatedBackup['usuario'];
  if (data.usuario !== undefined) {
    if (!isRecord(data.usuario)) invalid();
    requireString(data.usuario, 'displayName');
    requireString(data.usuario, 'accentColor');
    usuario = {
      displayName: data.usuario.displayName as string,
      accentColor: data.usuario.accentColor as string,
    };
  }

  return { ...collections, usuario };
}
