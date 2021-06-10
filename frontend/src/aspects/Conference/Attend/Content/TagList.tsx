import { HStack, StackProps } from "@chakra-ui/react";
import React, { useMemo } from "react";
import type { ItemTagDataFragment } from "../../../../generated/graphql";
import { TagButton } from "./ItemList";

export default function TagList({
    tags,
    noClick,
    ...props
}: { tags: readonly ItemTagDataFragment[]; noClick?: boolean } & StackProps): JSX.Element {
    const sortedTags = useMemo(() => [...tags].filter((x) => !!x.tag).sort((x, y) => x.tag.priority - y.tag.priority), [
        tags,
    ]);
    return (
        <HStack flexWrap="wrap" w="100%" {...props}>
            {sortedTags.map((tag) => (
                <TagButton
                    key={tag.id}
                    tag={tag.tag}
                    isExpanded={false}
                    setOpenId={
                        !noClick
                            ? (id) => {
                                  // TODO
                              }
                            : undefined
                    }
                    notExpander
                />
            ))}
        </HStack>
    );
}
