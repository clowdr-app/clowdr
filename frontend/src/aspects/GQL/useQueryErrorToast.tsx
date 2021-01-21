import type { ApolloError } from "@apollo/client";
import { Box, useToast } from "@chakra-ui/react";
import React, { useEffect } from "react";
import FAIcon from "../Icons/FAIcon";

let shownJWTIssuedAtFutureReloadWarning = false;
let errorToastId: string | number | undefined = undefined;

export default function useQueryErrorToast(error: string | false | ApolloError | undefined, queryName?: string): void {
    const toast = useToast();

    useEffect(() => {
        let tId: number | undefined;
        if (error) {
            const message = typeof error === "string" ? error : error.message;
            if (message.includes("JWTIssuedAtFuture")) {
                if (!shownJWTIssuedAtFutureReloadWarning) {
                    shownJWTIssuedAtFutureReloadWarning = true;
                    toast({
                        position: "top",
                        status: "warning",
                        isClosable: false,
                        title: "Need to refresh",
                        duration: 5000,
                        description: "We just need to refresh for a moment to finalise your login…",
                    });
                    // TODO Recover from failure
                }
            } else {
                console.error("Query error", error, queryName);
                if (errorToastId === null || errorToastId === undefined) {
                    errorToastId = toast({
                        isClosable: false,
                        duration: 10000,
                        title: "Error",
                        status: "error",
                        description: message,
                        position: "bottom-right",
                        render: function QueryError(_props): JSX.Element {
                            return (
                                <Box w="100%" textAlign="right">
                                    <FAIcon color="red.500" opacity={0.8} iconStyle="s" icon="heartbeat" />
                                </Box>
                            );
                        },
                    });
                    tId = setTimeout(
                        (() => {
                            errorToastId = undefined;
                        }) as TimerHandler,
                        11000
                    );
                    // TODO Recover from failure
                }
            }
        }
        return () => {
            if (tId) {
                clearTimeout(tId);
            }
        };
    }, [error, queryName, toast]);
}
