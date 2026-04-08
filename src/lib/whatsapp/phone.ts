/**
 * Devuelve el número solo con dígitos, sin "+", para el campo `to` de la Cloud API.
 * Acepta formatos comunes AR (+54 9 11 …).
 */
export function normalizeWhatsAppToDigits(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    return null;
  }
  return digits;
}
