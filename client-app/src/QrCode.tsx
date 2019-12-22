import Qr from "qrcode-svg";
import React, { useEffect, useState } from "react";
type Props = {
    value: string
}

export default function QrCode({value}: Props){
    const [qrCode, setQrCode] = useState<string>("");
    useEffect(() => {
        const qrCode = new Qr(value);
        setQrCode(qrCode.svg());
        return () => {
            setQrCode("");
        }
    }, [value])
    return <svg style={{overflow: "visible"}}dangerouslySetInnerHTML={{__html: qrCode}}></svg>
}