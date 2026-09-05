import { PARKING_TYPE_LABELS } from "@/lib/format";
import { NEEDS_ATTENTION_RING_COLOR, PARKING_TYPE_COLORS } from "@/lib/map-colors";
import type { ParkingType } from "@/lib/types";

const PARKING_TYPES = Object.keys(PARKING_TYPE_COLORS) as ParkingType[];

export function MapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-card px-3 py-2 text-xs">
      {PARKING_TYPES.map((type) => (
        <div key={type} className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: PARKING_TYPE_COLORS[type] }}
          />
          {PARKING_TYPE_LABELS[type]}
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <span
          className="size-2.5 rounded-full border-2"
          style={{ borderColor: NEEDS_ATTENTION_RING_COLOR }}
        />
        Needs attention
      </div>
    </div>
  );
}
