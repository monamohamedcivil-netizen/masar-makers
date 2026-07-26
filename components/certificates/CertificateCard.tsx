import type { CertificateViewModel } from "@/lib/certificates";

type Props = {
  certificate: CertificateViewModel;
};

export default function CertificateCard({
  certificate,
}: Props) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border-[10px] border-[#F7B548] bg-white p-14 shadow-2xl">

      <div className="absolute left-0 top-0 h-2 w-full bg-[#07152E]" />
      <div className="absolute bottom-0 left-0 h-2 w-full bg-[#07152E]" />

      <div className="text-center">

        <h2 className="text-5xl font-black text-[#07152E]">
          Certificate
        </h2>

        <p className="mt-3 text-xl text-slate-500">
          of Completion
        </p>

        <div className="mt-16">

          <p className="text-lg text-slate-500">
            This Certificate is Proudly Presented To
          </p>

          <h1 className="mt-5 text-5xl font-black text-[#07152E]">
            {certificate.studentName}
          </h1>

          <p className="mt-10 text-lg leading-8 text-slate-600">

            Successfully completed

            <span className="mx-2 font-black text-[#07152E]">

              {certificate.courseTitle}

            </span>

            training journey.

          </p>

        </div>

        <div className="mt-20 grid grid-cols-3 gap-10">

          <Item
            title="Certificate No."
            value={certificate.certificateNumber}
          />

          <Item
            title="Issue Date"
            value={certificate.issueDate}
          />

          <Item
            title="Verification"
            value={certificate.verificationCode}
          />

        </div>

      </div>

    </div>
  );
}

function Item({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-lg font-black text-[#07152E]">
        {value}
      </p>

    </div>
  );
}