export type OriginatingDataPart = {
    sourceId: string;
    originName: "Researchr" | "HotCRP" | string;
    data: any;
};

export type OriginatingDataDescriptor = {
    isNew?: boolean;

    id: string;
    sourceId: string;
    data: OriginatingDataPart[];
};

export type TagDescriptor = {
    isNew?: boolean;

    id: string;
    name: string;
    colour: string;
    originatingDataId?: string;
};
