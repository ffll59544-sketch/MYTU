const express = require('express');
const Imap = require('imap');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// مسار للتأكد أن السيرفر يعمل
app.get('/', (req, res) => res.send('Server is Live on Vercel!'));

app.post('/api/verify', (req, res) => {
    const { account, proxy } = req.body; // هنا استلام الحساب والبروكسي من Lovable
    
    if (!account || !account.includes(':')) {
        return res.status(400).json({ status: 'FAILED', message: 'Invalid Format' });
    }

    const [email, password] = account.split(':');

    // إعدادات الـ IMAP
    const imapConfig = {
        user: email,
        password: password,
        host: 'outlook.office365.com', // يمكنك تغيير الهوست حسب نوع الحساب
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 10000,
        authTimeout: 5000
    };

    /* ملاحظة لمكان البروكسي:
       إذا أردت تفعيل البروكسي، نحتاج لمكتبة إضافية مثل 'socks-proxy-agent'.
       حالياً الكود سيفحص باستخدام IP السيرفر مباشرة.
    */

    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
        imap.end();
        res.json({ status: 'SUCCESS', account: email });
    });

    imap.once('error', (err) => {
        res.json({ status: 'FAILED', account: email, error: err.message });
    });

    imap.connect();
});

// هذا السطر ضروري جداً لعمل Vercel بشكل صحيح
module.exports = app;
