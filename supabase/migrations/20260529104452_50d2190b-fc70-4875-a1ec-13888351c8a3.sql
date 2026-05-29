-- Restrict purchase_price column on wholesale_products to admins only
REVOKE SELECT (purchase_price) ON public.wholesale_products FROM anon, authenticated;

-- Revoke EXECUTE on SECURITY DEFINER trigger/internal helpers from all roles (triggers run as owner regardless)
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_order_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_pos_bill_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_order_item_prices() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_order_totals() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM PUBLIC, anon, authenticated;

-- Revoke anon EXECUTE on user-callable RPCs (require auth)
REVOKE EXECUTE ON FUNCTION public.block_stock(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.restore_stock(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_wallet_purchase(uuid, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.claim_referral_bonus(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_wallet_transaction(uuid, numeric, text, text) FROM PUBLIC, anon;

-- has_role / is_admin used in RLS — keep authenticated, revoke anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;

-- Ensure authenticated role retains explicit grants for RPCs they need
GRANT EXECUTE ON FUNCTION public.block_stock(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_stock(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_wallet_purchase(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_referral_bonus(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_wallet_transaction(uuid, numeric, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;