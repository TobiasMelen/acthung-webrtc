import {
  PropsWithChildren,
  CSSProperties,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import PlayerLayout from "./Layout";
import React from "react";

const waitForRender = () =>
  new Promise((resolve) =>
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve))
  );
const style: CSSProperties = {
  textAlign: "center",
  margin: "0 auto",
};

type Props = PropsWithChildren<{
  fixed?: boolean;
  style?: CSSProperties;
  startingEm?: number;
}>;

export default function Banger({
  children,
  style: styleProp,
  startingEm = 20,
}: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [headingSize, setHeadingSize] = useState<number>();

  const shrinkToFit = useCallback(() => {
    async function shrink(em: number) {
      if (headingRef.current == null) {
        return;
      }
      headingRef.current.style.fontSize = `${em}em`;
      const fits =
        headingRef.current.clientHeight <= document.body.scrollHeight &&
        headingRef.current.clientWidth <= document.body.clientWidth;
      console.log(fits);
      fits ? setHeadingSize(em) : shrink(em - 1);
    }
    shrink(startingEm);
  }, [headingRef.current]);

  useEffect(() => {
    let timeout: number;
    window.addEventListener("resize", () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(shrinkToFit, 500);
    });
    shrinkToFit();
    return () => window.clearTimeout(timeout);
  }, [shrinkToFit, startingEm]);

  return (
    <PlayerLayout>
      <h1
        style={{
          ...styleProp,
          ...style,
          visibility: headingSize != null ? "visible" : "hidden",
        }}
        ref={headingRef}
      >
        {children}
      </h1>
    </PlayerLayout>
  );
}
