/** localStorage that never throws (private mode, blocked storage): the portal works without it, just forgets more. */
export const speicher = {
  lies(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  schreib(key: string, wert: string | null): void {
    try {
      if (wert === null) localStorage.removeItem(key);
      else localStorage.setItem(key, wert);
    } catch {
      // ignore
    }
  },
};
