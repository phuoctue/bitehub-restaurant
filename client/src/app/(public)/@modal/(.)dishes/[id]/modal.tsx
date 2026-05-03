"use client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

import React, { useState } from "react";

export default function Modal({ children }: { children: React.ReactElement }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) router.back();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-auto p-0 sm:max-w-3xl">
        <DialogTitle className="sr-only">Dish details</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}
