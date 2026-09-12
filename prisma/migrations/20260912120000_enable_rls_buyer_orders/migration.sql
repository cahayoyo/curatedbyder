-- Row-level security for buyer-scoped order data (issue #336).
--
-- The app runs its buyer-facing order reads through a dedicated non-owner role
-- `app_user` (see src/lib/db.ts `dbApp` / src/lib/rls.ts `withBuyer`). That role
-- is subject to the policies below; the owner role keeps BYPASSRLS, so admin,
-- migrations, imports and the public PDF download are unaffected.
--
-- The role is created here without a password on purpose: passwords are
-- environment secrets and must be set out-of-band per database, e.g.
--   ALTER ROLE app_user WITH PASSWORD '<secret>';
-- (locally and for the production Neon branch).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user LOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- Order: a buyer may only touch their own rows. `current_setting(..., true)`
-- returns NULL when unset, so an unwrapped query matches nothing.
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" FORCE ROW LEVEL SECURITY;
CREATE POLICY order_buyer_scope ON "Order"
  USING ("buyerId" = current_setting('app.user_id', true))
  WITH CHECK ("buyerId" = current_setting('app.user_id', true));

-- Items/payments have no buyer column: scope via the parent order. The
-- subquery on "Order" is itself subject to the policy above, so it only ever
-- resolves to the current buyer's orders.
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" FORCE ROW LEVEL SECURITY;
CREATE POLICY order_item_buyer_scope ON "OrderItem"
  USING (
    EXISTS (SELECT 1 FROM "Order" o WHERE o.id = "orderId")
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM "Order" o WHERE o.id = "orderId")
  );

ALTER TABLE "OrderPayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderPayment" FORCE ROW LEVEL SECURITY;
CREATE POLICY order_payment_buyer_scope ON "OrderPayment"
  USING (
    EXISTS (SELECT 1 FROM "Order" o WHERE o.id = "orderId")
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM "Order" o WHERE o.id = "orderId")
  );
