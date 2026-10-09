// app/api/assistant/route.js
// Chat with your business: pulls fresh data from Supabase, answers with Claude.
// Protected by your normal login (middleware.js), so only logged-in users can use it.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Remove noisy technical columns so the AI only sees useful fields
function strip(row) {
  const out = {};
  for (const [k, v] of Object.entries(row || {})) {
    if (k === "id" || k.endsWith("_id") || k === "created_at" || k === "updated_at") continue;
    out[k] = v;
  }
  return out;
}

async function loadBusinessData() {
  const since = new Date(Date.now() - 365 * 86400000).toISOString();
  const errors = [];

  const [sales, expenses, debts, products, customers] = await Promise.all([
    supabase
      .from("sales")
      .select(
        "sale_date, total_amount, amount_paid, payment_status, customers(name), sale_items(quantity, unit_price, products(name, cost_price))"
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
    supabase.from("debts").select("*, customers(name)").limit(500),
    supabase.from("products").select("*").limit(200),
    supabase.from("customers").select("name").limit(1000),
  ]);

  for (const [name, r] of [
    ["sales", sales],
    ["expenses", expenses],
    ["debts", debts],
    ["products", products],
    ["customers", customers],
  ]) {
    if (r.error) errors.push(`${name}: ${r.error.message}`);
  }

  return {
    sales: (sales.data || []).map((s) => ({
      date: s.sale_date,
      customer: s.customers?.name || "Walk-in",
      total: s.total_amount,
      paid: s.amount_paid,
      status: s.payment_status,
      items: (s.sale_items || []).map((i) => ({
        product: i.products?.name,
        qty: i.quantity,
        price: i.unit_price,
        cost: i.products?.cost_price,
      })),
    })),
    expenses: expenses.data || [],
    debts: (debts.data || []).map((d) => ({
      customer: d.customers?.name || "Unknown",
      ...strip({ ...d, customers: undefined }),
    })),
    products: (products.data || []).map(strip),
    customers: (customers.data || []).map((c) => c.name),
    dataErrors: errors,
  };
}

export async function POST(req) {
  try {
    const body = await req.json();

    // Keep only the last 20 clean messages, and make sure it starts with the user
    let messages = (body.messages || [])
      .filter(
        (m) =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim()
      )
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
    while (messages.length && messages[0].role !== "user") messages.shift();
    if (!messages.length) {
      return NextResponse.json({ error: "No message received." }, { status: 400 });
    }

    const data = await loadBusinessData();
    const today = new Date().toISOString().slice(0, 10);

    const system =
      "You are the business assistant for YK Farms, an egg sourcing and supply business in Accra, Ghana, run by Nana. " +
      `Today is ${today} (Accra time). Amounts are in Ghana cedis (GHS). ` +
      "You are talking to Nana on his phone. Reply in plain text only: no markdown, no asterisks, no headings. Keep answers short and direct, like a sharp business partner. Use short lines or simple dashes for lists. " +
      "Answer ONLY from the data below. Never invent numbers, customers or products. " +
      "If the data is missing or looks incomplete (for example no recent sales, no expenses logged, or all stock at zero), say so plainly and explain what that means for the answer. " +
      "You can only read the data. You cannot change records or send messages yet, so if asked, say that is not set up yet. " +
      "When giving ideas, be specific: name customers, products and amounts from the data.\n\n" +
      "BUSINESS DATA (JSON):\n" +
      JSON.stringify(data);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5-5",
        max_tokens: 800,
        system,
        messages,
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Claude API ${res.status}: ${await res.text()}` },
        { status: 500 }
      );
    }

    const out = await res.json();
    const reply = (out.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
