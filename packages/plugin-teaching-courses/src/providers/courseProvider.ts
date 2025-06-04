import {
    Provider,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
} from "@elizaos/core";

export const courseProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ): Promise<string> => {
        try {
            // Extract chapter references for context
            const chapterId = extractChapterId(message.content.text);
            const courseId = extractCourseId(message.content.text);

            let contextParts: string[] = [];

            // For now, return mock course status to demonstrate structure
            if (message.userId) {
                const mockStatus = await getMockCourseStatus(message.userId);
                if (mockStatus) {
                    contextParts.push(mockStatus);
                }
            }

            // If specific chapter/course mentioned, add that to context
            if (chapterId || courseId) {
                elizaLogger.debug("Course/chapter reference detected:", { chapterId, courseId });
                const specificContext = formatSpecificReference(chapterId, courseId);
                if (specificContext) {
                    contextParts.push(specificContext);
                }
            }

            return contextParts.join('\n\n');

        } catch (error) {
            elizaLogger.error("Error in course provider:", error);
            return "";
        }
    },
};

// Mock API call that returns basic course info and user status
async function getMockCourseStatus(userId: string): Promise<string | null> {
    try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 50));

        // Mock course status data - Italian Cloud Infrastructure course
        const mockData = {
            user: {
                id: userId,
                currentCourse: "cloud-infrastrutture-fondamenti",
                currentChapter: 3,
                lastAccessed: new Date().toISOString(),
                learningStreak: 5
            },
            course: {
                id: "cloud-infrastrutture-fondamenti",
                title: "Fondamenti di Infrastrutture Cloud",
                totalChapters: 8,
                completedChapters: 3,
                difficulty: "principiante",
                estimatedTimeRemaining: "50 minuti",
                progressPercentage: 37
            }
        };

        return formatMockCourseStatus(mockData);
    } catch (error) {
        elizaLogger.error("Error in mock course status:", error);
        return null;
    }
}

// Format mock course status for context injection
function formatMockCourseStatus(data: any): string {
    return `## Stato Attuale dell'Apprendimento

**Corso Attivo**: ${data.course.title} (${data.course.difficulty})
**Progressi**: ${data.course.progressPercentage}% completato (${data.course.completedChapters}/${data.course.totalChapters} capitoli)
**Focus Attuale**: Capitolo ${data.user.currentChapter}
**Streak di Apprendimento**: ${data.user.learningStreak} giorni 🔥
**Tempo Rimanente**: ~${data.course.estimatedTimeRemaining}

### Contesto di Apprendimento:
Stai facendo ottimi progressi nel tuo percorso di cloud computing! Attualmente stai lavorando su concetti fondamentali che formeranno la base delle tue competenze in infrastrutture IT.

*Nota: Questi sono dati dimostrativi che mostrano la struttura del monitoraggio del corso.*`;
}

// Format context when specific chapter/course is mentioned
function formatSpecificReference(chapterId: string | null, courseId: string | null): string | null {
    if (!chapterId && !courseId) return null;

    let context = "## Riferimento Specifico Rilevato\n\n";

    if (chapterId) {
        context += `**Capitolo**: ${chapterId}\n`;
        context += `*Questo riferimento al capitolo sarà utilizzato per il recupero futuro di contenuti specifici.*\n\n`;
    }

    if (courseId) {
        context += `**Corso**: ${courseId}\n`;
        context += `*Questo riferimento al corso sarà utilizzato per il contesto futuro specifico del corso.*\n\n`;
    }

    return context;
}

// Utility functions for detecting explicit course/chapter references
function extractChapterId(text: string): string | null {
    // Look for explicit chapter references like "chapter 3" or "chapter abc-123"
    const chapterMatch = text.match(/chapter[:\s]*([a-f0-9-]+|\d+)/i);
    return chapterMatch ? chapterMatch[1] : null;
}

function extractCourseId(text: string): string | null {
    // Look for explicit course references like "course 123" or "course abc-123"
    const courseMatch = text.match(/course[:\s]*([a-f0-9-]+|\d+)/i);
    return courseMatch ? courseMatch[1] : null;
}
