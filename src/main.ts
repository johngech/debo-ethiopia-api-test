import { CanceledError, AxiosError } from "axios";
import { projectService } from "./services/project-service";
import { authService } from "./services/token-base-api-client";

const fetchResponse = async () => {
  try {
    const response = await projectService.getAll();
    const projects = response.results;
    console.log(projects);
  } catch (error) {
    if (error instanceof CanceledError) return;
    if (error instanceof AxiosError) console.log(error.message);
  }
};

// await fetchResponse();

authService
  .login({
    email: "",
    password: "",
  })
  .then((response) => {
    console.log(response);
  })
  .catch((error) => {
    console.log(error);
  });
