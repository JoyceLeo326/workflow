export type ProductionCharacter = {
  id: string;
  name: string;
  role: string;
  goal: string;
  arc: string;
  relationships: string;
  sourceRef: string;
};

export type ProductionLocation = {
  id: string;
  name: string;
  description: string;
  sourceRef: string;
};

export type StoryBible = {
  title: string;
  logline: string;
  genre: string;
  themes: string[];
  characters: ProductionCharacter[];
  locations: ProductionLocation[];
};

export type ProductionScene = {
  id: string;
  sceneNumber: number;
  heading: string;
  summary: string;
  action: string;
  characters: string[];
  dialogue: string;
  sourceRef: string;
  durationSeconds: number;
};

export type ProductionEpisode = {
  id: string;
  episodeNumber: number;
  title: string;
  logline: string;
  endingHook: string;
  scenes: ProductionScene[];
};

export type ProductionDocument = {
  schemaVersion: "1";
  version: number;
  updatedAt: string;
  storyBible: StoryBible;
  episodes: ProductionEpisode[];
};

export type ProductionVersion = {
  id: string;
  version: number;
  label: string;
  createdAt: string;
  document: ProductionDocument;
};

export type SessionProviderConfig = {
  baseUrl: string;
  model: string;
  apiKey: string;
  timeoutMs: number;
};
