import { logger } from "./lib/logger";

export let testJWKs: any[] | undefined;
try {
    if (process.env.TEST_JWKS) {
        const jwks = JSON.parse(process.env.TEST_JWKS);
        if (jwks.keys && jwks.keys instanceof Array) {
            testJWKs = jwks.keys;
            logger.info("Loaded test JWKs");
        }
    }
} catch (error: any) {
    logger.error({ error }, "Error loading test JWKs");
    logger.info("Test JWKs var", process.env.TEST_JWKS);
}
