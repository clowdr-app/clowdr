import { gql } from "@apollo/client";
import { Heading } from "@chakra-ui/react";
import React from "react";
import type { ElementDataFragment } from "../../../../generated/graphql";

gql`
    fragment ElementData on content_Element {
        id
        data
        layoutData
        name
        typeName
    }
`;

export default function Element({ elementData }: { elementData: ElementDataFragment }): JSX.Element {
    return (
        <>
            <Heading as="h3" fontSize={24}>
                {elementData.name}
            </Heading>
        </>
    );
}
