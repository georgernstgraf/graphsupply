import { assertEquals } from "@std/assert/equals";
import { Hono } from "jsr:@hono/hono";

const base_url = Deno.env.get("BASE_URL");
if (!base_url) {
    throw new Error("BASE_URL environment variable is not set");
}
const hostname = Deno.env.get("LISTEN_HOST");
if (!hostname) {
    throw new Error("LISTEN_HOST environment variable is not set");
}
const listenPort = Number(Deno.env.get("LISTEN_PORT"));
if (isNaN(listenPort)) {
    throw new Error("LISTEN_PORT environment variable is not set or invalid");
}
const base_url_parts = base_url.split("/");
const prefix = base_url_parts.at(-1);

const honoOptions = {
    port: listenPort, // Example: Use port 8080
    hostname,
    onListen: function (addr: Deno.NetAddr) {
        // Optional: Log when the server starts listening
        console.log(
            `@ ${
                new Date().toLocaleTimeString()
            } graphsupply listening on http://${addr.hostname}:${addr.port}`,
        );
    },
};
const app = new Hono();

app.get(`/${prefix}`, async (c) => {
    const dirs = [];
    try {
        for await (const dirEntry of Deno.readDir("./graphs")) {
            if (dirEntry.isDirectory) {
                dirs.push(`${base_url}/${dirEntry.name}`);
            }
        }
        return c.json(dirs);
    } catch (error) {
        console.error("Error reading directories:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : String(error);
        return c.json(
            { error: `Failed to read directories: ${errorMessage}` },
            500,
        );
    }
});
app.get(`/${prefix}/andy-json`, async (c) => {
    const files = [];
    try {
        for await (const dirEntry of Deno.readDir("./graphs/andy-json")) {
            if (dirEntry.isFile) {
                files.push(
                    `${base_url}/andy-json/${dirEntry.name}`,
                );
            }
        }
        return c.json(files);
    } catch (error) {
        console.error("Error reading directories:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : String(error);
        return c.json(
            { error: `Failed to read directories: ${errorMessage}` },
            500,
        );
    }
});
app.get(`/${prefix}/andy-json/:filename`, async (c) => {
    const filename = c.req.param("filename");
    const filePath = `./graphs/andy-json/${filename}`;
    try {
        const fileContent = await Deno.readTextFile(filePath);
        const jsonData = JSON.parse(fileContent);
        return c.json(jsonData);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        const errorMessage = error instanceof Error
            ? error.message
            : String(error);
        return c.json(
            { error: `Failed to read file: ${errorMessage}` },
            500,
        );
    }
});
app.get(`/${prefix}/matrix-csv`, async (c) => {
    const files = [];
    try {
        for await (const dirEntry of Deno.readDir("./graphs/matrix-csv")) {
            if (dirEntry.isFile) {
                files.push(
                    `${base_url}/matrix-csv/${dirEntry.name}`,
                );
            }
        }
        return c.json(files);
    } catch (error) {
        console.error("Error reading directories:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : String(error);
        return c.json(
            { error: `Failed to read file: ${errorMessage}` },
            500,
        );
    }
});
app.get(`/${prefix}/matrix-csv/:filename`, async (c) => {
    const filename = c.req.param("filename");
    const filePath = `./graphs/matrix-csv/${filename}`;
    try {
        const fileContent = await Deno.readTextFile(filePath);
        const lines = fileContent.split("\n");
        const matrix = lines.map((line) => {
            const values = line.split(";");
            return values.map((valueStr) => {
                const trimmedValue = valueStr.trim();
                const value = Number(trimmedValue);
                if (isNaN(value)) {
                    throw new Error(`Invalid number: ${trimmedValue}`);
                }
                return value;
            });
        });
        const matrixLines = matrix.length;
        const matrixColumns = matrix[0].length;
        matrix.forEach((row) => {
            assertEquals(matrixColumns, row.length);
        });
        return c.json({
            "lines": matrixLines,
            "columns": matrixColumns,
            matrix,
        });
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        const errorMessage = error instanceof Error
            ? error.message
            : String(error);
        return c.json(
            { error: `Failed to read file: ${errorMessage}` },
            500,
        );
    }
});

Deno.serve(honoOptions, app.fetch);
