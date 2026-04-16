"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-surface-900 via-brand-900 to-surface-800 items-center justify-center p-12 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -right-20 w-[400px] h-[400px] rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute bottom-1/4 -left-20 w-[300px] h-[300px] rounded-full bg-brand-400/8 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-lg">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mb-8">
            <Shield size={32} className="text-white" suppressHydrationWarning />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Collab Force Group
          </h2>
          <p className="text-lg text-surface-400 leading-relaxed">
            Streamlined patient and appointment management 
            for healthcare teams. Secure, fast, and collaborative.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { value: "256-bit", label: "Encryption" },
              { value: "HIPAA", label: "Compliant" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-brand-400">{stat.value}</p>
                <p className="text-xs text-surface-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <Shield size={20} className="text-white" suppressHydrationWarning />
            </div>
            <h1 className="text-xl font-bold text-surface-900">Collab Force</h1>
          </div>

          <h2 className="text-2xl font-bold text-surface-900 mb-1">Welcome back</h2>
          <p className="text-surface-500 text-sm mb-8">Sign in to access the patient management system</p>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-danger-50 border border-danger-500/20 text-danger-700 text-sm font-medium animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="admin@collabforce.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="form-label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pr-10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-smooth"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} suppressHydrationWarning /> : <Eye size={18} suppressHydrationWarning />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-8 p-4 rounded-xl bg-surface-100 border border-surface-200">
            <p className="text-xs font-semibold text-surface-500 mb-2">Demo credentials</p>
            <div className="space-y-1 text-sm text-surface-600">
              <p><span className="font-medium">Admin:</span> admin@collabforce.com / password123</p>
              <p><span className="font-medium">Staff:</span> staff@collabforce.com / password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
