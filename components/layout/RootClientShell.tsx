"use client";

import { usePathname } from "next/navigation";

import {
  BuilderModeBar,
  BuilderPropertiesPanel,
  BuilderProvider,
} from "@/components/builder";

type RootClientShellProps = {
  children: React.ReactNode;
};

function isCleanCertificateRoute(pathname: string) {
  return (
    pathname.startsWith("/certificates/") ||
    pathname.startsWith("/api/certificates/")
  );
}

export default function RootClientShell({
  children,
}: RootClientShellProps) {
  const pathname = usePathname();

  const hideBuilderTools =
    isCleanCertificateRoute(pathname);

  if (hideBuilderTools) {
    return <>{children}</>;
  }

  return (
    <BuilderProvider>
      {children}

      <BuilderPropertiesPanel />

      <BuilderModeBar />
    </BuilderProvider>
  );
}