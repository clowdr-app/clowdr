import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { app, server } from "./server";

// Note: We have to use the --forceExit on Jest because the Express app refuses
// to close down in time for Jest to be okay with the situation.

beforeAll(() => {
    process.env.PORT = "3050";
});

function formGraphQLRequestData(argsData: any) {
    return {
        input: argsData,
    };
}

describe("server", () => {
    it("provides a correct echo function", (done) => {
        const requestData = {
            input: {
                message: uuidv4(),
            },
        };
        const expectedResponseData = {
            message: requestData.input.message,
        };
        request(app)
            .post("/echo")
            .send(formGraphQLRequestData(requestData))
            .set("Accept", "application/json")
            .expect(200, expectedResponseData, (_err, _res) => {
                server.close(done);
            });
    });
});
