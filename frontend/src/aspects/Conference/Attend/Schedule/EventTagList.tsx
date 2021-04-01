import { gql } from "@apollo/client";
import { HStack, Tag, useColorModeValue } from "@chakra-ui/react";
import React, { useMemo } from "react";
import type { Schedule_EventTagFragment } from "../../../../generated/graphql";

gql`
    fragment Schedule_Tag on Tag {
        id
        name
        colour
        priority
    }

    fragment Schedule_EventTag on EventTag {
        id
        tag {
            ...Schedule_Tag
        }
    }
`;

export default function EventTagList({ tags }: { tags: readonly Schedule_EventTagFragment[] }): JSX.Element {
    const sortedTags = useMemo(() => {
        return [...tags]
            .sort((x, y) => x.tag.name.localeCompare(y.tag.name))
            .sort((x, y) => x.tag.priority - y.tag.priority);
    }, [tags]);

    const colour = useColorModeValue("gray.800", "gray.200");
    return (
        <HStack>
            {sortedTags.map((tag) => (
                <Tag
                    key={tag.id}
                    backgroundColor={tag.tag.colour}
                    borderWidth={1}
                    borderStyle="solid"
                    borderColor="gray.400"
                    variant="solid"
                    borderRadius="full"
                    color={colour}
                    size="sm"
                    role="note"
                    aria-label={`Tag: ${tag.tag.name}`}
                >
                    {tag.tag.name}
                </Tag>
            ))}
        </HStack>
    );
}
