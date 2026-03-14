# Streaming SMB Network Drive Browser 🗄️

A robust, web-based SMB/CIFS network share explorer built with Next.js. This application features efficient server-side file streaming, a lazy-loading directory browser using React Suspense, chunked ZIP downloads, and a rich, responsive UI with dark/light mode support.

## 🌟 Core Features

- **Efficient Data Streaming**: Single files and bulk ZIP archives are streamed directly from the SMB server transparently through the Next.js API to the client. This circumvents memory buffering limits and ensures high scalability on large file streams.
- **Lazy Loaded Directory Tree**: Fast UI interactions utilizing a robust client-side caching wrapper paired with dynamic React fetching directly from the backend server upon directory expansion.
- **Full File Management CRUD**: End-to-end capabilities including downloading, uploading (streaming with `busboy`), listing directories, and recursive or single deletions.
- **Inline Preview System**: Seamlessly preview standard image formats and text documents natively in the UI straight from the SMB server.
- **Security Validation**: Built-in path sanitization on all API routes to safeguard against directory traversal exploits (e.g., locking out `../` escapes).
- **Out-of-the-box Testing Environment**: Includes a completely dockerized, cross-platform Samba testing server utilizing `dperson/samba` for immediate local deployment and validation.

## 🛠️ Technology Stack

- **Frontend**: Next.js (Pages Router) / React / Tailwind CSS / Lucide React Icons
- **Backend API**: Next.js Serverless Functions / Node.js
- **Core Integrations**:
  - `@marsaud/smb2`: The core SMB connection library.
  - `busboy`: High-performance streaming multipart data un-packer for file uploads.
  - `archiver`: Streaming interface for dynamic ZIP generation.
- **Containerization**: Docker & Docker Compose

---

## 🚀 Getting Started

Follow these instructions to set up the project locally for development and testing.

### Prerequisites

Ensure you have the following installed on your machine:
- Node.js (v18.x or above recommended)
- Docker & Docker Compose
- Git

### 1. Installation

Clone the repository and install the Node.js dependencies:

```bash
npm install
```

### 2. Configure Environment Variables

The application relies on secure configuration via environment variables. Copy the provided example to create your local environment state:

```bash
cp .env.example .env.local
```

If you are using the bundled Docker Samba testing server, the default variables provided inside `.env.example` (`user`, `pass`, `4451`) correlate internally directly with the sandbox containers.

### 3. Spin up the Testing Samba Server

A fully configured local Samba server sandbox is provided via Docker. Boot it up dynamically:

```bash
docker-compose up -d
```

> **Note**: The `docker-compose.yml` mounts the simulated SMB array with a specific permissions structure (`-p`) and eliminates the native recycle bin (`-r`) to ensure strict compatibility with the Next.js deletion routes. The ports are bound locally to `1391` and `4451` to prevent clashing with native Windows mapped drives on port 445.

### 4. Run the Next.js Application

Start the local development server:

```bash
npm run dev
```

Visit the application at: **[http://localhost:3000](http://localhost:3000)**

---

## 📖 API Documentation

The server exposes several endpoints that securely proxy actions to the underlying SMB server. You can interact with these endpoints directly:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/smb/list?path=/` | Retrieves directory layout and file states within a specified path. |
| `GET` | `/api/smb/download?path=/test.jpg` | Streams the targeted file payload directly to client download buffer. |
| `POST` | `/api/smb/download-zip` | Takes a JSON body array (`{"paths": ["/folder"]}`) and dynamically zips targets. |
| `POST` | `/api/smb/upload?path=/` | Accepts `multipart/form-data` file uploads to precisely defined target root. |
| `DELETE` | `/api/smb/delete?path=/test.txt` | Unlinks a particular file, or safely resolves and recursively clears directories. |
| `GET` | `/api/smb/preview?path=/test.txt` | Interprets standard media types and returns visual buffers for inline frontend display. |

## 🛡️ Best Practices & Quality Checks Applied

- **Socket Architecture (`EISCONN` Hardening)**: The `@marsaud/smb2` client is strictly isolated to instantiation-per-request within a controlled `try/catch/finally` block to prevent Socket memory leaks or `EISCONN` overlap conflicts during large or concurrent loads.
- **OpenSSL Cryptography Safety**: Enforced runtime configurations `NODE_OPTIONS=--openssl-legacy-provider` inside `package.json` compilation steps to ensure NTLM protocol hashes correctly process on legacy MD4 ciphers using modern Node.js runtimes.

## 📝 License

This project is open-source and submitted as evaluation infrastructure. No sensitive secrets are stored within the version control history.
