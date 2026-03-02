import { internal } from "./_generated/api";

export async function getAccessToken(
  ctx: { runQuery: Function },
  athleteId: number,
): Promise<string> {
  const athlete = await ctx.runQuery(internal.queries.getAthleteByStravaId, {
    stravaAthleteId: athleteId,
  });

  if (!athlete) {
    throw new Error(`Athlete ${athleteId} not found`);
  }

  return athlete.accessToken;
}
