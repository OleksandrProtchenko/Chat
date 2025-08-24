import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { LoginForm, AuthResponse } from "../types/auth";
import { apiFetch } from "../utils/api";
import { useAuth } from "../app/providers/useAuth";


export default function Login() {
  const [form, setForm] = useState<LoginForm>({
    usernameOrEmail: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { refresh } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: form.usernameOrEmail,
          password: form.password,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.detail || "Ошибка входа");
      } else {
        const data: AuthResponse = await response.json();
        localStorage.setItem("access_token", data.access_token);
        await refresh().catch(()=>{});
        navigate("/app", { replace: true });
      }
    } catch {
      setError("Помилка мережі");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h2 className="text-2xl font-bold mb-4">Вход</h2>
      <form className="w-full max-w-xs space-y-3" onSubmit={handleSubmit}>
        <input
          className="w-full px-3 py-2 border rounded"
          name="usernameOrEmail"
          placeholder="Нікнейм або пошта"
          value={form.usernameOrEmail}
          onChange={handleChange}
          required
        />
        <input
          className="w-full px-3 py-2 border rounded"
          name="password"
          type="password"
          placeholder="Пароль"
          value={form.password}
          onChange={handleChange}
          required
        />
        {error && <div className="text-red-500">{error}</div>}
        <button
          type="submit"
          className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? "Вхід..." : "Увійти"}
        </button>
      </form>
      <p className="mt-4">
        Немає акаунта?{" "}
        <Link to="/register" className="text-blue-500 hover:underline">Зареєструватися</Link>
      </p>
      <p className="mt-2">
        <Link to="/" className="text-gray-500 hover:underline">На головну</Link>
      </p>
    </div>
  );
}