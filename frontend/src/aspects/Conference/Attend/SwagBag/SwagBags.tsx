import { Flex, Heading, HStack, Image, Text, VStack } from "@chakra-ui/react";
import type { ElementBlob, ElementDataBlob } from "@clowdr-app/shared-types/build/content";
import { ElementBaseType, isElementDataBlob } from "@clowdr-app/shared-types/build/content";
import type { LayoutDataBlob } from "@clowdr-app/shared-types/build/content/layoutData";
import { gql } from "@urql/core";
import AmazonS3URI from "amazon-s3-uri";
import * as R from "ramda";
import React, { useMemo } from "react";
import type { ElementDataFragment, SwagBagFragment } from "../../../../generated/graphql";
import { Content_ElementType_Enum, useSelectSwagBagsQuery } from "../../../../generated/graphql";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import { LinkButton } from "../../../Chakra/LinkButton";
import FAIcon from "../../../Icons/FAIcon";
import PageCountText from "../../../Realtime/PageCountText";
import { maybeCompare } from "../../../Utils/maybeSort";
import { useTitle } from "../../../Utils/useTitle";
import { useConference } from "../../useConference";
import { Element } from "../Content/Element/Element";

gql`
    fragment SwagBag on content_Item {
        id
        title
        elements(where: { isHidden: { _eq: false } }) {
            ...ElementData
        }
    }

    query SelectSwagBags($conferenceId: uuid!) {
        content_Item(where: { conferenceId: { _eq: $conferenceId }, typeName: { _eq: SWAG_BAG } }) {
            ...SwagBag
        }
    }
`;

export default function SwagBags(): JSX.Element {
    const conference = useConference();
    const swagBagsResponse = useSelectSwagBagsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    return swagBagsResponse.loading && !swagBagsResponse.data ? (
        <CenteredSpinner spinnerProps={{ label: "Loading your swag" }} />
    ) : (
        <SwagBagsInner bags={swagBagsResponse.data?.content_Item ?? []} />
    );
}

function SwagBagsInner({ bags }: { bags: readonly SwagBagFragment[] }): JSX.Element {
    const title = useTitle("Swag Bags");

    const sortedItems = useMemo(() => [...bags].sort((x, y) => x.title.localeCompare(y.title)), [bags]);

    return (
        <>
            {title}
            <Heading as="h1" id="page-heading" pt={2}>
                My Conference Swag
            </Heading>
            <Text>Gifts, goodies and freebies from the conference organisers and sponsors. Enjoy!</Text>
            <Flex
                w="100%"
                flexWrap="wrap"
                justifyContent="stretch"
                alignItems="flex-start"
                flexDir="row"
                gridColumnGap={[4, 4, 8]}
                gridRowGap={[4, 4, 8]}
            >
                {sortedItems.map((bag) => (
                    <BagTile key={bag.id} bag={bag} />
                ))}
            </Flex>
        </>
    );
}

