import { AdminLoginForm } from "@/components/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-4"
      style={{ backgroundColor: "#FED6D6" }}
    >
      <h1 className="mb-6 text-2xl font-bold">CuratedByDer — Admin</h1>
      <AdminLoginForm />
    </div>
  );
}