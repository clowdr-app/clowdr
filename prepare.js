const isCi = process.env.CI !== undefined || process.env.NODE_ENV === "production";
if (!isCi) {
    require("husky").install();
}
