import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";

export default {
  input: "src/index.ts",
  output: {
    file: "build/index.js",
    format: "esm",
    sourcemap: true,
  },
  external: [
    "@modelcontextprotocol/sdk",
    "@modelcontextprotocol/sdk/server/mcp.js",
    "@modelcontextprotocol/sdk/server/stdio.js",
    "zod",
    "node:crypto",
    "node:fs",
    "node:path",
    "node:url",
  ],
  plugins: [
    resolve(),
    typescript({
      tsconfig: "./tsconfig.json",
    }),
  ],
};
