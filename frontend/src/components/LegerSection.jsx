import { useState } from "react";
import { downloadFile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { FileSpreadsheet, Download, Loader2, CheckCircle2 } from "lucide-react";

export default function LegerSection({ kelas, walas }) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      await downloadFile(`/leger/excel/${kelas}`, `Leger_Nilai_${kelas}.xlsx`);
      toast.success("Leger nilai berhasil diunduh.");
    } catch (e) {
      toast.error("Gagal mengunduh leger nilai.");
    } finally {
      setBusy(false);
    }
  };

  const points = [
    "Berisi seluruh nilai Formatif (F1-F3) dan Sumatif (S1-S3) dari semua mata pelajaran",
    "Satu baris untuk setiap siswa di kelas",
    "Format Excel (.xlsx) siap dibuka di Microsoft Excel atau Google Sheets",
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-8 text-center">
        <div className="inline-flex h-16 w-16 rounded-2xl bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 items-center justify-center mb-5">
          <FileSpreadsheet className="h-8 w-8" />
        </div>
        <h3 className="font-display text-2xl font-bold text-foreground">Leger Nilai Kelas {kelas}</h3>
        <p className="text-muted-foreground mt-2">Wali Kelas: {walas}</p>

        <div className="mt-6 text-left space-y-2.5 bg-secondary/50 rounded-xl p-5">
          {points.map((p) => (
            <div key={p} className="flex items-start gap-2.5 text-sm text-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
              <span>{p}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={download}
          disabled={busy}
          className="w-full mt-6 h-12 text-base gap-2"
          data-testid="download-leger-excel-button"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
          Unduh Leger Nilai (Excel)
        </Button>
      </Card>
    </div>
  );
}
