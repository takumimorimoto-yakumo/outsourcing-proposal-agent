import type { UserProfile } from "@/types/profile";
import { API_BASE_URL } from "./base";

export async function getProfile(): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/profile`);

  if (!response.ok) {
    throw new Error("Failed to get profile");
  }

  return response.json();
}

export async function saveProfile(
  profile: UserProfile
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to save profile");
  }

  return response.json();
}

export interface ProfileSuggestions {
  skills: string[];
  specialties: string[];
  preferred_categories: string[];
  skills_detail: string;
  preferred_categories_detail: string;
}

export async function autoCompleteProfile(): Promise<{
  success: boolean;
  suggestions: ProfileSuggestions;
  message: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/profile/auto-complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to auto-complete profile");
  }

  return response.json();
}
