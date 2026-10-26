import { useUiStore } from '../store';
import { useJournal } from '../hooks/useJournal';
import { JournalForm } from './JournalForm';
import { QuickNoteModal } from './QuickNoteModal';
import { useOverlayHistory } from '../lib/overlayHistory';

export function QuickActionsHost() {
  const quickAction = useUiStore((s) => s.quickAction);
  const clearQuickAction = useUiStore((s) => s.clearQuickAction);
  const { createEntry } = useJournal();
  useOverlayHistory(quickAction !== null, clearQuickAction);

  if (quickAction === 'note') {
    return (
      <QuickNoteModal
        onSubmit={(data) => {
          void createEntry({ ...data, fotos: [] });
          clearQuickAction();
        }}
        onClose={clearQuickAction}
      />
    );
  }

  if (quickAction === 'journal' || quickAction === 'photo') {
    return (
      <JournalForm
        autoOpenCamera={quickAction === 'photo'}
        onSubmit={(data) => {
          void createEntry(data);
          clearQuickAction();
        }}
        onClose={clearQuickAction}
      />
    );
  }

  return null;
}
