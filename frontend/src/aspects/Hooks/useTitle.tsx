import React from "react";
import { Helmet } from "react-helmet-async";

export function useTitle(text: string): JSX.Element {
    return (
        <Helmet>
            <title>{text.length > 0 ? `${text}: ` : ""} - Midspace</title>
        </Helmet>
    );
}
