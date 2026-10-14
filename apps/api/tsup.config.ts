import { defineConfig } from "tsup";

export default defineConfig({
	entry: { index: "src/index.ts" },
	format: "esm",
	platform: "node",
	sourcemap: true,
	clean: true,
	splitting: false,
	external: [/^@formkit\//, /^node:/],
});
