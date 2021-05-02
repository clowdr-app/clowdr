describe("<App>", () => {
    it("passes minimum accessibility requirements", async () => {
        expect(await axe(document.body)).toHaveNoViolations();
    });
});
