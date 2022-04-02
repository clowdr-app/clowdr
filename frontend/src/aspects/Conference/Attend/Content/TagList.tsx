import type { StackProps } from "@chakra-ui/react";
import { HStack } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo } from "react";
import { useHistory } from "react-router-dom";
import type { ItemTagDataFragment } from "../../../../generated/graphql";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { TagButton } from "./ItemList";

export default function TagList({
    tags,
    noClick,
    withBorder,
    ...props
}: { tags: readonly ItemTagDataFragment[]; noClick?: boolean; withBorder?: boolean } & StackProps): JSX.Element {
    const { conferencePath } = useAuthParameters();
    const sortedTags = useMemo(
        () =>
            R.uniqBy(
                (x) => x.tag.id,
                [...tags].filter((x) => !!x.tag)
            ).sort((x, y) => x.tag.priority - y.tag.priority),
        [tags]
    );
    const history = useHistory();
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
                                  history.push(`${conferencePath}/content/${id}`);
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
