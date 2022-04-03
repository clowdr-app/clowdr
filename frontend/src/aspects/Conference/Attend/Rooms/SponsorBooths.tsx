import { Heading, Spinner } from "@chakra-ui/react";
import { gql } from "@urql/core";
import * as R from "ramda";
import React, { useEffect, useMemo } from "react";
import type { SponsorBoothsList_ItemFragment, SponsorBoothsList_TierFragment } from "../../../../generated/graphql";
import { useGetSponsorBoothsQuery } from "../../../../generated/graphql";
import { useTitle } from "../../../Hooks/useTitle";
import { maybeCompare } from "../../../Utils/maybeCompare";
import { useConference } from "../../useConference";
import type { SponsorshipTier } from "./SponsorsSummary";
import SponsorsSummary from "./SponsorsSummary";

gql`
    query GetSponsorBooths($conferenceId: uuid!) @cached {
        content_Item(where: { conferenceId: { _eq: $conferenceId }, typeName: { _eq: SPONSOR } }) {
            ...SponsorBoothsList_Item
        }
        sponsor_Tier(where: { conferenceId: { _eq: $conferenceId } }) {
            ...SponsorBoothsList_Tier
        }
    }

    fragment SponsorBoothsList_Tier on sponsor_Tier {
        id
        conferenceId
        subconferenceId
        name
        description
        priority
        colour
        size
        showLogos
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
        sponsorshipTierMemberships {
            id
            itemId
            tierId
            priority
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

    return (
        <SponsorBoothsInner
            tiers={result.data?.sponsor_Tier ?? []}
            sponsors={result.data?.content_Item ?? []}
            leftAlign={leftAlign}
        />
    );
}

function SponsorBoothsInner({
    tiers,
    sponsors,
    leftAlign,
}: {
    tiers: readonly SponsorBoothsList_TierFragment[];
    sponsors: readonly SponsorBoothsList_ItemFragment[];
    leftAlign?: boolean;
}): JSX.Element {
    const sortedSponsors: SponsorshipTier[] = useMemo(() => {
        const fullTiers: SponsorshipTier[] = [];
        for (const tier of tiers) {
            const members = sponsors.filter((x) => x.sponsorshipTierMemberships.some((y) => y.tierId === tier.id));
            fullTiers.push({
                info: tier,
                members: R.sortWith<SponsorBoothsList_ItemFragment>(
                    [
                        (x, y) =>
                            maybeCompare(
                                x.sponsorshipTierMemberships.find((z) => z.tierId === tier.id)?.priority,
                                y.sponsorshipTierMemberships.find((z) => z.tierId === tier.id)?.priority,
                                (a, b) => a - b
                            ),
                        (x, y) => x.title.localeCompare(y.title),
                    ],
                    members
                ),
            });
        }
        const untieredMembers = sponsors.filter((x) => x.sponsorshipTierMemberships.length === 0);
        fullTiers.push({
            members: R.sortWith<SponsorBoothsList_ItemFragment>(
                [
                    (x, y) => maybeCompare(x.room?.priority, y.room?.priority, (a, b) => a - b),
                    (x, y) => x.title.localeCompare(y.title),
                ],
                untieredMembers
            ),
        });

        return R.sort((x, y) => maybeCompare(x.info?.priority, y.info?.priority, (a, b) => a - b), fullTiers);
    }, [tiers, sponsors]);

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
