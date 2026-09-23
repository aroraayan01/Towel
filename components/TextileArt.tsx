/**
 * Illustrated product imagery, drawn in each variant's real colours.
 *
 * This stands in for photography until real product photos exist — set
 * `imageUrl` on a product and a photo is shown instead. Because it's drawn
 * from the variant's colours, picking a swatch on the product page updates
 * the image instantly.
 */

export type ArtView = "main" | "alt" | "detail";

type Props = {
  category: string;
  collection: string;
  pattern: string;
  colour: string;
  accent: string;
  view?: ArtView;
  imageUrl?: string | null;
  alt: string;
  className?: string;
};

export function viewsFor(collection: string): ArtView[] {
  return collection === "bath-mats" ? ["main", "detail"] : ["main", "alt", "detail"];
}

export function TextileArt(props: Props) {
  const { imageUrl, alt, className, view = "main" } = props;
  if (imageUrl && view === "main") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt={alt} className={`h-full w-full object-cover ${className ?? ""}`} />;
  }
  const isRug = props.category === "rugs";
  return (
    <svg
      viewBox={viewBoxFor(props, view)}
      role="img"
      aria-label={alt}
      className={`block h-full w-full ${className ?? ""}`}
      preserveAspectRatio="xMidYMid slice"
    >
      {isRug ? (
        view === "alt" ? <RugRoom {...props} /> : <RugScene {...props} />
      ) : view === "alt" ? (
        <TowelStack {...props} />
      ) : (
        <TowelScene {...props} />
      )}
    </svg>
  );
}

