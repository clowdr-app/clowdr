import srtHandler from "srt-parser-2";

const anyDecimalSeparator = /[,.٫⎖]/;

function timecodeToTenths(timecode: string): number {
    const [secondsFloatStr, minutesStr, hoursStr] = timecode.split(":").reverse();
    const [secondsStr, fractionStr] = secondsFloatStr.split(anyDecimalSeparator);

    let tenthsFloat = fractionStr ? parseInt(fractionStr, 10) : 0;
    while (tenthsFloat >= 10) tenthsFloat /= 10;

    const tenths = Math.round(tenthsFloat);
    const seconds = parseInt(secondsStr, 10);
    const minutes = minutesStr ? parseInt(minutesStr, 10) : 0;
    const hours = hoursStr ? parseInt(hoursStr, 10) : 0;

    return ((hours * 60 + minutes) * 60 + seconds) * 10 + tenths;
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
    index: number;
    startTenths: number;
    endTenths: number;
    text: string;
}[];

export function SRTParse(srtTranscript: string): SubtitlesArray {
    return new srtHandler().fromSrt(srtTranscript).map(({ startTime, endTime, text }, index) => ({
        index,
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
