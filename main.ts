import { assert } from "@std/assert";
import { Hono } from "jsr:@hono/hono";
import { cors } from "jsr:@hono/hono/cors";
import * as helpers from "./libbe/helpers.ts";
import { config } from "./libbe/config.ts";

config.baseUrl = Deno.env.get("BASE_URL") || "http://localhost:8080";
config.prefix = Deno.env.get("PREFIX") || "/";
config.baseUrlWithPrefix = `${config.baseUrl}${config.prefix}`;
config.listenHost = Deno.env.get("LISTEN_HOST") || "127.0.0.1";
config.listenPort = Number(Deno.env.get("LISTEN_PORT")) || 8080;
config.adjacencySimple = "adjacency-simple";
config.adjacencyWeighted = "adjacency-weighted";

interface AndyNode {
    id: number;
}
interface AndyEdge {
    n1: AndyNode;
    n2: AndyNode;
}
const honoOptions = {
    port: config.listenPort,
    hostname: config.listenHost,
    onListen: function (addr: Deno.NetAddr) {
        console.log(
            `@ ${
                new Date().toLocaleTimeString()
            } graphsupply listening on http://${addr.hostname}:${addr.port}${config.prefix}`,
        );
    },
};

const app = new Hono().basePath(config.prefix);
app.use("*", cors());
app.use("*", helpers.finalLogger);

app.get("/", helpers.indexHandler);
app.get("", helpers.indexHandler);
app.get("/list", helpers.rootHandler);
app.get(`/andy-json-originals`, async (c) => {
    const files = [];
    try {
        for await (
            const dirEntry of Deno.readDir("./graphs/andy-json-originals")
        ) {
            if (dirEntry.isFile) {
                files.push(
                    `${config.baseUrl}${c.req.path}/${dirEntry.name}`,
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
app.get(`/andy-json-originals/:filename`, async (c) => {
    const filename = c.req.param("filename");
    const filePath = `./graphs/andy-json-originals/${filename}`;
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
app.get(`/andy-json-cooked`, async (c) => {
    const files = [];
    try {
        for await (
            const dirEntry of Deno.readDir("./graphs/andy-json-originals")
        ) {
            if (dirEntry.isFile) {
                files.push(
                    `${config.baseUrl}${c.req.path}/${dirEntry.name}`,
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
app.get(`/andy-json-cooked/:filename`, async (c) => {
    const filename = c.req.param("filename");
    const filePath = `./graphs/andy-json-originals/${filename}`;
    try {
        const fileContent = await Deno.readTextFile(filePath);
        const jsonData = JSON.parse(fileContent);
        let nodes = jsonData[0];
        nodes = nodes.map((node: AndyNode) => node.id);
        let edges = jsonData[1];
        edges = edges.map((edge: AndyEdge) => [edge.n1.id, edge.n2.id]);
        const matrix = new Array(nodes.length).fill(0).map(() =>
            new Array(nodes.length).fill(0)
        );
        for (const edge of edges) {
            const i = edge[0];
            const j = edge[1];
            matrix[i][j] = 1;
            matrix[j][i] = 1;
        }
        assert(helpers.isQuadraticNumberArray(matrix));
        const { directed, count, message } = helpers.edgeStats(matrix);
        return c.json({
            "lines": matrix.length,
            "columns": matrix.length,
            "nodes": nodes.length,
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
app.get(`/${config.adjacencySimple}`, async (c) => {
    const files = [];
    try {
        for await (
            const dirEntry of Deno.readDir(`./graphs/${config.adjacencySimple}`)
        ) {
            if (dirEntry.isFile) {
                files.push(
                    `${config.baseUrlWithPrefix}/${config.adjacencySimple}/${dirEntry.name}`,
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
app.get(`/${config.adjacencySimple}/:filename`, async (c) => {
    const filename = c.req.param("filename");
    const filePath = `./graphs/${config.adjacencySimple}/${filename}`;
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
        assert(helpers.isQuadraticNumberArray(matrix));
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
app.get(`/${config.adjacencyWeighted}`, async (c) => {
    const files = [];
    try {
        for await (
            const dirEntry of Deno.readDir(
                `./graphs/${config.adjacencyWeighted}`,
            )
        ) {
            if (dirEntry.isFile) {
                const ending = dirEntry.name.split(".").pop()?.toLowerCase();
                if (!ending || !["json", "csv"].includes(ending)) continue;
                files.push(
                    `${config.baseUrlWithPrefix}/${config.adjacencyWeighted}/${dirEntry.name}`,
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
app.get(`/${config.adjacencyWeighted}/:filename`, async (c) => {
    const filename = c.req.param("filename");
    const filePath = `./graphs/${config.adjacencyWeighted}/${filename}`;
    try {
        const fileContent = await Deno.readTextFile(filePath);
        const ending = filename.split(".").pop()?.toLowerCase();
        if (ending === "json") {
            const json = JSON.parse(fileContent);
            const matrix = json.matrix;
            assert(
                helpers.isQuadraticNumberArray(matrix),
                "isQuadraticSymmetricNumberArray() failed",
            );
            const { directed, count, message } = helpers.edgeStats(matrix);
            return c.json({
                "lines": matrix.length,
                "columns": matrix.length,
                "nodes": json.nodes,
                "edges": count,
                directed,
                message,
                matrix,
            });
        }
        if (ending === "csv") {
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
            assert(helpers.isQuadraticNumberArray(matrix));
            return c.json({
                "lines": matrix.length,
                "columns": matrix.length,
                matrix,
            });
        }
        throw new Error(
            `Unsupported file format: ${ending}. Only JSON and CSV are supported.`,
        );
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
app.post("/random", async (c) => {
    const params = await c.req.json().catch(() => ({}));
    return helpers.random(c, params);
});
app.get("/random", (c) => {
    const params = c.req.query();
    return helpers.random(c, params);
});
Deno.serve(honoOptions, app.fetch);
