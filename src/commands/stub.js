import { emit, HOME } from "../io.js";

/** Commands that need the ElectricBlaze API. They ship in 0.2. Exit 2 = needs something that does not exist yet. */
export function stub(cmd, { flags }) {
  const data = {
    ok: false, command: cmd, status: "not_available_yet",
    message: `"${cmd}" needs the ElectricBlaze API and ships in 0.2. Everything else works in demo mode today.`,
    next: `Keep the demo feed for now; read ${HOME} for the API status.`,
  };
  emit(flags, data, `✗ "${cmd}" needs the ElectricBlaze API and ships in 0.2.\n  Everything else works in demo mode today.\n→ ${data.next}`);
  return 2;
}
