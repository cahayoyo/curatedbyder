import { ListLoader } from "@/components/ListLoader";

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <ListLoader label="Memuat halaman..." />
    </div>
  );
}