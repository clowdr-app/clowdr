export default function echoHandler({ message }: echoArgs): EchoOutput {
    return {
        message,
    };
}
