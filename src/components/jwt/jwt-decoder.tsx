"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

interface DecodedJWT {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string | null;
}

interface JwtDecoderProps {
  onJwtChange?: (jwt: string) => void;
}

export function JwtDecoder({ onJwtChange }: JwtDecoderProps) {
  const [jwtToken, setJwtToken] = useState<string>("");
  const [decodedJwt, setDecodedJwt] = useState<DecodedJWT>({
    header: null,
    payload: null,
    signature: null,
  });

  const decodeJwt = useCallback(() => {
    if (!jwtToken.trim()) {
      toast.error("Please enter a JWT token");
      return;
    }

    try {
      const parts = jwtToken.split(".");
      if (parts.length !== 3) {
        throw new Error(
          "Invalid JWT format. Expected three parts separated by dots."
        );
      }

      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      const signature = parts[2];

      setDecodedJwt({
        header,
        payload,
        signature,
      });

      // Notify parent component about JWT change
      if (onJwtChange) {
        onJwtChange(jwtToken);
      }

      toast.success("JWT decoded successfully");
    } catch (error) {
      console.error("Error decoding JWT:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to decode JWT"
      );
    }
  }, [jwtToken, onJwtChange]);

  // Clear the JWT token and decoded data
  const clearJwt = () => {
    setJwtToken("");
    setDecodedJwt({
      header: null,
      payload: null,
      signature: null,
    });

    // Notify parent component about JWT change
    if (onJwtChange) {
      onJwtChange("");
    }
  };

  // Copy JSON to clipboard
  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${section} copied to clipboard`))
      .catch(() => toast.error("Failed to copy to clipboard"));
  };

  // Auto-decode when JWT changes
  useEffect(() => {
    if (jwtToken.trim()) {
      decodeJwt();
    } else {
      setDecodedJwt({
        header: null,
        payload: null,
        signature: null,
      });
    }
  }, [jwtToken, decodeJwt]);

  const formatJson = (json: Record<string, unknown> | null) => {
    if (!json) return "";
    return JSON.stringify(json, null, 2);
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          JWT Decoder
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm text-muted-foreground cursor-help">
                  ⓘ
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  JWT tokens consist of three parts: header, payload, and
                  signature.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>Enter a JWT token to decode it</CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Enter JWT token here (e.g., eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
              className="font-mono h-24"
              value={jwtToken}
              onChange={(e) => setJwtToken(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={decodeJwt} className="flex-1">
                Decode JWT
              </Button>
              <Button
                variant="outline"
                onClick={clearJwt}
                disabled={!jwtToken.trim()}
                className="flex-none"
              >
                Clear
              </Button>
            </div>
          </div>

          {(decodedJwt.header || decodedJwt.payload) && (
            <Tabs defaultValue="payload" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="payload">Payload</TabsTrigger>
                <TabsTrigger value="header">Header</TabsTrigger>
                <TabsTrigger value="signature">Signature</TabsTrigger>
              </TabsList>
              <TabsContent value="payload" className="space-y-2">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-md overflow-auto text-sm font-mono">
                    {formatJson(decodedJwt.payload)}
                  </pre>
                  {decodedJwt.payload && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 opacity-70 hover:opacity-100"
                      onClick={() =>
                        copyToClipboard(
                          formatJson(decodedJwt.payload),
                          "Payload"
                        )
                      }
                    >
                      Copy
                    </Button>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="header" className="space-y-2 pt-2">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-md overflow-auto text-sm font-mono">
                    {formatJson(decodedJwt.header)}
                  </pre>
                  {decodedJwt.header && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 opacity-70 hover:opacity-100"
                      onClick={() =>
                        copyToClipboard(formatJson(decodedJwt.header), "Header")
                      }
                    >
                      Copy
                    </Button>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="signature" className="space-y-2 pt-2">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-md overflow-auto text-sm font-mono break-all">
                    {decodedJwt.signature || ""}
                  </pre>
                  {decodedJwt.signature && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 opacity-70 hover:opacity-100"
                      onClick={() =>
                        copyToClipboard(decodedJwt.signature || "", "Signature")
                      }
                    >
                      Copy
                    </Button>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