// ─── colour helpers ──────────────────────────────────────────────
function rgb(hex: string) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function toHex(c: number[]) {
  return "#" + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
}
function mix(a: string, b: string, t: number) {
  const x = rgb(a);
  const y = rgb(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
}
/** amt < 0 darkens, amt > 0 lightens */
function shade(hex: string, amt: number) {
  return amt < 0 ? mix(hex, "#1e1a17", -amt) : mix(hex, "#ffffff", amt);
}
function idFor(p: Props) {
  const s = `${p.collection}|${p.pattern}|${p.colour}|${p.accent}|${p.view}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return "ta" + (h >>> 0).toString(36);
}

// ─── geometry ────────────────────────────────────────────────────
const RAIL_Y = 86;

function towelBox(collection: string) {
  const [w, h] =
    collection === "hand-towels" ? [170, 240] : collection === "beach-towels" ? [236, 360] : [212, 330];
  return { x: 200 - w / 2, y: RAIL_Y, w, h };
}

function rugBox(collection: string) {
  if (collection === "runners") return { x: 142, y: 44, w: 116, h: 412, rx: 3 };
  if (collection === "bath-mats") return { x: 60, y: 160, w: 280, h: 180, rx: 28 };
  return { x: 78, y: 70, w: 244, h: 360, rx: 3 };
}

function viewBoxFor(p: Props, view: ArtView) {
  if (view !== "detail") return "0 0 400 500";
  if (p.category === "rugs") {
    const b = rugBox(p.collection);
    if (p.collection === "bath-mats") return `${b.x - 10} ${b.y - 20} 176 220`;
    return `${b.x - 24} ${b.y + b.h - 180} 160 200`;
  }
  const b = towelBox(p.collection);
  return `${b.x - 14} ${b.y + b.h - 176} 160 200`;
}

// ─── shared defs ─────────────────────────────────────────────────
function Defs({ id, colour }: { id: string; colour: string }) {
  const dark = shade(colour, -0.35);
  return (
    <defs>
      <pattern id={`${id}-terry`} width="5" height="5" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="1" fill={dark} opacity="0.13" />
        <circle cx="4" cy="4" r="0.8" fill="#fff" opacity="0.10" />
      </pattern>
      <pattern id={`${id}-weave`} width="6" height="6" patternUnits="userSpaceOnUse">
        <path d="M0 1.5h3M3 4.5h3" stroke={dark} strokeWidth="1" opacity="0.14" />
        <path d="M3 1.5h3M0 4.5h3" stroke="#fff" strokeWidth="1" opacity="0.08" />
      </pattern>
      <pattern id={`${id}-waffle`} width="12" height="12" patternUnits="userSpaceOnUse">
        <rect x="1.5" y="1.5" width="9" height="9" rx="1.5" fill={dark} opacity="0.14" />
        <path d="M0 0.75h12M0.75 0v12" stroke="#fff" strokeWidth="1.5" opacity="0.18" />
      </pattern>
      <pattern id={`${id}-rib`} width="5" height="10" patternUnits="userSpaceOnUse">
        <path d="M2.5 0v10" stroke={dark} strokeWidth="1.4" opacity="0.18" />
      </pattern>
      <linearGradient id={`${id}-drape`} x1="0" x2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0.14" />
        <stop offset="0.22" stopColor="#fff" stopOpacity="0.08" />
        <stop offset="0.55" stopColor="#000" stopOpacity="0" />
        <stop offset="0.8" stopColor="#000" stopOpacity="0.07" />
        <stop offset="1" stopColor="#000" stopOpacity="0.16" />
      </linearGradient>
      <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="9" />
      </filter>
    </defs>
  );
}

// ─── towels ──────────────────────────────────────────────────────
function TowelScene(p: Props) {
  const id = idFor(p);
  const { x, y, w, h } = towelBox(p.collection);
  const bottom = y + h;
  const wall = mix(p.colour, "#f7f2ea", 0.84);
  const beachStripes = p.pattern === "stripe" && p.collection === "beach-towels";

  return (
    <>
      <Defs id={id} colour={p.colour} />
      <rect width="400" height="500" fill={wall} />
      {/* subtle tiles */}
      <g stroke="#fff" strokeWidth="1.5" opacity="0.45">
        {Array.from({ length: 8 }, (_, i) => (
          <path key={`v${i}`} d={`M${i * 56 + 4} 0v500`} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <path key={`h${i}`} d={`M0 ${i * 56 + 20}h400`} />
        ))}
      </g>

      {/* shadow */}
      <rect x={x + 10} y={y + 14} width={w} height={h} rx="6" fill="#000" opacity="0.16" filter={`url(#${id}-shadow)`} />

      <clipPath id={`${id}-clip`}>
        <rect x={x} y={y} width={w} height={h} rx="5" />
      </clipPath>
      <g clipPath={`url(#${id}-clip)`}>
        <rect x={x} y={y} width={w} height={h} fill={p.colour} />

        {beachStripes &&
          Array.from({ length: Math.ceil(w / 24) }, (_, i) =>
            i % 2 ? <rect key={i} x={x + i * 24} y={y} width="24" height={h} fill={p.accent} /> : null
          )}

        {p.pattern === "stripe" && !beachStripes && (
          <g fill={p.accent}>
            <rect x={x} y={bottom - 78} width={w} height="16" />
            <rect x={x} y={bottom - 54} width={w} height="6" />
            <rect x={x} y={bottom - 42} width={w} height="6" />
          </g>
        )}

        {p.pattern === "plain" && (
          <g>
            <rect x={x} y={bottom - 62} width={w} height="24" fill={shade(p.colour, -0.06)} />
            <rect x={x} y={bottom - 62} width={w} height="24" fill={`url(#${id}-rib)`} />
          </g>
        )}

        {p.pattern === "fouta" && (
          <g>
            {Array.from({ length: Math.ceil(w / 14) }, (_, i) => (
              <rect key={i} x={x + i * 14 + 5} y={y} width="3" height={h} fill={p.accent} opacity="0.55" />
            ))}
            <rect x={x} y={bottom - 70} width={w} height="10" fill={p.accent} />
            <rect x={x} y={bottom - 52} width={w} height="4" fill={p.accent} />
          </g>
        )}

        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          fill={`url(#${id}-${p.pattern === "waffle" ? "waffle" : p.pattern === "fouta" ? "weave" : "terry"})`}
        />
        <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-drape)`} />
        {/* fold over the rail */}
        <rect x={x} y={y - 2} width={w} height="46" fill={shade(p.colour, -0.1)} />
        {beachStripes &&
          Array.from({ length: Math.ceil(w / 24) }, (_, i) =>
            i % 2 ? <rect key={i} x={x + i * 24} y={y - 2} width="24" height="46" fill={shade(p.accent, -0.1)} /> : null
          )}
        <rect x={x} y={y + 44} width={w} height="5" fill="#000" opacity="0.09" />
        {/* hem */}
        <rect x={x} y={bottom - 8} width={w} height="8" fill={shade(p.colour, -0.12)} />
      </g>

      {p.pattern === "fouta" && (
        <g stroke={shade(p.colour, 0.05)} strokeWidth="2.2" strokeLinecap="round">
          {Array.from({ length: Math.floor(w / 7) }, (_, i) => (
            <path key={i} d={`M${x + 4 + i * 7} ${bottom}l${(i % 3) - 1} ${16 + (i % 4) * 2}`} />
          ))}
        </g>
      )}

      {/* rail */}
      <rect x="36" y={RAIL_Y - 9} width="328" height="11" rx="5.5" fill="#b9a68b" />
      <rect x="36" y={RAIL_Y - 9} width="328" height="4" rx="2" fill="#fff" opacity="0.35" />
      <circle cx="40" cy={RAIL_Y - 3.5} r="11" fill="#a8947a" />
      <circle cx="360" cy={RAIL_Y - 3.5} r="11" fill="#a8947a" />
    </>
  );
}

function TowelStack(p: Props) {
  const id = idFor({ ...p, view: "alt" });
  const bg = mix(p.colour, "#f5efe6", 0.8);
  const layers = [
    { y: 318, x: 78, w: 244 },
    { y: 262, x: 84, w: 236 },
    { y: 206, x: 80, w: 240 },
  ];
  const H = 56;
  const beachStripes = p.pattern === "stripe" && p.collection === "beach-towels";

  return (
    <>
      <Defs id={id} colour={p.colour} />
      <rect width="400" height="500" fill={bg} />
      <rect y="374" width="400" height="126" fill={shade(bg, -0.06)} />
      {/* shelf */}
      <rect x="40" y="374" width="320" height="18" rx="3" fill="#a88a66" />
      <rect x="40" y="374" width="320" height="5" rx="2" fill="#fff" opacity="0.25" />
      <rect x="46" y="392" width="308" height="10" fill="#000" opacity="0.08" />

      {layers.map((l, i) => (
        <g key={i}>
          <rect x={l.x + 4} y={l.y + 6} width={l.w} height={H} rx="22" fill="#000" opacity="0.10" />
          <rect x={l.x} y={l.y} width={l.w} height={H} rx="22" fill={p.colour} />
          <clipPath id={`${id}-l${i}`}>
            <rect x={l.x} y={l.y} width={l.w} height={H} rx="22" />
          </clipPath>
          <g clipPath={`url(#${id}-l${i})`}>
            {beachStripes &&
              Array.from({ length: Math.ceil(l.w / 20) }, (_, k) =>
                k % 2 ? <rect key={k} x={l.x + k * 20} y={l.y} width="20" height={H} fill={p.accent} /> : null
              )}
            {p.pattern === "stripe" && !beachStripes && (
              <g fill={p.accent}>
                <rect x={l.x + 36} y={l.y} width="12" height={H} />
                <rect x={l.x + 54} y={l.y} width="5" height={H} />
                <rect x={l.x + l.w - 60} y={l.y} width="12" height={H} />
                <rect x={l.x + l.w - 42} y={l.y} width="5" height={H} />
              </g>
            )}
            {p.pattern === "fouta" &&
              Array.from({ length: 5 }, (_, k) => (
                <rect key={k} x={l.x} y={l.y + 8 + k * 10} width={l.w} height="2.5" fill={p.accent} opacity="0.6" />
              ))}
            {p.pattern === "plain" && <rect x={l.x + 30} y={l.y} width="18" height={H} fill={shade(p.colour, -0.07)} />}
            <rect
              x={l.x}
              y={l.y}
              width={l.w}
              height={H}
              fill={`url(#${id}-${p.pattern === "waffle" ? "waffle" : p.pattern === "fouta" ? "weave" : "terry"})`}
            />
            {/* fold line and roundness */}
            <rect x={l.x} y={l.y + H / 2 - 1} width={l.w} height="2" fill="#000" opacity="0.08" />
            <rect x={l.x} y={l.y} width={l.w} height="10" fill="#fff" opacity="0.12" />
            <rect x={l.x} y={l.y + H - 12} width={l.w} height="12" fill="#000" opacity="0.1" />
          </g>
        </g>
      ))}

      {/* a sprig of eucalyptus on top */}
      <g transform="translate(206 204) rotate(-12)">
        <path d="M-70 0 C -30 -8, 20 -6, 70 -18" stroke="#6f7f69" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {[-58, -38, -18, 4, 26, 48].map((lx, i) => (
          <ellipse
            key={lx}
            cx={lx}
            cy={i % 2 ? -14 : 4}
            rx="13"
            ry="8"
            fill={i % 2 ? "#8fa38d" : "#7b927a"}
            transform={`rotate(${i % 2 ? -25 : 20} ${lx} ${i % 2 ? -14 : 4})`}
          />
        ))}
      </g>
      {/* little kraft tag */}
      <g transform="translate(300 228) rotate(8)">
        <path d="M0 0 L -18 -30" stroke="#8b7355" strokeWidth="1.2" />
        <rect x="-12" y="0" width="34" height="22" rx="3" fill="#d9bf95" />
        <circle cx="-7" cy="5" r="2" fill={bg} />
        <text x="6" y="15" fontSize="8" fontFamily="Georgia, serif" fill="#5a4630" textAnchor="middle">
          W&amp;W
        </text>
      </g>
    </>
  );
}

