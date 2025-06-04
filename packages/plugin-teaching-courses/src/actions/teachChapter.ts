import {
    Action,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
    elizaLogger,
    composeContext,
    generateMessageResponse,
    ModelClass,
} from "@elizaos/core";

// Extract the teaching template to be reusable
export const TEACHING_TEMPLATE = `
# Educational Assistant Response

You are an expert educational AI helping students learn. You always provide helpful, educational responses that:

1. **Address the student's question or request directly**
2. **Use any course/chapter content available in the context**
3. **Provide clear explanations with examples when relevant**
4. **Maintain an encouraging and supportive teaching tone**
5. **Break down complex concepts into digestible parts**
6. **Suggest practice or next steps when appropriate**

## Available Context:
{{providers}}

## Student Message:
"{{currentMessage}}"

## Instructions:
- Always respond in an educational, helpful manner
- If course content is available in context, reference and teach from it
- If no specific course content, provide general educational guidance
- Use examples and analogies to clarify concepts
- Encourage learning and curiosity
- Use markdown formatting for better readability
- End with encouragement or suggestions for next steps

Your response should be conversational, educational, and supportive.
`;

export const educationalResponseAction: Action = {
    name: "EDUCATIONAL_RESPONSE",
    similes: [
        "TEACH",
        "EXPLAIN",
        "HELP_LEARN",
        "ANSWER_QUESTION",
        "PROVIDE_GUIDANCE",
        "EDUCATIONAL_SUPPORT"
    ],
    description: "Provides educational responses using teaching methodology and course context when available",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // Always validate as true for teaching bots - they should always use educational approach
        return true;
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ): Promise<boolean> => {
        try {
            // Use the teaching template for ALL responses
            const context = composeContext({
                state: {
                    ...state,
                    currentMessage: message.content.text
                },
                template: TEACHING_TEMPLATE,
            });

            const response = await generateMessageResponse({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
            });

            await callback({
                text: response.text,
                action: "EDUCATIONAL_RESPONSE"
            });

            return true;
        } catch (error) {
            elizaLogger.error("Error in educational response action:", error);
            await callback({
                text: "I'm sorry, I encountered an error while preparing my response. Please try again, and I'll do my best to help you learn!",
                action: "EDUCATIONAL_RESPONSE"
            });
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you teach me chapter 3 about JavaScript functions?"
                }
            },
            {
                user: "{{user2}}",
                content: {
                    text: "# Chapter 3: JavaScript Functions\n\nGreat choice! Functions are one of the most important concepts in JavaScript. Let me walk you through this step by step.\n\n## What are Functions?\n\nFunctions are reusable blocks of code that perform specific tasks. Think of them as recipes that you can use over and over again.\n\n```javascript\nfunction greetStudent(name) {\n    return `Hello, ${name}! Ready to learn?`;\n}\n\nconst message = greetStudent('Alex');\nconsole.log(message); // Output: Hello, Alex! Ready to learn?\n```\n\n## Key Concepts:\n- **Declaration**: Using the `function` keyword\n- **Parameters**: Values you pass into the function (like `name`)\n- **Return**: The value the function gives back\n\nTry creating your own function and let me know how it goes! Would you like to see more examples or move on to the next topic?",
                    action: "EDUCATIONAL_RESPONSE"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What's the difference between let and var?"
                }
            },
            {
                user: "{{user2}}",
                content: {
                    text: "# Let vs Var: Understanding Variable Declaration\n\nExcellent question! This is a fundamental concept that often confuses new JavaScript developers.\n\n## Key Differences:\n\n### Scope\n- **`var`**: Function-scoped or globally-scoped\n- **`let`**: Block-scoped (only exists within { } where it's declared)\n\n```javascript\nfunction example() {\n    if (true) {\n        var x = 1;    // Function-scoped\n        let y = 2;    // Block-scoped\n    }\n    console.log(x); // Works! Prints 1\n    console.log(y); // Error! y is not defined\n}\n```\n\n### Hoisting Behavior\n- **`var`**: Hoisted and initialized with `undefined`\n- **`let`**: Hoisted but not initialized (temporal dead zone)\n\n## Best Practice\nAlways use `let` (or `const`) instead of `var` for cleaner, more predictable code!\n\nWould you like to see more examples or learn about `const` as well?",
                    action: "EDUCATIONAL_RESPONSE"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I'm feeling confused about programming"
                }
            },
            {
                user: "{{user2}}",
                content: {
                    text: "# You're Not Alone - Programming is a Journey! 🌟\n\nFeeling confused is completely normal and actually a sign that you're learning! Every programmer has been exactly where you are right now.\n\n## Remember:\n- **Confusion = Growth**: Your brain is building new neural pathways\n- **Every Expert Was Once a Beginner**: Even the best programmers started with basic concepts\n- **Small Steps Lead to Big Progress**: Focus on one concept at a time\n\n## Let's Get You Back on Track:\n1. **Take a Break**: Sometimes stepping away helps things click\n2. **Review Basics**: Go back to fundamentals - there's no shame in that!\n3. **Practice Small Examples**: Start with tiny, working code snippets\n4. **Ask Specific Questions**: What particular concept is causing confusion?\n\n## You've Got This! 💪\nProgramming is like learning a new language - it takes time, practice, and patience. I'm here to help you through any specific topics that are troubling you.\n\nWhat would you like to tackle first? We can start with something simple and build your confidence back up!",
                    action: "EDUCATIONAL_RESPONSE"
                }
            }
        ]
    ]
};

// Export both the new name and old name for backward compatibility
export const teachChapterAction = educationalResponseAction;
