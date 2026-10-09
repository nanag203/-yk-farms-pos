// app/api/assistant/route.js
// YK Farms VA (web chat). Behind your normal login (middleware.js).
// Answers questions, gives ideas, watches the live market (web search), drafts customer texts,
// and logs sales / purchases / expenses / debt payments ONLY after you tap Save on the card.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MODEL = "claude-sonnet-5-5";

const num = (v) => Number(v) || 0;
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const cedi = (n) => `GHS ${num(n).toLocaleString("en-GH", { maximumFractionDigits: 2 })}`;

// ---------- name matching ----------
function findMatches(rows, query) {
  const q = norm(query);
  if (!q) return [];
  const exact = rows.filter((r) => norm(r.name) === q);
  if (exact.length) return exact;
  const words = q.split(" ");
  return rows.filter((r) => {
    const n = norm(r.name);
    return words.every((w) => n.includes(w));
  });
}

function pick(rows, query, label) {
  const m = findMatches(rows, query);
  if (m.length === 1) return { row: m[0] };
  if (m.length === 0) return { error: `No ${label} matching "${query}".` };
  return {
    error: `More than one ${label} matches "${query}": ${m
      .slice(0, 8)
      .map((r) => r.name)
      .join(", ")}. Ask Nana which one.`,
  };
}

// ---------- business data snapshot for the AI ----------
async function loadBusinessData() {
  const since = new Date(Date.now() - 365 * 86400000).toISOString();
  const [sales, expenses, purchases, debts, products, customers, suppliers] = await Promise.all([
    supabase
      .from("sales")
      .select(
        "sale_date, total_amount, amount_paid, payment_status, notes, customers(name), sale_items(quantity, unit_price, products(name, cost_price))"
      )
      .gte("sale_date", since)
      .order("sale_date", { ascending: false })
      .limit(600),
    supabase
      .from("expenses")
      .select("expense_date, category, amount, description")
      .gte("expense_date", since)
      .order("expense_date", { ascending: false })
      .limit(400),
    supabase
      .from("purchases")
      .select("purchase_date, quantity, cost_price, notes, suppliers(name), products(name)")
      .gte("purchase_date", since)
      .order("purchase_date", { ascending: false })
      .limit(200),
    supabase.from("debts").select("balance, customers(name)").gt("balance", 0).limit(500),
    supabase.from("products").select("name, unit, price, cost_price, current_stock, low_stock_alert").limit(200),
    supabase.from("customers").select("name, customer_type").limit(1000),
    supabase.from("suppliers").select("name").limit(300),
  ]);

  return {
    today: new Date().toISOString().slice(0, 10),
    products: products.data || [],
    customers: customers.data || [],
    suppliers: (suppliers.data || []).map((s) => s.name),
    debts: (debts.data || []).map((d) => ({ customer: d.customers?.name || "Unknown", owes: d.balance })),
    sales: (sales.data || []).map((s) => ({
      date: s.sale_date,
      customer: s.customers?.name || "Walk-in",
      total: s.total_amount,
      paid: s.amount_paid,
      status: s.payment_status,
      notes: s.notes,
      items: (s.sale_items || []).map((i) => ({
        product: i.products?.name,
        qty: i.quantity,
        price: i.unit_price,
        cost: i.products?.cost_price,
      })),
    })),
    expenses: expenses.data || [],
    purchases: (purchases.data || []).map((p) => ({
      date: p.purchase_date,
      supplier: p.suppliers?.name,
      product: p.products?.name,
      qty: p.quantity,
      cost: p.cost_price,
      notes: p.notes,
    })),
    loadErrors: [sales, expenses, purchases, debts, products, customers, suppliers]
      .filter((r) => r.error)
      .map((r) => r.error.message),
  };
}

