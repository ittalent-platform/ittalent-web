import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ForbiddenStateProps = {
  actionLabel?: string;
  actionTo?: string;
  description?: string;
  title?: string;
};

export function ForbiddenState({
  actionLabel = "Go back to dashboard",
  actionTo = "/admin",
  description = "You do not have permission to access this page.",
  title = "Access restricted",
}: ForbiddenStateProps) {
  return (
    <Card className="max-w-xl border-amber-200 bg-amber-50/60">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline">
          <Link to={actionTo}>{actionLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
