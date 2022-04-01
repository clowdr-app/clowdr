import type {
    ManageSchedule_ElementFragment,
    ManageSchedule_PresentationFragment,
    ManageSchedule_SessionFragment,
} from "../../../../../generated/graphql";

export type ScheduleEditorRecordExtras = {
    elements: ManageSchedule_ElementFragment[];
    deletedElementIds: string[];
};

export type ScheduleEditorRecord = ScheduleEditorRecordExtras &
    (
        | ManageSchedule_SessionFragment
        | (ManageSchedule_PresentationFragment & {
              session: ManageSchedule_SessionFragment;
          })
    );
