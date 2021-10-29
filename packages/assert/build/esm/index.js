export const assert = {
    truthy: (input, message) => {
        if (!input) {
            throw new Error(message ?? "Expected truthy input.");
        }
    },
    string: (input, message) => {
        if (typeof input !== "string") {
            throw new Error(message ?? "Expected string input.");
        }
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFLQSxNQUFNLENBQUMsTUFBTSxNQUFNLEdBQVc7SUFDMUIsTUFBTSxFQUFFLENBQUMsS0FBYyxFQUFFLE9BQWdCLEVBQUUsRUFBRTtRQUN6QyxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ1IsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLElBQUksd0JBQXdCLENBQUMsQ0FBQztTQUN4RDtJQUNMLENBQUM7SUFDRCxNQUFNLEVBQUUsQ0FBQyxLQUFjLEVBQUUsT0FBZ0IsRUFBRSxFQUFFO1FBQ3pDLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1lBQzNCLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxJQUFJLHdCQUF3QixDQUFDLENBQUM7U0FDeEQ7SUFDTCxDQUFDO0NBQ0osQ0FBQyJ9