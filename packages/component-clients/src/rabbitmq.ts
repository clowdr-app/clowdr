import * as amqplib from "amqplib";

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
export async function uplink(): Promise<amqplib.Connection> {
    if (!_uplink) {
        _uplink = await amqplib.connect(url);
    }
    return _uplink;
}

let _downlink: amqplib.Connection | undefined;
export async function downlink(): Promise<amqplib.Connection> {
    if (!_downlink) {
        _downlink = await amqplib.connect(url);
    }
    return _downlink;
}
