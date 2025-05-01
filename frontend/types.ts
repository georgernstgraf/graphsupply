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
}
