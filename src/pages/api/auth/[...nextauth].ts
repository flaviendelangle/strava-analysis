import { ConvexHttpClient } from "convex/browser";
import NextAuth, { AuthOptions } from "next-auth";

import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
        clientId: process.env.STRAVA_CLIENT_ID!,
        clientSecret: process.env.STRAVA_CLIENT_SECRET!,
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

        await convex.mutation(api.mutations.upsertAthlete, {
          stravaAthleteId: Number(token.sub),
          accessToken: account.access_token,
          name: profile
            ? `${(profile as any).firstname} ${(profile as any).lastname}`
            : undefined,
        });
      }

      return token;
    },
    async session({ session, token }) {
      (session as any).athleteId = Number(token.sub);
      return session;
    },
  },
};

export default NextAuth(authOptions);
