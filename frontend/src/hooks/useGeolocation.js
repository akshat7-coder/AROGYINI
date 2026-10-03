import { useCallback, useState } from "react";

const TIMEOUT_MS = 8000;

const MESSAGES = {
  1: "Location permission was denied. Allow location access in your browser settings so your contacts can be sent where you are.",
  2: "Your location is unavailable right now. Move somewhere with a clearer signal and try again.",
  3: "Finding your location took too long. Try again, or call 112 directly.",
};

export function useGeolocation({ timeout = TIMEOUT_MS, enableHighAccuracy = true } = {}) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Resolves with { latitude, longitude, accuracy } or rejects with a readable Error.
  const request = useCallback(
    () =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          const message = "This browser cannot share your location. Call 112 directly.";
          setError(message);
          reject(new Error(message));
          return;
        }

        setLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            const next = {
              latitude: coords.latitude,
              longitude: coords.longitude,
              accuracy: coords.accuracy ?? undefined,
            };
            setPosition(next);
            setLoading(false);
            resolve(next);
          },
          (geoError) => {
            const message = MESSAGES[geoError.code] ?? "Could not get your location.";
            setPosition(null);
            setError(message);
            setLoading(false);
            reject(new Error(message));
          },
          { enableHighAccuracy, timeout, maximumAge: 0 }
        );
      }),
    [enableHighAccuracy, timeout]
  );

  return { position, error, loading, request };
}
