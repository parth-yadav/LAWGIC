"use client";
import RevealHero from "@/components/animations/RevealHero";
import AddDocument from "@/components/documents/AddDocument";
import DeleteButton from "@/components/documents/DeleteButton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDocuments } from "@/providers/DocumentsProvider";
import { ExternalLinkIcon, LoaderCircleIcon } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { loading, documents, error, refreshDocuments } = useDocuments();

  if (loading) {
    return (
      <section className="flex h-full w-full flex-1 flex-col items-center justify-center px-4">
        <p>Loading documents...</p>
        <LoaderCircleIcon className="mt-2 animate-spin" />
      </section>
    );
  }
  if (error) {
    return (
      <section className="flex w-full flex-1 flex-col px-4">
        <p>{error}</p>
      </section>
    );
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-2 px-4">
      <div
        className={cn(
          "bg-background flex w-full items-center justify-between",
          "border-border sticky top-0 border-b",
        )}
      >
        <RevealHero className="text-xl font-bold md:text-3xl">
          Dashboard
        </RevealHero>
        <AddDocument onAdd={refreshDocuments} />
      </div>

      {documents.length === 0 && (
        <p className="text-muted-foreground mx-auto text-sm">
          You have no documents. Start by uploading one!
        </p>
      )}
      <div className="flex flex-col gap-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="border-border flex cursor-pointer flex-col rounded-2xl border p-4 shadow-md transition-all duration-200 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h3 className="font-semibold">{doc.title}</h3>
              <p className="text-muted-foreground text-sm">{doc.fileName}</p>
              <p className="text-muted-foreground text-sm">
                Pages: {doc.pageCount}
              </p>
            </div>
            <div className="flex gap-2">
              <Link key={doc.id} href={`/documents/${doc.id}`} target="_blank">
                <Button variant={"outline"}>
                  <ExternalLinkIcon />
                  Open
                </Button>
              </Link>
              <DeleteButton id={doc.id} onDelete={refreshDocuments} />
            </div>
          </div>
          // </Link>
        ))}
      </div>
    </section>
  );
}
