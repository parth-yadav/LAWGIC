"use client";
import { LoaderCircleIcon, Trash2Icon } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useTransition } from "react";
import ApiClient from "@/utils/ApiClient";

export default function DeleteButton({
  document,
  onDelete,
}: {
  document: UserDocument;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const [deleting, startDeleting] = useTransition();

  const handleDelete = async () => {
    startDeleting(async () => {
      try {
        const response = await ApiClient.delete(`/documents/${document.id}`);
        const { success } = response.data;
        if (success) {
          onDelete?.();
        }
      } catch (error) {
        console.error("Failed to delete document:", error);
      } finally {
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={"destructive"}>
          <Trash2Icon />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            document.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete}>
            {deleting ? "Deleting..." : "Yes, delete"}
            {deleting ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <Trash2Icon />
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
