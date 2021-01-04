import { HStack, Tag, useColorModeValue } from "@chakra-ui/react";
import React, { useMemo } from "react";
import type { Timeline_EventTagFragment } from "../../../../generated/graphql";

export default function EventTagList({ tags }: { tags: readonly Timeline_EventTagFragment[] }): JSX.Element {
    const sortedTags = useMemo(() => {
        return [...tags].sort((x, y) => x.tag.name.localeCompare(y.tag.name));
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
