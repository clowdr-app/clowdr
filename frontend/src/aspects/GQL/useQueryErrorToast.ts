import type { ApolloError } from "@apollo/client";
import { useToast } from "@chakra-ui/react";
import { useEffect } from "react";

let shownJWTIssuedAtFutureReloadWarning = false;

export default function useQueryErrorToast(error: string | false | ApolloError | undefined, queryName?: string): void {
    const toast = useToast();

    useEffect(() => {
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
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                }
            } else {
                console.error("Query error", error, queryName);
                toast({
                    isClosable: true,
                    duration: 20000,
                    title: "Error",
                    status: "error",
                    description: message,
                });
            }
        }
    }, [error, toast]);
}
