// NODE_ENV=test - Needed by "@snowpack/web-test-runner-plugin"
process.env.NODE_ENV = "test";

module.exports = {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ...require("@snowpack/app-scripts-react/jest.config.js")(),
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageProvider: "babel",
};
