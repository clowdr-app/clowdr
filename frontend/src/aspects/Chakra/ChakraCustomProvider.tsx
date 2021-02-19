import { ChakraProvider, extendTheme, PortalManager } from "@chakra-ui/react";
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
    white: "#fcfcfc",
    focus: {
        400: "rgba(255, 187, 0, 0.8)",
    },

    /* BCP: This is not the right way to define colors:
        - requires a useColorModeValue in every file where you want to switch between a pair of these
        - Doesn't work for tab selector "buttons" anyway
       However, I haven't been able to figure out a better way.  In particular, just defining a 
       color group like clowdrred below and then using that as the colorStyle attribute gets the background
       colors right but the text colors backwards.  
    */
    bluebuttondark: "#2C5282",
    bluebuttonlight: "#BEE3F8",
    redbuttondark: "#9B2C2C",
    redbuttonlight: "#FEB2B2",
    greenbuttondark: "#22543D",
    greenbuttonlight: "#C6F6D5",
    purplebuttondark: "#22543D",
    purplebuttonlight: "#553C9A",

    /* BCP: Experiments
    clowdrpurple: {
        50:  "#ff0000",
        100: "#ff0000",
        200: "#ff0000",
        300: "#330033",
        400: "#ff0000",
        500: "#ff0000",
        600: "#990099",
        700: "#ff0000",
        800: "#ff0000",
        900: "#ff0000",
    },
    clowdrred: {
        50:  "#ff00ff",
        100: "#ff00ff",
        200: "#ff00ff",
        300: "#330033",
        400: "#ff0000",
        500: "#ffaaaa",
        600: "#990099",
        700: "#ff0000",
        800: "#ff00ff",
        900: "#ff00ff",
    },
    */
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

export const defaultOutline_AsBoxShadow = "0 0 0 3px rgba(255, 187, 0, 0.8)";

const theme = extendTheme({
    config: {
        initialColorMode: "dark",
    },
    colors,
    shadows: {
        outline: defaultOutline_AsBoxShadow,
    },
    components: {
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
    return (
        <ChakraProvider theme={theme}>
            <PortalManager>{children}</PortalManager>
        </ChakraProvider>
    );
}
