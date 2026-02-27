// src/types/index.ts

export type GroupKey =
  | "FULLDFIESTA"
  | "FULLDMOTOR"
  | string;

export type CategoryKey = string;

export enum UserRole {
  EXPLORER = "EXPLORER",
  PARTICIPANT = "PARTICIPANT",
  ORGANIZER = "ORGANIZER",
  ADMIN = "ADMIN",
}

export enum StatusModeration {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  ARCHIVED = "archived",
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

// Event type aligned with EventsContext usage
export interface EventGeneral {
  id: string; // uuid
  name: string;

  slug?: string;

  group_key: GroupKey;

  // Use uuid for category
  category: CategoryKey;

  // coords
  lat: number;
  lng: number;

  city: string;
  province: string;
  community: string;

  venue?: string;

  short_description: string;

  status_moderation: StatusModeration;

  created_by: string;
  created_at: string;

  image_url?: string;

  event_type?: "FIJO" | "ITINERANTE" | string;
}

export interface Edition {
  id: string;
  event_id: string;

  date_mode: "date" | "text" | "tbd";
  date_start?: string;
  date_end?: string;
  date_text: string;

  // ✅ Standardized field
  poster_url?: string;

  title?: string;
  description?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GroupConfig {
  key: GroupKey;
  label: string;
  categories: string[];
}

// ✅ Suggestion System
export type SuggestionType = "event" | "edition";
export type SuggestionStatus = "pending" | "approved" | "rejected";

export interface SuggestionPayload {
  // Common for both types
  title: string;
  description?: string;
  date_mode: "date" | "text" | "tbd";
  date_start?: string;
  date_end?: string;
  date_text?: string;
  notes?: string;
  link?: string;

  // Specific for 'event'
  name?: string;
  group_key?: GroupKey;
  category?: CategoryKey;
  lat?: number;
  lng?: number;
  city?: string;
  province?: string;
  community?: string;

  // Specific for 'edition'
  event_id?: string;
}

export interface SuggestionRow {
  id: string;
  suggestion_type: SuggestionType;
  status: SuggestionStatus;
  event_id?: string; // Optional for new events
  payload: SuggestionPayload;
  poster_url?: string;
  created_by?: string;
  created_at?: string;

  // Legacy fields (for backward compatibility)
  kind?: string;
  municipio?: string;
  provincia?: string;
  comunidad?: string;
  suggested_name?: string;
  lat?: number;
  lng?: number;
}
