import { cn } from "@/lib/utils";

export interface BentoItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  status?: string;
  tags?: string[];
  meta?: string;
  cta?: string;
  colSpan?: number;
  hasPersistentHover?: boolean;
  onClick?: () => void;
}

interface BentoGridProps {
  items: BentoItem[];
  className?: string;
}

function BentoGrid({ items, className }: BentoGridProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-3", className)}>
      {items.map((item, index) => (
        <div
          key={index}
          onClick={item.onClick}
          className={cn(
            "group relative p-4 rounded-xl overflow-hidden transition-all duration-200",
            "border border-gray-100 bg-white",
            "hover:shadow-[0_8px_32px_rgba(249,115,22,0.18),0_2px_12px_rgba(0,0,0,0.08)]",
            "hover:-translate-y-1 hover:scale-[1.025] will-change-transform",
            "hover:border-orange-300",
            item.onClick ? "cursor-pointer" : "",
            item.colSpan === 2 ? "md:col-span-2" : "col-span-1",
            item.hasPersistentHover &&
              "shadow-[0_8px_32px_rgba(249,115,22,0.18),0_2px_12px_rgba(0,0,0,0.08)] -translate-y-1 scale-[1.025] border-orange-300"
          )}
        >
          {/* Orange glow top bar on hover */}
          <div
            className={cn(
              "absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 transition-opacity duration-200 pointer-events-none",
              item.hasPersistentHover ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          />

          {/* Dot-grid overlay on hover */}
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-200 pointer-events-none",
              item.hasPersistentHover
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.04)_1px,transparent_1px)] bg-[length:4px_4px]" />
          </div>

          <div className="relative flex flex-col space-y-3">
            {/* Icon + status */}
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 group-hover:bg-orange-100 group-hover:shadow-[0_0_10px_rgba(249,115,22,0.3)] transition-all duration-200">
                {item.icon}
              </div>
              {item.status && (
                <span className="text-xs font-medium px-2 py-1 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-orange-100 group-hover:text-orange-700 transition-colors duration-300">
                  {item.status}
                </span>
              )}
            </div>

            {/* Title + description */}
            <div className="space-y-1.5">
              <h3 className="font-semibold text-gray-900 tracking-tight text-[15px] leading-snug">
                {item.title}
                {item.meta && (
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    {item.meta}
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500 leading-snug">{item.description}</p>
            </div>

            {/* Tags + CTA */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center flex-wrap gap-1.5 text-xs text-gray-400">
                {item.tags?.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-gray-100 transition-all duration-200 group-hover:bg-orange-50 group-hover:text-orange-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span className="text-xs text-orange-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ml-2">
                {item.cta || "Open →"}
              </span>
            </div>
          </div>

          {/* Gradient border shine */}
          <div
            className={cn(
              "absolute inset-0 -z-10 rounded-xl p-px bg-gradient-to-br from-transparent via-orange-100/40 to-transparent transition-opacity duration-300 pointer-events-none",
              item.hasPersistentHover
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            )}
          />
        </div>
      ))}
    </div>
  );
}

export { BentoGrid };
