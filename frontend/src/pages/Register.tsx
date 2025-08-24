import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { RegisterForm } from "../types/auth";
import { apiFetch } from "../utils/api";

export default function Register() {
  const [form, setForm] = useState<RegisterForm>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "male",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Паролі не співпадають");
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          confirm_password: form.confirmPassword,
          gender: form.gender,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.detail || "Помилка реєстрації");
      } else {
        navigate("/login");
      }
    } catch {
      setError("Помилка мережі");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h2 className="text-2xl font-bold mb-4">Реєстрація</h2>
      <form className="w-full max-w-xs space-y-3" onSubmit={handleSubmit}>
        <input
          className="w-full px-3 py-2 border rounded"
          name="username"
          placeholder="Нікнейм"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          className="w-full px-3 py-2 border rounded"
          name="email"
          type="email"
          placeholder="Пошта"
          value={form.email}
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
        <input
          className="w-full px-3 py-2 border rounded"
          name="confirmPassword"
          type="password"
          placeholder="Підтвердьте пароль"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />
        <div className="flex items-center space-x-4">
          <label>
            <input
              type="radio"
              name="gender"
              value="male"
              checked={form.gender === "male"}
              onChange={handleChange}
            />{" "}
            Чоловік
          </label>
          <label>
            <input
              type="radio"
              name="gender"
              value="female"
              checked={form.gender === "female"}
              onChange={handleChange}
            />{" "}
            Жінка
          </label>
        </div>
        {error && <div className="text-red-500">{error}</div>}
        <button
          type="submit"
          className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={loading}
        >
          {loading ? "Реєстрація..." : "Зареєструватися"}
        </button>
      </form>
      <p className="mt-4">
        Вже є аккаунт?{" "}
        <Link to="/login" className="text-blue-500 hover:underline">Увійти</Link>
      </p>
      <p className="mt-2">
        <Link to="/" className="text-gray-500 hover:underline">На головну</Link>
      </p>
    </div>
  );
}