import { Button } from "@/components/ui/Button";

interface AboutProps {
  avatar: string;
  bio: string[];
}

export function About({ avatar, bio }: AboutProps) {
  return (
    <section id="about" className="px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-2 text-center text-3xl font-bold">About Me</h2>
        <p className="mb-12 text-center text-muted">A little bit about who I am and what I do.</p>

        <div className="flex flex-col items-center gap-10 md:flex-row md:items-start">
          <div className="shrink-0">
            <img
              src={avatar}
              alt="Arif Eko Pramono"
              className="h-40 w-40 rounded-full border-2 border-border object-cover transition-transform hover:scale-105"
            />
          </div>
          <div className="space-y-4 text-muted">
            {bio.map((paragraph, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: paragraph }} />
            ))}
            <Button
              onClick={() => document.getElementById("contact")?.scrollIntoView()}
            >
              Let's Talk
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
