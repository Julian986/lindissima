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

/**
 * Twilio exige `whatsapp:+E164`. Asume Argentina si faltaba el prefijo 54 (10 dígitos → +549…).
 * Para otros países, que el usuario ingrese el número ya con código de país en dígitos.
 */
export function digitsToTwilioWhatsAppTo(digits: string): string | null {
  if (!/^\d{10,15}$/.test(digits)) return null;
  let n = digits;
  if (n.startsWith("54")) {
    /* ya incluye país AR */
  } else if (n.length === 10) {
    n = `549${n}`;
  } else if (n.length === 11 && n.startsWith("9")) {
    n = `54${n}`;
  }
  if (n.length < 11 || n.length > 15) return null;
  return `whatsapp:+${n}`;
}
