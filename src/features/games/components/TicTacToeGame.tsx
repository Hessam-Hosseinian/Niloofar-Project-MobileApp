import { RotateCcw } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, typography } from "@/src/theme";

type Player = "X" | "O";
type Cell = Player | null;

const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

function getWinner(board: Cell[]): Player | null {
  for (const [a, b, c] of winningLines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

export function TicTacToeGame() {
  const [board, setBoard] = useState<Cell[]>(() => Array<Cell>(9).fill(null));
  const [turn, setTurn] = useState<Player>("X");

  const winner = useMemo(() => getWinner(board), [board]);
  const draw = !winner && board.every(Boolean);
  const finished = Boolean(winner || draw);

  function play(index: number) {
    if (board[index] || finished) return;

    setBoard((current) => {
      const next = [...current];
      next[index] = turn;
      return next;
    });
    setTurn((current) => (current === "X" ? "O" : "X"));
  }

  function reset() {
    setBoard(Array<Cell>(9).fill(null));
    setTurn("X");
  }

  const message = winner
    ? `${winner} WINS!`
    : draw
      ? "IT'S A DRAW"
      : `${turn}'S TURN`;

  return (
    <View style={styles.container}>
      <View style={styles.statusCard}>
        <Text style={styles.eyebrow}>LOCAL • 2 PLAYERS</Text>
        <Text style={styles.status}>{message}</Text>
        <Text style={styles.helper}>
          {finished ? "Run it back?" : "Get three marks in a row."}
        </Text>
      </View>

      <View style={styles.board}>
        {board.map((cell, index) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Cell ${index + 1}${cell ? `, ${cell}` : ""}`}
            disabled={Boolean(cell) || finished}
            key={index}
            onPress={() => play(index)}
            style={({ pressed }) => [
              styles.cell,
              cell === "X" && styles.xCell,
              cell === "O" && styles.oCell,
              pressed && styles.cellPressed,
            ]}
          >
            <Text style={styles.mark}>{cell ?? ""}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={reset} style={({ pressed }) => [styles.resetButton, pressed && styles.buttonPressed]}>
        <RotateCcw size={19} strokeWidth={3} color={colors.foreground} />
        <Text style={styles.resetText}>NEW ROUND</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  statusCard: {
    padding: 18,
    borderWidth: 3,
    borderColor: colors.foreground,
    borderRadius: 18,
    backgroundColor: colors.yellow,
    shadowColor: colors.foreground,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  eyebrow: {
    ...typography.label,
    fontFamily: "SpaceGrotesk_500Medium",
    color: colors.foreground,
  },
  status: {
    ...typography.h1,
    marginTop: 5,
    fontFamily: "SpaceGrotesk_500Medium",
    color: colors.foreground,
  },
  helper: {
    ...typography.muted,
    marginTop: 2,
    color: colors.foreground,
  },
  board: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  cell: {
    width: "31.2%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.foreground,
    borderRadius: 16,
    backgroundColor: colors.white,
    shadowColor: colors.foreground,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  xCell: {
    backgroundColor: colors.pink,
  },
  oCell: {
    backgroundColor: colors.blue,
  },
  cellPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    shadowOffset: { width: 1, height: 1 },
  },
  mark: {
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 44,
    lineHeight: 52,
    color: colors.foreground,
  },
  resetButton: {
    minHeight: 52,
    paddingHorizontal: 18,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 3,
    borderColor: colors.foreground,
    borderRadius: 14,
    backgroundColor: colors.white,
    shadowColor: colors.foreground,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  buttonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    shadowOffset: { width: 1, height: 1 },
  },
  resetText: {
    ...typography.button,
    fontFamily: "SpaceGrotesk_500Medium",
    color: colors.foreground,
  },
});
