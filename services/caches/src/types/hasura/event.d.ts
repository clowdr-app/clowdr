export interface Payload<T = any> {
    event:
        | {
              session_variables?: { [x: string]: string } | null;
              op: "INSERT";
              data: {
                  new: T;
              };
          }
        | {
              session_variables?: { [x: string]: string } | null;
              op: "UPDATE";
              data: {
                  old: T;
                  new: T;
              };
          }
        | {
              session_variables?: { [x: string]: string } | null;
              op: "DELETE";
              data: {
                  old: T;
              };
          }
        | {
              session_variables?: { [x: string]: string } | null;
              op: "MANUAL";
              data: {
                  old: T | null;
                  new: T | null;
              };
          };
    created_at: string;
    id: string;
    delivery_info: {
        max_retries: number;
        current_retry: number;
    };
    trigger: {
        name: string;
    };
    table: {
        schema: string;
        name: string;
    };
}
