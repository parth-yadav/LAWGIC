import { EditIcon, LoaderCircleIcon } from "lucide-react";
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
import { toast } from "sonner";
import { Input } from "../ui/input";

export default function RenameDocument({ document, onRename }) {
  const [open, setOpen] = useState(false);
  const [renaming, startRenaming] = useTransition();
  const [newTitle, setNewTitle] = useState("");

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (isOpen) {
      setNewTitle(document.title);
    } else {
      setNewTitle("");
    }
  };

  const handleRename = async () => {
    if (!newTitle.trim()) {
      toast.error("Please enter a valid title");
      return;
    }
    if (newTitle.trim() === document.title) {
      toast.info("No changes made");
      setOpen(false);
      return;
    }
    startRenaming(async () => {
      try {
        const response = await ApiClient.post(`/documents/${document.id}/rename`, {
          newName: newTitle.trim(),
        });
        const { success, message } = response.data;
        if (success) {
          toast.success(message || "Document renamed successfully");
          onRename?.();
          setNewTitle("");
        }
      } catch (error) {
        const errorMessage = error.response?.data?.error?.message || "Failed to rename document";
        toast.error(errorMessage);
      } finally {
        setOpen(false);
      }
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !renaming) handleRename();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full justify-start">
          <EditIcon className="mr-2 h-4 w-4" />
          Rename
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Document</DialogTitle>
          <DialogDescription>Enter a new name for &quot;{document.title}&quot;</DialogDescription>
        </DialogHeader>
        <Input
          value={newTitle}
          disabled={renaming}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter document title"
          className="mb-4 w-full"
          autoFocus
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={renaming}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleRename} disabled={renaming || !newTitle.trim() || newTitle.trim() === document.title}>
            {renaming ? (
              <><LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />Renaming...</>
            ) : (
              <><EditIcon className="mr-2 h-4 w-4" />Rename</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
