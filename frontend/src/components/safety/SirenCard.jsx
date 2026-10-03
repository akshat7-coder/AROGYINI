import { BellOff, Siren, Volume2 } from "lucide-react";
import Card, { CardHeader } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import { useSos } from "../../context/sosContext.js";

export default function SirenCard() {
  const { siren } = useSos();

  return (
    <Card as="section">
      <CardHeader
        title="Loud siren"
        description="A rising and falling alarm to attract attention and put someone off."
        icon={Siren}
      />

      {siren.blocked ? (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
          Your browser blocked the audio. Tap the button again, and check that this tab is not
          muted.
        </p>
      ) : null}

      <Button
        variant={siren.playing ? "secondary" : "danger"}
        size="lg"
        onClick={siren.toggle}
        className="w-full"
        aria-pressed={siren.playing}
      >
        {siren.playing ? (
          <>
            <BellOff className="size-5" aria-hidden="true" />
            Stop the siren
          </>
        ) : (
          <>
            <Volume2 className="size-5" aria-hidden="true" />
            Sound the siren
          </>
        )}
      </Button>

      <div className="mt-5">
        <label htmlFor="siren-volume" className="mb-2 block text-sm font-medium text-slate-700">
          Volume
          <span className="font-mono tnum ml-2 text-xs text-slate-500">
            {Math.round(siren.volume * 100)}%
          </span>
        </label>
        <input
          id="siren-volume"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={siren.volume}
          onChange={(event) => siren.setVolume(event.target.valueAsNumber)}
          className="accent-safety focus-ring h-2 w-full cursor-pointer rounded-full bg-slate-200"
        />
      </div>

      <p className="mt-4 text-xs text-slate-500">
        The siren starts on its own when you send an SOS. Test it here so you know how loud it is.
      </p>
    </Card>
  );
}
