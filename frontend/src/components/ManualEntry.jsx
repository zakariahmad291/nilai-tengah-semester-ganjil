import { useEffect, useState, useCallback, useRef } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, User, CheckCircle2, AlertCircle } from "lucide-react";

const FORMATIF = [
  { key: "f1", label: "Formatif 1" },
  { key: "f2", label: "Formatif 2" },
  { key: "f3", label: "Formatif 3" },
];
const SUMATIF = [
  { key: "s1", label: "Sumatif 1" },
  { key: "s2", label: "Sumatif 2" },
  { key: "s3", label: "Sumatif 3" },
];

function clampVal(raw) {
  if (raw === "") return "";
  let s = String(raw).replace(",", ".").replace(/[^0-9.]/g, "");
  if (s === "") return "";
  let n = parseFloat(s);
  if (isNaN(n)) return "";
  if (n > 100) n = 100;
  if (n < 0) n = 0;
  return String(n);
}

export default function ManualEntry({ kelas, mapel }) {
  const [rows, setRows] = useState([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("idle");
  const saveTimer = useRef(null);
  const currentRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/nilai?kelas=${kelas}&mapel=${encodeURIComponent(mapel)}`)
      .then((r) => {
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
        );
        setIdx(0);
      })
      .finally(() => setLoading(false));
  }, [kelas, mapel]);

  useEffect(() => {
    load();
  }, [load]);

  const current = rows[idx];
  currentRef.current = current;

  const setField = (key, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
    scheduleSave();
  };

  const saveStudent = useCallback(
    async (r) => {
      if (!r) return;
      setStatus("saving");
      try {
        await api.post("/nilai/bulk", {
          kelas,
          mapel,
          items: [
            {
              siswa_id: r.siswa_id,
              f1: r.f1 === "" ? null : Number(r.f1),
              f2: r.f2 === "" ? null : Number(r.f2),
              f3: r.f3 === "" ? null : Number(r.f3),
              s1: r.s1 === "" ? null : Number(r.s1),
              s2: r.s2 === "" ? null : Number(r.s2),
              s3: r.s3 === "" ? null : Number(r.s3),
            },
          ],
        });
        setStatus("saved");
      } catch (e) {
        setStatus("error");
        toast.error("Gagal menyimpan nilai.");
      }
    },
    [kelas, mapel]
  );

  const scheduleSave = useCallback(() => {
    setStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveStudent(currentRef.current), 800);
  }, [saveStudent]);

  const goNext = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await saveStudent(currentRef.current);
    if (idx < rows.length - 1) setIdx(idx + 1);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Memuat data siswa...
      </div>
    );
  if (!current) return null;

  const renderField = (f) => {
    const v = current[f.key];
    const ok = v !== "" && Number(v) >= 75;
    const bad = v !== "" && Number(v) < 75;
    return (
      <div key={f.key} className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">{f.label}</label>
        <Input
          type="text"
          inputMode="decimal"
          value={v}
          data-testid={`manual-input-${f.key}`}
          onChange={(e) => setField(f.key, clampVal(e.target.value))}
          placeholder="0 - 100"
          className={`h-12 text-lg text-center font-mono tabular-nums ${
            ok ? "border-green-500 text-green-700 dark:text-green-400" : ""
          } ${bad ? "border-red-500 text-red-600 dark:text-red-400" : ""}`}
        />
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Student selector */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          data-testid="manual-prev-button"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Select value={String(idx)} onValueChange={(v) => setIdx(Number(v))}>
          <SelectTrigger className="flex-1 h-11" data-testid="manual-student-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {rows.map((r, i) => (
              <SelectItem key={r.siswa_id} value={String(i)}>
                {i + 1}. {r.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIdx((i) => Math.min(rows.length - 1, i + 1))}
          disabled={idx === rows.length - 1}
          data-testid="manual-next-button"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Card className="p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3 pb-5 mb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display font-bold text-lg text-foreground" data-testid="manual-current-name">
                {current.nama}
              </p>
              <p className="text-sm text-muted-foreground">
                NISN {current.nisn} &middot; Siswa ke-{idx + 1} dari {rows.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm" data-testid="manual-autosave-status">
            {status === "saving" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-muted-foreground hidden sm:inline">Menyimpan...</span>
              </>
            ) : status === "error" ? (
              <>
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-red-600 hidden sm:inline">Gagal</span>
              </>
            ) : status === "saved" ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground hidden sm:inline">Tersimpan</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wide text-primary mb-3">
              Nilai Formatif
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{FORMATIF.map(renderField)}</div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wide text-accent mb-3">
              Nilai Sumatif
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{SUMATIF.map(renderField)}</div>
          </div>
        </div>

        <Button
          onClick={goNext}
          disabled={idx === rows.length - 1}
          className="w-full mt-8 h-12 text-base gap-2"
          data-testid="manual-save-button"
        >
          Berikutnya
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Card>
    </div>
  );
}
