import { ChevronDownIcon } from "@chakra-ui/icons";
import { Button, ButtonGroup, IconButton, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react";
import type { ElementDataBlob } from "@midspace/shared-types/content";
import React from "react";
import { useHistory } from "react-router-dom";
import { Content_ElementType_Enum, Content_ItemType_Enum, Schedule_Mode_Enum } from "../../../../../generated/graphql";
import type { DeepPartial } from "../../../../CRUDCards/Types";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import type { ScheduleEditorRecord } from "./ScheduleEditorRecord";

export default function HeaderControls(
    onCreateSession: (initial?: DeepPartial<ScheduleEditorRecord>) => void,
    onCreateSessionForExistingContent: (typeDisplayName: string, typeNames: Content_ItemType_Enum[]) => void,
    onCreateSessionForExistingExhibition: (typeDisplayName: string) => void
): React.ReactChild[] {
    const history = useHistory();
    const { conferencePath } = useAuthParameters();

    return [
        <ButtonGroup key="add" isAttached>
            <Button
                colorScheme="SecondaryActionButton"
                borderRadius="xl"
                borderRightRadius={0}
                onClick={() => onCreateSession()}
            >
                Add a session
            </Button>
            <Menu placement="bottom-end">
                <MenuButton
                    as={IconButton}
                    ml="1px"
                    borderRadius="xl"
                    borderLeftRadius={0}
                    colorScheme="SecondaryActionButton"
                    aria-label="More"
                    icon={<ChevronDownIcon fontSize="130%" fontWeight="900" />}
                />
                <MenuList minWidth="auto">
                    <MenuItem
                        onClick={() => {
                            onCreateSession({
                                modeName: Schedule_Mode_Enum.External,
                                item: {
                                    externalEventLink: [
                                        {
                                            name: "Zoom",
                                            isHidden: true,
                                            typeName: Content_ElementType_Enum.ExternalEventLink,
                                            uploadsRemaining: 0,
                                            data: [] as ElementDataBlob,
                                        },
                                    ],
                                },
                            });
                        }}
                    >
                        Add externally-hosted session (e.g. Zoom)
                    </MenuItem>
                    {/* <MenuItem
                        onClick={() => {
                            onCreateSession({
                                item: {
                                    typeName: Content_ItemType_Enum.Social,
                                },
                                shufflePeriodId
                            });
                        }}
                    >
                        Add networking session
                    </MenuItem> */}
                    {/* <MenuItem
                        onClick={() => {
                            // TODO:
                        }}
                    >
                        Add session for an exhibition
                    </MenuItem> */}
                    <MenuItem
                        onClick={() => {
                            onCreateSessionForExistingContent("Sponsor", [Content_ItemType_Enum.Sponsor]);
                        }}
                    >
                        Add session for a sponsor
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            onCreateSessionForExistingContent("Existing content", [
                                Content_ItemType_Enum.Session,
                                Content_ItemType_Enum.Social,
                                Content_ItemType_Enum.Symposium,
                                Content_ItemType_Enum.Tutorial,
                                Content_ItemType_Enum.Workshop,
                            ]);
                        }}
                    >
                        Add session for existing content
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            onCreateSessionForExistingExhibition("Existing exhibition");
                        }}
                    >
                        Add session for existing exhibition
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            history.push(`${conferencePath}/manage/import/program`);
                        }}
                    >
                        Import
                    </MenuItem>
                </MenuList>
            </Menu>
        </ButtonGroup>,
    ];
}
