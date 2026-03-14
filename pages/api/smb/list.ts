import { NextApiRequest, NextApiResponse } from 'next';
import { smbClient } from '../../../lib/smb-client';
import { handleSmbError } from '../../../lib/api-error';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();
    const path = (req.query.path as string) || '/';
    try {
        const files = await smbClient.list(path);
        res.status(200).json(files);
    } catch (error: any) {
        handleSmbError(error, res);
    }
}
