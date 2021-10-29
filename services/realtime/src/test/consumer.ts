import assert from "assert";
import fetch from "node-fetch";
import { default as io } from "socket.io-client";
import type { Message } from "../types/chat";

assert(process.env.SERVER_URL, "Missing SERVER_URL env var");
assert(
    process.env.SERVER_URL.endsWith("/"),
    `SERVER_URL env var should have a trailing slash: ${process.env.SERVER_URL}`
);
assert(process.env.USER_ID, "Missing USER_ID env var");
assert(process.env.CONFERENCE_SLUG, "Missing CONFERENCE_SLUG env var");

const serverURL = process.env.SERVER_URL;
const userId = process.env.USER_ID + (process.env.DYNO ? `-${process.env.DYNO}` : "");
const confSlug = process.env.CONFERENCE_SLUG;
const silentMode = !!process.env.SILENT_MODE;

// Grr npm...
process.title = process.env.WINDOW_TITLE ?? process.title;

async function wait(ms: number) {
    await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), ms);
    });
}

type OngoingSample = { count: number; startAt: number };
type Sample = OngoingSample & { endAt: number };
let historicConsumptionRates_10s: Sample[] = [];
let historicConsumptionRates_1min: Sample[] = [];
let historicConsumptionRates_10min: Sample[] = [];
let currentSample: OngoingSample | undefined;

async function Main(chatId = process.env.CHAT_ID ?? "be7faf53-548c-465e-831a-aa9aff8265ed") {
    console.info(`Configuration:
    Server URL: ${serverURL}
    User Id: ${userId}
    Conference slug: ${confSlug}
    Chat Id: ${chatId}
    Silent Mode: ${silentMode}
`);

    try {
        process.stdout.write("Attempting to obtain test JWT...");
        const jwtResponse = await fetch(serverURL + `test/jwt?userId=${userId}&confSlug=${confSlug}`, {
            method: "GET",
        });
        const token = await jwtResponse.text();
        console.info("obtained.");

        const client = io(serverURL, {
            auth: {
                token,
            },
            transports: ["websocket"],
        });

        const connected: { done: boolean | string } = { done: false };
        client.on("connect", () => {
            connected.done = true;
        });

        client.on("connect_error", (e: any) => {
            connected.done = "Websocket connect error: " + e;
        });

        client.on("disconnect", (reason: any) => {
            throw new Error("Client disconnected: " + reason);
        });

        process.stdout.write("Attempting to connect websocket");
        const startedWaitingForConnectionAt = Date.now();
        while (!connected.done && Date.now() - startedWaitingForConnectionAt < 30 * 1000) {
            process.stdout.write(".");
            await wait(100);
        }

        if (!connected.done) {
            throw new Error("Waiting for connection timed out.");
        } else if (connected.done === true) {
            console.log("connected.");
        } else {
            throw new Error(connected.done);
        }

        client.on("chat.messages.receive", (msg: Message) => {
            const now = Date.now();
            if (!currentSample) {
                currentSample = {
                    startAt: now,
                    count: 1,
                };
            } else {
                currentSample.count++;

                let period = now - currentSample.startAt;
                if (period >= 10 * 1000) {
                    historicConsumptionRates_10s.push({
                        ...currentSample,
                        endAt: now,
                    });
                    currentSample = {
                        startAt: now,
                        count: 0,
                    };
                    console.info(
                        `${new Date().toISOString()}: 10s avg: ${(
                            (1000 * historicConsumptionRates_10s[historicConsumptionRates_10s.length - 1].count) /
                            (historicConsumptionRates_10s[historicConsumptionRates_10s.length - 1].endAt -
                                historicConsumptionRates_10s[historicConsumptionRates_10s.length - 1].startAt)
                        ).toFixed(1)} messages/s`
                    );

                    if (historicConsumptionRates_10s.length > 0) {
                        period = now - historicConsumptionRates_10s[0].startAt;

                        if (period >= 60 * 1000) {
                            historicConsumptionRates_1min.push({
                                startAt: historicConsumptionRates_10s[0].startAt,
                                count: historicConsumptionRates_10s.reduce((acc, x) => acc + x.count, 0),
                                endAt: now,
                            });
                            console.info(
                                `${new Date().toISOString()}: 1m avg: ${(
                                    (1000 *
                                        historicConsumptionRates_1min[historicConsumptionRates_1min.length - 1].count) /
                                    (historicConsumptionRates_1min[historicConsumptionRates_1min.length - 1].endAt -
                                        historicConsumptionRates_1min[historicConsumptionRates_1min.length - 1].startAt)
                                ).toFixed(1)} messages/s`
                            );

                            historicConsumptionRates_10s = [];

                            if (historicConsumptionRates_1min.length > 0) {
                                period = now - historicConsumptionRates_1min[0].startAt;

                                if (period >= 10 * 60 * 1000) {
                                    historicConsumptionRates_10min.push({
                                        startAt: historicConsumptionRates_1min[0].startAt,
                                        count: historicConsumptionRates_1min.reduce((acc, x) => acc + x.count, 0),
                                        endAt: now,
                                    });
                                    console.info(
                                        `${new Date().toISOString()}: 10m avg: ${(
                                            (1000 *
                                                historicConsumptionRates_10min[
                                                    historicConsumptionRates_10min.length - 1
                                                ].count) /
                                            (historicConsumptionRates_10min[historicConsumptionRates_10min.length - 1]
                                                .endAt -
                                                historicConsumptionRates_10min[
                                                    historicConsumptionRates_10min.length - 1
                                                ].startAt)
                                        ).toFixed(1)} messages/s`
                                    );

                                    historicConsumptionRates_1min = [];

                                    if (historicConsumptionRates_10min.length > 10) {
                                        historicConsumptionRates_10min = [];
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (!silentMode) {
                console.info("Message received", msg);
            }
        });

        client.on("chat.reactions.receive", (msg: Message) => {
            if (!silentMode) {
                console.info("Reaction received", msg);
            }
        });

        client.emit("chat.subscribe", chatId);

        // eslint-disable-next-line no-constant-condition
        while (true) {
            console.info("[Running]");
            await wait(60000);
        }
    } catch (e) {
        process.stdout.write("\n");
        console.error("Error in main processing", e);
    }
}

Main();
