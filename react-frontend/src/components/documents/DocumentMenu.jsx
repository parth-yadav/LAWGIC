import { EllipsisIcon, ExternalLinkIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import RenameDocument from "./RenameDocument";
import DeleteButton from "./DeleteButton";

export default function DocumentMenu({ className, doc, refreshDocuments }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          onClick={(e) => e.stopPropagation()}
          variant={"outline"}
          className={className}
        >
          <EllipsisIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        onClick={(e) => e.stopPropagation()}
        className="flex w-40 flex-col gap-2"
      >
        <Link to={`/documents/${doc.id}`} target={"_blank"}>
          <Button variant={"outline"} className="w-full">
            <ExternalLinkIcon />
            Open
          </Button>
        </Link>
        <RenameDocument document={doc} onRename={refreshDocuments} />
        <DeleteButton document={doc} onDelete={refreshDocuments} />
      </PopoverContent>
    </Popover>
  );
}
