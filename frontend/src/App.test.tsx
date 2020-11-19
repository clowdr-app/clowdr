import { render } from "@testing-library/react";
import * as React from "react";
import App from "./App";
import Echo from "./components/echo/echo";

jest.mock("./components/echo/echo", () => {
    return jest.fn(() => <></>);
});

beforeEach(() => {
    // @ts-ignore
    Echo.mockClear();
});

describe("<App>", () => {
    it("renders learn react link", () => {
        const { getByText } = render(<App />);
        const linkElement = getByText(/learn react/i);
        expect(document.body.contains(linkElement));
    });

    it("renders the echo component", () => {
        render(<App />);
        expect(Echo).toHaveBeenCalledTimes(1);
    });

    it("passes minimum accessibility requirements", async () => {
        expect(await axe(document.body)).toHaveNoViolations();
    });
});
