import * as Bunyan from "bunyan";

export const ROOT_LOGGER = Bunyan.createLogger({
    name: "playout",
    level: "info",
});
