import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "data");
const load = (name) => JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
const save = (name, data) => fs.writeFileSync(path.join(dir, name), JSON.stringify(data, null, 2));

// users + orders
export const getDB = () => load("db.json");
export const saveDB = (data) => save("db.json", data);

// products
export const getProducts = () => load("products.json");
export const saveProducts = (data) => save("products.json", data);

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
