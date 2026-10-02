import { useEffect, useState, useCallback } from "react";
import api, { openPdf, downloadFile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATATAN_TEMPLATES } from "@/lib/catatanTemplates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Printer,
  Download,
  Loader2,
  Search,
  FileText,
  Users,
  Save,
  ClipboardList,
  IdCard,
  FileArchive,
} from "lucide-react";

export default function RaportSection({ kelas, walas }) {
  const [siswa, setSiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [classBusy, setClassBusy] = useState(false);
  const [nip, setNip] = useState("");
  const [nipInput, setNipInput] = useState("");
  const [savingNip, setSavingNip] = useState(false);
  const [kehOpen, setKehOpen] = useState(false);
  const [kehStudent, setKehStudent] = useState(null);
  const [kehForm, setKehForm] = useState({ sakit: 0, izin: 0, alfa: 0, catatan: "" });
  const [kehLoading, setKehLoading] = useState(false);
  const [kehSaving, setKehSaving] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);

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

  useEffect(() => {
    api.get(`/walas/${kelas}`).then((r) => {
      setNip(r.data.nip || "");
      setNipInput(r.data.nip || "");
    });
  }, [kelas]);

  const saveNip = async () => {
    setSavingNip(true);
    try {
      await api.patch(`/walas/${kelas}`, { nip: nipInput });
      setNip(nipInput);
      toast.success("NIP wali kelas tersimpan.");
    } catch {
      toast.error("Gagal menyimpan NIP.");
    } finally {
      setSavingNip(false);
    }
  };

  const openKehadiran = async (s) => {
    setKehStudent(s);
    setKehOpen(true);
    setKehLoading(true);
    try {
      const r = await api.get(`/kehadiran/${s.id}`);
      setKehForm({
        sakit: r.data.sakit || 0,
        izin: r.data.izin || 0,
        alfa: r.data.alfa || 0,
        catatan: r.data.catatan || "",
      });
    } finally {
      setKehLoading(false);
    }
  };

  const saveKehadiran = async () => {
    setKehSaving(true);
    try {
      await api.post(`/kehadiran/${kehStudent.id}`, {
        sakit: Number(kehForm.sakit) || 0,
        izin: Number(kehForm.izin) || 0,
        alfa: Number(kehForm.alfa) || 0,
        catatan: kehForm.catatan,
      });
      toast.success("Data kehadiran & catatan tersimpan.");
      setKehOpen(false);
    } catch {
      toast.error("Gagal menyimpan kehadiran.");
    } finally {
      setKehSaving(false);
    }
  };

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

  const downloadZip = async () => {
    setZipBusy(true);
    try {
      await downloadFile(`/raport/zip/${kelas}`, `Raport_${kelas}_per_siswa.zip`);
      toast.success("ZIP raport (PDF per siswa) berhasil diunduh.");
    } catch {
      toast.error("Gagal mengunduh ZIP raport.");
    } finally {
      setZipBusy(false);
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
            <Button
              variant="outline"
              onClick={downloadZip}
              disabled={zipBusy}
              className="gap-2"
              data-testid="download-raport-zip-button"
            >
              {zipBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileArchive className="h-4 w-4" />}
              Unduh ZIP
            </Button>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-primary/10 flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-sm font-medium text-foreground flex items-center gap-2 shrink-0">
            <IdCard className="h-4 w-4 text-primary" /> NIP Wali Kelas
          </label>
          <Input
            value={nipInput}
            onChange={(e) => setNipInput(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Masukkan NIP (tampil di tanda tangan raport)"
            className="h-10 bg-card flex-1"
            data-testid="walas-nip-input"
          />
          <Button
            variant="outline"
            onClick={saveNip}
            disabled={savingNip || nipInput === nip}
            className="gap-2 shrink-0"
            data-testid="save-nip-button"
          >
            {savingNip ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan NIP
          </Button>
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
                  onClick={() => openKehadiran(s)}
                  className="gap-1.5"
                  data-testid={`raport-kehadiran-${i}`}
                >
                  <ClipboardList className="h-4 w-4" />
                  <span className="hidden sm:inline">Kehadiran</span>
                </Button>
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

      <Dialog open={kehOpen} onOpenChange={setKehOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kehadiran &amp; Catatan Wali Kelas</DialogTitle>
            <DialogDescription>{kehStudent?.nama}</DialogDescription>
          </DialogHeader>
          {kehLoading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {["sakit", "izin", "alfa"].map((k) => (
                  <div key={k} className="space-y-1.5">
                    <Label className="capitalize">{k} (hari)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={kehForm[k]}
                      data-testid={`keh-${k}-input`}
                      onChange={(e) => setKehForm((f) => ({ ...f, [k]: e.target.value }))}
                      className="h-10 text-center"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label>Template Catatan (opsional)</Label>
                <Select onValueChange={(v) => setKehForm((f) => ({ ...f, catatan: v }))}>
                  <SelectTrigger data-testid="keh-template-select">
                    <SelectValue placeholder="Pilih template lalu sesuaikan" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATATAN_TEMPLATES.map((t, i) => (
                      <SelectItem key={i} value={t} className="text-xs whitespace-normal max-w-sm">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Catatan Wali Kelas</Label>
                <Textarea
                  value={kehForm.catatan}
                  data-testid="keh-catatan-input"
                  onChange={(e) => setKehForm((f) => ({ ...f, catatan: e.target.value }))}
                  placeholder="Tulis catatan untuk siswa (akan tercetak di raport)..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setKehOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={saveKehadiran}
              disabled={kehSaving || kehLoading}
              className="gap-2"
              data-testid="keh-save-button"
            >
              {kehSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
