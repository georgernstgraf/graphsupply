# Graph Supply

## Generate your dream-graph 😉

In order to train programming algorithms, a set of samples is helpful, hopefully.

It's built on deno and hono. `deno task start` and it should run on your localhost.
It's also deployed on <https://grafg1.spengergasse.at/graphsupply>,
for convenience.
For playing around, refer to [endpoints.rest](./endpoints.rest)

## Explanation for random checkboxes

- nodes: desired node count
- density: (in %) likelyhood of each edge to exist
- weighted: (bool / default: false) add positive weights to each edge
- directed: (bool / default: false) be symmetric on main diagonal
- loops: (bool / default: false) allow loops

## Tech Stack

- deno (ts runtime)
- hono (webapp framework)
- session management
- rest
- cytoscape.js (in the frontend)