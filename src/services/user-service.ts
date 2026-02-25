import createTokenBasedAPIClient from "./token-base-api-client";

interface User {
  id: number;
  email: string;
  // ...
}

export const userService = createTokenBasedAPIClient<User>("/auth/users");

// await userService.get(1);
