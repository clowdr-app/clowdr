import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { app } from "./server";

// Note: We have to use the --forceExit on Jest because the Express app refuses
// to close down in time for Jest to be okay with the situation.

function formGraphQLRequestData(argsData: any) {
    return {
        input: argsData,
    };
}

describe("server", () => {
    it("provides a correct echo function", (done) => {
        const requestData = {
            message: uuidv4(),
        };
        const expectedResponseData = {
            message: requestData.message,
        };
        request(app)
            .post("/echo")
            .send(formGraphQLRequestData(requestData))
            .set("Accept", "application/json")
            .expect(200, (_err, res) => {
                expect(res.body).toEqual(expectedResponseData);

                done();
            });
    });
});
