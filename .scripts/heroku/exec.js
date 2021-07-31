const { spawn } = require("child_process");
const { stderr, stdout } = require("process");

async function exec(command, args, cwd, accumulateData) {
    return new Promise((resolve, reject) => {
        console.log(`Executing "${cwd} ${command} ${args.join(" ")}"`);
        const ls = spawn(command, args, {
            cwd,
            shell: true,
        });
        const stdOutData = [];
        const stdErrData = [];

        ls.stdout.on("data", (data) => {
            stdout.write(data);
            if (accumulateData) {
                stdOutData.push(data);
            }
        });

        ls.stderr.on("data", (data) => {
            stderr.write(data);
            if (accumulateData) {
                stdErrData.push(data);
            }
        });

        ls.on("error", (error) => {
            reject(error, stdErrData);
        });

        ls.on("close", (code) => {
            resolve(code, stdOutData);
        });
    });
}

module.exports = {
    exec,
};
