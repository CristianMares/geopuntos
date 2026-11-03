const formato = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

/** Convierte la fecha ISO que devuelve la API en un texto como "2 nov 2026, 17:20" */
export function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? '' : formato.format(fecha);
}
