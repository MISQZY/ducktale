import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

export interface SearchInputProps extends React.ComponentProps<typeof Input> {
  wrapperClassName?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, wrapperClassName, style, ...props }, ref) => {
    return (
      <div className={cn("relative w-full", wrapperClassName)}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/45 pointer-events-none" />
        <Input
          type="text"
          ref={ref}
          className={cn("w-full", className)}
          style={{ paddingLeft: "2.5rem", ...style }}
          {...props}
        />
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }
