const { exec } = require("./exec");
const path = require("path");

const installCmd = ["ci"];
const buildCmd = ["run", "build"];
const rootDir = "./";
const npmCommand = "npm";

async function main() {
    await exec(npmCommand, installCmd, path.join(rootDir, "shared"));
    // Not needed because each of our microservice packages run "build shared"
    // exec(npmCommand, buildCmd, path.join(rootDir, "shared"));

    if (process.env.PROCFILE === "Playout.Procfile") {
        await exec(npmCommand, installCmd, path.join(rootDir, "services/playout"));
        await exec(npmCommand, buildCmd, path.join(rootDir, "services/playout"));
    } else if (process.env.PROCFILE === "Realtime.Procfile" || process.env.PROCFILE === "Realtime.Test.Procfile") {
        await exec(npmCommand, installCmd, path.join(rootDir, "services/realtime"));
        await exec(npmCommand, buildCmd, path.join(rootDir, "services/realtime"));
    } else if (process.env.PROCFILE === "Procfile") {
        await exec(npmCommand, installCmd, path.join(rootDir, "services/actions"));
        await exec(npmCommand, buildCmd, path.join(rootDir, "services/actions"));
    } else {
        throw new Error("Unrecognised target Procfile. Don't know what to build! See ./.scripts/heroku/build.js");
    }
}

main();
