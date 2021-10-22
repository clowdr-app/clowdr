"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testJWKs = void 0;
try {
    if (process.env.TEST_JWKS) {
        var jwks = JSON.parse(process.env.TEST_JWKS);
        if (jwks.keys && jwks.keys instanceof Array) {
            exports.testJWKs = jwks.keys;
            console.log("Loaded test JWKs");
        }
    }
}
catch (e) {
    console.error("Error loading test JWKs", e);
    console.log("Test JWKs var", process.env.TEST_JWKS);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiandrcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9qd2tzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLElBQUk7SUFDQSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFO1FBQ3ZCLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMvQyxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksWUFBWSxLQUFLLEVBQUU7WUFDekMsZ0JBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQ3JCLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztTQUNuQztLQUNKO0NBQ0o7QUFBQyxPQUFPLENBQUMsRUFBRTtJQUNSLE9BQU8sQ0FBQyxLQUFLLENBQUMseUJBQXlCLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDNUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztDQUN2RCJ9