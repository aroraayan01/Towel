import type { Metadata } from "next";

import { PolicyPage } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Care guide",
  description: "How to wash towels so they stay soft, and how to keep wool, jute and cotton rugs looking good for years.",
  alternates: { canonical: "/care-guide" },
};

export default function CareGuidePage() {
  return (
    <PolicyPage title="Care guide" intro="A little care goes a long way. Here's how we look after ours at home.">
      <h2>Towels</h2>
      <h3>The first wash</h3>
      <p>
        Wash new towels before using them, on their own or with similar colours. A bit of lint in the first few washes is
        completely normal — it&apos;s loose fibre from the weaving process, and it stops.
      </p>
      <h3>Everyday washing</h3>
      <ul>
        <li>Wash warm (40°C) with a mild detergent. Use about half the detergent the bottle suggests — too much leaves residue that makes towels stiff.</li>
        <li><strong>Skip the fabric softener.</strong> It coats the cotton and makes towels less absorbent. Half a cup of white vinegar in the rinse cycle every month or so does a better job.</li>
        <li>Keep towels away from zips, hooks and velcro, which snag the loops.</li>
      </ul>
      <h3>Drying</h3>
      <ul>
        <li>Line drying in the shade keeps colours bright. The Aussie sun is harsh on dyes.</li>
        <li>A quick 10-minute tumble on low after line drying brings back the fluff.</li>
        <li>Pulled a loop? Snip it level with scissors — never pull it.</li>
      </ul>
      <h3>Beach towels</h3>
      <p>Give them a rinse in fresh water after a swim so salt and sunscreen don&apos;t build up in the fibres.</p>

      <h2>Rugs</h2>
      <h3>Wool</h3>
      <ul>
        <li>Vacuum weekly with suction only (no beater bar) for the first few months while it sheds.</li>
        <li>Blot spills straight away with a clean white cloth, working from the outside in. Never rub.</li>
        <li>Rotate every six months so it wears and fades evenly.</li>
        <li>Get it professionally cleaned every year or two.</li>
      </ul>
      <h3>Jute</h3>
      <ul>
        <li>Jute doesn&apos;t like water. Blot spills dry and avoid steam cleaning or wet shampoos.</li>
        <li>Keep jute rugs out of bathrooms, laundries and damp rooms.</li>
        <li>Vacuum regularly — jute naturally sheds a little fibre.</li>
      </ul>
      <h3>Washable cotton rugs &amp; bath mats</h3>
      <ul>
        <li>Machine wash cold on a gentle cycle, on its own.</li>
        <li>Line dry flat in the shade. Don&apos;t tumble dry mats with a non-slip backing — heat damages it.</li>
      </ul>
      <h3>Underlays</h3>
      <p>On hard floors, always use a rug underlay. It stops slips, protects your floors and helps the rug last longer.</p>
    </PolicyPage>
  );
}
