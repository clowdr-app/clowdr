export default function protectedEchoHandler(
    args: protectedEchoArgs
): ProtectedEchoOutput {
    return {
        message: args.message,
    };
}
