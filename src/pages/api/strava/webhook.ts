import type { NextApiRequest, NextApiResponse } from "next";

import { env } from "@server/env";
import {
  type StravaWebhookEvent,
  processWebhookEvent,
} from "@server/lib/webhook";
import { getActiveSubscriptionId } from "@server/lib/webhookSubscription";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    return handleValidation(req, res);
  }
  if (req.method === "POST") {
    return handleEvent(req, res);
  }
  res.setHeader("Allow", "GET, POST");
  return res.status(405).end();
}

function handleValidation(req: NextApiRequest, res: NextApiResponse) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    console.log("[webhook] Subscription validated");
    return res.status(200).json({ "hub.challenge": challenge });
  }

  console.warn("[webhook] Validation failed: invalid verify_token or mode");
  return res.status(403).json({ error: "Forbidden" });
}

function handleEvent(req: NextApiRequest, res: NextApiResponse) {
  const event = req.body as StravaWebhookEvent;

  // Lightweight validation: check subscription_id if known
  const activeSubId = getActiveSubscriptionId();
  if (activeSubId != null && event.subscription_id !== activeSubId) {
    console.warn(
      "[webhook] Rejected event: subscription_id mismatch",
      event.subscription_id,
    );
    // Still return 200 to avoid retry amplification from rogue requests
    return res.status(200).end();
  }

  // Respond immediately — Strava requires <2s response
  res.status(200).end();

  // Fire-and-forget background processing
  processWebhookEvent(event).catch((err) => {
    console.error("[webhook] Unhandled error processing event:", err);
  });
}
