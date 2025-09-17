export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body;

    // 从环境变量读取 Shopify 配置
    const shop = process.env.SHOPIFY_SHOP;
    const token = process.env.SHOPIFY_ADMIN_TOKEN;

    // 调用 Shopify Admin API
    const response = await fetch(`https://${shop}/admin/api/2025-07/customers.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token
      },
      body: JSON.stringify({
        customer: {
          first_name: body.first_name,
          last_name: body.last_name,
          email: body.email,
          password: body.password,
          verified_email: true,
          metafields: [
            {
              namespace: "custom",
              key: "rut",
              type: "single_line_text_field",
              value: body.rut
            },
            {
              namespace: "custom",
              key: "birthday",
              type: "date",
              value: body.birthday
            },
            {
              namespace: "custom",
              key: "gender",
              type: "single_line_text_field",
              value: body.gender
            }
          ]
        }
      })
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
