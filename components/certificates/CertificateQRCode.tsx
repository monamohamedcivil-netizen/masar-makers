"use client";

import QRCode from "react-qr-code";

type Props = {
  value: string;
  size?: number;
};

export default function CertificateQRCode({
  value,
  size = 60,
}: Props) {
  const qrSize = Math.max(size - 6, 20);

  return (
    <div
      className="flex items-center justify-center bg-white"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        padding: "3px",
      }}
    >
      <QRCode
        value={value}
        size={qrSize}
        bgColor="#FFFFFF"
        fgColor="#000000"
        level="M"
      />
    </div>
  );
}