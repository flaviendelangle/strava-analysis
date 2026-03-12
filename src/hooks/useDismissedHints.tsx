"use client";

import * as React from "react";

const STORAGE_KEY = "undertrained:dismissed-hints";

function readFromStorage(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    // Corrupted data — start fresh
  }
  return new Set();
}

function writeToStorage(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

interface DismissedHintsContextValue {
  isDismissed: (id: string) => boolean;
  dismiss: (id: string) => void;
  resetAll: () => void;
}

const DismissedHintsContext = React.createContext<DismissedHintsContextValue>({
  isDismissed: () => false,
  dismiss: () => {},
  resetAll: () => {},
});

export function DismissedHintsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());

  // Hydrate from localStorage after mount (SSR-safe)
  React.useEffect(() => {
    setDismissed(readFromStorage());
  }, []);

  const isDismissed = React.useCallback(
    (id: string) => dismissed.has(id),
    [dismissed],
  );

  const dismiss = React.useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      writeToStorage(next);
      return next;
    });
  }, []);

  const resetAll = React.useCallback(() => {
    setDismissed(new Set());
    writeToStorage(new Set());
  }, []);

  const value = React.useMemo(
    () => ({ isDismissed, dismiss, resetAll }),
    [isDismissed, dismiss, resetAll],
  );

  return (
    <DismissedHintsContext value={value}>{children}</DismissedHintsContext>
  );
}

export function useDismissedHints(): DismissedHintsContextValue {
  return React.useContext(DismissedHintsContext);
}
