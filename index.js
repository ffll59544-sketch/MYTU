const express = require('express');
const Imap = require('imap');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// هذا السطر هو الذي سيحذف الصفحة البيضاء ويعرض واجهتك الزرقاء
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/verify', (req, res) => {
    const { account } = req.body;
    const [email, password] = account.split(':');
    const imap = new Imap({
        user: email, password: password,
        host: 'outlook.office365.com', port: 993, tls: true,
        tlsOptions: { rejectUnauthorized: false }
    });
    imap.once('ready', () => { imap.end(); res.json({ status: 'SUCCESS' }); });
    imap.once('error', () => { res.json({ status: 'FAILED' }); });
    imap.connect();
});

module.exports = app;
