const express = require('express');
const Imap = require('imap');
const cors = require('cors');
const path = require('path'); // أضفنا هذا السطر
const app = express();

app.use(cors());
app.use(express.json());

// هذا السطر هو السر: يخبر السيرفر بفتح ملف الـ HTML عند دخولك للرابط
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/verify', (req, res) => {
    const { account, proxy } = req.body;
    if (!account || !account.includes(':')) {
        return res.status(400).json({ status: 'FAILED' });
    }

    const [email, password] = account.split(':');
    const imap = new Imap({
        user: email,
        password: password,
        host: 'outlook.office365.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 10000,
        authTimeout: 5000
    });

    imap.once('ready', () => { imap.end(); res.json({ status: 'SUCCESS' }); });
    imap.once('error', (err) => { res.json({ status: 'FAILED', error: err.message }); });
    imap.connect();
});

module.exports = app;
