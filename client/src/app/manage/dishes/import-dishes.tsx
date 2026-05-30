"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { downloadDishTemplate } from "@/lib/excel-template";
import { handleErrorApi } from "@/lib/utils";
import { useImportDishMutation } from "@/queries/useDish";
import { Download, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function ImportDishes() {
  const t = useTranslations("ManageDishes");
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importDishMutation = useImportDishMutation();

  const reset = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImport = async () => {
    if (importDishMutation.isPending) return;

    if (!file) {
      toast.error(t("chooseFile"));
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await importDishMutation.mutateAsync(formData);
      const summary = result.payload.data;
      if (summary.successRows > 0) {
        toast.success(result.payload.message || t("importSuccess"));
      }
      if (summary.failedRows > 0) {
        // show each failure message
        summary.failures.forEach((f: { rowNumber: number; message: string }) => {
          toast.error(`${t("importDish")} - ${f.rowNumber}: ${f.message}`);
        });
      }
      reset();
      setOpen(false);
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  const handleDownloadTemplate = () => {
    try {
      downloadDishTemplate();
      toast.success(t("downloadTemplateSuccess"));
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1">
          <Upload className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">{t("importDish")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px] max-h-screen overflow-auto">
        <DialogHeader>
          <DialogTitle>{t("importDishTitle")}</DialogTitle>
          <DialogDescription>{t("importDishDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Input
              ref={fileInputRef}
              accept=".xlsx,.xls"
              type="file"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] ?? null;
                setFile(selectedFile);
              }}
            />
            <p className="text-xs text-muted-foreground">{t("importDishHint")}</p>
            {file ? <p className="text-sm text-muted-foreground">{file.name}</p> : null}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4" />
            {t("downloadTemplate")}
          </Button>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button type="button" onClick={handleImport} disabled={importDishMutation.isPending}>
            {importDishMutation.isPending ? t("saving") : t("importDish")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
