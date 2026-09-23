export type Category = "towels" | "rugs";

export type Collection = {
  slug: string;
  category: Category;
  name: string;
  blurb: string;
};

export const CATEGORIES: Record<Category, { name: string; blurb: string }> = {
  towels: {
    name: "Towels",
    blurb:
      "Bath, beach and everything between. Heavy enough to feel like a hug, quick enough to dry on a humid Brisbane afternoon.",
  },
  rugs: {
    name: "Rugs & Mats",
    blurb:
      "Wool, jute and washable cotton rugs that stand up to muddy paws, sandy feet and real life.",
  },
};

export const COLLECTIONS: Collection[] = [
  {
    slug: "bath-towels",
    category: "towels",
    name: "Bath Towels",
    blurb: "Plush, waffle and striped towels for everyday use.",
  },
  {
    slug: "beach-towels",
    category: "towels",
    name: "Beach Towels",
    blurb: "Sand-shedding, quick-drying and big enough for two.",
  },
  {
    slug: "hand-towels",
    category: "towels",
    name: "Hand Towels & Face Washers",
    blurb: "The little ones that do the most work.",
  },
  {
    slug: "bath-mats",
    category: "rugs",
    name: "Bath Mats",
    blurb: "Thirsty, non-slip and soft underfoot.",
  },
  {
    slug: "area-rugs",
    category: "rugs",
    name: "Area Rugs",
    blurb: "Wool, jute and flatweave rugs for living and bedrooms.",
  },
  {
    slug: "runners",
    category: "rugs",
    name: "Hallway Runners",
    blurb: "Long, narrow and ready for the school run.",
  },
];

export function collectionBySlug(slug: string) {
  return COLLECTIONS.find((c) => c.slug === slug);
}

export function isCategory(slug: string): slug is Category {
  return slug === "towels" || slug === "rugs";
}
