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
  recordatorioHora: string | null;
  diasActivos: number[];
  diasGracia: number;
  creadoEn: string;
  userId: string;
  subtareas: Subtarea[];
  prioridad: 'alta' | 'media' | 'baja';
}

export interface HabitLog {
  id: string;
  habitId: string;
  fecha: string;
  completado: boolean;
  subtareasCompletadas: string[];
  razonFallo?: string;
  timestamp?: string;
}

export type EstadoRacha = 'activa' | 'en_riesgo' | 'rota';

export interface Streak {
  habitId: string;
  rachaActual: number;
  rachaMaxima: number;
  ultimoCheck: string;
  estado: EstadoRacha;
  diasGraciaRestantes: number;
}

export interface PointEntry {
  id: string;
  userId: string;
  habitId?: string;
  fecha: string;
  puntos: number;
  razon: string;
  origenTipo?: 'habit' | 'task';
  oculto?: boolean;
}

export interface Badge {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  condicion: string;
  desbloqueadoEn?: string;
  visto?: boolean;
}

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

export interface Task {
  id: string;
  userId: string;
  titulo: string;
  descripcion?: string;
  completada: boolean;
  prioridad: 'alta' | 'media' | 'baja';
  deadline?: string;
  recordatorioHora?: string;
  subtareas: Subtarea[];
  creadoEn: string;
}

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

export interface LocalUser {
  id: string;
  displayName: string;
  accentColor: string;
}
