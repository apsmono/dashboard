import type { ReactNode } from "react";

interface ZenShellProps {
  header: ReactNode;
  panelA: ReactNode;
  panelB: ReactNode;
  footer?: ReactNode;
}

/** 70/30 asymmetric workspace — Panel A (Clarity Board) + locked Panel B (AI Guide). */
export function ZenShell({ header, panelA, panelB, footer }: ZenShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      {header}

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 gap-0 px-4 pb-4 lg:px-6">
        <main className="min-w-0 flex-[7] overflow-y-auto pr-0 lg:pr-6">{panelA}</main>
        <aside
          className="hidden min-w-[320px] max-w-[400px] flex-[3] shrink-0 border-l border-border lg:flex lg:flex-col"
          aria-label="AI Guide"
        >
          <div className="sticky top-0 flex h-[calc(100vh-5rem)] flex-col">{panelB}</div>
        </aside>
      </div>

      {footer}
    </div>
  );
}
