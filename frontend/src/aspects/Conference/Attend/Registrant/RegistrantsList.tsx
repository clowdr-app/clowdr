import { Button, Center, Flex, Image, SimpleGrid, Spinner, Text, useDisclosure } from "@chakra-ui/react";
import IntersectionObserver from "@researchgate/react-intersection-observer";
import * as R from "ramda";
import React, { useCallback, useMemo, useState } from "react";
import BadgeList from "../../../Badges/BadgeList";
import FAIcon from "../../../Chakra/FAIcon";
import type { Registrant } from "../../useCurrentRegistrant";
import ProfileModal from "./ProfileModal";

export function RegistrantTile({ registrant, onClick }: { registrant: Registrant; onClick: () => void }): JSX.Element {
    return (
        <Button
            variant="outline"
            borderRadius={0}
            p={0}
            w="auto"
            h="auto"
            minH="50px"
            justifyContent="flex-start"
            onClick={onClick}
            overflow="hidden"
        >
            {registrant.profile.photoURL_50x50 ? (
                <Image
                    flex="0 0 60px"
                    aria-describedby={`registrant-trigger-${registrant.id}`}
                    src={registrant.profile.photoURL_50x50}
                    w="60px"
                    h="60px"
                />
            ) : (
                <Center w="60px" h="60px" flex="0 0 60px">
                    <FAIcon iconStyle="s" icon="cat" />
                </Center>
            )}
            <Flex
                h="100%"
                flex="0 1 auto"
                mx={4}
                overflow="hidden"
                flexDir="column"
                justifyContent="center"
                alignItems="flex-start"
            >
                <Text
                    as="span"
                    id={`registrant-trigger-${registrant.id}`}
                    maxW="100%"
                    whiteSpace="normal"
                    overflowWrap="anywhere"
                    fontSize="sm"
                >
                    {registrant.displayName}
                </Text>
                {registrant.profile.badges ? (
                    <BadgeList
                        badges={R.slice(0, 3, registrant.profile.badges)}
                        mt={2}
                        whiteSpace="normal"
                        textAlign="left"
                        noBottomMargin
                    />
                ) : undefined}
            </Flex>
        </Button>
    );
}

export default function RegistrantsList({
    allRegistrants,
    searchedRegistrants,
    loadMore,
    moreAvailable,
}: {
    allRegistrants?: Registrant[];
    searchedRegistrants?: Registrant[];
    loadMore: () => void;
    moreAvailable: boolean;
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
                    onClick={() => {
                        openProfileModal(registrant);
                    }}
                />
            )),
        [allRegistrants, openProfileModal]
    );
    const allSearchedEls = useMemo(
        () =>
            searchedRegistrants?.map((registrant, idx) => (
                <RegistrantTile
                    key={registrant.id + "-search-" + idx}
                    registrant={registrant}
                    onClick={() => {
                        openProfileModal(registrant);
                    }}
                />
            )),
        [openProfileModal, searchedRegistrants]
    );

    const registrantsEls = allSearchedEls ?? allRegistrantsEls;

    return registrantsEls ? (
        <>
            <SimpleGrid
                columns={[1, Math.min(2, registrantsEls.length), Math.min(3, registrantsEls.length)]}
                autoRows="min-content"
                spacing={[2, 2, 4]}
                maxW="5xl"
                overflow="auto"
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
            <ProfileModal isOpen={isOpen} onClose={onClose} registrant={selectedRegistrant} />
        </>
    ) : (
        <div>
            <Spinner />
        </div>
    );
}
