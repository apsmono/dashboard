import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Toasts } from "@/components/ui/Toast";
import { useToasts } from "@/hooks/useToasts";
import { cn } from "@/lib/utils";
import {
  STATUSES,
  TRACKS,
  TRACK_LABELS,
  PAY_FLOOR_USD,
  fetchApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  newApplicationId,
  type Application,
  type ApplicationInput,
  type ApplicationStatus,
  type Track,
} from "@/lib/applications";
import { ExternalLink, Plus, Trash2, Briefcase } from "lucide-react";

const STATUS_META: Record<ApplicationStatus, { label: string; variant: "default" | "accent" | "success" | "danger" }> = {
  found: { label: "Found", variant: "default" },
  applied: { label: "Applied", variant: "accent" },
  screening: { label: "Screening", variant: "accent" },
  interview: { label: "Interview", variant: "success" },
  offer: { label: "Offer", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
  ghosted: { label: "Ghosted", variant: "default" },
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function byDateDesc(a: Application, b: Application): number {
  return a.date < b.date ? 1 : a.date > b.date ? -1 : a.id.localeCompare(b.id);
}

const selectClass =
  "rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50";

interface FormState {
  date: string;
  company: string;
  role: string;
  track: Track;
  payUsd: string;
  status: ApplicationStatus;
  link: string;
  notes: string;
}

const emptyForm = (): FormState => ({
  date: todayISO(),
  company: "",
  role: "",
  track: "fullstack",
  payUsd: "",
  status: "applied",
  link: "",
  notes: "",
});

export function ApplicationsPage() {
  const [apps, setApps] = useState<Application[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [trackFilter, setTrackFilter] = useState<Track | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const { toasts, push } = useToasts();

  useEffect(() => {
    let cancelled = false;
    fetchApplications()
      .then((data) => {
        if (!cancelled) setApps(data);
      })
      .catch((err: unknown) => {
        console.error("Failed to load applications", err);
        if (!cancelled) setLoadError("Couldn't load applications. Check Firestore rules / connection.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    if (!apps) return [];
    return apps.filter(
      (a) =>
        (statusFilter === "all" || a.status === statusFilter) &&
        (trackFilter === "all" || a.track === trackFilter)
    );
  }, [apps, statusFilter, trackFilter]);

  const stats = useMemo(() => {
    const list = apps ?? [];
    const weekFloor = daysAgoISO(7);
    return {
      total: list.length,
      thisWeek: list.filter((a) => a.date >= weekFloor && a.status !== "found").length,
      inFlight: list.filter((a) => ["applied", "screening", "interview"].includes(a.status)).length,
      offers: list.filter((a) => a.status === "offer").length,
    };
  }, [apps]);

  // --- Optimistic mutations (insert/patch state first, rollback on error) ---

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) {
      push("Company and role are required", "error");
      return;
    }
    const id = newApplicationId();
    const payUsd = form.payUsd.trim() === "" ? undefined : Number(form.payUsd);
    const input: ApplicationInput = {
      date: form.date || todayISO(),
      company: form.company.trim(),
      role: form.role.trim(),
      track: form.track,
      payUsd: payUsd !== undefined && Number.isFinite(payUsd) ? payUsd : undefined,
      status: form.status,
      link: form.link.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
    const optimistic: Application = { id, ...input };

    setApps((prev) => [...(prev ?? []), optimistic].sort(byDateDesc));
    setForm(emptyForm());
    setFormOpen(false);
    push(`${optimistic.company} added`);

    createApplication(id, input).catch((err: unknown) => {
      console.error("Failed to save application", err);
      setApps((prev) => (prev ?? []).filter((a) => a.id !== id));
      push(`Saving ${optimistic.company} failed — rolled back`, "error");
    });
  }

  function handleStatusChange(app: Application, status: ApplicationStatus) {
    const prevStatus = app.status;
    setApps((prev) => (prev ?? []).map((a) => (a.id === app.id ? { ...a, status } : a)));
    updateApplication(app.id, { status }).catch((err: unknown) => {
      console.error("Failed to update status", err);
      setApps((prev) => (prev ?? []).map((a) => (a.id === app.id ? { ...a, status: prevStatus } : a)));
      push(`Updating ${app.company} failed — rolled back`, "error");
    });
  }

  function handleDelete(app: Application) {
    if (!window.confirm(`Delete ${app.company} — ${app.role}?`)) return;
    const snapshot = apps;
    setApps((prev) => (prev ?? []).filter((a) => a.id !== app.id));
    deleteApplication(app.id).catch((err: unknown) => {
      console.error("Failed to delete application", err);
      setApps(snapshot);
      push(`Deleting ${app.company} failed — rolled back`, "error");
    });
  }

  // --- Render ---

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Briefcase size={20} className="text-accent" />
          <h1 className="text-xl font-bold text-text">Applications</h1>
        </div>
        <Button size="sm" onClick={() => setFormOpen((v) => !v)}>
          <Plus size={16} className="mr-1" />
          {formOpen ? "Close" : "Add application"}
        </Button>
      </div>

      {/* Summary strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total tracked", value: stats.total },
          { label: "Applied this week", value: stats.thisWeek },
          { label: "In flight", value: stats.inFlight },
          { label: "Offers", value: stats.offers },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-3">
            <div className="text-2xl font-bold text-text">{s.value}</div>
            <div className="text-xs text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {formOpen && (
        <form
          onSubmit={handleAdd}
          className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-3"
        >
          <label className="text-sm text-muted">
            Date
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-1"
            />
          </label>
          <label className="text-sm text-muted">
            Company *
            <Input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Acme Inc."
              className="mt-1"
              autoFocus
            />
          </label>
          <label className="text-sm text-muted">
            Role *
            <Input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="Senior Frontend Engineer"
              className="mt-1"
            />
          </label>
          <label className="text-sm text-muted">
            Track
            <select
              value={form.track}
              onChange={(e) => setForm({ ...form, track: e.target.value as Track })}
              className={cn(selectClass, "mt-1 w-full")}
            >
              {TRACKS.map((t) => (
                <option key={t} value={t}>
                  {TRACK_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-muted">
            Pay (USD/mo)
            <Input
              type="number"
              min="0"
              value={form.payUsd}
              onChange={(e) => setForm({ ...form, payUsd: e.target.value })}
              placeholder="e.g. 4000"
              className="mt-1"
            />
            {form.payUsd !== "" && Number(form.payUsd) < PAY_FLOOR_USD && (
              <span className="mt-1 block text-xs text-danger">
                Below your ${PAY_FLOOR_USD}/mo floor (30M IDR)
              </span>
            )}
          </label>
          <label className="text-sm text-muted">
            Status
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ApplicationStatus })}
              className={cn(selectClass, "mt-1 w-full")}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-muted md:col-span-2">
            Link
            <Input
              type="url"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="https://…"
              className="mt-1"
            />
          </label>
          <label className="text-sm text-muted">
            Notes
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Contractor-friendly, APAC ok…"
              className="mt-1"
            />
          </label>
          <div className="md:col-span-3">
            <Button type="submit">Save application</Button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | "all")}
          className={selectClass}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
        <select
          value={trackFilter}
          onChange={(e) => setTrackFilter(e.target.value as Track | "all")}
          className={selectClass}
          aria-label="Filter by track"
        >
          <option value="all">All tracks</option>
          {TRACKS.map((t) => (
            <option key={t} value={t}>
              {TRACK_LABELS[t]}
            </option>
          ))}
        </select>
        {(statusFilter !== "all" || trackFilter !== "all") && (
          <span className="text-xs text-muted">
            {visible.length} of {apps?.length ?? 0} shown
          </span>
        )}
      </div>

      {/* Table */}
      {loadError ? (
        <div className="rounded-lg border border-danger bg-card p-6 text-sm text-danger">{loadError}</div>
      ) : apps === null ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted">
          {apps.length === 0
            ? "No applications yet. Add your first — the routine is in your readiness note."
            : "Nothing matches these filters."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-muted">
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Company</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Track</th>
                <th className="px-3 py-2 font-medium">Pay/mo</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium sr-only">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => (
                <tr key={a.id} className="border-b border-border/50 last:border-0">
                  <td className="whitespace-nowrap px-3 py-2 text-muted">{a.date}</td>
                  <td className="px-3 py-2 font-medium text-text">
                    <span className="inline-flex items-center gap-1.5">
                      {a.company}
                      {a.link && (
                        <a
                          href={a.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted hover:text-accent"
                          aria-label={`Open ${a.company} listing`}
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </span>
                    {a.notes && <div className="mt-0.5 text-xs font-normal text-muted">{a.notes}</div>}
                  </td>
                  <td className="px-3 py-2 text-text">{a.role}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <Badge>{TRACK_LABELS[a.track]}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {a.payUsd !== undefined ? (
                      <span className={cn(a.payUsd < PAY_FLOOR_USD ? "text-danger" : "text-text")}>
                        ${a.payUsd.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className="inline-flex items-center gap-2">
                      <Badge variant={STATUS_META[a.status].variant}>{STATUS_META[a.status].label}</Badge>
                      <select
                        value={a.status}
                        onChange={(e) => handleStatusChange(a, e.target.value as ApplicationStatus)}
                        className={cn(selectClass, "px-1.5 py-1 text-xs")}
                        aria-label={`Change status for ${a.company}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_META[s].label}
                          </option>
                        ))}
                      </select>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => handleDelete(a)}
                      className="text-muted transition-colors hover:text-danger"
                      aria-label={`Delete ${a.company}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Toasts toasts={toasts} />
    </div>
  );
}
