const SMB2 = require('@marsaud/smb2');

const smb2Client = new SMB2({
    share: '\\\\127.0.0.1\\share',
    domain: '',
    username: 'user',
    password: 'pass',
    port: 4451,
    autoCloseTimeout: 0
});

smb2Client.readdir('', function (err, files) {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Files:', files);
    }
    process.exit();
});
