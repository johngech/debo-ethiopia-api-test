import { CanceledError, AxiosError } from "axios";
import {  projectService } from "./services/project-service";

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

await fetchResponse();
