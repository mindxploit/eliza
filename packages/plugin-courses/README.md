# @elizaos/plugin-teaching-courses

A plugin for ElizaOS that provides **always-on educational responses** using RAG for course content, with mock course status tracking to demonstrate learning progression.

## Description

The Teaching Courses plugin enables AI agents to **always respond educationally** by utilizing RAG (Retrieval Augmented Generation) for course content and the LLM's natural knowledge for general educational responses. It includes mock course status tracking to demonstrate how learning progression can be integrated with educational responses.

## Key Approach: Always-On Educational Template + RAG + Mock Status

This plugin demonstrates a **always-on educational approach** where:

-   🎓 **Every response uses educational methodology** (not just course-specific queries)
-   📚 **Uses RAG for course content** when relevant course materials are available
-   🧠 **Leverages LLM's natural knowledge** for general programming concepts and explanations
-   📊 **Shows mock learning status** to demonstrate course progression tracking
-   💡 **Always maintains a teaching, supportive tone**

This follows the principle: **Teaching bots should always teach, using the best available knowledge source plus learning context**.

## Installation

```bash
pnpm install @elizaos/plugin-teaching-courses
```

## Features

### 1. Always-On Educational Responses

-   **Universal Teaching**: Every response uses educational methodology and supportive tone
-   **RAG Integration**: Automatically retrieves relevant course content when available
-   **LLM Knowledge**: Falls back to natural language model knowledge for general concepts
-   **Learning Context**: Includes mock learning status to encourage continued progress
-   **Consistent Experience**: Users always get teaching-focused interactions

### 2. Smart Content Sources

-   **RAG for Course Content**: Retrieves specific course materials, chapters, and structured lessons
-   **LLM for Concepts**: Uses natural knowledge for programming fundamentals, explanations, and examples
-   **Mock Status Tracking**: Demonstrates learning progression with current chapter, progress, and streaks
-   **Educational Fallback**: Always provides value even without specific course content

## Configuration

### Basic Setup

Add the plugin to your character's configuration:

```json
{
    "name": "TeachingAgent",
    "plugins": ["@elizaos/plugin-teaching-courses"],
    "bio": "An expert programming tutor focused on clear explanations and encouragement",
    "system": "You are a dedicated educational AI that helps students learn programming..."
}
```

### Optional API Configuration (Future Use)

For future real API implementation:

```env
COURSE_API_URL=https://your-course-api.com/api  # Optional
COURSE_API_KEY=your-api-key-here                # Optional
```

## Usage

### How It Works (Always-On Teaching + Mock Status)

1. **User asks ANY question**: "What's the weather like?" or "Explain JavaScript functions"
2. **Plugin injects learning context**: Mock course status shows current progress and learning streak
3. **Content source selection**: RAG for course content, LLM knowledge for general concepts
4. **Educational response generated**: Always helpful, teaching-focused, encouraging with progress awareness

### Example Interactions

```
User: "What's the difference between let and var?"
Context: [Mock status shows: Currently on "Functions and Scope", 45% complete, 7-day streak]
Agent: [Educational response using LLM knowledge, encouraging continued progress]

User: "Explain chapter 3"
Context: [Mock status + specific chapter reference detected]
RAG: [Retrieves relevant course materials for chapter 3]
Agent: [Structured lesson with encouragement about learning progress]

User: "I'm feeling confused about programming"
Context: [Mock status shows progress to motivate]
Agent: [Supportive response referencing their good progress and learning streak]

User: "Hello"
Context: [Mock status shows current learning focus]
Agent: [Welcoming response mentioning their current chapter and encouraging next steps]
```

### Mock Learning Status Context

The plugin automatically injects learning context like:

```markdown
## Current Learning Status

**Active Course**: JavaScript Fundamentals (beginner)
**Progress**: 45% complete (5/12 chapters)
**Current Focus**: Functions and Scope
**Learning Streak**: 7 days 🔥
**Time Remaining**: ~3.5 hours

### Learning Context:

You're making great progress in your JavaScript journey! Currently working through
fundamental concepts that will form the foundation of your programming skills.
```

