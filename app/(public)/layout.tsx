import SidebarAds from "@/components/shared/SidebarAds";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex max-w-[1400px] mx-auto">
        <aside className="w-[220px] shrink-0 hidden xl:flex flex-col gap-3 p-4 sticky top-0 h-screen overflow-y-auto border-r border-gray-100">
          <SidebarAds side="left" />
        </aside>

        <main className="flex-1 min-w-0 bg-white border-x border-gray-100 min-h-screen">
          {children}
        </main>

        <aside className="w-[220px] shrink-0 hidden xl:flex flex-col gap-3 p-4 sticky top-0 h-screen overflow-y-auto border-l border-gray-100">
          <SidebarAds side="right" />
        </aside>
      </div>
    </div>
  );
}
