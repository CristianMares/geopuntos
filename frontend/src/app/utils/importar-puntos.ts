import { Categoria } from '../models/categoria';
import { DatosPunto } from '../models/punto';
import { parsearCsv } from './csv';

export const MAX_FILAS = 500;

export interface FilaConError {
  /** Número de fila en el archivo, contando el encabezado como la 1 */
  fila: number;
  mensajes: string[];
}

export interface ResultadoAnalisis {
  total: number;
  validas: DatosPunto[];
  conError: FilaConError[];
  /** Problema que impide leer el archivo completo, como columnas faltantes */
  errorGeneral: string | null;
}

type Columna = 'nombre' | 'categoria' | 'descripcion' | 'latitud' | 'longitud';

const OBLIGATORIAS: Columna[] = ['nombre', 'categoria', 'latitud', 'longitud'];

const ALIAS: Record<string, Columna> = {
  nombre: 'nombre',
  categoria: 'categoria',
  descripcion: 'descripcion',
  latitud: 'latitud',
  lat: 'latitud',
  longitud: 'longitud',
  lon: 'longitud',
  lng: 'longitud',
  long: 'longitud',
};

/** Compara sin importar mayúsculas, acentos ni espacios sobrantes */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

function aNumero(texto: string): number {
  const limpio = texto.trim().replace(',', '.');
  return limpio === '' ? NaN : Number(limpio);
}

function vacio(): ResultadoAnalisis {
  return { total: 0, validas: [], conError: [], errorGeneral: null };
}

/** Lee el CSV, valida cada fila con las mismas reglas que la API y separa las válidas de las que tienen errores */
export function analizarCsvPuntos(texto: string, categorias: Categoria[]): ResultadoAnalisis {
  const filas = parsearCsv(texto);
  const resultado = vacio();

  const [encabezado, ...datos] = filas;
  if (!encabezado) {
    return { ...resultado, errorGeneral: 'El archivo está vacío' };
  }

  const posicion = new Map<Columna, number>();
  encabezado.forEach((titulo, indice) => {
    const columna = ALIAS[normalizar(titulo)];
    if (columna && !posicion.has(columna)) posicion.set(columna, indice);
  });

  const faltan = OBLIGATORIAS.filter((columna) => !posicion.has(columna));
  if (faltan.length > 0) {
    return {
      ...resultado,
      errorGeneral: `Faltan estas columnas en el encabezado: ${faltan.join(', ')}`,
    };
  }
  if (datos.length === 0) {
    return { ...resultado, errorGeneral: 'El archivo no trae filas de datos' };
  }
  if (datos.length > MAX_FILAS) {
    return {
      ...resultado,
      total: datos.length,
      errorGeneral: `El archivo tiene ${datos.length} filas y el máximo es ${MAX_FILAS}. Divídelo en partes`,
    };
  }

  const categoriaPorNombre = new Map(categorias.map((c) => [normalizar(c.nombre), c]));
  const celda = (fila: string[], columna: Columna): string => {
    const indice = posicion.get(columna);
    return indice === undefined ? '' : (fila[indice] ?? '').trim();
  };

  datos.forEach((fila, indice) => {
    const numeroFila = indice + 2;
    const mensajes: string[] = [];

    const nombre = celda(fila, 'nombre');
    if (nombre.length < 3 || nombre.length > 100) {
      mensajes.push('El nombre debe tener entre 3 y 100 caracteres');
    }

    const nombreCategoria = celda(fila, 'categoria');
    const categoria = categoriaPorNombre.get(normalizar(nombreCategoria));
    if (!categoria) {
      const opciones = categorias.map((c) => c.nombre).join(', ');
      mensajes.push(
        nombreCategoria === ''
          ? 'La categoría es obligatoria'
          : `La categoría "${nombreCategoria}" no existe (opciones: ${opciones})`,
      );
    }

    const latitud = aNumero(celda(fila, 'latitud'));
    if (Number.isNaN(latitud)) mensajes.push('La latitud debe ser un número');
    else if (latitud < -90 || latitud > 90) mensajes.push('La latitud debe estar entre -90 y 90');

    const longitud = aNumero(celda(fila, 'longitud'));
    if (Number.isNaN(longitud)) mensajes.push('La longitud debe ser un número');
    else if (longitud < -180 || longitud > 180) {
      mensajes.push('La longitud debe estar entre -180 y 180');
    }

    const descripcion = celda(fila, 'descripcion');
    if (descripcion.length > 1000) mensajes.push('La descripción no puede pasar de 1000 caracteres');

    if (mensajes.length > 0 || !categoria) {
      resultado.conError.push({ fila: numeroFila, mensajes });
    } else {
      resultado.validas.push({
        nombre,
        descripcion: descripcion === '' ? null : descripcion,
        latitud,
        longitud,
        categoriaId: categoria.id,
      });
    }
  });

  resultado.total = datos.length;
  return resultado;
}

/** Lee el archivo como UTF-8 y, si no es válido (Excel antiguo), como Windows-1252 */
export async function leerArchivoTexto(archivo: File): Promise<string> {
  const bytes = await archivo.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}
