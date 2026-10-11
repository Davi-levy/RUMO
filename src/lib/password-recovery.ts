const KEY = "rumo:password-recovery";

export function recoveryValida(value: string | null, userId: string, now = Date.now()) {
  try {
    const marker = JSON.parse(value ?? "null");
    return marker?.userId === userId && typeof marker.expiraEm === "number" && marker.expiraEm > now;
  } catch { return false; }
}

export function atualizarRecovery(event: string, userId?: string): boolean {
  try {
    if (!userId || event === "SIGNED_OUT" || event === "SIGNED_IN") {
      sessionStorage.removeItem(KEY);
      return false;
    }
    if (event === "PASSWORD_RECOVERY") {
      sessionStorage.setItem(KEY, JSON.stringify({ userId, expiraEm: Date.now() + 60 * 60 * 1000 }));
      return true;
    }
    return recoveryValida(sessionStorage.getItem(KEY), userId);
  } catch { return event === "PASSWORD_RECOVERY" && !!userId; }
}
