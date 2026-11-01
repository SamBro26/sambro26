// migrate-helper — empty placeholder endpoint.
// Intentionally does nothing: reads nothing, writes nothing.
// Fill it in later with the migration steps you want to run.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/migrate-helper")({
  server: {
    handlers: {
      GET: async () => Response.json({ ok: true, function: "migrate-helper", steps: [] }),
    },
  },
});
