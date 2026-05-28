import SidebarAds from "@/components/shared/SidebarAds";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-2 px-0 xl:flex-row xl:px-2">
        <aside className="hidden h-screen w-[220px] shrink-0 overflow-y-auto border-r border-cyan-400/30 bg-black xl:sticky xl:top-0 xl:block">
          <SidebarAds side="left" />
        </aside>

        <aside className="fixed inset-x-0 top-0 z-[60] border-b border-white/10 bg-black/95 py-2 shadow-sm backdrop-blur xl:hidden">
          <SidebarAds side="left" placement="mobile" />
        </aside>

        <main className="min-h-screen min-w-0 flex-1 bg-black pb-[66px] pt-[58px] xl:pb-0 xl:pt-0">
          {children}
        </main>

        <aside className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-black/95 py-2 shadow-sm backdrop-blur xl:hidden">
          <SidebarAds side="right" placement="mobile" />
        </aside>

        <aside className="hidden h-screen w-[220px] shrink-0 overflow-y-auto border-l border-cyan-400/30 bg-black xl:sticky xl:top-0 xl:block">
          <SidebarAds side="right" showAdvertiseCta />
        </aside>
      </div>
    </div>
  );
}
