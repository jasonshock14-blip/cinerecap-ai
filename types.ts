
export interface MovieInfo {
  title: string;
  genre: string;
  director: string;
  keyPlotPoints: string;
  tone: string;
  includeSpoilers: boolean;
  length: 'short' | 'medium' | 'detailed';
}

export interface GeneratedRecap {
  tagline: string;
  summary: string;
  characterAnalysis: string;
  keyTakeaways: string[];
  verdict: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface User {
  username: string;
  deviceId: string;
}
