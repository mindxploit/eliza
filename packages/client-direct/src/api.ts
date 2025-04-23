import express from "express";
import { Router } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";


import {
    type AgentRuntime,
    type IAgentRuntime,
    elizaLogger,
    getEnvVariable,
    type UUID,
    validateCharacterConfig,
    ServiceType,
    type Character,
    stringToUuid,
} from "@elizaos/core";

// import type { TeeLogQuery, TeeLogService } from "@elizaos/plugin-tee-log";
// import { REST, Routes } from "discord.js";
import type { DirectClient } from ".";
import { validateUuid } from "@elizaos/core";

interface UUIDParams {
    agentId: UUID;
    roomId?: UUID;
}

function validateUUIDParams(
    params: { agentId: string; roomId?: string },
    res: express.Response,
): UUIDParams | null {
    const agentId = validateUuid(params.agentId);
    if (!agentId) {
        res.status(400).json({
            error: "Invalid AgentId format. Expected to be a UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        });
        return null;
    }

    if (params.roomId) {
        const roomId = validateUuid(params.roomId);
        if (!roomId) {
            res.status(400).json({
                error: "Invalid RoomId format. Expected to be a UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            });
            return null;
        }
        return { agentId, roomId };
    }

    return { agentId };
}

export function createApiRouter(
    agents: Map<string, IAgentRuntime>,
    directClient: DirectClient,
): Router {
    const router = express.Router();

    router.use(cors());
    router.use(bodyParser.json());
    router.use(bodyParser.urlencoded({ extended: true }));
    router.use(
        express.json({
            limit: getEnvVariable("EXPRESS_MAX_PAYLOAD") || "100kb",
        }),
    );

    router.get("/", (req, res) => {
        res.send("Welcome, this is the REST API!");
    });

    router.get("/hello", (req, res) => {
        res.json({ message: "Hello World!" });
    });

    router.get("/agents", (req, res) => {
        const agentsList = Array.from(agents.values()).map((agent) => ({
            id: agent.agentId,
            name: agent.character.name,
            clients: Object.keys(agent.clients),
        }));
        res.json({ agents: agentsList });
    });

    router.get("/storage", async (req, res) => {
        try {
            const uploadDir = path.join(process.cwd(), "data", "characters");
            const files = await fs.promises.readdir(uploadDir);
            res.json({ files });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get("/agents/:agentId", (req, res) => {
        const { agentId } = validateUUIDParams(req.params, res) ?? {
            agentId: null,
        };
        if (!agentId) return;

        const agent = agents.get(agentId);

        if (!agent) {
            res.status(404).json({ error: "Agent not found" });
            return;
        }

        const character = agent?.character;
        if (character?.settings?.secrets) {
            delete character.settings.secrets;
        }

        res.json({
            id: agent.agentId,
            character: agent.character,
        });
    });

    router.delete("/agents/:agentId", async (req, res) => {
        const { agentId } = validateUUIDParams(req.params, res) ?? {
            agentId: null,
        };
        if (!agentId) return;

        const agent = agents.get(agentId) as unknown as AgentRuntime;

        if (agent) {
            // Character name is needed for file deletion
            const characterName = agent.character.name;

            // Stop and unregister agent
            agent.stop();
            directClient.unregisterAgent(agent);

            try {
                // Delete character JSON file
                const characterFilepath = path.join(
                    process.cwd(),
                    "..",
                    "characters",
                    `${characterName}.json`
                );

                if (fs.existsSync(characterFilepath)) {
                    await fs.promises.unlink(characterFilepath);
                    elizaLogger.info(`Character file deleted: ${characterFilepath}`);
                }

                // Delete knowledge directory for this character
                const knowledgePath = path.join(
                    process.cwd(),
                    "..",
                    "characters",
                    "knowledge",
                    characterName
                );

                if (fs.existsSync(knowledgePath)) {
                    // Recursively delete directory and contents
                    await fs.promises.rm(knowledgePath, { recursive: true });
                    elizaLogger.info(`Knowledge directory deleted: ${knowledgePath}`);
                }

                res.status(204).json({ success: true });
            } catch (error) {
                elizaLogger.error(`Error deleting character files: ${error.message}`);
                // Still return success since the agent was removed from memory
                res.status(204).json({ success: true });
            }
        } else {
            res.status(404).json({ error: "Agent not found" });
        }
    });

    router.post("/agents/:agentId/set", async (req, res) => {
        const { agentId } = validateUUIDParams(req.params, res) ?? {
            agentId: null,
        };
        if (!agentId) return;

        let agent = agents.get(agentId) as unknown as AgentRuntime;

        // update character
        if (agent) {
            // stop agent
            agent.stop();
            directClient.unregisterAgent(agent);
            // if it has a different name, the agentId will change
        }

        // stores the json data before it is modified with added data
        const characterJson = { ...req.body };

        // load character from body
        const character = req.body;
        try {
            validateCharacterConfig(character);
        } catch (e) {
            elizaLogger.error(`Error parsing character: ${e}`);
            res.status(400).json({
                success: false,
                message: e.message,
            });
            return;
        }

        // start it up (and register it)
        try {
            agent = await directClient.startAgent(character);
            elizaLogger.log(`${character.name} started`);
        } catch (e) {
            elizaLogger.error(`Error starting agent: ${e}`);
            res.status(500).json({
                success: false,
                message: e.message,
            });
            return;
        }

        if (process.env.USE_CHARACTER_STORAGE === "true") {
            try {
                const filename = `${agent.agentId}.json`;
                const uploadDir = path.join(
                    process.cwd(),
                    "data",
                    "characters",
                );
                const filepath = path.join(uploadDir, filename);
                await fs.promises.mkdir(uploadDir, { recursive: true });
                await fs.promises.writeFile(
                    filepath,
                    JSON.stringify(
                        { ...characterJson, id: agent.agentId },
                        null,
                        2,
                    ),
                );
                elizaLogger.info(
                    `Character stored successfully at ${filepath}`,
                );
            } catch (error) {
                elizaLogger.error(
                    `Failed to store character: ${error.message}`,
                );
            }
        }

        res.json({
            id: character.id,
            character: character,
        });
    });

    router.get("/agents/:agentId/memories/:roomId?", async (req, res) => {
        const roomId = req.params.roomId
            ? stringToUuid(req.params.roomId)
            : stringToUuid("default-room-" + req.params.agentId);
        elizaLogger.info(req.params, "req.params");

        const { agentId } = validateUUIDParams(req.params, res) ?? {
            agentId: null,
            roomId: null,
        };
        if (!agentId || !roomId) return;

        let runtime = agents.get(agentId) as unknown as AgentRuntime;

        // if runtime is null, look for runtime with the same name
        if (!runtime) {
            runtime = Array.from(agents.values()).find(
                (a) => a.character.name.toLowerCase() === agentId.toLowerCase(),
            ) as unknown as AgentRuntime;
        }

        if (!runtime) {
            res.status(404).send("Agent not found");
            return;
        }

        try {
            const memories = await runtime.messageManager.getMemories({
                roomId,
                count: 10,
                unique: false,
            });
            const response = {
                agentId,
                roomId,
                memories: memories.map((memory) => ({
                    id: memory.id,
                    userId: memory.userId,
                    agentId: memory.agentId,
                    createdAt: memory.createdAt,
                    content: {
                        text: memory.content.text,
                        action: memory.content.action,
                        source: memory.content.source,
                        url: memory.content.url,
                        inReplyTo: memory.content.inReplyTo,
                        attachments: memory.content.attachments?.map(
                            (attachment) => ({
                                id: attachment.id,
                                url: attachment.url,
                                title: attachment.title,
                                source: attachment.source,
                                description: attachment.description,
                                text: attachment.text,
                                contentType: attachment.contentType,
                            }),
                        ),
                    },
                    embedding: memory.embedding,
                    roomId: memory.roomId,
                    unique: memory.unique,
                    similarity: memory.similarity,
                })),
            };

            res.json(response);
        } catch (error) {
            console.error("Error fetching memories:", error);
            res.status(500).json({ error: "Failed to fetch memories" });
        }
    });

    // Create an agent from a character config or update it by ID
    router.post("/agents/create/:agentId?", async (req, res) => {
        elizaLogger.info("req.body", req.body);
        const character = validateCharacterConfig(req.body.characterConfig);

        let agent: AgentRuntime;
        if (req.params.agentId) {
            agent = agents.get(req.params.agentId) as unknown as AgentRuntime;
        }

        // update character
        if (agent) {
            // stop agent
            agent.stop();
            directClient.unregisterAgent(agent);
            // if it has a different name, the agentId will change
        }

        // stores the json data before it is modified with added data
        const characterJson = { ...req.body.characterConfig };

        try {
            validateCharacterConfig(character);
        } catch (e) {
            elizaLogger.error(`Error parsing character: ${e}`);
            res.status(400).json({
                success: false,
                message: e.message,
            });
            return;
        }

        // start it up (and register it)
        try {
            agent = await directClient.startAgent(character);
            elizaLogger.log(`${character.name} started`);
        } catch (e) {
            elizaLogger.error(`Error starting agent: ${e}`);
            res.status(500).json({
                success: false,
                message: e.message,
            });
            return;
        }

        // store character
        try {
            // character
            const characterFilename = `${character.name}.json`;
            const characterDir = path.join(process.cwd(), "..", "characters");
            const characterFilepath = path.join(
                characterDir,
                characterFilename,
            );
            await fs.promises.mkdir(characterDir, { recursive: true });
            await fs.promises.writeFile(
                characterFilepath,
                JSON.stringify(
                    { ...characterJson, id: agent.agentId },
                    null,
                    2,
                ),
            );
            elizaLogger.info(
                `Character stored successfully at ${characterFilepath}`,
            );
        } catch (error) {
            elizaLogger.error(
                `Failed to store character or knowledge: ${error.message}`,
            );
        }

        res.json({
            id: character.id,
            character: character,
        });
    });

    router.put("/agents/modify", async (req, res) => {
        elizaLogger.info("req.body", req.body);
        const character = validateCharacterConfig(req.body.characterConfig);
        const agentId = req.body.agentId;
        let agent: AgentRuntime;
        if (agentId) {
            agent = agents.get(agentId) as unknown as AgentRuntime;
            agent.stop();
            directClient.unregisterAgent(agent); // da capire cosa fa
        }
        else {
            res.status(400).json({
                success: false,
                message: "Agent ID is required",
            });
            return;
        }
        const characterJson = { ...req.body.characterConfig, id: agentId };

        // start it up (and register it)
        // if it has a different name or no specific id property, the id will change
        try {
            agent = await directClient.startAgent(character);
            elizaLogger.log(`${character.name} started`);
        } catch (e) {
            elizaLogger.error(`Error starting agent: ${e}`);
            res.status(500).json({
                success: false,
                message: e.message,
            });
            return;
        }
        // store updated character
        try {
            // character
            const characterFilename = `${character.name}.json`;
            const characterDir = path.join(process.cwd(), "..", "characters");
            const characterFilepath = path.join(
                characterDir,
                characterFilename,
            );
            await fs.promises.mkdir(characterDir, { recursive: true });
            await fs.promises.writeFile(
                characterFilepath,
                JSON.stringify(
                    { ...characterJson, id: agent.agentId },
                    null,
                    2,
                ),
            );
            elizaLogger.info(
                `Character updated successfully at ${characterFilepath}`,
            );
        } catch (error) {
            elizaLogger.error(
                `Failed to update character: ${error.message}`,
            );
        }
        res.json({
            id: character.id,
            character: character,
        });
    });



    // Dedicated endpoint for knowledge uploads using formdata
    router.post("/agents/:agentId/knowledge", async (req, res) => {
        elizaLogger.info("req.body knowledge", req.body);
        const { agentId } = validateUUIDParams(req.params, res) ?? {
            agentId: null,
        };
        if (!agentId) return;

        const agent = agents.get(agentId) as unknown as AgentRuntime;
        if (!agent) {
            return res.status(404).json({ error: "Agent not found" });
        }

        // Create storage configuration specific to this agent
        const storage = multer.diskStorage({
            destination: function (req, file, cb) {
                const knowledgePath = path.join(
                    process.cwd(),
                    "..",
                    "characters",
                    "knowledge",
                    agent.character.name
                );
                fs.promises.mkdir(knowledgePath, { recursive: true })
                    .then(() => cb(null, knowledgePath))
                    .catch(err => cb(err, null));
            },
            filename: function (req, file, cb) {
                cb(null, file.originalname);
            }
        });

        // Create upload middleware for this specific request
        const upload = multer({ storage }).array('files');

        // Use the middleware
        upload(req, res, async function (err) {
            if (err) {
                elizaLogger.error(`Error uploading knowledge: ${err.message}`);
                return res.status(500).json({ error: err.message });
            }

            // Type safety for files
            const files = Array.isArray(req.files) ? req.files.map(file => ({
                originalname: file.originalname,
                filename: file.filename,
                path: file.path,
                size: file.size
            })) : [];

            elizaLogger.info(`Knowledge files uploaded for ${agent.character.name}: ${files.length} files`);

            if (files.length === 0) {
                return res.json({ success: true, files, message: "No files uploaded" });
            }

            try {
                // Create a deep clone of the character
                const character = JSON.parse(JSON.stringify(agent.character));
                const originalId = agent.agentId;

                // Explicitly ensure settings and ragKnowledge are set
                if (!character.settings) {
                    character.settings = {};
                }
                character.settings.ragKnowledge = true;

                // Ensure the ID is preserved
                character.id = originalId;

                elizaLogger.info(`Restarting agent ${character.name} to process new knowledge files`, {
                    ragKnowledgeEnabled: character.settings.ragKnowledge
                });

                // Stop the agent
                agent.stop();
                directClient.unregisterAgent(agent);

                // Start the agent with the modified character
                const newAgent = await directClient.startAgent(character);

                elizaLogger.log(`${character.name} restarted with new knowledge`, {
                    ragKnowledgeEnabled: newAgent.character.settings.ragKnowledge
                });

                res.json({
                    success: true,
                    files,
                    message: "Agent restarted to process new knowledge",
                    agentId: newAgent.agentId,
                    ragKnowledgeEnabled: newAgent.character.settings.ragKnowledge
                });
            } catch (error) {
                elizaLogger.error(`Error restarting agent to process knowledge:`, error);
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        });
    });

    router.post("/agent/start", async (req, res) => {
        const { characterPath, characterJson } = req.body;
        console.log("characterPath:", characterPath);
        console.log("characterJson:", characterJson);
        try {
            let character: Character;
            if (characterJson) {
                character = await directClient.jsonToCharacter(
                    characterPath,
                    characterJson,
                );
            } else if (characterPath) {
                character =
                    await directClient.loadCharacterTryPath(characterPath);
            } else {
                throw new Error("No character path or JSON provided");
            }
            await directClient.startAgent(character);
            elizaLogger.log(`${character.name} started`);

            res.json({
                id: character.id,
                character: character,
            });
        } catch (e) {
            elizaLogger.error(`Error parsing character: ${e}`);
            res.status(400).json({
                error: e.message,
            });
            return;
        }
    });

    router.post("/agents/:agentId/stop", async (req, res) => {
        const agentId = req.params.agentId;
        console.log("agentId", agentId);
        const agent = agents.get(agentId) as unknown as AgentRuntime;

        // update character
        if (agent) {
            // stop agent
            agent.stop();
            directClient.unregisterAgent(agent);
            // if it has a different name, the agentId will change
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Agent not found" });
        }
    });

    return router;
}
