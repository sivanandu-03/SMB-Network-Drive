const SMB2 = require('@marsaud/smb2');

const smb2Client = new SMB2({
  share: '\\\\127.0.0.1\\share',
  domain: '',
  username: 'user',
  password: 'pass',
  port: 4451
});

smb2Client.unlink('dummy.txt', function(err){
    if(err) {
        console.error('Error Code:', err.code);
        console.error('Error MESSAGE:', err.message);
    } else {
        console.log('Deleted successfully');
    }
    process.exit();
});
