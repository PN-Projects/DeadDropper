# DeadDropper - Secure Anonymous File Sharing

**"Drop it. Encrypt it. Forget it."**

Anonymous, end-to-end encrypted file sharing — no accounts, no servers that can read your data.

## Features

- 🔒 **End-to-End Encrypted** - Files encrypted on your device before upload
- ⚡ **Lightning Fast** - Optimized chunked uploads for maximum speed
- 🚫 **No Login Required** - Share files without creating an account
- 🔥 **Auto-Burn** - Files automatically deleted after pickup or scheduled time
- 📱 **Mobile Friendly** - Responsive design works on all devices
- 🌐 **Multi-Language** - English and Hindi support

## Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd deaddropper

# Install dependencies
npm install

# Install required additional packages (if not auto-installed)
npm install framer-motion qrcode.react react-dropzone

# Start development server
npm run dev
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion
- **File Handling**: react-dropzone
- **QR Codes**: qrcode.react
- **Routing**: React Router v6

## Architecture Overview

### Client-Side Encryption

All encryption happens in the browser using AES-GCM before files are uploaded:

1. User selects files via drag-and-drop or file picker
2. Files are split into chunks
3. Each chunk is encrypted with AES-GCM
4. Each chunk is hashed with SHA-256 for integrity
5. Encrypted chunks are uploaded to S3 via presigned URLs

### API Endpoints (To be implemented)

- `POST /api/presign` - Get presigned URLs for chunk upload
- `POST /api/drops` - Create a new drop and get 6-digit code
- `GET /api/drops/:code` - Retrieve drop metadata and manifest
- `DELETE /api/drops/:code` - Burn a drop (auto-triggered after download)

### Security Features

- **Zero-knowledge architecture** - Server never sees unencrypted data
- **Per-chunk encryption** - AES-GCM with unique IVs
- **Integrity verification** - SHA-256 hashing for each chunk
- **Auto-burn** - Configurable TTL (60min, 2hrs, 6hrs, 12hrs, 24hrs)
- **30-second burn after pickup** - Files deleted shortly after download

## Pages

- **Home** - Hero page with Drop and PickUp CTAs
- **Drop** - Upload files with encryption and QR code generation
- **PickUp** - Retrieve files using 6-digit code
- **Why DeadDropper** - Benefits and comparisons
- **FAQ** - Frequently asked questions
- **Security** - Detailed security architecture
- **Who are We** - Team and organization info
- **Our Vision** - Roadmap and future features

## UI Components

All components located in `/src/components/ui/`:

- `blur-fade.tsx` - Animated fade-in component
- `interactive-hover-button.tsx` - Animated CTA button
- `alert.tsx` - Alert/notification component with variants
- Standard shadcn components (button, card, input, etc.)

## Development Notes

### QR Code Library

The project uses `qrcode.react` for QR code generation. The QR code encodes:
- Drop ID (6-digit code)
- Encrypted master key/token (depending on your backend implementation)

### Stub Implementation

Current implementation includes UI stubs for:
- File upload flow (to be connected to `/api/presign` and `/api/drops`)
- File download flow (to be connected to `/api/drops/:code`)
- Encryption/decryption logic (to be implemented with Web Crypto API)

### Backend Integration

To complete the full implementation, you need to:

1. Implement presigned URL generation for S3/compatible storage
2. Create drop manifest storage (encrypted metadata)
3. Implement auto-burn scheduling (TTL + post-download)
4. Add Web Crypto API for AES-GCM encryption/decryption
5. Implement chunk upload/download logic

## Environment Variables

No environment variables needed for frontend-only development.

For full backend integration, configure:
- S3 bucket details
- API endpoint URLs
- CORS settings

## Contributing

DeadDropper is an open-source project by TeamPrabodhNandini. Contributions welcome!

GitHub: [https://github.com/PN-Projects](https://github.com/PN-Projects)

## License

[Add license information]

## Credits

- **Team**: TeamPrabodhNandini
- **Lead Developer**: Anand Sharma
  - [LinkedIn](https://www.linkedin.com/in/sharma-anand47/)
  - [GitHub](https://github.com/PanotiProgrammer)

---

**Privacy is not a feature. It's a fundamental right.**
