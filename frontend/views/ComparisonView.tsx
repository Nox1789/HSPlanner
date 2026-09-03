import { useMemo, useState, type ReactNode } from "react";
import { useBuild } from "../store/build";
import { useBuildPerformanceDeps } from "../hooks/useBuildPerformanceDeps";
import { getSavedBuild, loadProfileSnapshot } from "../utils/build/savedBuilds";
import { performanceDepsFromSnapshot } from "../utils/build/snapshotDeps";
import { StatsPanel } from "./stats/StatsPanel";

function EmptyNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="max-w-xs text-center font-mono text-[12px] leading-relaxed tracking-[0.04em] text-muted">
        {children}
      </p>
    </div>
  );
}

function ComparisonColumn({
  buildId,
  profileId,
  label,
  isActive,
}: {
  buildId: string;
  profileId: string;
  label: string;
  isActive: boolean;
}) {
  const savedBuildsVersion = useBuild((s) => s.savedBuildsVersion);
  const liveDeps = useBuildPerformanceDeps();
  const liveInventory = useBuild((s) => s.inventory);
  const liveMercInventory = useBuild((s) => s.mercInventory);
  const liveEtherNodes = useBuild((s) => s.allocatedEtherNodes);

  const snapshot = useMemo(() => {
    void savedBuildsVersion; // re-fetch whenever any profile data is committed
    return isActive ? null : loadProfileSnapshot(buildId, profileId);
  }, [buildId, profileId, isActive, savedBuildsVersion]);
  const snapDeps = useMemo(
    () => (snapshot ? performanceDepsFromSnapshot(snapshot) : null),
    [snapshot],
  );

  const deps = isActive ? liveDeps : (snapDeps ?? liveDeps);
  const rawInventory = isActive
    ? liveInventory
    : (snapshot?.inventory ?? liveInventory);
  const mercInventory = isActive
    ? liveMercInventory
    : (snapshot?.mercInventory ?? liveMercInventory);
  const allocatedEtherNodes = isActive
    ? liveEtherNodes
    : (snapshot?.allocatedEtherNodes ?? liveEtherNodes);

  return (
    <div
      className="min-w-[380px] flex-1 rounded-md border border-border p-4"
      style={{
        background:
          "linear-gradient(180deg, var(--color-panel), color-mix(in srgb, var(--color-bg) 70%, transparent))",
      }}
    >
      <StatsPanel
        deps={deps}
        rawInventory={rawInventory}
        mercInventory={mercInventory}
        allocatedEtherNodes={allocatedEtherNodes}
        title={label}
      />
    </div>
  );
}

export default function ComparisonView() {
  const activeBuildId = useBuild((s) => s.activeBuildId);
  const activeProfileId = useBuild((s) => s.activeProfileId);
  useBuild((s) => s.savedBuildsVersion);
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);

  const build = activeBuildId ? getSavedBuild(activeBuildId) : null;
  const availableSets = build?.profiles ?? [];
  const effectiveSelected = selectedIds ?? availableSets.map((p) => p.id);

  const toggle = (id: string) => {
    setSelectedIds((cur) => {
      const base = cur ?? availableSets.map((p) => p.id);
      const checked = base.includes(id);
      if (checked) {
        const next = base.filter((x) => x !== id);
        return next.length > 0 ? next : base;
      }
      return [...base, id];
    });
  };

  if (!activeBuildId || !build) {
    return (
      <EmptyNotice>
        Save this build to your library to compare sets against each other.
      </EmptyNotice>
    );
  }

  if (availableSets.length < 2) {
    return (
      <EmptyNotice>
        Create a second set (Set 2 or Set 3, top of the header) to compare
        builds side by side.
      </EmptyNotice>
    );
  }

  const columns = availableSets.filter((p) => effectiveSelected.includes(p.id));

  return (
    <div className="flex h-full flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className="m-0 font-semibold tracking-[0.04em] text-accent-hot"
          style={{ fontSize: "22px", textShadow: "0 0 16px rgba(224,184,100,0.18)" }}
        >
          Comparison
        </h2>
        <div className="flex items-center gap-1.5">
          {availableSets.map((p) => {
            const checked = effectiveSelected.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className={`rounded-[3px] border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                  checked
                    ? "border-accent-deep text-accent-hot"
                    : "border-border-2 text-muted hover:border-accent-deep"
                }`}
                style={
                  checked
                    ? {
                        background:
                          "linear-gradient(180deg, rgba(58,46,24,0.6), rgba(42,36,24,0.4))",
                      }
                    : undefined
                }
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </header>

      <div className="flex flex-1 items-start gap-4 overflow-x-auto">
        {columns.map((p) => (
          <ComparisonColumn
            key={p.id}
            buildId={activeBuildId}
            profileId={p.id}
            label={p.name}
            isActive={p.id === activeProfileId}
          />
        ))}
      </div>
    </div>
  );
}
