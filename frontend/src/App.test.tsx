import * as React from "react";
import Echo from "./components/echo/echo";

jest.mock("./components/echo/echo", () => {
    return jest.fn(() => <></>);
});

beforeEach(() => {
    // @ts-ignore
    Echo.mockClear();
});

describe("<App>", () => {
    it("passes minimum accessibility requirements", async () => {
        expect(await axe(document.body)).toHaveNoViolations();
    });
});
