import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Phone, PhoneCall, PhoneOff, Vibrate } from "lucide-react";
import Card, { CardHeader } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";

// A two-tone pattern roughly like an Indian landline ring: 0.4s on, 0.2s off, 0.4s on, 2s silence.
const RING_PATTERN = [
  [0, 0.4],
  [0.6, 0.4],
];
const RING_CYCLE_SECONDS = 3;

function useRingtone() {
  const contextRef = useRef(null);
  const timerRef = useRef(null);

  const stop = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    contextRef.current?.close().catch(() => {});
    contextRef.current = null;
  }, []);

  const start = useCallback(async () => {
    try {
      const AudioCtor = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioCtor) return;
      contextRef.current ??= new AudioCtor();
      const context = contextRef.current;
      if (context.state === "suspended") await context.resume();

      const ringOnce = () => {
        const now = context.currentTime;
        for (const [offset, duration] of RING_PATTERN) {
          const gain = context.createGain();
          gain.gain.value = 0;
          gain.connect(context.destination);

          // 440 Hz + 480 Hz is the classic ringback pair.
          for (const frequency of [440, 480]) {
            const osc = context.createOscillator();
            osc.type = "sine";
            osc.frequency.value = frequency;
            osc.connect(gain);
            osc.start(now + offset);
            osc.stop(now + offset + duration);
          }

          gain.gain.setValueAtTime(0, now + offset);
          gain.gain.linearRampToValueAtTime(0.25, now + offset + 0.02);
          gain.gain.setValueAtTime(0.25, now + offset + duration - 0.02);
          gain.gain.linearRampToValueAtTime(0, now + offset + duration);
        }
      };

      ringOnce();
      timerRef.current = setInterval(ringOnce, RING_CYCLE_SECONDS * 1000);
    } catch {
      // No audio is survivable: the screen alone still does the job.
    }
  }, []);

  useEffect(() => stop, [stop]);
  return { start, stop };
}

const formatDuration = (totalSeconds) => {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

function CallScreen({ caller, answered, elapsed, onAnswer, onEnd }) {
  return createPortal(
    <div className="fixed inset-0 z-70 flex flex-col items-center justify-between bg-slate-900 px-6 py-14 text-white">
      <div className="mt-6 text-center">
        <p className="text-sm text-slate-400">{answered ? "Ongoing call" : "Incoming call"}</p>
        <h2 className="mt-3 text-3xl font-semibold">{caller}</h2>
        <p className="font-mono tnum mt-3 text-base text-slate-300" aria-live="polite">
          {answered ? formatDuration(elapsed) : "Mobile"}
        </p>
      </div>

      <div
        className={`grid size-32 place-items-center rounded-full bg-slate-700 text-4xl font-semibold
          ${answered ? "" : "motion-safe:animate-pulse"}`}
      >
        {caller.trim()[0]?.toUpperCase() ?? "?"}
      </div>

      <div className="mb-4 flex w-full max-w-xs items-center justify-around">
        {answered ? (
          <button
            type="button"
            onClick={onEnd}
            aria-label="End call"
            className="focus-ring grid size-18 place-items-center rounded-full bg-rose-600 shadow-lg transition hover:brightness-110"
          >
            <PhoneOff className="size-7" aria-hidden="true" />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onEnd}
              aria-label="Decline call"
              className="focus-ring grid size-18 place-items-center rounded-full bg-rose-600 shadow-lg transition hover:brightness-110"
            >
              <PhoneOff className="size-7" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onAnswer}
              aria-label="Answer call"
              className="focus-ring grid size-18 place-items-center rounded-full bg-emerald-600 shadow-lg transition hover:brightness-110 motion-safe:animate-bounce"
            >
              <PhoneCall className="size-7" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

export default function FakeCall() {
  const ringtone = useRingtone();
  const [caller, setCaller] = useState("Papa");
  const [ringing, setRinging] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!answered) return;
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [answered]);

  function startCall() {
    setAnswered(false);
    setElapsed(0);
    setRinging(true);
    ringtone.start();
    navigator.vibrate?.([600, 400, 600, 400]);
  }

  function answer() {
    ringtone.stop();
    navigator.vibrate?.(0);
    setAnswered(true);
  }

  function end() {
    ringtone.stop();
    navigator.vibrate?.(0);
    setRinging(false);
    setAnswered(false);
    setElapsed(0);
  }

  return (
    <Card as="section">
      <CardHeader
        title="Fake incoming call"
        description="Looks and sounds like a real call, so you have a reason to walk away."
        icon={Phone}
      />

      <div className="space-y-4">
        <Input
          label="Caller name"
          placeholder="Papa"
          value={caller}
          onChange={(event) => setCaller(event.target.value)}
          hint="Choose a name that makes sense for you."
        />

        <Button
          variant="secondary"
          size="lg"
          onClick={startCall}
          disabled={!caller.trim()}
          className="w-full"
        >
          <PhoneCall className="size-5" aria-hidden="true" />
          Start the fake call
        </Button>

        <p className="flex items-start gap-1.5 text-xs text-slate-500">
          <Vibrate className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Your phone vibrates too, where the browser allows it.
        </p>
      </div>

      {ringing ? (
        <CallScreen
          caller={caller.trim() || "Unknown"}
          answered={answered}
          elapsed={elapsed}
          onAnswer={answer}
          onEnd={end}
        />
      ) : null}
    </Card>
  );
}
