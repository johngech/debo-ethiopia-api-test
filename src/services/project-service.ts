import createAPIClient from "./public-api-client";

interface Project {
  id: number;
  title: string;
  description: string;
}

export const projectService = createAPIClient<Project>("/projects");
