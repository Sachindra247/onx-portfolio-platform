import type { LucideIcon } from "lucide-react";
import {
  BadgeDollarSign,
  CalendarDays,
  GraduationCap,
  Palmtree,
} from "lucide-react";

export type ModuleStatus = "available" | "coming-soon";

export interface AppModule {
  id: "events" | "certifications" | "rebates" | "vacations";
  name: string;
  shortName: string;
  description: string;
  summary: string;
  path?: string;
  icon: LucideIcon;
  accent: "gold" | "blue" | "teal" | "purple";
  status: ModuleStatus;
}

export const appModules: AppModule[] = [
  {
    id: "events",
    name: "Events Portfolio",
    shortName: "Events",
    description:
      "Track event schedules, vendors, stages, budgets and portfolio activity.",
    summary: "View the current events portfolio",
    path: "/events",
    icon: CalendarDays,
    accent: "gold",
    status: "available",
  },
  {
    id: "certifications",
    name: "Certification Tracker",
    shortName: "Certifications",
    description:
      "Track certifications, vendor competencies and upcoming expirations.",
    summary: "View the certification portfolio",
    path: "/certifications",
    icon: GraduationCap,
    accent: "blue",
    status: "available",
  },
  {
    id: "rebates",
    name: "Products Rebates",
    shortName: "Rebates",
    description:
      "Track vendor rebates, claims, eligibility periods and payment status.",
    summary: "Planned for a future release",
    icon: BadgeDollarSign,
    accent: "teal",
    status: "coming-soon",
  },
  {
    id: "vacations",
    name: "Vacation Tracker",
    shortName: "Vacations",
    description:
      "Coordinate vacation schedules, approvals and team availability.",
    summary: "Planned for a future release",
    icon: Palmtree,
    accent: "purple",
    status: "coming-soon",
  },
];
