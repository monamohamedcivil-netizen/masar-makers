export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">

      <div className="rounded-3xl bg-white p-12 text-center shadow-xl">

        <h1 className="text-5xl">
          ❌
        </h1>

        <h2 className="mt-6 text-3xl font-black text-red-700">
          Certificate Not Found
        </h2>

        <p className="mt-4 text-slate-600">
          The verification code is invalid or the certificate does not exist.
        </p>

      </div>

    </main>
  );
}