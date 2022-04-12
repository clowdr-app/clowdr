import { DateTime } from "luxon";

export function getUTCDateInstance(dateString: string): Date {
    const dateMs = Date.parse(dateString);
    const offsetMs = DateTime.local().zone.offset(0) * 60 * 1000;
    const outputMS = dateMs + offsetMs;
    const outputDate = DateTime.fromMillis(outputMS);
    const outputJSDate = outputDate.toUTC().toJSDate();
    return outputJSDate;
}
