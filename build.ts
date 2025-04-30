// build.ts
import * as esbuild from "npm:esbuild@^0.20"; // Use npm specifier for esbuild
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@^0.10"; // Use jsr or npm specifier for the loader

console.log("Starting build...");

try {
    await esbuild.build({
        plugins: [...denoPlugins()], // Use the deno loader plugin
        entryPoints: ["frontend/main.ts"], // Your entry point
        outfile: "static/bundle.js",
        bundle: true,
        format: "esm", // Or 'iife', etc.
        minify: false,
        sourcemap: true,
        // Add other esbuild options as needed
        // target: "es2020",
    });
    console.log("Build finished successfully!");
    Deno.exit(0); // Exit with success
} catch (error) {
    console.error("Build failed:", error);
    Deno.exit(1);
} finally {
    // esbuild sometimes leaves processes hanging, ensure exit
    // Note: This might be less necessary with recent esbuild/Deno versions
    // Deno.exit(0); // Use cautiously, might hide errors if build() doesn't throw properly
}

// Optional: Explicitly stop esbuild service if needed, though usually handled by process exit
// esbuild.stop();
