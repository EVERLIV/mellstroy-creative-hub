/** Normalize DB schedule fields onto the Class.schedule shape. */
export function mapClassSchedule(c: {
  schedule_days?: string[] | null;
  schedule_time?: string | null;
  schedule_times?: string[] | null;
}): { days: string[]; time: string; times?: string[] } | undefined {
  const days = (c.schedule_days || []).filter(Boolean);
  const times = (
    c.schedule_times?.length
      ? c.schedule_times
      : c.schedule_time
        ? [c.schedule_time]
        : []
  )
    .map((t) => String(t).slice(0, 5))
    .filter(Boolean);

  if (!days.length || !times.length) return undefined;
  return {
    days,
    time: times[0],
    times: Array.from(new Set(times)),
  };
}
