"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { CATEGORIES, CATEGORY_ORDER, COLLECTIONS, type Category } from "@/lib/collections";
import type { SaveState } from "@/lib/catalogue";

export type EditorProduct = {
  id?: string;
  name: string;
  slug: string;
  category: Category;
  collection: string;
  tagline: string;
  description: string;
  details: string[];
  specs: { label: string; value: string }[];
  material: string;
  care: string;
  active: boolean;
  featured: boolean;
  bestseller: boolean;
  isNew: boolean;
  monogramable: boolean;
  variants: EditorVariant[];
};

export type EditorVariant = {
  id?: string;
  colourName: string;
  colourHex: string;
  size: string;
  price: string;
  compareAt: string;
  stock: string;
  sku: string;
  ordered?: boolean;
};

type Row = EditorVariant & { key: string };
type SpecRow = { key: string; label: string; value: string };

/** Suggested labels for the specifications table, by category. Any label can be typed. */
const SPEC_LABELS: Record<Category, string[]> = {
  bath: ["Size", "Weight", "Fibre", "Weave", "Pile", "Absorbency", "Origin"],
  bedding: ["Dimensions", "Fill", "Fill weight", "Warmth", "Fabric", "Thread count", "Closure", "Origin"],
  rugs: ["Dimensions", "Pile height", "Construction", "Backing", "Fibre", "Suitable for", "Origin"],
  leather: ["Dimensions", "Leather", "Lining", "Hardware", "Strap drop", "Capacity", "Weight", "Origin"],
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

/** A starting swatch for common colour names; it can always be changed. */
const SWATCHES: [RegExp, string][] = [
  [/white|ivory|snow|chalk/i, "#f4f2ec"],
  [/cream|natural|oat|ecru|linen|flax|sand|stone|bone/i, "#e3dccb"],
  [/black|ink|onyx/i, "#1d1d1d"],
  [/charcoal|graphite|slate/i, "#45484b"],
  [/grey|gray|silver|fog|mist/i, "#a3a5a6"],
  [/navy|indigo|midnight/i, "#25324a"],
  [/blue|ocean|sky/i, "#6f8fb0"],
  [/sage|olive|moss|eucalypt/i, "#8d9a7c"],
  [/green|forest|bottle/i, "#2f5243"],
  [/tan|camel|caramel|honey/i, "#b07d4f"],
  [/cognac|chestnut|brown|chocolate|walnut|espresso/i, "#6b4129"],
  [/rust|terracotta|clay|brick/i, "#a65a3a"],
  [/pink|blush|rose|dusk/i, "#d9a9a3"],
  [/red|burgundy|wine|oxblood/i, "#7a2730"],
  [/yellow|mustard|ochre/i, "#c99a36"],
];
const guessHex = (name: string) => SWATCHES.find(([re]) => re.test(name))?.[1] ?? "#c8c4bc";

let nextKey = 0;
const withKey = (v: EditorVariant): Row => ({ ...v, key: `r${nextKey++}` });
const blankRow = (): Row =>
  withKey({ colourName: "", colourHex: "#c8c4bc", size: "One size", price: "", compareAt: "", stock: "0", sku: "" });

/**
 * The product form, used by admin and by sellers. Sellers don't see the web
 * address or the shop's own labels (New, Bestseller, Featured).
 */
export function ProductEditor({
  product,
  save,
  remove,
  mode = "admin",
}: {
  product: EditorProduct;
  save: (state: SaveState, form: FormData) => Promise<SaveState>;
  remove?: (form: FormData) => Promise<void>;
  mode?: "admin" | "seller";
}) {
  const seller = mode === "seller";
  const [state, action, pending] = useActionState<SaveState, FormData>(save, null);
  const err = state?.fields ?? {};

  const [f, setF] = useState(() => ({ ...product, details: product.details.join("\n") }));
  const [slugTouched, setSlugTouched] = useState(Boolean(product.id));
  const [rows, setRows] = useState<Row[]>(() => (product.variants.length ? product.variants.map(withKey) : [blankRow()]));
  const [specs, setSpecs] = useState<SpecRow[]>(() => product.specs.map((sp) => ({ ...sp, key: `s${nextKey++}` })));

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const setRow = (key: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const collections = useMemo(() => COLLECTIONS.filter((c) => c.category === f.category), [f.category]);

  const payload = JSON.stringify({
    id: product.id,
    name: f.name,
    // Sellers never see the web address (it's set for them), so never let it block a save
    slug: f.slug || "product",
    category: f.category,
    collection: f.collection,
    tagline: f.tagline,
    description: f.description,
    details: f.details
      .split("\n")
      .map((l) => l.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean),
    // Rows left completely empty are dropped rather than flagged
    specs: specs.map(({ label, value }) => ({ label, value })).filter((sp) => sp.label.trim() || sp.value.trim()),
    material: f.material,
    care: f.care,
    active: f.active,
    featured: f.featured,
    bestseller: f.bestseller,
    isNew: f.isNew,
    monogramable: f.monogramable,
    variants: rows.map((r) => ({
      id: r.id,
      colourName: r.colourName,
      colourHex: r.colourHex,
      size: r.size,
      price: r.price,
      compareAt: r.compareAt,
      stock: r.stock === "" ? "0" : r.stock,
      sku: r.sku,
    })),
  });

  return (
    <div className="pb-28">
      <form id="product-form" action={action}>
        <input type="hidden" name="payload" value={payload} />

        <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
          <div className="space-y-6">
            <Card title="Basics">
              <Field label="Product name" error={err.name}>
                <input
                  className="input"
                  value={f.name}
                  maxLength={120}
                  placeholder="e.g. Merino Wool Quilt"
                  onChange={(e) => {
                    set("name", e.target.value);
                    if (!slugTouched) set("slug", slugify(e.target.value));
                  }}
                  required
                />
              </Field>
              {!seller && (
                <Field label="Web address" error={err.slug} hint="Changing this breaks old links to the product.">
                  <div className="flex items-center">
                    <span className="border-line text-grey border border-r-0 bg-bone px-3 py-[11px] text-[13px] whitespace-nowrap">
                      /products/
                    </span>
                    <input
                      className="input"
                      value={f.slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        set("slug", slugify(e.target.value) || e.target.value.toLowerCase());
                      }}
                      required
                    />
                  </div>
                </Field>
              )}
              <Field label="Tagline" error={err.tagline} hint="One short line shown under the name, e.g. “600gsm zero-twist cotton”.">
                <input className="input" value={f.tagline} maxLength={160} onChange={(e) => set("tagline", e.target.value)} />
              </Field>
            </Card>

            <Card title="Description">
              <Field label="Description" error={err.description}>
                <textarea
                  className="input min-h-36"
                  value={f.description}
                  maxLength={5000}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>
              <Field
                label="Details"
                error={err.details}
                hint="One per line. Shown as a bulleted list, e.g. sizes, weight, where it's made."
              >
                <textarea
                  className="input min-h-32 font-mono text-[13px]"
                  value={f.details}
                  onChange={(e) => set("details", e.target.value)}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Material" error={err.material}>
                  <input
                    className="input"
                    value={f.material}
                    maxLength={200}
                    placeholder="e.g. 100% Australian merino wool"
                    onChange={(e) => set("material", e.target.value)}
                  />
                </Field>
                <Field label="Care" error={err.care}>
                  <input
                    className="input"
                    value={f.care}
                    maxLength={1000}
                    placeholder="e.g. Machine wash cold, line dry"
                    onChange={(e) => set("care", e.target.value)}
                  />
                </Field>
              </div>
            </Card>

            <Specs specs={specs} setSpecs={setSpecs} category={f.category} error={err.specs} />

            <Options rows={rows} setRows={setRows} setRow={setRow} error={err.variants} slug={f.slug} />
          </div>

          <div className="space-y-6">
            <Card title="Visibility">
              <Check
                label="Show in shop"
                hint={
                  seller ? "Once approved. Turn off to hide it, e.g. while you're away." : "Turn off to keep it hidden while you finish it."
                }
                checked={f.active}
                onChange={(v) => set("active", v)}
              />
            </Card>
            <Card title="Organisation">
              <Field label="Category" error={err.category}>
                <select
                  className="input"
                  value={f.category}
                  onChange={(e) => {
                    const category = e.target.value as Category;
                    setF((s) => ({ ...s, category, collection: COLLECTIONS.find((c) => c.category === category)!.slug }));
                  }}
                >
                  {CATEGORY_ORDER.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORIES[c].name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Collection" error={err.collection}>
                <select className="input" value={f.collection} onChange={(e) => set("collection", e.target.value)}>
                  {collections.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </Card>
            <Card title={seller ? "Personalisation" : "Labels"}>
              {!seller && (
                <>
                  <Check
                    label="New"
                    hint="Shows a “New” label and puts it in New arrivals."
                    checked={f.isNew}
                    onChange={(v) => set("isNew", v)}
                  />
                  <Check
                    label="Bestseller"
                    hint="Shows on the home page under Bestsellers."
                    checked={f.bestseller}
                    onChange={(v) => set("bestseller", v)}
                  />
                  <Check
                    label="Featured"
                    hint="Listed first in its collection."
                    checked={f.featured}
                    onChange={(v) => set("featured", v)}
                  />
                </>
              )}
              <Check
                label="Offer personalisation"
                hint={
                  f.category === "leather"
                    ? "Customers can add initials, heat-debossed (+$12)."
                    : "Customers can add a monogram, embroidered (+$12)."
                }
                checked={f.monogramable}
                onChange={(v) => set("monogramable", v)}
              />
            </Card>
          </div>
        </div>
      </form>

      {/* Sticky save bar */}
      <div className="border-line fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 backdrop-blur lg:left-60">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <p className={`text-sm ${state?.error ? "text-sale" : "text-grey"}`} role={state?.error ? "alert" : undefined}>
            {state?.error ??
              (seller
                ? product.id
                  ? "Price, stock and option changes go live straight away. Description changes are checked by us first."
                  : "Save first, then add photos. We check new products before they go live."
                : product.id
                  ? "Changes go live as soon as you save."
                  : "Save first, then add photos.")}
          </p>
          <div className="flex items-center gap-3">
            {product.id && remove && (
              <form
                action={remove}
                onSubmit={(e) => {
                  if (!confirm(`Delete "${product.name}" and its photos? This can't be undone.`)) e.preventDefault();
                }}
              >
                <input type="hidden" name="id" value={product.id} />
                <button className="text-sale px-3 text-sm hover:underline">Delete product</button>
              </form>
            )}
            <button form="product-form" className="btn btn-dark h-11 px-6" disabled={pending}>
              {pending ? "Saving…" : product.id ? "Save changes" : seller ? "Save product" : "Create product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Options({
  rows,
  setRows,
  setRow,
  error,
  slug,
}: {
  rows: Row[];
  setRows: React.Dispatch<React.SetStateAction<Row[]>>;
  setRow: (key: string, patch: Partial<Row>) => void;
  error?: string;
  slug: string;
}) {
  const [bulk, setBulk] = useState({ colours: "", sizes: "", price: "", stock: "" });
  const [bulkOpen, setBulkOpen] = useState(false);

  const list = (s: string) => [
    ...new Set(
      s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    ),
  ];
  const bulkColours = list(bulk.colours);
  const bulkSizes = list(bulk.sizes);
  const combos = (bulkColours.length ? bulkColours : ["One colour"]).flatMap((c) =>
    (bulkSizes.length ? bulkSizes : ["One size"]).map((s) => [c, s] as const),
  );
  const fresh = combos.filter(
    ([c, s]) => !rows.some((r) => r.colourName.toLowerCase() === c.toLowerCase() && r.size.toLowerCase() === s.toLowerCase()),
  );

  function addBulk() {
    setRows((rs) => {
      // Drop the untouched starter row so it doesn't sit there empty
      const base = rs.filter((r) => r.id || r.colourName || r.price);
      const hexFor = (c: string) => base.find((r) => r.colourName.toLowerCase() === c.toLowerCase())?.colourHex ?? guessHex(c);
      return [
        ...base,
        ...fresh.map(([c, s]) =>
          withKey({ colourName: c, colourHex: hexFor(c), size: s, price: bulk.price, compareAt: "", stock: bulk.stock || "0", sku: "" }),
        ),
      ];
    });
    setBulk({ colours: "", sizes: "", price: "", stock: "" });
    setBulkOpen(false);
  }

  return (
    <Card title="Options, prices and stock">
      <p className="text-grey -mt-2 text-[13px]">
        One row per colour and size combination customers can buy. Prices include GST. If there&apos;s only one colour or size, enter it
        once (e.g. &quot;Natural&quot;, &quot;One size&quot;) and customers won&apos;t be asked to choose.
      </p>
      {error && <p className="text-sale text-sm">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="text-grey text-xs">
            <tr>
              <th className="py-2 pr-2 font-semibold">Colour</th>
              <th className="px-2 py-2 font-semibold">Size</th>
              <th className="px-2 py-2 font-semibold">Price $</th>
              <th className="px-2 py-2 font-semibold">Was $</th>
              <th className="px-2 py-2 font-semibold">Stock</th>
              <th className="px-2 py-2 font-semibold">SKU</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-line border-t align-top">
                <td className="py-2 pr-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={r.colourHex}
                      onChange={(e) => setRow(r.key, { colourHex: e.target.value })}
                      className="border-line size-9 shrink-0 cursor-pointer border bg-white p-0.5"
                      aria-label="Swatch colour"
                      title="Swatch colour shown to customers"
                    />
                    <input
                      className="input px-2 py-1.5"
                      value={r.colourName}
                      placeholder="e.g. Natural"
                      maxLength={40}
                      onChange={(e) => setRow(r.key, { colourName: e.target.value })}
                      onBlur={(e) => {
                        // New colour with the default swatch: suggest one from its name
                        if (!r.id && r.colourHex === "#c8c4bc" && e.target.value) setRow(r.key, { colourHex: guessHex(e.target.value) });
                      }}
                      aria-label="Colour name"
                    />
                  </div>
                </td>
                <td className="px-2 py-2">
                  <input
                    className="input px-2 py-1.5"
                    value={r.size}
                    maxLength={40}
                    onChange={(e) => setRow(r.key, { size: e.target.value })}
                    aria-label="Size"
                  />
                </td>
                <td className="w-28 px-2 py-2">
                  <input
                    className="input px-2 py-1.5"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={r.price}
                    onChange={(e) => setRow(r.key, { price: e.target.value })}
                    aria-label="Price"
                    required
                  />
                </td>
                <td className="w-28 px-2 py-2">
                  <input
                    className="input px-2 py-1.5"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={r.compareAt}
                    placeholder="—"
                    onChange={(e) => setRow(r.key, { compareAt: e.target.value })}
                    aria-label="Was price (optional)"
                    title="Optional. Shown crossed out when it's higher than the price."
                  />
                </td>
                <td className="w-24 px-2 py-2">
                  <input
                    className="input px-2 py-1.5"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={r.stock}
                    onChange={(e) => setRow(r.key, { stock: e.target.value })}
                    aria-label="Stock"
                  />
                </td>
                <td className="w-44 px-2 py-2">
                  <input
                    className="input px-2 py-1.5 font-mono text-[12px] uppercase"
                    value={r.sku}
                    placeholder={slug && r.colourName ? "auto" : ""}
                    maxLength={60}
                    onChange={(e) => setRow(r.key, { sku: e.target.value.toUpperCase() })}
                    aria-label="SKU (optional)"
                    title="Leave blank to generate one"
                  />
                </td>
                <td className="py-2 pl-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        r.ordered &&
                        !confirm(
                          "This option has been ordered before. It'll be kept at 0 stock for the order history rather than deleted. Continue?",
                        )
                      )
                        return;
                      setRows((rs) => rs.filter((x) => x.key !== r.key));
                    }}
                    disabled={rows.length === 1}
                    className="text-grey hover:text-sale grid size-9 place-items-center disabled:opacity-30"
                    aria-label="Remove this option"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn btn-line h-9 px-3 text-[12px]"
          onClick={() => {
            const last = rows[rows.length - 1];
            setRows((rs) => [...rs, last ? withKey({ ...last, id: undefined, ordered: false, sku: "", size: "" }) : blankRow()]);
          }}
        >
          <Plus size={14} className="mr-1" /> Add option
        </button>
        <button type="button" className="btn btn-line h-9 px-3 text-[12px]" onClick={() => setBulkOpen((o) => !o)} aria-expanded={bulkOpen}>
          Add colours × sizes in bulk
        </button>
      </div>

      {bulkOpen && (
        <div className="border-line space-y-3 border bg-bone/60 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Colours" hint="Comma-separated, e.g. Natural, Charcoal, Sage">
              <input className="input" value={bulk.colours} onChange={(e) => setBulk({ ...bulk, colours: e.target.value })} />
            </Field>
            <Field label="Sizes" hint="Comma-separated, e.g. Single, Queen, King">
              <input className="input" value={bulk.sizes} onChange={(e) => setBulk({ ...bulk, sizes: e.target.value })} />
            </Field>
            <Field label="Price $ for each" hint="You can change individual prices after.">
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={bulk.price}
                onChange={(e) => setBulk({ ...bulk, price: e.target.value })}
              />
            </Field>
            <Field label="Stock for each">
              <input
                className="input"
                type="number"
                min="0"
                step="1"
                value={bulk.stock}
                onChange={(e) => setBulk({ ...bulk, stock: e.target.value })}
              />
            </Field>
          </div>
          <button
            type="button"
            className="btn btn-dark h-9 px-4 text-[12px]"
            onClick={addBulk}
            disabled={!fresh.length || (!bulkColours.length && !bulkSizes.length)}
          >
            Add {fresh.length} option{fresh.length === 1 ? "" : "s"}
          </button>
          {combos.length > fresh.length && (
            <p className="text-grey text-xs">{combos.length - fresh.length} already in the list, skipped.</p>
          )}
        </div>
      )}
    </Card>
  );
}

function Specs({
  specs,
  setSpecs,
  category,
  error,
}: {
  specs: SpecRow[];
  setSpecs: React.Dispatch<React.SetStateAction<SpecRow[]>>;
  category: Category;
  error?: string;
}) {
  const set = (key: string, patch: Partial<SpecRow>) => setSpecs((ss) => ss.map((sp) => (sp.key === key ? { ...sp, ...patch } : sp)));
  const move = (i: number, d: -1 | 1) =>
    setSpecs((ss) => {
      const next = [...ss];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });
  const unused = SPEC_LABELS[category].filter((l) => !specs.some((sp) => sp.label.toLowerCase() === l.toLowerCase()));

  return (
    <Card title="Specifications">
      <p className="text-grey -mt-2 text-[13px]">
        Shown as a table on the product page. Put measurements here, e.g. Dimensions: 210 × 210cm, Fill: 500gsm Australian merino. Leave it
        empty and the table is hidden.
      </p>
      {error && <p className="text-sale text-sm">{error}</p>}
      {specs.length > 0 && (
        <div className="space-y-2">
          {specs.map((sp, i) => (
            <div key={sp.key} className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)_auto] items-center gap-2">
              <input
                className="input px-2 py-1.5"
                value={sp.label}
                placeholder="Label"
                maxLength={60}
                list="spec-labels"
                onChange={(e) => set(sp.key, { label: e.target.value })}
                aria-label="Spec label"
              />
              <input
                className="input px-2 py-1.5"
                value={sp.value}
                placeholder="Value"
                maxLength={300}
                onChange={(e) => set(sp.key, { value: e.target.value })}
                aria-label="Spec value"
              />
              <span className="flex">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="text-grey hover:text-ink grid size-8 place-items-center disabled:opacity-25"
                  aria-label="Move up"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === specs.length - 1}
                  className="text-grey hover:text-ink grid size-8 place-items-center disabled:opacity-25"
                  aria-label="Move down"
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setSpecs((ss) => ss.filter((x) => x.key !== sp.key))}
                  className="text-grey hover:text-sale grid size-8 place-items-center"
                  aria-label="Remove this spec"
                >
                  <Trash2 size={15} />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
      <datalist id="spec-labels">
        {SPEC_LABELS[category].map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-line h-9 px-3 text-[12px]"
          onClick={() => setSpecs((ss) => [...ss, { key: `s${nextKey++}`, label: "", value: "" }])}
          disabled={specs.length >= 30}
        >
          <Plus size={14} className="mr-1" /> Add spec
        </button>
        {unused.slice(0, 6).map((l) => (
          <button
            key={l}
            type="button"
            className="border-line hover:border-ink border px-2.5 py-1 text-[12px]"
            onClick={() => setSpecs((ss) => [...ss, { key: `s${nextKey++}`, label: l, value: "" }])}
            disabled={specs.length >= 30}
          >
            + {l}
          </button>
        ))}
      </div>
    </Card>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-line space-y-4 border bg-white p-5">
      <h2 className="font-sans text-[15px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {error ? (
        <span className="text-sale mt-1 block text-xs">{error}</span>
      ) : hint ? (
        <span className="text-grey mt-1 block text-xs">{hint}</span>
      ) : null}
    </label>
  );
}

function Check({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" className="accent-forest mt-0.5 size-4" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="text-grey block text-xs">{hint}</span>}
      </span>
    </label>
  );
}
