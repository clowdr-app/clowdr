import { gql } from "@apollo/client";
import { Spinner } from "@chakra-ui/react";
import React from "react";
import { Redirect } from "react-router-dom";
import { useGetChatPathQuery } from "../../generated/graphql";
import { useConference } from "../Conference/useConference";
import useQueryErrorToast from "../GQL/useQueryErrorToast";

gql`
    query GetChatPath($chatId: uuid!) {
        chat_Chat_by_pk(id: $chatId) {
            id
            room {
                id
            }
            contentGroup {
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
    useQueryErrorToast(error, "Get chat path");

    const conference = useConference();

    if (loading || (!data?.chat_Chat_by_pk?.room && !data?.chat_Chat_by_pk?.contentGroup)) {
        return <Spinner />;
    }

    if (error) {
        return <>Error loading chat info</>;
    }

    return (
        <Redirect
            to={`/conference/${conference.slug}${
                data?.chat_Chat_by_pk?.room
                    ? `/room/${data?.chat_Chat_by_pk?.room[0].id}`
                    : `/item/${data?.chat_Chat_by_pk?.contentGroup[0].id}`
            }`}
        />
    );
}
