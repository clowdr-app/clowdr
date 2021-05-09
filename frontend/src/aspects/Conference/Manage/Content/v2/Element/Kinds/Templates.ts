import { ElementBaseType } from "@clowdr-app/shared-types/build/content";
import { ComponentElementTemplate } from "./ComponentElement";
import { FileElementTemplate } from "./FileElement";
import { LinkElementTemplate } from "./LinkElement";
import { TextElementTemplate } from "./TextElement";
import type { ElementBaseTemplate } from "./Types";
import { URLElementTemplate } from "./URLElement";
import { VideoElementTemplate } from "./VideoElement";

export const ElementBaseTemplates: { [K in ElementBaseType]: ElementBaseTemplate } = {
    [ElementBaseType.File]: FileElementTemplate,
    [ElementBaseType.Component]: ComponentElementTemplate,
    [ElementBaseType.Link]: LinkElementTemplate,
    [ElementBaseType.Text]: TextElementTemplate,
    [ElementBaseType.URL]: URLElementTemplate,
    [ElementBaseType.Video]: VideoElementTemplate,
};
