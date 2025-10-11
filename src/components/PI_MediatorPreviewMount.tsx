import { useEffect, useState } from "react";
import MediatorOverlay from "./MediatorOverlay";
import { getFeatureFlags } from "@/lib/featureFlags";

const PI_MediatorPreviewMount = () => {
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    const flags = getFeatureFlags();
    setShouldMount(flags.mediatorOverlay);
  }, []);

  if (!shouldMount) return null;

  return <MediatorOverlay />;
};

export default PI_MediatorPreviewMount;
