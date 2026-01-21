import React, { useEffect, useState, startTransition } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Button } from "./ui/button";
import Link from "next/link";
import { CircleQuestionMark, Github, Linkedin, SquareArrowOutUpRight } from "lucide-react";


  const mdComponents: Components = {
    a: (props) => <a className="text-blue-600 hover:underline" {...props} />,
    h1: (props) => <h1 className="text-2xl md:text-3xl font-bold" {...props} />,
    h2: (props) => <h2 className="text-xl font-semibold" {...props} />,
    p: (props) => <p className="leading-7 mb-2" {...props} />,
    ul: (props) => <ul className="list-disc ml-6 space-y-1" {...props} />,
    ol: (props) => <ol className="list-decimal ml-6 space-y-1" {...props} />,
    blockquote: (props) => (
      <blockquote
        className="border-l-2 pl-4 italic text-muted-foreground"
        {...props}
      />
    ),
    code: (props) => {
      const { inline, className, children, ...rest } =
        props as React.HTMLAttributes<HTMLElement> & {
          inline?: boolean;
          className?: string;
        };
      if (inline)
        return (
          <code className="bg-muted px-1 rounded text-sm" {...rest}>
            {children}
          </code>
        );
      return (
        <pre className="bg-surface p-3 rounded overflow-auto">
          <code className={className as string} {...rest}>
            {children}
          </code>
        </pre>
      );
    },
    img: ({ alt, ...props }) => (
      <img alt={alt ?? ""} className="rounded-md border" {...props} />
    ),
  };

/**
 * Simple, accessible action buttons boilerplate.
 * Customize labels, ordering and styling as needed.
 */
const ActionButtons: React.FC<{ className?: string;
}> = ({ className = "" }) => {
    const [open, setOpen] = useState(false);
    const [architecture, setArchitecture] = useState<string>("");
    const [readme, setReadme] = useState<string>("");
    const [loading, setLoading] = useState(false);
  const [activeDoc, setActiveDoc] = useState<"architecture" | "readme">("architecture");

    useEffect(() => {
    if (!open || architecture || readme) return;
    
    startTransition(() => setLoading(true));
    Promise.all([
      fetch("/api/docs/architecture").then((r) => r.text()),
      fetch("/api/docs/readme").then((r) => r.text()),
    ])
      .then(([archMd, readmeMd]) => {
        setArchitecture(archMd);
        setReadme(readmeMd);
      })
      .finally(() => startTransition(() => setLoading(false)));
  }, [open, architecture, readme]);

    return (
        <div className={`action-buttons ${className}`.trim()}>
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
            <Button variant="outline">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75">
                <CircleQuestionMark className="relative inline-flex"/>
              </span>
              For Recruiters
            </Button>
         </SheetTrigger>
        <SheetContent>
          <div className="p-4 space-y-2">
            <SheetTitle>Quick links for review:</SheetTitle>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="default">
                <Link href="https://github.com/Inman2004/pastebin" target="_blank" rel="noreferrer"><Github /> GitHub</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="https://linkedin.com/in/rvimman" target="_blank" rel="noreferrer"><Linkedin />Profile</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="https://rvimmandev.vercel.app" target="_blank" rel="noreferrer"><SquareArrowOutUpRight /> More</Link>
              </Button>
            </div>
            <div className="text-sm leading-6 text-muted-foreground">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Open Docs to view architecture and README in sheets.</li>
                <li>Create a paste via the homepage form and submit.</li>
                <li>Copy the returned link and fetch it once to observe view counting.</li>
              </ol>
            </div>
            <div className="space-y-3">
              <SheetTitle>Docs inside sheet:</SheetTitle>
              <div className="flex gap-2">
                <Button
                  variant={activeDoc === "architecture" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveDoc("architecture")}
                >
                  Architecture
                </Button>
                <Button
                  variant={activeDoc === "readme" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveDoc("readme")}
                >
                  README
                </Button>
              </div>
              <div className="rounded border p-3 space-y-2 max-h-[60vh] overflow-auto">
                {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
                {!loading && activeDoc === "architecture" && architecture && (
                  <div className="prose dark:prose-invert max-w-none text-sm">
                    <ReactMarkdown components={mdComponents}>{architecture}</ReactMarkdown>
                  </div>
                )}
                {!loading && activeDoc === "readme" && readme && (
                  <div className="prose dark:prose-invert max-w-none text-sm">
                    <ReactMarkdown components={mdComponents}>{readme}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
        </div>
    );
};

export default ActionButtons;