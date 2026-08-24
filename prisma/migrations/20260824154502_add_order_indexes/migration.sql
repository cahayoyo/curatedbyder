-- CreateIndex
CREATE INDEX "Order_soldAt_idx" ON "Order"("soldAt");

-- CreateIndex
CREATE INDEX "Order_buyerId_soldAt_idx" ON "Order"("buyerId", "soldAt");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");
