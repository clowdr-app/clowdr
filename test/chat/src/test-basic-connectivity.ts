import * as amqplib from "amqplib";

const testMessage = "something to do";

console.info("Running...");
console.info(
    `----
If the connection is successful, the next lines should print:
    Message sent: ${testMessage}
followed by
    Message received: ${testMessage}
----`
);

const q = "test";

const url = process.env.CLOUDAMQP_URL || "amqp://localhost:5672";
const open = amqplib.connect(url);

// Consumer
open.then(async function (conn) {
    const channel = conn.createChannel();
    const ch = await channel;
    ch.assertQueue(q);
    ch.consume(q, function (msg) {
        if (msg !== null) {
            console.log("Message received: " + msg.content.toString());
            ch.ack(msg);
        }
    });
}).then(null, console.warn);

// Publisher
open.then(async function (conn) {
    const channel = conn.createChannel();
    const ch = await channel;
    ch.assertQueue(q);
    ch.sendToQueue(q, Buffer.from(testMessage));
    console.log("Message sent: " + testMessage);
}).then(null, console.warn);
