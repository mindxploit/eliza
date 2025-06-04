import type { Plugin } from "@elizaos/core";
import { educationalResponseAction } from "./actions/teachChapter.ts";
import { courseProvider } from "./providers/courseProvider.ts";

export const coursesPlugin: Plugin = {
    name: "courses",
    description: "Plugin for always-on educational responses with structured course content delivery through external APIs",
    actions: [educationalResponseAction],
    providers: [courseProvider],
};

export default coursesPlugin;

// Export types for use by other modules
export * from "./types.ts";
export * from "./environment.ts";
export { educationalResponseAction, teachChapterAction, TEACHING_TEMPLATE } from "./actions/teachChapter.ts";
export { courseProvider } from "./providers/courseProvider.ts";
