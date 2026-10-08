 import { useMemo, useState } from "react";
import { useApp } from "../store";
import ProductCard from "../components/ProductCard";
import { FALLBACK_IMG } from "../api";

export default function Home() {
  const { products, user, setAuthOpen } = useApp();
  const [q, setQ] = useState("");
  const [show, setShow] = useState("all");
  const [sort, setSort] = useState("default");

  const list = useMemo(() => {
    let l = products.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()) && (show === "all" || p.status === show));
    if (sort === "low") l = [...l].sort((a, b) => a.price - b.price);
    if (sort === "high") l = [...l].sort((a, b) => b.price - a.price);
    if (sort === "rating") l = [...l].sort((a, b) => b.rating - a.rating);
    return l;
  }, [products, q, show, sort]);

  const hero = products.filter((p) => p.status === "available").slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <h1>Shoes worth<br />the walk.</h1>
          <p>Thirty hand-picked pairs, from track spikes to hand-finished derbies. Create an account and start with ৳10,000 to spend.</p>
          <div className="hero-cta">
            <a className="btn solid" href="#shop">Shop the collection</a>
            {!user && <button className="btn ghost" onClick={() => setAuthOpen({ mode: "signup" })}>Claim ৳10,000</button>}
          </div>
        </div>
        <div className="hero-stack" aria-hidden="true">
          {hero.map((p, i) => (
            <img key={p.id} className={`h${i}`} src={p.img} alt="" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG; }} />
          ))}
        </div>
      </section>

      <section id="shop" className="shop">
        <div className="toolbar">
          <input className="search" placeholder="Search shoes" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="chips">
            {[["all", "All"], ["available", "Available"], ["sold", "Sold out"]].map(([v, l]) => (
              <button key={v} className={show === v ? "on" : ""} onClick={() => setShow(v)}>{l}</button>
            ))}
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="default">Featured</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>
        {list.length === 0 ? <p className="muted center">No shoes match your search.</p> : <div className="grid">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
      </section>
    </>
  );
}
