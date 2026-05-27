import { Button } from "@/components/ui/Button";
import { ArrowDown } from "lucide-react";

interface HeroProps {
  name: string;
  tagline: string;
}

export function Hero({ name, tagline }: HeroProps) {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-20 text-center">
      <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-6xl">
        Hi, I'm{" "}
        <span className="bg-gradient-to-r from-text to-accent bg-clip-text text-transparent">
          {name}
        </span>
      </h1>
      <p className="mb-8 max-w-xl text-lg text-muted md:text-xl">{tagline}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={() => document.getElementById("projects")?.scrollIntoView()}>
          View My Work
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => document.getElementById("contact")?.scrollIntoView()}
        >
          Get In Touch
        </Button>
      </div>
      <div className="mt-12 animate-bounce text-sm text-muted">
        <ArrowDown className="mx-auto mb-1" size={20} />
        Scroll down
      </div>
    </section>
  );
}
