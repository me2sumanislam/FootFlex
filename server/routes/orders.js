 import { Router } from "express";
 import { getDB, saveDB, getProducts, saveProducts } from "../db.js";
 import { auth } from "../middleware/auth.js";
 
 const router = Router();
 
 // Demo delivery timeline (minutes after purchase)
 const STAGES = [["Confirmed", 0], ["Packed", 2], ["Shipped", 5], ["Delivered", 10]];
 const orderStatus = (createdAt) => {
   const mins = (Date.now() - new Date(createdAt).getTime()) / 60000;
   return [...STAGES].reverse().find(([, m]) => mins >= m)[0];
 };
 const withStatus = (o) => ({ ...o, status: orderStatus(o.createdAt) });
 
 router.post("/", auth, (req, res) => {
   const items = req.body.items;
   if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: "Your cart is empty." });
 
   const db = getDB();
   const products = getProducts();
   const user = db.users.find((u) => u.id === req.userId);
   if (!user) return res.status(401).json({ message: "Account not found." });
 
   const lines = [];
   let total = 0;
   for (const { id, qty } of items) {
     const p = products.find((x) => x.id === id);
     const q = Math.max(1, parseInt(qty) || 1);
     if (!p) return res.status(404).json({ message: "A product in your cart no longer exists." });
     if (p.status === "sold" || p.stock < q)
       return res.status(409).json({ message: `${p.title} is ${p.status === "sold" ? "sold out" : "low on stock (" + p.stock + " left)"}. Update your cart.` });
     lines.push({ id: p.id, title: p.title, img: p.img, price: p.price, qty: q });
     total += p.price * q;
   }
   if (user.balance < total)
     return res.status(402).json({ message: `Not enough balance. You need ৳${total.toLocaleString()} but have ৳${user.balance.toLocaleString()}.` });
 
   user.balance -= total;
   for (const l of lines) {
     const p = products.find((x) => x.id === l.id);
     p.stock -= l.qty;
     if (p.stock <= 0) { p.stock = 0; p.status = "sold"; }
   }
   const order = { id: "FF-" + Math.floor(100000 + Math.random() * 900000), userId: user.id, items: lines, total, createdAt: new Date().toISOString() };
   db.orders.push(order);
   saveDB(db);
   saveProducts(products);
   res.json({ order: withStatus(order), balance: user.balance });
 });
 
 router.get("/", auth, (req, res) => {
   const mine = getDB().orders.filter((o) => o.userId === req.userId).reverse();
   res.json(mine.map(withStatus));
 });
 
 export default router;
 