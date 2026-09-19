import { colors } from "@/src/theme";
import type { Game } from "../types";

export const games: Game[] = [
  {
    key: "tic-tac-toe",
    title: "Tic Tac Toe",
    description: "Classic X and O. Three in a row wins.",
    emoji: "❌",
    status: "available",
    difficulty: "easy",
    color: colors.yellow,
    players: "2 players",
  },
  {
    key: "memory",
    title: "Memory Match",
    description: "Flip cards, remember positions, match every pair.",
    emoji: "🧠",
    status: "coming-soon",
    difficulty: "medium",
    color: colors.purple,
    players: "1 player",
  },
  {
    key: "snake",
    title: "Snake",
    description: "Eat, grow and survive for as long as you can.",
    emoji: "🐍",
    status: "coming-soon",
    difficulty: "medium",
    color: colors.green,
    players: "1 player",
  },
];

export function getGameByKey(key: string) {
  return games.find((game) => game.key === key);
}
