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
import type { ThemeTypings } from "@chakra-ui/react";
import { Code, Divider, Heading, Link, ListItem, OrderedList, Text, UnorderedList } from "@chakra-ui/react";
import anchorme from "anchorme";
import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import ReactPlayer from "react-player";
import rehypeTwemojify from "rehype-twemojify";
import remarkEmoji from "remark-emoji";
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

function getHeadingSize(
    level: 1 | 2 | 3 | 4 | 5 | 6,
    restrictHeadingSize: boolean
): ThemeTypings["components"]["Heading"]["sizes"] {
    const normal = {
        1: "2xl",
        2: "xl",
        3: "lg",
        4: "md",
        5: "sm",
        6: "xs",
    };
    const small = {
        1: "md",
        2: "sm",
        3: "xs",
        4: "xs",
        5: "xs",
        6: "xs",
    };

    return (restrictHeadingSize ? small : normal)[level];
}

function getCoreProps(props: any) {
    return props["data-sourcepos"] ? { "data-sourcepos": props["data-sourcepos"] } : {};
}

function autoLinkify(input: string) {
    return anchorme({
        input,
        options: {
            exclude: (str) => {
                const matches = str.match(/\[[^\]]+]\([^)]+\)/gi);
                return !!matches && matches.length > 0;
            },
            protocol: function (string) {
                if (anchorme.validate.email(string)) {
                    return "mailto:";
                } else {
                    return "https://";
                }
            },
            truncate: 40,
            middleTruncation: false,
        },
    });
}

export function Markdown(elProps?: {
    children?: string;
    className?: string;
    linkColour?: string;
    restrictHeadingSize?: boolean;
}): JSX.Element {
    const source = useMemo(() => {
        const linkified = autoLinkify(elProps?.children ?? "");
        const cleanLines = linkified.replace(/\r/g, "").replace(/\n\n+/g, "\n");
        const relined = cleanLines.replace(/\n/g, "\n\n");
        return relined;
    }, [elProps?.children]);
    return (
        <ReactMarkdown
            className={elProps?.className}
            linkTarget="_blank"
            rehypePlugins={[[rehypeTwemojify, { folder: "svg", ext: ".svg", className: "markdown-twemoji" }]]}
            remarkPlugins={[[remarkEmoji, { emoticon: true }]]}
            components={{
                a({ node: _node, children, ...props }) {
                    return (
                        <Link
                            color={elProps?.linkColour}
                            isExternal={true}
                            rel="external noopener noreferrer"
                            textDecoration="underline"
                            {...props}
                        >
                            {children}
                            <sup>
                                <ExternalLinkIcon mx="2px" fontSize="1rem" paddingTop="2px" />
                            </sup>
                        </Link>
                    );
                },
                blockquote({ node: _node, ...props }) {
                    return <Code p={2} {...props} />;
                },
                code({ node: _node, ...props }) {
                    // TODO: add code highlighting
                    // const { language, value } = props;
                    // const className = language && `language-${language}`;
                    return (
                        <pre {...getCoreProps(props)}>
                            <Code p={2} {...props} /*className={className || null}*/>
                                {props.children}
                            </Code>
                        </pre>
                    );
                },
                del({ node: _node, ...props }) {
                    return <Text as="del" whiteSpace="normal" wordBreak="break-word" {...props} />;
                },
                em({ node: _node, ...props }) {
                    return <Text as="em" whiteSpace="normal" wordBreak="break-word" {...props} />;
                },
                h1({ node: _node, ...props }) {
                    return (
                        <Heading
                            my={4}
                            textAlign="left"
                            as="h1"
                            size={getHeadingSize(1, Boolean(elProps?.restrictHeadingSize))}
                            whiteSpace="normal"
                            wordBreak="break-word"
                            {...props}
                        />
                    );
                },
                h2({ node: _node, ...props }) {
                    return (
                        <Heading
                            my={4}
                            textAlign="left"
                            as="h2"
                            size={getHeadingSize(2, Boolean(elProps?.restrictHeadingSize))}
                            whiteSpace="normal"
                            wordBreak="break-word"
                            {...props}
                        />
                    );
                },
                h3({ node: _node, ...props }) {
                    return (
                        <Heading
                            my={4}
                            textAlign="left"
                            as="h3"
                            size={getHeadingSize(3, Boolean(elProps?.restrictHeadingSize))}
                            whiteSpace="normal"
                            wordBreak="break-word"
                            {...props}
                        />
                    );
                },
                h4({ node: _node, ...props }) {
                    return (
                        <Heading
                            my={4}
                            textAlign="left"
                            as="h4"
                            size={getHeadingSize(4, Boolean(elProps?.restrictHeadingSize))}
                            whiteSpace="normal"
                            wordBreak="break-word"
                            {...props}
                        />
                    );
                },
                h5({ node: _node, ...props }) {
                    return (
                        <Heading
                            my={4}
                            textAlign="left"
                            as="h5"
                            size={getHeadingSize(5, Boolean(elProps?.restrictHeadingSize))}
                            whiteSpace="normal"
                            wordBreak="break-word"
                            {...props}
                        />
                    );
                },
                h6({ node: _node, ...props }) {
                    return (
                        <Heading
                            my={4}
                            textAlign="left"
                            as="h6"
                            size={getHeadingSize(6, Boolean(elProps?.restrictHeadingSize))}
                            whiteSpace="normal"
                            wordBreak="break-word"
                            {...props}
                        />
                    );
                },
                hr({ node: _node, ...props }) {
                    return <Divider borderColor="gray.400" variant="dashed" {...props} />;
                },
                img({ node: _node, children: _children, ...props }) {
                    const youtubeVideoId = parseYouTubeURL(props.src ?? "");
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
                        return <img {...props} />;
                    }
                },
                li({ node: _node, ...props }) {
                    return <ListItem {...props} />;
                },
                ol({ node: _node, ...props }) {
                    return <OrderedList pl={4} mb={2} {...props} />;
                },
                p({ node: _node, ...props }) {
                    return <Text mb={2} whiteSpace="normal" wordBreak="break-word" {...props} />;
                },

                ul({ node: _node, ...props }) {
                    return <UnorderedList pl={4} mb={2} {...props} />;
                },
            }}
        >
            {source}
        </ReactMarkdown>
    );
}
