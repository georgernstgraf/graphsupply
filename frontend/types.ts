export interface SupplyJson {
    matrix: number[][];
    "metadata": {
        "params": {
            "nodes": number;
            "density": number;
            "directed": boolean;
            "weighted": boolean;
            "loops": boolean;
        };
    };
    "node_names"?: string[];
    "edges": 8;
    "message": "Graph generated with 80% density";
    "understood_params": Record<string, string>;
}
