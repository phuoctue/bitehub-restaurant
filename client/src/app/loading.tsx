import Spinner from "@/components/loaders/spinner";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Spinner className="h-10 w-10 border-[4px]" />
        <p className="text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}
