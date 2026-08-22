-- Convert stored prices from cents to whole rupiah (divide by 100).
UPDATE "Book"     SET "price"   = "price" / 100;
UPDATE "Sale"     SET "total"   = "total" / 100;
UPDATE "SaleItem" SET "unitPrice" = "unitPrice" / 100,
                      "subtotal"  = "subtotal" / 100;
