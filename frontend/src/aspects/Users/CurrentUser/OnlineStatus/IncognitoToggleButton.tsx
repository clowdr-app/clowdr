import { gql } from "@apollo/client";
import { Button, Spinner, Tooltip } from "@chakra-ui/react";
import React from "react";
import {
    useGetCurrentUserIsIncognitoQuery,
    useUpdateCurrentUserIsIncognitoMutation,
} from "../../../../generated/graphql";
import useUserId from "../../../Auth/useUserId";
import FAIcon from "../../../Icons/FAIcon";

const _currentUserIsIncognitoQueries = gql`
    query getCurrentUserIsIncognito($userId: String!) {
        OnlineStatus(where: { userId: { _eq: $userId } }) {
            id
            isIncognito
        }
    }

    mutation updateCurrentUserIsIncognito($userId: String!, $isIncognito: Boolean = false) {
        update_OnlineStatus(_set: { isIncognito: $isIncognito }, where: { userId: { _eq: $userId } }) {
            returning {
                id
                isIncognito
            }
        }
    }
`;

export default function IncognitoToggleButton(): JSX.Element {
    const userId = useUserId();

    if (userId) {
        return <IncognitoToggleButton_WithUserId userId={userId} />;
    } else {
        return <></>;
    }
}

function IncognitoToggleButton_WithUserId({ userId }: { userId: string }) {
    const {
        loading: getIsIncognitoLoading,
        error: getIsIncognitoError,
        data: isIncognitoData,
    } = useGetCurrentUserIsIncognitoQuery({
        variables: { userId },
        fetchPolicy: "network-only",
    });
    const isIncognito = isIncognitoData?.OnlineStatus[0]?.isIncognito;

    const [
        updateCurrentUserIsIncognitoMutation,
        { loading: setIsIncognitoLoading, error: setIsIncognitoError },
    ] = useUpdateCurrentUserIsIncognitoMutation({
        variables: {
            userId,
            isIncognito: !isIncognito,
        },
    });

    const loading = getIsIncognitoLoading || setIsIncognitoLoading;
    const error = getIsIncognitoError
        ? "Error loading incognito mode! " + getIsIncognitoError
        : setIsIncognitoError
        ? "Error setting incognito mode! " + setIsIncognitoError
        : false;

    return (
        <IncognitoToggleButtonElements
            isIncognito={
                {
                    loading,
                    error,
                    value: isIncognito,
                } as any
            }
            toggleIsIncognito={async () => {
                updateCurrentUserIsIncognitoMutation();
            }}
        />
    );
}

function IncognitoToggleButtonElements(props: {
    isIncognito:
        | {
              loading: true;
              error: false;
              value: undefined;
          }
        | {
              loading: false;
              error: string;
              value: undefined;
          }
        | {
              loading: false;
              value: boolean | undefined;
              error: false;
          };
    toggleIsIncognito: () => Promise<void>;
}) {
    if (props.isIncognito.value === undefined && !props.isIncognito.loading && !props.isIncognito.error) {
        return <></>;
    }

    let icon: JSX.Element;
    let tooltip = "Incognito mode";
    if (props.isIncognito.error) {
        icon = <FAIcon icon="exclamation-triangle" iconStyle="s" />;
        tooltip = props.isIncognito.error;
    }

    if (props.isIncognito.loading) {
        tooltip = "Please wait…";
        icon = <Spinner />;
    } else {
        tooltip += " " + (props.isIncognito.value ? " active" : " inactive");
        icon = <FAIcon icon="user-secret" iconStyle="s" />;
    }

    const button = (
        <Button
            colorScheme={props.isIncognito.value ? "pink" : "gray"}
            aria-label="Toggle incognito mode"
            title="Toggle incognito mode"
            disabled={!!props.isIncognito.error || props.isIncognito.loading}
            onClick={(ev) => {
                ev.stopPropagation();
                props.toggleIsIncognito();
            }}
            size="sm"
        >
            {icon}
        </Button>
    );

    return <Tooltip label={tooltip}>{button}</Tooltip>;
}
