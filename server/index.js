 import "dotenv/config";
 import express from "express";
 import cors from "cors";
 import bcrypt from "bcryptjs";
 import jwt from "jsonwebtoken";
 import { OAuth2Client } from "google-auth-library";
 import fs from "fs";
 import path from "path";
 import { fileURLToPath } from "url";
 
 const __dirname = path.dirname(fileURLToPath(import.meta.url));
 const DB_FILE = path.join(__dirname, "data/db.json");
 const PRODUCTS_FILE = path.join(__dirname, "data/products.json");
 const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
 const PORT = process.env.PORT || 5000;
 const SIGNUP_BALANCE = 10000;
 const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
 
 const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
 const write = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));
 
 const app = express();
 app.use(cors());
 app.use(express.json());
 
 const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, balance: u.balance, avatar: u.avatar || null });
 const makeToken = (u) => jwt.sign({ id: u.id }, SECRET, { expiresIn: "7d" });
 const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
 
 function auth(req, res, next) {
   const token = (req.headers.authorization || "").replace("Bearer ", "");
   try {
     req.userId = jwt.verify(token, SECRET).id;
     next();
   } catch {
     res.status(401).json({ message: "Please log in to continue." });
   }
 }
 
 // ---------- AUTH ----------
 app.post("/api/auth/signup", (req, res) => {
   const { name, email, password } = req.body;
   if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required." });
   if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });
   const db = read(DB_FILE);
   if (db.users.find((u) => u.email === email.toLowerCase()))
     return res.status(409).json({ message: "This email is already registered. Try logging in." });
   const user = { id: newId(), name, email: email.toLowerCase(), password: bcrypt.hashSync(password, 10), balance: SIGNUP_BALANCE };
   db.users.push(user);
   write(DB_FILE, db);
   res.json({ token: makeToken(user), user: publicUser(user) });
 });
 
 app.post("/api/auth/login", (req, res) => {
   const { email, password } = req.body;
   const user = read(DB_FILE).users.find((u) => u.email === (email || "").toLowerCase());
   if (!user || !user.password || !bcrypt.compareSync(password || "", user.password))
     return res.status(401).json({ message: "Wrong email or password." });
   res.json({ token: makeToken(user), user: publicUser(user) });
 });
 
 app.post("/api/auth/google", async (req, res) => {
   try {
     const ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: process.env.GOOGLE_CLIENT_ID });
     const { email, name, picture } = ticket.getPayload();
     const db = read(DB_FILE);
     let user = db.users.find((u) => u.email === email.toLowerCase());
     if (!user) {
       user = { id: newId(), name, email: email.toLowerCase(), avatar: picture, balance: SIGNUP_BALANCE };
       db.users.push(user);
       write(DB_FILE, db);
     }
     res.json({ token: makeToken(user), user: publicUser(user) });
   } catch (e) {
     res.status(401).json({ message: "Google sign-in failed. Check GOOGLE_CLIENT_ID." });
   }
 });
 
 app.get("/api/auth/me", auth, (req, res) => {
   const user = read(DB_FILE).users.find((u) => u.id === req.userId);
   if (!user) return res.status(401).json({ message: "Account not found." });
   res.json({ user: publicUser(user) });
 });
 
 // ---------- PRODUCTS ----------
 app.get("/api/products", (_req, res) => res.json(read(PRODUCTS_FILE)));
 
 // ---------- ORDERS ----------
 // Demo delivery timeline (minutes after purchase)
 const STAGES = [["Confirmed", 0], ["Packed", 2], ["Shipped", 5], ["Delivered", 10]];
 const orderStatus = (createdAt) => {
   const mins = (Date.now() - new Date(createdAt).getTime()) / 60000;
   return [...STAGES].reverse().find(([, m]) => mins >= m)[0];
 };
 const withStatus = (o) => ({ ...o, status: orderStatus(o.createdAt) });
 
 app.post("/api/orders", auth, (req, res) => {
   const items = req.body.items;
   if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: "Your cart is empty." });
 
   const db = read(DB_FILE);
   const products = read(PRODUCTS_FILE);
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
   write(DB_FILE, db);
   write(PRODUCTS_FILE, products);
   res.json({ order: withStatus(order), balance: user.balance });
 });
 
 app.get("/api/orders", auth, (req, res) => {
   const mine = read(DB_FILE).orders.filter((o) => o.userId === req.userId).reverse();
   res.json(mine.map(withStatus));
 });
 
 app.listen(PORT, () => console.log(`FootFlex server running on http://localhost:${PORT}`));
 