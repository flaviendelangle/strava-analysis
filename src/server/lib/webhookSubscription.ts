import { env } from "../env";

const STRAVA_API = "https://www.strava.com/api/v3/push_subscriptions";

/** In-memory subscription ID, set on startup. */
let activeSubscriptionId: number | null = null;

export function getActiveSubscriptionId(): number | null {
  return activeSubscriptionId;
}

/**
 * Called on server startup from instrumentation.ts.
 * Checks for an existing Strava webhook subscription and creates one if needed.
 * Requires STRAVA_WEBHOOK_CALLBACK_URL to be set — skips silently if not configured.
 */
export async function ensureWebhookSubscription(): Promise<void> {
  if (!env.STRAVA_WEBHOOK_CALLBACK_URL) {
    console.log(
      "[webhook] STRAVA_WEBHOOK_CALLBACK_URL not set, skipping auto-registration",
    );
    return;
  }

  try {
    // Check for existing subscriptions
    const viewRes = await fetch(
      `${STRAVA_API}?client_id=${env.STRAVA_CLIENT_ID}&client_secret=${env.STRAVA_CLIENT_SECRET}`,
      { signal: AbortSignal.timeout(30_000) },
    );

    if (!viewRes.ok) {
      console.error(
        "[webhook] Failed to check existing subscriptions:",
        viewRes.status,
        await viewRes.text(),
      );
      return;
    }

    const existing = await viewRes.json();

    if (existing.length > 0) {
      activeSubscriptionId = existing[0].id;
      console.log(
        `[webhook] Existing subscription found (id=${activeSubscriptionId}, callback=${existing[0].callback_url})`,
      );

      // If callback URL changed, delete old and re-create
      if (existing[0].callback_url !== env.STRAVA_WEBHOOK_CALLBACK_URL) {
        console.log("[webhook] Callback URL changed, recreating subscription");
        await deleteSubscription(existing[0].id);
        await createSubscription();
      }
      return;
    }

    // No subscription exists — create one
    await createSubscription();
  } catch (err) {
    console.error("[webhook] Auto-registration failed:", err);
  }
}

async function createSubscription(): Promise<void> {
  console.log(
    `[webhook] Creating subscription for ${env.STRAVA_WEBHOOK_CALLBACK_URL}`,
  );

  const res = await fetch(STRAVA_API, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      callback_url: env.STRAVA_WEBHOOK_CALLBACK_URL!,
      verify_token: env.STRAVA_WEBHOOK_VERIFY_TOKEN,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    console.error(
      "[webhook] Failed to create subscription:",
      res.status,
      await res.text(),
    );
    return;
  }

  const data = await res.json();
  activeSubscriptionId = data.id;
  console.log(`[webhook] Subscription created (id=${activeSubscriptionId})`);
}

async function deleteSubscription(id: number): Promise<void> {
  const res = await fetch(`${STRAVA_API}/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    console.error(
      "[webhook] Failed to delete old subscription:",
      res.status,
      await res.text(),
    );
  }
}
