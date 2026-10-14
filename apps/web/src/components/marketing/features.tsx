import {
  LayoutTemplate,
  MousePointerClick,
  ShieldCheck,
  Users,
  Rocket,
  Eye,
} from "lucide-react";

const FEATURES = [
  {
    icon: MousePointerClick,
    title: "Drag-and-drop builder",
    description:
      "Add, reorder, and configure fourteen field types with instant, reliable saves — no page refresh required.",
  },
  {
    icon: Eye,
    title: "Live preview",
    description:
      "See exactly what respondents will see before you publish, on every screen size.",
  },
  {
    icon: Rocket,
    title: "One-click publish",
    description:
      "Move from draft to published in a single step, with a snapshot that keeps live forms stable.",
  },
  {
    icon: Users,
    title: "Team workspaces",
    description:
      "Organize forms by team, and keep every workspace's forms cleanly separated.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    description:
      "Fine-grained permissions decide who can create, publish, or manage forms in your org.",
  },
  {
    icon: LayoutTemplate,
    title: "Built for scale",
    description:
      "From a single personal workspace to multi-team orgs — FormKit grows with you.",
  },
];

export function Features() {
  return (
    <section id="features" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-primary">Features</p>
          <h2 className="mt-2 font-serif text-3xl text-foreground sm:text-4xl">
            Everything a modern team needs to collect information
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="bg-card p-6 transition-colors hover:bg-muted/40">
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="size-[18px]" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
