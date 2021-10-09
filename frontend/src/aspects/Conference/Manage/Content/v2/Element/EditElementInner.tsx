import { Alert, AlertDescription, AlertIcon, AlertTitle, Divider, Text } from "@chakra-ui/react";
import { ElementBaseTypes } from "@clowdr-app/shared-types/build/content";
import React, { useMemo } from "react";
import type { Reference } from "urql";
import {
    ManageContent_ElementFragment,
    ManageContent_ElementFragmentDoc,
    useManageContent_UpdateElementMutation,
} from "../../../../../../generated/graphql";
import { EditUploadsRemaining } from "./EditUploadsRemaining";
import { ElementBaseTemplates } from "./Kinds/Templates";
import type { ContentDescriptor } from "./Kinds/Types";
import { LayoutEditor } from "./LayoutEditor";

export function EditElementInner(props: {
    element: ManageContent_ElementFragment;
    openSendSubmissionRequests: (personIds: string[]) => void;
}): JSX.Element {
    const [updateElementResponse, updateElement] = useManageContent_UpdateElementMutation({
        update: (cache, { data: _data }) => {
            if (_data?.update_content_Element_by_pk) {
                const data = _data.update_content_Element_by_pk;
                cache.modify({
                    fields: {
                        content_Element(existingRefs: Reference[] = [], { readField }) {
                            const newRef = cache.writeFragment({
                                data,
                                fragment: ManageContent_ElementFragmentDoc,
                                fragmentName: "ManageContent_Element",
                            });
                            if (existingRefs.some((ref) => readField("id", ref) === data.id)) {
                                return existingRefs;
                            }
                            return [...existingRefs, newRef];
                        },
                    },
                });
            }
        },
    });

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
                    updateElement({
                        variables: {
                            elementId: updated.id,
                            element: updatedItem,
                        },
                        optimisticResponse: {
                            update_content_Element_by_pk: {
                                ...updated,
                                ...updatedItem,
                                __typename: "content_Element",
                            },
                        },
                    });
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
                        updateElement({
                            variables: {
                                elementId: newState.id,
                                element: {
                                    data: newState.data,
                                    layoutData: newState.layoutData,
                                },
                            },
                            optimisticResponse: {
                                update_content_Element_by_pk: {
                                    ...props.element,
                                    data: newState.data,
                                    layoutData: newState.layoutData,
                                    __typename: "content_Element",
                                },
                            },
                        });
                    }
                }}
            />
        </>
    );
}
