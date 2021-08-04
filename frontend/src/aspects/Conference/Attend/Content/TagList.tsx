import { HStack, StackProps } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo } from "react";
import type { ItemTagDataFragment } from "../../../../generated/graphql";
import { useScheduleModal } from "../Schedule/ProgramModal";
import { TagButton } from "./ItemList";

export default function TagList({
    tags,
    noClick,
    withBorder,
    ...props
}: { tags: readonly ItemTagDataFragment[]; noClick?: boolean; withBorder?: boolean } & StackProps): JSX.Element {
    const sortedTags = useMemo(
        () =>
            R.uniqBy(
                (x) => x.tag.id,
                [...tags].filter((x) => !!x.tag)
            ).sort((x, y) => x.tag.priority - y.tag.priority),
        [tags]
    );
    const { onOpen } = useScheduleModal();
    return (
        <HStack flexWrap="wrap" w="100%" gridRowGap={2} {...props}>
            {sortedTags.map((tag) => (
                <TagButton
                    key={tag.id}
                    tag={tag.tag}
                    isExpanded={false}
                    setOpenId={
                        !noClick
                            ? (id) => {
                                  onOpen(id ?? undefined);
                              }
                            : undefined
                    }
                    notExpander
                    withBorder={withBorder}
                />
            ))}
        </HStack>
    );
}
