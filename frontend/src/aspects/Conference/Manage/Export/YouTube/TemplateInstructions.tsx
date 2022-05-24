import { Code, Link, List, ListItem, Text } from "@chakra-ui/react";
import React from "react";

export function TemplateInstructions(): JSX.Element {
    return (
        <>
            <Text mb={2}>
                Titles and descriptions for uploaded YouTube videos are defined using{" "}
                <Link href="https://mustache.github.io/">Mustache</Link> templates. The following fields are available:
            </Text>
            <List fontSize="sm">
                <ListItem>
                    <Code>elementName</Code>: name of the element (i.e. the name given to the video itself)
                </ListItem>
                <ListItem>
                    <Code>itemTitle</Code>: title of the item this video element belongs to
                </ListItem>
                <ListItem>
                    <Code>itemShortTitle</Code>: short title of the item this video element belongs to
                </ListItem>
                <ListItem>
                    <Code>abstract</Code>: the abstract text for the item
                </ListItem>
                <ListItem>
                    <Code>paperUrls</Code>: list of URLs to papers
                </ListItem>
                <ListItem>
                    <Code>paperLinks</Code>: list of links to papers. Properties are <Code>url</Code>, <Code>text</Code>
                    .
                </ListItem>
                <ListItem>
                    <Code>authors</Code>: list of authors. Sorted in priority order. Properties are <Code>name</Code>,{" "}
                    <Code>affiliation</Code>.
                </ListItem>
                <ListItem>
                    <Code>presenters</Code>: list of presenters. Sorted in priority order. Properties are{" "}
                    <Code>name</Code>, <Code>affiliation</Code>.
                </ListItem>
                <ListItem>
                    <Code>youTubeUploads</Code>: list of previously uploaded YouTube videos for this content item.
                    Properties are <Code>url</Code>, <Code>title</Code>.
                </ListItem>
                <ListItem>
                    <Code>elementId</Code>: unique ID of the element
                </ListItem>
                <ListItem>
                    <Code>itemId</Code>: unique ID of the item that contains this element
                </ListItem>
            </List>
            <Text mt={2}>Example:</Text>
            <Code display="block" whiteSpace="pre">
                {`{{{abstract}}}
{{#youTubeUploads}}
* {{{title}}}: {{{url}}}
{{/youTubeUploads}}`}
            </Code>
        </>
    );
}
