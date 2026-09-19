export type GameStatus = "available" | "coming-soon";
export type GameDifficulty = "easy" | "medium" | "hard";

export type Game = {
  key: string;
  title: string;
  description: string;
  emoji: string;
  status: GameStatus;
  difficulty: GameDifficulty;
  color: string;
  players: string;
};
