import {
  PropsWithChildren,
  CSSProperties,
  useRef,
  useState,
  useEffect,
  useCallback
} from "react";
import PlayerLayout from "./client/PlayerLayout";
import React from "react";
import useEffectWithDeps from "./useEffectWithDeps";

const style: CSSProperties = {
  textAlign: "center",
  margin: "0 auto"
};

const wrapperStyle = {
  display: "flex",
  justifyContent: "center"
};

export default function Banger({
  children,
  style: styleProp,
  adjustWithChildren = true,
  startingEm = 20
}: PropsWithChildren<{
  adjustWithChildren?: boolean;
  style?: CSSProperties;
  startingEm?: number;
}>) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [headingSize, setHeadingSize] = useState({
    em: startingEm,
    validated: false
  });
  const shrinkToFit = useCallback(() => {
    if (headingSize.validated || headingRef.current == null) {
      return;
    }
    const fits =
      headingRef.current.clientHeight <= document.body.scrollHeight &&
      headingRef.current.clientWidth <= document.body.clientWidth;
    setHeadingSize(size =>
      fits ? { ...size, validated: true } : { ...size, em: size.em - 1 }
    );
  }, [headingSize, headingRef.current]);
  useEffectWithDeps(
    prev => {
      adjustWithChildren &&
        prev != null &&
        setHeadingSize({ validated: false, em: startingEm });
    },
    [children]
  );
  useEffect(() => {
    shrinkToFit();
    let timeout: number;
    window.addEventListener("resize", () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(shrinkToFit, 1000);
    });
    return () => window.clearTimeout(timeout);
  }, [shrinkToFit]);
  return (
    <PlayerLayout>
      <h1
        style={{
          ...styleProp,
          ...style,
          fontSize: `${headingSize.em}em`,
          visibility: headingSize.validated ? "visible" : "hidden"
        }}
        ref={headingRef}
      >
        {children}
      </h1>
    </PlayerLayout>
  );
}
