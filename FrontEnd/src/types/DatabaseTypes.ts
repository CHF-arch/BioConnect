export interface Profile {
  id: string; // uuid, foreign key to auth.users
  created_at?: string;
  FirstName: string;
  LastName: string;
  avatar_url?: string;
}

export interface Service {
  id?: number; // int8
  profile_id: string; // uuid
  title: string;
  description?: string;
  sort_order?: number;
}

export interface SocialLink {
  id?: number; // int8
  profile_id: string; // uuid
  platform: string;
  url: string;
}

export interface Project {
  id?: number; // int8
  profile_id: string; // uuid
  title: string;
  description?: string;
  project_link?: string;
  sort_order?: number;
}
