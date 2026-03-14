import { NextApiRequest, NextApiResponse } from 'next';
import { smbClient } from '../../../lib/smb-client';
import { handleSmbError } from '../../../lib/api-error';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'DELETE') return res.status(405).end();

    const path = (req.query.path as string) || '';
    if (!path) return res.status(400).json({ error: 'Path is required' });

    try {
        await smbClient.deleteFile(path);
        res.status(200).json({
            success: true,
            message: 'File deleted successfully.'
        });
    } catch (error: any) {
        handleSmbError(error, res);
    }
}
