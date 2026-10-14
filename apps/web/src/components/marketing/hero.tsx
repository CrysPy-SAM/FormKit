import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ProductMockup } from "~/components/marketing/product-mockup";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pt-20 pb-24 sm:px-6 sm:pt-28 lg:px-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1.5px 1.5px, currentColor 1.5px, transparent 0)",
          backgroundSize: "32px 32px",
          maskImage: "linear-gradient(to bottom, black, transparent)",
        }}
      />

      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs animate-fade-up">
          Built for teams that ship
        </span>

        <h1 className="mt-6 font-serif text-4xl leading-[1.1] text-balance text-foreground sm:text-5xl lg:text-6xl animate-fade-up [animation-delay:80ms]">
          Forms that feel as good as your product
        </h1>

        <p className="mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg animate-fade-up [animation-delay:140ms]">
          FormKit is the form builder for teams who care about craft — a
          fast, drag-and-drop editor, real workspaces, and publishing that
          just works.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row animate-fade-up [animation-delay:200ms]">
          <Button size="lg" asChild>
            <Link href="/signup">
              Start building for free
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground animate-fade-up [animation-delay:240ms]">
          No credit card required · Free plan available
        </p>
      </div>

      <div className="mt-16 animate-fade-up [animation-delay:280ms]">
        <ProductMockup />
      </div>
    </section>
  );
}
