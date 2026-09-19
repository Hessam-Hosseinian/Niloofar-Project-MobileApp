import type { Game } from "../types";

export const games: Game[] = [
  {
    key: "tic-tac-toe",
    title: "Tic Tac Toe",
    description: "Classic X and O battle.",
    emoji: "❌",
    status: "available",
    difficulty: "easy",
  },
  {
    key: "memory",
    title: "Memory Match",
    description: "Match all the hidden cards.",
    emoji: "🧠",
    status: "coming-soon",
    difficulty: "medium",
  },
  {
    key: "snake",
    title: "Snake",
    description: "Eat, grow, survive.",
    emoji: "🐍",
    status: "coming-soon",
    difficulty: "medium",
  },
];
