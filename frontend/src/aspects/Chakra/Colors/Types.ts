export type ComponentMap = Record<string, ComponentColors>;
export type ComponentColors = Record<string, string | { dark: string; light: string }>;

export type ChakraColors = Record<string, string | ChakraComponentColors>;
export type ChakraComponentColors = Record<string, string>;
