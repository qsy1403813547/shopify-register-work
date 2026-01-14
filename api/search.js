const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}


// 自动生成优惠码（暂时取消）
// function generateCodeSuffix(length = 6) {
//   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//   return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
// }

// async function findPriceRule(shop, token, title) {
//   const res = await fetch(`https://${shop}/admin/api/2024-04/price_rules.json`, {
//     headers: {
//       "X-Shopify-Access-Token": token,
//       "Content-Type": "application/json"
//     }
//   });
//   if (!res.ok) {
//     const errText = await res.text();
//     throw new Error(`Failed to fetch price rules: ${errText}`);
//   }
//   const data = await res.json();
//   const rule = data.price_rules.find(r => r.title === title);
//   return rule ? rule.id : null;
// }

// async function createPriceRule(shop, token, title) {
//   const now = new Date().toISOString();
//   const body = {
//     price_rule: {
//       title: title,
//       target_type: "line_item",
//       target_selection: "all",
//       allocation_method: "across",
//       value_type: "percentage",
//       value: "-15.0",
//       customer_selection: "all",
//       starts_at: now,
//       usage_limit: 1,
//       once_per_customer: true
//     }
//   };

//   const res = await fetch(`https://${shop}/admin/api/2024-04/price_rules.json`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "X-Shopify-Access-Token": token
//     },
//     body: JSON.stringify(body)
//   });

//   if (!res.ok) {
//     const errText = await res.text();
//     throw new Error(`Failed to create price rule: ${errText}`);
//   }

//   const data = await res.json();
//   return data.price_rule.id;
// }

// async function createDiscountCode(shop, token, priceRuleId) {
//   const code = `CLUB15-${generateCodeSuffix()}`;
//   const res = await fetch(`https://${shop}/admin/api/2024-04/price_rules/${priceRuleId}/discount_codes.json`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "X-Shopify-Access-Token": token
//     },
//     body: JSON.stringify({
//       discount_code: { code }
//     })
//   });

//   if (!res.ok) {
//     const errText = await res.text();
//     throw new Error(`Failed to create discount code: ${errText}`);
//   }

//   const data = await res.json();
//   return data.discount_code.code;
// }

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // 地址联想
    if (pathname === "/autocomplete") {
      // if (request.method !== "POST") {
      //   return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
      // }

      // let input;
      // try {
      //   input = await request.json();
      // } catch (e) {
      //   return jsonResponse({ error: "Invalid JSON" }, 400);
      // }

      // const { query, sessionToken } = input;
      // if (!query) {
      //   return jsonResponse({ error: "Missing 'query' field" }, 400);
      // }

      // const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
      // const res = await fetch(
      //   `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=address&components=country:cl&key=${GOOGLE_API_KEY}&sessiontoken=${sessionToken || ''}`
      // );

      // const data = await res.json();
      // if (data.status !== "OK") {
      //   return jsonResponse({ error: "Google API Error", details: data }, 502);
      // }

      // return jsonResponse({ predictions: data.predictions });
    }

   
    // 搜索排序
    if(pathname === "/api/search" && request.method === "POST") {
      const shop = process.env.SHOPIFY_SHOP;
      const token = process.env.SHOPIFY_ADMIN_TOKEN;
      const endpoint = `https://${shop}/admin/api/2025-10/graphql.json`;

      // 可以通过 query 参数传日期，默认今天
      const date = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);

      // ShopifyQL 查询 Sessions 数据，并包含搜索词
      const sessionsQuery = `
      {
        searchesData: shopifyqlQuery(
          query: "
            FROM searches
            SHOW searches
            GROUP BY search_query
            SINCE -30d UNTIL today
            ORDER BY searches DESC
            LIMIT 3
          "
        ) {
          tableData { rows }
          parseErrors
        }
      }
      `;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: sessionsQuery }),
        });

        const data = await response.json();
        const searchesRows  = data?.data?.searchesData?.tableData?.rows || [];

        // const topSearches = searchesRows.map(r => r[0]);

        // 返回前端
        return jsonResponse({ top_searches: searchesRows });
      } catch (err) {
        return jsonResponse({ error: "Internal server error", details: err.message }, 500);
      }

    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
};
