import CommandPalette from "./CommandPalette";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CommandPalette />
      <div className="fixed bottom-4 right-4 z-40 chip text-zinc-500 pointer-events-none select-none">
        ⌘K to search
      </div>
    </>
  );
}
