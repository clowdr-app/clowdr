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

export function Markdown(props?: { children?: string; className?: string; linkColour?: string }): JSX.Element {
    return (
        <ReactMarkdown
            className={props?.className}
            linkTarget="_blank"
            renderers={{
                text: ({ value }) => emojify(value),
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
                        <a href={href} style={{ color: props?.linkColour }} target="_blank" rel="noopener noreferrer">
                            {children}
                        </a>
                    );
                },
            }}
            escapeHtml={true}
            source={props?.children ?? ""}
        />
    );
}
