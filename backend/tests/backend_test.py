"""Backend API tests for SMPN 37 Jakarta Nilai & Raport app."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback: read frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.strip().split("=", 1)[1].strip().rstrip("/")

USERNAME = "guru37JUARA"
PASSWORD = "@123Smp37"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def token(api):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"username": USERNAME, "password": PASSWORD}, timeout=20)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and data["username"] == USERNAME
    return data["token"]


@pytest.fixture(scope="session")
def auth(api, token):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json",
                      "Authorization": f"Bearer {token}"})
    return s


# ---------- Auth ----------
def test_login_wrong_credentials(api):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"username": "nope", "password": "bad"}, timeout=20)
    assert r.status_code == 401


def test_me_without_token(api):
    r = requests.get(f"{BASE_URL}/api/auth/me", timeout=20)
    assert r.status_code == 401


def test_me_with_token(auth):
    r = auth.get(f"{BASE_URL}/api/auth/me", timeout=20)
    assert r.status_code == 200
    assert r.json()["username"] == USERNAME


# ---------- Auth protection ----------
@pytest.mark.parametrize("path", [
    "/api/kelas", "/api/mapel", "/api/siswa?kelas=7A",
    "/api/nilai?kelas=7A&mapel=Matematika",
])
def test_endpoints_require_auth(path):
    r = requests.get(f"{BASE_URL}{path}", timeout=20)
    assert r.status_code == 401


# ---------- Data endpoints ----------
def test_get_kelas(auth):
    r = auth.get(f"{BASE_URL}/api/kelas", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) == 24
    sample = data[0]
    assert {"kelas", "walas", "jumlah_siswa"} <= set(sample.keys())
    total = sum(k["jumlah_siswa"] for k in data)
    assert total > 800  # ~854 seeded
    assert any(k["kelas"] == "7A" for k in data)


def test_get_mapel(auth):
    r = auth.get(f"{BASE_URL}/api/mapel", timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) == 10
    assert "Matematika" in data


def test_get_siswa_7a(auth):
    r = auth.get(f"{BASE_URL}/api/siswa?kelas=7A", timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) > 0
    s = data[0]
    assert "id" in s and "nama" in s and "nisn" in s
    assert s["id"].startswith("7A_")


def test_get_nilai_shape(auth):
    r = auth.get(f"{BASE_URL}/api/nilai?kelas=7A&mapel=Matematika", timeout=20)
    assert r.status_code == 200
    rows = r.json()
    assert isinstance(rows, list) and len(rows) > 0
    row = rows[0]
    for k in ["siswa_id", "nama", "nisn", "jk", "f1", "f2", "f3", "s1", "s2", "s3"]:
        assert k in row


# ---------- Nilai bulk save + persistence ----------
def test_nilai_bulk_save_and_verify(auth):
    # Pick first student in 7A
    r = auth.get(f"{BASE_URL}/api/siswa?kelas=7A", timeout=20)
    sid = r.json()[0]["id"]
    payload = {
        "kelas": "7A", "mapel": "Matematika",
        "items": [{"siswa_id": sid, "f1": 80, "f2": 85, "f3": 90,
                   "s1": 75, "s2": 88, "s3": 92}]
    }
    r2 = auth.post(f"{BASE_URL}/api/nilai/bulk", json=payload, timeout=30)
    assert r2.status_code == 200, r2.text
    assert r2.json().get("saved") == 1

    # Verify persistence
    r3 = auth.get(f"{BASE_URL}/api/nilai?kelas=7A&mapel=Matematika", timeout=20)
    assert r3.status_code == 200
    rows = {x["siswa_id"]: x for x in r3.json()}
    saved = rows[sid]
    assert saved["f1"] == 80 and saved["f2"] == 85 and saved["f3"] == 90
    assert saved["s1"] == 75 and saved["s2"] == 88 and saved["s3"] == 92


# ---------- PDF endpoints ----------
def test_raport_pdf_student(auth):
    r = auth.get(f"{BASE_URL}/api/siswa?kelas=7A", timeout=20)
    sid = r.json()[0]["id"]
    r2 = auth.get(f"{BASE_URL}/api/raport/pdf/student/{sid}", timeout=60)
    assert r2.status_code == 200
    assert r2.headers.get("content-type", "").startswith("application/pdf")
    assert r2.content[:4] == b"%PDF"


def test_raport_pdf_student_404(auth):
    r = auth.get(f"{BASE_URL}/api/raport/pdf/student/NONE_000", timeout=30)
    assert r.status_code == 404


def test_raport_pdf_kelas(auth):
    r = auth.get(f"{BASE_URL}/api/raport/pdf/kelas/7A", timeout=180)
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("application/pdf")
    assert r.content[:4] == b"%PDF"
    # Multi-page: file should be reasonably large
    assert len(r.content) > 20_000


# ---------- Leger Excel ----------
def test_leger_excel(auth):
    r = auth.get(f"{BASE_URL}/api/leger/excel/7A", timeout=60)
    assert r.status_code == 200
    ct = r.headers.get("content-type", "")
    assert "spreadsheetml" in ct
    # xlsx is a zip -> starts with PK
    assert r.content[:2] == b"PK"


def test_leger_excel_bad_kelas(auth):
    r = auth.get(f"{BASE_URL}/api/leger/excel/ZZ", timeout=30)
    assert r.status_code == 404


# ---------- Walas NIP (new) ----------
def test_walas_get_and_patch_nip(auth):
    r = auth.get(f"{BASE_URL}/api/walas/7A", timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert data["kelas"] == "7A"
    assert "nama" in data and "nip" in data

    new_nip = "198501012010011234"
    r2 = auth.patch(f"{BASE_URL}/api/walas/7A", json={"nip": new_nip}, timeout=20)
    assert r2.status_code == 200
    assert r2.json().get("status") == "ok"

    r3 = auth.get(f"{BASE_URL}/api/walas/7A", timeout=20)
    assert r3.status_code == 200
    assert r3.json()["nip"] == new_nip


def test_walas_patch_missing_class(auth):
    r = auth.patch(f"{BASE_URL}/api/walas/ZZ", json={"nip": "123"}, timeout=20)
    assert r.status_code == 404


# ---------- Kehadiran (new) ----------
def test_kehadiran_default_zero(auth):
    r = auth.get(f"{BASE_URL}/api/siswa?kelas=7A", timeout=20)
    sid = r.json()[0]["id"]
    r2 = auth.get(f"{BASE_URL}/api/kehadiran/{sid}", timeout=20)
    assert r2.status_code == 200
    data = r2.json()
    # default (no doc) returns zeros
    assert data["siswa_id"] == sid
    assert data["sakit"] >= 0 and data["izin"] >= 0 and data["alfa"] >= 0


def test_kehadiran_save_and_persist(auth):
    r = auth.get(f"{BASE_URL}/api/siswa?kelas=7A", timeout=20)
    sid = r.json()[0]["id"]
    payload = {"sakit": 2, "izin": 1, "alfa": 0, "catatan": "Bagus, pertahankan"}
    r2 = auth.post(f"{BASE_URL}/api/kehadiran/{sid}", json=payload, timeout=20)
    assert r2.status_code == 200
    assert r2.json().get("status") == "ok"
    r3 = auth.get(f"{BASE_URL}/api/kehadiran/{sid}", timeout=20)
    assert r3.status_code == 200
    d = r3.json()
    assert d["sakit"] == 2 and d["izin"] == 1 and d["alfa"] == 0
    assert d["catatan"] == "Bagus, pertahankan"


def test_kehadiran_clamps_negative(auth):
    r = auth.get(f"{BASE_URL}/api/siswa?kelas=7A", timeout=20)
    sid = r.json()[0]["id"]
    r2 = auth.post(f"{BASE_URL}/api/kehadiran/{sid}",
                   json={"sakit": -5, "izin": -3, "alfa": -1, "catatan": "x"},
                   timeout=20)
    assert r2.status_code == 200
    r3 = auth.get(f"{BASE_URL}/api/kehadiran/{sid}", timeout=20)
    d = r3.json()
    assert d["sakit"] == 0 and d["izin"] == 0 and d["alfa"] == 0


def test_kehadiran_bad_siswa(auth):
    r = auth.post(f"{BASE_URL}/api/kehadiran/NONE_000",
                  json={"sakit": 1, "izin": 0, "alfa": 0, "catatan": ""}, timeout=20)
    assert r.status_code == 404


# ---------- Nilai validation (clamp >100) ----------
def test_nilai_bulk_clamps_above_100(auth):
    r = auth.get(f"{BASE_URL}/api/siswa?kelas=7A", timeout=20)
    sid = r.json()[0]["id"]
    payload = {
        "kelas": "7A", "mapel": "Matematika",
        "items": [{"siswa_id": sid, "f1": 150, "f2": -20, "f3": 95,
                   "s1": None, "s2": 101, "s3": 0}]
    }
    r2 = auth.post(f"{BASE_URL}/api/nilai/bulk", json=payload, timeout=20)
    assert r2.status_code == 200, r2.text
    r3 = auth.get(f"{BASE_URL}/api/nilai?kelas=7A&mapel=Matematika", timeout=20)
    rows = {x["siswa_id"]: x for x in r3.json()}
    saved = rows[sid]
    assert saved["f1"] == 100  # clamped from 150
    assert saved["f2"] == 0    # clamped from -20
    assert saved["f3"] == 95
    assert saved["s2"] == 100  # clamped from 101
    assert saved["s3"] == 0


# ---------- Raport reflects new fields ----------
def test_raport_student_includes_walas_nip_and_kehadiran(auth):
    # Ensure NIP is set and kehadiran saved
    auth.patch(f"{BASE_URL}/api/walas/7A", json={"nip": "199001012015031111"}, timeout=20)
    r = auth.get(f"{BASE_URL}/api/siswa?kelas=7A", timeout=20)
    sid = r.json()[0]["id"]
    auth.post(f"{BASE_URL}/api/kehadiran/{sid}",
              json={"sakit": 3, "izin": 0, "alfa": 1, "catatan": "Rajin"}, timeout=20)
    r2 = auth.get(f"{BASE_URL}/api/raport/student/{sid}", timeout=30)
    assert r2.status_code == 200
    d = r2.json()
    assert d.get("walas_nip") == "199001012015031111"
    k = d.get("kehadiran", {})
    assert k.get("sakit") == 3 and k.get("alfa") == 1
    assert k.get("catatan") == "Rajin"
