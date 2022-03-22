import { Flex } from "@chakra-ui/react";
import React from "react";
import { Route, Switch, useRouteMatch } from "react-router-dom";
import PageNotFound from "../../../Errors/PageNotFound";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { useTitle } from "../../../Hooks/useTitle";
import RequireRole from "../../RequireRole";
import { useConference } from "../../useConference";
import { DashboardPage } from "../DashboardPage";
import RestrictedDashboardButton from "../RestrictedDashboardButton";
import ImportProgramPage from "./Program/ImportProgramPage";
import ImportRegistrantsPage from "./Registrants/ImportRegistrantsPage";

export default function ManageImport(): JSX.Element {
    const { path } = useRouteMatch();
    const { subconferenceId } = useAuthParameters();
    return (
        <Switch>
            <Route path={`${path}/program`}>
                <ImportProgramPage />
            </Route>
            {!subconferenceId ? (
                <Route path={`${path}/registrants`}>
                    <ImportRegistrantsPage />
                </Route>
            ) : undefined}
            <Route path={`${path}/`}>
                <InnerManageImport />
            </Route>
        </Switch>
    );
}

function InnerManageImport(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Import to ${conference.shortName}`);
    const { subconferenceId } = useAuthParameters();

    return (
        <RequireRole organizerRole componentIfDenied={<PageNotFound />}>
            {title}
            <DashboardPage title="Import">
                <Flex
                    flexDirection="row"
                    flexWrap="wrap"
                    gridGap={["0.3rem", "0.3rem", "1rem"]}
                    alignItems="stretch"
                    justifyContent="center"
                >
                    <RestrictedDashboardButton
                        to="import/program"
                        name="Program"
                        icon="calendar"
                        description="Import your program."
                        organizerRole
                        colorScheme="purple"
                    />
                    {!subconferenceId ? (
                        <RestrictedDashboardButton
                            to="import/registrants"
                            name="Registrants"
                            icon="users"
                            description="Import your registrants, organisers and other users."
                            organizerRole
                            colorScheme="pink"
                        />
                    ) : undefined}
                </Flex>
            </DashboardPage>
        </RequireRole>
    );
}
