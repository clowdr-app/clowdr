import { Tag, Wrap, WrapItem } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo } from "react";
import type { ManageSchedule_ItemTagFragment, ManageSchedule_TagFragment } from "../../../../../generated/graphql";
import { maybeCompare } from "../../../../Utils/maybeCompare";

export default function Tags({
    tags,
    itemTags,
    onEdit,
}: {
    tags: ReadonlyArray<ManageSchedule_TagFragment>;
    itemTags: ReadonlyArray<ManageSchedule_ItemTagFragment>;

    onEdit: () => void;
}): JSX.Element {
    const matchedTags = useMemo(
        () =>
            R.sortWith(
                [
                    (a, b) => maybeCompare(a.tag?.priority, b.tag?.priority, (x, y) => x - y),
                    (a, b) => maybeCompare(a.tag?.name, b.tag?.name, (x, y) => x.localeCompare(y)),
                ],
                itemTags.map((itemTag) => ({
                    itemTag,
                    tag: tags.find((x) => x.id === itemTag.tagId),
                }))
            ).slice(0, 3),
        [itemTags, tags]
    );

    return (
        <Wrap>
            {matchedTags.map((tag, idx) => (
                <WrapItem key={idx}>
                    <Tag
                        borderRadius="full"
                        colorScheme="gray"
                        onClick={(ev) => {
                            onEdit();
                            ev.stopPropagation();
                        }}
                        _hover={{
                            bgColor: "gray.400",
                        }}
                    >
                        {tag.tag?.name ?? "<unknown>"}
                    </Tag>
                </WrapItem>
            ))}
            {matchedTags.length < itemTags.length ? (
                <WrapItem>
                    <Tag
                        borderRadius="full"
                        colorScheme="gray"
                        onClick={(ev) => {
                            onEdit();
                            ev.stopPropagation();
                        }}
                        _hover={{
                            bgColor: "gray.400",
                        }}
                    >
                        {itemTags.length - matchedTags.length} more…
                    </Tag>
                </WrapItem>
            ) : undefined}
            {itemTags.length === 0 ? (
                <WrapItem>
                    <Tag
                        borderRadius="full"
                        colorScheme="gray"
                        onClick={(ev) => {
                            onEdit();
                            ev.stopPropagation();
                        }}
                        _hover={{
                            bgColor: "gray.400",
                        }}
                    >
                        + Add tag
                    </Tag>
                </WrapItem>
            ) : undefined}
        </Wrap>
    );
}
