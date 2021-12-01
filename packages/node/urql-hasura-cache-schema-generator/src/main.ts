import { Command, Flags } from "@oclif/core";
import { handle } from "@oclif/core/lib/errors/handle";
import axios from "axios";
import compareVersions from "compare-versions";
import fs from "fs";
import Path from "path";
import { URL } from "url";
import YAML from "yaml";

interface ForeignKey {
    constraint_name: string;
    parent_schema: string;
    parent_table: string;
    parent_column: string;
    child_schema: string;
    child_table: string;
    child_column: string;
}

interface DatabaseSpec {
    name: string;
    kind: string;
    tables: string | string[];
}

interface TableDetailsSpec {
    name: string;
    schema: string;
}

type ObjectRelationshipUsingSpec =
    | {
          foreign_key_constraint_on: string;
      }
    | {
          manual_configuration: {
              column_mapping: Record<string, string>;
              remote_table: TableDetailsSpec;
          };
      };

interface ObjectRelationshipSpec {
    name: string;
    using: ObjectRelationshipUsingSpec;
}

type ArrayRelationshipUsingSpec =
    | {
          foreign_key_constraint_on: {
              column: string;
              table: TableDetailsSpec;
          };
      }
    | {
          manual_configuration: {
              column_mapping: Record<string, string>;
              remote_table: TableDetailsSpec;
          };
      };

interface ArrayRelationshipSpec {
    name: string;
    using: ArrayRelationshipUsingSpec;
}

interface TableSpec {
    table: TableDetailsSpec;
    object_relationships: ObjectRelationshipSpec[];
    array_relationships: ArrayRelationshipSpec[];
}

interface ProgramFlags {
    metadataDir: string;
    output: string;
    api: URL;
    hasuraAdminSecret: string;
}

class LS extends Command {
    static flags = {
        version: Flags.version(),
        help: Flags.help(),
        metadataDir: Flags.string({
            char: "d",
            default: Path.join(process.cwd(), "../../../hasura/metadata"),
            required: true,
            name: "Hasura Metadata v3 Directory",
            description: "Path to the root directory of your Hasura Metadata v3",
        }),
        output: Flags.string({
            char: "o",
            default: Path.join(process.cwd(), "./graphql.augschema.json"),
            required: true,
            name: "Output File Path",
            description: "Path to the output JSON file.",
        }),
        api: Flags.url({
            char: "a",
            default: new URL("http://localhost:8080/v1/graphql"),
            required: true,
            name: "Hasura GraphQL API URL",
            description: "URL to your GraphQL API (for querying the custom introspection function)",
        }),
        hasuraAdminSecret: Flags.string({
            char: "s",
            default: "XXXXX",
            required: true,
            name: "Hasura Admin Secret",
            description: "Admin secret for your GraphQL API (for querying the custom introspection function)",
        }),
    };

    async run() {
        const { flags } = await this.parse(LS);

        this.preamble(flags);
        this.checkMetadataExists(flags);
        this.checkOutputDirectoryExists(flags);

        await this.validateAPIVersion(flags);

        const supportedDatabases: DatabaseSpec[] = this.getSupportedDatabases(flags);

        for (const database of supportedDatabases) {
            await this.processDatabase(database, flags);
        }
    }

    async _help() {
        this.log("ToDo: help");
    }

    private preamble(flags: ProgramFlags) {
        this.log();
        this.log("Urql Cache Schema Generator for Hasura GraphQL APIs");
        this.log("===================================================");
        this.log();
        this.log(`Metadata Directory  : ${flags.metadataDir}`);
        this.log(`Output File         : ${flags.output}`);
        this.log(`GraphQL API         : ${flags.api}`);
        this.log(`Hasura Admin Secret : ${flags.hasuraAdminSecret}`);
        this.log();
        this.log("---------------------------------------------------");
        this.log();
    }

    private checkMetadataExists(flags: ProgramFlags) {
        if (!fs.existsSync(flags.metadataDir)) {
            this.error("Metadata directory not found.");
        }

        if (!fs.existsSync(Path.join(flags.metadataDir, "/databases/databases.yaml"))) {
            this.error("Metadata: databases.yaml not found.");
        }
    }

    private checkOutputDirectoryExists(flags: ProgramFlags) {
        if (!fs.existsSync(Path.dirname(flags.output))) {
            this.error("Directory for the output file does not exist.");
        }
    }

