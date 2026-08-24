import Image from "next/image";

import type { CertificateViewModel } from "@/lib/certificates";

import AutoFitText from "./AutoFitText";
import CertificateQRCode from "@/components/certificates/CertificateQRCode";

type Props = {
  certificate: CertificateViewModel;
};

export default function CertificateRenderer({
  certificate,
}: Props) {
  const template = certificate.templateImage;

  return (
    <div className="overflow-hidden rounded-xl shadow-2xl">
      <div
        id="certificate-pdf-content"
        className="relative mx-auto aspect-[1.414/1] w-full max-w-[1400px] overflow-hidden bg-white"
      >
        <Image
          src={template}
          alt=""
          fill
          priority
          className="object-contain"
        />

   {/* Student Name */}
<div
  className="absolute left-1/2 flex items-center justify-center"
  style={{
    top: "34.8%",
    width: "54%",
    height: "82px",
    transform: "translateX(calc(-50% + 20px))",
  }}
>
<AutoFitText
  text={certificate.studentName}
  maxFontSize={44}
minFontSize={16}
  className="w-full text-center font-black leading-none tracking-wide text-[#07152E] drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
/>
</div>

        {/* QR Code */}
        <div
          className="absolute"
          style={{
            top: "6%",
            right: "5%",
          }}
        >
          <CertificateQRCode
           value={certificate.qrValue}
            size={90}
          />
        </div>

       {/* Certificate Number */}
<div
  className="absolute"
  style={{
    left: "3.5%",
    bottom: "3%",
  }}
>
  <p
    className="font-black tracking-wide text-[#07152E]"
    style={{
      fontSize: "12px",
      letterSpacing: "0.5px",
    }}
  >
    {certificate.certificateNumber}
  </p>
</div>



</div>
</div>
);
}