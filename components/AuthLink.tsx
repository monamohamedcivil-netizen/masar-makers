"use client";

import Link from "next/link";

import useCurrentUser from "@/hooks/useCurrentUser";

type AuthLinkProps = {
  href?: string;
  className?: string;
  children: React.ReactNode;
};

export default function AuthLink({
  href = "/",
  className,
  children,
}: AuthLinkProps) {
  const { user, loading } = useCurrentUser();

  const loginUrl = `/login?next=${encodeURIComponent(href)}`;
  const destination = user ? href : loginUrl;

  return (
    <Link
  href={destination}
  aria-disabled={loading}
  className={className}
  onClick={(event) => {
    if (loading) {
      event.preventDefault();
    }
  }}
>
  {children}
</Link>
  );
}