### Always-Educational Responses

The plugin ensures that **every response**:

-   Uses encouraging, supportive tone
-   Includes learning progress awareness when available
-   Provides educational value when possible
-   Includes examples and explanations when relevant
-   Suggests next steps or practice opportunities
-   Maintains markdown formatting for readability

## Plugin Architecture

### Always-On Educational Action ✨

The main action **EDUCATIONAL_RESPONSE**:

-   **Validates**: Always returns `true` (responds to every message)
-   **Template**: Uses consistent educational template for all responses
-   **Content**: Combines RAG results with LLM knowledge and learning status
-   **Tone**: Always supportive, encouraging, and educational

### Components

#### **Action: educationalResponseAction**

-   **Purpose**: Provides educational responses for ALL user messages
-   **Validation**: Always triggers (no keyword filtering)
-   **Template**: Uses `TEACHING_TEMPLATE` for consistent educational approach
-   **Benefits**: Every interaction is educational and supportive

#### **Provider: courseProvider** (Mock Status)

-   **Purpose**: Provides mock learning status and detects course/chapter references
-   **Mock Data**: Returns simulated course progress, current chapter, and learning streak
-   **Reference Detection**: Identifies when users mention specific chapters or courses
-   **Benefits**: Demonstrates learning progression structure for future real implementation

## Educational Template

The plugin uses a consistent educational template for all responses:

```markdown
# Educational Assistant Response

You always provide helpful, educational responses that:

1. **Address the student's question or request directly**
2. **Use any course/chapter content available in the context**
3. **Reference their learning progress when available**
4. **Provide clear explanations with examples when relevant**
5. **Maintain an encouraging and supportive teaching tone**
6. **Break down complex concepts into digestible parts**
7. **Suggest practice or next steps when appropriate**

## Instructions:

-   Always respond in an educational, helpful manner
-   Use available RAG content for specific course topics
-   Leverage LLM knowledge for general programming concepts
-   Reference learning progress to encourage and motivate
-   Use examples and analogies to clarify concepts
-   Encourage learning and curiosity
-   Use markdown formatting for better readability
-   End with encouragement or suggestions for next steps
```

## Content Sources

### RAG for Course Content

-   Structured lessons and tutorials
-   Code examples and exercises
-   Best practices and patterns
-   Specific framework/library documentation

### LLM Knowledge for General Concepts

-   Programming fundamentals
-   Language syntax and semantics
-   Problem-solving approaches
-   Learning encouragement and motivation

### Mock Learning Status

-   Current course and chapter tracking
-   Progress percentage and completion status
-   Learning streaks and time estimates
-   Motivational context about learning journey

## Benefits of This Approach

### Traditional Approach:

-   Only educational for specific keywords
-   Limited to predefined course content
-   No awareness of learning progress
-   Inconsistent tone and helpfulness

### Our Approach:

-   **Every response is educational**
-   **Best available knowledge source** (RAG + LLM)
-   **Learning progress awareness** (mock status tracking)
-   **Consistent supportive experience**
-   **Scalable and flexible content**

## Future Enhancements

The plugin structure is ready for:

-   **Real API integration**: Replace mock data with actual course tracking
-   **Personalized learning paths**: Adapted to real student progress
-   **Exercise recommendations**: Based on actual learning history
-   **Progress visualization**: Real charts and completion status
-   **Chapter completion tracking**: Actual progress through course materials

## Development

1. Clone the repository
2. Install dependencies:
    ```bash
    pnpm install
    ```
3. Build the plugin:
    ```bash
    pnpm run build
    ```
4. Test with character:
    ```bash
    pnpm dev --characters=./characters/teaching-agent.character.json
    ```

## Dependencies

-   `@elizaos/core`: workspace:\*
-   RAG system (configured at agent level)

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues and questions:

-   Create an issue in the repository
-   Check the documentation
-   Join the ElizaOS community discussions
