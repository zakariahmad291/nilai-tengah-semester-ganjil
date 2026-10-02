import { useEffect, useState } from "react";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import GradeGrid from "@/components/GradeGrid";
import ManualEntry from "@/components/ManualEntry";
import RaportSection from "@/components/RaportSection";
import LegerSection from "@/components/LegerSection";
import KehadiranGrid from "@/components/KehadiranGrid";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table2, PenLine, Printer, FileSpreadsheet, Users, CalendarCheck } from "lucide-react";

export default function Dashboard() {
  const [kelasList, setKelasList] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [kelas, setKelas] = useState("");
  const [mapel, setMapel] = useState("");
  const [tab, setTab] = useState("tabel");

  useEffect(() => {
    api.get("/kelas").then((r) => setKelasList(r.data));
    api.get("/mapel").then((r) => setMapelList(r.data));
  }, []);

  const currentKelas = kelasList.find((k) => k.kelas === kelas);
  const needMapel = tab === "tabel" || tab === "manual";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Selector bar */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
              Kelas
            </label>
            <Select value={kelas} onValueChange={setKelas}>
              <SelectTrigger className="w-full sm:w-48 h-11 bg-card" data-testid="select-kelas-dropdown">
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                {kelasList.map((k) => (
                  <SelectItem key={k.kelas} value={k.kelas} data-testid={`kelas-option-${k.kelas}`}>
                    Kelas {k.kelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
              Mata Pelajaran
            </label>
            <Select value={mapel} onValueChange={setMapel} disabled={!needMapel}>
              <SelectTrigger className="w-full sm:w-80 h-11 bg-card" data-testid="select-mapel-dropdown">
                <SelectValue placeholder={needMapel ? "Pilih mata pelajaran" : "Tidak diperlukan"} />
              </SelectTrigger>
              <SelectContent>
                {mapelList.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentKelas && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground sm:ml-auto bg-secondary rounded-lg px-4 py-2.5">
              <Users className="h-4 w-4 text-primary" />
              <span>
                Wali Kelas: <span className="font-semibold text-foreground">{currentKelas.walas}</span>
              </span>
              <span className="text-border">|</span>
              <span className="font-semibold text-foreground">{currentKelas.jumlah_siswa} siswa</span>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {!kelas ? (
          <EmptyState />
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid sm:grid-cols-5 h-auto p-1">
              <TabsTrigger value="tabel" data-testid="tab-input-tabel" className="gap-2 py-2.5">
                <Table2 className="h-4 w-4" /> <span className="hidden sm:inline">Input</span> Tabel
              </TabsTrigger>
              <TabsTrigger value="manual" data-testid="tab-input-manual" className="gap-2 py-2.5">
                <PenLine className="h-4 w-4" /> <span className="hidden sm:inline">Input</span> Manual
              </TabsTrigger>
              <TabsTrigger value="kehadiran" data-testid="tab-kehadiran" className="gap-2 py-2.5">
                <CalendarCheck className="h-4 w-4" /> Kehadiran
              </TabsTrigger>
              <TabsTrigger value="raport" data-testid="tab-raport" className="gap-2 py-2.5">
                <Printer className="h-4 w-4" /> Raport
              </TabsTrigger>
              <TabsTrigger value="leger" data-testid="tab-leger" className="gap-2 py-2.5">
                <FileSpreadsheet className="h-4 w-4" /> Leger
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tabel" className="mt-6">
              {mapel ? <GradeGrid kelas={kelas} mapel={mapel} /> : <NeedMapel />}
            </TabsContent>
            <TabsContent value="manual" className="mt-6">
              {mapel ? <ManualEntry kelas={kelas} mapel={mapel} /> : <NeedMapel />}
            </TabsContent>
            <TabsContent value="kehadiran" className="mt-6">
              <KehadiranGrid kelas={kelas} />
            </TabsContent>
            <TabsContent value="raport" className="mt-6">
              <RaportSection kelas={kelas} walas={currentKelas?.walas} />
            </TabsContent>
            <TabsContent value="leger" className="mt-6">
              <LegerSection kelas={kelas} walas={currentKelas?.walas} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 rounded-2xl border border-dashed border-border bg-card/40">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        <Users className="h-8 w-8" />
      </div>
      <h3 className="font-display text-xl font-bold text-foreground">Pilih kelas untuk memulai</h3>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">
        Silakan pilih kelas pada menu di atas, lalu pilih mata pelajaran untuk mulai menginput nilai.
      </p>
    </div>
  );
}

function NeedMapel() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 rounded-2xl border border-dashed border-border bg-card/40">
      <PenLine className="h-10 w-10 text-muted-foreground mb-3" />
      <h3 className="font-display text-lg font-bold text-foreground">Pilih mata pelajaran</h3>
      <p className="text-muted-foreground mt-1 text-sm">
        Untuk menginput nilai, pilih mata pelajaran terlebih dahulu di menu atas.
      </p>
    </div>
  );
}
