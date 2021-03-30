import assert from "assert";
import fetch from "node-fetch";
import { io } from "socket.io-client";

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

async function wait(ms: number) {
    await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), ms);
    });
}

async function Main(chatId = "testChat1") {
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

        client.on("chat.messages.receive", (message) => {
            console.info("Message received", message);
        });

        client.emit("chat.subscribe", chatId);

        // eslint-disable-next-line no-constant-condition
        while (true) {
            console.info("[Running]");
            await wait(10000);
        }
    } catch (e) {
        process.stdout.write("\n");
        console.error("Error in main processing", e);
    }
}

Main();
