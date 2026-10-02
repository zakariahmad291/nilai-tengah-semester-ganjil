# PRD — Sistem Penilaian & Raport Digital SMPN 37 Jakarta

## Problem Statement (original)
Web app untuk guru SMPN 37 Jakarta menginput nilai murid. 2 jenis nilai: Formatif (F1,F2,F3) & Sumatif (S1,S2,S3). Input nilai: (1) manual satu per satu, (2) paste dari Excel/Word ke grid. Wali kelas bisa cetak/unduh raport PDF per murid & per kelas. Leger nilai per kelas diunduh dalam Excel. Semua guru login dengan kredensial bersama (guru37JUARA / @123Smp37). Data siswa, wali kelas, kelas, mapel, contoh raport terlampir.

## User Choices
- Login bersama; guru bisa pilih kelas+mapel bebas, dan bertindak sebagai wali kelas untuk cetak raport.
- Raport menampilkan F1-F3 & S1-S3 saja, TANPA nilai akhir/rata-rata.
- KKTP tetap 75 untuk semua mapel.
- Paste langsung ke dalam sel grid (plus modal tempel cadangan).
- Logo Jaya Raya DKI Jakarta sesuai contoh raport.

## Architecture
- Backend: FastAPI + MongoDB (motor). JWT (shared credential dari env AUTH_USERNAME/AUTH_PASSWORD, JWT_SECRET).
- Frontend: React + Tailwind + shadcn/ui, axios, react-router, sonner. Token di localStorage, Bearer header.
- PDF: reportlab (logo /app/backend/logo_jayaraya.png). Excel: openpyxl.
- Seed idempoten dari /app/backend/seed_data.json: 24 kelas, 24 wali kelas, 854 siswa, 10 mapel.

## Personas
- Guru mapel: input nilai per kelas+mapel (tabel/manual/paste).
- Wali kelas: cetak & unduh raport (per murid / per kelas) dan unduh leger Excel.

## Core Requirements (static)
- Login bersama, data terproteksi JWT.
- Dua mode input nilai (grid+paste, manual).
- Raport PDF per murid & per kelas (format resmi sekolah).
- Leger nilai Excel per kelas.

## Implemented (2026-06)
- [x] Auth login bersama + proteksi endpoint + /auth/me.
- [x] Dashboard: selektor kelas & mapel, info wali kelas + jumlah siswa.
- [x] GradeGrid: input langsung, paste ke sel, modal tempel Excel, warna KKTP (hijau >=75, merah <75), AUTOSAVE (debounce 900ms, indikator status).
- [x] ManualEntry: form per siswa, navigasi prev/next, AUTOSAVE + tombol "Berikutnya".
- [x] RaportSection: cetak/unduh PDF per murid & per kelas, editor NIP wali kelas, dialog Kehadiran (sakit/izin/alfa) + Catatan per siswa.
- [x] LegerSection: unduh leger nilai Excel per kelas.
- [x] PDF raport meniru contoh (kop, logo Jaya Raya, F1-F3/S1-S3, KKTP 75, ketidakhadiran terisi, catatan wali kelas tercetak, NIP wali kelas otomatis, tanda tangan).
- [x] Validasi backend: nilai 0-100, kehadiran >=0.
- [x] Tested: iter1 17/17 backend; iter2 25/25 backend; frontend e2e 100%.

## Backlog / Next (P1/P2)
- P1: Rekap persentase ketuntasan per kelas/mapel (dashboard statistik).
- P2: Peran/akun per guru.
- P2: Riwayat perubahan nilai.
- P2: Split server.py ke modul (routes/services).
