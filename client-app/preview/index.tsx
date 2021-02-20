//@ts-ignore Parcel shenaningans
import parcelPreviews from "./Previews/*.tsx";
import { render } from "react-dom";
import React, { useState, useCallback, useMemo, ComponentType } from "react";

const previews = import.meta.globEager<{
  title?: string;
  default: ComponentType;
  props?: any;
}>("./Previews/*.tsx");

// const previews = parcelPreviews as Record<
//   string,
//   { title?: string; default: ComponentType; props?: any }
// >;

function PreviewPicker() {
  const [selectedComponent, setSelectedComponent] = useState(
    sessionStorage["selectedPreviewComponent"] ?? Object.keys(previews)[0]
  );
  const onSelectChange = useCallback(
    (ev: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedComponent(ev.target.value);
      sessionStorage["selectedPreviewComponent"] = ev.target.value;
    },
    []
  );
  const [Component, props] = useMemo(
    () =>
      [
        previews[selectedComponent].default,
        previews[selectedComponent].props,
      ] as const,
    [selectedComponent]
  );

  return (
    <>
      <select
        value={selectedComponent}
        onChange={onSelectChange}
        style={{ position: "fixed", top: 0, right: 0 }}
      >
        {Object.entries(previews).map(([id, value]) => (
          <option key={id} value={id}>
            {value.title ?? id}
          </option>
        ))}
      </select>
      <Component {...props} />
    </>
  );
}

render(<PreviewPicker />, document.getElementById("app-root"));
