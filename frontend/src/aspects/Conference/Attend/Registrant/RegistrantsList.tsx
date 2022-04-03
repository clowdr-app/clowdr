import { SimpleGrid, Spinner, useDisclosure } from "@chakra-ui/react";
import IntersectionObserver from "@researchgate/react-intersection-observer";
import * as R from "ramda";
import React, { useCallback, useMemo, useState } from "react";
import BadgeList from "../../../Badges/BadgeList";
import Card from "../../../Card";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import type { Registrant } from "../../useCurrentRegistrant";
import ProfileModal from "./ProfileModal";

export function RegistrantTile({
    registrant,
    onClick,
    linkInsteadOfModal,
}: {
    registrant: Registrant;
    onClick?: () => void;
    linkInsteadOfModal?: boolean;
}): JSX.Element {
    const { conferencePath } = useAuthParameters();
    return (
        <Card
            minH="50px"
            onClick={onClick}
            heading={registrant.displayName}
            picture={
                registrant.profile.photoURL_50x50
                    ? {
                          url: registrant.profile.photoURL_50x50,
                          alt: `Picture of ${registrant.displayName}`,
                          width: "50px",
                          height: "50px",
                      }
                    : undefined
            }
            to={linkInsteadOfModal ? `${conferencePath}/profile/view/${registrant.id}` : undefined}
        >
            {registrant.profile.badges ? (
                <BadgeList
                    badges={R.slice(0, 3, registrant.profile.badges)}
                    mt={2}
                    whiteSpace="normal"
                    textAlign="left"
                    noBottomMargin
                />
            ) : undefined}
        </Card>
    );
}

export default function RegistrantsList({
    allRegistrants,
    searchedRegistrants,
    loadMore,
    moreAvailable,
    columns = 3,
    linkInsteadOfModal,
}: {
    allRegistrants?: Registrant[];
    searchedRegistrants?: Registrant[];
    loadMore: () => void;
    moreAvailable: boolean;
    columns?: number;
    linkInsteadOfModal?: boolean;
}): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedRegistrant, setSelectedRegistrant] = useState<Registrant | null>(null);
    const openProfileModal = useCallback(
        (registrant: Registrant) => {
            setSelectedRegistrant(registrant);
            onOpen();
        },
        [onOpen]
    );

    const allRegistrantsEls = useMemo(
        () =>
            allRegistrants?.map((registrant, idx) => (
                <RegistrantTile
                    key={registrant.id + "-all-" + idx}
                    registrant={{
                        ...registrant,
                        profile: {
                            ...registrant.profile,
                            badges: registrant.profile.badges && R.slice(0, 3, registrant.profile.badges),
                        },
                    }}
                    linkInsteadOfModal={linkInsteadOfModal}
                    onClick={
                        !linkInsteadOfModal
                            ? () => {
                                  openProfileModal(registrant);
                              }
                            : undefined
                    }
                />
            )),
        [allRegistrants, linkInsteadOfModal, openProfileModal]
    );
    const allSearchedEls = useMemo(
        () =>
            searchedRegistrants?.map((registrant, idx) => (
                <RegistrantTile
                    key={registrant.id + "-search-" + idx}
                    registrant={registrant}
                    linkInsteadOfModal={linkInsteadOfModal}
                    onClick={
                        !linkInsteadOfModal
                            ? () => {
                                  openProfileModal(registrant);
                              }
                            : undefined
                    }
                />
            )),
        [linkInsteadOfModal, openProfileModal, searchedRegistrants]
    );

    const registrantsEls = allSearchedEls ?? allRegistrantsEls;

    return registrantsEls ? (
        <>
            <SimpleGrid
                columns={[
                    1,
                    Math.min(columns, Math.min(2, registrantsEls.length)),
                    Math.min(columns, Math.min(3, registrantsEls.length)),
                ]}
                autoRows="min-content"
                spacing={[2, 2, 4]}
                maxW="5xl"
                overflow="auto"
                w="100%"
            >
                {registrantsEls}
                {moreAvailable ? (
                    <IntersectionObserver
                        onChange={({ isIntersecting }) => {
                            if (isIntersecting) {
                                loadMore();
                            }
                        }}
                    >
                        <div style={{ height: "10px" }}>&nbsp;</div>
                    </IntersectionObserver>
                ) : undefined}
            </SimpleGrid>
            {!linkInsteadOfModal ? (
                <ProfileModal isOpen={isOpen} onClose={onClose} registrant={selectedRegistrant} />
            ) : undefined}
        </>
    ) : (
        <div>
            <Spinner />
        </div>
    );
}
