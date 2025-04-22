# Graph Supply

In order to train programming algorithms, a set of samples is helpful, hopefully.

It's built on deno and hono. `deno task start` and it should run on your localhost.

For playing around, refer to [endpoints.rest](./endpoints.rest)

## Explanation for random

- nodes: desired node count
- density: (in %) likelyhood of each edge to exist
- weighted: (bool / default: false) add positive weights to each edge
- directed: (bool / default: false) be symmetric on main diagonal
- loops: (bool / default: false) allow loops
