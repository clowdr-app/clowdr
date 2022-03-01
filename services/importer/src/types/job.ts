import type { ValidatedData } from "@midspace/shared-types/import/program";
import type { ProgramImportOptions } from "@midspace/shared-types/import/programImportOptions";

export type ParsedData = {
    fileName: string;
    data: ValidatedData;
};

export interface ImportError {
    message: string;
}

export type ImportErrors = ImportError[];

export type ImportOutput = {
    name: string;
    value: string | null;
};
export type ImportOutputs = ImportOutput[];

export type ImportJob = {
    id: string;
    created_at: string;
    updated_at: string;
    status: string;
    data: ParsedData[];
    options: ProgramImportOptions;
    createdBy?: string | null;
    completed_at?: string | null;
    conferenceId: string;
    subconferenceId?: string | null;
    errors?: ImportErrors | null;
    progress: number;
    progressMaximum: number;
};
