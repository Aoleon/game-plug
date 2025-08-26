import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-cosmic-void/50 border border-aged-gold/20",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
