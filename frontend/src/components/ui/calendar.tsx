"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  ...props
}: CalendarProps) {
  const defaultClassNames = {
    months: "relative flex flex-col sm:flex-row gap-4",
    month: "w-full",
    month_caption: "relative mx-10 mb-1 flex h-9 items-center justify-center z-20",
    caption_label: "text-sm font-medium",
    nav: "absolute top-0 flex w-full justify-between z-10",
    button_previous: cn(buttonVariants({ variant: "ghost" }), "size-9 p-0 opacity-60 hover:opacity-100"),
    button_next:     cn(buttonVariants({ variant: "ghost" }), "size-9 p-0 opacity-60 hover:opacity-100"),
    weekday: "size-9 p-0 text-xs font-medium text-gray-400",
    day_button:
      "relative flex size-9 items-center justify-center rounded-lg p-0 text-sm outline-none " +
      "hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-orange-500 " +
      "group-data-[selected]:bg-orange-500 group-data-[selected]:text-white " +
      "group-data-[disabled]:opacity-30 group-data-[outside]:opacity-30",
    day: "group size-9 px-0 text-sm",
    range_start: "range-start",
    range_end: "range-end",
    range_middle: "range-middle",
    today: "font-bold text-orange-500",
    outside: "opacity-30",
    hidden: "invisible",
    week_number: "size-9 p-0 text-xs font-medium text-gray-400",
  };

  const mergedClassNames = Object.keys(defaultClassNames).reduce(
    (acc, key) => ({
      ...acc,
      [key]: classNames?.[key as keyof typeof classNames]
        ? cn(defaultClassNames[key as keyof typeof defaultClassNames], classNames[key as keyof typeof classNames])
        : defaultClassNames[key as keyof typeof defaultClassNames],
    }),
    {} as typeof defaultClassNames,
  );

  const defaultComponents = {
    Chevron: (props: { orientation?: string } & React.SVGProps<SVGSVGElement>) => {
      if (props.orientation === "left") return <ChevronLeft size={16} strokeWidth={2} aria-hidden />;
      return <ChevronRight size={16} strokeWidth={2} aria-hidden />;
    },
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-fit", className)}
      classNames={mergedClassNames}
      components={{ ...defaultComponents, ...userComponents }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
