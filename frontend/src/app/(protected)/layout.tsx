"use client";

import TanstackProvider from "@/providers/tanstack.provider";
import AuthProvider from "@/providers/auth.provider";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TanstackProvider>
        <AuthProvider>{children}</AuthProvider>
      </TanstackProvider>
    </>
  );
}