    private async validateAPIVersion(flags: ProgramFlags) {
        const versionURL = new URL(flags.api.toString());
        versionURL.pathname = versionURL.pathname.replace(/\/graphql$/, "/version");
        try {
            const versionResponse = await axios.get(versionURL.toString(), {
                responseType: "json",
                headers: {
                    "X-Hasura-Admin-Secret": flags.hasuraAdminSecret,
                },
            });

            if (versionResponse.status !== 200) {
                throw new Error(`Response status code was ${versionResponse.status}. Expected 200.`);
            }

            if (!("version" in versionResponse.data)) {
                throw new Error('"version" field was not present in the version response');
            }

            if (typeof versionResponse.data.version !== "string") {
                throw new Error('"version" field was not a string');
            }

            if (compareVersions("2.0.0", versionResponse.data.version) === 1) {
                throw new Error(`Hasura GraphQL API version ${versionResponse.data.version} less than 2.0.0`);
            }

            if (compareVersions("3.0.0", versionResponse.data.version) !== 1) {
                throw new Error(`Hasura GraphQL API version ${versionResponse.data.version} not version 2.x.x`);
            }

            this.log(`GraphQL API version: ${versionResponse.data.version}`);
        } catch (e: any) {
            this.error(`Unable to fetch Hasura GraphQL API version: ${e}`);
        }
    }

    private getSupportedDatabases(flags: ProgramFlags) {
        this.log("\nDatabases:");
        const databasesYAMLFile = fs.readFileSync(Path.join(flags.metadataDir, "/databases/databases.yaml"));
        const databases: DatabaseSpec[] = YAML.parse(databasesYAMLFile.toString());
        const supportedDatabases: DatabaseSpec[] = [];
        for (const database of databases) {
            if (database.kind === "postgres") {
                this.log(`    - ${database.name}`);
                supportedDatabases.push(database);
            } else {
                this.log(`    - ${database.name} (skipped - ${database.kind} not supported)`);
            }
        }

        if (supportedDatabases.length === 0) {
            this.error("No databases detected");
        }
        this.log("");

        if (!supportedDatabases.some((x) => x.name === "default")) {
            this.error(
                "At the moment this script only handles the 'default' database and only supports Postgres databases."
            );
        }
        return supportedDatabases;
    }

    private async processDatabase(database: DatabaseSpec, flags: ProgramFlags) {
        if (database.name === "default") {
            await this.getDatabaseForeignKeys(flags);

            const tables: TableSpec[] = [];
            if (typeof database.tables === "string") {
                tables.push(...(await this.getTables(Path.join(flags.metadataDir, "/databases"), database.tables)));
            } else {
                for (const path of database.tables) {
                    tables.push(...(await this.getTables(Path.join(flags.metadataDir, "/databases"), path)));
                }
            }

            // TODO
            this.log("Tables:");
            tables.sort(
                (x, y) => x.table.schema.localeCompare(y.table.schema) || x.table.name.localeCompare(y.table.name)
            );
            for (const table of tables) {
                this.log(` - ${table.table.schema}.${table.table.name}`);
            }
        }
    }

    private async getDatabaseForeignKeys(flags: ProgramFlags): Promise<ForeignKey[]> {
        try {
            const foreignKeysResponse = await axios.post(
                flags.api.toString(),
                {
                    query: `
query ForeignKeys {
    ForeignKeyIntrospection {
        constraint_name
        parent_schema
        parent_table
        parent_column
        child_schema
        child_table
        child_column
    }
}`,
                },
                {
                    responseType: "json",
                    headers: {
                        "X-Hasura-Admin-Secret": flags.hasuraAdminSecret,
                    },
                }
            );

            if (foreignKeysResponse.status !== 200) {
                throw new Error(`Response status code was ${foreignKeysResponse.status}. Expected 200.`);
            }

            if (!("data" in foreignKeysResponse.data)) {
                throw new Error('"data" field was not present in the foreign keys response');
            }

            if (typeof foreignKeysResponse.data.data !== "object") {
                throw new Error('"data" field was not an object');
            }

            const data = foreignKeysResponse.data.data;

            if (!("ForeignKeyIntrospection" in data)) {
                throw new Error('"ForeignKeyIntrospection" field was not present in the foreign keys response data');
            }

            if (!(data.ForeignKeyIntrospection instanceof Array)) {
                throw new Error('"ForeignKeyIntrospection" field was not an array');
            }

            this.log("Foreign keys obtained by introspection.");

            return data.ForeignKeyIntrospection;
        } catch (e: any) {
            this.error(`Unable to fetch foreign key introspection query: ${e}`);
        }
    }

    async getTables(tablesMetadataPath: string, path: string): Promise<TableSpec[]> {
        const tableSpecs: TableSpec[] = [];
        if (path.startsWith("!include ")) {
            const filePath = Path.join(tablesMetadataPath, path.substring("!include ".length));
            const file = fs.readFileSync(filePath);
            const fileYAML = YAML.parse(file.toString());
            if (typeof fileYAML === "object") {
                if (fileYAML instanceof Array) {
                    // Table paths
                    for (const innerPath of fileYAML) {
                        tableSpecs.push(...(await this.getTables(Path.dirname(filePath), innerPath)));
                    }
                } else {
                    // Table data
                    tableSpecs.push(fileYAML);
                }
            }
        } else {
            throw new Error("Cannot process a path that is not a YAML include");
        }
        return tableSpecs;
    }
}

LS.run().then(undefined, handle);
