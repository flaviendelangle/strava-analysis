import { useCallback, useEffect, useRef, useState } from "react";

import { AntTrainerConnection } from "~/sensors/ant/connection";
import type { ConnectionState, TrainerData } from "~/sensors/types";

export function useAntTrainer() {
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [data, setData] = useState<TrainerData | null>(null);
  const connectionRef = useRef(new AntTrainerConnection());

  const connect = useCallback(async () => {
    setState("connecting");
    try {
      await connectionRef.current.connect({
        onData: (trainerData) => setData(trainerData),
        onDisconnect: () => setState("disconnected"),
      });
      setState("connected");
    } catch (err) {
      console.error("[ANT+ Trainer] Connection failed:", err);
      setState("error");
    }
  }, []);

  const disconnect = useCallback(async () => {
    await connectionRef.current.disconnect();
    setState("disconnected");
    setData(null);
  }, []);

  useEffect(() => {
    const connection = connectionRef.current;
    return () => {
      connection.disconnect();
    };
  }, []);

  return {
    state,
    data,
    deviceName: null as string | null,
    protocol: "ant+" as const,
    connect,
    disconnect,
  };
}
