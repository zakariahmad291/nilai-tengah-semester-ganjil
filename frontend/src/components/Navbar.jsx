import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LogOut, GraduationCap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Navbar() {
  const { logout } = useAuth();
  const [dark, setDark] = useState(document.documentElement.classList.contains("dark"));

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-card/80 border-b border-border">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo_jayaraya.png" alt="Logo" className="h-10 w-10 object-contain" />
          <div className="leading-tight">
            <p className="font-display font-bold text-sm sm:text-base text-foreground">
              Penilaian &amp; Raport Digital
            </p>
            <p className="text-xs text-muted-foreground hidden sm:block">SMP Negeri 37 Jakarta</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="theme-toggle-button"
            aria-label="Ubah tema"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              logout();
              toast.success("Berhasil keluar.");
            }}
            data-testid="logout-button"
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
