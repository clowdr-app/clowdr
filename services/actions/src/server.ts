import { default as express, Request, Response } from "express";
import echoHandler from "./handlers/echo";
import bodyParser from "body-parser";

const app: express.Application = express();
const jsonParser = bodyParser.json();

app.get("/", function (_req, res) {
    res.send("Hello World!");
});

// Request Handler
app.post("/echo", jsonParser, async (req: Request, res: Response) => {
    const params: echoArgs = req.body.input;
    const result = echoHandler(params);

    /*
    // In case of errors:
    return res.status(400).json({
      message: "error happened"
    })
    */

    // success
    return res.json(result);
});

app.listen(process.env.PORT || 3000, function () {
    console.log(`App is listening on port ${process.env.PORT}!`);
});
