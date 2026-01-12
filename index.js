const express = require('express');
const Imap = require('imap');
const cors = require('cors');
const path = require('path');
const { SocksProxyAgent } = require('socks-proxy-agent');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/verify', async (req, res) => {
    const { account, proxy } = req.body;
    if (!account || !account.includes(':')) return res.status(400).json({ status: 'FAILED' });

    const [email, password] = account.split(':');
    let agent = null;

    if (proxy && proxy.includes(':')) {
        try {
            // تنظيف صيغة البروكسي
            const cleanProxy = proxy.trim();
            agent = new SocksProxyAgent(`socks5://${cleanProxy}`);
        } catch (e) { console.log("Proxy Format Error"); }
    }

    const imap = new Imap({
        user: email,
        password: password,
        host: 'outlook.office365.com',
        port: 993,
        tls: true,
        tlsOptions: { 
            rejectUnauthorized: false,
            servername: 'outlook.office365.com' 
        },
        agent: agent,
        connTimeout: 30000, // زيادة الوقت لـ 30 ثانية
        authTimeout: 20000
    });

    const finish = (status) => {
        if (imap.state !== 'disconnected') imap.end();
        if (!res.headersSent) res.json({ status: status });
    };

    imap.once('ready', () => finish('SUCCESS'));
    imap.once('error', (err) => {
        console.log('IMAP Error:', err.message);
        finish('FAILED');
    });
    
    try {
        imap.connect();
    } catch (e) {
        finish('FAILED');
    }
});

module.exports = app;
