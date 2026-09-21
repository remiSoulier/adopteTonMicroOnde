const parisDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
});
const parisHour = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Paris", hour: "2-digit", hourCycle: "h23",
});

export function getVotePeriod(now = new Date()) {
  const parts = parisDate.formatToParts(now);
  const part = (name: string) => Number(parts.find((p) => p.type === name)!.value);
  const year = part("year"), month = part("month") - 1, day = part("day");

  const tenInParis = (dayOffset: number) => {
    // At 10:00 UTC, Paris is always past its DST transition that morning.
    const utc = new Date(Date.UTC(year, month, day + dayOffset, 10));
    const offsetHours = Number(parisHour.format(utc)) - 10;
    return new Date(utc.getTime() - offsetHours * 3_600_000);
  };
  const endOffset = now < tenInParis(0) ? -1 : 0;
  return {
    start: tenInParis(endOffset - 1),
    end: tenInParis(endOffset),
    nextReset: tenInParis(endOffset + 1),
  };
}
