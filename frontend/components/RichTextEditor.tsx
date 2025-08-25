"use client";

import hljs from "highlight.js";
import Quill, { Delta } from "quill";
import "highlight.js/styles/atom-one-dark.css";
import "quill/dist/quill.snow.css";
import { useState, useEffect, useCallback } from "react";

const TOOLBAR_OPTIONS = [
  [{ font: [] }],
  [{ size: ["small", false, "large", "huge"] }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ header: 1 }, { header: 2 }],
  ["blockquote", "code-block"],
  [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
  [{ indent: "-1" }, { indent: "+1" }],
  [{ direction: "rtl" }],
  [{ align: [] }],
  ["link", "image", "video", "formula"],
  ["clean"],
];

const getOptions = (readOnly: boolean) => ({
  theme: "snow",
  placeholder: "Write your content...",
  readOnly,
  modules: {
    syntax: { hljs },
    toolbar: readOnly ? false : TOOLBAR_OPTIONS,
  },
});

export default function RichTextEditor({
  content,
  setContent,
  readOnly = false,
}: {
  content?: Delta | undefined;
  setContent?: (content: Delta) => void;
  readOnly?: boolean;
}) {
  const [quill, setQuill] = useState<Quill | null>(null);

  useEffect(() => {
    if (!quill) return;

    if (!readOnly && setContent) {
      const handleTextChange = () => {
        const delta = quill.getContents();
        setContent(delta);
      };
      quill.on("text-change", handleTextChange);
      return () => {
        quill.off("text-change", handleTextChange);
      };
    }
  }, [quill, readOnly, setContent]);

  const containerRef = useCallback(
    (container: HTMLDivElement | null) => {
      if (!container) return;
      container.innerHTML = "";
      const editor = document.createElement("div");
      container.append(editor);
      const q = new Quill(editor, getOptions(readOnly));
      setQuill(q);
      q.setContents(content ?? [{ insert: "\n" }]);
      if (readOnly) {
        const qlContainer = document.getElementsByClassName(
          "ql-container"
        )[0] as HTMLElement;
        if (qlContainer) {
          qlContainer.style.border = "none";
        }
        q.disable();
      } else {
        q.enable();
      }
    },
    [readOnly]
  );

  return <div ref={containerRef}></div>;
}
