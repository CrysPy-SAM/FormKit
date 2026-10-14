import { MarketingNavbar } from "~/components/marketing/navbar";
import { Hero } from "~/components/marketing/hero";
import { Features } from "~/components/marketing/features";
import { PricingTeaser } from "~/components/marketing/pricing-teaser";
import { FinalCta } from "~/components/marketing/cta";
import { MarketingFooter } from "~/components/marketing/footer";

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <MarketingNavbar />
      <main id="product" className="flex-1">
        <Hero />
        <Features />
        <PricingTeaser />
        <FinalCta />
      </main>
      <MarketingFooter />
    </div>
  );
}
