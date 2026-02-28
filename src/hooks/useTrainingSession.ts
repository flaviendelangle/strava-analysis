import { useCallback, useEffect, useRef, useState } from "react";

export type SessionState = "idle" | "running" | "paused" | "stopped";

export function useTrainingSession() {
  const [state, setState] = useState<SessionState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const lastTickRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    lastTickRef.current = performance.now();
    intervalRef.current = setInterval(() => {
      const now = performance.now();
      if (lastTickRef.current !== null) {
        const delta = (now - lastTickRef.current) / 1000;
        setElapsedSeconds((prev) => prev + delta);
      }
      lastTickRef.current = now;
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    lastTickRef.current = null;
  }, []);

  const start = useCallback(() => {
    setState("running");
    setElapsedSeconds(0);
    startTimer();
  }, [startTimer]);

  const pause = useCallback(() => {
    setState("paused");
    stopTimer();
  }, [stopTimer]);

  const resume = useCallback(() => {
    setState("running");
    startTimer();
  }, [startTimer]);

  const stop = useCallback(() => {
    setState("stopped");
    stopTimer();
  }, [stopTimer]);

  const reset = useCallback(() => {
    setState("idle");
    setElapsedSeconds(0);
    stopTimer();
  }, [stopTimer]);

  // Warn before leaving during an active session
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (state === "running" || state === "paused") {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  return {
    state,
    elapsedSeconds: Math.floor(elapsedSeconds),
    start,
    pause,
    resume,
    stop,
    reset,
  };
}
