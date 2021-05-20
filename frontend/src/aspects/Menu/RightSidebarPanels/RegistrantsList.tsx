import { Button, Center, Image, List, ListItem, Text } from "@chakra-ui/react";
import React from "react";
import type { Registrant } from "../../Conference/useCurrentRegistrant";
import FAIcon from "../../Icons/FAIcon";

function RegistrantTile({ registrant, onClick }: { registrant: Registrant; onClick: () => void }): JSX.Element {
    return (
        <Button
            variant="ghost"
            borderRadius={0}
            p={0}
            w="100%"
            h="auto"
            minH="25px"
            justifyContent="flex-start"
            onClick={onClick}
            overflow="hidden"
        >
            {registrant.profile.photoURL_50x50 ? (
                <Image
                    w="25px"
                    h="25px"
                    ml={2}
                    aria-describedby={`registrant-trigger-${registrant.id}`}
                    src={registrant.profile.photoURL_50x50}
                    alt={`Profile picture of ${registrant.displayName}`}
                />
            ) : (
                <Center w="25px" h="25px" flex="0 0 25px" ml={2}>
                    <FAIcon iconStyle="s" icon="cat" />
                </Center>
            )}
            <Center maxH="100%" flex="0 1 auto" py={0} mx={2} overflow="hidden">
                <Text
                    my={2}
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
        </Button>
    );
}

export function RegistrantsList({
    searchedRegistrants,
    action,
}: {
    searchedRegistrants?: Registrant[];
    action?: (registrantId: string, registrantName: string) => void;
}): JSX.Element {
    return (
        <List>
            {searchedRegistrants?.map((registrant, idx) => (
                <ListItem key={registrant.id + "-search-" + idx}>
                    <RegistrantTile
                        registrant={registrant}
                        onClick={() => {
                            action?.(registrant.id, registrant.displayName);
                        }}
                    />
                </ListItem>
            ))}
        </List>
    );
}
