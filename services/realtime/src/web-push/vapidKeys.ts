import { gql } from "@apollo/client/core";
import assert from "assert";
import type { VapidKeys } from "web-push";
import { generateVAPIDKeys, setVapidDetails } from "web-push";
import { SetVapidKeysDocument, VapidKeysDocument } from "../generated/graphql";
import { testMode } from "../testMode";

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
        cachedVAPIDKeys = await testMode(
            async (apolloClient) => {
                // Check for existing keys
                const response = await apolloClient.query({
                    query: VapidKeysDocument,
                });
                if (response.data.publicKey && response.data.privateKey) {
                    return {
                        publicKey: response.data.publicKey.value,
                        privateKey: response.data.privateKey.value,
                    };
                } else {
                    const newKeys = generateVAPIDKeys();

                    await apolloClient.mutate({
                        mutation: SetVapidKeysDocument,
                        variables: newKeys,
                    });

                    return newKeys;
                }
            },
            // Note: Generating new vapid keys will invalidate any existing subscriptions
            //       so doing this in a real browser under test mode is likely to just
            //       be tedious - I wouldn't bother. Just don't use this feature of the
            //       realtime service in-browser when in test mode :)
            async () => cachedVAPIDKeys ?? generateVAPIDKeys()
        );

        assert(process.env.HOST_PUBLIC_URL, "Missing env var HOST_PUBLIC_URL");
        setVapidDetails(process.env.HOST_PUBLIC_URL, cachedVAPIDKeys.publicKey, cachedVAPIDKeys.privateKey);
    }
    return cachedVAPIDKeys;
}
