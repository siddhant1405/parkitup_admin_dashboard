import type { ParkingType } from "./types";

// CSS custom properties defined in app/globals.css (:root and .dark), so the
// resolved color swaps automatically with the theme.
export const PARKING_TYPE_COLORS: Record<ParkingType, string> = {
  residential: "var(--viz-series-1)",
  commercial: "var(--viz-series-2)",
  society: "var(--viz-series-3)",
  other: "var(--viz-series-4)",
};

export const NEEDS_ATTENTION_RING_COLOR = "var(--viz-status-critical)";
