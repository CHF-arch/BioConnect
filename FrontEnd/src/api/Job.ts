import type { Job } from "../types/JobTypes";
import { apiFetch } from "../utils/apiClient";

export const getJobs = async (profile_id: string): Promise<Job[]> => {
  const response = await apiFetch(
    `/jobs?profile_id=${encodeURIComponent(profile_id)}`,
    {
      method: "GET",
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch jobs");
  }
  return response.json();
};

export const createJob = async (job: Job): Promise<Job> => {
  const response = await apiFetch("/jobs", {
    method: "POST",
    body: JSON.stringify(job),
  });
  if (!response.ok) {
    throw new Error("Failed to create job");
  }
  return response.json();
};

export const updateJob = async (job: Job): Promise<Job> => {
  const response = await apiFetch(`/jobs/${job.id}`, {
    method: "PUT",
    body: JSON.stringify(job),
  });
  if (!response.ok) {
    throw new Error("Failed to update job");
  }
  return response.json();
};

export const deleteJob = async (id: number): Promise<void> => {
  const response = await apiFetch(`/jobs/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete job");
  }
  return response.json();
};

export const getJobById = async (id: number): Promise<Job> => {
  const response = await apiFetch(`/jobs/${id}`, {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch job");
  }
  return response.json();
};
