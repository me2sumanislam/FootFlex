 import jwt from "jsonwebtoken";
 
 const secret = () => process.env.JWT_SECRET || "dev-secret-change-me";
 
 export const makeToken = (user) => jwt.sign({ id: user.id }, secret(), { expiresIn: "7d" });
 
 export function auth(req, res, next) {
   const token = (req.headers.authorization || "").replace("Bearer ", "");
   try {
     req.userId = jwt.verify(token, secret()).id;
     next();
   } catch {
     res.status(401).json({ message: "Please log in to continue." });
   }
 }
 