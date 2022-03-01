export type MediaPackageEvent = MediaPackageEventHarvestJobCompleted | MediaPackageEventHarvestJobFailed;

interface MediaPackageEventHarvestJobCompleted extends MediaPackageEventBase {
    "detail-type": "MediaPackage HarvestJob Notification";
    detail: MediaPackageEventHarvestJobCompletedDetail;
}

interface HarvestJobDetail<TStatus extends string> {
    id: string;
    arn: string;
    status: TStatus;
    origin_endpoint_id: string;
    start_time: string;
    end_time: string;
    s3_destination: {
        bucket_name: string;
        manifest_key: string;
        role_arn: string;
    };
    created_at: string;
}

interface MediaPackageEventHarvestJobCompletedDetail {
    harvest_job: HarvestJobDetail<"SUCCEEDED">;
}

interface MediaPackageEventHarvestJobFailed extends MediaPackageEventBase {
    "detail-type": "MediaPackage HarvestJob Notification";
    detail: MediaPackageEventHarvestJobFailedDetail;
}

interface MediaPackageEventHarvestJobFailedDetail {
    harvest_job: HarvestJobDetail<"FAILED">;
    message: string;
}

export interface MediaPackageEventBase {
    version: string;
    id: string;
    "detail-type": string;
    source: "aws.mediapackage";
    account: string;
    time: string;
    region: string;
    resources: string[];
    detail: any;
}
