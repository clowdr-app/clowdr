import { roundDownToNearest } from "../../../Utils/MathUtils";

export function formatRemainingTime(seconds: number, includeHours = true): string {
    // If you test this function with 59.999s and the following line is left out,
    // you get the improper result "00:00:60".
    seconds = Math.round(Math.max(0, seconds));
    const NearestHoursInS = roundDownToNearest(seconds, 60 * 60);
    const IntermediateSeconds = seconds - NearestHoursInS;
    const NearestMinutesInS = roundDownToNearest(IntermediateSeconds, 60);
    const NearestSeconds = IntermediateSeconds - NearestMinutesInS;
    const Hours = (NearestHoursInS / (60 * 60)).toFixed(0).padStart(2, "0");
    const Minutes = (NearestMinutesInS / 60).toFixed(0).padStart(2, "0");
    const Seconds = NearestSeconds.toFixed(0).padStart(2, "0");
    return includeHours || Hours !== "00" ? `${Hours}:${Minutes}:${Seconds}` : `${Minutes}:${Seconds}`;
}
