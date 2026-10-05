-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "care" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "bestseller" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "monogramable" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "fromSeed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("active", "bestseller", "care", "category", "collection", "createdAt", "description", "details", "featured", "id", "isNew", "material", "monogramable", "name", "slug", "tagline", "updatedAt") SELECT "active", "bestseller", "care", "category", "collection", "createdAt", "description", "details", "featured", "id", "isNew", "material", "monogramable", "name", "slug", "tagline", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_category_collection_idx" ON "Product"("category", "collection");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Every product that exists before this migration came from the seed catalogue
-- (nothing could be created in /admin until now), so mark them as samples.
UPDATE "Product" SET "fromSeed" = true;
