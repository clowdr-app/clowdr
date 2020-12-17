import { useAuth0 } from "@auth0/auth0-react";
import { Box, Heading, Image, Text } from "@chakra-ui/react";
import React from "react";

export default function UserProfileInfo() {
    const { user } = useAuth0();

    return (
        <Box margin="1em">
            <Image borderRadius="full" boxSize="150px" src={user.picture} alt={user.name} />
            <Heading as="h1">{user.name}</Heading>
            <Text>{user.email}</Text>
        </Box>
    );
}
