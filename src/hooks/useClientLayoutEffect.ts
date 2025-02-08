"use client";

import * as React from "react";

/**
 * A version of `React.useLayoutEffect` that does not show a warning when server-side rendering.
 * This is useful for effects that are only needed for client-side rendering but not for SSR.
 */
export const useClientLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : () => {};
