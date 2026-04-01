/**
 * Utilidades de fecha con manejo correcto de zona horaria local.
 * Reemplaza el todayStr() anterior que usaba toISOString() (UTC).
 */

/**
 * Retorna "YYYY-MM-DD" en la zona horaria LOCAL del dispositivo.
 */
export function getLocalDateStr(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retorna el día de la semana (0=Dom, 6=Sáb) desde un string "YYYY-MM-DD".
 * Construye el Date con componentes locales para evitar bugs de timezone.
 */
export function getDayOfWeekFromStr(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
}

/**
 * Resta N días a una fecha string "YYYY-MM-DD".
 */
export function subtractDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - days);
  return getLocalDateStr(date);
}

/**
 * Suma N días a una fecha string "YYYY-MM-DD".
 */
export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return getLocalDateStr(date);
}

/**
 * Genera un array de fechas "YYYY-MM-DD" entre from y to (inclusive).
 */
export function getDateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  let current = from;
  while (current <= to) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

/**
 * Nombres cortos de los días en español.
 */
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function getDiaCorto(dateStr: string): string {
  return DIAS_CORTOS[getDayOfWeekFromStr(dateStr)];
}

/**
 * Formato legible corto: "28 Mar"
 */
const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export function getFechaCorta(dateStr: string): string {
  const [, month, day] = dateStr.split('-').map(Number);
  return `${day} ${MESES_CORTOS[month - 1]}`;
}
