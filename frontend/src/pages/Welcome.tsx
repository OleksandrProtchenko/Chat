import { Link } from "react-router-dom";

export default function Welcome() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Ласкаво просимо до БЕСІДНИКА!)</h1>
      <div className="space-x-4">
        <Link to="/login" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Увійти</Link>
        <Link to="/register" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Зареєструватися</Link>
      </div>
    </div>
  );
}