// ---------- tools the AI can PROPOSE (nothing is saved until Nana taps Save) ----------
const TOOLS = [
  {
    name: "record_sale",
    description:
      "Propose logging a sale. Reduces stock and records any unpaid balance as customer debt. Nothing is saved until Nana taps Save.",
    input_schema: {
      type: "object",
      properties: {
        customer_name: { type: "string", description: "Customer name. Omit only for a walk-in customer who pays in full." },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              product_name: { type: "string" },
              quantity: { type: "integer" },
              unit_price: { type: "number", description: "Price per unit. Omit to use the product's list price." },
            },
            required: ["product_name", "quantity"],
          },
        },
        amount_paid: { type: "number", description: "Cash received now. 0 if fully on credit." },
        notes: { type: "string" },
        create_customer: { type: "boolean", description: "true only after Nana confirmed this is a new customer." },
      },
      required: ["items", "amount_paid"],
    },
  },
  {
    name: "record_expense",
    description:
      "Propose logging a business expense (transport, fuel, salaries, packaging, rent, airtime, etc). NOT for buying eggs from suppliers.",
    input_schema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Short category like Transport, Fuel, Salaries, Packaging, Rent, Airtime, Other" },
        amount: { type: "number" },
        description: { type: "string" },
      },
      required: ["category", "amount"],
    },
  },
  {
    name: "record_purchase",
    description:
      "Propose logging stock bought from a supplier. Increases stock. Use this (not record_expense) for buying eggs.",
    input_schema: {
      type: "object",
      properties: {
        supplier_name: { type: "string" },
        product_name: { type: "string" },
        quantity: { type: "integer" },
        cost_price: { type: "number", description: "Cost per unit" },
        notes: { type: "string" },
        create_supplier: { type: "boolean", description: "true only after Nana confirmed this is a new supplier." },
      },
      required: ["supplier_name", "product_name", "quantity", "cost_price"],
    },
  },
  {
    name: "record_debt_payment",
    description: "Propose logging money a customer paid towards what they owe. Reduces their debt balance.",
    input_schema: {
      type: "object",
      properties: {
        customer_name: { type: "string" },
        amount: { type: "number" },
      },
      required: ["customer_name", "amount"],
    },
  },
];

// Live web search (run by Anthropic). Lets the VA check current egg prices, feed costs, news, etc.
const WEB_SEARCH = {
  type: "web_search_20250305",
  name: "web_search",
  max_uses: 3,
  user_location: {
    type: "approximate",
    country: "GH",
    city: "Accra",
    timezone: "Africa/Accra",
  },
};

async function prepareSale(input) {
  const items = Array.isArray(input.items) ? input.items : [];
  if (!items.length) return { error: "No items given." };

  const { data: products } = await supabase.from("products").select("id, name, price, current_stock");
  const lines = [];
  let total = 0;
  for (const it of items) {
    const p = pick(products || [], it.product_name, "product");
    if (p.error) return { error: p.error };
    const qty = Math.round(num(it.quantity));
    const price =
      it.unit_price !== undefined && it.unit_price !== null ? num(it.unit_price) : num(p.row.price);
    if (qty <= 0) return { error: `Quantity for ${p.row.name} must be more than 0.` };
    if (price <= 0) return { error: `No price for ${p.row.name}. Ask Nana for the unit price.` };
    lines.push({
      product_id: p.row.id,
      name: p.row.name,
      quantity: qty,
      unit_price: price,
      stock: num(p.row.current_stock),
    });
    total += qty * price;
  }

  const paid = num(input.amount_paid);
  if (paid < 0) return { error: "Amount paid cannot be negative." };
  if (paid > total) return { error: `Amount paid (${cedi(paid)}) is more than the total (${cedi(total)}).` };

  let customer = null;
  let newCustomerName = null;
  if (input.customer_name) {
    const { data: customers } = await supabase.from("customers").select("id, name");
    const c = pick(customers || [], input.customer_name, "customer");
    if (c.row) customer = c.row;
    else if (c.error.startsWith("More than")) return { error: c.error };
    else if (input.create_customer === true) newCustomerName = String(input.customer_name).trim();
    else
      return {
        error: `${c.error} Ask Nana if this is a new customer. If yes, call again with create_customer true.`,
      };
  }
  if (!customer && !newCustomerName && paid < total) {
    return { error: "A credit sale needs a customer name." };
  }

  const who = customer ? customer.name : newCustomerName ? `${newCustomerName} (new customer)` : "Walk-in";
  const parts = lines.map((l) => `${l.quantity} x ${l.name} @ ${cedi(l.unit_price)}`).join(", ");
  const owed = total - paid;
  const warn = lines
    .filter((l) => l.quantity > l.stock)
    .map((l) => `${l.name} stock shows only ${l.stock}`)
    .join("; ");
  const summary =
    `SALE to ${who}: ${parts}. Total ${cedi(total)}, paid ${cedi(paid)}` +
    (owed > 0 ? `, owes ${cedi(owed)}` : ", paid in full") +
    (warn ? `. Note: ${warn}` : "");

  return {
    summary,
    payload: {
      type: "sale",
      customer_id: customer ? customer.id : null,
      new_customer_name: newCustomerName,
      items: lines,
      total,
      amount_paid: paid,
      notes: input.notes || null,
    },
  };
}

async function prepareExpense(input) {
  const amount = num(input.amount);
  if (amount <= 0) return { error: "Expense amount must be more than 0." };
  const category = String(input.category || "").trim() || "Other";
  const description = input.description ? String(input.description).trim() : null;
  return {
    summary: `EXPENSE: ${cedi(amount)} for ${category}${description ? ` (${description})` : ""}`,
    payload: { type: "expense", category, amount, description },
  };
}

