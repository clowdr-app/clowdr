import { gql } from "@apollo/client";
import { Spinner } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useEffect, useMemo } from "react";
import type { SponsorBoothsList_ItemFragment} from "../../../../../generated/graphql";
import { useGetSponsorBoothsQuery } from "../../../../../generated/graphql";
import { maybeCompare } from "../../../../Utils/maybeSort";
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
        rooms(limit: 1, order_by: { created_at: asc }, where: { conferenceId: { _eq: $conferenceId } }) {
            id
            priority
        }
        logo: elements(
            where: { typeName: { _in: [IMAGE_URL, IMAGE_FILE] }, layoutData: { _contains: { isLogo: true } } }
            order_by: { updatedAt: desc }
            limit: 1
        ) {
            id
            data
        }
        title
        itemPeople(where: { roleName: { _neq: "REVIEWER" } }) {
            id
            person {
                id
                registrantId
            }
            roleName
        }
    }
`;

export default function SponsorBooths({ setAnySponsors }: { setAnySponsors?: (value: boolean) => void }): JSX.Element {
    const conference = useConference();
    const result = useGetSponsorBoothsQuery({
        variables: {
            conferenceId: conference.id,
        },
        fetchPolicy: "cache-and-network",
        nextFetchPolicy: "cache-first",
    });

    useEffect(() => {
        setAnySponsors?.(!!result.data && result.data.content_Item.length > 0);
    }, [setAnySponsors, result.data]);

    if (result.loading && !result?.data) {
        return <Spinner label="Loading rooms" />;
    }

    return <SponsorBoothsInner sponsors={result.data?.content_Item ?? []} />;
}

export function SponsorBoothsInner({ sponsors }: { sponsors: readonly SponsorBoothsList_ItemFragment[] }): JSX.Element {
    const sortedSponsors = useMemo(
        () =>
            R.sortWith<SponsorBoothsList_ItemFragment>(
                [
                    (x, y) => maybeCompare(x.rooms[0]?.priority, y.rooms[0]?.priority, (a, b) => a - b),
                    (x, y) => x.title.localeCompare(y.title),
                ],
                sponsors
            ),
        [sponsors]
    );

    return <SponsorsSummary sponsors={sortedSponsors} />;
}
