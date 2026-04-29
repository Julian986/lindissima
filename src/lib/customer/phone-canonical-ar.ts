/** Solo dígitos, sin espacios ni símbolos. */
function normalizePhoneDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Valida que el string parezca un número de WhatsApp (10–15 dígitos). */
export function isLikelyWhatsappNumber(raw: string): boolean {
  const d = normalizePhoneDigits(raw);
  return d.length >= 10 && d.length <= 15;
}

/**
 * Clave canónica para cruzar el mismo WhatsApp argentino en cualquier formato.
 *
 * Formatos que normalizamos a "549XXXXXXXXXX":
 *   "+54 9 11 2345 6789"  → "5491123456789"   (full international, ya correcto)
 *   "11 2345 6789"        → "5491123456789"   (solo área + número, 10 dígitos)
 *   "9 11 2345 6789"      → "5491123456789"   (prefijo móvil arg sin país, 11 dígitos)
 *   "011 2345 6789"       → "5491123456789"   (prefijo discado 0 + área, 11 dígitos)
 *   "+54 11 2345 6789"    → "541123456789"    (país sin 9, se deja tal cual)
 */
export function canonicalPhoneDigitsAR(raw: string): string {
  const d = normalizePhoneDigits(raw);
  if (!d) return "";

  if (d.startsWith("549")) return d;
  if (d.startsWith("54")) return d;

  // "0XXXXXXXXX…" (9–12 dígitos): prefijo de discado nacional "0"
  if (d.startsWith("0") && d.length >= 9 && d.length <= 12) {
    return `549${d.slice(1)}`;
  }

  // "9XXXXXXXXXX" (exactamente 11 dígitos): prefijo móvil argentino
  if (d.startsWith("9") && d.length === 11) {
    return `549${d.slice(1)}`;
  }

  // Dígitos sueltos (8–11): área + número local
  if (d.length >= 8 && d.length <= 11) {
    return `549${d}`;
  }

  return d;
}

/**
 * Genera todos los valores posibles de `customerPhoneDigits` para el mismo número,
 * cubriendo la forma canónica actual Y variantes históricas incorrectas que pueden
 * estar guardadas en registros creados antes de la corrección de normalización.
 */
export function customerPhoneDigitsQueryValues(canonical: string): string[] {
  const s = new Set<string>();
  if (canonical) s.add(canonical);

  if (canonical.startsWith("549") && canonical.length >= 11) {
    const rest = canonical.slice(3);
    const last10 = rest.length >= 10 ? rest.slice(-10) : rest;

    s.add(rest);
    s.add(last10);
    s.add(`5499${last10}`);
    s.add(`5490${last10}`);
    s.add(`54${last10}`);

    if (rest !== last10) {
      s.add(`5499${rest}`);
      s.add(`5490${rest}`);
      s.add(`54${rest}`);
    }
  }

  return [...s];
}
