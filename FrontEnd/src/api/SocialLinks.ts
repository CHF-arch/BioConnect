import { apiFetch } from "../utils/apiClient";
import type { SocialLinksTypes } from "../types/SocialLinksTypes";

export const getSocialLinks = async (profile_id: string) => {
  const response = await apiFetch(
    `/social-links?profile_id=${encodeURIComponent(profile_id)}`,
    {
      method: "GET",
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch social links");
  }
  return response.json();
};

export const createSocialLink = async (socialLink: SocialLinksTypes) => {
  const response = await apiFetch("/social-links", {
    method: "POST",
    body: JSON.stringify(socialLink),
  });
  if (!response.ok) {
    throw new Error("Failed to create social link");
  }
  return response.json();
};

export const updateSocialLink = async (socialLink: SocialLinksTypes) => {
  const response = await apiFetch(`/social-links/${socialLink.id}`, {
    method: "PUT",
    body: JSON.stringify(socialLink),
  });
  if (!response.ok) {
    throw new Error("Failed to update social link");
  }
  return response.json();
};

export const deleteSocialLink = async (id: number) => {
  const response = await apiFetch(`/social-links/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete social link");
  }
  return response.json();
};

export const getSocialLinkById = async (
  id: number
): Promise<SocialLinksTypes> => {
  const response = await apiFetch(`/social-links/${id}`, {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch social link");
  }
  return response.json();
};
