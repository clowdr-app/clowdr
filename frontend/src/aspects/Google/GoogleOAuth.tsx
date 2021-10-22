import { Spinner, useToast } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { gql } from "urql";
import { useGoogleOAuth_SubmitGoogleOAuthCodeMutation } from "../../generated/graphql";
import { useGoogleOAuthRedirectPath } from "./useGoogleOAuthRedirectUrl";

gql`
    mutation GoogleOAuth_SubmitGoogleOAuthCode($code: String!, $state: String!) {
        submitGoogleOAuthCode(code: $code, state: $state) {
            message
            success
        }
    }
`;

export function GoogleOAuthRedirect(): JSX.Element {
    const location = useLocation();
    const toast = useToast();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get("code");
        const state = searchParams.get("state");

        if (code && state) {
            const updatedSearchParams = new URLSearchParams({
                code,
                registrantId: state,
            });
            window.location.href = `/googleoauth2?${updatedSearchParams.toString()}`;
        } else {
            toast({
                title: "Failed to connect to Google account",
                description: "Some expected data from Google was missing",
                status: "error",
            });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <Spinner />;
}

export function GoogleOAuth(): JSX.Element {
    const location = useLocation();

    const [submitResponse, submit] = useGoogleOAuth_SubmitGoogleOAuthCodeMutation();
    const [message, setMessage] = useState<string | null>(null);
    const [, , follow] = useGoogleOAuthRedirectPath();

    useEffect(() => {
        async function fn() {
            try {
                const searchParams = new URLSearchParams(location.search);
                const code = searchParams.get("code");
                const registrantId = searchParams.get("registrantId");

                if (code && registrantId) {
                    const result = await submit({
                        code,
                        state: registrantId,
                    });

                    if (!result.data?.submitGoogleOAuthCode?.success) {
                        throw new Error("Failure during authorisation code exchange");
                    }

                    setMessage("Successfully connected to Google Account");
                    follow();
                } else {
                    throw new Error("Invalid token returned from Google");
                }
            } catch (e) {
                setMessage(e.message);
                throw e;
            }
        }
        const timer = setTimeout(fn, 2000);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <>{message ?? <Spinner />}</>;
}
