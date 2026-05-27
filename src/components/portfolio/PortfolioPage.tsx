import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "./Hero";
import { About } from "./About";
import { Projects } from "./Projects";
import { Skills } from "./Skills";
import { Contact } from "./Contact";
import { siteConfig } from "@/config/site";

export function PortfolioPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <Navbar
        logo="Arif"
        logoAccent="Pramono"
        items={[
          { label: "About", href: "#about" },
          { label: "Projects", href: "#projects" },
          { label: "Skills", href: "#skills" },
          { label: "Contact", href: "#contact" },
          { label: "Dashboard", href: "#/" },
        ]}
      />
      <main>
        <Hero name={siteConfig.name} tagline={siteConfig.tagline} />
        <About avatar={siteConfig.avatar} bio={siteConfig.bio} />
        <Projects projects={siteConfig.projects} />
        <Skills skills={siteConfig.skills} />
        <Contact contacts={siteConfig.contacts} />
      </main>
      <Footer />
    </div>
  );
}