// ─── rugs ────────────────────────────────────────────────────────
function RugBody({ p, id, box }: { p: Props; id: string; box: ReturnType<typeof rugBox> }) {
  const { x, y, w, h, rx } = box;
  const mat = p.collection === "bath-mats";
  const fringe = !mat;
  const inset = mat ? 0 : 16;
  const ix = x + inset;
  const iy = y + inset;
  const iw = w - inset * 2;
  const ih = h - inset * 2;

  return (
    <g>
      {fringe && (
        <g stroke="#efe5d2" strokeWidth="2.2" strokeLinecap="round">
          {Array.from({ length: Math.floor(w / 6) }, (_, i) => {
            const fx = x + 3 + i * 6;
            const len = 12 + (i % 3) * 2;
            return (
              <g key={i}>
                <path d={`M${fx} ${y}l${(i % 3) - 1} ${-len}`} />
                <path d={`M${fx} ${y + h}l${1 - (i % 3)} ${len}`} />
              </g>
            );
          })}
        </g>
      )}
      <clipPath id={`${id}-rug`}>
        <rect x={x} y={y} width={w} height={h} rx={rx} />
      </clipPath>
      <g clipPath={`url(#${id}-rug)`}>
        <rect x={x} y={y} width={w} height={h} fill={p.colour} />

        {p.pattern === "stripe" &&
          (mat ? (
            <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-rib)`} transform={`rotate(90 ${x + w / 2} ${y + h / 2})`} />
          ) : (
            <g fill={p.accent}>
              {Array.from({ length: Math.ceil(h / 46) }, (_, i) => (
                <g key={i}>
                  <rect x={x} y={y + 18 + i * 46} width={w} height={i % 3 === 0 ? 14 : 5} />
                  {i % 2 === 0 && <rect x={x} y={y + 38 + i * 46} width={w} height="3" opacity="0.7" />}
                </g>
              ))}
            </g>
          ))}

        {p.pattern === "diamond" && (
          <>
            <pattern id={`${id}-dia`} x={ix} y={iy} width="44" height="44" patternUnits="userSpaceOnUse">
              <path d="M22 4 L40 22 L22 40 L4 22Z" fill="none" stroke={p.accent} strokeWidth="3.5" />
              <path d="M22 16 L28 22 L22 28 L16 22Z" fill={p.accent} />
              <circle cx="0" cy="0" r="3" fill={p.accent} />
              <circle cx="44" cy="0" r="3" fill={p.accent} />
              <circle cx="0" cy="44" r="3" fill={p.accent} />
              <circle cx="44" cy="44" r="3" fill={p.accent} />
            </pattern>
            <rect x={ix + 10} y={iy + 10} width={iw - 20} height={ih - 20} fill={`url(#${id}-dia)`} />
            <rect x={ix} y={iy} width={iw} height={ih} fill="none" stroke={p.accent} strokeWidth="5" />
          </>
        )}

        {p.pattern === "border" && (
          <g fill="none" stroke={p.accent}>
            <rect x={ix + 2} y={iy + 2} width={iw - 4} height={ih - 4} strokeWidth="12" />
            <rect x={ix + 22} y={iy + 22} width={iw - 44} height={ih - 44} strokeWidth="2.5" />
          </g>
        )}

        {p.pattern === "check" && (
          <>
            <pattern id={`${id}-chk`} x={x} y={y} width="48" height="48" patternUnits="userSpaceOnUse">
              <rect width="24" height="24" fill={p.accent} opacity="0.55" />
              <rect x="24" y="24" width="24" height="24" fill={p.accent} opacity="0.55" />
              <path d="M0 12h48M0 36h48M12 0v48M36 0v48" stroke={p.accent} strokeWidth="1" opacity="0.5" />
            </pattern>
            <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-chk)`} />
          </>
        )}

        <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-${mat ? "terry" : "weave"})`} />
        {/* soft light across the pile */}
        <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-drape)`} opacity="0.6" />
        {!mat && <rect x={x} y={y} width={w} height={h} fill="none" stroke={shade(p.colour, -0.2)} strokeWidth="4" />}
      </g>
    </g>
  );
}

function RugScene(p: Props) {
  const id = idFor(p);
  const box = rugBox(p.collection);
  const mat = p.collection === "bath-mats";

  return (
    <>
      <Defs id={id} colour={p.colour} />
      {mat ? (
        <>
          <rect width="400" height="500" fill="#edece7" />
          <g stroke="#d9d6ce" strokeWidth="2">
            {Array.from({ length: 8 }, (_, i) => (
              <path key={`v${i}`} d={`M${i * 60 - 10} 0v500`} />
            ))}
            {Array.from({ length: 10 }, (_, i) => (
              <path key={`h${i}`} d={`M0 ${i * 60 + 10}h400`} />
            ))}
          </g>
        </>
      ) : (
        <Floorboards />
      )}
      <rect
        x={box.x + 8}
        y={box.y + 12}
        width={box.w}
        height={box.h}
        rx={box.rx}
        fill="#000"
        opacity="0.22"
        filter={`url(#${id}-shadow)`}
      />
      <RugBody p={p} id={id} box={box} />
    </>
  );
}

function Floorboards() {
  const tones = ["#d8c09c", "#d2b894", "#dcc6a4", "#cfb48f", "#d6bd98"];
  return (
    <g>
      {Array.from({ length: 9 }, (_, i) => (
        <g key={i}>
          <rect x={i * 46} y="0" width="46" height="500" fill={tones[i % tones.length]} />
          <path d={`M${i * 46} 0v500`} stroke="#b89d78" strokeWidth="1.2" />
          <path d={`M${i * 46} ${(i * 173) % 500}h46`} stroke="#b89d78" strokeWidth="1.2" />
          <path d={`M${i * 46 + 14} 0 C ${i * 46 + 18} 160, ${i * 46 + 10} 330, ${i * 46 + 16} 500`} stroke="#c4a882" strokeWidth="0.8" fill="none" opacity="0.6" />
        </g>
      ))}
    </g>
  );
}

function RugRoom(p: Props) {
  const id = idFor({ ...p, view: "alt" });
  const box = rugBox(p.collection);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const runner = p.collection === "runners";
  const wall = mix(p.colour, "#f4eee5", 0.86);

  return (
    <>
      <Defs id={id} colour={p.colour} />
      <rect width="400" height="500" fill={wall} />
      <rect y="170" width="400" height="330" fill="#d6bd98" />
      <g stroke="#bfa27c" strokeWidth="1.2">
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d={`M0 ${190 + i * i * 6 + i * 8}h400`} />
        ))}
      </g>
      <rect y="160" width="400" height="14" fill="#fbf8f2" />
      <rect y="172" width="400" height="3" fill="#000" opacity="0.06" />

      {/* plant */}
      <g transform="translate(330 96)">
        {[-40, -20, 0, 20, 40, -55, 55].map((a, i) => (
          <ellipse key={i} cx="0" cy="-34" rx="9" ry="34" fill={i % 2 ? "#6f8a6a" : "#5d785a"} transform={`rotate(${a} 0 20)`} />
        ))}
        <path d="M-22 16 h44 l-6 58 h-32z" fill="#c17a58" />
        <rect x="-24" y="12" width="48" height="8" rx="2" fill="#b06a4a" />
      </g>

      <g transform={`translate(200 ${runner ? 330 : 335}) scale(${runner ? 0.95 : 1.05} 0.46) rotate(${runner ? 70 : 45}) translate(${-cx} ${-cy})`}>
        <rect x={box.x + 6} y={box.y + 6} width={box.w} height={box.h} fill="#000" opacity="0.2" filter={`url(#${id}-shadow)`} />
        <RugBody p={p} id={id} box={box} />
      </g>

      {/* the corner of a sofa for scale */}
      {!runner && (
        <g>
          <rect x="-20" y="196" width="120" height="96" rx="18" fill={shade(wall, -0.18)} />
          <rect x="-20" y="250" width="120" height="44" rx="10" fill={shade(wall, -0.24)} />
          <rect x="20" y="292" width="8" height="18" fill="#6b5640" />
        </g>
      )}
    </>
  );
}
