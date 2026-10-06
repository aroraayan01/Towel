"use client";

import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export type AdminImage = { id: string; url: string; alt: string; colourName: string | null; approved?: boolean };

type ImageActions = {
  update: (form: FormData) => Promise<void>;
  move: (form: FormData) => Promise<void>;
  remove: (form: FormData) => Promise<void>;
};

type Progress = { done: number; total: number; errors: string[] } | null;

/** Photo manager for a product. Admin and sellers pass their own upload endpoint and actions. */
export function ProductImages({
  images,
  colours,
  uploadUrl,
  actions,
}: {
  images: AdminImage[];
  colours: string[];
  uploadUrl: string;
  actions: ImageActions;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [colour, setColour] = useState("");
  const [progress, setProgress] = useState<Progress>(null);
  const [dragging, setDragging] = useState(false);
  const busy = progress !== null && progress.done < progress.total;

  async function upload(files: File[]) {
    const list = files.filter((f) => f.type.startsWith("image/") || /\.(heic|heif|avif)$/i.test(f.name));
    if (!list.length) return;
    const errors: string[] = [];
    setProgress({ done: 0, total: list.length, errors });
    // One at a time: kinder to a slow connection, and errors are per photo
    for (const [i, file] of list.entries()) {
      const body = new FormData();
      body.set("file", file);
      if (colour) body.set("colourName", colour);
      try {
        const res = await fetch(uploadUrl, { method: "POST", body });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          errors.push(`${file.name}: ${data?.error ?? `upload failed (${res.status})`}`);
        }
      } catch {
        errors.push(`${file.name}: the connection dropped. Try that one again.`);
      }
      setProgress({ done: i + 1, total: list.length, errors: [...errors] });
    }
    router.refresh();
    if (!errors.length) setTimeout(() => setProgress(null), 2500);
  }

  return (
    <section className="border-line space-y-4 border bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-sans text-[15px] font-semibold">Photos</h2>
        <p className="text-grey text-xs">
          The first photo is the main one. Square or 4:5 portrait, at least 1200px, on a plain background works best.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) upload([...e.dataTransfer.files]);
        }}
        className={`flex flex-col items-center gap-3 border border-dashed px-4 py-8 text-center transition-colors ${dragging ? "border-forest bg-forest/5" : "border-line"}`}
      >
        <ImagePlus size={28} strokeWidth={1.3} className="text-grey" />
        <p className="text-sm">
          Drag photos here, or{" "}
          <button type="button" className="link" onClick={() => input.current?.click()} disabled={busy}>
            choose files
          </button>
        </p>
        {colours.length > 1 && (
          <label className="text-grey flex items-center gap-2 text-xs">
            Upload as
            <select className="input w-auto py-1 text-xs" value={colour} onChange={(e) => setColour(e.target.value)}>
              <option value="">All colours</option>
              {colours.map((c) => (
                <option key={c} value={c}>
                  {c} only
                </option>
              ))}
            </select>
          </label>
        )}
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          onChange={(e) => {
            upload([...(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
        {progress && (
          <div className="w-full max-w-sm" role="status">
            <div className="bg-bone h-1.5 overflow-hidden">
              <div className="bg-forest h-full transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
            <p className="text-grey mt-1.5 text-xs">
              {busy
                ? `Uploading ${progress.done + 1} of ${progress.total}…`
                : `Uploaded ${progress.total - progress.errors.length} of ${progress.total}.`}
            </p>
          </div>
        )}
        {progress?.errors.map((e) => (
          <p key={e} className="text-sale text-xs">
            {e}
          </p>
        ))}
      </div>

      {images.length === 0 ? (
        <p className="text-grey text-sm">No photos yet. Products without photos show a plain placeholder in the shop.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-4">
          {images.map((img, i) => (
            // Keyed on the saved values too, so the card redraws with them after a save
            <li key={`${img.id}|${img.colourName ?? ""}|${img.alt}`} className="border-line border">
              <div className="bg-bone relative aspect-[4/5]">
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 1536px) 20vw, (min-width: 768px) 28vw, 45vw"
                  className="object-cover"
                />
                {i === 0 && (
                  <span className="bg-forest absolute top-2 left-2 px-2 py-0.5 text-[10px] tracking-wider text-white uppercase">
                    Main photo
                  </span>
                )}
                {img.approved === false && (
                  <span className="absolute top-2 right-2 bg-[#c9a13b] px-2 py-0.5 text-[10px] tracking-wider text-white uppercase">
                    Awaiting approval
                  </span>
                )}
                {img.url.includes("unsplash.com") && (
                  <span className="absolute right-2 bottom-2 bg-black/60 px-2 py-0.5 text-[10px] text-white">Sample stock photo</span>
                )}
              </div>
              <form action={actions.update} className="space-y-2 p-3">
                <input type="hidden" name="id" value={img.id} />
                <input
                  name="alt"
                  defaultValue={img.alt}
                  className="input px-2 py-1.5 text-xs"
                  aria-label="Description for screen readers and search"
                  placeholder="What's in the photo"
                  maxLength={200}
                />
                {colours.length > 1 && (
                  <select
                    name="colourName"
                    defaultValue={img.colourName ?? ""}
                    className="input px-2 py-1.5 text-xs"
                    aria-label="Which colour this photo shows"
                  >
                    <option value="">All colours</option>
                    {colours.map((c) => (
                      <option key={c} value={c}>
                        {c} only
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex items-center justify-between">
                  <button className="text-xs font-semibold hover:underline">Save</button>
                  <span className="flex items-center">
                    <IconAction action={actions.move} id={img.id} dir="up" label="Move earlier" disabled={i === 0}>
                      <ArrowLeft size={15} />
                    </IconAction>
                    <IconAction action={actions.move} id={img.id} dir="down" label="Move later" disabled={i === images.length - 1}>
                      <ArrowRight size={15} />
                    </IconAction>
                    <IconAction action={actions.remove} id={img.id} label="Delete photo" confirmText="Delete this photo?">
                      <Trash2 size={15} />
                    </IconAction>
                  </span>
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** A small icon button that submits its own server action (forms can't nest, so it uses formAction). */
function IconAction({
  action,
  id,
  dir,
  label,
  disabled,
  confirmText,
  children,
}: {
  action: (form: FormData) => Promise<void>;
  id: string;
  dir?: "up" | "down";
  label: string;
  disabled?: boolean;
  confirmText?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      formAction={async () => {
        if (confirmText && !confirm(confirmText)) return;
        const form = new FormData();
        form.set("id", id);
        if (dir) form.set("dir", dir);
        await action(form);
      }}
      disabled={disabled}
      className={`grid size-8 place-items-center disabled:opacity-25 ${confirmText ? "text-grey hover:text-sale" : "text-grey hover:text-ink"}`}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
