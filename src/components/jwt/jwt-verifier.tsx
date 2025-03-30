"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as jose from "jose";
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
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Form schema for asymmetric key verification (RSA/EC)
const asymmetricKeyFormSchema = z.object({
  token: z.string().min(1, { message: "JWT token is required" }),
  publicKey: z.string().min(1, { message: "Public key is required" }),
  algorithm: z.string().optional(),
});

// Form schema for symmetric key verification (HMAC)
const symmetricKeyFormSchema = z.object({
  token: z.string().min(1, { message: "JWT token is required" }),
  secretKey: z.string().min(1, { message: "Secret key is required" }),
  algorithm: z.enum(["HS256", "HS384", "HS512"]).default("HS256"),
});

// Form schema for OpenID provider verification
const openIdFormSchema = z.object({
  token: z.string().min(1, { message: "JWT token is required" }),
  issuerUrl: z.string().url({ message: "Valid issuer URL is required" }),
  useCorsProxy: z.boolean().default(false),
});

type AsymmetricKeyFormValues = z.infer<typeof asymmetricKeyFormSchema>;
type SymmetricKeyFormValues = z.infer<typeof symmetricKeyFormSchema>;
type OpenIdFormValues = z.infer<typeof openIdFormSchema>;

// Helper function to handle fetch with CORS proxy fallback
async function fetchWithCorsProxyFallback(url: string, useCorsProxy: boolean) {
  try {
    // Try direct fetch first if not using CORS proxy by default
    if (!useCorsProxy) {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
      // If direct fetch fails and it might be due to CORS, fall through to proxy
    }

    // Use CORS proxy
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const proxyResponse = await fetch(proxyUrl);

    if (!proxyResponse.ok) {
      throw new Error(
        `Failed to fetch from ${url} (with CORS proxy): ${proxyResponse.statusText}`
      );
    }

    return proxyResponse;
  } catch (error) {
    if (useCorsProxy) {
      // If already using proxy and it failed, throw the error
      throw error;
    }

    // Try with proxy if direct fetch failed
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const proxyResponse = await fetch(proxyUrl);

    if (!proxyResponse.ok) {
      throw new Error(
        `Failed to fetch from ${url} (with CORS proxy fallback): ${proxyResponse.statusText}`
      );
    }

    return proxyResponse;
  }
}

