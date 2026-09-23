import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/components/cart/CartProvider";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { NotFoundContent } from "@/components/layout/NotFoundContent";

// URLs that match no route at all land here, outside the (shop) layout
export default function GlobalNotFound() {
  return (
    <CartProvider>
      <Header />
      <main id="main" className="flex-1">
        <NotFoundContent />
      </main>
      <Footer />
      <CartDrawer />
    </CartProvider>
  );
}
