import React from "react";
import { Redirect } from "react-router-dom";
import { gql } from "urql";
import { useGetChatPathQuery } from "../../generated/graphql";
import CenteredSpinner from "../Chakra/CenteredSpinner";
import { useAuthParameters } from "../GQL/AuthParameters";
import useQueryErrorToast from "../GQL/useQueryErrorToast";

gql`
    query GetChatPath($chatId: uuid!) {
        chat_Chat_by_pk(id: $chatId) {
            id
            room {
                id
            }
            item {
                id
            }
        }
    }
`;

export default function ChatRedirectPage({ chatId }: { chatId: string }): JSX.Element {
    const [{ fetching: loading, error, data }] = useGetChatPathQuery({
        variables: {
            chatId,
        },
    });
    useQueryErrorToast(error, false, "Get chat path");

    const { conferencePath } = useAuthParameters();

    if (loading || (!data?.chat_Chat_by_pk?.room && !data?.chat_Chat_by_pk?.item)) {
        return <CenteredSpinner caller="ChatRedirectPage:34" />;
    }

    if (error) {
        return <>Error loading chat info</>;
    }

    return (
        <Redirect
            to={`${conferencePath}${
                data?.chat_Chat_by_pk?.room
                    ? `/room/${data?.chat_Chat_by_pk?.room.id}`
                    : `/item/${data?.chat_Chat_by_pk?.item?.id}`
            }`}
        />
    );
}
