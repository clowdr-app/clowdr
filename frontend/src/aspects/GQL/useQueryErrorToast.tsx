import { Box, useToast } from "@chakra-ui/react";
import React, { useEffect } from "react";
import type { CombinedError } from "urql";
import FAIcon from "../Icons/FAIcon";
import { useUrqlContext } from "./UrqlProvider";

// let shownJWTIssuedAtFutureReloadWarning = false;
let errorToastId: string | number | undefined = undefined;

export default function useQueryErrorToast(
    error: string | false | CombinedError | undefined,
    reconnectOnError: boolean,
    queryName?: string
): void {
    const toast = useToast();
    const ctx = useUrqlContext();

    useEffect(() => {
        let tId: number | undefined;
        if (error) {
            const message = typeof error === "string" ? error : error.message;
            if (message.includes("JWTIssuedAtFuture")) {
                // if (!shownJWTIssuedAtFutureReloadWarning) {
                //     shownJWTIssuedAtFutureReloadWarning = true;
                //     toast({
                //         position: "top",
                //         status: "warning",
                //         isClosable: false,
                //         title: "Need to refresh",
                //         duration: 5000,
                //         description: "We just need to refresh for a moment to finalise your login…",
                //     });
                //     ctx.reconnect();
                // }
                console.error(
                    "Oh not this again... Hasura's clock is out of sync with the rest of the world. Lookup JWT Leeway in the Hasura docs."
                );
            }

            console.error("Query error", error, queryName);
            if (errorToastId === null || errorToastId === undefined) {
                errorToastId = toast({
                    isClosable: false,
                    title: "Disconnected",
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
                if (reconnectOnError) {
                    ctx.reconnect(() => {
                        if (errorToastId) {
                            toast.close(errorToastId);
                        }

                        toast({
                            isClosable: false,
                            duration: 3000,
                            title: "Reconnected",
                            status: "success",
                            description: "Successfully reconnected to the server.",
                            position: "bottom-right",
                            render: function QueryError(_props): JSX.Element {
                                return (
                                    <Box w="100%" textAlign="right">
                                        <FAIcon color="purple.500" opacity={0.8} iconStyle="s" icon="heartbeat" />
                                    </Box>
                                );
                            },
                        });
                    });
                }
            }
        }
        return () => {
            if (tId) {
                clearTimeout(tId);
            }
        };
    }, [ctx, error, queryName, reconnectOnError, toast]);
}
