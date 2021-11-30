import { Command, Flags } from "@oclif/core";
import { handle } from "@oclif/core/lib/errors/handle";

class LS extends Command {
    static flags = {
        version: Flags.version(),
        help: Flags.help(),
    };

    async run() {
        const { flags: _flags } = await this.parse(LS);

        // TODO
        this.log("ToDo: Implementation");
    }

    async _help() {
        this.log("ToDo: help");
    }
}

LS.run().then(undefined, handle);
