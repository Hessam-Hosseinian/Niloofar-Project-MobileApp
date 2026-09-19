import { Sparkles } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import {
  getQuotes,
  getRandomQuote,
  type Quote,
} from "@/src/features/home/api/quotes";

export default function QuoteCard() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadQuotes() {
      try {
        const data = await getQuotes();

        if (active) {
          setQuote(getRandomQuote(data));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadQuotes();

    return () => {
      active = false;
    };
  }, []);

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

          <Text style={styles.quote}>{quote.q}</Text>

          <Text style={styles.author}>— {quote.a}</Text>
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

  author: {
    marginTop: 12,

    color: "#444444",

    fontSize: 14,
    fontWeight: "700",
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
