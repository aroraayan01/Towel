export type Category = "towels" | "rugs";

export type Collection = {
  slug: string;
  category: Category;
  name: string;
  blurb: string;
  /** Photo used for this collection's tile on the home page */
  image: string;
};

const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const CATEGORIES: Record<Category, { name: string; blurb: string }> = {
  towels: {
    name: "Towels",
    blurb: "Bath, hand and beach towels in cotton terry, waffle and flat weave.",
  },
  rugs: {
    name: "Rugs & mats",
    blurb: "Jute, wool and cotton rugs, hallway runners and bath mats.",
  },
};

export const COLLECTIONS: Collection[] = [
  { slug: "bath-towels", category: "towels", name: "Bath towels", blurb: "Terry, waffle and stripe, in hand towel to bath sheet sizes.", image: u("1650481093978-6cc58e4649f4") },
  { slug: "beach-towels", category: "towels", name: "Beach towels", blurb: "Plush pool towels, flat weaves and Turkish towels.", image: u("1686125429003-f552c9f16504") },
  { slug: "hand-towels", category: "towels", name: "Hand towels", blurb: "Hand towel pairs and face washer sets.", image: u("1616663717839-2fea42e1a1f6") },
  { slug: "area-rugs", category: "rugs", name: "Rugs", blurb: "Jute, wool and washable cotton rugs for living rooms and bedrooms.", image: u("1594040226829-7f251ab46d80") },
  { slug: "runners", category: "rugs", name: "Runners", blurb: "Long, narrow rugs for hallways and kitchens.", image: u("1766052409111-0bd046af4be1") },
  { slug: "bath-mats", category: "rugs", name: "Bath mats", blurb: "Chenille and memory foam, all machine washable.", image: u("1681742308509-e32e0a7c2cb8") },
];

export function collectionBySlug(slug: string) {
  return COLLECTIONS.find((c) => c.slug === slug);
}

export function isCategory(slug: string): slug is Category {
  return slug === "towels" || slug === "rugs";
}
