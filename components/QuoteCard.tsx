import { Sparkles } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import {
  getQuotes,
  getRandomQuote,
  Quote,
} from "../src/features/services/quotes";

export default function QuoteCard() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    loadQuotes();
  }, []);

  async function loadQuotes() {
    try {
      setLoading(true);

      const data = await getQuotes();

      setQuotes(data);
      setQuote(getRandomQuote(data));
    } finally {
      setLoading(false);
    }
  }

  function handleAnotherQuote() {
    if (!quotes.length || changing) return;

    setChanging(true);

    setTimeout(() => {
      setQuote((current) => getRandomQuote(quotes, current ?? undefined));

      setChanging(false);
    }, 130);
  }

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#111111" />
          <Text style={styles.loadingText}>Finding some wisdom...</Text>
        </View>
      </View>
    );
  }

  if (!quote) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.shadow} />

      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={styles.iconBox}>
              <Sparkles size={18} color="#111111" strokeWidth={2.8} />
            </View>

            <Text style={styles.title}>Daily Spark</Text>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>✦</Text>
          </View>
        </View>

        <View style={styles.quoteContainer}>
          <Text style={styles.quoteMark}>“</Text>

          <Text style={[styles.quote, changing && styles.quoteChanging]}>
            {quote.q}
          </Text>

          <Text style={styles.author}>— {quote.a}</Text>
        </View>

        <View style={styles.footer}>
          {/* <Pressable
            onPress={handleAnotherQuote}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <RefreshCw size={16} color="#111111" strokeWidth={2.6} />

            <Text style={styles.buttonText}>Another one</Text>
          </Pressable> */}

          {/* <Pressable
            hitSlop={8}
            onPress={() => Linking.openURL("https://zenquotes.io/")}
          >
            <Text style={styles.credit}>ZenQuotes</Text>
          </Pressable> */}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    marginVertical: 12,
  },

  shadow: {
    position: "absolute",
    top: 6,
    left: 6,
    right: -6,
    bottom: -6,

    backgroundColor: "#111111",
    borderRadius: 22,
  },

  card: {
    backgroundColor: "#FFF3A7",

    borderWidth: 2.5,
    borderColor: "#111111",
    borderRadius: 22,

    padding: 18,

    minHeight: 210,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  iconBox: {
    width: 34,
    height: 34,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FFFFFF",

    borderWidth: 2,
    borderColor: "#111111",
    borderRadius: 10,
  },

  title: {
    color: "#111111",

    fontSize: 17,
    fontWeight: "900",
  },

  badge: {
    width: 34,
    height: 34,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FF8BD5",

    borderWidth: 2,
    borderColor: "#111111",
    borderRadius: 17,
  },

  badgeText: {
    fontSize: 18,
    fontWeight: "900",
  },

  quoteContainer: {
    flex: 1,

    marginTop: 20,
    marginBottom: 20,
  },

  quoteMark: {
    height: 24,

    color: "#111111",

    fontSize: 45,
    fontWeight: "900",
    lineHeight: 42,
  },

  quote: {
    marginTop: 3,

    color: "#111111",

    fontSize: 20,
    lineHeight: 28,
    fontWeight: "800",
    letterSpacing: -0.35,
  },

  quoteChanging: {
    opacity: 0.35,
  },

  author: {
    marginTop: 12,

    color: "#444444",

    fontSize: 14,
    fontWeight: "700",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    gap: 10,
  },

  button: {
    flexDirection: "row",
    alignItems: "center",

    gap: 7,

    backgroundColor: "#FFFFFF",

    paddingHorizontal: 13,
    paddingVertical: 9,

    borderWidth: 2,
    borderColor: "#111111",
    borderRadius: 11,
  },

  buttonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
  },

  buttonText: {
    color: "#111111",

    fontSize: 13,
    fontWeight: "900",
  },

  credit: {
    color: "#555555",

    fontSize: 10,
    fontWeight: "600",

    textDecorationLine: "underline",
  },

  loadingContainer: {
    flex: 1,

    minHeight: 150,

    alignItems: "center",
    justifyContent: "center",

    gap: 10,
  },

  loadingText: {
    color: "#444444",

    fontSize: 13,
    fontWeight: "700",
  },
});
