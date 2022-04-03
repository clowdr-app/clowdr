import { Heading } from "@chakra-ui/react";
import React from "react";
import { useTitle } from "../../../Hooks/useTitle";
import LiveNow from "../../../Menu/LeftSidebar/LiveNow";
import { useConference } from "../../useConference";

export default function LiveNowPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle("Live - " + conference.shortName);

    return (
        <>
            {title}
            <Heading
                as="h1"
                id="page-heading"
                mt={[2, 2, 4]}
                px={[2, 2, 4]}
                textAlign="left"
                alignSelf="flex-start"
                w="100%"
            >
                Live Now and Upcoming
            </Heading>
            <LiveNow />
        </>
    );
}
