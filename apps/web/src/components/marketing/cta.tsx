import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";

export function FinalCta() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col items-center rounded-2xl border border-border bg-foreground px-6 py-16 text-center text-background sm:px-16">
        <h2 className="font-serif text-3xl text-balance sm:text-4xl">
          Your next form is a few minutes away
        </h2>
        <p className="mt-3 max-w-md text-balance text-background/70">
          Create a workspace, build your first form, and publish it — all
          before your coffee gets cold.
        </p>
        <Button size="lg" variant="secondary" asChild className="mt-8">
          <Link href="/signup">
            Start for free
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
