 import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "./api";

const Ctx = createContext();
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("ff_cart") || "[]")); // [{id, qty}]
  const [authOpen, setAuthOpen] = useState(null); // null | { reason }
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = useCallback((msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  }, []);

  const loadProducts = useCallback(
  () =>
    api("/products")
      .then((d) => {
        if (!Array.isArray(d)) throw new Error("bad response");
        setProducts(d);
      })
      .catch(() => notify("Could not load products. Is the server running?", "err")),
  [notify]
);

  useEffect(() => {
    loadProducts();
    if (localStorage.getItem("ff_token")) api("/auth/me").then((r) => setUser(r.user)).catch(() => localStorage.removeItem("ff_token"));
  }, [loadProducts]);

  useEffect(() => localStorage.setItem("ff_cart", JSON.stringify(cart)), [cart]);

  const finishAuth = ({ token, user }) => {
    localStorage.setItem("ff_token", token);
    setUser(user);
    setAuthOpen(null);
    notify(`Welcome, ${user.name.split(" ")[0]}! Balance: ৳${user.balance.toLocaleString("en-IN")}`);
  };
  const login = async (email, password) => finishAuth(await api("/auth/login", { method: "POST", body: { email, password } }));
  const signup = async (name, email, password) => finishAuth(await api("/auth/signup", { method: "POST", body: { name, email, password } }));
  const googleLogin = async (credential) => finishAuth(await api("/auth/google", { method: "POST", body: { credential } }));
  const logout = () => {
    localStorage.removeItem("ff_token");
    setUser(null);
    setCart([]);
    setCartOpen(false);
    notify("Logged out.");
  };

  const requireLogin = (reason) => {
    if (user) return true;
    setAuthOpen({ reason });
    return false;
  };

  const addToCart = (p) => {
    if (!requireLogin("Log in to add shoes to your cart.")) return;
    setCart((c) => {
      const row = c.find((r) => r.id === p.id);
      if (row) return c.map((r) => (r.id === p.id ? { ...r, qty: Math.min(p.stock, r.qty + 1) } : r));
      return [...c, { id: p.id, qty: 1 }];
    });
    notify(`${p.title} added to cart`);
  };
  const setQty = (id, qty) => setCart((c) => (qty < 1 ? c.filter((r) => r.id !== id) : c.map((r) => (r.id === id ? { ...r, qty } : r))));
  const removeFromCart = (id) => setCart((c) => c.filter((r) => r.id !== id));

  const checkout = async () => {
    const res = await api("/orders", { method: "POST", body: { items: cart } });
    setUser((u) => ({ ...u, balance: res.balance }));
    setCart([]);
    loadProducts();
    return res.order;
  };

  const cartItems = cart.map((r) => ({ ...products.find((p) => p.id === r.id), qty: r.qty })).filter((i) => i.id);
  const cartCount = cartItems.reduce((n, i) => n + i.qty, 0);
  const cartTotal = cartItems.reduce((n, i) => n + i.qty * i.price, 0);

  return (
    <Ctx.Provider value={{ user, products, cartItems, cartCount, cartTotal, authOpen, setAuthOpen, cartOpen, setCartOpen, toast, notify,
      login, signup, googleLogin, logout, requireLogin, addToCart, setQty, removeFromCart, checkout }}>
      {children}
    </Ctx.Provider>
  );
}
