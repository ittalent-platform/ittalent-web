import { useToast } from "@/components/toast/toast-provider";

type ApplyButtonProps = {
  companyName?: string;
  deadline?: string;
  jobTitle?: string;
  slug: string;
};

export function ApplyButton({ jobTitle }: ApplyButtonProps) {
  const { showToast } = useToast();

  return (
    <button
      type="button"
      className="mb-3 h-12 w-full rounded-full bg-[var(--primary)] text-[15px] font-semibold text-white"
      onClick={() =>
        showToast({
          message: jobTitle
            ? `Applying for "${jobTitle}" is not available yet.`
            : "Applying is not available yet.",
          title: "Coming soon",
          tone: "warning",
        })
      }
    >
      Apply now
    </button>
  );
}
