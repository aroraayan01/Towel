export type Category = "bath" | "bedding" | "rugs" | "leather";

export type Collection = {
  slug: string;
  category: Category;
  name: string;
  blurb: string;
  /** Photo for this collection's tile */
  image: string;
};

const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const CATEGORY_ORDER: Category[] = ["bath", "bedding", "rugs", "leather"];

export const CATEGORIES: Record<Category, { name: string; blurb: string; image: string }> = {
  bath: {
    name: "Bath",
    blurb: "Cotton terry, waffle and Turkish towels, from face washers to beach towels.",
    image: u("1596683705523-eb49540c3934"),
  },
  bedding: {
    name: "Bedding",
    blurb: "Merino and bamboo quilts, French linen, silk pillowcases, throws and wool blankets.",
    image: u("1601276174812-63280a55656e"),
  },
  rugs: {
    name: "Rugs",
    blurb: "Jute, wool and washable cotton rugs, hallway runners and bath mats.",
    image: u("1778088442792-29c430a4c93f"),
  },
  leather: {
    name: "Leather",
    blurb: "Full-grain leather bags, wallets and pieces for the home.",
    image: u("1637759292654-a12cb2be085e"),
  },
};

export const COLLECTIONS: Collection[] = [
  { slug: "bath-towels", category: "bath", name: "Bath towels", blurb: "Terry, waffle and stripe, from hand towel to bath sheet.", image: u("1650481093978-6cc58e4649f4") },
  { slug: "beach-towels", category: "bath", name: "Beach towels", blurb: "Plush pool towels, flat weaves and Turkish towels.", image: u("1686125429003-f552c9f16504") },
  { slug: "hand-towels", category: "bath", name: "Hand towels", blurb: "Hand towel pairs and face washer sets.", image: u("1616663717839-2fea42e1a1f6") },
  { slug: "quilts", category: "bedding", name: "Quilts", blurb: "Australian merino for winter, bamboo for hot nights.", image: u("1506720186575-11354d325017") },
  { slug: "bed-linen", category: "bedding", name: "Bed linen", blurb: "French linen quilt covers and sheets, mulberry silk pillowcases.", image: u("1639813806536-11895df1ff64") },
  { slug: "throws-blankets", category: "bedding", name: "Throws & blankets", blurb: "Chunky knits, merino throws and woven wool blankets.", image: u("1674475762498-75310193b4f4") },
  { slug: "area-rugs", category: "rugs", name: "Area rugs", blurb: "Jute, wool and washable cotton rugs.", image: u("1594040226829-7f251ab46d80") },
  { slug: "runners", category: "rugs", name: "Runners", blurb: "Long, narrow rugs for hallways and kitchens.", image: u("1766052409111-0bd046af4be1") },
  { slug: "bath-mats", category: "rugs", name: "Bath mats", blurb: "Chenille and memory foam, all machine washable.", image: u("1681742308509-e32e0a7c2cb8") },
  { slug: "bags", category: "leather", name: "Bags", blurb: "Weekenders, satchels, totes and toiletry bags.", image: u("1525103504173-8dc1582c7430") },
  { slug: "small-leather-goods", category: "leather", name: "Wallets & accessories", blurb: "Card holders, wallets and belts.", image: u("1628483211662-9bcc692c46dc") },
  { slug: "leather-home", category: "leather", name: "Leather for the home", blurb: "Poufs, stools and desk trays.", image: u("1690618299438-cb453b14bab3") },
];

export function collectionBySlug(slug: string) {
  return COLLECTIONS.find((c) => c.slug === slug);
}

export function isCategory(slug: string): slug is Category {
  return (CATEGORY_ORDER as string[]).includes(slug);
}
