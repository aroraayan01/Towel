-- CreateTable
CREATE TABLE "Seller" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "abn" TEXT,
    "legalName" TEXT,
    "gstRegistered" BOOLEAN NOT NULL DEFAULT false,
    "website" TEXT,
    "instagram" TEXT,
    "bio" TEXT NOT NULL DEFAULT '',
    "application" TEXT NOT NULL DEFAULT '',
    "categories" TEXT NOT NULL DEFAULT '[]',
    "shipFromSuburb" TEXT,
    "shipFromState" TEXT,
    "shipFromPostcode" TEXT,
    "dispatchDays" INTEGER NOT NULL DEFAULT 3,
    "bankAccountName" TEXT,
    "bankDetailsEnc" TEXT,
    "bankLast4" TEXT,
    "commissionBps" INTEGER NOT NULL DEFAULT 1500,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "statusNote" TEXT,
    "internalNotes" TEXT,
    "agreedTermsAt" DATETIME,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SellerUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sessionVersion" INTEGER NOT NULL DEFAULT 1,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SellerUser_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "sellerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "merchandiseCents" INTEGER NOT NULL,
    "shippingCents" INTEGER NOT NULL,
    "shippingGstCents" INTEGER NOT NULL DEFAULT 0,
    "method" TEXT NOT NULL,
    "carrier" TEXT,
    "trackingNumber" TEXT,
    "shippedAt" DATETIME,
    "deliveredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Shipment_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "orderId" TEXT,
    "shipmentId" TEXT,
    "payoutId" TEXT,
    "availableAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LedgerEntry_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LedgerEntry_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LedgerEntry_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "paidAt" DATETIME NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payout_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "variantLabel" TEXT NOT NULL,
    "unitCents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "monogram" TEXT,
    "monogramCents" INTEGER NOT NULL DEFAULT 0,
    "gstCents" INTEGER NOT NULL DEFAULT 0,
    "sellerId" TEXT,
    "shipmentId" TEXT,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("id", "monogram", "monogramCents", "name", "orderId", "productId", "quantity", "unitCents", "variantId", "variantLabel") SELECT "id", "monogram", "monogramCents", "name", "orderId", "productId", "quantity", "unitCents", "variantId", "variantLabel" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "specs" TEXT NOT NULL DEFAULT '[]',
    "material" TEXT NOT NULL,
    "care" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "bestseller" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "monogramable" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "fromSeed" BOOLEAN NOT NULL DEFAULT false,
    "sellerId" TEXT,
    "reviewStatus" TEXT NOT NULL DEFAULT 'approved',
    "reviewNote" TEXT,
    "pendingChanges" TEXT,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("active", "bestseller", "care", "category", "collection", "createdAt", "description", "details", "featured", "fromSeed", "id", "isNew", "material", "monogramable", "name", "slug", "specs", "tagline", "updatedAt") SELECT "active", "bestseller", "care", "category", "collection", "createdAt", "description", "details", "featured", "fromSeed", "id", "isNew", "material", "monogramable", "name", "slug", "specs", "tagline", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_category_collection_idx" ON "Product"("category", "collection");
CREATE INDEX "Product_sellerId_idx" ON "Product"("sellerId");
CREATE INDEX "Product_reviewStatus_idx" ON "Product"("reviewStatus");
CREATE TABLE "new_ProductImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "colourName" TEXT,
    "credit" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductImage" ("alt", "colourName", "credit", "id", "productId", "sortOrder", "url") SELECT "alt", "colourName", "credit", "id", "productId", "sortOrder", "url" FROM "ProductImage";
DROP TABLE "ProductImage";
ALTER TABLE "new_ProductImage" RENAME TO "ProductImage";
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Seller_slug_key" ON "Seller"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_email_key" ON "Seller"("email");

-- CreateIndex
CREATE INDEX "Seller_status_idx" ON "Seller"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SellerUser_email_key" ON "SellerUser"("email");

-- CreateIndex
CREATE INDEX "Shipment_orderId_idx" ON "Shipment"("orderId");

-- CreateIndex
CREATE INDEX "Shipment_sellerId_status_idx" ON "Shipment"("sellerId", "status");

-- CreateIndex
CREATE INDEX "LedgerEntry_sellerId_availableAt_idx" ON "LedgerEntry"("sellerId", "availableAt");

-- CreateIndex
CREATE INDEX "Payout_sellerId_idx" ON "Payout"("sellerId");

-- Backfill: every existing order becomes one shipment from xomexo itself
-- (there were no marketplace sellers before this migration).
INSERT INTO "Shipment" ("id", "orderId", "sellerId", "status", "merchandiseCents", "shippingCents", "shippingGstCents", "method", "trackingNumber", "createdAt", "updatedAt")
SELECT
  'shp_' || "id",
  "id",
  NULL,
  CASE "status"
    WHEN 'PENDING' THEN 'PENDING'
    WHEN 'PAID' THEN 'TO_SHIP'
    WHEN 'PACKED' THEN 'PACKED'
    WHEN 'SHIPPED' THEN 'SHIPPED'
    WHEN 'DELIVERED' THEN 'DELIVERED'
    ELSE 'CANCELLED'
  END,
  "subtotalCents",
  "shippingCents",
  CAST(ROUND("shippingCents" / 11.0) AS INTEGER),
  "shippingMethod",
  "trackingNumber",
  "createdAt",
  "updatedAt"
FROM "Order";

UPDATE "OrderItem" SET
  "shipmentId" = 'shp_' || "orderId",
  "gstCents" = CAST(ROUND((("unitCents" + "monogramCents") * "quantity") / 11.0) AS INTEGER);
