import { useState } from "react";
import { Server, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { setStoredApiUrl } from "@/stores/apiUrl";

export function ApiSetup() {
  const [url, setUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "error" | null>(null);

  const clean = url.replace(/\/+$/, "");

  const testConnection = async () => {
    if (!clean) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${clean}/health`, {
        signal: AbortSignal.timeout(6000),
      });
      setTestResult(res.ok ? "ok" : "error");
    } catch {
      setTestResult("error");
    } finally {
      setTesting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && clean) setStoredApiUrl(clean);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-primary/10 border border-purple-primary/20 mx-auto">
            <Server size={24} className="text-purple-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">FlowDay</h1>
            <p className="text-sm text-text-secondary mt-1">
              Configure o endereço do backend para começar
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background-secondary p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-text-muted uppercase tracking-wide font-mono">
              URL da API
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setTestResult(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="https://flowday.suaurl.com"
              autoFocus
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-mono text-text-primary placeholder:text-text-muted focus:border-purple-primary focus:outline-none focus:ring-1 focus:ring-purple-primary transition-colors"
            />
          </div>

          {testResult === "ok" && (
            <div className="flex items-center gap-2 text-xs text-green-400 font-mono">
              <CheckCircle size={13} />
              Servidor respondeu com sucesso
            </div>
          )}
          {testResult === "error" && (
            <div className="flex items-center gap-2 text-xs text-red-400 font-mono">
              <XCircle size={13} />
              Sem resposta — verifique a URL e o CORS
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={testConnection}
              disabled={!clean || testing}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {testing ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Testando...
                </>
              ) : (
                "Testar"
              )}
            </button>
            <button
              type="button"
              onClick={() => clean && setStoredApiUrl(clean)}
              disabled={!clean}
              className="flex-1 rounded-lg bg-purple-primary px-3 py-2 text-sm font-medium text-white hover:bg-purple-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Entrar
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-text-muted leading-relaxed">
          A URL fica salva no navegador e nunca sai do seu dispositivo.
        </p>
      </div>
    </div>
  );
}
