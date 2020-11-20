type Maybe<T> = T | null;

type EchoOutput = {
    message: string;
};

type ProtectedEchoOutput = {
    message: string;
};

type EchoInput = {
    message: string;
};

type Query = {
    echo?: Maybe<EchoOutput>;
};

type echoArgs = {
    message: string;
};
