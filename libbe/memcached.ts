import { Memcached } from "@avroit/memcached";
export const store = new Memcached({ host: "localhost", port: 11211 });
