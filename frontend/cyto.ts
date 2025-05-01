import { CytoscapeOptions, ElementsDefinition } from "cytoscape";

const cytoscape = globalThis.cytoscape as typeof import("cytoscape");
export function cytoFactory(elements: ElementsDefinition) {
    console.log("Cytoscape elements:", elements);
    options.elements = elements;
    return cytoscape(options);
}
const options: CytoscapeOptions = {
    elements: [],
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
            style: {
                "width": "0.2px",
                "font-size": "4px",
                "color": "#333",
                "label": "data(label)",
                "line-color": "red",
                "target-arrow-color": "red",
                "target-arrow-shape": "triangle", // "none", TODO
                "arrow-scale": 0.2,
                "curve-style": "bezier",
                //"text-outline-color": "#333", // Black outline
                //"text-outline-width": "0.2px",
            },
        },
        {
            selector: "edge.highlighted",
            style: {
                "line-color": "#f60",
                "target-arrow-color": "#f60",
                "width": 1.5,
            },
        },
    ],
    layout: {
        name: "cose",
        fit: true, // whether to fit the viewport to the graph
        animate: true, // whether to transition the node positions
        spacingFactor: .5, // the spacing factor to use for the layout
    },
};
