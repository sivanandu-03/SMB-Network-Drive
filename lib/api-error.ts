import { NextApiResponse } from 'next';

export function handleSmbError(error: any, res: NextApiResponse) {
    const errCode = error?.code || '';
    const errMessage = error?.message || '';

    if (errCode === 'STATUS_LOGON_FAILURE' || errCode === 'STATUS_ACCESS_DENIED' || errMessage.includes('LOGON_FAILURE') || errMessage.includes('ACCESS_DENIED')) {
        return res.status(401).json({ error: 'Authentication failed. Please check your credentials.' });
    }

    if (errCode === 'STATUS_OBJECT_NAME_NOT_FOUND' || errCode === 'STATUS_OBJECT_PATH_NOT_FOUND' || errMessage.includes('NOT_FOUND')) {
        return res.status(404).json({ error: 'Path not found.' });
    }

    return res.status(500).json({ error: errMessage || 'Internal Server Error' });
}
