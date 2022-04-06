import { Spinner, useToast } from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import React, { useCallback, useMemo } from "react";
import type { Conference_ConfigurationKey_Enum } from "../../../../generated/graphql";
import {
    useMultiSettingUpdater_DeleteConfigurationsMutation,
    useMultiSettingUpdater_GetConfigurationsQuery,
} from "../../../../generated/graphql";
import { makeContext } from "../../../GQL/make-context";
import { useConference } from "../../useConference";

gql`
    query MultiSettingUpdater_GetConfigurations($conferenceId: uuid!, $keys: [conference_ConfigurationKey_enum!]!) {
        conference_Configuration(where: { conferenceId: { _eq: $conferenceId }, key: { _in: $keys } }) {
            conferenceId
            key
            value
        }
    }

    mutation MultiSettingUpdater_DeleteConfigurations(
        $conferenceId: uuid!
        $keys: [conference_ConfigurationKey_enum!]!
    ) {
        delete_conference_Configuration(where: { conferenceId: { _eq: $conferenceId }, key: { _in: $keys } }) {
            returning {
                conferenceId
                key
            }
        }
    }
`;

export interface MultiSettingChildProps {
    settingNames: Conference_ConfigurationKey_Enum[];
    values: readonly {
        key: Conference_ConfigurationKey_Enum;
        value: any;
    }[];
    deleteAll: () => void;
}

export default function MultiSettingUpdater({
    settingNames,
    children,
}: {
    settingNames: Conference_ConfigurationKey_Enum[];
    children: (props: MultiSettingChildProps) => JSX.Element;
}): JSX.Element {
    const context = useMemo(
        () =>
            makeContext(
                {
                    [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                },
                ["conference_Configuration"]
            ),
        []
    );
    const conference = useConference();
    const [setting] = useMultiSettingUpdater_GetConfigurationsQuery({
        variables: {
            conferenceId: conference.id,
            keys: settingNames,
        },
        requestPolicy: "network-only",
        context,
    });
    const [, deleteSettings] = useMultiSettingUpdater_DeleteConfigurationsMutation();
    const toast = useToast();
    const deleteAll = useCallback(async () => {
        try {
            await deleteSettings(
                {
                    conferenceId: conference.id,
                    keys: settingNames,
                },
                {
                    fetchOptions: {
                        headers: {
                            [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                        },
                    },
                }
            );
            toast({
                status: "success",
                title: "Settings cleared",
                isClosable: true,
                duration: 2000,
                position: "bottom",
                onCloseComplete: () => {
                    window.location.reload();
                },
            });
        } catch (e: any) {
            toast({
                status: "error",
                title: "Failed to delete settings",
                description: e.toString(),
                isClosable: true,
                position: "bottom",
            });
        }
    }, [conference.id, deleteSettings, settingNames, toast]);

    return setting.data ? (
        children({
            settingNames,
            values: setting.data.conference_Configuration,
            deleteAll,
        })
    ) : (
        <Spinner label="Loading" />
    );
}
