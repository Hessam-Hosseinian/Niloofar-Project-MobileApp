export type Game = {
  key: string;
  title: string;
  description: string;
  emoji: string;

  status: "available" | "coming-soon";

  difficulty?: "easy" | "medium" | "hard";
};
