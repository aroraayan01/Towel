import type { Metadata } from "next";
import Link from "next/link";

import { PolicyPage } from "@/components/PolicyPage";
import { store } from "@/lib/store";

export const metadata: Metadata = {
  title: "Returns & exchanges",
  description: `${store.commerce.returnDays}-day change-of-mind returns, plus your rights under the Australian Consumer Law.`,
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  const days = store.commerce.returnDays;
  return (
    <PolicyPage title="Returns" intro={`${days} days to change your mind, and faulty items are always covered.`} updated="23 September 2026">
      <h2>Change-of-mind returns</h2>
      <p>
        If you change your mind, you can return items within <strong>{days} days of delivery</strong> for a refund to your
        original payment method or an exchange. To be eligible, items must be:
      </p>
      <ul>
        <li>unused and unwashed, in the same condition you received them</li>
        <li>with their original tags and packaging where possible</li>
        <li>not personalised (monogrammed items are made just for you, so they can&apos;t be returned for change of mind)</li>
      </ul>
      <p>
        Change-of-mind return postage is paid by you, and we recommend a tracked service. Original shipping costs are not
        refunded for change-of-mind returns.
      </p>

      <h2>Faulty, damaged or incorrect items</h2>
      <p>
        If something arrives damaged, is faulty, or isn&apos;t what you ordered, <Link href="/contact">contact us</Link> with
        your order number and a photo. We&apos;ll pay for the return postage and offer a repair, replacement or refund in
        line with your rights under the Australian Consumer Law. The {days}-day window doesn&apos;t apply to faults.
      </p>

      <h2>Your rights under the Australian Consumer Law</h2>
      <p>
        Our change-of-mind policy is in addition to, and does not limit, your rights under the Australian Consumer Law.
      </p>
      <p>
        Our goods come with guarantees that cannot be excluded under the Australian Consumer Law. You are entitled to a
        replacement or refund for a major failure and compensation for any other reasonably foreseeable loss or damage.
        You are also entitled to have the goods repaired or replaced if the goods fail to be of acceptable quality and the
        failure does not amount to a major failure.
      </p>

      <h2>How to make a return</h2>
      <ol className="mb-4 list-decimal pl-5">
        <li className="mb-2">
          <Link href="/contact">Send us a message</Link> with your order number and the item(s) you&apos;d like to return.
        </li>
        <li className="mb-2">We&apos;ll reply with our returns address and any instructions.</li>
        <li className="mb-2">Pack the items securely and send them back with a tracked service.</li>
        <li>
          We&apos;ll process your refund or exchange within 3 business days of receiving it. Refunds can take a further
          3–5 business days to appear, depending on your bank. Afterpay refunds go back to your Afterpay account.
        </li>
      </ol>

      <h2>Sale items</h2>
      <p>Sale items can be returned for change of mind on the same terms as full-price items.</p>
    </PolicyPage>
  );
}
