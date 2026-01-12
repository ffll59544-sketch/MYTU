const express = require('express');
const Imap = require('imap');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Server is Live on Vercel!'));

app.post('/api/verify', (req, res) => {
    const { account } = req.body;
    if (!account || !account.includes(':')) return res.status(400).json({ status: 'FAILED' });

    const [email, password] = account.split(':');
    const imap = new Imap({
        user: email, password: password,
        host: 'outlook.office365.com', port: 993, tls: true,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 10000, authTimeout: 5000
    });

    imap.once('ready', () => { imap.end(); res.json({ status: 'SUCCESS' }); });
    imap.once('error', (err) => { res.json({ status: 'FAILED', error: err.message }); });
    imap.connect();
});

module.exports = app; // هذا السطر ضروري لـ Vercel
