import { NextApiRequest, NextApiResponse } from 'next';
import { smbClient } from '../../../lib/smb-client';
import { handleSmbError } from '../../../lib/api-error';
import pathLib from 'path';
import Busboy from 'busboy';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();
    const folderPath = (req.query.path as string) || '/';

    if (!req.headers['content-type']?.includes('multipart/form-data')) {
        return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
    }

    const busboy = Busboy({ headers: req.headers });
    let uploadError: any = null;
    let savedPath: string | null = null;
    const writePromises: Promise<any>[] = [];

    busboy.on('file', (name: string, file: NodeJS.ReadableStream, info: any) => {
        const filename = info.filename;
        const destPath = pathLib.posix.join(folderPath, filename);
        savedPath = destPath;

        const promise = smbClient.createWriteStream(destPath)
            .then((writeStream: any) => {
                return new Promise((resolve, reject) => {
                    file.pipe(writeStream);
                    writeStream.on('finish', () => resolve(true));
                    writeStream.on('error', reject);
                    file.on('error', reject);
                });
            })
            .catch((err: any) => {
                uploadError = err;
                file.resume(); // consume the stream
            });

        writePromises.push(promise);
    });

    busboy.on('finish', async () => {
        try {
            if (writePromises.length === 0) {
                return res.status(400).json({ error: 'No files provided.' });
            }
            await Promise.all(writePromises);
            if (uploadError) throw uploadError;

            res.status(201).json({
                success: true,
                message: 'File uploaded successfully.',
                filePath: savedPath
            });
        } catch (error: any) {
            handleSmbError(error, res);
        }
    });

    req.pipe(busboy);
}
