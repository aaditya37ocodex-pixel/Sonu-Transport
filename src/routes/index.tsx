import { createFileRoute } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Dashboard } from "@/components/sonu/dashboard";

export const Route = createFileRoute("/")({ component: Home });

/** The whole site is private: only a signed-in owner reaches the dashboard. */
function Home() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <div className="loading-state" style={{ minHeight: "100vh" }}>
        <div className="spinner" />
        <p>Checking your sign-in…</p>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  return <Dashboard />;
}
