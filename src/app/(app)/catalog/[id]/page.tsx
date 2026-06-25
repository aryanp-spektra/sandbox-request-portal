import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLab } from "@/lib/labs";
import { getStarCount } from "@/lib/data/stars";
import { LabDetail } from "./LabDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lab = getLab(id);
  return { title: lab ? `${lab.title}, Sandbox Portal` : "Lab, Sandbox Portal" };
}

export default async function LabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lab = getLab(id);
  if (!lab) notFound();
  const stars = await getStarCount(id);
  return <LabDetail id={id} initialStars={stars} />;
}
