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
export const uplink = amqplib.connect(url);
export const downlink = amqplib.connect(url);
