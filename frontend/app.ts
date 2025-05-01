import { cytoFactory } from "./cytofactory.ts";
import { Core, ElementsDefinition } from "cytoscape";
import { SupplyJson } from "./types.ts";
declare global {
    var cy: ReturnType<typeof cytoFactory>;
}

export class App {
    cy: Core | null = null;
    dom_nodes: Record<string, HTMLElement | null> = {};
    wish_config: Record<string, number | boolean> = {};
    graph_json: null | SupplyJson = null;
    constructor() {
        console.log("App initialized");
        this.init();
    }
    init() { // Registering Dom Nodes and putting event listeners on them
        console.log("init called");
        this.dom_nodes["in_density"] = document.getElementById("in-density");
        this.dom_nodes["in_directed"] = document.getElementById("in-directed");
        this.dom_nodes["in_weighted"] = document.getElementById("in-weighted");
        this.dom_nodes["in_loops"] = document.getElementById("in-loops");
        this.dom_nodes["in_nodes"] = document.getElementById("in-nodes");
        this.dom_nodes["bu_dl_json"] = document.getElementById("bu-dl-json");
        this.dom_nodes["bu_dl_csv"] = document.getElementById("bu-dl-csv");
        this.dom_nodes["bu_load"] = document.getElementById("bu-load");
        this.dom_nodes["bu_load"]?.addEventListener("click", async () => {
            this.poulate_wish_config();
            console.log(
                "init done, dom nodes",
                this.dom_nodes,
            );
            try {
                const response = await fetch("random", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(this.wish_config),
                });
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                this.graph_json = await response.json();
            } catch (error) {
                console.error("Error fetching random graph:", error);
            }
            console.log("Graph JSON", this.graph_json);
            this.paint_graph(this.graph_json);
        });
    }
    poulate_wish_config() { // Update the wish config based on the dom nodes
        console.log("update_wish_config called");
        this.wish_config["density"] =
            (this.dom_nodes["in_density"] as HTMLInputElement).valueAsNumber;
        this.wish_config["directed"] =
            (this.dom_nodes["in_directed"] as HTMLInputElement).checked;
        this.wish_config["weighted"] =
            (this.dom_nodes["in_weighted"] as HTMLInputElement).checked;
        this.wish_config["loops"] =
            (this.dom_nodes["in_loops"] as HTMLInputElement).checked;
        this.wish_config["nodes"] =
            (this.dom_nodes["in_nodes"] as HTMLInputElement).valueAsNumber;
        console.log("wish_config updated", this.wish_config);
    }
    static json_add_named_nodes(json: SupplyJson) {
        // letters or numbers depending on matrix.length
        let letters;
        const length = json.matrix.length;
        if (length > 26) {
            letters = Array.from(
                { length },
                (_, i) => String(i + 1),
            );
        } else {
            letters = Array.from(
                { length },
                (_, i) => String.fromCharCode(65 + i),
            );
        }
        json.node_names = letters;
    }
    static createId(a: string, b: string): string {
        return a < b ? `${a}|${b}` : `${b}|${a}`;
    }

    paint_graph(json: SupplyJson | null) {
        if (!json) {
            console.error("No graph data to paint");
            return;
        }
        if (!json.node_names) {
            App.json_add_named_nodes(json);
        }
        const names = json.node_names!;

        const elements: ElementsDefinition = { nodes: [], edges: [] };
        // Create nodes first
        for (const name of names) {
            elements.nodes.push({ data: { id: name, label: name } });
        }
        // Create edges
        const weighted = json.metadata.params.weighted;
        const directed = json.metadata.params.directed;

        for (let row = 0; row < names.length; row++) { // All rows in any case
            // problem is: the undirected graph has 2 symmetric edges in the matrix,
            // which we do not want to create here

            // if it has loops, it must be wanted that we display them.

            for (let col = directed ? 0 : row; col < names.length; col++) { // only upper right triangle
                if (json.matrix[row][col] > 0) {
                    elements.edges.push({
                        data: {
                            id: App.createId(names[row], names[col]),
                            source: names[row],
                            target: names[col],
                            weight: json.matrix[row][col], // number, 1 or weight
                            label: json.matrix[row][col],
                        },
                    });
                }
            }
        }
        if (globalThis.cy) {
            globalThis.cy.destroy();
        }
        const cy = cytoFactory(elements, weighted, directed);
        globalThis.cy = cy;
        this.cy = cy;
    }
}
