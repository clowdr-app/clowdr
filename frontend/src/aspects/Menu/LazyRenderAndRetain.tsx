import React, { useEffect, useState } from "react";

export default function useLazyRenderAndRetain(render: () => JSX.Element, shouldRender: boolean): JSX.Element {
    const [rendered, setRendered] = useState<JSX.Element | null>(null);

    useEffect(() => {
        if (!rendered && shouldRender) {
            setRendered(render());
        }
    }, [render, rendered, shouldRender]);

    return rendered ?? <></>;
}
