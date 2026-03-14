import { NextApiRequest, NextApiResponse } from 'next';
import { smbClient } from '../../../lib/smb-client';
import { handleSmbError } from '../../../lib/api-error';
import archiver from 'archiver';
import pathLib from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const { paths } = req.body;

    if (!Array.isArray(paths) || paths.length === 0) {
        return res.status(400).json({ error: 'Paths must be a non-empty array' });
    }

    try {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="archive.zip"');
        res.setHeader('Transfer-Encoding', 'chunked');

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);
        archive.on('warning', (err) => console.warn(err));
        archive.on('error', (err) => { throw err; });

        for (const p of paths) {
            try {
                const readStream = await smbClient.createReadStream(p);
                archive.append(readStream, { name: pathLib.basename(p) });
            } catch (err: any) {
                console.error(`Failed to stream ${p}:`, err);
                throw err;
            }
        }

        await archive.finalize();
    } catch (error: any) {
        console.error('ZIP error:', error);
        if (!res.headersSent) {
            handleSmbError(error, res);
        } else {
            res.end();
        }
    }
}

export const config = {
    api: {
        responseLimit: false,
    },
};
