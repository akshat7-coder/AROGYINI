import { useCallback, useEffect, useRef, useState } from "react";

const CENTRE_HZ = 1000; // midpoint of the 600–1400 Hz sweep
const SWEEP_HZ = 400; // depth either side of centre
const SWEEP_RATE_HZ = 0.7; // full up-and-down cycles per second
const RAMP_SECONDS = 0.08;

// Web Audio siren. Two oscillators swept by a shared LFO through 600–1400 Hz.
// start() must be called from a user gesture, otherwise the browser keeps the
// AudioContext suspended and nothing is heard.
export function useSiren({ initialVolume = 0.5 } = {}) {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolumeState] = useState(initialVolume);
  const [blocked, setBlocked] = useState(false);

  const contextRef = useRef(null);
  const graphRef = useRef(null);
  const volumeRef = useRef(initialVolume);

  const teardown = useCallback(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graphRef.current = null;

    for (const node of [graph.osc1, graph.osc2, graph.lfo]) {
      try {
        node.stop();
      } catch {
        // already stopped
      }
      node.disconnect();
    }
    graph.lfoGain.disconnect();
    graph.gain.disconnect();
  }, []);

  const stop = useCallback(() => {
    const graph = graphRef.current;
    const context = contextRef.current;

    // Fade out over ~80ms so stopping does not click.
    if (graph && context) {
      const now = context.currentTime;
      graph.gain.gain.cancelScheduledValues(now);
      graph.gain.gain.setValueAtTime(graph.gain.gain.value, now);
      graph.gain.gain.linearRampToValueAtTime(0, now + RAMP_SECONDS);
      setTimeout(teardown, RAMP_SECONDS * 1000 + 20);
    } else {
      teardown();
    }
    setPlaying(false);
  }, [teardown]);

  const start = useCallback(async () => {
    if (graphRef.current) return true;

    try {
      const AudioCtor = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioCtor) throw new Error("Web Audio is not available");
      contextRef.current ??= new AudioCtor();
      const context = contextRef.current;
      if (context.state === "suspended") await context.resume();

      const gain = context.createGain();
      gain.gain.value = 0;
      gain.connect(context.destination);

      const osc1 = context.createOscillator();
      osc1.type = "sawtooth";
      osc1.frequency.value = CENTRE_HZ;

      const osc2 = context.createOscillator();
      osc2.type = "square";
      osc2.frequency.value = CENTRE_HZ;
      osc2.detune.value = 14; // slight beat against osc1, which carries further

      // One LFO drives both oscillators, so they stay in step.
      const lfo = context.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = SWEEP_RATE_HZ;
      const lfoGain = context.createGain();
      lfoGain.gain.value = SWEEP_HZ;
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      osc1.connect(gain);
      osc2.connect(gain);
      osc1.start();
      osc2.start();
      lfo.start();

      const now = context.currentTime;
      gain.gain.linearRampToValueAtTime(volumeRef.current, now + RAMP_SECONDS);

      graphRef.current = { osc1, osc2, lfo, gain, lfoGain };
      setBlocked(false);
      setPlaying(true);
      return true;
    } catch {
      setBlocked(true);
      setPlaying(false);
      return false;
    }
  }, []);

  const toggle = useCallback(() => (playing ? stop() : start()), [playing, start, stop]);

  const setVolume = useCallback((next) => {
    const clamped = Math.min(1, Math.max(0, Number(next) || 0));
    volumeRef.current = clamped;
    setVolumeState(clamped);

    const graph = graphRef.current;
    const context = contextRef.current;
    if (graph && context) {
      graph.gain.gain.cancelScheduledValues(context.currentTime);
      graph.gain.gain.linearRampToValueAtTime(clamped, context.currentTime + 0.05);
    }
  }, []);

  // Close the AudioContext on unmount; leaving it open holds the audio device.
  useEffect(
    () => () => {
      teardown();
      contextRef.current?.close().catch(() => {});
      contextRef.current = null;
    },
    [teardown]
  );

  return { playing, volume, blocked, start, stop, toggle, setVolume };
}
