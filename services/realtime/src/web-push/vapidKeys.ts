import { gqlClient } from "@midspace/component-clients/graphqlClient";
import assert from "assert";
import { gql } from "graphql-tag";
import type { VapidKeys } from "web-push";
import { generateVAPIDKeys, setVapidDetails } from "web-push";
import type { SetVapidKeysMutation, SetVapidKeysMutationVariables } from "../generated/graphql";
import { SetVapidKeysDocument, VapidKeysDocument } from "../generated/graphql";

gql`
    query VAPIDKeys {
        publicKey: system_Configuration_by_pk(key: VAPID_PUBLIC_KEY) {
            key
            value
        }
        privateKey: system_Configuration_by_pk(key: VAPID_PRIVATE_KEY) {
            key
            value
        }
    }

    mutation SetVAPIDKeys($publicKey: jsonb!, $privateKey: jsonb!) {
        insert_system_Configuration(
            objects: [{ key: VAPID_PUBLIC_KEY, value: $publicKey }, { key: VAPID_PRIVATE_KEY, value: $privateKey }]
            on_conflict: { constraint: Configuration_pkey, update_columns: [value] }
        ) {
            affected_rows
        }
    }
`;

let cachedVAPIDKeys: VapidKeys | null = null;

export async function getVAPIDKeys(): Promise<VapidKeys> {
    if (!cachedVAPIDKeys) {
        cachedVAPIDKeys = await (async () => {
            // Check for existing keys
            const response = await gqlClient?.query(VapidKeysDocument).toPromise();
            if (response?.data.publicKey && response?.data.privateKey) {
                return {
                    publicKey: response.data.publicKey.value,
                    privateKey: response.data.privateKey.value,
                };
            } else {
                const newKeys = generateVAPIDKeys();

                await gqlClient
                    ?.mutation<SetVapidKeysMutation, SetVapidKeysMutationVariables>(SetVapidKeysDocument, newKeys)
                    .toPromise();

                return newKeys;
            }
        })();

        assert(process.env.HOST_PUBLIC_URL, "Missing env var HOST_PUBLIC_URL");
        setVapidDetails(process.env.HOST_PUBLIC_URL, cachedVAPIDKeys.publicKey, cachedVAPIDKeys.privateKey);
    }
    return cachedVAPIDKeys;
}
