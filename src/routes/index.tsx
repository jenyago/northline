import { createFileRoute } from "@tanstack/react-router";
import { NorthlineApp } from "@/components/northline-app";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <NorthlineApp />;
}
