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

    if (pathname === "/api/register" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return jsonResponse({ error: "Invalid JSON" }, 400);
      }

      // 在解构之前处理 phone
      if (body.phone) {
        body.phone = body.phone.startsWith("+") ? body.phone : `+56${body.phone}`;
      }

      console.log(body);

      const {
        first_name,
        last_name,
        email,
        phone,
        birthday,
        gender,
        rut,
        source,
        tags
      } = body;

      if (!first_name || !last_name || !email) {
        return jsonResponse({ error: "Missing required fields: first_name, last_name, or email" }, 400);
      }


   

      const shop = process.env.SHOPIFY_SHOP;
      const token = process.env.SHOPIFY_ADMIN_TOKEN;

      try {
        // const priceRuleTitle = "15% Club Discount";
        // let priceRuleId = await findPriceRule(shop, token, priceRuleTitle);
        // if (!priceRuleId) {
        //   priceRuleId = await createPriceRule(shop, token, priceRuleTitle);
        // }

        // const discountCode = await createDiscountCode(shop, token, priceRuleId);
        // const note = `Birthday: ${birthday || ''}, Gender: ${gender || ''}, RUT: ${rut || ''}, Source: ${source || ''}, Discount: ${discountCode}`;

        const note = `Birthday: ${birthday || ''}, Gender: ${gender || ''}, RUT: ${rut || ''}, Source: ${source || ''}`;

        const searchRes = await fetch(`https://${shop}/admin/api/2024-04/customers/search.json?query=email:${encodeURIComponent(email)}`, {
          headers: { "X-Shopify-Access-Token": token }
        });

        if (!searchRes.ok) {
          const errText = await searchRes.text();
          return jsonResponse({ error: "Failed to search customer", details: errText }, searchRes.status);
        }

        const searchResult = await searchRes.json();
        const existingCustomer = searchResult.customers && searchResult.customers[0];

        if (existingCustomer) {


            // 先检查 note 里 Source 来源
            const noteError = existingCustomer.note || "";
            if (noteError.includes("Dutties Club Form")) {
              return jsonResponse({
                error: "Customer has already registered for the Club"
              }, 454); // 返回自定义状态码
            }



          const updateData = {
            customer: {
              id: existingCustomer.id,
              first_name,
              last_name,
              email,
              phone,
              note,
              tags,
              accepts_marketing: true
            }
          };

          const updateRes = await fetch(`https://${shop}/admin/api/2024-04/customers/${existingCustomer.id}.json`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": token
            },
            body: JSON.stringify(updateData)
          });

          if (!updateRes.ok) {
            const updateErr = await updateRes.text();
            return jsonResponse({ error: "Failed to update customer", details: updateErr }, updateRes.status);
          }

          const updatedCustomer = await updateRes.json();


        
          
       

          const inviteRes = await fetch(`https://${shop}/admin/api/2024-04/customers/${existingCustomer.id}/send_invite.json`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": token
            },
            body: JSON.stringify({ customer_invite: { custom_message: "updated" } })
          });

          let inviteResult = null;
          if (inviteRes.ok) {
            inviteResult = await inviteRes.json();
          } else {
            inviteResult = { error: await inviteRes.text() };
          }


          // discountCode,
          return jsonResponse({
            message: "Customer updated and invite sent",
            
            customer: updatedCustomer.customer,
            invite_response: inviteResult
          });
        } else {
          const createData = {
            customer: {
              first_name,
              last_name,
              email,
              phone,
              note,
              tags,
              accepts_marketing: true
            }
          };

          const createRes = await fetch(`https://${shop}/admin/api/2024-04/customers.json`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": token
            },
            body: JSON.stringify(createData)
          });

          if (!createRes.ok) {
            const errText = await createRes.text();
            return jsonResponse({ error: "Failed to create customer", details: errText }, createRes.status);
          }

          const createResult = await createRes.json();
          const customerId = createResult.customer?.id;

          if (!customerId) {
            return jsonResponse({ error: "Customer ID not returned after creation" }, 500);
          }

      
         


          const inviteRes = await fetch(`https://${shop}/admin/api/2024-04/customers/${customerId}/send_invite.json`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": token
            },
            body: JSON.stringify({ customer_invite: { custom_message: "created" } })
          });

          let inviteResult = null;
          if (inviteRes.ok) {
            inviteResult = await inviteRes.json();
          } else {
            inviteResult = { error: await inviteRes.text() };
          }

          //  discountCode,
          return jsonResponse({
            message: "Customer created and invite sent",
           
            customer: createResult.customer,
            invite_response: inviteResult
          }, 201);
        }
      } catch (err) {
        return jsonResponse({ error: "Internal server error", details: err.message }, 500);
      }
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
};
