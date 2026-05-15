import { cn } from "@/lib/utils";

type SpinnerProps = {
  className?: string;
  label?: string;
};

export default function Spinner({
  className,
  label = "Loading content",
}: SpinnerProps) {
  return (
    <span
      aria-label={label}
      role="status"
      className={cn(
        "inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary",
        className,
      )}
    />
  );
}
