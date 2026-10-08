 export async function api(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("ff_token");
  const res = await fetch("/api" + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

export const taka = (n) => "৳" + Number(n).toLocaleString("en-IN");

export const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect width='400' height='400' fill='#1b2338'/><path d='M80 250c40-8 60-50 90-50s40 22 80 30 70 8 70 36v14H80z' fill='#2c3858'/><text x='200' y='330' text-anchor='middle' font-family='sans-serif' font-size='16' fill='#6b7899'>image coming soon</text></svg>`
  );
