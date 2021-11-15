import { logger } from "../../lib/logger";

export const MessageDistributionQueueSize = Math.max(
    1,
    parseInt(process.env.MESSAGE_DISTRIBUTION_QUEUE_SIZE ?? "", 10) || 5
);
export const MessageWritebackQueueSize = Math.max(
    1,
    parseInt(process.env.MESSAGE_WRITEBACK_QUEUE_SIZE ?? "", 10) || 100
);
export const MessageWritebackIntervalMs = Math.max(
    500,
    parseInt(process.env.MESSAGE_WRITEBACK_INTERVAL ?? "", 10) || 5000
);
export const ReactionDistributionQueueSize = Math.max(
    1,
    parseInt(process.env.REACTION_DISTRIBUTION_QUEUE_SIZE ?? "", 10) || 5
);
export const ReactionWritebackQueueSize = Math.max(
    1,
    parseInt(process.env.REACTION_WRITEBACK_QUEUE_SIZE ?? "", 10) || 100
);
export const ReactionWritebackIntervalMs = Math.max(
    500,
    parseInt(process.env.REACTION_WRITEBACK_INTERVAL ?? "", 10) || 5000
);

logger.info(`MessageDistributionQueueSize=${MessageDistributionQueueSize}`);
logger.info(`MessageWritebackQueueSize=${MessageWritebackQueueSize}`);
logger.info(`MessageWritebackIntervalMs=${MessageWritebackIntervalMs}`);
logger.info(`ReactionDistributionQueueSize=${ReactionDistributionQueueSize}`);
logger.info(`ReactionWritebackQueueSize=${ReactionWritebackQueueSize}`);
logger.info(`ReactionWritebackIntervalMs=${ReactionWritebackIntervalMs}`);
