import "dotenv/config";

const STRAVA_API = "https://www.strava.com/api/v3/push_subscriptions";

const clientId = process.env.STRAVA_CLIENT_ID;
const clientSecret = process.env.STRAVA_CLIENT_SECRET;
const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
const callbackUrl = process.env.STRAVA_WEBHOOK_CALLBACK_URL;

async function create() {
  if (!callbackUrl) {
    console.error(
      "STRAVA_WEBHOOK_CALLBACK_URL is required. Set it in .env (e.g. https://yourdomain.com/api/strava/webhook)",
    );
    process.exit(1);
  }

  const res = await fetch(STRAVA_API, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      callback_url: callbackUrl,
      verify_token: verifyToken!,
    }),
  });

  if (!res.ok) {
    console.error(
      "Failed to create subscription:",
      res.status,
      await res.text(),
    );
    process.exit(1);
  }

  const data = await res.json();
  console.log("Subscription created:", data);
  console.log(`\nAdd to .env:\nSTRAVA_WEBHOOK_SUBSCRIPTION_ID="${data.id}"`);
}

async function view() {
  const res = await fetch(
    `${STRAVA_API}?client_id=${clientId}&client_secret=${clientSecret}`,
  );

  if (!res.ok) {
    console.error(
      "Failed to view subscriptions:",
      res.status,
      await res.text(),
    );
    process.exit(1);
  }

  const data = await res.json();
  if (data.length === 0) {
    console.log("No active subscriptions.");
  } else {
    console.log("Active subscriptions:");
    for (const sub of data) {
      console.log(`  ID: ${sub.id}`);
      console.log(`  Callback URL: ${sub.callback_url}`);
      console.log(`  Created at: ${sub.created_at}`);
      console.log();
    }
  }
}

async function del(id: string) {
  const res = await fetch(STRAVA_API + `/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
    }),
  });

  if (!res.ok) {
    console.error(
      "Failed to delete subscription:",
      res.status,
      await res.text(),
    );
    process.exit(1);
  }

  console.log(`Subscription ${id} deleted.`);
}

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "create":
    await create();
    break;
  case "view":
    await view();
    break;
  case "delete":
    if (!args[0]) {
      console.error("Usage: manage-webhook.ts delete <subscription-id>");
      process.exit(1);
    }
    await del(args[0]);
    break;
  default:
    console.log("Usage: manage-webhook.ts <create|view|delete [id]>");
    process.exit(1);
}
