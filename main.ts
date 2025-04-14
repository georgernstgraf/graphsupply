import { assert } from "@std/assert/assert";
import { assertEquals } from "@std/assert/equals";
import { Hono } from "jsr:@hono/hono";

const base_url = Deno.env.get("BASE_URL") ||
    "http://localhost:8000/graphsupply";
const prefix = Deno.env.get("PREFIX") || "graphsupply";

const app = new Hono();

app.get("/", (c) => {
    return c.text("Hello Hono!");
});
app.get(`/${prefix}/type`, async (c) => {
    const dirs = [];
    try {
        for await (const dirEntry of Deno.readDir("./graphs")) {
            if (dirEntry.isDirectory) {
                dirs.push(`${base_url}/type/${dirEntry.name}`);
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
app.get(`/${prefix}/type/andy-json`, async (c) => {
    const files = [];
    try {
        for await (const dirEntry of Deno.readDir("./graphs/andy-json")) {
            if (dirEntry.isFile) {
                files.push(
                    `${base_url}/type/andy-json/${dirEntry.name}`,
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
app.get(`/${prefix}/type/andy-json/:filename`, async (c) => {
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
app.get(`/${prefix}/type/matrix-csv`, async (c) => {
    const files = [];
    try {
        for await (const dirEntry of Deno.readDir("./graphs/matrix-csv")) {
            if (dirEntry.isFile) {
                files.push(
                    `${base_url}/type/matrix-csv/${dirEntry.name}`,
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
app.get(`/${prefix}/type/matrix-csv/:filename`, async (c) => {
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

Deno.serve(app.fetch);
