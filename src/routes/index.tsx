import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold">RUMO</h1>
    </main>
  );
}
