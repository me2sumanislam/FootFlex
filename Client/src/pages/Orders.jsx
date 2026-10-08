 import { useEffect, useState } from "react";
import { api, taka, FALLBACK_IMG } from "../api";
import { useApp } from "../store";

const STEPS = ["Confirmed", "Packed", "Shipped", "Delivered"];

export default function Orders() {
  const { user, setAuthOpen } = useApp();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    if (!user) return;
    const load = () => api("/orders").then(setOrders).catch(() => {});
    load();
    const t = setInterval(load, 15000); // live status refresh
    return () => clearInterval(t);
  }, [user]);

  if (!user)
    return <section className="page center"><h2>Log in to see your orders</h2><button className="btn solid" onClick={() => setAuthOpen({ mode: "login" })}>Log in</button></section>;

  return (
    <section className="page">
      <h2>My orders</h2>
      {orders === null ? <p className="muted">Loading…</p> : orders.length === 0 ? <p className="muted">No orders yet. Your first pair is waiting.</p> : (
        <div className="orders">
          {orders.map((o) => {
            const at = STEPS.indexOf(o.status);
            return (
              <article key={o.id} className="order">
                <div className="row">
                  <div><b>{o.id}</b><span className="muted small"> · {new Date(o.createdAt).toLocaleString()}</span></div>
                  <span className={`pill ${o.status === "Delivered" ? "avail" : "few"}`}>{o.status}</span>
                </div>
                <ol className="steps">{STEPS.map((s, i) => <li key={s} className={i <= at ? "done" : ""}>{s}</li>)}</ol>
                <ul className="order-items">
                  {o.items.map((i) => (
                    <li key={i.id}>
                      <img src={i.img} alt="" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG; }} />
                      <span>{i.title} × {i.qty}</span><b>{taka(i.price * i.qty)}</b>
                    </li>
                  ))}
                </ul>
                <div className="row total"><span>Total paid</span><strong>{taka(o.total)}</strong></div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
