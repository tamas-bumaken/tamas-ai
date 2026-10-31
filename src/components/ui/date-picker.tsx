"use client"

import * as React from "react"
import { format, type Locale } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  displayFormat = "dd MMM yyyy",
  locale,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "value" | "onChange"> & {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  displayFormat?: string
  // Month and day names in the trigger and the calendar.
  locale?: Locale
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          data-slot="date-picker"
          className={cn(
            "justify-start font-normal",
            !value && "text-muted-foreground",
            className
          )}
          {...props}
        >
          <CalendarIcon />
          {value ? format(value, displayFormat, { locale }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={locale}
          selected={value}
          defaultMonth={value}
          onSelect={(date) => {
            onChange(date)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
