# Streaming SMB Network Drive Browser

A web-based SMB/CIFS network share explorer built with Next.js, featuring efficient server-side file streaming, a lazy-loading directory browser with React Suspense, chunked ZIP downloads, and a rich dark/light mode React UI.

## Features

- **Efficient Streaming**: Both single files and ZIP archives are streamed directly from the SMB server to the Next.js client response stream, minimizing memory consumption for large file drops.
- **Lazy Loaded Folders**: Fast UI interactions using a robust caching layer and directory loading fetching directly from Next.js server on expand.
- **File Management API**: Full CRUD capabilities including download, upload (streaming with busboy), list directories, and delete.
- **Preview System**: Ability to preview standard images and text documents inline directly from the SMB server.
- **Security Check**: Safe path sanitization preventing path traversal exploits. 
- **Docker Compose Environment**: Comes with an out-of-the-box local testing Samba server.

## Technologies

- **Next.js** (Pages router for fully separated API and Client)
- **Node.js**: Underlying runtime for `busboy`, `archiver`, and `@marsaud/smb2`.
- **TypeScript**: Typed application API endpoints.
- **Tailwind CSS**: Beautifully styled frontend UI components with dark mode support.
- **Lucide.React**: Modern icon sets.

## Running Locally

1. **Install Dependencies**:
```bash
npm install
```

2. **Start the Development Samba Server**:
Run the following command to spin up the local samba sandbox container.
```bash
docker-compose up -d
```
*Note*: This container will mount a share to a non-default user, configured in `docker-compose.yml`.

3. **Configure Environment Variables**:
Copy the example environment credentials into `.env.local` to securely pass it to Next.js.
```bash
cp .env.example .env.local
```

4. **Launch Next.js App**:
```bash
npm run dev
```

Visit the application at `http://localhost:3000`.

## Testing the API 

You can use the endpoints automatically via the web UI, or manual cURL requests:
- `GET /api/smb/list?path=/`
- `GET /api/smb/download?path=/example.txt`
- `POST /api/smb/download-zip` (application/json body w/ paths list array)
- `POST /api/smb/upload?path=/` (multipart/form-data)
- `DELETE /api/smb/delete?path=/example.txt`
- `GET /api/smb/preview?path=/example.txt`
