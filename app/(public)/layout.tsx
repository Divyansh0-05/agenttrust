import SidebarAds from "@/components/shared/SidebarAds";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex max-w-[1400px] flex-col xl:flex-row">
        <aside className="hidden h-screen w-[220px] shrink-0 flex-col gap-3 overflow-y-auto border-r border-gray-100 p-4 xl:sticky xl:top-0 xl:flex">
          <SidebarAds side="left" />
        </aside>

        <aside className="fixed inset-x-0 top-0 z-[60] border-b border-gray-200/80 bg-white/95 py-2 shadow-sm backdrop-blur xl:hidden">
          <SidebarAds side="left" placement="mobile" />
        </aside>

        <main className="min-h-screen min-w-0 flex-1 border-x border-gray-100 bg-white pb-[66px] pt-[58px] xl:pb-0 xl:pt-0">
          {children}
        </main>

        <aside className="fixed inset-x-0 bottom-0 z-[60] border-t border-gray-200/80 bg-white/95 py-2 shadow-sm backdrop-blur xl:hidden">
          <SidebarAds side="right" placement="mobile" />
        </aside>

        <aside className="hidden h-screen w-[220px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-gray-100 p-4 xl:sticky xl:top-0 xl:flex">
          <SidebarAds side="right" showAdvertiseCta />
        </aside>
      </div>
    </div>
  );
}
