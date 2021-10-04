import type { ChakraColors, ComponentMap } from "./Types";

export function applyComponentColorTheme(
    chakraColors: ChakraColors,
    componentColors: Partial<ComponentMap>
): ChakraColors {
    const result: ChakraColors = {};

    for (const key in chakraColors) {
        if (key in chakraColors) {
            const color = chakraColors[key];
            if (typeof color === "string") {
                result[key] = color;
            } else {
                result[key] = { ...color };
            }
        }
    }

    for (const componentKey in componentColors) {
        if (componentKey in componentColors && componentColors[componentKey]) {
            const component = componentColors[componentKey];
            const componentOutput: Record<string, string> = (result[componentKey] as Record<string, string>) ?? {};
            result[componentKey] = componentOutput;
            for (const partKey in component) {
                if (partKey in component && component[partKey]) {
                    const part = component[partKey];
                    if (typeof part === "string") {
                        componentOutput[partKey] = determineChakraColor(chakraColors, part);
                    } else {
                        componentOutput[partKey + "-light"] = determineChakraColor(chakraColors, part.light);
                        componentOutput[partKey + "-dark"] = determineChakraColor(chakraColors, part.dark);
                    }
                }
            }
        }
    }

    return result;
}

function determineChakraColor(chakraColors: ChakraColors, colorKey: string): string {
    if (colorKey.includes(".")) {
        const colorKeyParts = colorKey.split(".");
        const chakraColorGroup = chakraColors[colorKeyParts[0]];
        if (chakraColorGroup) {
            if (typeof chakraColorGroup === "string") {
                return chakraColorGroup;
            } else if (colorKeyParts.length > 1) {
                const chakraColor = chakraColorGroup[colorKeyParts[1]];
                if (chakraColor) {
                    return chakraColor;
                }
            }
        }
    }

    const chakraColorGroup = chakraColors[colorKey];
    if (chakraColorGroup) {
        if (typeof chakraColorGroup === "string") {
            return chakraColorGroup;
        }
    }

    return colorKey;
}