export function JwtVerifier({ jwtToken = "" }: { jwtToken?: string }) {
  const [verificationMethod, setVerificationMethod] = useState<
    "asymmetricKey" | "symmetricKey" | "openId"
  >("asymmetricKey");
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    message: string;
    details?: Record<string, unknown>;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Form for asymmetric key verification (RSA/EC)
  const asymmetricKeyForm = useForm<AsymmetricKeyFormValues>({
    resolver: zodResolver(asymmetricKeyFormSchema),
    defaultValues: {
      token: jwtToken,
      publicKey: "",
      algorithm: "RS256",
    },
  });

  // Form for symmetric key verification (HMAC)
  const symmetricKeyForm = useForm<SymmetricKeyFormValues>({
    resolver: zodResolver(symmetricKeyFormSchema),
    defaultValues: {
      token: jwtToken,
      secretKey: "",
      algorithm: "HS256",
    },
  });

  // Form for OpenID provider verification
  const openIdForm = useForm<OpenIdFormValues>({
    resolver: zodResolver(openIdFormSchema),
    defaultValues: {
      token: jwtToken,
      issuerUrl: "",
      useCorsProxy: false,
    },
  });

  // Clear verification result when changing tabs
  const handleTabChange = (value: string) => {
    setVerificationMethod(value as "asymmetricKey" | "symmetricKey" | "openId");
    setVerificationResult(null);
  };

  // Sync token across all forms when jwtToken prop changes
  useEffect(() => {
    if (jwtToken) {
      asymmetricKeyForm.setValue("token", jwtToken);
      symmetricKeyForm.setValue("token", jwtToken);
      openIdForm.setValue("token", jwtToken);
    }
  }, [jwtToken, asymmetricKeyForm, symmetricKeyForm, openIdForm]);

  // Verify JWT with asymmetric key (RSA/EC)
  const verifyWithAsymmetricKey = async (values: AsymmetricKeyFormValues) => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const { token, publicKey, algorithm } = values;

      // Parse token to extract header for algorithm detection if not specified
      const tokenHeader = JSON.parse(atob(token.split(".")[0]));
      const alg = algorithm || tokenHeader.alg || "RS256";

      // Create a public key object from the provided PEM
      const publicKeyObj = await jose.importSPKI(publicKey, alg);

      // Verify the token
      const result = await jose.jwtVerify(token, publicKeyObj, {
        algorithms: [alg],
      });

      setVerificationResult({
        isValid: true,
        message: "Token successfully verified with asymmetric key",
        details: {
          payload: result.payload,
          protectedHeader: result.protectedHeader,
        },
      });

      toast.success("JWT verified successfully");
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationResult({
        isValid: false,
        message: error instanceof Error ? error.message : "Verification failed",
      });

      toast.error("JWT verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  // Verify JWT with symmetric key (HMAC)
  const verifyWithSymmetricKey = async (values: SymmetricKeyFormValues) => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const { token, secretKey, algorithm } = values;

      // Create a secret key from the provided string
      const secretKeyUint8 = new TextEncoder().encode(secretKey);

      // Verify the token
      const result = await jose.jwtVerify(token, secretKeyUint8, {
        algorithms: [algorithm],
      });

      setVerificationResult({
        isValid: true,
        message: "Token successfully verified with symmetric key",
        details: {
          payload: result.payload,
          protectedHeader: result.protectedHeader,
        },
      });

      toast.success("JWT verified successfully");
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationResult({
        isValid: false,
        message: error instanceof Error ? error.message : "Verification failed",
      });

      toast.error("JWT verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  // Verify JWT with OpenID provider
  const verifyWithOpenId = async (values: OpenIdFormValues) => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const { token, issuerUrl, useCorsProxy } = values;

      // Fetch OpenID configuration
      const openIdConfigUrl = issuerUrl.endsWith("/")
        ? `${issuerUrl}.well-known/openid-configuration`
        : `${issuerUrl}/.well-known/openid-configuration`;

      const configResponse = await fetchWithCorsProxyFallback(
        openIdConfigUrl,
        useCorsProxy
      );
      const config = await configResponse.json();
      const jwksUri = config.jwks_uri;

      if (!jwksUri) {
        throw new Error("JWKS URI not found in OpenID configuration");
      }

      // Fetch JWKS
      const jwksResponse = await fetchWithCorsProxyFallback(
        jwksUri,
        useCorsProxy
      );
      const jwks = await jwksResponse.json();

      // Parse token to get kid from header
      const tokenParts = token.split(".");
      const tokenHeader = JSON.parse(atob(tokenParts[0]));
      const kid = tokenHeader.kid;

      if (!kid) {
        throw new Error("Token header does not contain a key ID (kid)");
      }

      // Find the matching JWK
      const matchingKey = jwks.keys.find(
        (key: { kid: string }) => key.kid === kid
      );

      if (!matchingKey) {
        throw new Error(`No matching key found for kid: ${kid}`);
      }

      // Create JWKS
      const jwksInstanceUrl = useCorsProxy
        ? `https://corsproxy.io/?${encodeURIComponent(jwksUri)}`
        : jwksUri;
      const jwksInstance = jose.createRemoteJWKSet(new URL(jwksInstanceUrl));

      // Verify the token
      const result = await jose.jwtVerify(token, jwksInstance, {
        issuer: config.issuer,
      });

      setVerificationResult({
        isValid: true,
        message: "Token successfully verified with OpenID provider",
        details: {
          payload: result.payload,
          protectedHeader: result.protectedHeader,
        },
      });

      toast.success("JWT verified successfully with OpenID provider");
    } catch (error) {
      console.error("OpenID verification error:", error);
      setVerificationResult({
        isValid: false,
        message:
          error instanceof Error ? error.message : "OpenID verification failed",
      });

      toast.error("JWT verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle>JWT Verifier</CardTitle>
        <CardDescription>
          Verify a JWT token using different methods
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto px-2 sm:px-6">
        <Tabs
          value={verificationMethod}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="w-full">
            <TabsTrigger value="asymmetricKey" className="text-xs sm:text-sm">
              Public Key (RSA/EC)
            </TabsTrigger>
            <TabsTrigger value="symmetricKey" className="text-xs sm:text-sm">
              Secret Key (HMAC)
            </TabsTrigger>
            <TabsTrigger value="openId" className="text-xs sm:text-sm">
              OpenID Provider
            </TabsTrigger>
          </TabsList>

          <TabsContent value="asymmetricKey" className="space-y-4">
            <Form {...asymmetricKeyForm}>
              <form
                onSubmit={asymmetricKeyForm.handleSubmit(
                  verifyWithAsymmetricKey
                )}
                className="space-y-4"
              >
                <FormField
                  control={asymmetricKeyForm.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>JWT Token</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter JWT token here"
                          className="font-mono h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={asymmetricKeyForm.control}
                  name="publicKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Public Key (PEM Format)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
                          className="font-mono h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={asymmetricKeyForm.control}
                  name="algorithm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Algorithm (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select algorithm" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="RS256">RS256</SelectItem>
                          <SelectItem value="RS384">RS384</SelectItem>
                          <SelectItem value="RS512">RS512</SelectItem>
                          <SelectItem value="ES256">ES256</SelectItem>
                          <SelectItem value="ES384">ES384</SelectItem>
                          <SelectItem value="ES512">ES512</SelectItem>
                          <SelectItem value="PS256">PS256</SelectItem>
                          <SelectItem value="PS384">PS384</SelectItem>
                          <SelectItem value="PS512">PS512</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isVerifying}>
                  {isVerifying ? "Verifying..." : "Verify JWT"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="symmetricKey" className="space-y-4">
            <Form {...symmetricKeyForm}>
              <form
                onSubmit={symmetricKeyForm.handleSubmit(verifyWithSymmetricKey)}
                className="space-y-4"
              >
                <FormField
                  control={symmetricKeyForm.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>JWT Token</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter JWT token here"
                          className="font-mono h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={symmetricKeyForm.control}
                  name="secretKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secret Key</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the secret key used to sign the JWT"
                          className="font-mono h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This is the secret key that was used to sign the JWT
                        with an HMAC algorithm (HS256, HS384, HS512)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={symmetricKeyForm.control}
                  name="algorithm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Algorithm</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select algorithm" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="HS256">HS256</SelectItem>
                          <SelectItem value="HS384">HS384</SelectItem>
                          <SelectItem value="HS512">HS512</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isVerifying}>
                  {isVerifying ? "Verifying..." : "Verify JWT"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="openId" className="space-y-4">
            <Form {...openIdForm}>
              <form
                onSubmit={openIdForm.handleSubmit(verifyWithOpenId)}
                className="space-y-4"
              >
                <FormField
                  control={openIdForm.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>JWT Token</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter JWT token here"
                          className="font-mono h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={openIdForm.control}
                  name="issuerUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OpenID Issuer URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://your-identity-provider.com/"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={openIdForm.control}
                  name="useCorsProxy"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Use CORS Proxy</FormLabel>
                        <FormDescription>
                          Enable this if you experience CORS errors with the
                          OpenID provider
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isVerifying}>
                  {isVerifying ? "Verifying..." : "Verify with OpenID Provider"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        {verificationResult && (
          <div
            className={`mt-6 p-4 rounded-md border ${
              verificationResult.isValid
                ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                verificationResult.isValid
                  ? "text-green-800 dark:text-green-300"
                  : "text-red-800 dark:text-red-300"
              }`}
            >
              {verificationResult.isValid ? "✓ " : "✗ "}
              {verificationResult.message}
            </p>

            {verificationResult.details && verificationResult.isValid && (
              <div className="mt-2">
                <p className="text-xs text-green-700 dark:text-green-400 mb-1">
                  Verification details:
                </p>
                <pre className="text-xs bg-green-100 dark:bg-green-900 p-2 rounded overflow-auto max-h-48">
                  {JSON.stringify(verificationResult.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
