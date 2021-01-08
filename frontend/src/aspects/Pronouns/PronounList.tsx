import { Box, BoxProps } from "@chakra-ui/react";
import React from "react";
import PronounTag from "./PronounTag";

export default function PronounList({ pronouns, ...rest }: { pronouns: string[] } & BoxProps): JSX.Element {
    return (
        <Box fontSize="0.8rem" display="block" w="100%" {...rest}>
            {pronouns.map((pronoun) => (
                <PronounTag mr={2} key={pronoun} pronoun={pronoun} />
            ))}
        </Box>
    );
}
