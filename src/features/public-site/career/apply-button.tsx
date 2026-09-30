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
      className="flex h-[46px] w-full items-center justify-center rounded-full bg-mkt-accent text-[14.5px] font-semibold text-white hover:bg-mkt-accent-hover"
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