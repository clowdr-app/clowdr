import { Alert, AlertDescription, AlertIcon, AlertTitle, CloseButton } from "@chakra-ui/react";
import React, { useContext } from "react";
import { LinkButton } from "../../../../Chakra/LinkButton";
import { useConference } from "../../../useConference";
import { YouTubeExportContext } from "./YouTubeExportContext";

export function Finished(): JSX.Element {
    const conference = useConference();
    const { finished, reset } = useContext(YouTubeExportContext);
    return finished ? (
        <Alert
            status="success"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="200px"
            mt={4}
        >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={2} fontSize="xl">
                Your videos are now being exported to YouTube
            </AlertTitle>
            <AlertDescription maxWidth="sm">This will take a few minutes.</AlertDescription>
            <LinkButton
                to={`${conferenceUrl}/manage/export/youtube/uploads`}
                colorScheme="ConfirmButton"
                mt={4}
                size="lg"
            >
                View progress
            </LinkButton>
            <CloseButton position="absolute" right="8px" top="8px" onClick={() => reset()} />
        </Alert>
    ) : (
        <></>
    );
}
