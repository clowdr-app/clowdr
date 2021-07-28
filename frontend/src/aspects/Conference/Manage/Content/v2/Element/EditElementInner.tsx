import type { Reference } from "@apollo/client";
import { Alert, AlertDescription, AlertIcon, AlertTitle, Divider, Text } from "@chakra-ui/react";
import { ElementBaseTypes } from "@clowdr-app/shared-types/build/content";
import React, { useMemo } from "react";
import {
    ManageContent_ElementFragment,
    ManageContent_ElementFragmentDoc,
    ManageContent_UploadableElementFragment,
    useManageContent_UpdateElementMutation,
} from "../../../../../../generated/graphql";
import { EditUploaders } from "./EditUploaders";
import { ElementBaseTemplates } from "./Kinds/Templates";
import type { ContentDescriptor } from "./Kinds/Types";
import { LayoutEditor } from "./LayoutEditor";

export function EditElementInner(props: {
    element: ManageContent_ElementFragment;
    uploadableElement: ManageContent_UploadableElementFragment;
    openSendSubmissionRequests: (uploaderIds: string[]) => void;
}): JSX.Element {
    const [updateElement, updateElementResponse] = useManageContent_UpdateElementMutation({
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

    const itemType = props.element ? props.element.typeName : props.uploadableElement.typeName;
    const baseType = ElementBaseTypes[itemType];
    const itemTemplate = useMemo(() => ElementBaseTemplates[baseType], [baseType]);

    const descriptors: ContentDescriptor = useMemo(
        () =>
            !props.uploadableElement
                ? { type: "element-only", element: { ...props.element, layoutData: props.element.layoutData ?? null } }
                : props.element
                ? {
                      type: "required-and-element",
                      element: { ...props.element, layoutData: props.element.layoutData ?? null },
                      uploadableElement: props.uploadableElement,
                  }
                : {
                      type: "required-only",
                      uploadableElement: props.uploadableElement,
                  },
        [props.element, props.uploadableElement]
    );

    const editor = useMemo(() => {
        return itemTemplate.supported ? (
            <itemTemplate.renderEditor
                data={descriptors}
                update={(updated) => {
                    const updatedItem = {
                        data: updated.element.data,
                        layoutData: updated.element.layoutData,
                        isHidden: updated.uploadableElement.isHidden,
                        name: updated.uploadableElement.name,
                        typeName: updated.uploadableElement.typeName,
                        uploadsRemaining: updated.uploadableElement.uploadsRemaining,
                    };
                    updateElement({
                        variables: {
                            elementId: updated.element.id,
                            element: updatedItem,
                        },
                        optimisticResponse: {
                            update_content_Element_by_pk: {
                                ...updated.element,
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

    return (
        <>
            {updateElementResponse.error ? (
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle>Error saving changes</AlertTitle>
                    <AlertDescription>{updateElementResponse.error.message}</AlertDescription>
                </Alert>
            ) : undefined}
            {updateUploadableElementResponse.error ? (
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle>Error saving changes</AlertTitle>
                    <AlertDescription>{updateUploadableElementResponse.error.message}</AlertDescription>
                </Alert>
            ) : undefined}
            {props.uploadableElement ? (
                <>
                    <EditUploaders
                        openSendSubmissionRequests={props.openSendSubmissionRequests}
                        uploadableElementId={props.uploadableElement.id}
                        uploadsRemaining={props.uploadableElement.uploadsRemaining ?? null}
                        updateUploadableElement={updateUploadableElement}
                        isUpdatingUploadable={updateUploadableElementResponse.loading}
                    />
                    <Divider my={2} />
                </>
            ) : undefined}
            {editor}
            {props.element ? (
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
            ) : undefined}
        </>
    );
}
