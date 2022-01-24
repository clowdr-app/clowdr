import { gql } from "@apollo/client";
import React from "react";
import { Redirect } from "react-router-dom";
import { useGetChatPathQuery } from "../../generated/graphql";
import CenteredSpinner from "../Chakra/CenteredSpinner";
import { useConference } from "../Conference/useConference";
import useQueryErrorToast from "../GQL/useQueryErrorToast";
import { FormattedMessage } from "react-intl";

gql`
    query GetChatPath($chatId: uuid!) {
        chat_Chat_by_pk(id: $chatId) {
            id
            rooms {
                id
            }
            items {
                id
            }
        }
    }
`;

export default function ChatRedirectPage({ chatId }: { chatId: string }): JSX.Element {
    const { loading, error, data } = useGetChatPathQuery({
        variables: {
            chatId,
        },
    });
    useQueryErrorToast(error, false, "Get chat path");

    const conference = useConference();

    if (loading || (!data?.chat_Chat_by_pk?.rooms && !data?.chat_Chat_by_pk?.items)) {
        return <CenteredSpinner />;
    }

    if (error) {
        return <>
            <FormattedMessage
                id="chat.ChatRedirectPage.error"
                defaultMessage="Error loading chat info"
            />
        </>;
    }

    return (
        <Redirect
            to={`/conference/${conference.slug}${
                data?.chat_Chat_by_pk?.rooms
                    ? `/room/${data?.chat_Chat_by_pk?.rooms[0]?.id}`
                    : `/item/${data?.chat_Chat_by_pk?.items[0]?.id}`
            }`}
        />
    );
}
