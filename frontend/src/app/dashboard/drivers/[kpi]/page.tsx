import { notFound } from "next/navigation";
import DriverView from "@/components/DriverView";
import type { DriverKey } from "@/lib/evidence";

const VALID: DriverKey[] = ["empathy", "adherence", "engagement", "churn"];

export default async function DriverPage({
  params,
}: {
  params: Promise<{ kpi: string }>;
}) {
  const { kpi } = await params;
  if (!VALID.includes(kpi as DriverKey)) notFound();
  return <DriverView driverKey={kpi as DriverKey} />;
}

export function generateStaticParams() {
  return VALID.map((kpi) => ({ kpi }));
}