async function preparePurchase(input) {
  const qty = Math.round(num(input.quantity));
  const cost = num(input.cost_price);
  if (qty <= 0) return { error: "Quantity must be more than 0." };
  if (cost <= 0) return { error: "Cost price must be more than 0." };

  const { data: products } = await supabase.from("products").select("id, name, current_stock");
  const p = pick(products || [], input.product_name, "product");
  if (p.error) return { error: p.error };

  const { data: suppliers } = await supabase.from("suppliers").select("id, name");
  let supplier = null;
  let newSupplierName = null;
  const s = pick(suppliers || [], input.supplier_name, "supplier");
  if (s.row) supplier = s.row;
  else if (s.error.startsWith("More than")) return { error: s.error };
  else if (input.create_supplier === true) newSupplierName = String(input.supplier_name).trim();
  else
    return {
      error: `${s.error} Ask Nana if this is a new supplier. If yes, call again with create_supplier true.`,
    };

  const who = supplier ? supplier.name : `${newSupplierName} (new supplier)`;
  return {
    summary: `PURCHASE from ${who}: ${qty} x ${p.row.name} @ ${cedi(cost)} = ${cedi(qty * cost)}. Stock goes from ${num(
      p.row.current_stock
    )} to ${num(p.row.current_stock) + qty}`,
    payload: {
      type: "purchase",
      supplier_id: supplier ? supplier.id : null,
      new_supplier_name: newSupplierName,
      product_id: p.row.id,
      product_name: p.row.name,
      quantity: qty,
      cost_price: cost,
      notes: input.notes || null,
    },
  };
}

async function prepareDebtPayment(input) {
  const amount = num(input.amount);
  if (amount <= 0) return { error: "Payment amount must be more than 0." };
  const { data: customers } = await supabase.from("customers").select("id, name");
  const c = pick(customers || [], input.customer_name, "customer");
  if (c.error) return { error: c.error };
  const { data: debt } = await supabase
    .from("debts")
    .select("balance")
    .eq("customer_id", c.row.id)
    .maybeSingle();
  const balance = num(debt?.balance);
  if (balance <= 0) return { error: `${c.row.name} does not owe anything right now.` };
  if (amount > balance) return { error: `${c.row.name} only owes ${cedi(balance)}, less than ${cedi(amount)}.` };
  return {
    summary: `DEBT PAYMENT: ${c.row.name} pays ${cedi(amount)}. Owes ${cedi(balance)}, will owe ${cedi(balance - amount)}`,
    payload: { type: "debt_payment", customer_id: c.row.id, name: c.row.name, amount },
  };
}

const PREPARE = {
  record_sale: prepareSale,
  record_expense: prepareExpense,
  record_purchase: preparePurchase,
  record_debt_payment: prepareDebtPayment,
};

// ---------- actually saving (only runs after Save) ----------
async function executeAction(p) {
  if (!p || typeof p !== "object") throw new Error("Bad entry");

  if (p.type === "sale") {
    if (!Array.isArray(p.items) || !p.items.length) throw new Error("Sale has no items");
    let customerId = p.customer_id || null;
    if (!customerId && p.new_customer_name) {
      const { data, error } = await supabase
        .from("customers")
        .insert({ name: p.new_customer_name })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      customerId = data.id;
    }
    const { error } = await supabase.rpc("record_sale", {
      p_customer_id: customerId,
      p_items: p.items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
      p_amount_paid: p.amount_paid,
      p_notes: p.notes || null,
    });
    if (error) throw new Error(error.message);
    return { message: `Saved. ${p.summary}` };
  }

  if (p.type === "expense") {
    const { error } = await supabase
      .from("expenses")
      .insert({ category: p.category, amount: p.amount, description: p.description });
    if (error) throw new Error(error.message);
    return { message: `Saved. ${p.summary}` };
  }

  if (p.type === "purchase") {
    let supplierId = p.supplier_id || null;
    if (!supplierId && p.new_supplier_name) {
      const { data, error } = await supabase
        .from("suppliers")
        .insert({ name: p.new_supplier_name })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      supplierId = data.id;
    }
    const { error } = await supabase.from("purchases").insert({
      supplier_id: supplierId,
      product_id: p.product_id,
      quantity: p.quantity,
      cost_price: p.cost_price,
      notes: p.notes || null,
    });
    if (error) throw new Error(error.message);

    const { data: prod } = await supabase
      .from("products")
      .select("current_stock")
      .eq("id", p.product_id)
      .single();
    const { error: stockErr } = await supabase
      .from("products")
      .update({ current_stock: num(prod?.current_stock) + p.quantity })
      .eq("id", p.product_id);
    if (stockErr) throw new Error(`Purchase saved but stock update failed: ${stockErr.message}`);
    await supabase
      .from("stock_movements")
      .insert({ product_id: p.product_id, movement_type: "in", quantity: p.quantity, reason: "Purchase" });
    return { message: `Saved. ${p.summary}` };
  }

  if (p.type === "debt_payment") {
    const { data: debt } = await supabase
      .from("debts")
      .select("balance")
      .eq("customer_id", p.customer_id)
      .maybeSingle();
    const balance = num(debt?.balance);
    const next = Math.max(balance - num(p.amount), 0);
    const { error } = await supabase
      .from("debts")
      .update({ balance: next, updated_at: new Date().toISOString() })
      .eq("customer_id", p.customer_id);
    if (error) throw new Error(error.message);
    return { message: `Saved. ${p.name} paid ${cedi(p.amount)}. Balance now ${cedi(next)}.` };
  }

  throw new Error("Unknown action type");
}

