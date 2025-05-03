import { fail } from "@std/assert/fail";
import * as NT from "npm:neverthrow";
import { graphJson } from "./libbe/types.ts";

const crawled = new Set<string>();

async function crawl(baseUrl: string): Promise<void> {
    if (crawled.has(baseUrl)) {
        return;
    }
    console.log(`Crawling ${baseUrl}`);
    const retrieved = await getJson(baseUrl);
    crawled.add(baseUrl);
    if (retrieved.isErr()) {
        throw new Error(
            `Failed to retrieve JSON from ${baseUrl}: ${retrieved.error.message}`,
        );
    }
    const urls: string[] = [];
    const json = retrieved.value;
    if (Array.isArray(json)) {
        json.forEach((item) => {
            if (typeof item == "string") {
                urls.push(item);
            }
        });
    }
    urls.filter((url) => !crawled.has(url));
    for (const url of urls) {
        await crawl(url);
    }
    urls.forEach(async (url) => {
        await crawl(url);
    });
}
async function getJson(url: string): Promise<NT.Result<graphJson, Error>> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error(
                `Expected application/json but got ${contentType}`,
            );
        }
        if (response.status !== 200) {
            throw new Error(
                `Expected status 200 but got ${response.status}`,
            );
        }
        const json = await response.json();
        return new NT.Ok(json);
    } catch (error) {
        if (error instanceof Error) {
            return new NT.Err(error);
        }
        return new NT.Err(new Error(String(error)));
    }
}
Deno.test("Start Crawling", async () => {
    const baseUrl = Deno.env.get("BASE_URL") || "http://localhost:8080";
    const prefix = Deno.env.get("TESTPREFIX") || Deno.env.get("PREFIX") || "/";
    const baseUrlWithPrefix = `${baseUrl}${prefix}`;
    try {
        await crawl(baseUrlWithPrefix); // throws if an error occurs}
    } catch (error) {
        if (error instanceof Error) {
            fail(error.message);
        }
        fail(String(error));
    }
});
