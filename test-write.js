const fs = require('fs');
const { smbClient } = require('./lib/smb-client');

async function test() {
    process.env.SMB_HOST = '127.0.0.1';
    process.env.SMB_PORT = '4451';
    process.env.SMB_USERNAME = 'user';
    process.env.SMB_PASSWORD = 'pass';
    
    console.log('Writing stream...');
    const stream = await smbClient.createWriteStream('test_stream.txt');
    stream.write('hello stream');
    stream.end();
    
    stream.on('finish', () => {
        console.log('Stream finished.');
        setTimeout(async () => {
            try {
                await smbClient.deleteFile('test_stream.txt');
                console.log('Deleted successfully.');
            } catch(e) {
                console.error('Delete error:', e.code);
            }
            process.exit();
        }, 1000);
    });
}

test();
