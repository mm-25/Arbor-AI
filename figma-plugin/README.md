# MapMind Import — Figma Plugin

Import mind map data from the MapMind app directly into Figma as styled frames with connectors.

## What it does

- Reads a JSON payload exported from MapMind
- Creates a Figma frame for each node with auto-layout, rounded corners, and colour-coded backgrounds based on node type (actor, process, decision, outcome, problem)
- Draws connector arrows between nodes based on edges
- Places edge labels as text near the midpoint of each connector
- Groups everything and zooms to fit

## Installation

1. Open Figma Desktop
2. Go to **Plugins > Development > Import plugin from manifest...**
3. Select the `manifest.json` file in this directory

## Build

```bash
npm install
npm run build
```

This compiles `code.ts` into `code.js` using esbuild.

For development with auto-rebuild:

```bash
npm run watch
```

## Usage

1. In MapMind, go to **Export > Figma > Copy for Figma Plugin**
2. In Figma, run the **MapMind Import** plugin (Plugins > MapMind Import)
3. Paste the copied JSON into the text area
4. Click **Import**

The plugin will create all nodes and connectors on the current page.
