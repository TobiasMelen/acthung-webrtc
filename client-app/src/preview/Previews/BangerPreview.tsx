import Banger from "../../components/Banger";
import React from "react";

export const title = "Banger";

export const props = {
  content: "you lose"
};

export default function BangerPreview({ content }: typeof props) {
  return <Banger startingEm={30}>{content}</Banger>;
}
