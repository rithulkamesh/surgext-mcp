import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { initSearch, searchDocs, getSection, listSections, searchParameters } from "./search.js";
const server = new Server({
    name: "surge-xt-docs",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "search_docs",
                description: "Search the Surge XT documentation using keywords",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "Search query" },
                        top_k: { type: "number", description: "Number of results to return (default 5)" }
                    },
                    required: ["query"],
                },
            },
            {
                name: "get_section",
                description: "Get the full content of a specific documentation section by its heading path",
                inputSchema: {
                    type: "object",
                    properties: {
                        section: { type: "string", description: "Heading path (e.g. 'Oscillators > Wavetable')" }
                    },
                    required: ["section"],
                },
            },
            {
                name: "list_sections",
                description: "List all top-level and second-level documentation sections",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "get_parameter_info",
                description: "Search for specific parameters or controls within the synth",
                inputSchema: {
                    type: "object",
                    properties: {
                        parameter_name: { type: "string", description: "Name of the parameter (e.g. 'Cutoff', 'WT Position')" }
                    },
                    required: ["parameter_name"],
                },
            }
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        if (request.params.name === "search_docs") {
            const { query, top_k = 5 } = request.params.arguments;
            const results = await searchDocs(query, top_k);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(results, null, 2),
                    },
                ],
            };
        }
        if (request.params.name === "get_section") {
            const { section } = request.params.arguments;
            const results = await getSection(section);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(results, null, 2),
                    },
                ],
            };
        }
        if (request.params.name === "list_sections") {
            const results = await listSections();
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(results, null, 2),
                    },
                ],
            };
        }
        if (request.params.name === "get_parameter_info") {
            const { parameter_name } = request.params.arguments;
            const results = await searchParameters(parameter_name);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(results, null, 2),
                    },
                ],
            };
        }
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error executing tool: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});
export async function startServer() {
    await initSearch();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Surge XT Docs MCP Server running on stdio");
}
