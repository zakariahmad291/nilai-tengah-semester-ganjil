import { useEffect, useState, useCallback } from "react";
import api, { openPdf, downloadFile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Printer, Download, Loader2, Search, FileText, Users } from "lucide-react";

export default function RaportSection({ kelas, walas }) {
  const [siswa, setSiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [classBusy, setClassBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/siswa?kelas=${kelas}`)
      .then((r) => setSiswa(r.data))
      .finally(() => setLoading(false));
  }, [kelas]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn, id) => {
    setBusyId(id);
    try {
      await fn();
    } catch (e) {
      toast.error("Gagal membuat raport.");
    } finally {
      setBusyId(null);
    }
  };

  const printStudent = (s) =>
    act(() => openPdf(`/raport/pdf/student/${s.id}`), s.id + "p");
  const downloadStudent = (s) =>
    act(
      () => downloadFile(`/raport/pdf/student/${s.id}`, `Raport_${s.nama}_${kelas}.pdf`),
      s.id + "d"
    );

  const printClass = async () => {
    setClassBusy(true);
    try {
      await openPdf(`/raport/pdf/kelas/${kelas}`);
    } catch {
      toast.error("Gagal membuat raport kelas.");
    } finally {
      setClassBusy(false);
    }
  };
  const downloadClass = async () => {
    setClassBusy(true);
    try {
      await downloadFile(`/raport/pdf/kelas/${kelas}`, `Raport_Kelas_${kelas}.pdf`);
    } catch {
      toast.error("Gagal mengunduh raport kelas.");
    } finally {
      setClassBusy(false);
    }
  };

  const filtered = siswa.filter((s) => s.nama.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      {/* Class-wide actions */}
      <Card className="p-5 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display font-bold text-foreground">Raport Satu Kelas {kelas}</p>
              <p className="text-sm text-muted-foreground">
                Wali Kelas: {walas} &middot; {siswa.length} siswa dalam satu file PDF
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={printClass}
              disabled={classBusy}
              className="gap-2"
              data-testid="print-raport-class-button"
            >
              {classBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              Cetak
            </Button>
            <Button
              onClick={downloadClass}
              disabled={classBusy}
              className="gap-2"
              data-testid="download-raport-class-button"
            >
              {classBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Unduh PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama siswa..."
          className="pl-10 h-11 max-w-md"
          data-testid="raport-search-input"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Memuat...
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((s, i) => (
            <Card
              key={s.id}
              className="p-3 sm:p-4 flex items-center justify-between hover:border-primary/40 transition-colors"
              data-testid={`raport-student-row-${i}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{s.nama}</p>
                  <p className="text-xs text-muted-foreground">
                    NISN {s.nisn} &middot; {s.jk === "L" ? "Laki-laki" : "Perempuan"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => printStudent(s)}
                  disabled={busyId === s.id + "p"}
                  className="gap-1.5"
                  data-testid={`raport-print-${i}`}
                >
                  {busyId === s.id + "p" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Cetak</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadStudent(s)}
                  disabled={busyId === s.id + "d"}
                  className="gap-1.5"
                  data-testid={`raport-download-${i}`}
                >
                  {busyId === s.id + "d" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">PDF</span>
                </Button>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-10">Tidak ada siswa ditemukan.</p>
          )}
        </div>
      )}
    </div>
  );
}
