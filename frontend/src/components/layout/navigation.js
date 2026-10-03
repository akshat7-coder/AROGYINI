import {
  HeartPulse,
  LayoutDashboard,
  MessageCircleHeart,
  Scale,
  ShieldAlert,
  Briefcase,
  User,
  Settings,
} from "lucide-react";

// `accent` maps to the pillar colours defined in index.css.
export const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, accent: "text-slate-600" },
  { to: "/health", label: "Health", icon: HeartPulse, accent: "text-health" },
  { to: "/legal", label: "Legal", icon: Scale, accent: "text-legal" },
  { to: "/career", label: "Career", icon: Briefcase, accent: "text-career" },
  { to: "/safety", label: "Safety", icon: ShieldAlert, accent: "text-safety" },
  { to: "/chat", label: "Assistant", icon: MessageCircleHeart, accent: "text-brand-600" },
];

// Five fit a phone tab bar; Dashboard, the four pillars, then Chat on desktop only.
export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) => item.to !== "/chat");

export const SECONDARY_NAV_ITEMS = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/admin", label: "Admin", icon: Settings, adminOnly: true },
];
