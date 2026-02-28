import * as L from "leaflet";
import * as React from "react";
import { useMap } from "react-leaflet";

interface ExplorerTilesToggleProps {
  enabled: boolean;
  onToggle: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ExplorerTilesToggle({
  enabled,
  onToggle,
}: ExplorerTilesToggleProps) {
  const map = useMap();

  React.useEffect(() => {
    const ExplorerControl = L.Control.extend({
      onAdd() {
        const container = L.DomUtil.create(
          "div",
          "leaflet-bar leaflet-control",
        );
        const button = L.DomUtil.create("a", "", container);
        button.href = "#";
        button.title = "Toggle Explorer Tiles";
        button.innerHTML = "&#9638;";
        button.style.fontSize = "18px";
        button.style.lineHeight = "26px";
        button.style.textAlign = "center";
        button.style.width = "30px";
        button.style.height = "30px";
        button.style.display = "flex";
        button.style.alignItems = "center";
        button.style.justifyContent = "center";

        L.DomEvent.on(button, "click", (e) => {
          L.DomEvent.preventDefault(e);
          L.DomEvent.stopPropagation(e);
          onToggle((prev) => !prev);
        });

        return container;
      },
    });

    const control = new ExplorerControl({ position: "topright" });
    control.addTo(map);

    return () => {
      control.remove();
    };
  }, [map, onToggle]);

  return null;
}
