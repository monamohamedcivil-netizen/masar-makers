"use client";

import {
  useEffect,
  useState,
} from "react";

import { usePathname } from "next/navigation";

import {
  BuilderModeBar,
  BuilderPropertiesPanel,
  BuilderProvider,
} from "@/components/builder";

import MonthlyDrawOverlay from "@/components/monthly-draw/MonthlyDrawOverlay";

import {
  createClient,
} from "@/lib/supabase/client";

type RootClientShellProps = {
  children: React.ReactNode;
};

type UserRole =
  | "admin"
  | "super_admin"
  | "student"
  | string
  | null;

function isCleanCertificateRoute(
  pathname: string,
) {
  return (
    pathname.startsWith(
      "/certificates/",
    ) ||
    pathname.startsWith(
      "/api/certificates/",
    )
  );
}

function isCourseRoute(
  pathname: string,
) {
  return pathname.startsWith(
    "/course/",
  );
}

export default function RootClientShell({
  children,
}: RootClientShellProps) {
  const pathname = usePathname();

  const [role, setRole] =
    useState<UserRole>(null);

  const [roleReady, setRoleReady] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      try {
        const supabase =
          createClient();

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (cancelled) {
          return;
        }

        if (
          userError ||
          !user
        ) {
          setRole(null);
          setRoleReady(true);
          return;
        }

        const metadataRole =
          typeof user
            .app_metadata
            ?.role ===
          "string"
            ? user.app_metadata
                .role
            : typeof user
                  .user_metadata
                  ?.role ===
                "string"
              ? user
                  .user_metadata
                  .role
              : null;

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) {
          return;
        }

        if (profileError) {
          console.error(
            "Failed to load builder role:",
            profileError,
          );

          setRole(
            metadataRole,
          );
          setRoleReady(
            true,
          );
          return;
        }

        setRole(
          typeof profile?.role ===
            "string"
            ? profile.role
            : metadataRole,
        );

        setRoleReady(true);
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Failed to initialize builder permissions:",
            error,
          );

          setRole(null);
          setRoleReady(true);
        }
      }
    }

    void loadRole();

    return () => {
      cancelled = true;
    };
  }, []);

  const isAdmin =
    role === "admin" ||
    role === "super_admin";

  const showBuilderTools =
    roleReady &&
    isAdmin &&
    isCourseRoute(pathname) &&
    !isCleanCertificateRoute(
      pathname,
    );

  const showMonthlyDraw =
    !isCleanCertificateRoute(
      pathname,
    );

  return (
    <BuilderProvider>
      {children}

      {showBuilderTools ? (
        <>
          <BuilderPropertiesPanel />
          <BuilderModeBar />
        </>
      ) : null}

      {showMonthlyDraw ? (
        <MonthlyDrawOverlay />
      ) : null}
    </BuilderProvider>
  );
}