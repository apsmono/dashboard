export function Footer() {
  return (
    <footer className="border-t border-border py-8 text-center text-sm text-muted">
      <p>
        © {new Date().getFullYear()} Arif Eko Pramono. All rights reserved.
        <span className="mx-2">·</span>
        <a href="#/" className="hover:text-accent transition-colors">Dashboard</a>
      </p>
    </footer>
  );
}
