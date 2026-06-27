"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { Logo } from "@/components/shared/logo";
import { NavItems } from "./nav-items";

export function SidebarInterno({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-brand-900 to-brand-950">
      <div className="flex items-center px-4 py-5">
        <Logo chip height={50} />
      </div>
      <NavItems onNavigate={onNavigate} />
      <div className="mt-auto border-t border-white/10 p-3">
        <div className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2">
          <OrganizationSwitcher
            hidePersonal
            afterCreateOrganizationUrl="/dashboard"
            afterSelectOrganizationUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "flex",
                organizationSwitcherTrigger:
                  "text-white/90 hover:bg-white/10 rounded-lg px-1.5 py-1 gap-1.5",
                organizationPreviewMainIdentifier: "text-white text-sm",
                organizationSwitcherTriggerIcon: "text-white/60",
              },
            }}
          />
          <UserButton />
        </div>
      </div>
    </div>
  );
}
