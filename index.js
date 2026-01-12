const express = require('express');
const Imap = require('imap');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

app.post('/verify-node', (req, res) => {
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

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});
