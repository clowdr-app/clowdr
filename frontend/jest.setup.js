import "@testing-library/jest-dom";

const { configureAxe, toHaveNoViolations } = require("jest-axe");

const axe = configureAxe({
    rules: {},
});

expect.extend(toHaveNoViolations);

global.axe = axe;
