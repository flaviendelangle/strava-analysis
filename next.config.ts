// @ts-check
import { NextConfig } from "next";

/**
 * @see https://nextjs.org/docs/api-reference/next.config.js/introduction
 */
export default {
  output: "standalone",
  /** We run typechecking as a separate task in CI */
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/activities",
        permanent: false,
      },
    ];
  },
} satisfies NextConfig;
