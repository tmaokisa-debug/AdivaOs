import { useQuery } from "@tanstack/react-query";
import { Activity, CircleHelp, Server, ShieldCheck, WifiOff } from "lucide-react";
import { healthApi, type HealthStatus } from "../api/health";

const REFRESH_INTERVAL_MS = 30_000;
const STALE_AFTER_MS = 60_000;

type PulseObservation = {
  health: HealthStatus;
  latencyMs: number;
};

function observationLabel(dataUpdatedAt: number): string {
  if (!dataUpdatedAt) return "No successful observation yet";
  return `Last checked ${new Date(dataUpdatedAt).toLocaleTimeString()}`;
}

export function AdivaPulsePanel() {
  const health = useQuery({
    queryKey: ["adiva-pulse", "paperclip-health"],
    queryFn: async (): Promise<PulseObservation> => {
      const startedAt = performance.now();
      const result = await healthApi.get();
      return { health: result, latencyMs: Math.round(performance.now() - startedAt) };
    },
    refetchInterval: REFRESH_INTERVAL_MS,
    staleTime: 15_000,
    retry: 1,
  });

  const isStale = health.dataUpdatedAt > 0 && Date.now() - health.dataUpdatedAt > STALE_AFTER_MS;
  const apiHealthy = !!health.data && !isStale && !health.isError;
  const apiState = health.isPending
    ? "Checking"
    : health.isError
      ? health.data && !isStale ? "Degraded" : "Unavailable"
      : isStale
        ? "Stale"
        : health.data?.health.status === "ok" ? "Healthy" : "Unknown";

  return (
    <section aria-labelledby="adiva-pulse-title" className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 id="adiva-pulse-title" className="text-base font-semibold text-foreground">Adiva Pulse</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Evidence-first operations overview. Unknown means not connected, not failed.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
          <span className={apiHealthy ? "h-2 w-2 rounded-full bg-emerald-500" : "h-2 w-2 rounded-full bg-amber-500"} />
          {health.isPending ? "Checking" : apiHealthy ? "API check passing" : isStale ? "Observation stale" : "Partial visibility"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <PulseSourceCard
          title="Paperclip API"
          state={apiState}
          detail={health.data ? `Version ${health.data.health.version ?? "unknown"} · ${health.data.latencyMs} ms` : "GET /api/health"}
          observedAt={observationLabel(health.dataUpdatedAt)}
          icon={health.isError && !health.data ? WifiOff : ShieldCheck}
        />
        <PulseSourceCard
          title="ProBook"
          state="Unknown"
          detail="Host telemetry is not connected to this view yet."
          observedAt="No observation source configured"
          icon={Server}
        />
        <PulseSourceCard
          title="Phoenix"
          state="Unknown"
          detail="Host telemetry is not connected to this view yet."
          observedAt="No observation source configured"
          icon={Server}
        />
        <PulseSourceCard
          title="AdivaOS Core bridge"
          state="Unknown"
          detail="Bridge reachability needs an authenticated, read-only check."
          observedAt="No observation source configured"
          icon={CircleHelp}
        />
      </div>

      {health.isError && (
        <p role="status" className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          Paperclip health check failed: {health.error instanceof Error ? health.error.message : "Unknown error"}. Other system states remain unknown.
        </p>
      )}
    </section>
  );
}

function PulseSourceCard({
  title,
  state,
  detail,
  observedAt,
  icon: Icon,
}: {
  title: string;
  state: string;
  detail: string;
  observedAt: string;
  icon: typeof Server;
}) {
  const stateTone =
    state === "Healthy" ? "text-emerald-700 dark:text-emerald-300" :
    state === "Unavailable" ? "text-red-700 dark:text-red-300" :
    state === "Degraded" || state === "Stale" ? "text-amber-700 dark:text-amber-300" :
    "text-muted-foreground";

  return (
    <div className="min-w-0 rounded-lg border border-border/80 bg-background p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="truncate text-sm font-medium text-foreground">{title}</span>
      </div>
      <p className={`mt-2 text-sm font-semibold ${stateTone}`}>{state}</p>
      <p className="mt-1 min-h-10 text-xs leading-5 text-muted-foreground">{detail}</p>
      <p className="mt-2 text-[11px] text-muted-foreground">{observedAt}</p>
    </div>
  );
}
