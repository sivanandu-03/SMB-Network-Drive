import { NextApiRequest, NextApiResponse } from 'next';
import { smbClient } from '../../../lib/smb-client';
import { handleSmbError } from '../../../lib/api-error';
import pathLib from 'path';
import mime from 'mime-types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();
    const path = (req.query.path as string) || '';
    if (!path) return res.status(400).json({ error: 'Path is required' });

    try {
        const stat = await smbClient.stat(path) as any;
        const filename = pathLib.basename(path);
        const contentType = mime.lookup(filename) || 'application/octet-stream';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        if (stat && stat.size !== undefined) {
            res.setHeader('Content-Length', stat.size.toString());
        }

        const readStream = await smbClient.createReadStream(path);
        readStream.pipe(res);
        readStream.on('error', (err: any) => {
            console.error('Stream error:', err);
            if (!res.headersSent) {
                handleSmbError(err, res);
            } else {
                res.end();
            }
        });
    } catch (error: any) {
        handleSmbError(error, res);
    }
}

export const config = {
    api: {
        responseLimit: false,
    },
};
