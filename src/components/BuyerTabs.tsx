"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUSES, STATUS_LABEL, PAYMENT_LABEL } from "@/lib/orderOptions";

type OrderItemDTO = {
  quantity: number;
  unitPrice: number;
  book: { title: string };
};

export type OrderDTO = {
  id: string;
  invoiceNumber: string;
  source: string;
  status: string;
  paymentStatus: string;
  total: number;
  soldAt: string;
  dp: number | null;
  remaining: number | null;
  eta: string | null;
  items: OrderItemDTO[];
};

const statusColor: Record<string, string> = {
  ORDER_PLACED: "bg-yellow-100 text-yellow-800",
  SHIPPING_TO_INDONESIA: "bg-blue-100 text-blue-800",
  ARRIVED_IN_INDONESIA: "bg-indigo-100 text-indigo-800",
  ARRIVED_AT_WAREHOUSE: "bg-purple-100 text-purple-800",
  SHIPPED_TO_CUSTOMER: "bg-cyan-100 text-cyan-800",
  ORDER_DELIVERED: "bg-green-100 text-green-800",
};

export function formatIDR(rupiah: number | null | undefined) {
  if (rupiah == null) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(rupiah);
}

function statusBadge(status: string) {
  return <Badge className={statusColor[status] ?? ""}>{STATUS_LABEL[status] ?? status}</Badge>;
}

export function BuyerTabs({ orders }: { orders: OrderDTO[] }) {
  return (
    <Tabs defaultValue="invoice">
      <TabsList className="w-full">
        <TabsTrigger value="invoice" className="flex-1">Invoice</TabsTrigger>
        <TabsTrigger value="payment" className="flex-1">Payment</TabsTrigger>
        <TabsTrigger value="shipment" className="flex-1">Tracking</TabsTrigger>
      </TabsList>

      <TabsContent value="invoice" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>My Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((s) => (
                  <div key={s.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{s.invoiceNumber}</span>
                      {statusBadge(s.status)}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(s.soldAt).toLocaleDateString("id-ID")} · {s.source}
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {s.items.map((it, i) => (
                        <li key={i}>
                          {it.book.title} × {it.quantity}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 font-semibold">{formatIDR(s.total)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="payment" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>DP</TableHead>
                  <TableHead>Sisa</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.invoiceNumber}</TableCell>
                    <TableCell>{formatIDR(s.total)}</TableCell>
                    <TableCell>{formatIDR(s.dp)}</TableCell>
                    <TableCell>{formatIDR(s.remaining)}</TableCell>
                    <TableCell>
                      <Badge className="bg-slate-100 text-slate-800">
                        {PAYMENT_LABEL[s.paymentStatus] ?? s.paymentStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="shipment" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Shipment Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No shipments yet.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((s) => (
                  <div key={s.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{s.invoiceNumber}</span>
                      {statusBadge(s.status)}
                    </div>
                    {s.eta && (
                      <p className="mt-2 text-sm text-muted-foreground">ETA: {s.eta}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-1 text-xs">
                      {STATUSES.map((step, i, arr) => {
                        const idx = STATUSES.findIndex((x) => x.value === s.status);
                        return (
                          <div key={step.value} className="flex items-center gap-1">
                            <span
                              className={`whitespace-nowrap rounded-full px-2 py-1 ${
                                i <= idx
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {step.label}
                            </span>
                            {i < arr.length - 1 && (
                              <span className="text-muted-foreground">→</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}