"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  RefreshCw,
} from "lucide-react";
import type { Components } from "react-markdown";
import { Spinner } from "@/components/ui/spinner";
import ActionButtons from "@/components/ActionButtons";

export default function Home() {
  const [content, setContent] = useState("");
  const [ttl, setTtl] = useState<string>("");
  const [maxViews, setMaxViews] = useState<string>("");
  const [result, setResult] = useState<{ id: string; url: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setError(null);
    setLoading(true);

    try {
      interface PastePayload {
        content: string;
        ttl_seconds?: number;
        max_views?: number;
      }

      const payload: PastePayload = { content };
      if (ttl) payload.ttl_seconds = parseInt(ttl, 10);
      if (maxViews) payload.max_views = parseInt(maxViews, 10);

      const res = await fetch("/api/pastes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create paste");
      }

      setResult(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result.url);
    }
  };

  const resetForm = () => {
    setResult(null);
    setContent("");
    setTtl("");
    setMaxViews("");
  };

  return (
    <div className="min-h-screen bg-background flex gap-4 items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <ActionButtons />
      </div>
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Pastebin Lite</CardTitle>
          <CardDescription>
            Share text securely with optional expiration.
          </CardDescription>
          <AnimatedThemeToggler className="absolute top-4 right-4" />
        </CardHeader>
        <CardContent>
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  required
                  placeholder="Paste your text here..."
                  className="min-h-[150px]"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ttl">TTL (Seconds)</Label>
                  <Input
                    id="ttl"
                    type="number"
                    min="1"
                    placeholder="Optional"
                    value={ttl}
                    onChange={(e) => setTtl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxViews">Max Views</Label>
                  <Input
                    id="maxViews"
                    type="number"
                    min="1"
                    placeholder="Optional"
                    value={maxViews}
                    onChange={(e) => setMaxViews(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex gap-2 items-center">
                    <Spinner /> Creating...
                  </span>
                ) : (
                  "Create Paste"
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <Alert className="bg-green-100 dark:bg-green-600/10 text-green-900 dark:text-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Your paste has been created successfully.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Share URL</Label>
                <div className="flex space-x-2">
                  <Input readOnly value={result.url} />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button asChild className="flex-1">
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" /> View Paste
                  </a>
                </Button>
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Create Another
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
