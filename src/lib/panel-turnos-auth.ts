import { timingSafeEqual } from "crypto";

function timingSafeStringEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  try {
    const ba = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function verifyPanelCookie(value: string | undefined): boolean {
  const expected = process.env.PANEL_TURNOS_SESSION_TOKEN ?? "";
  if (!expected) return false;
  return timingSafeStringEqual(value ?? "", expected);
}

export function verifyPanelPassword(candidate: string): boolean {
  const password = process.env.PANEL_TURNOS_PASSWORD ?? "";
  if (!password) return false;
  return timingSafeStringEqual(candidate, password);
}
