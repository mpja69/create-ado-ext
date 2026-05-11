// src/ts/infrastructure/types.ts

export type Iteration = { name: string; path: string; startDate: string; finishDate: string };
export type BoardColumn = { name: string; mappedState: string };
export type ProjectTeam = { id: string; name: string };
export type TeamConfig = { defaultAreaPath: string; includeChildrenDefault: boolean };
