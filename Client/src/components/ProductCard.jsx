 import { useApp } from "../store";
import { taka, FALLBACK_IMG } from "../api";

export const pillOf = (p) =>
  p.status === "sold" ? { cls: "sold", label: "Sold out" } : p.stock <= 3 ? { cls: "few", label: `Only ${p.stock} left` } : { cls: "avail", label: "Available" };

export default function ProductCard({ p }) {
  const { addToCart } = useApp();
  const pill = pillOf(p);
  return (
    <article className={`card ${p.status}`}>
      <div className="card-img">
        <img src={p.img} alt={p.title} loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG; }} />
        <span className={`pill ${pill.cls}`}>{pill.label}</span>
      </div>
      <div className="card-body">
        <div className="row">
          <h3>{p.title}</h3>
          <span className="rating">★ {p.rating}</span>
        </div>
        <p className="desc">{p.description}</p>
        <div className="row bottom">
          <strong className="price">{taka(p.price)}</strong>
          <button className="btn solid sm" disabled={p.status === "sold"} onClick={() => addToCart(p)}>
            {p.status === "sold" ? "Sold out" : "Add to cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
