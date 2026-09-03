import { useState } from "react";
import { useBuild } from "../../store/build";
import { getSavedBuild, loadProfileSnapshot } from "../../utils/build/savedBuilds";
import { ShareDialog, type ShareDialogProps, type ShareableSet } from "./ShareDialog";

type ShareState = Omit<ShareDialogProps, "onClose">;

export default function ShareButton() {
  const [share, setShare] = useState<ShareState | null>(null);

  const onOpen = () => {
    if (share) {
      setShare(null);
      return;
    }
    const { activeBuildId, activeProfileId, exportBuildSnapshot, notes } =
      useBuild.getState();
    const savedBuild = activeBuildId ? getSavedBuild(activeBuildId) : null;
    const sets: ShareableSet[] = savedBuild
      ? savedBuild.profiles.map((p) => ({
          id: p.id,
          label: p.name,
          snapshot:
            p.id === activeProfileId
              ? exportBuildSnapshot()
              : (loadProfileSnapshot(activeBuildId!, p.id) ??
                exportBuildSnapshot()),
        }))
      : [{ id: "live", label: "Current", snapshot: exportBuildSnapshot() }];
    setShare({
      sets,
      notes,
      buildId: savedBuild?.id ?? null,
      buildName: savedBuild?.name ?? null,
      createdAt: savedBuild?.createdAt ?? new Date().toISOString(),
      tags: savedBuild?.tags ?? [],
    });
  };

  return (
    <>
      <button
        onClick={onOpen}
        data-tour="share"
        className="inline-flex items-center gap-1.5 rounded-[3px] border border-accent-deep px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-hot transition-colors hover:border-accent-hot hover:text-[#fff0c4]"
        style={{ background: "linear-gradient(180deg, #3a2f1a, #2a2418)" }}
        title="Share this build"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Share
      </button>

      {share && <ShareDialog {...share} onClose={() => setShare(null)} />}
    </>
  );
}
