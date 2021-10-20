import { Heading, PopoverArrow, PopoverBody, PopoverCloseButton, PopoverHeader, Spinner, Text } from "@chakra-ui/react";
import React from "react";
import { useAsync } from "react-async-hook";

export function MetadataPreview({
    compileTemplate,
    elementId,
    titleTemplate,
    descriptionTemplate,
}: {
    compileTemplate: (
        elementIds: string[],
        titleTemplateString: string,
        descriptionTemplateString: string
    ) => Promise<{ [elementId: string]: { title: string; description: string } }>;
    elementId: string;
    titleTemplate: string;
    descriptionTemplate: string;
}): JSX.Element {
    const { result, loading, error } = useAsync(async () => {
        const result = await compileTemplate(
            [elementId],
            titleTemplate ?? "No title template found.",
            descriptionTemplate ?? "No description template found."
        );
        return {
            title: result[elementId]?.title ?? "Title could not be previewed",
            description: result[elementId]?.description ?? "Description could not be previewed",
        };
    }, [elementId]);

    return (
        <>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader>Preview</PopoverHeader>
            <PopoverBody>
                {loading ? <Spinner /> : undefined}
                {error ? (
                    <Text>
                        An error occurred while loading the preview. ({error.name}: {error.message})
                    </Text>
                ) : undefined}
                {result ? (
                    <>
                        <Heading as="h3" size="sm" textAlign="left">
                            {result.title}
                        </Heading>
                        <Text whiteSpace="pre-wrap">{result.description}</Text>
                    </>
                ) : undefined}
            </PopoverBody>
        </>
    );
}
