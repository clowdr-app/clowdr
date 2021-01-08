import { Box } from "@chakra-ui/react";
import React from "react";
import PronounTag from "./PronounTag";

export default function PronounList({ pronouns }: { pronouns: string[] }): JSX.Element {
    return (
        <Box fontSize="0.8rem" display="block" w="100%">
            {pronouns.map((pronoun) => (
                <PronounTag mr={2} key={pronoun} pronoun={pronoun} />
            ))}
        </Box>
    );
}
