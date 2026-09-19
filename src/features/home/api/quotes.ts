import AsyncStorage from "@react-native-async-storage/async-storage";

export type Quote = {
  q: string;
  a: string;
  h?: string;
};

const API_URL = "https://zenquotes.io/api/quotes";

const CACHE_KEY = "@niloo_quotes";
const CACHE_TIME_KEY = "@niloo_quotes_time";

const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

const FALLBACK_QUOTES: Quote[] = [
  {
    q: "The secret of getting ahead is getting started.",
    a: "Mark Twain",
  },
  {
    q: "It always seems impossible until it's done.",
    a: "Nelson Mandela",
  },
  {
    q: "Success is the sum of small efforts, repeated day in and day out.",
    a: "Robert Collier",
  },
  {
    q: "The future depends on what you do today.",
    a: "Mahatma Gandhi",
  },
];

function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export async function getQuotes(): Promise<Quote[]> {
  try {
    const cachedQuotes = await AsyncStorage.getItem(CACHE_KEY);
    const cachedTime = await AsyncStorage.getItem(CACHE_TIME_KEY);

    if (cachedQuotes && cachedTime) {
      const age = Date.now() - Number(cachedTime);

      if (age < CACHE_DURATION) {
        return JSON.parse(cachedQuotes);
      }
    }

    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`ZenQuotes error: ${response.status}`);
    }

    const data: Quote[] = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Invalid quote response");
    }

    await Promise.all([
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)),
      AsyncStorage.setItem(CACHE_TIME_KEY, Date.now().toString()),
    ]);

    return data;
  } catch (error) {
    console.warn("Could not fetch quotes:", error);

    const cachedQuotes = await AsyncStorage.getItem(CACHE_KEY);

    if (cachedQuotes) {
      return JSON.parse(cachedQuotes);
    }

    return FALLBACK_QUOTES;
  }
}

export function getRandomQuote(quotes: Quote[], currentQuote?: Quote): Quote {
  if (quotes.length === 0) {
    return FALLBACK_QUOTES[0];
  }

  if (quotes.length === 1) {
    return quotes[0];
  }

  let nextQuote = getRandomItem(quotes);

  while (currentQuote && nextQuote.q === currentQuote.q && quotes.length > 1) {
    nextQuote = getRandomItem(quotes);
  }

  return nextQuote;
}
