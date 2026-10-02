import { useEffect, useState, useCallback, useRef } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ClipboardPaste, Loader2, Info, CheckCircle2, AlertCircle } from "lucide-react";

const COLS = ["f1", "f2", "f3", "s1", "s2", "s3"];
const LABELS = { f1: "F1", f2: "F2", f3: "F3", s1: "S1", s2: "S2", s3: "S3" };

function clampVal(raw) {
  if (raw === "" || raw === null || raw === undefined) return "";
  let s = String(raw).replace(",", ".").replace(/[^0-9.]/g, "");
  if (s === "") return "";
  let n = parseFloat(s);
  if (isNaN(n)) return "";
  if (n > 100) n = 100;
  if (n < 0) n = 0;
  return String(n);
}

export default function GradeGrid({ kelas, mapel }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("idle");
  const saveTimer = useRef(null);
  const rowsRef = useRef([]);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/nilai?kelas=${kelas}&mapel=${encodeURIComponent(mapel)}`)
      .then((r) =>
        setRows(
          r.data.map((d) => ({
            ...d,
            f1: d.f1 ?? "",
            f2: d.f2 ?? "",
            f3: d.f3 ?? "",
            s1: d.s1 ?? "",
            s2: d.s2 ?? "",
            s3: d.s3 ?? "",
          }))
        )
      )
      .finally(() => setLoading(false));
  }, [kelas, mapel]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const buildItems = (data) =>
    data.map((r) => ({
      siswa_id: r.siswa_id,
      f1: r.f1 === "" ? null : Number(r.f1),
      f2: r.f2 === "" ? null : Number(r.f2),
      f3: r.f3 === "" ? null : Number(r.f3),
      s1: r.s1 === "" ? null : Number(r.s1),
      s2: r.s2 === "" ? null : Number(r.s2),
      s3: r.s3 === "" ? null : Number(r.s3),
    }));

  const doSave = useCallback(async () => {
    setStatus("saving");
    try {
      await api.post("/nilai/bulk", { kelas, mapel, items: buildItems(rowsRef.current) });
      setStatus("saved");
    } catch (e) {
      setStatus("error");
      toast.error("Gagal menyimpan nilai.");
    }
  }, [kelas, mapel]);

  const scheduleSave = useCallback(() => {
    setStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(doSave, 900);
  }, [doSave]);

  const setCell = (rowIdx, col, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[rowIdx] = { ...next[rowIdx], [col]: value };
      return next;
    });
    scheduleSave();
  };

  const handlePaste = (e, rowIdx, colIdx) => {
    const text = e.clipboardData.getData("text");
    if (!text || (!text.includes("\t") && !text.includes("\n"))) return; // single value, let default
    e.preventDefault();
    const lines = text.replace(/\r/g, "").split("\n").filter((l, i, arr) => l !== "" || i < arr.length - 1);
    setRows((prev) => {
      const next = prev.map((r) => ({ ...r }));
      lines.forEach((line, li) => {
        const cells = line.split("\t");
        const r = rowIdx + li;
        if (r >= next.length) return;
        cells.forEach((cell, ci) => {
          const c = colIdx + ci;
          if (c >= COLS.length) return;
          next[r][COLS[c]] = clampVal(cell.trim());
        });
      });
      return next;
    });
    toast.success(`${lines.length} baris ditempel ke tabel.`);
    scheduleSave();
  };

  const applyPasteModal = () => {
    const text = pasteText;
    if (!text.trim()) {
      toast.error("Tidak ada data untuk ditempel.");
      return;
    }
    const lines = text.replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean);
    setRows((prev) => {
      const next = prev.map((r) => ({ ...r }));
      lines.forEach((line, li) => {
        if (li >= next.length) return;
        let cells = line.split(/\t|;|,|\s{2,}/).map((c) => c.trim());
        // If first token is non-numeric (a name), drop it
        if (cells.length > 6 && isNaN(parseFloat(cells[0].replace(",", ".")))) cells = cells.slice(1);
        cells.slice(0, 6).forEach((cell, ci) => {
          next[li][COLS[ci]] = clampVal(cell);
        });
      });
      return next;
    });
    toast.success(`${Math.min(lines.length, rows.length)} baris berhasil ditempel.`);
    setPasteOpen(false);
    setPasteText("");
    scheduleSave();
  };

  const cellClass = (v) => {
    if (v === "" || v === null) return "";
    return Number(v) >= 75 ? "bg-green-50 dark:bg-green-950/40" : "bg-red-50 dark:bg-red-950/40";
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Memuat data siswa...
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
          <span>
            Salin nilai dari Excel lalu <b>tempel langsung</b> ke dalam sel tabel (klik sel awal, tekan
            Ctrl+V). Nilai &ge; 75 ditandai hijau, &lt; 75 merah. KKTP = 75.
          </span>
        </div>
        <div className="flex gap-2 shrink-0">
          <Dialog open={pasteOpen} onOpenChange={setPasteOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="paste-excel-modal-button">
                <ClipboardPaste className="h-4 w-4" /> Tempel dari Excel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Tempel Nilai dari Excel / Word</DialogTitle>
                <DialogDescription>
                  Salin kolom nilai dari aplikasi lain (urutan: F1, F2, F3, S1, S2, S3), lalu tempel di
                  bawah. Setiap baris mengikuti urutan siswa pada tabel. Kolom nama (jika ada) otomatis
                  diabaikan.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                data-testid="paste-excel-textarea"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={"80\t85\t90\t75\t88\t92\n78\t80\t85\t70\t82\t90"}
                className="min-h-[180px] font-mono text-sm"
              />
              <DialogFooter>
                <Button variant="ghost" onClick={() => setPasteOpen(false)}>
                  Batal
                </Button>
                <Button onClick={applyPasteModal} data-testid="apply-paste-data-button">
                  Terapkan ke Tabel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div
            className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-secondary"
            data-testid="autosave-status"
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
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
          <table className="w-full border-collapse text-sm" data-testid="grade-grid-table">
            <thead className="sticky top-0 z-10">
              <tr className="bg-primary text-primary-foreground">
                <th rowSpan={2} className="px-3 py-2 text-left font-semibold sticky left-0 bg-primary w-10">
                  No
                </th>
                <th rowSpan={2} className="px-3 py-2 text-left font-semibold sticky left-10 bg-primary min-w-[200px]">
                  Nama Siswa
                </th>
                <th colSpan={3} className="px-3 py-1.5 text-center font-semibold border-l border-blue-400">
                  Formatif
                </th>
                <th colSpan={3} className="px-3 py-1.5 text-center font-semibold border-l border-blue-400">
                  Sumatif
                </th>
              </tr>
              <tr className="bg-blue-600 text-white">
                {COLS.map((c, i) => (
                  <th
                    key={c}
                    className={`px-2 py-1.5 text-center font-medium w-20 ${i === 0 || i === 3 ? "border-l border-blue-400" : ""}`}
                  >
                    {LABELS[c]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={row.siswa_id} className="even:bg-secondary/40 hover:bg-primary/5 transition-colors">
                  <td className="px-3 py-1.5 text-muted-foreground sticky left-0 bg-inherit">{ri + 1}</td>
                  <td className="px-3 py-1.5 font-medium sticky left-10 bg-inherit whitespace-nowrap">
                    {row.nama}
                  </td>
                  {COLS.map((c, ci) => (
                    <td key={c} className={`grade-cell p-0 border-l border-border ${cellClass(row[c])}`}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row[c]}
                        data-testid={`grade-cell-${c}-row-${ri}`}
                        onChange={(e) => setCell(ri, c, clampVal(e.target.value))}
                        onPaste={(e) => handlePaste(e, ri, ci)}
                        className="w-full h-9 bg-transparent px-1 text-center outline-none focus:ring-2 focus:ring-inset focus:ring-primary font-mono tabular-nums"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
