const express = require('express');
const Imap = require('imap');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/verify', (req, res) => {
    const { account } = req.body;
    if (!account || !account.includes(':')) return res.status(400).json({ status: 'FAILED' });

    const [email, password] = account.split(':');
    
    const imap = new Imap({
        user: email,
        password: password,
        host: 'outlook.office365.com',
        port: 993,
        tls: true,
        tlsOptions: { 
            rejectUnauthorized: false, // مهم جداً لتجاوز حظر السيرفرات
            servername: 'outlook.office365.com' 
        },
        connTimeout: 20000, // زيادة وقت الانتظار
        authTimeout: 15000
    });

    // دالة لإنهاء الاتصال بشكل آمن
    const finish = (status) => {
        if (imap.state !== 'disconnected') imap.end();
        if (!res.headersSent) res.json({ status: status });
    };

    imap.once('ready', () => finish('SUCCESS'));
    imap.once('error', (err) => {
        console.log('Error details:', err.message);
        finish('FAILED');
    });
    
    try {
        imap.connect();
    } catch (e) {
        finish('FAILED');
    }
});

module.exports = app;
