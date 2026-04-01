// ─── Hábito ───────────────────────────────────────────────

export interface Subtarea {
  id: string;
  nombre: string;
  completada?: boolean;
}

export interface Habit {
  id: string;
  nombre: string;
  color: string;
  icono: string;
  /** Hora del recordatorio en formato "HH:mm", null si no tiene */
  recordatorioHora: string | null;
  /** Días activos: 0=Domingo, 1=Lunes, ..., 6=Sábado */
  diasActivos: number[];
  /** Cantidad de días de gracia permitidos sin romper racha */
  diasGracia: number;
  /** Timestamp ISO de creación */
  creadoEn: string;
  userId: string;
  subtareas: Subtarea[];
  prioridad: 'alta' | 'media' | 'baja';
}

// ─── Log diario ───────────────────────────────────────────

export interface HabitLog {
  id: string;
  habitId: string;
  /** Fecha en formato YYYY-MM-DD (zona local del dispositivo) */
  fecha: string;
  completado: boolean;
  /** IDs de subtareas completadas */
  subtareasCompletadas: string[];
  /** Razón opcional al romper racha */
  razonFallo?: string;
  /** Timestamp ISO de la interacción */
  timestamp?: string;
}

// ─── Racha ────────────────────────────────────────────────

export type EstadoRacha = 'activa' | 'en_riesgo' | 'rota';

export interface Streak {
  habitId: string;
  rachaActual: number;
  rachaMaxima: number;
  /** Timestamp ISO del último check */
  ultimoCheck: string;
  estado: EstadoRacha;
  diasGraciaRestantes: number;
}

// ─── Puntos ───────────────────────────────────────────────

export interface PointEntry {
  id: string;
  userId: string;
  /** ID del hábito asociado (opcional, algunos eventos son globales) */
  habitId?: string;
  /** Fecha YYYY-MM-DD */
  fecha: string;
  puntos: number;
  /** Descripción legible: "+10 por completar Meditación" */
  razon: string;
}

export interface Points {
  userId: string;
  total: number;
}

// ─── Badges ───────────────────────────────────────────────

export interface Badge {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  /** Descripción legible de la condición para desbloquear */
  condicion: string;
  /** Timestamp ISO de cuando se desbloqueó, undefined si aún no */
  desbloqueadoEn?: string;
  /** Indica si ya se mostró la notificación/toast al usuario */
  visto?: boolean;
}

/** Estadísticas pasadas a las funciones de evaluación de badges */
export interface BadgeStats {
  rachaMaximaGlobal: number;
  totalCompletados: number;
  totalHabitos: number;
  totalPuntos: number;
  semanasPerfectas: number;
  totalJournalEntries: number;
  totalTareasCompletadas: number;
  totalAnimoPerfecto: number;
  todosHabitosConRacha: boolean;
}

// ─── Tareas ───────────────────────────────────────────────

export interface Task {
  id: string;
  userId: string;
  titulo: string;
  descripcion?: string;
  completada: boolean;
  prioridad: 'alta' | 'media' | 'baja';
  deadline?: string;        // YYYY-MM-DD
  recordatorioHora?: string; // HH:mm
  subtareas: Subtarea[];
  creadoEn: string;
}

// ─── Journal ───────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  userId: string;
  titulo?: string;
  texto: string;
  estadoAnimo?: 1 | 2 | 3 | 4 | 5;
  fotos: string[];
  creadoEn: string;
  tipo: 'journal' | 'note';
}

// ─── Recompensas ──────────────────────────────────────────────

export interface Reward {
  id: string;
  userId: string;
  nombre: string;
  descripcion?: string;
  icono: string;
  precioPuntos: number;
  canjeada: boolean;
  esRecurrente: boolean;      // ¿se puede canjear cada semana?
  ultimoCanjeo?: string;      // ISO timestamp del último canjeo
  creadoEn: string;
}
