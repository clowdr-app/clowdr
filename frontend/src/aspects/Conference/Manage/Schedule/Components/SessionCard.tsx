import {
    HStack,
    IconButton,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Spacer,
    Tag,
    Text,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import type { ElementDataBlob, TextualElementBlob } from "@midspace/shared-types/content";
import React, { useMemo, useRef } from "react";
import type {
    ManageSchedule_PresentationFragment,
    ManageSchedule_SessionFragment,
    ManageSchedule_TagFragment,
} from "../../../../../generated/graphql";
import { Schedule_Mode_Enum } from "../../../../../generated/graphql";
import Card from "../../../../Card";
import FAIcon from "../../../../Chakra/FAIcon";
import { LinkButton } from "../../../../Chakra/LinkButton";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import { useRealTime } from "../../../../Hooks/useRealTime";
import PresentationsList from "./PresentationsList";
import Tags from "./Tags";

export default function SessionCard({
    session,
    tags,

    anySelected,
    isSelected,
    isDisabled,
    onSelectToggle,

    onEdit,
    onDelete,
    onExport,

    onCreatePresentation,
    onEditPresentation,
    onDeletePresentation,
}: {
    session: ManageSchedule_SessionFragment;
    tags: ReadonlyArray<ManageSchedule_TagFragment>;

    anySelected: boolean;
    isSelected: boolean;
    isDisabled?: boolean;
    onSelectToggle: () => void;

    onEdit: (initialStepIdx?: number) => void;
    onDelete: () => void;
    onExport: () => void;

    onCreatePresentation: () => void;
    onEditPresentation: (presentation: ManageSchedule_PresentationFragment, initialStepIdx?: number) => void;
    onDeletePresentation: (presentationId: string) => void;
}): JSX.Element {
    const { conferencePath } = useAuthParameters();
    const ref = useRef<HTMLDivElement | null>(null);
    const start = useMemo(() => new Date(session.scheduledStartTime), [session.scheduledStartTime]);
    const end = useMemo(() => new Date(session.scheduledEndTime), [session.scheduledEndTime]);
    const duration = useMemo(() => Math.round((end.getTime() - start.getTime()) / (60 * 1000)), [end, start]);
    const now = useRealTime(60000);
    const isLive = now >= start.getTime() && now <= end.getTime();
    const presentationsDisclosure = useDisclosure();

    const abstractData: TextualElementBlob | undefined = useMemo(
        () => (session.item?.abstract?.[0]?.data as ElementDataBlob | undefined)?.[0]?.data as TextualElementBlob,
        [session.item?.abstract]
    );
    const peopleCount = session.eventPeople.length + (session.item?.itemPeople.length ?? 0);
    const elementCount = session.item?.elements_aggregate.aggregate?.count ?? 0;
    return (
        <VStack minW="400px" w="100%" alignItems="flex-start">
            <Card
                ref={ref}
                isSelectable
                isSelected={isSelected}
                isDisabled={isDisabled}
                onSelectToggle={() => {
                    onSelectToggle();
                }}
                subHeading={
                    start.toLocaleString(undefined, {
                        hour: "numeric",
                        minute: "numeric",
                    }) +
                    " - " +
                    new Date(start.getTime() + 1000 * 60 * duration).toLocaleString(undefined, {
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
                }
                heading={session.item?.title ?? session.name}
                w="100%"
                bottomButton={
                    session.modeName &&
                    ((!session.exhibitionId && !session.shufflePeriodId) ||
                        Boolean(session.presentations_aggregate.aggregate?.count)) &&
                    (session.modeName === Schedule_Mode_Enum.VideoChat ||
                        session.modeName === Schedule_Mode_Enum.Livestream ||
                        session.modeName === Schedule_Mode_Enum.External)
                        ? {
                              label: session.presentations_aggregate.aggregate?.count
                                  ? "Presentations"
                                  : presentationsDisclosure.isOpen
                                  ? "Cancel"
                                  : "Add presentation",
                              colorScheme: "blue",
                              icon: session.presentations_aggregate.aggregate?.count
                                  ? presentationsDisclosure.isOpen
                                      ? "chevron-up"
                                      : "chevron-down"
                                  : presentationsDisclosure.isOpen
                                  ? "times"
                                  : "plus",
                              iconStyle: "s",
                              onClick: () => {
                                  if (!isDisabled) {
                                      presentationsDisclosure.onToggle();
                                  }
                              },
                              variant: "ghost",
                              showLabel: true,
                          }
                        : undefined
                }
                editControls={
                    anySelected
                        ? []
                        : [
                              ...(isLive
                                  ? [
                                        <LinkButton
                                            key="live-button"
                                            colorScheme="LiveActionButton"
                                            to={`${conferencePath}/room/${session.roomId}`}
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
                              ...(session.itemId
                                  ? [
                                        <LinkButton
                                            key="link-button"
                                            colorScheme="PrimaryActionButton"
                                            to={`${conferencePath}/item/${session.itemId}`}
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
                                  aria-label="Edit session"
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
                                          onClick={(ev) => {
                                              onExport();
                                              ev.stopPropagation();
                                          }}
                                      >
                                          Export
                                      </MenuItem>
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
                          ]
                }
            >
                {abstractData ? <Text noOfLines={3}>{abstractData.text}</Text> : undefined}
                <HStack w="100%" alignItems="flex-start">
                    <Tags
                        tags={tags}
                        itemTags={session.item?.itemTags ?? []}
                        onEdit={() => {
                            onEdit(0);
                        }}
                    />
                    <Spacer />
                    {session.modeName && session.modeName !== Schedule_Mode_Enum.VideoChat ? (
                        <Tag
                            borderRadius="full"
                            colorScheme="purple"
                            minW="max-content"
                            whiteSpace="nowrap"
                            overflow="hidden"
                            onClick={(ev) => {
                                onEdit(3);
                                ev.stopPropagation();
                            }}
                            _hover={{
                                bgColor: "purple.400",
                            }}
                        >
                            {session.modeName}
                        </Tag>
                    ) : undefined}
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
            {presentationsDisclosure.isOpen ? (
                <PresentationsList
                    sessionId={session.id}
                    tags={tags}
                    onCreate={onCreatePresentation}
                    onEdit={onEditPresentation}
                    onDelete={onDeletePresentation}
                />
            ) : undefined}
        </VStack>
    );
}
