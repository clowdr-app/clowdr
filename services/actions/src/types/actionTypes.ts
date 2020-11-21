type Maybe<T> = T | null;

type SampleOutput = {
    accessToken: string;
};

type EchoOutput = {
    message: string;
};

type ProtectedEchoOutput = {
    message: string;
};

type SampleInput = {
    username: string;
    password: string;
};

type EchoInput = {
    message: string;
};

type Query = {
    echo?: Maybe<EchoOutput>;
    protectedEcho?: Maybe<ProtectedEchoOutput>;
};

type echoArgs = {
    message: string;
};

type protectedEchoArgs = {
    message: string;
};
