import {
  BookOpen,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  Car,
  CloudSun,
  Code2,
  FileText,
  Folder,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  ListTodo,
  LockKeyhole,
  MapPin,
  Music,
  Navigation,
  Network,
  NotebookText,
  Plane,
  ScanLine,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Sun,
  ToolCase,
  Users,
  Utensils,
  Wallet,
  WalletCards,
  Zap,
} from "lucide-react-native";

import { colors } from "@/src/theme";

export type ServiceCategory =
  | "core"
  | "productivity"
  | "life"
  | "utility"
  | "system";

export type ServiceItem = {
  key: string;

  title: string;
  subtitle: string;

  category: ServiceCategory;

  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;

  color: string;

  phase: number;

  enabled: boolean;

  featured?: boolean;
  quickAction?: boolean;
};

export const services: ServiceItem[] = [
  // ─────────────────────────
  // Core
  // ─────────────────────────

  {
    key: "today",
    title: "Today",
    subtitle: "Your day at a glance",
    category: "core",
    icon: Sun,
    color: colors.yellow,
    phase: 1,
    enabled: true,
    featured: true,
    quickAction: true,
  },

  {
    key: "tasks",
    title: "Tasks",
    subtitle: "Plan and manage your tasks",
    category: "core",
    icon: ListTodo,
    color: colors.pink,
    phase: 1,
    enabled: true,
    featured: true,
    quickAction: true,
  },

  {
    key: "calendar",
    title: "Calendar",
    subtitle: "Events, schedules and reminders",
    category: "core",
    icon: CalendarDays,
    color: colors.green,
    phase: 1,
    enabled: true,
    featured: true,
    quickAction: true,
  },

  {
    key: "search",
    title: "Search",
    subtitle: "Search across the entire app",
    category: "core",
    icon: Search,
    color: colors.blue,
    phase: 1,
    enabled: true,
  },

  {
    key: "assistant",
    title: "Assistant",
    subtitle: "Your personal intelligent assistant",
    category: "core",
    icon: Sparkles,
    color: colors.purple,
    phase: 1,
    enabled: true,
  },

  // ─────────────────────────
  // Productivity
  // ─────────────────────────

  {
    key: "university",
    title: "University",
    subtitle: "Courses, classes and university life",
    category: "productivity",
    icon: GraduationCap,
    color: colors.purple,
    phase: 2,
    enabled: true,
  },

  {
    key: "study",
    title: "Study",
    subtitle: "Study sessions and learning tools",
    category: "productivity",
    icon: BookOpen,
    color: colors.green,
    phase: 2,
    enabled: true,
  },

  {
    key: "notes",
    title: "Notes",
    subtitle: "Quick notes and ideas",
    category: "productivity",
    icon: NotebookText,
    color: colors.yellow,
    phase: 2,
    enabled: true,
  },

  {
    key: "files",
    title: "Files",
    subtitle: "Organize your local files",
    category: "productivity",
    icon: Folder,
    color: colors.blue,
    phase: 2,
    enabled: true,
  },

  {
    key: "documents",
    title: "Documents",
    subtitle: "Manage important documents",
    category: "productivity",
    icon: FileText,
    color: colors.orange,
    phase: 2,
    enabled: true,
  },

  {
    key: "work",
    title: "Work",
    subtitle: "Workspaces and professional tasks",
    category: "productivity",
    icon: BriefcaseBusiness,
    color: colors.pink,
    phase: 2,
    enabled: true,
  },

  // ─────────────────────────
  // Life
  // ─────────────────────────

  {
    key: "money",
    title: "Money",
    subtitle: "Track personal finances",
    category: "life",
    icon: WalletCards,
    color: colors.green,
    phase: 3,
    enabled: true,
  },

  {
    key: "wallet",
    title: "Wallet",
    subtitle: "Cards, balances and wallet items",
    category: "life",
    icon: Wallet,
    color: colors.yellow,
    phase: 3,
    enabled: true,
  },

  {
    key: "shopping",
    title: "Shopping",
    subtitle: "Shopping lists and purchases",
    category: "life",
    icon: ShoppingBag,
    color: colors.pink,
    phase: 3,
    enabled: true,
  },

  {
    key: "home",
    title: "Home",
    subtitle: "Manage home-related information",
    category: "life",
    icon: House,
    color: colors.blue,
    phase: 3,
    enabled: true,
  },

  {
    key: "food",
    title: "Food",
    subtitle: "Meals, recipes and food planning",
    category: "life",
    icon: Utensils,
    color: colors.orange,
    phase: 3,
    enabled: true,
  },

  {
    key: "health",
    title: "Health",
    subtitle: "Health and wellness information",
    category: "life",
    icon: HeartPulse,
    color: colors.green,
    phase: 3,
    enabled: true,
  },

  {
    key: "people",
    title: "People",
    subtitle: "People and personal relationships",
    category: "life",
    icon: Users,
    color: colors.purple,
    phase: 3,
    enabled: true,
  },

  {
    key: "vehicle",
    title: "Vehicle",
    subtitle: "Vehicle information and maintenance",
    category: "life",
    icon: Car,
    color: colors.blue,
    phase: 3,
    enabled: true,
  },

  {
    key: "places",
    title: "Places",
    subtitle: "Saved and useful places",
    category: "life",
    icon: MapPin,
    color: colors.pink,
    phase: 3,
    enabled: true,
  },

  {
    key: "travel",
    title: "Travel",
    subtitle: "Trips, plans and travel information",
    category: "life",
    icon: Plane,
    color: colors.purple,
    phase: 3,
    enabled: true,
  },

  {
    key: "weather",
    title: "Weather",
    subtitle: "Weather and forecasts",
    category: "life",
    icon: CloudSun,
    color: colors.blue,
    phase: 3,
    enabled: true,
  },

  {
    key: "tracking",
    title: "Tracking",
    subtitle: "Track things that matter to you",
    category: "life",
    icon: Navigation,
    color: colors.green,
    phase: 3,
    enabled: true,
  },

  // ─────────────────────────
  // Utilities
  // ─────────────────────────

  {
    key: "vault",
    title: "Vault",
    subtitle: "Secure local information",
    category: "utility",
    icon: LockKeyhole,
    color: colors.purple,
    phase: 4,
    enabled: true,
  },

  {
    key: "tools",
    title: "Tools",
    subtitle: "Useful everyday tools",
    category: "utility",
    icon: ToolCase,
    color: colors.orange,
    phase: 4,
    enabled: true,
  },

  {
    key: "utility",
    title: "Utility",
    subtitle: "Quick utility functions",
    category: "utility",
    icon: Zap,
    color: colors.yellow,
    phase: 4,
    enabled: true,
  },

  {
    key: "media",
    title: "Media",
    subtitle: "Media and entertainment tools",
    category: "utility",
    icon: Music,
    color: colors.pink,
    phase: 4,
    enabled: true,
  },

  {
    key: "capture",
    title: "Capture",
    subtitle: "Quickly capture information",
    category: "utility",
    icon: ScanLine,
    color: colors.green,
    phase: 4,
    enabled: true,
  },

  // ─────────────────────────
  // System / Power User
  // ─────────────────────────

  {
    key: "network",
    title: "Network",
    subtitle: "Network information and utilities",
    category: "system",
    icon: Network,
    color: colors.blue,
    phase: 4,
    enabled: true,
  },

  {
    key: "developer",
    title: "Developer",
    subtitle: "Developer-focused utilities",
    category: "system",
    icon: Code2,
    color: colors.purple,
    phase: 4,
    enabled: true,
  },

  {
    key: "device",
    title: "Device",
    subtitle: "Device information and controls",
    category: "system",
    icon: Smartphone,
    color: colors.green,
    phase: 4,
    enabled: true,
  },

  {
    key: "privacy",
    title: "Privacy",
    subtitle: "Privacy and local security controls",
    category: "system",
    icon: ShieldCheck,
    color: colors.pink,
    phase: 4,
    enabled: true,
  },

  {
    key: "iran",
    title: "Iran",
    subtitle: "Iran-specific tools and services",
    category: "system",
    icon: Landmark,
    color: colors.yellow,
    phase: 4,
    enabled: true,
  },

  {
    key: "automation",
    title: "Automation",
    subtitle: "Automate repetitive actions",
    category: "system",
    icon: Bot,
    color: colors.orange,
    phase: 4,
    enabled: true,
  },
];

export const enabledServices = services.filter((service) => service.enabled);

export const quickActions = enabledServices.filter(
  (service) => service.quickAction,
);

export const featuredServices = enabledServices.filter(
  (service) => service.featured,
);

export function getServiceByKey(key: string) {
  return services.find((service) => service.key === key);
}

export function getServicesByCategory(category: ServiceCategory) {
  return enabledServices.filter((service) => service.category === category);
}

export function getServicesByPhase(phase: number) {
  return enabledServices.filter((service) => service.phase === phase);
}
