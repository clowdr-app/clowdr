import { Button, Heading, Input, InputGroup, InputLeftElement, VStack } from "@chakra-ui/react";
import React, { MutableRefObject, useMemo, useState } from "react";
import FAIcon from "../Icons/FAIcon";

type Item = {
    id: string;
};

interface ColumnProps<I extends Item> {
    items: Array<I>;

    renderItem: (i: I) => JSX.Element;
    filterItem: (search: string, i: I) => boolean;
    compareItems: (x: I, y: I) => number;

    title: string;
    onCreate?: (value: string) => Promise<void>;

    searchInputRef?: MutableRefObject<any>;
}

export default function Column<I extends Item>({
    items,
    renderItem,
    filterItem,
    compareItems,
    title,
    onCreate,
    searchInputRef,
}: ColumnProps<I>): JSX.Element {
    const [search, setSearch] = useState<string>();

    const tSearch = search?.trim();

    const filteredItems = useMemo(() => {
        let result = Array.from(items);
        if (tSearch && tSearch.length > 0) {
            const filterF = filterItem.bind(undefined, tSearch);
            result = result.filter(filterF);
        }
        return result.sort(compareItems);
    }, [compareItems, filterItem, items, tSearch]);

    const enableAdd = onCreate && tSearch && tSearch.length > 0 && filteredItems.length === 0;

    const handleCreate = (ev: React.FormEvent<any> | React.MouseEvent<any>) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (onCreate && tSearch && tSearch.length > 0) {
            onCreate(tSearch);
        }
    };
    const inputGroup = (
        <InputGroup>
            <InputLeftElement>
                {enableAdd ? (
                    <Button
                        aria-label="Create new"
                        borderTopRightRadius={0}
                        borderBottomRightRadius={0}
                        colorScheme="green"
                        onClick={handleCreate}
                    >
                        <FAIcon icon="plus" iconStyle="s" />
                    </Button>
                ) : (
                    <FAIcon icon="search" iconStyle="s" />
                )}
            </InputLeftElement>
            <Input
                ref={searchInputRef}
                type="text"
                borderLeftRadius="0"
                placeholder={onCreate ? "Search or create..." : "Search..."}
                value={search}
                onChange={(ev) => {
                    setSearch(ev.target.value);
                }}
                onKeyDown={
                    enableAdd
                        ? (ev) => {
                              if (ev.key === "Enter") {
                                  handleCreate(ev);
                              }
                          }
                        : undefined
                }
                paddingLeft="3rem"
            />
        </InputGroup>
    );

    return (
        <VStack height="100%" align="left" justify="start">
            <Heading as="h3" fontSize="170%">
                {title}
            </Heading>
            {inputGroup}
            {filteredItems.map((item) => renderItem(item))}
        </VStack>
    );
}
