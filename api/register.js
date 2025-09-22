// pages/api/register.js
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

function generateCodeSuffix(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// Shopify Helpers
async function findPriceRule(shop, token, title) {
  const res = await fetch(`https://${shop}/admin/api/2024-04/price_rules.json`, {
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  const rule = data.price_rules.find(r => r.title === title);
  return rule ? rule.id : null;
}

async function createPriceRule(shop, token, title) {
  const now = new Date().toISOString();
  const body = {
    price_rule: {
      title,
      target_type: "line_item",
      target_selection: "all",
      allocation_method: "across",
      value_type: "percentage",
      value: "-15.0",
      customer_selection: "all",
      starts_at: now,
      usage_limit: 1,
      once_per_customer: true
    }
  };

  const res = await fetch(`https://${shop}/admin/api/2024-04/price_rules.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.price_rule.id;
}

async function createDiscountCode(shop, token, priceRuleId) {
  const code = `CLUB15-${generateCodeSuffix()}`;
  const res = await fetch(`https://${shop}/admin/api/2024-04/price_rules/${priceRuleId}/discount_codes.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token
    },
    body: JSON.stringify({ discount_code: { code } })
  });

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.discount_code.code;
}

export default async function handler(req, res) {
  // CORS 预检
  if (req.method === "OPTIONS") {
    res.status(204);
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const pathname = new URL(`http://dummy${req.url}`).pathname;

    // Google Autocomplete
    if (pathname === "/api/register/autocomplete") {
      const { query, sessionToken } = req.body || {};
      if (!query) return jsonResponse(res, { error: "Missing 'query' field" }, 400);

      const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
      const gRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=address&components=country:cl&key=${GOOGLE_API_KEY}&sessiontoken=${sessionToken || ""}`
      );
      const data = await gRes.json();
      if (data.status !== "OK") return jsonResponse(res, { error: "Google API Error", details: data }, 502);
      return jsonResponse(res, { predictions: data.predictions });
    }

    // 注册 / 创建客户
    if (pathname === "/api/register") {
      let body = req.body || {};

      console.log(req);

      // 如果 body 为空，手动解析
      if (!body || Object.keys(body).length === 0) {
        body = await new Promise((resolve, reject) => {
          let data = "";
          req.on("data", chunk => data += chunk);
          req.on("end", () => resolve(JSON.parse(data)));
          req.on("error", err => reject(err));
        });
      }

      if (body.phone) {
        body.phone = body.phone.startsWith("+") ? body.phone : `+56${body.phone}`;
      }

      const { first_name, last_name, email, phone, birthday, gender, rut, source } = body;
      if (!first_name || !last_name || !email) {
        return jsonResponse(res, { error: "Missing required fields: first_name, last_name, email" }, 400);
      }

      const shop = process.env.SHOPIFY_SHOP;
      const token = process.env.SHOPIFY_ADMIN_TOKEN;

      // 创建/查找 Price Rule
      const priceRuleTitle = "15% Club Discount";
      let priceRuleId = await findPriceRule(shop, token, priceRuleTitle);
      if (!priceRuleId) priceRuleId = await createPriceRule(shop, token, priceRuleTitle);

      const discountCode = await createDiscountCode(shop, token, priceRuleId);

      const note = `Birthday: ${birthday || ""}, Gender: ${gender || ""}, RUT: ${rut || ""}, Source: ${source || ""}, Discount: ${discountCode}`;

      // 查找客户
      const searchRes = await fetch(`https://${shop}/admin/api/2024-04/customers/search.json?query=email:${encodeURIComponent(email)}`, {
        headers: { "X-Shopify-Access-Token": token }
      });
      const searchResult = await searchRes.json();
      const existingCustomer = searchResult.customers?.[0];

      // if (existingCustomer) {
      //   // 更新已有客户
      //   const updateData = {
      //     customer: { id: existingCustomer.id, first_name, last_name, email, phone, note, accepts_marketing: true }
      //   };

      //   const updateRes = await fetch(`https://${shop}/admin/api/2024-04/customers/${existingCustomer.id}.json`, {
      //     method: "PUT",
      //     headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      //     body: JSON.stringify(updateData)
      //   });

      //   const updatedCustomer = await updateRes.json();

      //   // 发送邀请
      //   const inviteRes = await fetch(`https://${shop}/admin/api/2024-04/customers/${existingCustomer.id}/send_invite.json`, {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      //     body: JSON.stringify({ customer_invite: { custom_message: `${discountCode}` } })
      //   });
      //   const inviteResult = inviteRes.ok ? await inviteRes.json() : { error: await inviteRes.text() };

      //   return jsonResponse(res, {
      //     message: "Customer updated and invite sent",
      //     discountCode,
      //     customer: updatedCustomer.customer,
      //     invite_response: inviteResult
      //   });
      // } else {
      //   // 创建新客户
      //   const createRes = await fetch(`https://${shop}/admin/api/2024-04/customers.json`, {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      //     body: JSON.stringify({ customer: { first_name, last_name, email, phone, note, accepts_marketing: true } })
      //   });
      //   const createResult = await createRes.json();
      //   const customerId = createResult.customer?.id;

      //   // 发送邀请
      //   const inviteRes = await fetch(`https://${shop}/admin/api/2024-04/customers/${customerId}/send_invite.json`, {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      //     body: JSON.stringify({ customer_invite: { custom_message: `${discountCode}` } })
      //   });
      //   const inviteResult = inviteRes.ok ? await inviteRes.json() : { error: await inviteRes.text() };

      //   return jsonResponse(res, {
      //     message: "Customer created and invite sent",
      //     discountCode,
      //     customer: createResult.customer,
      //     invite_response: inviteResult
      //   }, 201);
      // }
    }

    return res.status(404).json({ error: "Not Found" });
  } catch (err) {
    return jsonResponse(res, { error: "Internal server error", details: err.message }, 500);
  }
}