// ---------- the assistant ----------
async function runAssistant(history, discarded) {
  const data = await loadBusinessData();

  const system =
    "You are the virtual assistant (VA) for Nana, who runs YK Farms, an egg sourcing and supply business in Ablekuma, Accra, Ghana. You chat with him in the POS web chat on his phone. Amounts are Ghana cedis (GHS).\n\n" +
    "STYLE: casual, warm, short and direct, like a sharp business partner. Plain text only: no markdown, no asterisks, no headings. Short lines or simple dashes for lists. Keep most replies under 120 words (market answers can run a little longer).\n\n" +
    "FACTS: Business numbers (sales, stock, debts, customers, prices, costs) come ONLY from the business data below. Never invent them. If data looks missing or incomplete (no recent sales, no expenses logged, stock at zero), say so plainly and explain what it means.\n\n" +
    "MARKET WATCH: You can search the web for current information: egg and poultry prices in Ghana, maize and feed costs, fuel prices, bird flu or disease outbreaks, import rules, exchange rates, competitors, relevant news. Search whenever Nana asks about the market, or when fresh outside information would change your advice. Then connect it to HIS numbers: his margins, stock, customers and debts, and say what he should do about it. Be honest about uncertainty: if you cannot find a reliable current figure, say so instead of guessing, and mention the source name and how recent it is. Do not search for things the business data already answers.\n\n" +
    "LOGGING: To log a sale, expense, stock purchase or debt payment, call the matching tool. Tools only PROPOSE: nothing is saved until Nana taps the Save button that appears under your message. Never say something is saved or done when you only proposed it. After proposing, give a one or two line recap and tell him to tap Save to confirm or Cancel to discard. If something is missing or unclear (customer, product, price, amount paid), ask ONE short question instead of guessing. If he gives no price, the product's list price is used, so mention that in your recap. Ask before creating a new customer or supplier. Buying eggs from a supplier is a PURCHASE (record_purchase), never an expense. Other costs (transport, fuel, salaries, packaging, rent, airtime) are expenses with a short category. Entries are saved with today's date and time. You cannot backdate, edit or delete records, so say so if asked.\n\n" +
    "IDEAS: when asked what to do or how to grow, be specific: name customers, products and amounts from the data (who owes him, who has gone quiet, what sells, what is out of stock, margins).\n\n" +
    "CUSTOMER TEXTS: you can only DRAFT messages, you cannot send them. Write the draft in Nana's casual, friendly voice, short, Ghanaian English is fine. Give one draft unless he asks for more.\n\n" +
    (discarded > 0
      ? `NOTE: ${discarded} earlier proposal(s) were discarded because Nana sent a new message instead of tapping Save. They were NOT saved. Re-propose them if he still wants them.\n\n`
      : "") +
    "BUSINESS DATA (JSON):\n" +
    JSON.stringify(data);

  const messages = history.slice();
  const proposals = [];

  for (let i = 0; i < 5; i++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        system,
        tools: [...TOOLS, WEB_SEARCH],
        messages,
      }),
    });
    if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
    const out = await res.json();

    // Use only the text written after the last web search finished (skips "let me look that up")
    const blocks = out.content || [];
    let lastSearch = -1;
    blocks.forEach((b, idx) => {
      if (b.type === "web_search_tool_result") lastSearch = idx;
    });
    const text = blocks
      .filter((b, idx) => b.type === "text" && idx > lastSearch)
      .map((b) => b.text)
      .join("")
      .trim();

    // Long searches can pause: send the answer so far back so it can carry on
    if (out.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: out.content });
      continue;
    }

    if (out.stop_reason !== "tool_use") {
      return { text: text || "Sorry, I had nothing to say. Try again?", proposals };
    }

    messages.push({ role: "assistant", content: out.content });
    const results = [];
    for (const block of (out.content || []).filter((b) => b.type === "tool_use")) {
      let content;
      const handler = PREPARE[block.name];
      if (!handler) {
        content = "Unknown tool.";
      } else {
        try {
          const prep = await handler(block.input || {});
          if (prep.error
