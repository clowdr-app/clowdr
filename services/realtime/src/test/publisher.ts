import assert from "assert";
import fetch from "node-fetch";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { Chat_MessageType_Enum, Chat_ReactionType_Enum } from "../generated/graphql";
import { Action, Message, Reaction } from "../types/chat";

assert(process.env.SERVER_URL, "Missing SERVER_URL env var");
assert(
    process.env.SERVER_URL.endsWith("/"),
    `SERVER_URL env var should have a trailing slash: ${process.env.SERVER_URL}`
);
assert(process.env.USER_ID, "Missing USER_ID env var");
assert(process.env.ATTENDEE_ID, "Missing ATTENDEE_ID env var");
assert(process.env.CONFERENCE_SLUG, "Missing CONFERENCE_SLUG env var");

const serverURL = process.env.SERVER_URL;
const userId = process.env.USER_ID + (process.env.DYNO ? `-${process.env.DYNO}` : "");
// AttendeeId must be a valid uuid (VSCode: Ctrl+Shift+[)
const attendeeId = process.env.ATTENDEE_ID + (process.env.DYNO ? `-${process.env.DYNO}` : "");
const confSlug = process.env.CONFERENCE_SLUG;

// Grr npm...
process.title = process.env.WINDOW_TITLE ?? process.title;

async function wait(ms: number) {
    await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), ms);
    });
}

async function Main(
    // The practical upper limit is ~15 messages/s (due to this test publisher
    // code's performance). We could do better if we didn't print to the console
    // but then we wouldn't have any feedback.
    messagesPerSecond = parseInt(process.env.MPS ?? "1", 10),
    message = "Test message",
    chatId = process.env.CHAT_ID ?? "a3b29b3b-c092-4319-b045-bdbd44bdcd88", // This is just a random uuid (VSCode: Ctrl+Shift+[)
    floodReactionsEveryNMessages = 3,
    reactions = [":thumbsup:", ":)", "+1"]
) {
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

        client.on("connect_error", (e) => {
            connected.done = "Websocket connect error: " + e;
        });

        client.on("disconnect", (reason) => {
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

        const interval = 1000 / messagesPerSecond;
        let nextSendAt = Date.now() + interval;
        let messagesSent = 0;
        let totalMessagesSent = 0;

        let lastAckInfo: { msgSId: string; ack: boolean } = { msgSId: "", ack: false };
        client.on("chat.messages.send.ack", (msgSId) => {
            lastAckInfo = { msgSId, ack: true };
        });
        client.on("chat.messages.send.nack", (msgSId) => {
            lastAckInfo = { msgSId, ack: false };
        });

        console.info(`Sending test messages (${messagesPerSecond} msg/s)`);

        let messagesSinceLastReactionsFlood = 0;
        const startedSendingAt = Date.now();
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const action: Action<Message> = {
                op: "INSERT",
                data: {
                    sId: uuidv4(),
                    senderId: attendeeId,
                    chatId,
                    message: `${totalMessagesSent}: ${message}`,
                    data: {},
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    duplicatedMessageSId: undefined,
                    isPinned: false,
                    remoteServiceId: undefined,
                    systemId: undefined,
                    type: Chat_MessageType_Enum.Message,
                },
            };

            try {
                client.emit("chat.messages.send", action);

                const startedWaitingForAckAt = Date.now();
                while (lastAckInfo.msgSId !== action.data.sId && Date.now() - startedWaitingForAckAt < 10 * 1000) {
                    await wait(5);
                }

                if (lastAckInfo.msgSId !== action.data.sId) {
                    throw new Error("Sending message timed out");
                } else if (!lastAckInfo.ack) {
                    throw new Error("Message send was not acknowledged.");
                }
            } catch (e) {
                console.error("Error sending message", e);
            }

            totalMessagesSent++;

            messagesSinceLastReactionsFlood++;
            if (messagesSinceLastReactionsFlood === floodReactionsEveryNMessages) {
                try {
                    for (const reaction of reactions) {
                        const now = new Date();
                        const rct: Action<Reaction> = {
                            op: "INSERT",
                            data: {
                                sId: uuidv4(),
                                senderId: attendeeId,
                                data: {},
                                symbol: reaction,
                                type: Chat_ReactionType_Enum.Emoji,
                                chatId,
                                messageSId: action.data.sId,
                                created_at: now.toISOString(),
                                updated_at: now.toISOString(),
                            },
                        };
                        client.emit("chat.reactions.send", rct);
                        // We don't bother with an ack mechanism for reactions
                    }
                } catch (e) {
                    console.error("Error sending reactions", e);
                }
                messagesSinceLastReactionsFlood = 0;
            }

            messagesSent++;
            if (messagesSent === messagesPerSecond) {
                messagesSent = 0;
                process.stdout.write(
                    `${messagesPerSecond}|${totalMessagesSent}|${(
                        totalMessagesSent /
                        ((Date.now() - startedSendingAt) / 1000)
                    ).toFixed(1)}msgs/s\n`
                );
            }

            nextSendAt = nextSendAt + interval;
            const now = Date.now();
            const offset = nextSendAt - now;
            if (offset > 0) {
                if (offset > 5) {
                    await wait(offset);
                }
            } else {
                // console.info(`Publisher can't keep up (running ${(nextSendAt - now).toFixed(2)}ms slow)`);
                nextSendAt = now + interval;
            }
        }
    } catch (e) {
        process.stdout.write("\n");
        console.error("Error in main processing", e);
    }
}

Main();
