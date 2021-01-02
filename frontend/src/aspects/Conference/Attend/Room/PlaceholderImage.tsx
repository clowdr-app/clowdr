import React from "react";

export default function PlaceholderImage({ colour }: { colour: string }): JSX.Element {
    return (
        <svg viewBox="0 0 1714 2211">
            <g id="Layer_x0020_1">
                <path
                    style={{ fill: colour }}
                    d="m1714 2044c0-590-384-1068-857-1068s-857 478-857 1068c0 92 384 167 857 167s857-75 857-167zm-857-2044c258 0 467 209 467 467s-209 467-467 467-467-209-467-467 209-467 467-467z"
                />
            </g>
        </svg>
    );
}
