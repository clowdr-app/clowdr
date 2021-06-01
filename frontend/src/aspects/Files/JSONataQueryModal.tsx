import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Button,
    Code,
    FormControl,
    FormHelperText,
    FormLabel,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Text,
    Textarea,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import jsonata from "jsonata";
import React, { useEffect, useState } from "react";
import FAIcon from "../Icons/FAIcon";

function Set_toJSON(key: string, value: any) {
    if (typeof value === "object" && value instanceof Set) {
        return [...value];
    }
    return value;
}

export default function JSONataQueryModal({
    data: poisonData,
    buttonText,
    defaultQuery,
}: {
    data: any;
    buttonText?: string;
    defaultQuery: string;
}): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [query, setQuery] = useState<string>(defaultQuery);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<any>();
    const [data, setData] = useState<any>({});
    useEffect(() => {
        setData(JSON.parse(JSON.stringify(poisonData, Set_toJSON)));
    }, [poisonData]);
    useEffect(() => {
        setResult(null);
        const t = setTimeout(() => {
            const template = query;
            if (template) {
                try {
                    const expression = jsonata(query);
                    const result = expression.evaluate(data);
                    setError(null);
                    setResult(result);
                } catch (e) {
                    setError("Query is invalid: " + e.message);
                }
            } else {
                setError("No query found for this data.");
            }
        }, 250);
        return () => {
            clearTimeout(t);
        };
    }, [data, query]);

    return (
        <>
            <Button onClick={onOpen}>{buttonText ?? "JSONata Query Tool"}</Button>

            <Modal isOpen={isOpen} onClose={onClose} size="full" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent pb={4}>
                    <ModalHeader>JSONata Query Tool</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack>
                            <FormControl pb={4}>
                                <FormLabel>Query script (JSONata)</FormLabel>
                                <FormHelperText>Provide a JSONata script to query the data.</FormHelperText>
                                <Textarea
                                    transition="none"
                                    fontFamily={
                                        // eslint-disable-next-line quotes
                                        'SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace'
                                    }
                                    minH="400px"
                                    value={query ?? ""}
                                    onChange={(ev) => {
                                        setQuery(ev.target.value);
                                    }}
                                />
                            </FormControl>
                            {error ? (
                                <Alert status="error">
                                    <AlertIcon />
                                    <AlertTitle mr={2}>An error occurred</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            ) : undefined}
                            <Text as="pre" w="100%" overflowWrap="break-word" whiteSpace="pre-wrap" position="relative">
                                <Button
                                    aria-label="Copy output data"
                                    position="absolute"
                                    top={2}
                                    right={2}
                                    colorScheme="purple"
                                    onClick={() => {
                                        navigator.clipboard.writeText(JSON.stringify(result, Set_toJSON, 2));
                                    }}
                                >
                                    <FAIcon iconStyle="r" icon="clipboard" />
                                </Button>
                                <Code w="100%" p={2}>
                                    {JSON.stringify(result, Set_toJSON, 2)}
                                </Code>
                            </Text>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}
