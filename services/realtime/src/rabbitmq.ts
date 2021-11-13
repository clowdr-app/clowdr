import * as amqplib from "amqplib";
import { Mutex } from "async-mutex";

const url =
    process.env.CLOUDAMQP_URL ||
    `amqp://${
        process.env.RABBITMQ_USERNAME
            ? `${encodeURIComponent(process.env.RABBITMQ_USERNAME)}${
                  process.env.RABBITMQ_PASSWORD ? `:${encodeURIComponent(process.env.RABBITMQ_PASSWORD)}` : ""
              }@`
            : ""
    }localhost:5672`;

let _uplink: amqplib.Connection | undefined;
const uplinkMutex = new Mutex();
export async function uplink(): Promise<amqplib.Connection> {
    const release = await uplinkMutex.acquire();
    try {
        if (!_uplink) {
            _uplink = await amqplib.connect(url);

            _uplink.on("error", function (err) {
                if (err.message !== "Connection closing") {
                    console.error("[AMQP] Uplink connection error", err.message);
                }
            });
            _uplink.on("close", function () {
                console.error("[AMQP] Uplink connection closed");
                return setTimeout(() => {
                    _uplink = undefined;
                }, 500);
            });
        }
    } finally {
        release();
    }
    return _uplink;
}

let _downlink: amqplib.Connection | undefined;
const downlinkMutex = new Mutex();
export async function downlink(): Promise<amqplib.Connection> {
    const release = await downlinkMutex.acquire();
    try {
        if (!_downlink) {
            _downlink = await amqplib.connect(url);

            _downlink.on("error", function (err) {
                if (err.message !== "Connection closing") {
                    console.error("[AMQP] Downlink connection error", err.message);
                }
            });
            _downlink.on("close", function () {
                console.error("[AMQP] Downlink connection closed");
                return setTimeout(() => {
                    _downlink = undefined;
                }, 500);
            });
        }
    } finally {
        release();
    }
    return _downlink;
}
