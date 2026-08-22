import { BookForm } from "@/components/BookForm";

export default async function NewBookPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h2 className="text-2xl font-bold">Buat Buku</h2>
      <BookForm />
    </div>
  );
}