function BagTile({ bag }: { bag: SwagBagFragment }) {
    const conference = useConference();

    const primaryElement: ElementDataFragment | undefined = useMemo(() => {
        const sortOrder = [
            Content_ElementType_Enum.VideoBroadcast,
            Content_ElementType_Enum.VideoFile,
            Content_ElementType_Enum.VideoPrepublish,
            Content_ElementType_Enum.VideoUrl,
            Content_ElementType_Enum.ImageFile,
            Content_ElementType_Enum.ImageUrl,
            Content_ElementType_Enum.PosterFile,
            Content_ElementType_Enum.PosterUrl,
            Content_ElementType_Enum.Abstract,
            Content_ElementType_Enum.Text,
        ];

        return bag.elements
            .filter((x) => {
                if (!sortOrder.includes(x.typeName)) {
                    return false;
                }

                if (
                    (x.typeName === Content_ElementType_Enum.ImageFile ||
                        x.typeName === Content_ElementType_Enum.ImageUrl) &&
                    x.layoutData
                ) {
                    const data = x.layoutData as LayoutDataBlob;
                    if (
                        (data.contentType === Content_ElementType_Enum.ImageFile ||
                            data.contentType === Content_ElementType_Enum.ImageUrl) &&
                        data.isLogo
                    ) {
                        return false;
                    }
                }

                const dataBlob = x.data as ElementDataBlob;
                if (dataBlob.length) {
                    const latestVersion: ElementBlob = dataBlob[dataBlob.length - 1].data;
                    switch (latestVersion.baseType) {
                        case ElementBaseType.Component:
                            return true;
                        case ElementBaseType.File:
                            return !!latestVersion.s3Url?.length;
                        case ElementBaseType.Link:
                            return !!latestVersion.text?.length && !!latestVersion.url?.length;
                        case ElementBaseType.Text:
                            return !!latestVersion.text?.length;
                        case ElementBaseType.URL:
                            return !!latestVersion.url?.length;
                        case ElementBaseType.Video:
                            return !!latestVersion.s3Url?.length;
                    }
                }
                return false;
            })
            .sort((x, y) =>
                maybeCompare(
                    (x.layoutData as LayoutDataBlob | undefined)?.priority,
                    (y.layoutData as LayoutDataBlob | undefined)?.priority,
                    (a, b) => a - b
                )
            )
            .sort((x, y) => sortOrder.indexOf(x.typeName) - sortOrder.indexOf(y.typeName))[0];
    }, [bag.elements]);
    const secondaryElement: ElementDataFragment | undefined = useMemo(() => {
        const sortOrder = [
            Content_ElementType_Enum.Abstract,
            Content_ElementType_Enum.Text,
            Content_ElementType_Enum.ImageFile,
            Content_ElementType_Enum.ImageUrl,
            Content_ElementType_Enum.PosterFile,
            Content_ElementType_Enum.PosterUrl,
            Content_ElementType_Enum.VideoBroadcast,
            Content_ElementType_Enum.VideoFile,
            Content_ElementType_Enum.VideoPrepublish,
            Content_ElementType_Enum.VideoUrl,
        ];

        return bag.elements
            .filter((x) => {
                if (!sortOrder.includes(x.typeName) || x.id === primaryElement?.id) {
                    return false;
                }

                if (
                    (x.typeName === Content_ElementType_Enum.ImageFile ||
                        x.typeName === Content_ElementType_Enum.ImageUrl) &&
                    x.layoutData
                ) {
                    const data = x.layoutData as LayoutDataBlob;
                    if (
                        (data.contentType === Content_ElementType_Enum.ImageFile ||
                            data.contentType === Content_ElementType_Enum.ImageUrl) &&
                        data.isLogo
                    ) {
                        return false;
                    }
                }

                const dataBlob = x.data as ElementDataBlob;
                if (dataBlob.length) {
                    const latestVersion: ElementBlob = dataBlob[dataBlob.length - 1].data;
                    switch (latestVersion.baseType) {
                        case ElementBaseType.Component:
                            return true;
                        case ElementBaseType.File:
                            return !!latestVersion.s3Url?.length;
                        case ElementBaseType.Link:
                            return !!latestVersion.text?.length && !!latestVersion.url?.length;
                        case ElementBaseType.Text:
                            return !!latestVersion.text?.length;
                        case ElementBaseType.URL:
                            return !!latestVersion.url?.length;
                        case ElementBaseType.Video:
                            return !!latestVersion.s3Url?.length;
                    }
                }
                return false;
            })
            .sort((x, y) =>
                maybeCompare(
                    (x.layoutData as LayoutDataBlob | undefined)?.priority,
                    (y.layoutData as LayoutDataBlob | undefined)?.priority,
                    (a, b) => a - b
                )
            )
            .sort((x, y) => sortOrder.indexOf(x.typeName) - sortOrder.indexOf(y.typeName))[0];
    }, [bag.elements, primaryElement]);

    const linkButtonElement = useMemo(() => {
        const possibleElements = bag.elements
            .filter((x) => x.typeName === Content_ElementType_Enum.LinkButton)
            .sort((x, y) =>
                maybeCompare(
                    (x.layoutData as LayoutDataBlob | undefined)?.priority,
                    (y.layoutData as LayoutDataBlob | undefined)?.priority,
                    (a, b) => a - b
                )
            );
        return possibleElements[0];
    }, [bag.elements]);

    const logoElement = useMemo(() => {
        const possibleElements = bag.elements
            .filter((x) => {
                if (
                    (x.typeName === Content_ElementType_Enum.ImageFile ||
                        x.typeName === Content_ElementType_Enum.ImageUrl) &&
                    x.layoutData
                ) {
                    const data = x.layoutData as LayoutDataBlob;
                    if (
                        (data.contentType === Content_ElementType_Enum.ImageFile ||
                            data.contentType === Content_ElementType_Enum.ImageUrl) &&
                        data.isLogo
                    ) {
                        return true;
                    }
                }
                return false;
            })
            .sort((x, y) =>
                maybeCompare(
                    (x.layoutData as LayoutDataBlob | undefined)?.priority,
                    (y.layoutData as LayoutDataBlob | undefined)?.priority,
                    (a, b) => a - b
                )
            );
        return possibleElements[0];
    }, [bag.elements]);
    const logoUrl = useMemo((): string | null => {
        try {
            if (!logoElement) {
                return null;
            }

            const dataBlob = logoElement.data;

            if (!isElementDataBlob(dataBlob)) {
                return null;
            }

            const elementDataBlob = dataBlob as ElementDataBlob;

            const latestVersion = R.last(elementDataBlob);

            if (!latestVersion) {
                return null;
            }

            if (
                latestVersion.data.type !== Content_ElementType_Enum.ImageUrl &&
                latestVersion.data.type !== Content_ElementType_Enum.ImageFile
            ) {
                return null;
            }

            if (latestVersion.data.type === Content_ElementType_Enum.ImageUrl) {
                return latestVersion.data.url;
            } else {
                const { bucket, key } = new AmazonS3URI(latestVersion.data.s3Url);
                return `https://s3.${import.meta.env.SNOWPACK_PUBLIC_AWS_REGION}.amazonaws.com/${bucket}/${key}`;
            }
        } catch {
            return null;
        }
    }, [logoElement]);

    const itemUrl = `${conferenceUrl}/item/${bag.id}`;

    return (
        <Flex
            flex={["1 0 100%", "1 0 100%", "1 0 47%"]}
            borderColour="gray.400"
            borderTop="1px solid"
            justifyContent="center"
            overflow="hidden"
            minW={350}
            maxW={800}
        >
            <Flex w="100%" flexDir="column" alignItems="center" p={[2, 2, 4]}>
                <Heading
                    as="h2"
                    fontSize="2xl"
                    textAlign={logoElement ? "center" : "left"}
                    pt={2}
                    mb={4}
                    w="100%"
                    whiteSpace="normal"
                >
                    {logoUrl ? (
                        <Image
                            src={logoUrl}
                            alt={bag.title}
                            maxWidth="20rem"
                            bgColor="white"
                            p={5}
                            borderRadius="md"
                            display="inline-block"
                        />
                    ) : (
                        bag.title
                    )}
                </Heading>
                <VStack spacing={4} w="100%">
                    {primaryElement && <Element element={primaryElement} />}
                    {secondaryElement && <Element element={secondaryElement} />}
                </VStack>
                <HStack mt={4} spacing={2} flexWrap="wrap" w="100%">
                    <LinkButton colorScheme="PrimaryActionButton" to={itemUrl} textDecoration="none">
                        <FAIcon iconStyle="s" icon="link" mr={2} />
                        <Text as="span" ml={1}>
                            Find out more
                        </Text>
                        <PageCountText path={itemUrl} fontSize="inherit" />
                    </LinkButton>
                    {linkButtonElement ? <Element element={linkButtonElement} /> : undefined}
                </HStack>
            </Flex>
        </Flex>
    );
}
