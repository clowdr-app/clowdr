import { onTask } from "../rabbitmq/tasks";
import { processTask } from "./tasks";

async function Main() {
    onTask(processTask, [
        "initialize",
        "assign_rooms",
        "queue_sessions",
        "queue_exhibitions",
        "compile_session",
        "compile_exhibition",
    ]);
}

Main();
