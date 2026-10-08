"use client";

import TanstackProvider from "@/providers/tanstack.provider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TanstackProvider>{children}</TanstackProvider>
    </>
  );
}
