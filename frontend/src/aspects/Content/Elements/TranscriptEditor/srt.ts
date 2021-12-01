import srtHandler from "srt-parser-2";

const anyDecimalSeparator = /[,.٫⎖]/;

function timecodeToTenths(timecode: string): number {
    const [secondsFloatStr, minutesStr, hoursStr] = timecode.split(":").reverse();

    const secondsFloat = parseFloat(secondsFloatStr.replace(anyDecimalSeparator, "."));
    const minutes = minutesStr ? parseInt(minutesStr, 10) : 0;
    const hours = hoursStr ? parseInt(hoursStr, 10) : 0;

    return (hours * 60 + minutes) * 600 + Math.round(secondsFloat * 10);
}

const toDigits = (n: number, d: number) => Math.trunc(n).toString().padStart(d, "0");

function tenthsToSRTTimecode(tenthsTotal: number, { minusEpsilon = false } = {}): string {
    const millisecondsTotal = tenthsTotal * 100 - (minusEpsilon ? 1 : 0);
    const hoursStr = toDigits(millisecondsTotal / 3600000, 2);
    const minutesStr = toDigits((millisecondsTotal / 60000) % 60, 2);
    const secondsStr = toDigits((millisecondsTotal / 1000) % 60, 2);
    const millisecondsStr = toDigits(millisecondsTotal % 1000, 3);
    return hoursStr + ":" + minutesStr + ":" + secondsStr + "," + millisecondsStr;
}

export type SubtitlesArray = {
    startTenths: number;
    endTenths: number;
    text: string;
}[];

export function SRTParse(srtTranscript: string): SubtitlesArray {
    return new srtHandler().fromSrt(srtTranscript).map(({ startTime, endTime, text }) => ({
        startTenths: timecodeToTenths(startTime),
        endTenths: timecodeToTenths(endTime),
        text,
    }));
}

export function SRTStringify(transcript: SubtitlesArray): string {
    return new srtHandler().toSrt(
        transcript.map(({ startTenths, endTenths, text }, index) => ({
            id: (index + 1).toString(),
            startTime: tenthsToSRTTimecode(startTenths),
            endTime: tenthsToSRTTimecode(endTenths, { minusEpsilon: true }),
            text,
        }))
    );
}
