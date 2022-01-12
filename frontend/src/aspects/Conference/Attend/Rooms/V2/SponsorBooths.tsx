import { Heading, Spinner } from "@chakra-ui/react";
import { gql } from "@urql/core";
import * as R from "ramda";
import React, { useEffect, useMemo } from "react";
import type { SponsorBoothsList_ItemFragment } from "../../../../../generated/graphql";
import { useGetSponsorBoothsQuery } from "../../../../../generated/graphql";
import { useTitle } from "../../../../Hooks/useTitle";
import { maybeCompare } from "../../../../Utils/maybeCompare";
import { useConference } from "../../../useConference";
import SponsorsSummary from "./SponsorsSummary";

gql`
    query GetSponsorBooths($conferenceId: uuid!) {
        content_Item(
            where: { conferenceId: { _eq: $conferenceId }, typeName: { _eq: SPONSOR } }
            order_by: { title: asc }
        ) {
            ...SponsorBoothsList_Item
        }
    }

    fragment SponsorBoothsList_Item on content_Item {
        id
        conferenceId
        typeName
        room {
            id
            priority
            created_at
            conferenceId
        }
        logo: elements(
            where: { typeName: { _in: [IMAGE_URL, IMAGE_FILE] }, layoutData: { _contains: { isLogo: true } } }
            order_by: { updatedAt: desc }
            limit: 1
        ) {
            id
            data
            layoutData
            typeName
            updatedAt
        }
        title
        itemPeople(where: { roleName: { _neq: "REVIEWER" } }) {
            id
            itemId
            personId
            person {
                id
                registrantId
            }
            roleName
        }
    }
`;

export default function SponsorBooths({
    setAnySponsors,
    leftAlign,
}: {
    setAnySponsors?: (value: boolean) => void;
    leftAlign?: boolean;
}): JSX.Element {
    const conference = useConference();
    const [result] = useGetSponsorBoothsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    useEffect(() => {
        setAnySponsors?.(!!result.data && result.data.content_Item.length > 0);
    }, [setAnySponsors, result.data]);

    if (result.fetching && !result?.data) {
        return <Spinner label="Loading booths" />;
    }

    return <SponsorBoothsInner sponsors={result.data?.content_Item ?? []} leftAlign={leftAlign} />;
}

export function SponsorBoothsInner({
    sponsors,
    leftAlign,
}: {
    sponsors: readonly SponsorBoothsList_ItemFragment[];
    leftAlign?: boolean;
}): JSX.Element {
    const sortedSponsors = useMemo(
        () =>
            R.sortWith<SponsorBoothsList_ItemFragment>(
                [
                    (x, y) => maybeCompare(x.room?.priority, y.room?.priority, (a, b) => a - b),
                    (x, y) => x.title.localeCompare(y.title),
                ],
                sponsors
            ),
        [sponsors]
    );

    return <SponsorsSummary sponsors={sortedSponsors} leftAlign={leftAlign} />;
}

export function SponsorsPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(conference.sponsorsLabel[0]?.value ?? "Sponsors");
    return (
        <>
            {title}
            <Heading as="h1" id="page-heading" mt={[2, 2, 4]} px={[2, 2, 4]} alignSelf="flex-start">
                {conference.sponsorsLabel[0]?.value ?? "Sponsors"}
            </Heading>
            <SponsorBooths leftAlign />
        </>
    );
}
