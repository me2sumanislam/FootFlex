import { Router } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { getDB, saveDB, newId } from "../db.js";
import { auth, makeToken } from "../middleware/auth.js";

const router = Router();
const SIGNUP_BALANCE = 10000;
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, balance: u.balance, avatar: u.avatar || null });

router.post("/signup", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required." });
  if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });
  const db = getDB();
  if (db.users.find((u) => u.email === email.toLowerCase()))
    return res.status(409).json({ message: "This email is already registered. Try logging in." });
  const user = { id: newId(), name, email: email.toLowerCase(), password: bcrypt.hashSync(password, 10), balance: SIGNUP_BALANCE };
  db.users.push(user);
  saveDB(db);
  res.json({ token: makeToken(user), user: publicUser(user) });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getDB().users.find((u) => u.email === (email || "").toLowerCase());
  if (!user || !user.password || !bcrypt.compareSync(password || "", user.password))
    return res.status(401).json({ message: "Wrong email or password." });
  res.json({ token: makeToken(user), user: publicUser(user) });
});

router.post("/google", async (req, res) => {
  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: req.body.credential, audience: process.env.GOOGLE_CLIENT_ID });
    const { email, name, picture } = ticket.getPayload();
    const db = getDB();
    let user = db.users.find((u) => u.email === email.toLowerCase());
    if (!user) {
      user = { id: newId(), name, email: email.toLowerCase(), avatar: picture, balance: SIGNUP_BALANCE };
      db.users.push(user);
      saveDB(db);
    }
    res.json({ token: makeToken(user), user: publicUser(user) });
  } catch {
    res.status(401).json({ message: "Google sign-in failed. Check GOOGLE_CLIENT_ID." });
  }
});

router.get("/me", auth, (req, res) => {
  const user = getDB().users.find((u) => u.id === req.userId);
  if (!user) return res.status(401).json({ message: "Account not found." });
  res.json({ user: publicUser(user) });
});

export default router;
