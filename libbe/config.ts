interface Config {
    baseUrl?: string;
    prefix?: string;
    baseUrlWithPrefix?: string;
    listenHost?: string;
    listenPort?: number;
    adjacencySimple?: string;
    adjacencyWeighted?: string;
    secret?: string;
}

export const config: Config = {};
