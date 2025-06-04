import { z } from "zod";
import type { IAgentRuntime } from "@elizaos/core";

// Configuration schema for course management
// Currently minimal since we're using RAG, but ready for future API implementation
export const courseConfigSchema = z.object({
    // Future API configuration (currently not used)
    apiUrl: z.string().optional(),
    apiKey: z.string().optional(),
});

export type CourseConfigSchema = z.infer<typeof courseConfigSchema>;

export function validateCourseConfig(runtime: IAgentRuntime): CourseConfigSchema {
    const config = {
        // These will be used when we implement current chapter info
        apiUrl: runtime.getSetting("COURSE_API_URL"),
        apiKey: runtime.getSetting("COURSE_API_KEY"),
    };

    // For now, validation is relaxed since we're using RAG
    // In the future, we'll enforce these for chapter info functionality
    return courseConfigSchema.parse(config);
}
