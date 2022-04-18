import { onTask } from "../rabbitmq/tasks";
import { processTask } from "./tasks";

async function Main() {
    onTask(processTask, ["apply"]);
}

Main();
