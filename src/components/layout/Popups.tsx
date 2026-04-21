"use client";

import dynamic from "next/dynamic";

const LeadCapturePopup = dynamic(
  () => import("@/components/sections/LeadCapturePopup"),
  { ssr: false, loading: () => null }
);

const ExitIntentPopup = dynamic(
  () => import("@/components/sections/ExitIntentPopup"),
  { ssr: false, loading: () => null }
);

export default function Popups() {
  return (
    <>
      <LeadCapturePopup />
      <ExitIntentPopup />
    </>
  );
}
