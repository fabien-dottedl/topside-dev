import { Mastra } from "@mastra/core";
import { coordinator } from "./coordinator.js";
import { dayPlanner } from "./day-planner.js";
import { streamManager } from "./stream-manager.js";
import { githubMonitor } from "./github-monitor.js";
import { researchIdeas } from "./research-ideas.js";

export const mastra: InstanceType<typeof Mastra> = new Mastra({
  agents: {
    coordinator,
    "day-planner": dayPlanner,
    "stream-manager": streamManager,
    "github-monitor": githubMonitor,
    "research-ideas": researchIdeas,
  },
});
