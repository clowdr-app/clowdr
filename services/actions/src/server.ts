import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import handlerEcho from "./handlers/echo";

export const app: express.Application = express();
const jsonParser = bodyParser.json();

app.get("/", function (_req, res) {
    res.send("Hello World!");
});

// Request Handler
app.post("/echo", jsonParser, async (req: Request, res: Response) => {
    const params: echoArgs = req.body.input;
    console.log(`Echoing "${params.input.message}"`);
    const result = handlerEcho(params);

    /*
    // In case of errors:
    return res.status(400).json({
      message: "error happened"
    })
    */

    // success
    return res.json(result);
});

const portNumber = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
export const server = app.listen(portNumber, function () {
    console.log(`App is listening on port ${process.env.PORT}!`);
});
