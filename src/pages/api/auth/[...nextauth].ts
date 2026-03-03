import { eq } from "drizzle-orm";
import NextAuth, { AuthOptions } from "next-auth";

import { db } from "@server/db";
import { athletes } from "@server/db/schema";
import { env } from "@server/env";
import type { StravaProfile } from "@server/lib/stravaTypes";

export const authOptions: AuthOptions = {
  providers: [
    {
      id: "strava",
      name: "Strava",
      type: "oauth",
      authorization: {
        url: "https://www.strava.com/api/v3/oauth/authorize",
        params: {
          scope: "read,activity:read,activity:write",
          approval_prompt: "force",
          response_type: "code",
        },
      },
      token: {
        url: "https://www.strava.com/api/v3/oauth/token",
      },
      userinfo: "https://www.strava.com/api/v3/athlete",
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
      profile(profile) {
        return {
          id: profile.id,
          name: `${profile.firstname} ${profile.lastname}`,
          email: null,
          image: profile.profile,
        };
      },
      options: {
        clientId: env.STRAVA_CLIENT_ID,
        clientSecret: env.STRAVA_CLIENT_SECRET,
      },
    },
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ account, token, profile }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;

        const stravaAthleteId = Number(token.sub);
        const name = profile
          ? `${(profile as StravaProfile).firstname} ${(profile as StravaProfile).lastname}`
          : undefined;

        const tokenData = {
          accessToken: account.access_token,
          refreshToken: account.refresh_token ?? "",
          tokenExpiresAt: account.expires_at ?? 0,
          name,
        };

        const existing = await db.query.athletes.findFirst({
          where: eq(athletes.stravaAthleteId, stravaAthleteId),
        });

        if (existing) {
          await db
            .update(athletes)
            .set(tokenData)
            .where(eq(athletes.id, existing.id));
        } else {
          await db.insert(athletes).values({
            stravaAthleteId,
            ...tokenData,
          });
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.athleteId = Number(token.sub);
      return session;
    },
  },
};

export default NextAuth(authOptions);
