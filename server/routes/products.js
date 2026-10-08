 import { Router } from "express";
 import { getProducts } from "../db.js";
 
 const router = Router();
 router.get("/", (_req, res) => res.json(getProducts()));
 export default router;
 