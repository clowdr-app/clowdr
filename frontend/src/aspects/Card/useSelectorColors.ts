import { useColorModeValue } from "@chakra-ui/react";

export default function useSelectorColors() {
    const greyColor = useColorModeValue("gray.200", "gray.600");
    const bgColor = useColorModeValue("blue.50", "blue.900");
    const outlineColor = useColorModeValue("blue.200", "blue.600");
    const strongColor = useColorModeValue("blue.400", "blue.500");
    return { greyColor, bgColor, outlineColor, strongColor };
}
