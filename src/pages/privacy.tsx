import { BikeIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";

import { LoggedInLayout } from "~/components/layouts/LoggedInLayout";
import { SharedLayout } from "~/components/layouts/SharedLayout";
import type { NextPageWithLayout } from "~/pages/_app";

function PrivacyContent() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link
          href="/"
          className="text-primary mb-8 inline-flex items-center gap-2 text-sm font-medium hover:underline"
        >
          <BikeIcon className="size-4" />
          Undertrained
        </Link>

        <h1 className="text-foreground mb-2 text-3xl font-bold">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Last updated: March 4, 2026
        </p>

        <div className="text-foreground space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="mb-2 text-lg font-semibold">What is Undertrained?</h2>
            <p>
              Undertrained is a personal cycling analytics tool that connects to
              your Strava account to help you analyze your performance. It is a
              hobby project and is not affiliated with Strava.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Data we collect</h2>
            <p>When you log in with Strava, we store:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>
                Your Strava athlete ID and name (for identification)
              </li>
              <li>
                OAuth tokens (to access the Strava API on your behalf)
              </li>
              <li>
                Your activity data: distance, speed, power, heart rate, cadence,
                elevation, GPS traces, and time-series streams
              </li>
              <li>
                Settings you configure in the app (FTP, weight, equipment
                parameters)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">How we use your data</h2>
            <p>
              Your data is used exclusively to display cycling analytics to you.
              We do not share your data with other users. Each user can only see
              their own activities and statistics.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Third parties</h2>
            <p>
              We do not sell, share, or disclose your data to any third party.
              The only external services the app communicates with are:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>
                <strong>Strava API</strong> &mdash; to fetch your activities and
                sync updates
              </li>
              <li>
                <strong>OpenStreetMap</strong> &mdash; to display map tiles (no
                personal data is sent)
              </li>
            </ul>
            <p className="mt-2">
              We do not use analytics, advertising, or tracking services.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Data storage & security</h2>
            <p>
              Your data is stored in a PostgreSQL database on our server. All
              connections are encrypted with HTTPS and enforced via HSTS.
              Authentication is handled through secure session cookies.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Data retention & deletion</h2>
            <p>
              Your data is kept as long as your account is active. You can delete
              all your data at any time in two ways:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>
                Use the <strong>&quot;Delete all my data&quot;</strong> button on
                the Settings page
              </li>
              <li>
                Revoke access to Undertrained in your{" "}
                <a
                  href="https://www.strava.com/settings/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Strava settings
                </a>
                , which triggers automatic deletion via webhook
              </li>
            </ul>
            <p className="mt-2">
              In both cases, all your activities, streams, settings, and sync
              data are permanently deleted from our database.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Cookies</h2>
            <p>
              We use a single session cookie for authentication. We do not use
              tracking cookies, analytics cookies, or any third-party cookies.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Contact</h2>
            <p>
              If you have questions about this privacy policy or your data, you
              can open an issue on our{" "}
              <a
                href="https://github.com/flaviendelangle/undertrained"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub repository
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

const PrivacyPage: NextPageWithLayout = () => {
  return <PrivacyContent />;
};

PrivacyPage.getLayout = function getLayout(page) {
  return <PrivacyLayout>{page}</PrivacyLayout>;
};

function PrivacyLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <SharedLayout>
        <div className="h-screen" />
      </SharedLayout>
    );
  }

  if (status === "authenticated") {
    return <LoggedInLayout>{children}</LoggedInLayout>;
  }

  return <SharedLayout>{children}</SharedLayout>;
}

export default PrivacyPage;
