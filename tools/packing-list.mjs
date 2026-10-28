/**
 * Print a packing sheet for open, not-yet-fulfilled Shopify orders.
 *
 * Setup (do this in the store admin, not in chat):
 *   Settings → Apps → Develop apps → create an app → Admin API scopes:
 *   read_orders, read_products
 *   Install the app, then reveal the Admin API access token once.
 *
 * Run:
 *   SHOPIFY_STORE=ifv5fp-31 SHOPIFY_ADMIN_TOKEN=shpca_... node tools/packing-list.mjs
 *
 * The token stays in your shell. Do not commit it and do not paste it into chat.
 */

const store = process.env.SHOPIFY_STORE || "ifv5fp-31";
const token = process.env.SHOPIFY_ADMIN_TOKEN;
const version = process.env.SHOPIFY_API_VERSION || "2026-10";

if (!token) {
  console.error("Set SHOPIFY_ADMIN_TOKEN in your shell. Do not paste the token into chat.");
  process.exit(1);
}

function nextUrl(linkHeader) {
  if (!linkHeader) return null;
  const parts = linkHeader.split(",");
  for (const part of parts) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/);
    if (match) return match[1];
  }
  return null;
}

async function fetchOrders() {
  let url =
    `https://${store}.myshopify.com/admin/api/${version}/orders.json` +
    "?status=open&fulfillment_status=unfulfilled&limit=250";
  const orders = [];

  while (url) {
    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": token,
        Accept: "application/json"
      }
    });
    const bodyText = await response.text();
    if (!response.ok) {
      throw new Error(`Shopify responded ${response.status}: ${bodyText.slice(0, 400)}`);
    }
    const body = JSON.parse(bodyText);
    orders.push(...(body.orders || []));
    url = nextUrl(response.headers.get("link"));
  }

  return orders;
}

function lineFor(item) {
  const sku = item.sku || "no-sku";
  const kind = item.requires_shipping === false ? "DIGITAL" : "PACK";
  return `  [${kind}] ${item.quantity} x ${item.title} (${sku})`;
}

function addressFor(order) {
  const address = order.shipping_address;
  if (!address) return "  No shipping address (check whether this order is digital).";
  const cityLine = [address.city, address.province, address.zip, address.country]
    .filter(Boolean)
    .join(", ");
  return `  ${address.name || ""}\n  ${address.address1 || ""}\n  ${cityLine}`;
}

const orders = await fetchOrders();

if (orders.length === 0) {
  console.log("No open orders waiting to be packed.");
  process.exit(0);
}

console.log(`Packing sheet — ${orders.length} open order(s)\n`);

for (const order of orders) {
  console.log(`${order.name}  ${order.created_at}`);
  console.log(addressFor(order));
  for (const item of order.line_items || []) {
    if (item.fulfillable_quantity === 0) continue;
    console.log(lineFor(item));
  }
  console.log("");
}
