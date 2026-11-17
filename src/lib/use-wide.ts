import { useEffect, useState } from "react";

export function useWide(query = "(min-width: 1024px)") {
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const apply = () => setWide(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [query]);

  return wide;
}
