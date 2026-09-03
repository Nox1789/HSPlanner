import { useState } from "react";
import { motion } from "motion/react";
import { hoverTap } from "../../utils/motion";
import { getSavedBuild } from "../../utils/build/savedBuilds";
import { useBuild } from "../../store/build";
import Dropdown from "../ui/Dropdown";
import { ImportSetModal } from "./ImportSetModal";

const SET_LABELS = ["Set 1", "Set 2", "Set 3"] as const;

export default function SetSwitcher() {
  const activeBuildId = useBuild((s) => s.activeBuildId);
  const activeProfileId = useBuild((s) => s.activeProfileId);
  useBuild((s) => s.savedBuildsVersion);
  const [importOpen, setImportOpen] = useState(false);

  const build = activeBuildId ? getSavedBuild(activeBuildId) : null;
  const disabled = !activeBuildId;
  const activeIndex = SET_LABELS.findIndex(
    (_, i) => build?.profiles[i]?.id === activeProfileId,
  );
  const activeLabel =
    activeIndex >= 0 ? SET_LABELS[activeIndex] : SET_LABELS[0];

  const handleSelect = (index: number) => {
    if (!activeBuildId) return;
    const profile = build?.profiles[index];
    if (profile) {
      if (profile.id !== activeProfileId) {
        useBuild.getState().switchActiveProfile(profile.id);
      }
    } else {
      const label = SET_LABELS[index] ?? `Set ${index + 1}`;
      useBuild.getState().addEmptyProfileToActiveBuild(label);
    }
  };

  const copyOptions = SET_LABELS.map((label, i) => ({
    id: build?.profiles[i]?.id ?? "",
    label,
    profile: build?.profiles[i],
  })).filter(
    (o) => o.profile != null && o.profile.id !== activeProfileId,
  );

  return (
    <div className="flex items-center gap-2">
      <div
        data-tour="sets"
        title={disabled ? "Save the build to use sets" : undefined}
        className="flex items-center gap-0.5 rounded-[3px] border border-border-2 bg-panel-2/70 p-0.5"
      >
        {SET_LABELS.map((label, i) => {
          const profile = build?.profiles[i];
          const active =
            !disabled && !!profile && profile.id === activeProfileId;
          return (
            <motion.button
              key={label}
              type="button"
              disabled={disabled}
              onClick={() => handleSelect(i)}
              {...hoverTap}
              title={
                !disabled && !profile
                  ? `Create ${label} as a fresh, empty config`
                  : undefined
              }
              className={`rounded-[2px] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                active
                  ? "bg-accent-deep/30 text-accent-hot"
                  : "text-muted hover:text-text"
              }`}
              style={
                active
                  ? { boxShadow: "inset 0 0 0 1px rgba(224,184,100,0.3)" }
                  : undefined
              }
            >
              {label}
            </motion.button>
          );
        })}
      </div>

      {!disabled && copyOptions.length > 0 && (
        <Dropdown
          compact
          searchable={false}
          value={null}
          placeholder="Kopie Set"
          options={copyOptions}
          onChange={(id) => {
            if (id) useBuild.getState().copyProfileIntoActive(id);
          }}
        />
      )}

      {!disabled && (
        <motion.button
          type="button"
          onClick={() => setImportOpen(true)}
          {...hoverTap}
          title={`Import a build code into ${activeLabel}`}
          className="rounded-[3px] border border-border-2 bg-panel-2/70 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:border-accent-deep hover:text-accent-hot"
        >
          Import
        </motion.button>
      )}

      {importOpen && (
        <ImportSetModal
          setLabel={activeLabel ?? "Set"}
          onClose={() => setImportOpen(false)}
        />
      )}
    </div>
  );
}
