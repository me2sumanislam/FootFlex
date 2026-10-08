 import { Link, NavLink } from "react-router-dom";
import { useApp } from "../store";
import { taka } from "../api";

export default function Navbar() {
  const { user, logout, setAuthOpen, setCartOpen, cartCount, requireLogin } = useApp();
  return (
    <header className="nav">
      <Link to="/" className="logo">Foot<span>Flex</span></Link>
      <nav className="nav-links">
        <NavLink to="/" end>Shop</NavLink>
        <NavLink to="/orders" onClick={(e) => { if (!requireLogin("Log in to see your orders.")) e.preventDefault(); }}>My orders</NavLink>
      </nav>
      <div className="nav-right">
        <button className="btn ghost cart-btn" onClick={() => requireLogin("Log in to open your cart.") && setCartOpen(true)}>
          Cart {cartCount > 0 && <b className="badge">{cartCount}</b>}
        </button>
        {user ? (
          <>
            <span className="balance" title="Your balance">{taka(user.balance)}</span>
            <span className="avatar" title={user.email}>{user.avatar ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" /> : user.name[0].toUpperCase()}</span>
            <button className="btn ghost" onClick={logout}>Log out</button>
          </>
        ) : (
          <>
            <button className="btn ghost" onClick={() => setAuthOpen({ mode: "login" })}>Log in</button>
            <button className="btn solid" onClick={() => setAuthOpen({ mode: "signup" })}>Sign up</button>
          </>
        )}
      </div>
    </header>
  );
}
