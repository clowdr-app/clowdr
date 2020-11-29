import React, { useEffect } from "react";
import { Prompt } from "react-router-dom";

export default function LeavePageWarning({
    message,
    hasUnsavedChanges,
}: {
    hasUnsavedChanges: boolean;
    message: string;
}): JSX.Element {
    useEffect(() => {
        const unloadHandler = (() => {
            if (hasUnsavedChanges) {
                const _unloadHandler = (ev: BeforeUnloadEvent) => {
                    ev.preventDefault();
                    ev.returnValue = message;
                    return true;
                };
                window.addEventListener("beforeunload", _unloadHandler);
                return _unloadHandler;
            }
            return null;
        })();

        return () => {
            if (unloadHandler) {
                window.removeEventListener("beforeunload", unloadHandler);
            }
        };
    }, [hasUnsavedChanges, message]);

    return <Prompt when={hasUnsavedChanges} message={message} />;
}
