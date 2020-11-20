import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import React from "react";

const colors = {
    brand: {
        900: "#1a365d",
        800: "#153e75",
        700: "#2a69ac",
    },
};

const theme = extendTheme({
    colors,
    components: {
        Button: {
            baseStyle: {
                margin: "0.3em",
            },
        },
    },
});

export default function ChakraCustomProvider({
    children,
}: {
    children: JSX.Element | Array<JSX.Element>;
}) {
    return <ChakraProvider theme={theme}>{children}</ChakraProvider>;
}
