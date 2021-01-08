import { Box, FormControl, FormHelperText, FormLabel, Input, ListItem, UnorderedList } from "@chakra-ui/react";
import React, { useRef, useState } from "react";
import PronounTag from "./PronounTag";

function PronounInputInner({
    pronouns,
    onChange,
}: {
    pronouns: string[];
    onChange: (allPronouns: string[], newPronounName?: string) => void;
}): JSX.Element {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <>
            <FormControl maxW={450}>
                <FormLabel fontWeight="bold" fontSize="1.2rem">
                    Pronouns
                </FormLabel>
                <Box
                    fontSize="0.8rem"
                    display="block"
                    borderColor="gray.400"
                    borderWidth={1}
                    borderStyle="solid"
                    borderRadius={10}
                    p={2}
                    pb={0}
                    w="100%"
                    overflow="hidden"
                    onClick={() => inputRef.current?.focus()}
                >
                    {pronouns.map((pronoun) => (
                        <PronounTag
                            mb={2}
                            mr={2}
                            key={pronoun}
                            pronoun={pronoun}
                            onClick={() => {
                                onChange(pronouns.filter((x) => x.toLowerCase() !== pronoun.toLowerCase()));
                                inputRef.current?.focus();
                            }}
                        />
                    ))}
                    <Input
                        ref={inputRef}
                        placeholder="Type a pronoun"
                        border="none"
                        w="10em"
                        p={0}
                        m={0}
                        pb={2}
                        h="auto"
                        lineHeight="unset"
                        fontSize="0.9rem"
                        borderRadius={0}
                        onKeyUp={(ev: React.KeyboardEvent<HTMLInputElement>) => {
                            if (inputRef.current) {
                                const newV = inputRef.current.value.trim();

                                if (ev.key === "Enter") {
                                    if (!pronouns.some((pronoun) => pronoun.toLowerCase() === newV)) {
                                        onChange([...pronouns, newV], newV);
                                    }

                                    inputRef.current.value = "";
                                }
                            }
                        }}
                    />
                </Box>
                <FormHelperText>
                    <UnorderedList>
                        <ListItem>Create pronouns by typing then press Enter.</ListItem>
                        <ListItem>Delete pronouns by clicking on them.</ListItem>
                    </UnorderedList>
                </FormHelperText>
            </FormControl>
        </>
    );
}

export default function PronounInput({
    pronouns,
    onChange,
}: {
    pronouns?: string[];
    onChange?: (pronouns: string[]) => void;
}): JSX.Element {
    const [internalPronouns, setInternalPronouns] = useState<string[]>([]);
    return (
        <PronounInputInner
            pronouns={pronouns ?? internalPronouns}
            onChange={(newPronouns) => {
                if (onChange) {
                    onChange(newPronouns);
                } else {
                    setInternalPronouns(newPronouns);
                }
                return true;
            }}
        />
    );
}
