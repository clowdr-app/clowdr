import { ChakraProvider, extendTheme, PortalManager } from "@chakra-ui/react";
import { assert } from "@midspace/assert";
import React, { useMemo, useState } from "react";
import { applyComponentColorTheme } from "./Colors/applyComponentColorTheme";
import componentMap from "./Colors/ComponentMap";
import type { ComponentMap } from "./Colors/Types";
import { Button } from "./Components/Button";
import { defaultOutline_AsBoxShadow } from "./Outline";

// https://themera.vercel.app/
// https://javisperez.github.io/tailwindcolorshades/?saffron=f1c52c&pear=deea3e&plum=7d1e65&casal=005f70&fun-green=16703f
const colors = extendTheme({
    colors: {
        white: "#fcfcfc",
        yellow: {
            DEFAULT: "#FA9900",
            "50": "#FFEAC9",
            "100": "#FFE1B3",
            "200": "#FFCF85",
            "300": "#FFBE57",
            "400": "#FFAC29",
            "500": "#FA9900",
            "600": "#CC7D00",
            "700": "#9E6100",
            "800": "#704500",
            "900": "#422900",
        },
        green: {
            DEFAULT: "#7DBD1F",
            "50": "#EFFADE",
            "100": "#E3F6C6",
            "200": "#CBEE96",
            "300": "#B3E665",
            "400": "#9BDE35",
            "500": "#7DBD1F",
            "600": "#609118",
            "700": "#436510",
            "800": "#263909",
            "900": "#090D02",
        },
        pink: {
            DEFAULT: "#A81A5C",
            "50": "#FDF0F6",
            "100": "#F8D3E4",
            "200": "#EF9AC2",
            "300": "#E6609F",
            "400": "#DD277C",
            "500": "#A81A5C",
            "600": "#801446",
            "700": "#580E31",
            "800": "#31081B",
            "900": "#090105",
        },
        purple: {
            DEFAULT: "#630F8F",
            "50": "#FCF8FE",
            "100": "#EED5FB",
            "200": "#D190F3",
            "300": "#B44BEC",
            "400": "#9216D4",
            "500": "#630F8F",
            "600": "#4C0C6F",
            "700": "#36084E",
            "800": "#20052E",
            "900": "#0A010E",
        },
        "dark-purple": {
            DEFAULT: "#36084E",
            "50": "#EED5FB",
            "100": "#D190F3",
            "200": "#B44BEC",
            "300": "#9216D4",
            "400": "#630F8F",
            "500": "#4C0C6F",
            "600": "#36084E",
            "700": "#20052E",
            "800": "#0A010E",
            "900": "#000000",
        },
    },
}).colors;

const baseThemeExtensions = {
    colors: applyComponentColorTheme(colors, componentMap),
    radii: {
        none: "0",
        sm: "0",
        base: "0.0625rem",
        md: "0.125rem",
        lg: "0.25rem",
        xl: "0.375rem",
        "2xl": "0.5rem",
        "3xl": "0.75rem",
        full: "9999px",
    },
    shadows: {
        outline: defaultOutline_AsBoxShadow,
        "light-md": "0 4px 6px -1px rgba(255, 255, 255, 0.1),0 2px 4px -1px rgba(255, 255, 255, 0.04)",
        "bottom-popup-light": "0px -1px 4px 0px rgba(0,0,0,0.25)",
        "bottom-popup-dark": "0px -1px 4px 0px rgba(255,255,255,0.25)",
        "left-pullout": "2px 0px 5px rgba(0, 0, 0, 0.2)",
    },
    components: {
        Toast: {
            defaultProps: {
                variant: "solid",
            },
        },
        Button,
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
            baseStyle: (props: any) => ({
                popper: {
                    zIndex: 10,
                    maxW: props.width ? props.width : "xs",
                    // w: "100%",
                },
            }),
        },
    },
};

export let theme: any;

interface ConferenceThemeContext {
    theme: Partial<ComponentMap> | undefined;
    setTheme: (theme: Partial<ComponentMap> | undefined) => void;
}
const ConferenceThemeContext = React.createContext<ConferenceThemeContext | undefined>(undefined);
export function useConferenceTheme(): ConferenceThemeContext {
    const conf = React.useContext(ConferenceThemeContext);
    assert.truthy(conf, "useConferenceTheme: Context not available");
    return conf;
}

export function generateDefaultTheme() {
    return extendTheme(baseThemeExtensions, {
        colors: applyComponentColorTheme(colors, componentMap),
    });
}

export default function ChakraCustomProvider({
    children,
}: {
    children: JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const [conferenceComponentMap, setConferenceComponentMap] = useState<Partial<ComponentMap> | undefined>(undefined);
    theme = useMemo(
        () =>
            conferenceComponentMap
                ? extendTheme(baseThemeExtensions, {
                      colors: applyComponentColorTheme(
                          applyComponentColorTheme(colors, componentMap),
                          conferenceComponentMap
                      ),
                  })
                : generateDefaultTheme(),
        [conferenceComponentMap]
    );
    const ctx = useMemo(
        () => ({ theme: conferenceComponentMap, setTheme: setConferenceComponentMap }),
        [conferenceComponentMap]
    );

    return (
        <ConferenceThemeContext.Provider value={ctx}>
            <ChakraProvider theme={theme}>
                <PortalManager>{children}</PortalManager>
            </ChakraProvider>
        </ConferenceThemeContext.Provider>
    );
}
