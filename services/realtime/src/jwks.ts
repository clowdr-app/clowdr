export let testJWKs: any[] | undefined;
try {
    if (process.env.TEST_JWKS) {
        const jwks = JSON.parse(process.env.TEST_JWKS);
        if (jwks.keys && jwks.keys instanceof Array) {
            testJWKs = jwks.keys;
        }
    }
} catch (e) {
    console.error("Error loading test JWKs", e);
    console.log("Test JWKs var", process.env.TEST_JWKS);
}
