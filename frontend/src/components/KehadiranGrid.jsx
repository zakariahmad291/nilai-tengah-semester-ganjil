import { useEffect, useState, useCallback, useRef } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CATATAN_TEMPLATES } from "@/lib/catatanTemplates";
import { Loader2, CheckCircle2, AlertCircle, Info, MessageSquarePlus } from "lucide-react";

const clampInt = (v) => {
  const n = parseInt(String(v).replace(/[^0-9]/g, ""), 10);
  return isNaN(n) ? 0 : n;
};

export default function KehadiranGrid({ kelas }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("idle");
  const timer = useRef(null);
  const rowsRef = useRef([]);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/kehadiran/kelas/${kelas}`)
      .then((r) =>
        setRows(
          r.data.map((d) => ({
            ...d,
            sakit: d.sakit ?? 0,
            izin: d.izin ?? 0,
            alfa: d.alfa ?? 0,
            catatan: d.catatan ?? "",
          }))
        )
      )
      .finally(() => setLoading(false));
  }, [kelas]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const doSave = useCallback(async () => {
    setStatus("saving");
    try {
      const items = rowsRef.current.map((r) => ({
        siswa_id: r.siswa_id,
        sakit: Number(r.sakit) || 0,
        izin: Number(r.izin) || 0,
        alfa: Number(r.alfa) || 0,
        catatan: r.catatan || "",
      }));
      await api.post("/kehadiran/bulk", { kelas, items });
      setStatus("saved");
    } catch (e) {
      setStatus("error");
      toast.error("Gagal menyimpan kehadiran.");
    }
  }, [kelas]);

  const schedule = useCallback(() => {
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(doSave, 900);
  }, [doSave]);

  const setCell = (i, key, val) => {
    setRows((prev) => {
      const n = [...prev];
      n[i] = { ...n[i], [key]: val };
      return n;
    });
    schedule();
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Memuat data kehadiran...
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
          <span>
            Isi ketidakhadiran (jumlah hari) dan catatan untuk <b>semua siswa sekaligus</b>. Perubahan
            tersimpan otomatis dan akan tercetak di raport. Gunakan ikon template untuk catatan cepat.
          </span>
        </div>
        <div
          className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-secondary shrink-0"
          data-testid="kehadiran-autosave-status"
        >
          {status === "saving" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-muted-foreground">Menyimpan...</span>
            </>
          ) : status === "error" ? (
            <>
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-600">Gagal menyimpan</span>
            </>
          ) : status === "saved" ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Tersimpan</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Tersimpan otomatis</span>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
          <table className="w-full border-collapse text-sm" data-testid="kehadiran-grid-table">
            <thead className="sticky top-0 z-10">
              <tr className="bg-primary text-primary-foreground">
                <th className="px-3 py-2.5 text-left font-semibold w-10">No</th>
                <th className="px-3 py-2.5 text-left font-semibold min-w-[200px]">Nama Siswa</th>
                <th className="px-2 py-2.5 text-center font-semibold w-20 border-l border-blue-400">
                  Sakit
                </th>
                <th className="px-2 py-2.5 text-center font-semibold w-20">Izin</th>
                <th className="px-2 py-2.5 text-center font-semibold w-20">Alfa</th>
                <th className="px-3 py-2.5 text-left font-semibold min-w-[300px] border-l border-blue-400">
                  Catatan Wali Kelas
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.siswa_id} className="even:bg-secondary/40 hover:bg-primary/5 transition-colors">
                  <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-1.5 font-medium whitespace-nowrap">{row.nama}</td>
                  {["sakit", "izin", "alfa"].map((k, ki) => (
                    <td key={k} className={`p-0 border-l border-border`}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={row[k]}
                        data-testid={`keh-${k}-row-${i}`}
                        onChange={(e) => setCell(i, k, clampInt(e.target.value))}
                        className="w-full h-9 bg-transparent px-1 text-center outline-none focus:ring-2 focus:ring-inset focus:ring-primary font-mono tabular-nums"
                      />
                    </td>
                  ))}
                  <td className="p-1 border-l border-border">
                    <div className="flex items-center gap-1">
                      <Input
                        value={row.catatan}
                        data-testid={`keh-catatan-row-${i}`}
                        onChange={(e) => setCell(i, "catatan", e.target.value)}
                        placeholder="Catatan untuk siswa..."
                        className="h-8 text-sm"
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            data-testid={`keh-template-btn-${i}`}
                            title="Pilih template catatan"
                          >
                            <MessageSquarePlus className="h-4 w-4 text-primary" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                          <DropdownMenuLabel>Template Catatan</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {CATATAN_TEMPLATES.map((t, ti) => (
                            <DropdownMenuItem
                              key={ti}
                              onClick={() => setCell(i, "catatan", t)}
                              className="text-xs whitespace-normal leading-snug"
                            >
                              {t}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
