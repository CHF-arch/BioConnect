import { API_URL } from "../../config/api";
import type { Profile } from "../../types/Profile";

export const getProfile = async () => {
  const response = await fetch(`${API_URL}/api/profile/me`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to get profile");
  }

  return response.json();
};

export const createProfile = async (profileData: {
  FirstName: string;
  LastName: string;
  phone?: string;
  avatar_url?: string;
}) => {
  const response = await fetch(`${API_URL}/api/profile`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to create profile");
  }

  return response.json();
};

export const DeleteProfile = async (id: string) => {
  console.log("Deleting profile with ID:", id);
  const response = await fetch(`${API_URL}/api/profile/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to delete profile");
  }

  return response.json();
};

export const uploadAvatar = async (userId: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/profile/${userId}/avatar`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to upload avatar");
  }

  return response.json();
};

export const updateProfile = async (id: string, updates: Partial<Profile>) => {
  const response = await fetch(`${API_URL}/api/profile/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to update profile");
  }

  return response.json();
};
