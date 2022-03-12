import { format } from "d3-format";

export interface AmazonTranscribeOutput {
    jobName: string;
    accountId: string;
    results: AmazonTranscriptResults;
}

interface AmazonTranscriptResults {
    transcripts: Transcript[];
    items: Item[];
}

interface Transcript {
    transcript: string;
}

type Item = PronunciationItem | PunctuationItem;

interface PronunciationItem {
    start_time: string;
    end_time: string;
    alternatives: Alternative[];
    type: "pronunciation";
}

interface PunctuationItem {
    alternatives: Alternative[];
    type: "punctuation";
}

interface Alternative {
    confidence: string;
    content: string;
}

function toTimeCode(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minuteSeconds = totalSeconds - hours * 3600;
    const minutes = Math.floor(minuteSeconds / 60);
    const secondSeconds = minuteSeconds - minutes * 60;
    const seconds = Math.floor(secondSeconds);
    const millis = (secondSeconds - seconds) * 1000;

    const hoursPart = format("02d")(hours);
    const minutesPart = format("02d")(minutes);
    const secondsPart = format("02d")(seconds);
    const millisPart = format("03d")(millis);

    return `${hoursPart}:${minutesPart}:${secondsPart},${millisPart}`;
}

function printPhrase(phrase: Phrase, index: number): string {
    const scheduledStartTime = toTimeCode(phrase.startedAt);
    const scheduledEndTime = toTimeCode(phrase.endedAt);
    const text = phrase.items.reduce((accum, value, idx) => {
        if (value.type === "pronunciation") {
            return (
                accum +
                (idx === 0 ? "" : " ") +
                (value.alternatives.length > 0 ? value.alternatives[0].content : "<missing>")
            );
        } else {
            return accum + (value.alternatives.length > 0 ? value.alternatives[0].content : "<missing>");
        }
    }, "");
    return `${index}\n${scheduledStartTime} --> ${scheduledEndTime}\n${text}\n\n`;
}

interface Phrase {
    items: Item[];
    startedAt: number;
    endedAt: number;
}

function phraseLength(phrase: Phrase): number {
    return phrase.items.length + phrase.items.map(itemLength).reduce((acc, val) => acc + val, 0);
}

function itemLength(item: Item): number {
    if (item.type === "pronunciation") {
        if (item.alternatives.length > 0) {
            return item.alternatives[0].content.length;
        } else {
            return 0;
        }
    } else {
        return 1;
    }
}

function getPhrases(awsTranscribeJson: AmazonTranscribeOutput): Phrase[] {
    let currentPhrase: Phrase = {
        items: [],
        startedAt: 0,
        endedAt: 0,
    };
    const phrases: Phrase[] = [];

    for (const item of awsTranscribeJson.results.items) {
        if (
            item.type === "pronunciation" &&
            (currentPhrase.endedAt - currentPhrase.startedAt > 5 ||
                phraseLength(currentPhrase) + itemLength(item) >= 32)
        ) {
            phrases.push(currentPhrase);
            currentPhrase = {
                items: [],
                startedAt: currentPhrase.endedAt,
                endedAt: currentPhrase.endedAt,
            };
        }

        if (currentPhrase.items.length === 0 && item.type === "pronunciation") {
            currentPhrase.startedAt = parseFloat(item.start_time);
            currentPhrase.endedAt = parseFloat(item.end_time);
        }

        currentPhrase.items.push(item);

        if (item.type === "pronunciation") {
            currentPhrase.endedAt = parseFloat(item.end_time);
        }
    }

    phrases.push(currentPhrase);

    return phrases;
}

function phrasesToSrt(phrases: Phrase[]): string {
    return phrases.reduce((accum, current, idx) => {
        return accum + printPhrase(current, idx + 1);
    }, "");
}

export function convertJsonToSrt(awsTranscribeJson: AmazonTranscribeOutput): string {
    const phrases = getPhrases(awsTranscribeJson);
    return phrasesToSrt(phrases);
}
