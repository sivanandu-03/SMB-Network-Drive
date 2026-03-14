import SMB2 from '@marsaud/smb2';
import path from 'path';

export class SMBClient {
  private getClient(): SMB2 {
    return new SMB2({
      share: `\\\\${process.env.SMB_HOST}\\${process.env.SMB_SHARE}`,
      domain: '',
      username: process.env.SMB_USERNAME || '',
      password: process.env.SMB_PASSWORD || '',
      port: parseInt(process.env.SMB_PORT || '445', 10),
      autoCloseTimeout: 0,
    });
  }

  private sanitizePath(reqPath: string): string {
    const normalized = path.posix.normalize('/' + reqPath);
    return normalized.replace(/^\/+/, '').replace(/\//g, '\\');
  }

  async list(reqPath: string) {
    const client = this.getClient();
    const cleanPath = this.sanitizePath(reqPath);
    try {
      const files = await client.readdir(cleanPath, { stats: true } as any);
      return files.map((f: any) => ({
        name: f.name,
        type: f.isDirectory() ? 'directory' : 'file',
        size: f.size || 0,
        lastModified: (f.mtime || new Date()).toISOString(),
      }));
    } catch (err: any) {
      throw err;
    } finally {
      try { client.disconnect(); } catch (e) { }
    }
  }

  async createReadStream(reqPath: string) {
    const client = this.getClient();
    const cleanPath = this.sanitizePath(reqPath);
    const stream = await client.createReadStream(cleanPath) as any;
    let closed = false;
    const cleanup = () => {
      if (!closed) {
        closed = true;
        try { client.disconnect(); } catch (e) { }
      }
    };
    stream.on('end', cleanup);
    stream.on('error', cleanup);
    stream.on('close', cleanup);
    return stream;
  }

  async createWriteStream(reqPath: string) {
    const client = this.getClient();
    const cleanPath = this.sanitizePath(reqPath);
    const stream = await client.createWriteStream(cleanPath) as any;
    let closed = false;
    const cleanup = () => {
      if (!closed) {
        closed = true;
        try { client.disconnect(); } catch (e) { }
      }
    };
    stream.on('finish', cleanup);
    stream.on('error', cleanup);
    stream.on('close', cleanup);
    return stream;
  }

  async deleteFile(reqPath: string) {
    const client = this.getClient();
    const cleanPath = this.sanitizePath(reqPath);
    try {
      return await client.unlink(cleanPath);
    } catch (e: any) {
      if (e.code === 'STATUS_FILE_IS_A_DIRECTORY') {
        return await client.rmdir(cleanPath);
      }
      throw e;
    } finally {
      try { client.disconnect(); } catch (e) { }
    }
  }

  async stat(reqPath: string) {
    const client = this.getClient();
    const cleanPath = this.sanitizePath(reqPath);
    try {
      return await client.stat(cleanPath);
    } finally {
      try { client.disconnect(); } catch (e) { }
    }
  }
}

export const smbClient = new SMBClient();
