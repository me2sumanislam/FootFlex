 import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../store";
import { taka, FALLBACK_IMG } from "../api";

export default function CartDrawer() {
  const { cartOpen, setCartOpen, cartItems, cartTotal, user, setQty, removeFromCart, checkout, notify } = useApp();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null);

  if (!cartOpen) return null;
  const close = () => { setCartOpen(false); setDone(null); setErr(""); };
  const short = user && cartTotal > user.balance;

  const pay = async () => {
    setBusy(true); setErr("");
    try { setDone(await checkout()); notify("Order placed successfully!"); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <div className="overlay right" onClick={close}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head"><h2>{done ? "Order confirmed" : "Your cart"}</h2><button className="close static" onClick={close} aria-label="Close">×</button></div>

        {done ? (
          <div className="success">
            <div className="tick">✓</div>
            <h3>Purchase successful</h3>
            <p className="muted">Order <b>{done.id}</b> · {taka(done.total)}</p>
            <span className="pill avail">{done.status}</span>
            <p className="muted small">Your new balance is {taka(user.balance)}. Track delivery under My orders.</p>
            <Link className="btn solid" to="/orders" onClick={close}>View my orders</Link>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="empty"><p>Your cart is empty.</p><button className="btn solid" onClick={close}>Browse shoes</button></div>
        ) : (
          <>
            <ul className="cart-list">
              {cartItems.map((i) => (
                <li key={i.id}>
                  <img src={i.img} alt="" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG; }} />
                  <div>
                    <b>{i.title}</b>
                    <span className="muted small">{taka(i.price)}</span>
                    <div className="qty">
                      <button onClick={() => setQty(i.id, i.qty - 1)} aria-label="Decrease">−</button>
                      <span>{i.qty}</span>
                      <button onClick={() => setQty(i.id, Math.min(i.stock, i.qty + 1))} disabled={i.qty >= i.stock} aria-label="Increase">+</button>
                      <button className="link" onClick={() => removeFromCart(i.id)}>Remove</button>
                    </div>
                  </div>
                  <b>{taka(i.price * i.qty)}</b>
                </li>
              ))}
            </ul>
            <div className="drawer-foot">
              <div className="row"><span className="muted">Your balance</span><span>{taka(user.balance)}</span></div>
              <div className="row total"><span>Total</span><strong>{taka(cartTotal)}</strong></div>
              {short && <p className="error">Not enough balance for this order. Remove an item.</p>}
              {err && <p className="error">{err}</p>}
              <button className="btn solid full" disabled={busy || short} onClick={pay}>{busy ? "Processing…" : `Pay ${taka(cartTotal)}`}</button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
