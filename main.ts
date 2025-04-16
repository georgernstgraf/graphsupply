import { assert, assertEquals } from "@std/assert";
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
const adjacency_simple = "adjacency-simple";
const adjacency_weighted = "adjacency-weighted";

function isQuadraticSymmetricNumberArray(matrix: number[][]): boolean {
    // TODO make three distinct functions
    const n = matrix.length;
    for (let i = 0; i < n; i++) {
        // Check if the row length is equal to n
        if (matrix[i].length !== n) {
            return false;
        }
        // and if the values are numbers
        for (const value of matrix[i]) {
            if (typeof value !== "number") {
                return false;
            }
        }
        // Check if the matrix is symmetric
        for (let j = 0; j < i; j++) {
            if (matrix[i][j] !== matrix[j][i]) {
                return false;
            }
        }
    }
    return true;
}
const honoOptions = {
    port: listenPort, // Example: Use port 8080
    hostname,
    onListen: function (addr: Deno.NetAddr) {
        // Optional: Log when the server starts listening
        console.log(
            `@ ${
                new Date().toLocaleTimeString()
            } graphsupply listening on http://${addr.hostname}:${addr.port}/${prefix}`,
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
        files.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
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
app.get(`/${prefix}/${adjacency_simple}`, async (c) => {
    const files = [];
    try {
        for await (
            const dirEntry of Deno.readDir(`./graphs/${adjacency_simple}`)
        ) {
            if (dirEntry.isFile) {
                files.push(
                    `${base_url}/${adjacency_simple}/${dirEntry.name}`,
                );
            }
        }
        files.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
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
app.get(`/${prefix}/${adjacency_simple}/:filename`, async (c) => {
    const filename = c.req.param("filename");
    const filePath = `./graphs/${adjacency_simple}/${filename}`;
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
        assert(isQuadraticSymmetricNumberArray(matrix));
        return c.json({
            "lines": matrix.length,
            "columns": matrix.length,
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
app.get(`/${prefix}/${adjacency_weighted}`, async (c) => {
    const files = [];
    try {
        for await (
            const dirEntry of Deno.readDir(`./graphs/${adjacency_weighted}`)
        ) {
            if (dirEntry.isFile) {
                files.push(
                    `${base_url}/${adjacency_weighted}/${dirEntry.name}`,
                );
            }
        }
        files.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
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
app.get(`/${prefix}/${adjacency_weighted}/:filename`, async (c) => {
    const filename = c.req.param("filename");
    const filePath = `./graphs/${adjacency_weighted}/${filename}`;
    try {
        const fileContent = await Deno.readTextFile(filePath);
        const json = JSON.parse(fileContent);
        const matrix = json.matrix;
        assert(
            isQuadraticSymmetricNumberArray(matrix),
            "isQuadraticSymmetricNumberArray() failed",
        );
        return c.json({
            "lines": matrix.length,
            "columns": matrix.length,
            "nodes": json.nodes,
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
