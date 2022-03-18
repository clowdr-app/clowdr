import { assert } from "@midspace/assert";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import React, { useEffect, useMemo } from "react";
import type { RouteComponentProps } from "react-router-dom";
import { Route, Switch, useRouteMatch } from "react-router-dom";
import { useGetSlugForUrlQuery } from "../../generated/graphql";
import CenteredSpinner from "../Chakra/CenteredSpinner";
import { useConferenceTheme } from "../Chakra/ChakraCustomProvider";
import { useAuthParameters } from "../GQL/AuthParameters";
import { makeContext } from "../GQL/make-context";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";

gql`
    query GetSlugForUrl($url: String!) @cached {
        getSlug(url: $url) {
            slug
        }
    }
`;

export default function DetectSlug({ children }: { children: (children?: JSX.Element) => JSX.Element }): JSX.Element {
    return (
        <Switch>
            <Route
                path={["/conference/:confSlug", "/c/:confSlug"]}
                component={(
                    props: RouteComponentProps<{
                        confSlug: string;
                    }>
                ) => <ApplyConferenceSlug confSlug={props.match.params.confSlug}>{children}</ApplyConferenceSlug>}
            />
            <Route path="/">
                <CheckSlug>{children}</CheckSlug>
            </Route>
        </Switch>
    );
}

function CheckSlug({ children }: { children: (children?: JSX.Element) => JSX.Element }): JSX.Element {
    const slugCache = useMemo(() => {
        const str = window.localStorage.getItem("SLUG_CACHE");
        if (str) {
            return JSON.parse(str);
        }
        return null;
    }, []);
    const origin = useMemo(() => window.location.origin, []);
    const existingMapping = useMemo(() => {
        const entry = slugCache?.[origin];
        if (entry) {
            try {
                assert.truthy(entry.expiry && typeof entry.expiry === "number");
                assert.truthy(entry.value && typeof entry.expiry === "string");
                if (entry.expiry > Date.now()) {
                    return entry.value as string;
                } else {
                    delete slugCache[origin];
                    window.localStorage.setItem("SLUG_CACHE", slugCache);
                }
            } catch {
                window.localStorage.removeItem("SLUG_CACHE");
            }
        }
        return undefined;
    }, [origin, slugCache]);
    if (!existingMapping) {
        return <CheckSlugInner>{children}</CheckSlugInner>;
    } else {
        return <ApplyConferenceSlug confSlug={existingMapping}>{children}</ApplyConferenceSlug>;
    }
}

function CheckSlugInner({ children }: { children: (children?: JSX.Element) => JSX.Element }): JSX.Element {
    const origin = useMemo(() => window.location.origin, []);
    const mUser = useMaybeCurrentUser();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: mUser ? HasuraRoleName.User : HasuraRoleName.Unauthenticated,
            }),
        [mUser]
    );
    const [response] = useGetSlugForUrlQuery({
        variables: {
            url: origin,
        },
        context,
    });
    useEffect(() => {
        if (response.data?.getSlug?.slug) {
            const cacheStr = window.localStorage.getItem("SLUG_CACHE");
            let cache;
            if (cacheStr) {
                cache = JSON.parse(cacheStr);
            } else {
                cache = {};
            }
            cache[origin] = { value: response.data.getSlug.slug, expiry: Date.now() + 7 * 24 * 60 * 60 * 1000 };
            window.localStorage.setItem("SLUG_CACHE", JSON.stringify(cache));
        }
    }, [origin, response.data?.getSlug?.slug]);
    if (!response.fetching) {
        if (!response.data?.getSlug?.slug) {
            return <ApplyConferenceSlug>{children}</ApplyConferenceSlug>;
        } else {
            return <ApplyConferenceSlug confSlug={response.data.getSlug.slug}>{children}</ApplyConferenceSlug>;
        }
    }

    return children(<CenteredSpinner caller="AppRouting:139" />);
}

function ApplyConferenceSlug({
    children,
    confSlug,
}: {
    children: (children?: JSX.Element) => JSX.Element;
    confSlug?: string | null;
}): JSX.Element {
    const { url } = useRouteMatch();
    const { setConferenceSlug, setConferencePath } = useAuthParameters();
    const { setTheme } = useConferenceTheme();
    useEffect(() => {
        if (!confSlug) {
            setTheme(undefined);
        }

        setConferenceSlug(confSlug ?? null);
        setConferencePath(confSlug ? (url.endsWith("/") ? url.substring(0, url.length - 1) : url) : null);
    }, [confSlug, setTheme, setConferenceSlug, setConferencePath, url]);

    return <>{children()}</>;
}
