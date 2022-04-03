import { Heading } from "@chakra-ui/react";
import React from "react";
import { useTitle } from "../../../Hooks/useTitle";
import { useConference } from "../../useConference";
import ItemList from "./ItemList";

export default function ContentPage({ overrideSelectedTag }: { overrideSelectedTag?: string | null }): JSX.Element {
    const conference = useConference();
    const title = useTitle("Content - " + conference.shortName);

    return (
        <>
            {title}
            <Heading as="h1" id="page-heading" mt={[2, 2, 4]} px={[2, 2, 4]} alignSelf="flex-start">
                Content
            </Heading>
            <ItemList overrideSelectedTag={overrideSelectedTag} />
        </>
    );
}
