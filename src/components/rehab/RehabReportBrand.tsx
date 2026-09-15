import Image from "next/image";
import type { RehabWorkspace } from "@/lib/rehab/types";
import { reportLogoUrl } from "@/lib/rehab/branding";

export function RehabReportBrand({ workspace }: {
  workspace: Pick<RehabWorkspace, "id" | "name" | "kind" | "logo_path">;
}) {
  const src = reportLogoUrl(workspace);
  return <div className="break-inside-avoid">
    {src && <Image src={src} alt={workspace.name} width={200} height={88}
      unoptimized loading="eager" className="mb-3 h-22 w-50 object-contain object-left" />}
    <p className="text-lg font-semibold text-navy">{workspace.name}</p>
  </div>;
}
