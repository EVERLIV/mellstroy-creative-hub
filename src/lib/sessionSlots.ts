/** Concrete bookable sessions derived from class schedules. */

export type SessionSlot = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  weekday: string;
  label: string;
  spotsLeft?: number;
};

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function startOfLocalDay(d = new Date()) {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function formatSlotLabel(dateKey: string, time: string) {
  const [y, m, day] = dateKey.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  const dayPart = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return `${dayPart} · ${time}`;
}

/**
 * Build upcoming concrete slots from recurring days + one or more times.
 * Skips past times for "today".
 */
export function buildUpcomingSlots(input: {
  classId: string;
  days?: string[] | null;
  times?: string[] | null;
  /** Fallback single time when times[] is empty */
  time?: string | null;
  capacity?: number;
  enrolledByDateTime?: Record<string, number>;
  limit?: number;
  horizonDays?: number;
}): SessionSlot[] {
  const days = (input.days || []).filter(Boolean);
  const times = (
    input.times?.length ? input.times : input.time ? [input.time] : []
  )
    .map((t) => String(t).slice(0, 5))
    .filter(Boolean);

  if (!days.length || !times.length) return [];

  const daySet = new Set(days);
  const today = startOfLocalDay();
  const now = new Date();
  const horizon = input.horizonDays ?? 21;
  const limit = input.limit ?? 12;
  const out: SessionSlot[] = [];

  for (let i = 0; i < horizon && out.length < limit; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const weekday = WEEKDAY[d.getDay()];
    if (!daySet.has(weekday)) continue;

    const dateKey = toDateKey(d);
    for (const time of times) {
      if (out.length >= limit) break;
      const [hh, mm] = time.split(':').map(Number);
      const when = new Date(d);
      when.setHours(hh || 0, mm || 0, 0, 0);
      if (when.getTime() <= now.getTime()) continue;

      const enrolled = input.enrolledByDateTime?.[`${dateKey}|${time}`] ?? 0;
      const capacity = input.capacity ?? 0;
      out.push({
        id: `${input.classId}|${dateKey}|${time}`,
        date: dateKey,
        time,
        weekday,
        label: formatSlotLabel(dateKey, time),
        spotsLeft: capacity > 0 ? Math.max(capacity - enrolled, 0) : undefined,
      });
    }
  }

  return out;
}

export function slotToDate(slot: SessionSlot): Date {
  const [y, m, d] = slot.date.split('-').map(Number);
  const [hh, mm] = slot.time.split(':').map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
}
