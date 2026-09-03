import { useState } from "react";
import { useBuild } from "../../store/build";
import {
  GistShareError,
  fetchBuildCodeFromGist,
  isGistReference,
} from "../../utils/build/gistShare";
import {
  decodeAnyShareToBuild,
  type DecodedAnyShare,
} from "../../utils/build/shareBuild";
import {
  MODAL_BTN_CLASS,
  MODAL_BTN_PRIMARY_CLASS,
  MODAL_FOOTER_CLASS,
  Modal,
} from "../ui/Modal";

interface ImportSetModalProps {
  setLabel: string;
  onClose: () => void;
}

export function ImportSetModal({ setLabel, onClose }: ImportSetModalProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [decoded, setDecoded] = useState<DecodedAnyShare | null>(null);
  const [pickedIndex, setPickedIndex] = useState(0);

  const apply = (snapshot: DecodedAnyShare["sets"][number]["snapshot"]) => {
    const ok = useBuild.getState().applySnapshotToActive(snapshot);
    if (!ok) {
      setError("Could not apply this set — is a build open?");
      return;
    }
    onClose();
  };

  const submitCode = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    let raw = text;
    if (isGistReference(text)) {
      try {
        raw = await fetchBuildCodeFromGist(text);
      } catch (e) {
        setBusy(false);
        setError(e instanceof GistShareError ? e.message : "Could not fetch the Gist");
        return;
      }
    }
    const result = decodeAnyShareToBuild(raw);
    setBusy(false);
    if (!result || result.sets.length === 0) {
      setError("Invalid or corrupted build code");
      return;
    }
    if (result.sets.length === 1) {
      apply(result.sets[0]!.snapshot);
      return;
    }
    setDecoded(result);
    setPickedIndex(0);
  };

  if (decoded && decoded.sets.length > 1) {
    return (
      <Modal
        onClose={onClose}
        panelClassName="w-[480px] max-w-[92vw]"
        eyebrow="Import"
        title={`Import into ${setLabel}`}
        titleId="import-set-title"
        subtitle="This code bundles several sets — pick the one to load here."
      >
        <section className="flex flex-col gap-1.5 px-6 py-4">
          {decoded.sets.map((s, i) => (
            <label
              key={i}
              className="flex cursor-pointer items-center gap-2.5 rounded-[3px] border border-border-2 px-3 py-2 font-mono text-[12px] text-text transition-colors hover:border-accent-deep"
            >
              <input
                type="radio"
                name="import-set-pick"
                checked={pickedIndex === i}
                onChange={() => setPickedIndex(i)}
              />
              {s.name}
            </label>
          ))}
        </section>
        <footer className={MODAL_FOOTER_CLASS} style={{ background: "rgba(0,0,0,0.3)" }}>
          <button type="button" onClick={() => setDecoded(null)} className={MODAL_BTN_CLASS}>
            Back
          </button>
          <button
            type="button"
            onClick={() => apply(decoded.sets[pickedIndex]!.snapshot)}
            className={MODAL_BTN_PRIMARY_CLASS}
          >
            Import
          </button>
        </footer>
      </Modal>
    );
  }

  return (
    <Modal
      onClose={onClose}
      panelClassName="w-[480px] max-w-[92vw]"
      eyebrow="Import"
      title={`Import into ${setLabel}`}
      titleId="import-set-title"
      subtitle="Paste a build code or shared link. This overwrites the current contents of this set — Ctrl+Z undoes it."
    >
      <section className="px-6 py-4">
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste build code…"
          rows={4}
          className="w-full resize-none rounded-[4px] border border-border-2 bg-panel px-3 py-2 font-mono text-[12px] text-text outline-none focus:border-accent-deep"
        />
        {error && (
          <p className="m-0 mt-2 font-mono text-[11px] text-stat-red">{error}</p>
        )}
      </section>
      <footer className={MODAL_FOOTER_CLASS} style={{ background: "rgba(0,0,0,0.3)" }}>
        <button type="button" onClick={onClose} className={MODAL_BTN_CLASS}>
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void submitCode()}
          disabled={busy || !text.trim()}
          className={MODAL_BTN_PRIMARY_CLASS}
        >
          Import
        </button>
      </footer>
    </Modal>
  );
}
