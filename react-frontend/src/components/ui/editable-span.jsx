import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function EditableSpan({
  value,
  onSubmit,
  onFocus,
  className,
  placeholder,
  selectOnFocus = true,
}) {
  const spanRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && spanRef.current) {
      spanRef.current.focus();
      if (selectOnFocus) {
        const range = document.createRange();
        range.selectNodeContents(spanRef.current);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }, [isEditing, selectOnFocus]);

  const handleClick = () => {
    setIsEditing(true);
    onFocus?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setCurrentValue(value);
      setIsEditing(false);
      spanRef.current?.blur();
    }
  };

  const handleBlur = () => {
    handleSubmit();
  };

  const handleSubmit = () => {
    setIsEditing(false);
    const trimmedValue = currentValue.trim();
    if (trimmedValue !== value) {
      onSubmit(trimmedValue);
    }
  };

  const handleInput = (e) => {
    setCurrentValue(e.currentTarget.textContent || "");
  };

  return (
    <span
      ref={spanRef}
      contentEditable={isEditing}
      suppressContentEditableWarning={true}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onInput={handleInput}
      className={cn(
        "inline-block px-2 py-1 text-sm rounded cursor-pointer transition-colors",
        "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background",
        isEditing && "bg-background border border-input",
        className
      )}
    >
      {currentValue || placeholder}
    </span>
  );
}
