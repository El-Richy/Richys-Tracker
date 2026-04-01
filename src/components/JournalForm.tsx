import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { JournalEntry } from '../types';

interface JournalFormProps {
  onSubmit: (data: JournalFormData) => void;
  onClose: () => void;
  initialData?: Partial<JournalEntry>;
  autoOpenCamera?: boolean;
}

export interface JournalFormData {
  titulo?: string;
  texto: string;
  estadoAnimo: 1 | 2 | 3 | 4 | 5;
  fotos: string[];
}

const MOODS: { val: 1 | 2 | 3 | 4 | 5, emoji: string }[] = [
  { val: 1, emoji: '😞' },
  { val: 2, emoji: '😕' },
  { val: 3, emoji: '😐' },
  { val: 4, emoji: '🙂' },
  { val: 5, emoji: '😄' },
];

export function JournalForm({ 
  onSubmit, 
  onClose, 
  initialData,
  autoOpenCamera = false
}: JournalFormProps) {
  const [titulo, setTitulo] = useState(initialData?.titulo || '');
  const [texto, setTexto] = useState(initialData?.texto || '');
  const [estadoAnimo, setEstadoAnimo] = useState<1 | 2 | 3 | 4 | 5>((initialData?.estadoAnimo as 1 | 2 | 3 | 4 | 5) || 3);
  const [fotos, setFotos] = useState<string[]>(initialData?.fotos || []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoOpenCamera && cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  }, [autoOpenCamera]);

  async function comprimirImagen(base64: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 1200; // Un poco más de calidad
        let w = img.width, h = img.height;
        if (w > maxSize) { h = (h * maxSize) / w; w = maxSize; }
        if (h > maxSize) { w = (w * maxSize) / h; h = maxSize; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = base64;
    });
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setError(null);

    const newFotos: string[] = [];
    
    for (const file of Array.from(files)) {
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        const comprimida = await comprimirImagen(base64);
        newFotos.push(comprimida);
      } catch (err) {
        console.error('Error procesando imagen:', err);
        setError('Error al procesar una de las imágenes.');
      }
    }

    setFotos(prev => [...prev, ...newFotos]);
    setIsProcessing(false);
    e.target.value = '';
  }

  function removeFoto(idx: number) {
    setFotos(prev => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim()) {
      setError('Escribe algo en tu diario.');
      return;
    }
    onSubmit({
      titulo: titulo.trim() || undefined,
      texto: texto.trim(),
      estadoAnimo,
      fotos,
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 lg:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-bg-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[95vh] overflow-y-auto border border-border flex flex-col"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-white">
                {initialData ? 'Editar Recuerdo ✏️' : 'Crear Recuerdo 📓'}
              </h2>
              <button type="button" onClick={onClose} className="text-text-secondary hover:text-white p-2">✕</button>
            </div>

            {/* 1. Selector de ánimo */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest text-center">¿Cómo te sientes hoy?</label>
              <div className="flex justify-between max-w-sm mx-auto bg-bg-primary/50 p-2 rounded-2xl border border-border/50">
                {MOODS.map((m) => (
                  <button
                    key={m.val}
                    type="button"
                    onClick={() => setEstadoAnimo(m.val)}
                    className={`text-4xl p-2 rounded-xl transition-all duration-300 ${
                      estadoAnimo === m.val 
                        ? 'bg-accent/20 ring-2 ring-accent scale-110 shadow-lg shadow-accent/10' 
                        : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100 hover:bg-bg-elevated'
                    }`}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Fotos con Cámara y Galería */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Fotos del momento</label>
                {isProcessing && <span className="text-[10px] text-accent font-bold animate-pulse uppercase">Procesando...</span>}
              </div>
              
              <div className="flex flex-wrap gap-3">
                {fotos.map((foto, idx) => (
                  <motion.div 
                    key={idx} 
                    className="relative w-20 h-28 rounded-xl overflow-hidden border border-border group"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <img src={foto} className="w-full h-full object-cover" alt="Journal preview" />
                    <button
                      type="button"
                      onClick={() => removeFoto(idx)}
                      className="absolute top-1 right-1 bg-black/70 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </motion.div>
                ))}
                
                {/* Botón Cámara */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className={`w-20 h-28 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-accent hover:bg-accent/5 transition-all active:scale-95 ${isProcessing ? 'opacity-30 pointer-events-none' : ''}`}
                >
                  <span className="text-2xl">📷</span>
                  <span className="text-[9px] font-bold text-text-secondary uppercase">Cámara</span>
                </button>

                {/* Botón Galería */}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className={`w-20 h-28 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-accent hover:bg-accent/5 transition-all active:scale-95 ${isProcessing ? 'opacity-30 pointer-events-none' : ''}`}
                >
                  <span className="text-2xl">🖼️</span>
                  <span className="text-[9px] font-bold text-text-secondary uppercase">Galería</span>
                </button>

                {/* Inputs ocultos */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* 3. Título */}
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Título de tu entrada (opcional)</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Un gran día, Reflexión, etc."
                className="w-full px-4 py-3 rounded-xl bg-bg-primary border border-border text-text-primary focus:border-accent outline-none transition-colors"
                autoFocus
              />
            </div>

            {/* 4. Texto */}
            <div>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe tus pensamientos aquí..."
                className="w-full px-4 py-4 rounded-xl bg-bg-primary border border-border text-text-primary focus:border-accent outline-none transition-colors min-h-[150px] resize-none leading-relaxed"
              />
            </div>

            {error && <p className="text-danger text-sm bg-danger/10 p-3 rounded-lg text-center">{error}</p>}

            {/* 5. Botón Guardar */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 rounded-xl bg-accent text-white font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 active:scale-[0.98] disabled:opacity-50"
            >
              {initialData ? 'Guardar' : 'Guardar'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
