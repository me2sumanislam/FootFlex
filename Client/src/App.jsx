 import { Routes, Route } from "react-router-dom";
 import "./App.css";
 import Navbar from "./components/Navbar";
 import AuthModal from "./components/AuthModal";
 import CartDrawer from "./components/CartDrawer";
 import Home from "./pages/Home";
 import Orders from "./pages/Orders";
 import { useApp } from "./store";
 
 export default function App() {
   const { toast } = useApp();
   return (
     <>
       <Navbar />
       <main>
         <Routes>
           <Route path="/" element={<Home />} />
           <Route path="/orders" element={<Orders />} />
         </Routes>
       </main>
       <footer className="footer">© 2026 FootFlex. Premium footwear, delivered.</footer>
       <AuthModal />
       <CartDrawer />
       {toast && <div className={`toast ${toast.type}`} role="status">{toast.msg}</div>}
     </>
   );
 }
 