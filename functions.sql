-- YK FARMS POS - SALE RECORDING FUNCTION
-- Run this AFTER schema.sql. Paste into SQL Editor and click "Run".
-- This function records a sale, updates stock, and updates customer debt
-- all together, so the numbers never get out of sync.

create or replace function record_sale(
  p_customer_id uuid,
  p_items jsonb, -- array of {product_id, quantity, unit_price}
  p_amount_paid numeric,
  p_notes text default null
) returns uuid as $$
declare
  v_sale_id uuid;
  v_total numeric := 0;
  v_item jsonb;
  v_status text;
  v_balance_due numeric;
begin
  -- calculate total from items
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_total := v_total + (v_item->>'quantity')::numeric * (v_item->>'unit_price')::numeric;
  end loop;

  v_balance_due := v_total - p_amount_paid;

  if p_amount_paid <= 0 then
    v_status := 'unpaid';
  elsif v_balance_due <= 0 then
    v_status := 'paid';
  else
    v_status := 'partial';
  end if;

  -- create the sale record
  insert into sales (customer_id, total_amount, amount_paid, payment_status, notes)
  values (p_customer_id, v_total, p_amount_paid, v_status, p_notes)
  returning id into v_sale_id;

  -- process each item: create line item, reduce stock, log movement
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into sale_items (sale_id, product_id, quantity, unit_price, subtotal)
    values (
      v_sale_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::integer,
      (v_item->>'unit_price')::numeric,
      (v_item->>'quantity')::numeric * (v_item->>'unit_price')::numeric
    );

    update products
    set current_stock = current_stock - (v_item->>'quantity')::integer
    where id = (v_item->>'product_id')::uuid;

    insert into stock_movements (product_id, movement_type, quantity, reason)
    values (
      (v_item->>'product_id')::uuid,
      'out',
      (v_item->>'quantity')::integer,
      'Sale'
    );
  end loop;

  -- update customer debt if anything is owed
  if p_customer_id is not null and v_balance_due > 0 then
    insert into debts (customer_id, balance)
    values (p_customer_id, v_balance_due)
    on conflict (customer_id)
    do update set balance = debts.balance + v_balance_due, updated_at = now();
  end if;

  return v_sale_id;
end;
$$ language plpgsql;
