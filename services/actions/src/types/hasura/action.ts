export interface ActionPayload<T> {
    action: {
        name: string;
    };
    input: T;
    session_variables: {
        [key: string]: string;
    };
}
