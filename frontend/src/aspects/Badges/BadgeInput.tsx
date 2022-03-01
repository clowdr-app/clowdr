import {
    Badge,
    Box,
    Button,
    Center,
    FormControl,
    FormHelperText,
    FormLabel,
    HStack,
    Input,
    ListItem,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    UnorderedList,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import React, { useCallback, useRef, useState } from "react";
import { SketchPicker } from "react-color";
import type { BadgeData } from "./ProfileBadge";
import ProfileBadge from "./ProfileBadge";

function BadgeColourModal({
    badge,
    onConfirm,
}: {
    badge: BadgeData | null;
    onConfirm: (colour: string) => void;
}): JSX.Element {
    const [selectedColour, setSelectedColour] = useState<string>(
        badge?.colour && badge?.colour.length > 0 ? badge?.colour : "rgba(0,0,0,1)"
    );

    const onClose = useCallback(() => {
        onConfirm(selectedColour);
    }, [onConfirm, selectedColour]);

    const badgeElF = (copyNum: number) =>
        badge ? (
            <ProfileBadge
                badge={{
                    ...badge,
                    colour: selectedColour,
                }}
            />
        ) : copyNum === 0 ? (
            <Text as="span">Error! Could not find badge</Text>
        ) : (
            <></>
        );

    const previewLightBgColour = useColorModeValue("AppPage.pageBackground-light", "AppPage.pageBackground-dark");
    const previewDarkBgColour = useColorModeValue("AppPage.pageBackground-dark", "AppPage.pageBackground-light");

    return (
        <Modal isOpen={!!badge} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Select badge colour</ModalHeader>
                <ModalBody>
                    <Center flexDir="column">
                        <HStack mb={4}>
                            <Box p={5} backgroundColor={previewLightBgColour}>
                                {badgeElF(0)}
                            </Box>
                            <Box p={5} backgroundColor={previewDarkBgColour}>
                                {badgeElF(1)}
                            </Box>
                        </HStack>
                        <Box color="black">
                            <SketchPicker
                                color={selectedColour}
                                onChange={(c) =>
                                    setSelectedColour(`rgba(${c.rgb.r},${c.rgb.g},${c.rgb.b},${c.rgb.a ?? 0})`)
                                }
                            />
                        </Box>
                    </Center>
                </ModalBody>
                <ModalFooter>
                    <Button colorScheme="ConfirmButton" onClick={() => onClose()}>
                        Done
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

function BadgeInputInner({
    examples,
    badges,
    settingColourOf,
    onChange,
}: {
    examples: string[];
    badges: BadgeData[];
    settingColourOf: string | null;
    onChange: (allBadges: BadgeData[], newBadgeName?: string) => void;
}): JSX.Element {
    const inputRef = useRef<HTMLInputElement>(null);
    const badgeSettingColourOf = badges.find((badge) => badge.name === settingColourOf);
    const badgeInputBorderColor = useColorModeValue("Input.borderColor-light", "Input.borderColor-dark");
    return (
        <>
            <FormControl maxW={450}>
                <FormLabel fontWeight="bold" fontSize="1.2rem">
                    Badges
                </FormLabel>
                <VStack alignItems="flex-start">
                    <VStack alignItems="flex-start" w="100%">
                        <Text as="span">Examples (click to add)</Text>
                        <Box fontSize="0.8rem" display="block" w="100%">
                            {examples
                                .filter(
                                    (example) =>
                                        !badges.some((badge) => badge.name.toLowerCase() === example.toLowerCase())
                                )
                                .map((example) => (
                                    <Badge
                                        mb={2}
                                        mr={2}
                                        key={example}
                                        colorScheme="ProfileBadge-Default"
                                        variant="outline"
                                        fontSize="0.8rem"
                                        cursor="pointer"
                                        onClick={() => {
                                            onChange([...badges, { name: example, colour: "" }], example);
                                        }}
                                        onKeyUp={(ev) => {
                                            if (ev.key === " " || ev.key === "Enter") {
                                                onChange([...badges, { name: example, colour: "" }], example);
                                            }
                                        }}
                                        tabIndex={0}
                                        _focus={
                                            {
                                                outlineWidth: "3px",
                                                outlineStyle: "solid",
                                                outlineOffset: "0 0 0",
                                                outlineColor: "focus.400",
                                            } as any
                                        }
                                    >
                                        {example}
                                    </Badge>
                                ))}
                        </Box>
                    </VStack>
                    <VStack alignItems="flex-start" w="100%" mt={-2}>
                        <Text as="span">Selected badges</Text>
                        <Box
                            fontSize="0.8rem"
                            display="block"
                            borderColor={badgeInputBorderColor}
                            borderWidth={1}
                            borderStyle="solid"
                            borderRadius={10}
                            p={2}
                            pb={0}
                            w="100%"
                            overflow="hidden"
                            onClick={() => inputRef.current?.focus()}
                        >
                            {badges.map((badge) => (
                                <ProfileBadge
                                    mb={2}
                                    mr={2}
                                    key={badge.name}
                                    badge={badge}
                                    onClick={() => {
                                        onChange(
                                            badges.filter((x) => x.name.toLowerCase() !== badge.name.toLowerCase())
                                        );
                                        inputRef.current?.focus();
                                    }}
                                />
                            ))}
                            <Input
                                ref={inputRef}
                                placeholder="Type a badge"
                                border="none"
                                w="10em"
                                p={0}
                                m={0}
                                pb={2}
                                maxLength={10}
                                h="auto"
                                lineHeight="unset"
                                fontSize="0.9rem"
                                borderRadius={0}
                                onKeyUp={(ev: React.KeyboardEvent<HTMLInputElement>) => {
                                    if (inputRef.current) {
                                        const newV = inputRef.current.value.trim();

                                        if (ev.key === "Enter") {
                                            if (!badges.some((badge) => badge.name.toLowerCase() === newV)) {
                                                onChange([...badges, { name: newV, colour: "" }], newV);
                                            }

                                            inputRef.current.value = "";
                                        }
                                    }
                                }}
                            />
                        </Box>
                    </VStack>
                </VStack>
                <FormHelperText>
                    <UnorderedList>
                        <ListItem>Create badges by typing, press Enter then select a colour.</ListItem>
                        <ListItem>Maximum length 10 characters.</ListItem>
                        <ListItem>Delete badges by clicking on them.</ListItem>
                    </UnorderedList>
                </FormHelperText>
            </FormControl>
            <BadgeColourModal
                badge={badgeSettingColourOf ?? null}
                onConfirm={(colour) => {
                    onChange(
                        badges.map((x) =>
                            x.name !== settingColourOf
                                ? x
                                : {
                                      name: x.name,
                                      colour,
                                  }
                        )
                    );
                    inputRef.current?.focus();
                }}
            />
        </>
    );
}

export default function BadgeInput({
    examples,
    badges,
    settingColourOf,
    onChange,
}: {
    examples?: string[];
    badges?: BadgeData[];
    settingColourOf?: string | null;
    onChange?: (badges: BadgeData[]) => void;
}): JSX.Element {
    const [internalBadges, setInternalBadges] = useState<BadgeData[]>([]);
    const [internalSettingColourOf, setInternalSettingColourOf] = useState<string | null>(null);
    return (
        <BadgeInputInner
            examples={
                examples ?? [
                    "Author",
                    "Volunteer",
                    "Mentor",
                    "Mentee",
                    "Sponsor",
                    "Hiring",
                    "Hire me",
                    "Let's chat!",
                    "Coffee?",
                    "Organiser",
                ]
            }
            badges={badges ?? internalBadges}
            onChange={(newBadges, newBadgeName) => {
                if (onChange) {
                    onChange(newBadges);
                } else {
                    setInternalBadges(newBadges);
                }
                setInternalSettingColourOf(newBadgeName ?? null);
                return true;
            }}
            settingColourOf={settingColourOf ?? internalSettingColourOf}
        />
    );
}
