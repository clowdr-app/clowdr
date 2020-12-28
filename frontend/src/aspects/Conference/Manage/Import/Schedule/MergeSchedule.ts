export default function mergeSchedule(): void {
    // TODO
}

//     conferenceId: string,
//     importData: Record<string, IntermediaryData>,
//     originalContentGroups: Map<string, ContentGroupDescriptor>,
//     originalHallways: Map<string, HallwayDescriptor>,
//     originalOriginatingDatas: Map<string, OriginatingDataDescriptor>,
//     originalPeople: Map<string, ContentPersonDescriptor>,
//     originalTags: Map<string, TagDescriptor>
// ): {
//     changes: ChangeSummary[];
//     newContentGroups: Map<string, ContentGroupDescriptor>;
//     newPeople: Map<string, ContentPersonDescriptor>;
//     newTags: Map<string, TagDescriptor>;
//     newOriginatingDatas: Map<string, OriginatingDataDescriptor>;
//     newHallways: Map<string, HallwayDescriptor>;
// } {
//     const changes: ChangeSummary[] = [];

//     const result = mergeData(
//         conferenceId,
//         importData,
//         Array.from(originalContentGroups.values()),
//         Array.from(originalHallways.values()),
//         Array.from(originalOriginatingDatas.values()),
//         Array.from(originalPeople.values()),
//         Array.from(originalTags.values())
//     );
//     changes.push(...result.changes);

//     const newContentGroups = new Map(result.newContentGroups.map((x) => [x.id, x]));
//     const newPeople = new Map(result.newPeople.map((x) => [x.id, x]));
//     const newTags = new Map(result.newTags.map((x) => [x.id, x]));
//     const newOriginatingDatas = new Map(result.newOriginatingDatas.map((x) => [x.id, x]));
//     const newHallways = new Map(result.newHallways.map((x) => [x.id, x]));

//     return {
//         changes,
//         newContentGroups,
//         newPeople,
//         newTags,
//         newOriginatingDatas,
//         newHallways,
//     };
// }
