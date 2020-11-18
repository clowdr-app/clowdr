export default function echoHandler(args: echoArgs): EchoOutput {
    return {
        message: args.input.message,
    };
}
