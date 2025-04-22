import { assert } from "@std/assert";
import { Context, Hono } from "jsr:@hono/hono";
import { cors } from "jsr:@hono/hono/cors";

const baseUrl = Deno.env.get("BASE_URL") || "http://localhost:8080";
const prefix = Deno.env.get("PREFIX") || "/";
const baseUrlWithPrefix = `${baseUrl}${prefix}`;
const listenHost = Deno.env.get("LISTEN_HOST") || "127.0.0.1";
const listenPort = Number(Deno.env.get("LISTEN_PORT")) || 8080;
const adjacencySimple = "adjacency-simple";
const adjacencyWeighted = "adjacency-weighted";

interface AndyNode {
    id: number;
}
interface AndyEdge {
    n1: AndyNode;
    n2: AndyNode;
}
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
    port: listenPort,
    hostname: listenHost,
    onListen: function (addr: Deno.NetAddr) {
        console.log(
            `@ ${
                new Date().toLocaleTimeString()
            } graphsupply listening on http://${addr.hostname}:${addr.port}${prefix}`,
        );
    },
};

const rootHandler = async (c: Context) => {
    const dirs = [];
    try {
        for await (const dirEntry of Deno.readDir("./graphs")) {
            if (dirEntry.isDirectory) {
                dirs.push(`${baseUrlWithPrefix}/${dirEntry.name}`);
            }
        }
        dirs.push(`${baseUrlWithPrefix}/andy-json-cooked`);
        dirs.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
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
};
const app = new Hono().basePath(prefix);
app.use("*", cors());
app.use("*", async (c, next) => {
    await next();
    console.log(
        `${
            new Date().toLocaleTimeString()
        } ${c.res.status} ${c.req.method} ${c.req.path}`,
    );
});
app.get("/", rootHandler);
app.get("", rootHandler);
app.get(`/andy-json-originals`, async (c) => {
    const files = [];
    try {
        for await (
            const dirEntry of Deno.readDir("./graphs/andy-json-originals")
        ) {
            if (dirEntry.isFile) {
                files.push(
                    `${baseUrl}${c.req.path}/${dirEntry.name}`,
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
                    `${baseUrl}${c.req.path}/${dirEntry.name}`,
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
        assert(isQuadraticNumberArray(matrix));
        const { directed, count, message } = edgeStats(matrix);
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
app.get(`/${adjacencySimple}`, async (c) => {
    const files = [];
    try {
        for await (
            const dirEntry of Deno.readDir(`./graphs/${adjacencySimple}`)
        ) {
            if (dirEntry.isFile) {
                files.push(
                    `${baseUrlWithPrefix}/${adjacencySimple}/${dirEntry.name}`,
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
app.get(`/${adjacencySimple}/:filename`, async (c) => {
    const filename = c.req.param("filename");
    const filePath = `./graphs/${adjacencySimple}/${filename}`;
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
app.get(`/${adjacencyWeighted}`, async (c) => {
    const files = [];
    try {
        for await (
            const dirEntry of Deno.readDir(`./graphs/${adjacencyWeighted}`)
        ) {
            if (dirEntry.isFile) {
                const ending = dirEntry.name.split(".").pop()?.toLowerCase();
                if (!ending || !["json", "csv"].includes(ending)) continue;
                files.push(
                    `${baseUrlWithPrefix}/${adjacencyWeighted}/${dirEntry.name}`,
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
app.get(`/${adjacencyWeighted}/:filename`, async (c) => {
    const filename = c.req.param("filename");
    const filePath = `./graphs/${adjacencyWeighted}/${filename}`;
    try {
        const fileContent = await Deno.readTextFile(filePath);
        const ending = filename.split(".").pop()?.toLowerCase();
        if (ending === "json") {
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
            assert(isQuadraticNumberArray(matrix));
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
    return random(c, params);
});
app.get("/random", (c) => {
    const params = c.req.query();
    return random(c, params);
});
function random(c: Context, params: Record<string, unknown>) {
    const understood_params = {
        "density": "0-100% (number, default: 50)",
        "nodes": "Desired number of nodes 2-200 (number, default: 10)",
        "directed":
            "Ob der Graph gerichtet sein soll (boolean, default: false)",
        "weighted":
            "Ob der Graph gewichtet sein soll für Dijkstra (boolean, default: false)",
        "loops": "Schlingen? (boolean, default: false)",
    };
    const density = Number(params.density) || 50;
    if (density < 0 || density > 100) {
        return c.json(
            { error: `Density must be between 0 and 100` },
            400,
        );
    }
    const nodes = Number(params.nodes) || 10;
    if (nodes < 2 || nodes > 200) {
        return c.json(
            { error: `Nodes must be between 2 and 200` },
            400,
        );
    }
    const directed = params.directed || false;
    const weighted = params.weighted || false;
    const loops = params.loops || false;
    const matrix = Array.from(
        { length: nodes },
        () => Array.from({ length: nodes }, () => 0),
    );
    const chosen = () => {
        const random = Math.random() * 100;
        return random < density;
    };
    const rndWeight = () => {
        return Math.floor(Math.random() * nodes + 1);
    };
    // do all rows
    for (let row = 0; row < nodes; row++) {
        // for inner loop directed comes into play, if so i do upper square
        // start with row if loops, otherwise row + 1
        // condition is right border
        for (
            let column = directed ? 0 : row + (loops ? 0 : 1);
            column < nodes;
            column++
        ) { // do all columns
            if (row === column && !loops) continue; // keep main diagonal at 0
            if (!chosen()) continue;
            matrix[row][column] = weighted ? rndWeight() : 1;
            if (!directed) { // ie symmetric
                matrix[column][row] = matrix[row][column];
            }
        }
    }
    const edges = matrix.reduce((acc, row) => {
        return acc + row.reduce((inner_acc, value) => {
            return inner_acc + (value !== 0 ? 1 : 0);
        }, 0);
    }, 0);
    return c.json({
        "lines": matrix.length,
        "columns": matrix.length,
        "nodes": nodes,
        "edges": directed ? edges : edges / 2,
        directed,
        message: `Graph generated with ${density}% density`,
        understood_params,
        params,
        matrix,
    });
}
Deno.serve(honoOptions, app.fetch);
