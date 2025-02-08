import NextAuth, { AuthOptions } from "next-auth";

// import StravaProvider from "next-auth/providers/strava";

export const authOptions: AuthOptions = {
  providers: [
    // StravaProvider({
    //   clientId: process.env.STRAVA_CLIENT_ID!,
    //   clientSecret: process.env.STRAVA_CLIENT_SECRET!,
    // }),
    {
      id: "strava",
      name: "Strava",
      type: "oauth",
      authorization: {
        url: "https://www.strava.com/api/v3/oauth/authorize",
        params: {
          scope: "read,activity:read",
          approval_prompt: "auto",
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
    async jwt({ account, token }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }

      return token;
    },
  },
};

export default NextAuth(authOptions);
