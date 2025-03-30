"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JwtDecoder } from "./jwt-decoder";
import { JwtVerifier } from "./jwt-verifier";

export function JwtTool() {
  const [activeTab, setActiveTab] = useState<string>("decode");
  const [currentJwt, setCurrentJwt] = useState<string>("");

  // Update the current JWT when decoded
  const handleJwtChange = (jwt: string) => {
    setCurrentJwt(jwt);
  };

  // Reset verification results when switching tabs
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="container w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">JWT Decoder & Verifier</h1>
      <p className="text-sm sm:text-base text-muted-foreground">
        A tool to decode and verify JWT (JSON Web Token) tokens.
      </p>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-2">
          <TabsTrigger value="decode" className="text-sm">
            Decode
          </TabsTrigger>
          <TabsTrigger value="verify" className="text-sm">
            Verify
          </TabsTrigger>
        </TabsList>

        <TabsContent value="decode" className="mt-4">
          <JwtDecoder onJwtChange={handleJwtChange} />
        </TabsContent>

        <TabsContent value="verify" className="mt-4">
          <JwtVerifier jwtToken={currentJwt} />
        </TabsContent>
      </Tabs>

      <footer className="text-center text-sm text-muted-foreground mt-8 pt-4 border-t">
        <p>
          Built with Next.js, TypeScript, and shadcn/ui. No JWT tokens are
          stored or sent to any server.
        </p>
      </footer>
    </div>
  );
}
