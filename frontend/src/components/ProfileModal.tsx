import { useState } from "react";
import { apiFetch } from "../utils/api";

interface UserMe {
  id: number;
  username: string;
  email?: string;
  gender?: string;
}

interface ProfileModalProps {
  user: UserMe;
  onClose: () => void;
  onUpdate: (user: UserMe) => void;
}

export default function ProfileModal({ user, onClose, onUpdate }: ProfileModalProps) {
  const [username, setUsername] = useState(user.username);
  const [gender, setGender] = useState(user.gender);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Смена пароля
  const [showPassword, setShowPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch("/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, gender })
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdate(updated);
      onClose();
    } else {
      setError("Помилка оновлення профілю.");
    }
    setLoading(false);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);
    if (newPassword !== confirmPassword) {
      setPasswordError("Паролі не співпадають");
      return;
    }
    if (!oldPassword || !newPassword) {
      setPasswordError("Заповніть усі поля");
      return;
    }
    setChangingPassword(true);
    const res = await apiFetch("/users/me/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      })
    });
    if (res.ok) {
      setPasswordSuccess("Пароль успішно змінений");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordError("Помилка зміни пароля");
    }
    setChangingPassword(false);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold cursor-pointer"
          onClick={onClose}
          aria-label="Скасувати"
          type="button"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">Налаштування профілю</h2>

        <label className="block mb-2 text-sm font-medium">
          Нікнейм:
          <input
            className="w-full border rounded px-3 py-2 mt-1 text-sm"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </label>

        <label className="block mb-4 text-sm font-medium">
          Пол:
          <select
            className="w-full border rounded px-3 py-2 mt-1 text-sm"
            value={gender}
            onChange={e => setGender(e.target.value as "male" | "female")}
          >
            <option value="male">Чоловік</option>
            <option value="female">Жінка</option>
          </select>
        </label>

        {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

        <div className="flex gap-2 mb-4">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            onClick={handleSave}
            disabled={loading}
            type="button"
          >
            Зберегти
          </button>
          <button
            className="px-4 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300"
            onClick={onClose}
            disabled={loading}
            type="button"
          >
            Скасувати
          </button>
          <button
            className="ml-auto px-4 py-2 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
            onClick={() => setShowPassword(v => !v)}
            type="button"
          >
            {showPassword ? "Сховати" : "Змінити пароль"}
          </button>
        </div>

        {showPassword && (
          <div className="border-t pt-4 mt-4 space-y-3">
            <h3 className="font-semibold text-sm">Змінити пароль</h3>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Старий пароль"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
            />
            <input
              type="password"
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Новий пароль"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Повторіть новий пароль"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
            {passwordError && (
              <div className="text-red-500 text-xs">{passwordError}</div>
            )}
            {passwordSuccess && (
              <div className="text-green-600 text-xs">{passwordSuccess}</div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                onClick={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? "Збереження..." : "Змінити пароль"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}