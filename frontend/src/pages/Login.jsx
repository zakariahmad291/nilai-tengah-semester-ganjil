import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GraduationCap, Lock, User, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username.trim(), password);
      toast.success("Berhasil masuk. Selamat bekerja!");
      navigate("/");
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Gagal masuk. Periksa kembali data Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left hero */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-primary text-primary-foreground">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1742549586702-c23994895082?crop=entropy&cs=srgb&fm=jpg&q=85')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-blue-900/90" />
        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo_jayaraya.png" alt="Logo" className="h-14 w-14 object-contain drop-shadow" />
          <div>
            <p className="text-sm font-medium opacity-90">Dinas Pendidikan DKI Jakarta</p>
            <p className="font-display font-bold text-lg">SMP Negeri 37 Jakarta</p>
          </div>
        </div>
        <div className="relative z-10 space-y-4">
          <h1 className="font-display text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
            Sistem Penilaian &amp; Raport Digital
          </h1>
          <p className="text-base/relaxed opacity-90 max-w-md">
            Input nilai formatif dan sumatif, cetak raport per murid atau per kelas, dan unduh leger
            nilai dengan mudah dalam satu aplikasi.
          </p>
        </div>
        <p className="relative z-10 text-xs opacity-70">
          © {new Date().getFullYear()} SMP Negeri 37 Jakarta. Jaya Raya.
        </p>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src="/logo_jayaraya.png" alt="Logo" className="h-12 w-12 object-contain" />
            <div>
              <p className="text-xs text-muted-foreground">Dinas Pendidikan DKI Jakarta</p>
              <p className="font-display font-bold">SMP Negeri 37 Jakarta</p>
            </div>
          </div>

          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary mb-5">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Masuk Akun Guru
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Silakan masuk menggunakan akun guru untuk mulai menginput nilai.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5" data-testid="login-form">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  data-testid="login-username-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  data-testid="login-password-input"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="pl-10 pr-10 h-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              data-testid="login-submit-button"
              disabled={loading}
              className="w-full h-11 text-base font-semibold transition-transform duration-150 hover:scale-[1.01]"
            >
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
