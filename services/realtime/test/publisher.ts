import assert from "assert";
import fetch from "node-fetch";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

assert(process.env.SERVER_URL, "Missing SERVER_URL env var");
assert(
    process.env.SERVER_URL.endsWith("/"),
    `SERVER_URL env var should have a trailing slash: ${process.env.SERVER_URL}`
);
assert(process.env.USER_ID, "Missing USER_ID env var");
assert(process.env.CONFERENCE_SLUG, "Missing CONFERENCE_SLUG env var");

const serverURL = process.env.SERVER_URL;
const userId = process.env.USER_ID;
const confSlug = process.env.CONFERENCE_SLUG;

async function wait(ms: number) {
    await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), ms);
    });
}

async function Main(
    messagesPerSecond = 10,
    message = "Test message",
    chatId = "testChat1",
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
        console.info("    . = 1 message sent");
        console.info("    * = 1 message sent and reactions sent");

        let messagesSinceLastReactionsFlood = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const msg = {
                sId: uuidv4(),
                message,
                chatId,
            };

            try {
                client.emit("chat.messages.send", msg);

                const startedWaitingForAckAt = Date.now();
                while (lastAckInfo.msgSId !== msg.sId && Date.now() - startedWaitingForAckAt < 10 * 1000) {
                    await wait(100);
                }

                if (lastAckInfo.msgSId !== msg.sId) {
                    throw new Error("Sending message timed out");
                } else if (!lastAckInfo.ack) {
                    throw new Error("Message send was not acknowledged.");
                }
            } catch (e) {
                console.error("Error sending message", e);
            }

            totalMessagesSent++;
            if (messagesSent === 0) {
                process.stdout.write(`${messagesPerSecond}|`);
            }

            messagesSinceLastReactionsFlood++;
            if (messagesSinceLastReactionsFlood === floodReactionsEveryNMessages) {
                process.stdout.write("*");
                try {
                    for (const reaction of reactions) {
                        const rct = {
                            sId: uuidv4(),
                            reaction,
                            chatId,
                            messageId: msg.sId,
                        };
                        client.emit("chat.reactions.send", rct);
                        // We don't bother with an ack mechanism for reactions
                    }
                } catch (e) {
                    console.error("Error sending reactions", e);
                }
                messagesSinceLastReactionsFlood = 0;
            } else {
                process.stdout.write(".");
            }

            messagesSent++;
            if (messagesSent === messagesPerSecond) {
                messagesSent = 0;
                process.stdout.write(`|${totalMessagesSent}\n`);
            }

            nextSendAt = nextSendAt + interval;
            const now = Date.now();
            await wait(nextSendAt - now);
        }
    } catch (e) {
        process.stdout.write("\n");
        console.error("Error in main processing", e);
    }
}

Main();
