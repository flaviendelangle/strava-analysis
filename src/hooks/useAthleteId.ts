import { useSession } from "next-auth/react";

export function useAthleteId(): number | undefined {
  const { data: session } = useSession();
  return session?.athleteId;
}
