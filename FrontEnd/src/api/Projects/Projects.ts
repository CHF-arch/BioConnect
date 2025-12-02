import { API_URL } from "../../config/api";
import type { Project } from "../../types/ProjectsTypes";

export const getProjects = async (profile_id: string) => {
  console.log("profile_id", profile_id);
  const response = await fetch(`${API_URL}/api/projects/${profile_id}`, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }
  const data = await response.json();
  return data.projects;
};

export const createProject = async (project: Project) => {
  const response = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      credentials: "include",
    },
    body: JSON.stringify(project),
  });
  if (!response.ok) {
    throw new Error("Failed to create project");
  }
  const data = await response.json();
  return data.project;
};

export const updateProject = async (project: Project) => {
  const response = await fetch(`${API_URL}/projects/${project.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      credentials: "include",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to update project");
  }
  const data = await response.json();
  return data.project;
};

export const deleteProject = async (project: Project) => {
  const response = await fetch(`${API_URL}/projects/${project.id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      credentials: "include",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to delete project");
  }
  const data = await response.json();
  return data.project;
};
