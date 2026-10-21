import { Clock, History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployeeHistoryQuery } from "./employees.queries";
import type { Employee } from "./employees.types";

type EmployeeHistoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
};

export function EmployeeHistoryDialog({
  open,
  onOpenChange,
  employee,
}: EmployeeHistoryDialogProps) {
  const { data, isLoading } = useEmployeeHistoryQuery(employee?.id ?? "", open);

  if (!employee) return null;

  const historyItems = data?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <History className="size-5" />
          </div>
          <DialogTitle className="text-xl">
            Employee account history
          </DialogTitle>
          <DialogDescription>
            Audit log of all changes made to{" "}
            {employee.fullName || employee.username}’s account.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-1 py-2">
          {isLoading ? (
            <div className="space-y-4 py-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : historyItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Clock className="mx-auto mb-2 size-6 text-muted-foreground/60" />
              No recorded history events found for this account.
            </div>
          ) : (
            <div className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border space-y-6">
              {historyItems.map((item, index) => (
                <div key={item.id || index} className="relative group">
                  <span className="absolute -left-6 top-1 flex size-4 items-center justify-center rounded-full border-2 border-background bg-primary ring-4 ring-background" />
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3 transition hover:border-border hover:bg-muted/50">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-foreground capitalize">
                        {item.action.replace(/_/g, " ")}
                      </span>
                      <time className="text-muted-foreground">
                        {item.timestamp
                          ? new Date(item.timestamp).toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </time>
                    </div>

                    {item.description ? (
                      <p className="mt-1.5 text-xs text-foreground/80">
                        {item.description}
                      </p>
                    ) : null}

                    {item.actorName ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Performed by: {item.actorName}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
