import cytoscape, { CytoscapeOptions, ElementsDefinition } from "cytoscape";

const cy_window_instance = globalThis.cytoscape as typeof import("cytoscape");
export function cytoFactory(
    elements: ElementsDefinition,
    weighted: boolean,
    directed: boolean,
) {
    console.log("cytofactory got elements:", elements);
    const options = optionFactory(elements, weighted, directed);
    return cy_window_instance(options);
}

function get_edge_style(
    weighted: boolean,
    directed: boolean,
): cytoscape.Css.Edge {
    return {
        "width": "0.2px",
        "font-size": "4px",
        "color": "#999",
        "label": weighted ? "data(label)" : "",
        "line-color": "#999",
        "target-arrow-color": "#999",
        "target-arrow-shape": directed ? "triangle" : "none", // "none", TODO
        "arrow-scale": 0.2,
        "curve-style": "bezier",
        //"text-outline-color": "#333", // Black outline
        //"text-outline-width": "0.2px",
    };
}

function optionFactory(
    elements: ElementsDefinition,
    weighted: boolean,
    directed: boolean,
): CytoscapeOptions {
    const edgestyle = get_edge_style(weighted, directed);

    return {
        elements: elements,
        container: document.getElementById("cy-canvas"), // container to render in
        style: [ // the stylesheet for the graph
            {
                selector: "node",
                style: {
                    "background-color": "#aaa",
                    "label": "data(label)",
                    "height": "5px",
                    "width": "5px",
                    "color": "#333",
                    "font-size": "4px",
                    "text-halign": "center", // Center horizontally
                    "text-valign": "center", // Center vertically
                    "text-margin-y": 0, // No vertical margin
                    "text-margin-x": 0, // No horizontal margin
                },
            },
            {
                selector: "node.highlighted",
                style: {
                    "background-color": "#f60",
                    "color": "#600",
                },
            },
            {
                selector: "edge",
                style: edgestyle, // that's the actual clue of this function
            },
            {
                selector: "edge.highlighted",
                style: {
                    "line-color": "#f60",
                    "target-arrow-color": "#f60",
                    "width": 1.5,
                },
            },
            {
                selector: "edge[source=target]",
                style: {
                    "curve-style": "bezier",
                    "control-point-step-size": 7,
                    "control-point-distance": 20,
                    "loop-direction": "0deg",
                    "loop-sweep": "100deg",
                },
            },
        ],
        layout: {
            name: "cose",
            fit: true, // whether to fit the viewport to the graph
            animate: true, // whether to transition the node positions
            spacingFactor: .5, // the spacing factor to use for the layout
        },
        wheelSensitivity: 0.1,
    };
}
