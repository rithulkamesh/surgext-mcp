import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
const server = new Server({
    name: "surge-xt-docs",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Surge XT Docs MCP Server running on stdio");
}
run().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
