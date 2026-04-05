import React from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export default function Quantity({
  onChange,
  value,
}: {
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7 rounded-full"
        disabled={value < 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus className="w-3 h-3" />
      </Button>
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        readOnly
        value={value}
        onChange={(e) => {
          let value = e.target.value;
          const numberValue = Number(value);
          if (isNaN(numberValue)) {
            return;
          }
          onChange(numberValue);
        }}
        className="h-7 w-8 p-0 text-center text-xs border-none focus-visible:ring-0"
      />
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7 rounded-full"
        onClick={() => onChange(value + 1)}
      >
        <Plus className="w-3 h-3" />
      </Button>
    </>
  );
}
