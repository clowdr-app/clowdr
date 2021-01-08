/*
Some of the contents of this file have been adapted from

https://github.com/mustaphaturhan/chakra-ui-markdown-renderer

whose license is reproduced below.

=================================================================

MIT License

Copyright (c) 2020 Mustafa Turhan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Checkbox, Code, Divider, Heading, Image, Link, List, ListItem, Text } from "@chakra-ui/react";
import React from "react";
import { Twemoji } from "react-emoji-render";
import ReactMarkdown from "react-markdown";
import ReactPlayer from "react-player";
import matchAll from "string.prototype.matchall";

export function parseYouTubeURL(youtubeURL: string): string | undefined {
    // Regarding parsing youtube URLs:
    // See https://gist.github.com/rodrigoborgesdeoliveira/987683cfbfcc8d800192da1e73adc486
    // See https://regexr.com/531i0
    const youtubeIDParts = matchAll(youtubeURL, /(?:\/|%3D|v=|vi=)([0-9A-z-_]{11})(?:[%#?&]|$)/gi)?.next();
    if (youtubeIDParts?.value && youtubeIDParts.value.length >= 2) {
        return youtubeIDParts.value[1];
    }
    return undefined;
}

function emojify(text: string): JSX.Element {
    try {
        const emojified = <Twemoji text={text} />;
        return emojified;
    } catch (e) {
        console.error(`Could not emojify ${text}`);
    }
    return <>{text}</>;
}

function getCoreProps(props: any) {
    return props["data-sourcepos"] ? { "data-sourcepos": props["data-sourcepos"] } : {};
}

export function Markdown(elProps?: {
    children?: string;
    className?: string;
    linkColour?: string;
    restrictHeadingSize?: boolean;
}): JSX.Element {
    return (
        <ReactMarkdown
            className={elProps?.className}
            linkTarget="_blank"
            renderers={{
                text: (props) => {
                    const { value } = props;
                    return <Text as="span">{emojify(value)}</Text>;
                },
                image: ({ src, alt }) => {
                    const youtubeVideoId = parseYouTubeURL(src);
                    if (youtubeVideoId) {
                        return (
                            <ReactPlayer
                                className="video-player"
                                width=""
                                height=""
                                playsinline
                                controls={true}
                                muted={false}
                                volume={1}
                                url={`https://www.youtube.com/watch?v=${youtubeVideoId}`}
                            />
                        );
                    } else {
                        return <img src={src} alt={alt} />;
                    }
                },
                link: function customLink({ href, children }: { href: string; children: JSX.Element }): JSX.Element {
                    return (
                        <Link
                            href={href}
                            color={elProps?.linkColour}
                            isExternal={true}
                            rel="external noopener noreferrer"
                        >
                            {children}
                            <sup>
                                <ExternalLinkIcon mx="2px" fontSize="1rem" paddingTop="2px" />
                            </sup>
                        </Link>
                    );
                },

                paragraph: (props) => {
                    const { children } = props;
                    return <Text mb={2}>{children}</Text>;
                },
                emphasis: (props) => {
                    const { children } = props;
                    return <Text as="em">{children}</Text>;
                },
                blockquote: (props) => {
                    const { children } = props;
                    return <Code p={2}>{children}</Code>;
                },
                code: (props) => {
                    const { language, value } = props;
                    const className = language && `language-${language}`;
                    return (
                        <pre {...getCoreProps(props)}>
                            <Code p={2} className={className || null}>
                                {value}
                            </Code>
                        </pre>
                    );
                },
                delete: (props) => {
                    const { children } = props;
                    return <Text as="del">{children}</Text>;
                },
                thematicBreak: Divider,
                img: Image,
                linkReference: Link,
                imageReference: Image,
                list: (props) => {
                    const { start, ordered, children, depth } = props;
                    const attrs = getCoreProps(props);
                    if (start !== null && start !== 1 && start !== undefined) {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        attrs.start = start.toString();
                    }
                    let styleType = "disc";
                    if (ordered) styleType = "decimal";
                    if (depth === 1) styleType = "circle";
                    return (
                        <List spacing={24} as={ordered ? "ol" : "ul"} styleType={styleType} pl={4} {...attrs}>
                            {children}
                        </List>
                    );
                },
                listItem: (props) => {
                    const { children, checked } = props;
                    let checkbox = null;
                    if (checked !== null && checked !== undefined) {
                        checkbox = (
                            <Checkbox isChecked={checked} isReadOnly>
                                {children}
                            </Checkbox>
                        );
                    }
                    return (
                        <ListItem {...getCoreProps(props)} listStyleType={checked !== null ? "none" : "inherit"}>
                            {checkbox || children}
                        </ListItem>
                    );
                },
                definition: () => null,
                heading: (props) => {
                    const { level, children } = props;
                    const sizes = elProps?.restrictHeadingSize
                        ? ["md", "sm", "xs", "xs", "xs", "xs"]
                        : ["2xl", "xl", "lg", "md", "sm", "xs"];
                    return (
                        <Heading
                            my={4}
                            textAlign="left"
                            as={`h${level}` as any}
                            size={sizes[level - 1]}
                            {...getCoreProps(props)}
                        >
                            {children}
                        </Heading>
                    );
                },
                inlineCode: (props) => {
                    const { children } = props;
                    return <Code {...getCoreProps(props)}>{children}</Code>;
                },
            }}
            escapeHtml={true}
            source={elProps?.children ?? ""}
        />
    );
}
