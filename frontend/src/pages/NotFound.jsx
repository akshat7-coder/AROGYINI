import { Link } from "react-router";
import { Compass } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

export default function NotFound() {
  return (
    <div className="app-bg grid place-items-center px-4">
      <div className="glass w-full max-w-md">
        <EmptyState
          icon={Compass}
          title="Page not found"
          description="That link does not go anywhere. It may have moved, or never existed."
          action={
            <Link to="/">
              <Button>Back to start</Button>
            </Link>
          }
        />
      </div>
    </div>
  );
}
