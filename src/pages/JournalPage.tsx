import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useJournal } from '../hooks/useJournal';
import { JournalCard } from '../components/JournalCard';
import { JournalForm, type JournalFormData } from '../components/JournalForm';
import { JournalDetailModal } from '../components/JournalDetailModal';
import { QuickNoteModal } from '../components/QuickNoteModal';
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
    incrustarNotaEnJournal,
  } = useJournal();

  const [showForm, setShowForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [showQuickNoteForm, setShowQuickNoteForm] = useState(false);
  const [filter, setFilter] = useState<'journal' | 'note'>('journal');

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

  // Filtrado
  const filteredEntries = entries.filter(entry => {
    if (filter === 'note') return entry.tipo === 'note';
    return entry.tipo === 'journal';
  });

  // Agrupar entradas por día
  const groupedEntries: Record<string, typeof entries> = {};
  
  filteredEntries.forEach(entry => {
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
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24 min-h-[100dvh] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Mi Diario</h1>
        <p className="text-sm text-text-secondary mt-1">Reflexiones y momentos</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-8 bg-bg-card p-1 rounded-2xl border border-border sticky top-0 z-10">
        {[
          { id: 'journal', label: 'Diario', icon: '📓' },
          { id: 'note', label: 'Notas', icon: '📝' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              filter === f.id 
                ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      {isLoading && entries.length === 0 && (
        <div className="text-center py-12 text-text-secondary">Cargando diario...</div>
      )}

      {/* Contenido con Swipe */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          const threshold = 100;
          if (info.offset.x < -threshold && filter === 'journal') {
            setFilter('note');
          } else if (info.offset.x > threshold && filter === 'note') {
            setFilter('journal');
          }
        }}
        className="flex-1 w-full touch-pan-y"
      >
        {/* Empty State */}
        {!isLoading && filteredEntries.length === 0 && (
          <motion.div 
            key={filter}
            className="flex flex-col items-center justify-center py-20 px-6 min-h-[50vh]" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-6xl mb-4">
              {filter === 'journal' ? '📓' : '📝'}
            </div>
            <p className="text-text-secondary mb-2 text-lg font-semibold">
              {filter === 'journal' ? 'Tu diario está vacío' : 'No tienes notas rápidas'}
            </p>
            <p className="text-text-secondary/60 text-sm max-w-[240px] mx-auto">
              {filter === 'journal' 
                ? '¿Cómo estuvo tu día? Empieza a escribir tus pensamientos.' 
                : 'Captura ideas rápidas, recordatorios o momentos fugaces.'}
            </p>
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
                <AnimatePresence mode="popLayout">
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
                      onEmbed={(mood) => incrustarNotaEnJournal(entry.id, mood)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* FAB */}
      <motion.button
        onClick={() => {
          if (filter === 'note') setShowQuickNoteForm(true);
          else setShowForm(true);
        }}
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

      {showQuickNoteForm && (
        <QuickNoteModal
          onSubmit={(data) => {
            createEntry({ ...data, fotos: [] });
            setShowQuickNoteForm(false);
          }}
          onClose={() => setShowQuickNoteForm(false)}
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
