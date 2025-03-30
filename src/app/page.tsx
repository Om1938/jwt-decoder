import { JwtTool } from "@/components/jwt/jwt-tool";

export default function Home() {
  return (
    <div className="min-h-screen bg-background py-4 sm:py-8">
      <JwtTool />
    </div>
  );
}
