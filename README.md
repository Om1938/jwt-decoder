# JWT Decoder and Verifier Tool

A modern web application built with Next.js, React, TypeScript, and shadcn/ui to decode and verify JWT (JSON Web Tokens).

## Features

- **JWT Decoding**: Parse and display JWT token header, payload, and signature
- **JWT Verification**:
  - Asymmetric key verification (RSA/EC) using public keys in PEM format
  - Symmetric key verification (HMAC) using shared secret keys
- **OpenID Connect Support**: Verify tokens by fetching JWKs from OpenID providers
- **CORS Proxy Integration**: Automatic fallback to corsproxy.io for CORS-blocked OpenID providers
- **Modern UI**: Built with shadcn/ui components for a clean, accessible interface
- **Dark Mode Support**: Fully responsive design with dark mode support

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Form Handling**: React Hook Form with Zod validation
- **JWT Libraries**: jose for JWT verification

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Om1938/jwt-decoder.git
   cd jwt-decoder
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Usage

### Decoding JWT

1. Paste your JWT token into the textarea
2. The token will be automatically decoded
3. View the header, payload, and signature in the tabs below

### Verifying JWT

#### With Asymmetric Keys (RSA/EC)

1. Navigate to the "Verify" tab
2. Select "Public Key (RSA/EC)" verification method
3. Paste your JWT token
4. Enter the public key in PEM format
5. Optionally select an algorithm (if not specified in the token header)
6. Click "Verify JWT"

#### With Symmetric Keys (HMAC)

1. Navigate to the "Verify" tab
2. Select "Secret Key (HMAC)" verification method
3. Paste your JWT token
4. Enter the secret key that was used to sign the token
5. Select the HMAC algorithm (HS256, HS384, or HS512)
6. Click "Verify JWT"

#### With OpenID Provider

1. Navigate to the "Verify" tab
2. Select "OpenID Provider" verification method
3. Paste your JWT token
4. Enter the OpenID issuer URL (e.g., `https://your-identity-provider.com/`)
5. Optionally enable "Use CORS Proxy" if you experience CORS issues with the provider
6. Click "Verify with OpenID Provider"

### CORS Proxy Feature

If you encounter CORS (Cross-Origin Resource Sharing) issues when verifying tokens with OpenID providers, the app includes:

- Automatic fallback to corsproxy.io if direct requests fail due to CORS
- Manual option to enable the CORS proxy for all OpenID-related requests
- This allows verification against OpenID providers that don't have CORS properly configured

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
