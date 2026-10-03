import { useCallback, useEffect, useMemo, useState } from "react";
import { SosContext } from "./sosContext.js";
import * as safetyApi from "../api/safety.js";
import { useSiren } from "../hooks/useSiren.js";

export function SosProvider({ children }) {
  const siren = useSiren({ initialVolume: 0.5 });
  const [activeEvent, setActiveEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [contactCount, setContactCount] = useState(null);

  // A refresh during a live SOS should still show the banner, so look for one on mount.
  useEffect(() => {
    let active = true;
    safetyApi
      .listSosEvents({ limit: 1 })
      .then(({ data }) => {
        const latest = data?.[0];
        if (active && latest?.status === "active") setActiveEvent(latest);
      })
      .catch(() => {});
    safetyApi
      .listContacts()
      .then(({ contacts }) => active && setContactCount(contacts.length))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const trigger = useCallback(async (coords) => {
    const { event, alreadyActive } = await safetyApi.triggerSos(coords);
    setActiveEvent(event);
    return { event, alreadyActive };
  }, []);

  const close = useCallback(
    async (id, { notify = false, cancel = false } = {}) => {
      const { event } = cancel
        ? await safetyApi.cancelSos(id)
        : await safetyApi.resolveSos(id, { notify });
      setActiveEvent(null);
      siren.stop();
      return event;
    },
    [siren]
  );

  const value = useMemo(
    () => ({
      siren,
      activeEvent,
      setActiveEvent,
      isActive: activeEvent?.status === "active",
      modalOpen,
      openModal: () => setModalOpen(true),
      closeModal: () => setModalOpen(false),
      trigger,
      close,
      contactCount,
      refreshContactCount: (count) => setContactCount(count),
    }),
    [siren, activeEvent, modalOpen, trigger, close, contactCount]
  );

  return <SosContext.Provider value={value}>{children}</SosContext.Provider>;
}
