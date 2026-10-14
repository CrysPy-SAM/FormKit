import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";

const PLANS = [
  {
    tier: "Free",
    tagline: "For trying FormKit out",
    features: ["A personal workspace", "Core field types", "Draft & publish flow"],
    highlighted: false,
  },
  {
    tier: "Pro",
    tagline: "For growing teams",
    features: ["Team workspaces", "Higher form & response limits", "Role-based permissions"],
    highlighted: true,
  },
  {
    tier: "Business",
    tagline: "For scaling organizations",
    features: ["Unlimited teams", "Custom branding", "Priority support"],
    highlighted: false,
  },
];

export function PricingTeaser() {
  return (
    <section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-primary">Pricing</p>
          <h2 className="mt-2 font-serif text-3xl text-foreground sm:text-4xl">
            Start free, upgrade when you grow
          </h2>
          <p className="mt-3 text-muted-foreground">
            Every workspace starts on the free plan. Upgrade anytime as your
            team and forms grow.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.tier}
              className={cn(
                "flex flex-col gap-5 p-6",
                plan.highlighted && "border-primary shadow-md ring-1 ring-primary/20",
              )}
            >
              <div>
                <h3 className="text-base font-semibold text-foreground">{plan.tier}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
              </div>
              <ul className="flex flex-1 flex-col gap-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button asChild variant={plan.highlighted ? "default" : "secondary"}>
                <Link href="/signup">Get started</Link>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
