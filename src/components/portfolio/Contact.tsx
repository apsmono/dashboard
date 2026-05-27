import { Card } from "@/components/ui/Card";
import * as LucideIcons from "lucide-react";
import type { Contact } from "@/types";

interface ContactProps {
  contacts: Contact[];
}

export function Contact({ contacts }: ContactProps) {
  return (
    <section id="contact" className="px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-2 text-center text-3xl font-bold">Contact</h2>
        <p className="mb-12 text-center text-muted">Let's build something together.</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact) => {
            const Icon = ((LucideIcons as unknown) as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[contact.icon] || LucideIcons.Circle;
            return (
              <a
                key={contact.label}
                href={contact.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card className="flex flex-col items-center gap-2 py-6 text-center transition-colors hover:border-accent">
                  <Icon size={24} className="text-accent" />
                  <div className="text-xs uppercase tracking-wide text-muted">{contact.label}</div>
                  <div className="font-semibold">{contact.value}</div>
                </Card>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
