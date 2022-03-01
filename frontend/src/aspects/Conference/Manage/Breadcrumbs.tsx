import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { Link as ReactLink } from "react-router-dom";
import useBreadcrumbs from "use-react-router-breadcrumbs";
import { useConference } from "../useConference";

export function Breadcrumbs(): JSX.Element {
    const conference = useConference();
    const routes = useMemo(
        () => [
            {
                path: "/conference/:slug/manage",
                breadcrumb: `Manage ${conference.shortName}`,
            },
            {
                path: "/c/:slug/manage",
                breadcrumb: `Manage ${conference.shortName}`,
            },
            {
                path: "/conference/:slug/manage/export/youtube",
                breadcrumb: "YouTube",
            },
            {
                path: "/c/:slug/manage/export/youtube",
                breadcrumb: "YouTube",
            },
            {
                path: "/conference/:slug/manage/export/download-videos",
                breadcrumb: "Download videos",
            },
            {
                path: "/c/:slug/manage/export/download-videos",
                breadcrumb: "Download videos",
            },
        ],
        [conference.shortName]
    );
    const breadcrumbs = useBreadcrumbs(routes, {
        excludePaths: ["/", "/conference", "/c", "/conference/:slug", "/c/:slug"],
    });

    return (
        <Breadcrumb separator=">">
            {breadcrumbs.map((breadcrumb) => (
                <BreadcrumbItem key={breadcrumb.key} isCurrentPage={breadcrumb.key === breadcrumb.location.key}>
                    <BreadcrumbLink as={ReactLink} to={breadcrumb.key}>
                        {breadcrumb.breadcrumb}
                    </BreadcrumbLink>
                </BreadcrumbItem>
            ))}
        </Breadcrumb>
    );
}
