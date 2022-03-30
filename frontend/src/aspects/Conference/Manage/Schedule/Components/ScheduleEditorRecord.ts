import type {
    ManageSchedule_PresentationFragment,
    ManageSchedule_SessionFragment,
} from "../../../../../generated/graphql";

export type ScheduleEditorRecord =
    | ManageSchedule_SessionFragment
    | (ManageSchedule_PresentationFragment & {
          session: ManageSchedule_SessionFragment;
      });
