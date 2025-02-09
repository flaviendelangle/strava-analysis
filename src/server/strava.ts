import strava from "strava-v3";

strava.config({
  access_token: "Your apps access token (Required for Quickstart)",
  client_id: process.env.STRAVA_CLIENT_ID!,
  client_secret: process.env.STRAVA_CLIENT_SECRET!,
  redirect_uri: "https://strava-analysis.netlify.app/",
});
