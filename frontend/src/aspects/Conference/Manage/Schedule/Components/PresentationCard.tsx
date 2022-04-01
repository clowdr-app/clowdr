import { HStack, IconButton, Menu, MenuButton, MenuItem, MenuList, Spacer, Tag, Text, VStack } from "@chakra-ui/react";
import type { ElementDataBlob, TextualElementBlob } from "@midspace/shared-types/content";
import * as R from "ramda";
import React, { useMemo, useRef } from "react";
import type { ManageSchedule_PresentationFragment, ManageSchedule_TagFragment } from "../../../../../generated/graphql";
import Card from "../../../../Card";
import FAIcon from "../../../../Chakra/FAIcon";
import { LinkButton } from "../../../../Chakra/LinkButton";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import { useRealTime } from "../../../../Hooks/useRealTime";
import Tags from "./Tags";

export default function PresentationCard({
    presentation,
    tags,

    onEdit,
    onDelete,
}: {
    presentation: ManageSchedule_PresentationFragment;
    tags: ReadonlyArray<ManageSchedule_TagFragment>;

    onEdit: (initialStepIdx?: number) => void;
    onDelete: () => void;
}): JSX.Element {
    const { conferencePath } = useAuthParameters();
    const ref = useRef<HTMLDivElement | null>(null);
    const start = useMemo(
        () => (presentation.scheduledStartTime ? new Date(presentation.scheduledStartTime) : null),
        [presentation.scheduledStartTime]
    );
    const end = useMemo(
        () => (presentation.scheduledEndTime ? new Date(presentation.scheduledEndTime) : null),
        [presentation.scheduledEndTime]
    );
    const duration = useMemo(
        () => (start && end ? Math.round((end.getTime() - start.getTime()) / (60 * 1000)) : null),
        [end, start]
    );
    const now = useRealTime(60000);
    const isLive = Boolean(start && end && now >= start.getTime() && now <= end.getTime());

    const abstractData: TextualElementBlob | undefined = useMemo(
        () => (presentation.item?.abstract?.[0]?.data as ElementDataBlob | undefined)?.[0]?.data as TextualElementBlob,
        [presentation.item?.abstract]
    );
    const peopleCount = useMemo(
        () =>
            R.uniq([
                ...presentation.eventPeople.map((x) => x.personId),
                ...(presentation.item?.itemPeople.map((x) => x.personId) ?? []),
            ]).length,
        [presentation.eventPeople, presentation.item?.itemPeople]
    );
    const elementCount = presentation.item?.elements_aggregate.aggregate?.count ?? 0;
    return (
        <VStack minW="400px" w="100%" alignItems="flex-start">
            <Card
                ref={ref}
                subHeading={
                    start && end && duration
                        ? start.toLocaleString(undefined, {
                              hour: "numeric",
                              minute: "numeric",
                          }) +
                          " - " +
                          end.toLocaleString(undefined, {
                              hour: "numeric",
                              minute: "numeric",
                          }) +
                          ` (${
                              duration >= 60
                                  ? Math.floor(duration / 60).toFixed(0) +
                                    " hr" +
                                    (duration >= 120 ? "s" : "") +
                                    (duration % 60 !== 0 ? " " : "")
                                  : ""
                          }${duration % 60 !== 0 ? (duration % 60) + " mins" : ""})`
                        : undefined
                }
                heading={presentation.item?.title ?? presentation.name}
                w="100%"
                editControls={[
                    ...(isLive
                        ? [
                              <LinkButton
                                  key="live-button"
                                  colorScheme="LiveActionButton"
                                  to={`${conferencePath}/room/${presentation.roomId}`}
                                  variant="solid"
                                  size="md"
                                  linkProps={{
                                      target: "_blank",
                                      borderRadius: "full",
                                      overflow: "hidden",
                                      minH: 0,
                                      minW: 0,
                                      h: "auto",
                                      p: 0,
                                      m: 0,
                                      lineHeight: "1em",
                                  }}
                                  onClick={(ev) => {
                                      ev.stopPropagation();
                                  }}
                                  p={1}
                                  minW={0}
                                  h="auto"
                                  minH={0}
                                  lineHeight="1em"
                                  m={0}
                              >
                                  LIVE
                              </LinkButton>,
                          ]
                        : []),
                    ...(presentation.itemId
                        ? [
                              <LinkButton
                                  key="link-button"
                                  colorScheme="PrimaryActionButton"
                                  to={`${conferencePath}/item/${presentation.itemId}`}
                                  aria-label="View session"
                                  variant="ghost"
                                  size="md"
                                  linkProps={{
                                      target: "_blank",
                                      borderRadius: "full",
                                      overflow: "hidden",
                                      minH: 0,
                                      minW: 0,
                                      h: "auto",
                                      p: 0,
                                      m: 0,
                                      lineHeight: "1em",
                                  }}
                                  onClick={(ev) => {
                                      ev.stopPropagation();
                                  }}
                                  p={1}
                                  minW={0}
                                  h="auto"
                                  minH={0}
                                  lineHeight="1em"
                                  m={0}
                              >
                                  <FAIcon iconStyle="s" icon="link" />
                              </LinkButton>,
                          ]
                        : []),
                    <IconButton
                        key="edit-button"
                        colorScheme="PrimaryActionButton"
                        aria-label="Edit presentation"
                        icon={<FAIcon iconStyle="s" icon="edit" />}
                        size="md"
                        variant="ghost"
                        p={1}
                        minW={0}
                        h="auto"
                        minH={0}
                        m={0}
                        lineHeight="1em"
                        borderRadius="full"
                        onClick={(ev) => {
                            onEdit();
                            ev.stopPropagation();
                        }}
                    />,
                    <Menu key="more-options-menu" placement="bottom-end">
                        <MenuButton
                            aria-label="More options"
                            as={IconButton}
                            icon={<FAIcon iconStyle="s" icon="ellipsis-v" mx={1} />}
                            colorScheme="PrimaryActionButton"
                            size="md"
                            variant="ghost"
                            p={1}
                            minW={0}
                            h="auto"
                            minH={0}
                            m={0}
                            lineHeight="1em"
                            borderRadius="full"
                            onClick={(ev) => {
                                ev.stopPropagation();
                            }}
                        />
                        <MenuList minW="max-content" textAlign="right">
                            <MenuItem
                                color="DestructiveActionButton.400"
                                onClick={(ev) => {
                                    onDelete();
                                    ev.stopPropagation();
                                }}
                            >
                                Delete
                            </MenuItem>
                        </MenuList>
                    </Menu>,
                ]}
            >
                {abstractData ? <Text noOfLines={3}>{abstractData.text}</Text> : undefined}
                <HStack w="100%" alignItems="flex-start">
                    <Tags
                        tags={tags}
                        itemTags={presentation.item?.itemTags ?? []}
                        onEdit={() => {
                            onEdit(0);
                        }}
                    />
                    <Spacer />
                    <Tag
                        colorScheme="blue"
                        variant="subtle"
                        borderRadius="full"
                        minW="max-content"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        onClick={(ev) => {
                            onEdit(1);
                            ev.stopPropagation();
                        }}
                        _hover={{
                            bgColor: "blue.400",
                        }}
                    >
                        {peopleCount > 0 ? `${peopleCount} ${peopleCount === 1 ? "person" : "people"}` : "+ Add people"}
                    </Tag>
                    <Tag
                        colorScheme="yellow"
                        variant="subtle"
                        borderRadius="full"
                        minW="max-content"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        onClick={(ev) => {
                            onEdit(2);
                            ev.stopPropagation();
                        }}
                        _hover={{
                            bgColor: "yellow.400",
                        }}
                    >
                        {elementCount > 0 ? `Content: ${elementCount}` : "+ Add content"}
                    </Tag>
                </HStack>
            </Card>
        </VStack>
    );
}
