
export interface Note {
  id: string;
  lat: number;
  lng: number;
  content: string;
  originalContent?: string;
  locationName: string;
  createdAt: number;
  isAnonymous: boolean;
  authorName?: string;
  color: string; // Hex code for marker color
  isAdmin?: boolean; // Exceptional feature: Admin notes standout
  imageUrl?: string; // Base64 string or URL of the attached photo
}

export interface User {
  isLoggedIn: boolean;
  name?: string;
  email?: string;
  isPremium?: boolean;
  isAdmin?: boolean;
}

export enum ViewState {
  MAP = 'MAP',
  LIST = 'LIST',
  LOGIN = 'LOGIN',
  CREATE = 'CREATE'
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PlaceSearchResult {
  placeId: string;
  name: string;
  description: string;
  lat?: number;
  lng?: number;
}

export interface Report {
  id: string;
  noteId: string;
  reason: string;
  createdAt: number;
  status: 'pending' | 'resolved' | 'dismissed';
}

export interface Feedback {
  id: string;
  content: string;
  createdAt: number;
  status: 'pending' | 'read';
}