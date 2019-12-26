import Game from "./Game";
import LobbyLayout, { LobbyContent } from "./LobbyLayout";
import { MainHeading, SubHeading } from "../Layout";
import QrCode from "../QrCode";
import React from "react";

type Props = Parameters<typeof Game>[0] & { url: string };

export default function Waiting({ url, players }: Props) {
  return (
    <LobbyLayout>
      <LobbyContent>
        <MainHeading>A friendly game of murder snake combat?</MainHeading>
        <QrCode>{url}</QrCode>
        <SubHeading>Scan QR code or visit:</SubHeading>
        <SubHeading>
          <span style={{ textDecoration: "underline" }}>{url}</span>
        </SubHeading>
      </LobbyContent>
    </LobbyLayout>
  );
}