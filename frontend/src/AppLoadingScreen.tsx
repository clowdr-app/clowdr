import { Center, Spinner } from "@chakra-ui/react";
import React from "react";

export default function AppLoadingScreen(): JSX.Element {
    return (
        <Center w="100%" h="100%">
            <div>
                <Spinner />
            </div>
        </Center>
    );
}
