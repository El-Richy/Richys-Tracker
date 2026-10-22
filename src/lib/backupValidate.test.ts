import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertImportableBackupSize, MAX_IMPORT_BYTES, validateBackupRecord } from './backupValidate.ts';

function validHabit() {
  return {
    id: 'h1',
    nombre: 'Agua',
    color: '#fff',
    icono: '💧',
    recordatorioHora: null,
    diasActivos: [1],
    diasGracia: 0,
    creadoEn: '2026-01-01T00:00:00.000Z',
    userId: 'old-user',
    subtareas: [],
    prioridad: 'media',
  };
}

describe('validateBackupRecord', () => {
  it('rejects a habit that only has an id', () => {
    assert.throws(
      () => validateBackupRecord({ habitos: [{ id: 'h1' }] }),
      (error: unknown) => error instanceof Error && error.message === 'invalid_shape',
    );
  });

  it('rejects a journal photo list that is not strings', () => {
    assert.throws(
      () => validateBackupRecord({
        journal: [{ id: 'j1', texto: 'hola', fotos: [{ url: 'https://evil.example' }] }],
      }),
      (error: unknown) => error instanceof Error && error.message === 'invalid_shape',
    );
  });

  it('rejects a backup larger than the import cap', () => {
    assert.throws(
      () => assertImportableBackupSize(MAX_IMPORT_BYTES + 1),
      (error: unknown) => error instanceof Error && error.message === 'too_large',
    );
    assert.doesNotThrow(() => assertImportableBackupSize(MAX_IMPORT_BYTES));
  });

  it('drops usuario.id and keeps only displayName and accentColor', () => {
    const result = validateBackupRecord({
      habitos: [validHabit()],
      usuario: { displayName: 'Richy', accentColor: '#F0611A', id: 'evil' },
    });
    assert.deepEqual(result.usuario, { displayName: 'Richy', accentColor: '#F0611A' });
    assert.equal(Object.hasOwn(result.usuario ?? {}, 'id'), false);
  });
});
