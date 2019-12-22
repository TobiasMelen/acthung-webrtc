import ClientDataChannel from "./connection/ClientDataChannel";
import React from "react";

type Props = {
    path: string;
    lobbyName?: string;
}

export default function Client({lobbyName = "new"}: Props){
return <ClientDataChannel lobbyName={lobbyName}>{channel => <h1>{channel ? "Connected" : "Connecting"}</h1>}</ClientDataChannel>
}