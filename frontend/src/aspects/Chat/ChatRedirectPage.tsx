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
    const [{ loading, error, data }] = useGetChatPathQuery({
        variables: {
            chatId,
        },
    });
    useQueryErrorToast(error, false, "Get chat path");

    const { conferencePath } = useAuthParameters();

    if (loading || (!data?.chat_Chat_by_pk?.rooms && !data?.chat_Chat_by_pk?.items)) {
        return <CenteredSpinner />;
    }

    if (error) {
        return <>Error loading chat info</>;
    }

    return (
        <Redirect
            to={`${conferencePath}${
                data?.chat_Chat_by_pk?.rooms
                    ? `/room/${data?.chat_Chat_by_pk?.rooms[0]?.id}`
                    : `/item/${data?.chat_Chat_by_pk?.items[0]?.id}`
            }`}
        />
    );
}
