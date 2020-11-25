import * as React from "react";
import Echo from "./aspects/Echo/Echo";

jest.mock("./aspects/Echo/Echo", () => {
    return jest.fn(() => <></>);
});

beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Echo.mockClear();
});

describe("<App>", () => {
    it("passes minimum accessibility requirements", async () => {
        expect(await axe(document.body)).toHaveNoViolations();
    });
});
