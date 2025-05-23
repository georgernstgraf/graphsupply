import { Context } from "jsr:@hono/hono";
import { config } from "../libbe/config.ts";
export async function finalLogger(c: Context, next: () => Promise<void>) {
    await next();
    console.log(
        `${
            new Date().toLocaleTimeString()
        } ${c.res.status} ${c.req.method} ${c.req.path}`,
    );
}
export async function rootHandler(c: Context) {
    const dirs = [];
    try {
        for await (const dirEntry of Deno.readDir("./graphs")) {
            if (dirEntry.isDirectory) {
                dirs.push(`${config.baseUrlWithPrefix}/${dirEntry.name}`);
            }
        }
        dirs.push(`${config.baseUrlWithPrefix}/andy-json-cooked`);
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
}

export function edgeStats(
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
export function isQuadraticNumberArray(
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

export function random(c: Context, queryParams: Record<string, string>) {
    const understood_params = {
        "density": "0-100% (number, default: 50)",
        "nodes": "Desired number of nodes 2-200 (number, default: 10)",
        "directed":
            "Ob der Graph gerichtet sein soll (boolean, default: false)",
        "weighted":
            "Ob der Graph gewichtet sein soll für Dijkstra (boolean, default: false)",
        "loops": "Schlingen? (boolean, default: false)",
    };
    const density = Number(queryParams.density) || 50;
    if (density < 0 || density > 100) {
        return c.json(
            { error: `Density must be between 0 and 100` },
            400,
        );
    }
    const nodes = Number(queryParams.nodes) || 10;
    if (nodes < 2 || nodes > 200) {
        return c.json(
            { error: `Nodes must be between 2 and 200` },
            400,
        );
    }
    const directed = queryParams.directed ? true : false;
    const weighted = queryParams.weighted ? true : false;
    const loops = queryParams.loops ? true : false;
    const matrix = Array.from(
        { length: nodes },
        () => Array.from({ length: nodes }, () => 0),
    );
    const chosen = () => {
        const random = Math.random() * 100;
        return random < density;
    };
    // do all rows; populate them with "1" for now
    let edge_count = 0;
    for (let row = 0; row < nodes; row++) {
        // for inner loop directed comes into play, if so i do upper square
        // start with row if loops, otherwise row + 1
        // condition is right border
        for (
            // the start is tricky and depends on "directed" and "loops"
            let column = directed ? 0 : row + (loops ? 0 : 1);
            column < nodes;
            column++
        ) { // do all columns
            if (row === column && !loops) continue; // keep main diagonal at 0
            if (!chosen()) continue;
            matrix[row][column] = 1;
            edge_count++;
            if (!directed) { // ie symmetric
                matrix[column][row] = matrix[row][column];
            }
        }
    }
    // set weights if needed
    if (weighted) {
        const weights = Array.from({ length: edge_count }, (_, i) => i + 1);
        weights.sort((_) => Math.random() - 0.5);
        for (let row = 0; row < nodes; row++) {
            for (
                // the start is tricky and depends on "directed" and "loops"
                let column = directed ? 0 : row + (loops ? 0 : 1);
                column < nodes;
                column++
            ) { // do all columns
                if (row === column && !loops) continue; // keep main diagonal at 0
                if (matrix[row][column] == 1) {
                    matrix[row][column] = weights.pop() ?? 0; // ?? 0 to keep ts happy
                }
                if (!directed) { // ie symmetric => copy to lower-left half
                    matrix[column][row] = matrix[row][column];
                }
            }
        }
    }
    const params = {
        nodes,
        density,
        directed,
        weighted,
        loops,
    };
    const fullJson = {
        "metadata": {
            params,
            "edges": directed ? edge_count : edge_count / 2,
            message: `Graph generated with ${density}% density`,
            understood_params,
        },
        matrix,
    };
    const sess = c.get("session");
    sess.set("graph", fullJson);
    return c.json(fullJson);
}
