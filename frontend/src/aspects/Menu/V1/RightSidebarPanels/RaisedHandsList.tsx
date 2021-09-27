import { Button, ButtonGroup, Center, HStack, Image, ListItem, OrderedList, Spacer, Text } from "@chakra-ui/react";
import React, { useState } from "react";
import type { Registrant } from "../../../Conference/useCurrentRegistrant";
import FAIcon from "../../../Icons/FAIcon";
import { useRaiseHandState } from "../../../RaiseHand/RaiseHandProvider";

function RegistrantTile({
    registrant,
    currentEventId,
}: {
    registrant: Registrant;
    currentEventId: string;
}): JSX.Element {
    const raiseHand = useRaiseHandState();
    const [changing, setChanging] = useState<boolean>(false);

    return (
        <HStack
            spacing={2}
            borderRadius={0}
            p={0}
            w="100%"
            h="auto"
            minH="25px"
            justifyContent="flex-start"
            overflow="hidden"
            alignItems="center"
            flexWrap="wrap"
        >
            {registrant.profile.photoURL_50x50 ? (
                <Image
                    w="25px"
                    h="25px"
                    aria-describedby={`registrant-trigger-${registrant.id}`}
                    src={registrant.profile.photoURL_50x50}
                    m={1}
                    overflow="hidden"
                    alt={`Profile picture of ${registrant.displayName}`}
                />
            ) : (
                <Center w="25px" h="25px" flex="0 0 25px">
                    <FAIcon iconStyle="s" icon="cat" />
                </Center>
            )}
            <Center maxH="100%" flex="0 1 calc(70% - 40px - 2em)" py={0} overflow="hidden">
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
            </Center>
            <Spacer flex="0 1 auto" />
            <ButtonGroup isAttached flex="0 1 30%">
                <Button
                    size="xs"
                    colorScheme="purple"
                    borderRadius="full"
                    isDisabled={!registrant.userId}
                    isLoading={changing}
                    onClick={() => {
                        if (registrant.userId) {
                            setChanging(true);
                            raiseHand.accept(currentEventId, registrant.userId);
                        }
                    }}
                >
                    Admit
                </Button>
                <Button
                    size="xs"
                    colorScheme="yellow"
                    borderRadius="full"
                    variant="outline"
                    isDisabled={!registrant.userId}
                    isLoading={changing}
                    onClick={() => {
                        if (registrant.userId) {
                            setChanging(true);
                            raiseHand.reject(currentEventId, registrant.userId);
                        }
                    }}
                >
                    Lower hand
                </Button>
            </ButtonGroup>
        </HStack>
    );
}

export function RaisedHandsList({
    searchedRegistrants,
    currentEventId,
}: {
    searchedRegistrants?: Registrant[];
    currentEventId: string;
}): JSX.Element {
    return (
        <OrderedList w="100%" listStylePosition="outside" pl="1.6em">
            {searchedRegistrants?.map((registrant, idx) => (
                <ListItem key={registrant.id + "-search-" + idx} w="100%">
                    <RegistrantTile registrant={registrant} currentEventId={currentEventId} />
                </ListItem>
            ))}
        </OrderedList>
    );
}
