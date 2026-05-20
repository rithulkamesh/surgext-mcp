# Surge XT Docs MCP Server

A Model Context Protocol (MCP) server that indexes the [Surge XT Synthesizer](https://github.com/surge-synthesizer/surge) documentation. It provides tools for AI models to efficiently search and navigate the documentation to assist with sound design and recreation.

## Setup

Ensure you have [Bun](https://bun.sh/) installed.

```bash
bun install
bun run build
bun run ingest
```

The ingest step will download the latest documentation from the `surge` repository and create a `data/chunks.json` file.

## Tools Provided

- `search_docs(query: string, top_k?: number)` - Full text search for docs.
- `get_section(section: string)` - Fetch the content of a specific heading path (e.g. `Oscillators > Wavetable`).
- `list_sections()` - Explore the document structure.
- `get_parameter_info(parameter_name: string)` - Get specific info about knobs and parameters.

## Client Configurations

### Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "surgext-mcp": {
      "command": "node",
      "args": ["/path/to/surgext-mcp/dist/index.js"]
    }
  }
}
```

### Cursor

In your `.cursor/settings.json` or global cursor settings under MCP configuration:

```json
{
  "mcp": {
    "servers": {
      "surgext-mcp": {
        "command": "node",
        "args": ["/path/to/surgext-mcp/dist/index.js"]
      }
    }
  }
}
```

### OpenCode

Add the following to your `opencode.json` configuration:

```json
{
  "mcpServers": {
    "surgext-mcp": {
      "command": "node",
      "args": ["/path/to/surgext-mcp/dist/index.js"]
    }
  }
}
```

## Sample System Prompt for Sound Recreation

If you are using this MCP server to help an AI recreate a specific sound, use this prompt to guide the model:

```text
You are an expert synthesizer patch designer specializing in Surge XT. You have access to the Surge XT Docs MCP server.

When recreating a sound, follow these steps:
1. Use `list_sections()` to understand the available documentation structure.
2. If you are unsure about the overall synth architecture or a specific feature, use `search_docs()`.
3. When deciding how to set a specific knob or control, use `get_parameter_info()` to read the exact documentation for that parameter.
4. Synthesize the patch step-by-step based on your findings.
```