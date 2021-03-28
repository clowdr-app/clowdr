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
const userId = process.env.USER_ID;
const confSlug = process.env.CONFERENCE_SLUG;

async function Main() {
    const jwtResponse = await fetch(serverURL + `test/jwt?userId=${userId}&confSlug=${confSlug}`, { method: "GET" });
    const token = await jwtResponse.text();
    console.info("Obtained test JWT");

    const client = io(serverURL, {
        auth: {
            token,
        },
        transports: ["websocket"],
    });

    client.on("connect", () => {
        console.log("Websocket connected");
    });

    client.on("connect_error", (e) => {
        console.error("Websocket connect error", e);
    });
}

Main();
