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
