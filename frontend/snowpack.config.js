/** @type {import("snowpack").SnowpackUserConfig } */

module.exports = {
    mount: {
        public: "/",
        src: "/_dist_",
    },
    packageOptions: {
        polyfillNode: true,
    },
    plugins: [
        "@snowpack/plugin-react-refresh",
        "@snowpack/plugin-dotenv",
        "@snowpack/plugin-typescript",
        [
            "@snowpack/plugin-webpack",
            {
                extendConfig: (config) => {
                    const targetPlugin = config.module.rules.reduce(
                        (acc, rule) => acc ?? rule.use.find((plugin) => plugin.loader.includes("babel-loader")),
                        undefined
                    );
                    if (!targetPlugin) {
                        throw new Error("Clowdr: Could not find babel-loader plugin!");
                    }
                    targetPlugin.options.plugins = [require.resolve("@babel/plugin-proposal-optional-chaining")];

                    return config;
                },
            },
        ],
    ],
    devOptions: {
        port: 3000,
    },
    buildOptions: {
        /* ... */
    },
    routes: [{ match: "routes", src: ".*", dest: "/index.html" }],
};
