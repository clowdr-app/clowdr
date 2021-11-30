# Urql Cache Schema Generator for Hasura GraphQL APIs

This generator script takes Hasura Metadata v3 YAML files and outputs a
supplementary JSON schema file that details the origin of relationships between
database tables.

The generated JSON schema file is intended for use with the `Urql Hasura Generic Resolver`
class that is capable of automatically resolving conditional, paginated Hasura
queries.

This generator currently only handles object and array relationships between
tables within a single database. It correctly handles schemas within the
database and cross-schema relationships. The provided introspection function
only works for PostgreSQL databases. We welcome contributions to support other
databases.

## How to use

1. Install Node
1. Instal pnpm: `npm i -g pnpm`
1. Clone/download this package
1. Add the PostgreSQL function from `src/introspectionFunction.sql` to your API.
   Please refer to installation instructions below.
1. `pnpm i`
1. `pnpm build`
1. `pnpm start -- [opts]`

### Installing the PostgreSQL introspection function

TODO: Installation instructions

## Options

- `--metadata-dir [path]` **(Required)**

  Path to the root directory of your Hasura Metadata v3

  - Shorthand: `-d`

- `--output [file path]` **(Required)**

  Path to the output JSON file.

  - Shorthand: `-o`

- `--api [url]` **(Required)**

  URL to your GraphQL API (for querying the custom introspection function)

  - Shorthand: `-a`

- `--hasura-admin-secret [secret]` **(Required)**

  Admin secret for your GraphQL API (for querying the custom introspection function)

  - Shorthand: `-s`

## How it works

### Just enough understanding of GraphQL schemas

The aim is to produce an output schema in the same JSON-formatted structure that
GraphQL CodeGen outputs. This is a JSON representation of a compiled [GraphQL
Schema](https://spec.graphql.org). This schema will specify enough information
to know how to look up a related field from a local key and any existing records
in the local cache.

We cannot use the GraphQL schema from Hasura directly because (at the time of
writing) GraphQL schemas do not offer a way to specify the fields for a
foreign-key-style relationship. In fact GraphQL offers no way to identify keyed
relationships at all.

The main pieces of the specification of interest to us are:

1. Language
   1. [Query operations](https://spec.graphql.org/October2021/#sec-Language.Operations)
   1. [Selection sets](https://spec.graphql.org/October2021/#sec-Selection-Sets)
   1. [Fields](https://spec.graphql.org/October2021/#sec-Language.Fields)
      - In particular, fields made up of selection sets where such selection set
        is derived from a key field and a relationship another queryable entity.
        I.e. a foreign key relation.
   1. [Type
      references](https://spec.graphql.org/October2021/#sec-Type-References)
1. [Type system](https://spec.graphql.org/October2021/#sec-Type-System)

   This is primarily background information. We are chiefly concerned with
   schema introspection.

1. [Introspection](https://spec.graphql.org/October2021/#sec-Introspection)

   Again, focusing on Queries and Fields.

   1. [Schema Introspection Schema](https://spec.graphql.org/October2021/#sec-Schema-Introspection.Schema-Introspection-Schema)

In short, a type contains fields which specify a target type name and possibly
some arguments. In our case, we're interested in fields that specify non-scalar
types whose field type matches a table in the database.

### Augmenting the GraphQL Schema

We want to augment the schema with enough information to know how to look up a
related field from a local key and any existing records in the local cache. For
a given relational field of a type, we will need:

1. The name of the **relationship** (which is the name field in the type),
1. The name of the **local field** for the relationship (which must and will be a
   scalar-field from the same type as the relational field),
1. The name of the **remote field** for the relationship

The name of the destination type of the relational field is already known from
the schema. Whether the relationship is an object or array relationship is also
known from the schema based on whether the field type is a list or not. It is
useful that all type information is already available in the GraphQL schema -
we will not have to do anything fancy to dissect list types etc.

### Parsing the Hasura Metadata (v3)

The [Metadata format reference](https://hasura.io/docs/latest/graphql/core/migrations/reference/metadata-format.html)
is not particularly your friend here. It leaves the interesting part (the table
specification format) unspecified. The process and information below is derived
by reading Hasura's source code and the output of Hasura's CLI. This means it
may be brittle and break without warning if Hasura change their mind on some
undocumented but relied upon by us part of the table specification format.

1. Parse `databases.yaml` to determine the databases to look for.
1. For each database, follow the `tables` directives to aggregate a list of
   tables.
   1. A path to a specific table YAML specification file
   1. A directive to include another YAML file (`!include`)
1. For each table within a database:

   1. Lookup `object_relationships` (if any).

      Object relationships specify the relationship name and the relationship
      type: foreign-key or manual. At this stage, we simply aggregate the object
      relationship information.

      Examples of object relationship specifications:

      ```yaml
      - name: conference
        using:
          foreign_key_constraint_on: conferenceId
      ```

      ```yaml
      - name: element
        using:
          manual_configuration:
            column_mapping:
              elementId: id
            insertion_order: null
            remote_table:
              name: Element
              schema: content
      ```

      As previously established, we are lucky that GraphQL already handles all
      the type information for us. We only need to extract the column mapping.

   1. Lookup `array_relationships` (if any).

      Array relationships specify the relationship name and the relationship
      type: foreign-key or manual. At this stage, we simply aggregate the array
      relationship information.

      ```yaml
      - name: flags
        using:
          foreign_key_constraint_on:
            column: messageSId
            table:
              name: Flag
              schema: chat
      ```

      ```yaml
      - name: stats
        using:
          manual_configuration:
            column_mapping:
              id: elementId
            insertion_order: null
            remote_table:
              name: ContentElementStats
              schema: analytics
      ```

At this stage we have aggregated the object and array relationship information
for each table in each database.

### The Hasura Metadata is severely lacking

Unfortunately, there is a hidden problem. The `foreign_key_constraint_on`
specifications do not specify the name of the destination and source columns
for object and array relationships respectively.

We might try to assume that the primary key is the endpoint of such foreign
keys, however, this is frequently not the case and will result in an incorrect
schema.

What are we to do then?

### PostgreSQL Introspection Function

This package provides a PostgreSQL function to add to your database and GraphQL
API. This function navigates Postgres' and Hasura's internal metadata to return
the complete foreign key information. This generator script queries the function
(using the Admin secret) to obtain this necessary supplementary information.

There is an additional detail to be aware of before we proceed: foreign keys may
be specified on multiple columns. In fact, relationships in general (i.e.
including manual relationships) may be specified on multiple columns. We will
account for this by treating relationships as specifying a column mapping, being
a list of pairs of field names.

TODO: How the introspection function works

### Piecing it all together

We now have enough information to output our augmentation schema file.

1. For each foreign key object relationship:
   1. Lookup the foreign key information to obtain the remote field name
   1. Append the relationship name and local to remote field mapping to the
      table information
1. For each manual object relationship:
   1. Append the relationship name and local to remote field mapping to the
      table information
1. TODO: Continue this logic for array relationships
1. Output the table information in the same structure as the Schema JSON.
   - This facilitates easier traversal in the resolver code since it will traverse
     both the schema JSON and our augmented schema JSON.
