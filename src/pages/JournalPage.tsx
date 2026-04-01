import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useJournal } from '../hooks/useJournal';
import { JournalCard } from '../components/JournalCard';
import { JournalForm, type JournalFormData } from '../components/JournalForm';
import { JournalDetailModal } from '../components/JournalDetailModal';
import { getLocalDateStr } from '../utils/dateUtils';
import type { JournalEntry } from '../types';

export function JournalPage() {
  const {
    entries,
    isLoading,
    createEntry,
    editEntry,
    deleteEntry,
    loadEntries,
  } = useJournal();

  const [showForm, setShowForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  function handleFormSubmit(data: JournalFormData) {
    if (editingEntry) {
      editEntry(editingEntry.id, data);
    } else {
      createEntry(data);
    }
    setShowForm(false);
    setEditingEntry(null);
  }

  // Agrupar entradas por día
  const groupedEntries: Record<string, typeof entries> = {};
  
  entries.forEach(entry => {
    const dateStr = getLocalDateStr(new Date(entry.creadoEn));
    if (!groupedEntries[dateStr]) {
      groupedEntries[dateStr] = [];
    }
    groupedEntries[dateStr].push(entry);
  });

  const sortedDates = Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a));

  function getDayLabel(dateStr: string) {
    const hoyStr = getLocalDateStr();
    const ayerDate = new Date();
    ayerDate.setDate(ayerDate.getDate() - 1);
    const ayerStr = getLocalDateStr(ayerDate);

    if (dateStr === hoyStr) return 'Hoy';
    if (dateStr === ayerStr) return 'Ayer';

    // Formato: "Jueves, 26 de marzo"
    const dateObj = new Date(dateStr + 'T12:00:00'); // Evitar timezone bugs
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(dateObj);
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Mi Diario</h1>
        <p className="text-sm text-text-secondary mt-1">Reflexiones y momentos</p>
      </div>

      {isLoading && entries.length === 0 && (
        <div className="text-center py-12 text-text-secondary">Cargando diario...</div>
      )}

      {/* Empty State */}
      {!isLoading && entries.length === 0 && (
        <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-6xl mb-4">✍️</div>
          <p className="text-text-secondary mb-2 text-lg">Tu diario está vacío</p>
          <p className="text-text-secondary/60 text-sm">¿Cómo fue tu día? Empieza a escribir cada mañana o noche.</p>
        </motion.div>
      )}

      {/* Lista agrupada */}
      <div className="space-y-8">
        {sortedDates.map(dateStr => (
          <div key={dateStr}>
            <h2 className="text-xs font-bold text-accent uppercase tracking-widest mb-4 px-2">
              {getDayLabel(dateStr)}
            </h2>
            <div className="space-y-4">
              <AnimatePresence>
                {groupedEntries[dateStr].map((entry, i) => (
                  <JournalCard
                    key={entry.id}
                    index={i}
                    entry={entry}
                    onDelete={() => deleteEntry(entry.id)}
                    onEdit={() => {
                      setEditingEntry(entry);
                      setShowForm(true);
                    }}
                    onOpen={() => setSelectedEntry(entry)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <motion.button
        onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-accent text-white text-2xl shadow-lg shadow-accent/30 flex items-center justify-center z-20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
      >
        <span className="mb-1">+</span>
      </motion.button>

      {/* Modal Crear/Editar */}
      {showForm && (
        <JournalForm 
          initialData={editingEntry || undefined}
          onSubmit={handleFormSubmit} 
          onClose={() => {
            setShowForm(false);
            setEditingEntry(null);
          }} 
        />
      )}

      {/* Modal Detalle */}
      {selectedEntry && (
        <JournalDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
}
