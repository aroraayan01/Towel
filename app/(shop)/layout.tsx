import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/components/cart/CartProvider";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { store } from "@/lib/store";

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: store.name,
  legalName: store.legalName,
  url: store.url,
  logo: `${store.url}/icon.svg`,
  email: store.email,
  telephone: store.phone,
  address: {
    "@type": "PostalAddress",
    streetAddress: store.address.street,
    addressLocality: store.address.suburb,
    addressRegion: store.address.state,
    postalCode: store.address.postcode,
    addressCountry: "AU",
  },
  sameAs: [`https://instagram.com/${store.instagram}`],
};

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <CartProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <CartDrawer />
    </CartProvider>
  );
}
