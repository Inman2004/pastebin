import { notFound } from 'next/navigation';
import { getStore } from '@/lib/store';
import { getNow } from '@/lib/time';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge"; // I might need to install badge if not already
import { Button } from "@/components/ui/button";
import { Clock, Eye, Calendar, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import Markdown, { type Components } from 'react-markdown';

// Need to install badge component? I'll check if it exists or use standard UI.
// I'll stick to standard UI elements I installed or standard HTML if minor.
// Actually, let's install badge. It's good for labels.
// I'll do it in a separate step or just use span classes for now to be safe.
// I'll use simple spans with Tailwind classes for badges to avoid extra installation steps unless necessary.

export default async function PastePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = getStore();
  const now = await getNow();

  const paste = await store.getPaste(id);

  if (!paste) {
    notFound();
  }

  // Check TTL
  if (paste.expires_at && now > paste.expires_at) {
    notFound();
  }

  // Check Max Views
  if (paste.max_views !== undefined) {
    if (paste.views >= paste.max_views) {
      notFound();
    }
  }

  await store.incrementView(id);

  // Calculate remaining
  let remainingText = "Unlimited";
  if (paste.max_views !== undefined) {
    const left = Math.max(0, paste.max_views - (paste.views + 1));
    remainingText = `${left} remaining`;
  }

  const mdComponents: Components = {
    a: (props) => <a className="text-blue-600 hover:underline" {...props} />,
    h1: (props) => <h1 className="text-2xl md:text-3xl font-bold" {...props} />,
    h2: (props) => <h2 className="text-xl font-semibold" {...props} />,
    p: (props) => <p className="leading-7 mb-2" {...props} />,
    ul: (props) => <ul className="list-disc ml-6 space-y-1" {...props} />,
    ol: (props) => <ol className="list-decimal ml-6 space-y-1" {...props} />,
    blockquote: (props) => <blockquote className="border-l-2 pl-4 italic text-muted-foreground" {...props} />,
    code: (props) => {
      const { inline, className, children, ...rest } = props as React.HTMLAttributes<HTMLElement> & { inline?: boolean; className?: string };
      if (inline) return <code className="bg-muted px-1 rounded text-sm" {...rest}>{children}</code>;
      return <pre className="bg-surface p-3 rounded overflow-auto"><code className={className as string} {...rest}>{children}</code></pre>;
    },
    img: ({ alt, ...props }) => <img alt={alt ?? ''} className="rounded-md border" {...props} />,
  };

  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b bg-muted/50 rounded-t-lg">
          <CardTitle className="text-xl font-mono">Paste {id}</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Paste
            </Link>
          </Button>
          <AnimatedThemeToggler className="absolute top-4 right-4" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="bg-background text-foreground p-6 overflow-x-auto min-h-[200px]">
            <Markdown components={mdComponents}>{paste.content}</Markdown>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 border-t p-4 text-xs text-muted-foreground flex flex-wrap gap-4 justify-between items-center rounded-b-lg">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1" title="Created At">
                    <Calendar className="h-3 w-3" />
                    {new Date(paste.created_at).toLocaleString()}
                </span>
                {paste.expires_at && (
                    <span className="flex items-center gap-1 text-orange-600 font-medium" title="Expires At">
                        <Clock className="h-3 w-3" />
                        {new Date(paste.expires_at).toLocaleString()}
                    </span>
                )}
            </div>

            {paste.max_views !== undefined && (
                <div className="flex items-center gap-1 font-medium text-blue-600">
                    <Eye className="h-3 w-3" />
                    {remainingText}
                </div>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
