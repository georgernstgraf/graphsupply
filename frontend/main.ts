import { App } from "./app.ts";

declare global {
    // Augment the globalThis type to include 'app'
    var app: App;
}

function main(): void {
    const app = new App();
    globalThis.app = app;
}

main();
