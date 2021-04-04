export const MessageWritebackQueueSize = Math.max(
    1,
    parseInt(process.env.MESSAGE_WRITEBACK_QUEUE_SIZE ?? "", 10) || 100
);
export const MessageWritebackIntervalMs = Math.max(
    500,
    parseInt(process.env.MESSAGE_WRITEBACK_INTERVAL ?? "", 10) || 5000
);
export const ReactionWritebackQueueSize = Math.max(
    1,
    parseInt(process.env.REACTION_WRITEBACK_QUEUE_SIZE ?? "", 10) || 100
);
export const ReactionWritebackIntervalMs = Math.max(
    500,
    parseInt(process.env.REACTION_WRITEBACK_INTERVAL ?? "", 10) || 5000
);

console.info(`MessageWritebackQueueSize=${MessageWritebackQueueSize}`);
console.info(`MessageWritebackIntervalMs=${MessageWritebackIntervalMs}`);
console.info(`ReactionWritebackQueueSize=${ReactionWritebackQueueSize}`);
console.info(`ReactionWritebackIntervalMs=${ReactionWritebackIntervalMs}`);
