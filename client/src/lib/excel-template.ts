import * as XLSX from "xlsx";

type TemplateSheet = {
  fileName: string;
  sheetName: string;
  headers: string[];
  sampleRows: Array<Array<string | number>>;
};

const downloadTemplate = ({ fileName, sheetName, headers, sampleRows }: TemplateSheet) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
};

export const downloadDishTemplate = () => {
  downloadTemplate({
    fileName: "dish-import-template.xlsx",
    sheetName: "Dishes",
    headers: ["name", "price", "description", "image", "status"],
    sampleRows: [["Cơm gà mẫu", 45000, "Món ăn mẫu", "https://example.com/dish.jpg", "Available"]],
  });
};

export const downloadTableTemplate = () => {
  downloadTemplate({
    fileName: "table-import-template.xlsx",
    sheetName: "Tables",
    headers: ["number", "capacity", "status"],
    sampleRows: [[1, 4, "Available"]],
  });
};