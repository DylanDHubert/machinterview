// Add interface for tools
interface Tool {
    type: 'function';
    name: string;
    description: string;
    parameters?: {
      type: string;
      properties: Record<string, {
        type: string;
        description: string;
      }>;
    };
}

const toolDefinitions = {
    getCurrentTime: {
        description: 'Gets the current time in the user\'s timezone',
        parameters: {}
    }
} as const;

const tools: Tool[] = Object.entries(toolDefinitions).map(([name, config]) => ({
    type: "function",
    name,
    description: config.description,
    parameters: {
    type: 'object',
    properties: config.parameters
    }
}));


export type { Tool };
export { tools };