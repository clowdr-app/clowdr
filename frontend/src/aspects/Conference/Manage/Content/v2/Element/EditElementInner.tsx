import { Alert, AlertDescription, AlertIcon, AlertTitle, Divider, Text } from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { ElementBaseTypes } from "@midspace/shared-types/content";
import React, { useMemo } from "react";
import type { ManageContent_ElementFragment } from "../../../../../../generated/graphql";
import { useManageContent_UpdateElementMutation } from "../../../../../../generated/graphql";
import { EditUploadsRemaining } from "./EditUploadsRemaining";
import { ElementBaseTemplates } from "./Kinds/Templates";
import type { ContentDescriptor } from "./Kinds/Types";
import { LayoutEditor } from "./LayoutEditor";

export function EditElementInner(props: {
    element: ManageContent_ElementFragment;
    openSendSubmissionRequests: (personIds: string[]) => void;
}): JSX.Element {
    const [updateElementResponse, updateElement] = useManageContent_UpdateElementMutation();

    const itemType = props.element.typeName;
    const baseType = ElementBaseTypes[itemType];
    const itemTemplate = useMemo(() => ElementBaseTemplates[baseType], [baseType]);

    const descriptors: ContentDescriptor = useMemo(
        () => ({ ...props.element, layoutData: props.element.layoutData ?? null }),
        [props.element]
    );

    const editor = useMemo(() => {
        return itemTemplate.supported ? (
            <itemTemplate.renderEditor
                data={descriptors}
                update={(updated) => {
                    const updatedItem = {
                        data: updated.data,
                        layoutData: updated.layoutData,
                        isHidden: updated.isHidden,
                        name: updated.name,
                        typeName: updated.typeName,
                        uploadsRemaining: updated.uploadsRemaining,
                    };
                    updateElement(
                        {
                            elementId: updated.id,
                            element: updatedItem,
                        },
                        {
                            fetchOptions: {
                                headers: {
                                    [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                                },
                            },
                        }
                    );
                }}
            />
        ) : (
            <Text>Cannot edit {itemType} items.</Text>
        );
    }, [descriptors, itemTemplate, itemType, updateElement]);

    const readableTypeName = useMemo(
        () =>
            props.element.typeName
                .split("_")
                .map((x) => x[0] + x.substr(1).toLowerCase())
                .reduce((acc, x) => `${acc} ${x}`),
        [props.element.typeName]
    );
    return (
        <>
            {updateElementResponse.error ? (
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle>Error saving changes</AlertTitle>
                    <AlertDescription>{updateElementResponse.error.message}</AlertDescription>
                </Alert>
            ) : undefined}
            <Text fontSize="sm">Type: {readableTypeName}</Text>
            <EditUploadsRemaining
                elementId={props.element.id}
                uploadsRemaining={props.element.uploadsRemaining ?? null}
                updateUploadableElement={updateElement}
                isUpdatingUploadable={updateElementResponse.fetching}
            />
            <Divider my={2} />
            {editor}
            <LayoutEditor
                layoutDataBlob={props.element.layoutData ?? null}
                elementType={props.element.typeName}
                update={(layoutData) => {
                    if (props.element) {
                        const newState: ManageContent_ElementFragment = {
                            ...props.element,
                            layoutData,
                        };
                        updateElement(
                            {
                                elementId: newState.id,
                                element: {
                                    data: newState.data,
                                    layoutData: newState.layoutData,
                                },
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                                    },
                                },
                            }
                        );
                    }
                }}
            />
        </>
    );
}
