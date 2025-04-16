import { assert } from "@std/assert";
import { Hono } from "jsr:@hono/hono";
import * as NT from "npm:neverthrow";

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

function edgeStats(
    matrix: number[][],
): { directed: boolean; count: number; message: string } {
    let count = 0;
    let directed = false;
    let message = "";
    const n = matrix.length;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (matrix[i][j] !== 0) {
                count++;
            }
            if (matrix[j][i] !== 0) {
                count++;
            }
            // just one deviation is enough to mark it as directed
            if (matrix[i][j] !== matrix[j][i]) {
                directed = true;
                message = `directed because matrix[${i}][${j}] = ${
                    matrix[i][j]
                } BUT matrix[${j}][${i}] = ${matrix[j][i]}`;
            }
        }
    }
    if (!directed) {
        count /= 2;
        message =
            "Edgecount was divided by 2 because matrix is symmetric on Hauptdiagonale";
    }
    return { directed, count, message };
}
function isQuadraticNumberArray(
    matrix: number[][],
): [boolean, string] {
    // TODO make three distinct functions
    const n = matrix.length;
    for (let i = 0; i < n; i++) {
        // Check if the row length is equal to n
        if (matrix[i].length !== n) {
            return [
                false,
                `${n} lines but line ${i} has ${matrix[i].length} columns`,
            ];
        }
        // and if the values are numbers
        for (const value of matrix[i]) {
            if (typeof value !== "number") {
                return [false, `Value "${value}" on line ${i} is not a number`];
            }
        }
    }
    return [true, ""];
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
        assert(isQuadraticNumberArray(matrix));
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
                const ending = dirEntry.name.split(".").pop()?.toLowerCase();
                if (!ending || !["json", "csv"].includes(ending)) continue;
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
            isQuadraticNumberArray(matrix),
            "isQuadraticSymmetricNumberArray() failed",
        );
        const { directed, count, message } = edgeStats(matrix);
        return c.json({
            "lines": matrix.length,
            "columns": matrix.length,
            "nodes": json.nodes,
            "edges": count,
            directed,
            message,
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
