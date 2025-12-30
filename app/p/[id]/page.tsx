import { notFound } from 'next/navigation';
import { getStore } from '@/lib/store';
import { getNow } from '@/lib/time';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // I might need to install badge if not already
import { Button } from "@/components/ui/button";
import { Clock, Eye, Calendar, PlusCircle } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b bg-muted/50 rounded-t-lg">
          <CardTitle className="text-xl font-mono">Paste {id}</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <a href="/">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Paste
            </a>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="bg-neutral-950 text-neutral-50 p-6 overflow-x-auto min-h-[200px]">
            <pre className="font-mono text-sm whitespace-pre-wrap">{paste.content}</pre>
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
