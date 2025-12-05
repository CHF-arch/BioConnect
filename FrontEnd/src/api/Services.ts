import type { Service } from "../types/ServicesTypes";
import { apiFetch } from "../utils/apiClient";

export const getServices = async (profile_id: string) => {
  const response = await apiFetch(
    `/services?profile_id=${encodeURIComponent(profile_id)}`,
    {
      method: "GET",
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch services");
  }
  const data = await response.json();
  return data;
};

export const createService = async (service: Service) => {
  const response = await apiFetch("/services", {
    method: "POST",
    body: JSON.stringify(service),
  });
  const data = await response.json();
  return data;
};

export const updateService = async (service: Service) => {
  const response = await apiFetch(`/services/${service.id}`, {
    method: "PUT",
    body: JSON.stringify(service),
  });
  const data = await response.json();
  return data;
};

export const deleteService = async (id: number) => {
  const response = await apiFetch(`/services/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete service");
  }
  const data = await response.json();
  return data;
};

export const getServiceById = async (id: number): Promise<Service> => {
  const response = await apiFetch(`/services/${id}`, {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch service");
  }
  return response.json();
};
