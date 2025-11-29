export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant'
}

export enum ResponseType {
  TEXT = 'text',
  RECOMMENDATIONS = 'recommendations',
  NEWS = 'news',
  DETAILS = 'details'
}

export interface Movie {
  title: string;
  year: string;
  genres: string[];
  director: string;
  posterUrl: string; // URL found via Google Search or generated
  description?: string;
  cast?: string[];
  rating?: string;
  trailerUrl?: string; // Link to a trailer
  streaming?: string[]; // List of streaming platforms
  relatedMovies?: Movie[]; // Recommendations based on this movie
}

export interface NewsItem {
  headline: string;
  summary: string;
  date: string;
  url: string; // Source URL
}

export interface StructuredResponse {
  type: ResponseType;
  message: string;
  data?: Movie[] | NewsItem[] | Movie; // Dynamic based on type
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: StructuredResponse;
}