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
        // تحويل صيغة البروكسي إلى URL صالح للمكتبة
        // الصيغة المدعومة: socks5://user:pass@host:port أو socks5://host:port
        const proxyUrl = proxy.includes('@') ? `socks5://${proxy}` : `socks5://${proxy}`;
        agent = new SocksProxyAgent(proxyUrl);
    }

    const imap = new Imap({
        user: email,
        password: password,
        host: 'outlook.office365.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        agent: agent, // هنا يتم تفعيل البروكسي
        connTimeout: 15000,
        authTimeout: 10000
    });

    const finish = (status) => {
        if (imap.state !== 'disconnected') imap.end();
        if (!res.headersSent) res.json({ status: status });
    };

    imap.once('ready', () => finish('SUCCESS'));
    imap.once('error', () => finish('FAILED'));
    
    try {
        imap.connect();
    } catch (e) {
        finish('FAILED');
    }
});

module.exports = app;
