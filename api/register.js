const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function jsonResponse(res, data, status = 200) {
  res.status(status).setHeader("Content-Type", "application/json");
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
  res.json(data);
}

export default async function handler(req, res) {
  // 处理 CORS 预检请求
  if (req.method === "OPTIONS") {
    res.status(204);
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 这里可以放你原来的 Shopify 注册 + 折扣码逻辑
  const body = req.body || {};
  console.log("Received body:", body);

  return jsonResponse(res, { message: "API register working!", received: body });
}
