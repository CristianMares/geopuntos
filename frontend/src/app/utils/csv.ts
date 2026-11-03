/** Lectura y escritura de CSV sin dependencias externas */

const MARCA_UTF8 = '﻿';

type Separador = ',' | ';';

function escaparCelda(valor: string): string {
  return /[",;\r\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

/**
 * Excel interpreta como fórmula un texto que empieza con = + - o @. Al exportar se le antepone
 * un apóstrofo para que se muestre como texto. Solo se usa en campos de texto, nunca en números.
 */
export function protegerFormula(texto: string): string {
  return /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto;
}

/** Genera el CSV con la marca UTF-8 al inicio, para que Excel muestre bien los acentos */
export function generarCsv(filas: string[][]): string {
  const cuerpo = filas.map((fila) => fila.map(escaparCelda).join(',')).join('\r\n');
  return `${MARCA_UTF8}${cuerpo}\r\n`;
}

export function descargarCsv(nombreArchivo: string, contenido: string): void {
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

/** Excel en algunos países separa con punto y coma: se elige el que más aparece en la primera línea */
function detectarSeparador(texto: string): Separador {
  const primeraLinea = texto.split(/\r?\n/, 1)[0] ?? '';
  const comas = (primeraLinea.match(/,/g) ?? []).length;
  const puntosYComas = (primeraLinea.match(/;/g) ?? []).length;
  return puntosYComas > comas ? ';' : ',';
}

/** Convierte el texto de un CSV en filas de celdas; respeta comillas, saltos de línea dentro de ellas y ambos separadores */
export function parsearCsv(textoOriginal: string): string[][] {
  const texto = textoOriginal.startsWith(MARCA_UTF8) ? textoOriginal.slice(1) : textoOriginal;
  const separador = detectarSeparador(texto);

  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = '';
  let entreComillas = false;

  const cerrarFila = (): void => {
    fila.push(celda);
    celda = '';
    // Una línea completamente vacía no es un registro
    if (fila.some((valor) => valor.trim() !== '')) filas.push(fila);
    fila = [];
  };

  for (let i = 0; i < texto.length; i++) {
    const caracter = texto.charAt(i);

    if (entreComillas) {
      if (caracter === '"') {
        if (texto.charAt(i + 1) === '"') {
          celda += '"';
          i++;
        } else {
          entreComillas = false;
        }
      } else {
        celda += caracter;
      }
    } else if (caracter === '"') {
      entreComillas = true;
    } else if (caracter === separador) {
      fila.push(celda);
      celda = '';
    } else if (caracter === '\n') {
      cerrarFila();
    } else if (caracter !== '\r') {
      celda += caracter;
    }
  }
  if (celda !== '' || fila.length > 0) cerrarFila();

  return filas;
}
