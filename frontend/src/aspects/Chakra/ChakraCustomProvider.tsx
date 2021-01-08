import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import React from "react";

const colors = {
    brand: {
        50: "#b5f2c3",
        100: "#8aeaa0",
        200: "#5fe37e",
        300: "#33db5a",
        400: "#21ba45",
        500: "#198f35",
        600: "#126425",
        700: "#0e4e1d",
        800: "#0a3915",
        900: "#06230d",
    },
    focus: {
        400: "rgba(255, 187, 0, 0.8)",
    },
    // gray: {
    //     50: "#f8fcf8",
    //     100: "#edf7ed",
    //     200: "#e1efe1",
    //     300: "#cce0cc",
    //     400: "#a0c0a0",
    //     500: "#729772",
    //     600: "#4a684a",
    //     700: "#2d482d",
    //     800: "#192619",
    //     900: "#101710",
    // },
};

const theme = extendTheme({
    config: {
        initialColorMode: "dark",
    },
    colors,
    shadows: {
        outline: "0 0 0 3px rgba(255, 187, 0, 0.8)",
    },
    components: {
        body: {
            bgColor: "black",
        },
        Heading: {
            baseStyle: {
                textAlign: "center",
            },
        },
        Link: {
            baseStyle: {
                textDecoration: "underline",
            },
        },
        Popover: {
            parts: ["popper"],
            baseStyle: (props) => ({
                popper: {
                    zIndex: 10,
                    maxW: props.width ? props.width : "xs",
                    w: "100%",
                },
            }),
        },
    },
});

export default function ChakraCustomProvider({
    children,
}: {
    children: JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    return <ChakraProvider theme={theme}>{children}</ChakraProvider>;
}
