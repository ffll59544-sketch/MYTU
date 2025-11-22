<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>نسّاخ Email:Password</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='192' height='192'><rect width='100%' height='100%' fill='%236200EE'/><text x='50%' y='54%' font-size='80' fill='white' font-family='Arial' text-anchor='middle' alignment-baseline='middle'>@</text></svg>">
<style>
  :root{--bg:#f3f4f6;--card:#fff;--accent:#6200EE}
  body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial;background:var(--bg);color:#111}
  .wrap{max-width:760px;margin:18px auto;padding:12px}
  .card{background:var(--card);border-radius:12px;padding:12px;box-shadow:0 6px 18px rgba(0,0,0,0.06)}
  h1{margin:6px 0 12px;font-size:20px;text-align:center}
  textarea{width:100%;min-height:160px;padding:10px;font-size:14px;border-radius:10px;border:1px solid #e6e6e6;resize:vertical}
  .row{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
  button{background:var(--accent);color:white;border:none;padding:10px 12px;border-radius:10px;font-size:15px;cursor:pointer}
  .outline{background:transparent;color:var(--accent);border:2px solid var(--accent)}
  .list{margin-top:12px;display:flex;flex-direction:column;gap:8px}
  .item{display:flex;justify-content:space-between;align-items:center;padding:10px;border-radius:10px;border:1px solid #efefef;background:#fff}
  .left{display:flex;flex-direction:column;gap:6px;min-width:0;flex:1}
  .email{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pw{font-size:13px;color:#444;opacity:0.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .controls{display:flex;gap:6px;margin-left:8px}
  .small{padding:6px 8px;font-size:13px;border-radius:8px}
  .toast{position:fixed;left:50%;transform:translateX(-50%);bottom:26px;background:#222;color:#fff;padding:10px 14px;border-radius:10px;opacity:0;pointer-events:none;transition:opacity .25s}
  .toast.show{opacity:1;pointer-events:auto}
  .hint{font-size:13px;color:#666;margin-top:8px}
  .top-actions{display:flex;gap:8px;align-items:center;justify-content:center;margin-bottom:8px}
  @media(min-width:600px){textarea{min-height:220px}}
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <h1>نسّاخ Email:Password</h1>
    <div class="hint">ألصق أي نص يحتوي إيميلات وبسوردات — النتيجة راح تظهر بالصيغ: <strong>email:password</strong></div>
    <textarea id="input" placeholder="ألصق النص هنا..."></textarea>
    <div class="row top-actions">
      <button id="parseBtn">استخراج</button>
      <button id="clearBtn" class="outline">مسح الإدخال</button>
      <button id="copyAllBtn" class="outline small">نسخ الكل</button>
      <button id="downloadBtn" class="outline small">تنزيل txt</button>
    </div>

    <div class="list" id="list"></div>
    <div class="hint">اضغط على الإيميل لنسخه، واضغط على رمز القلم/قفل بجنب الباسورد لنسخ الباسورد.</div>
  </div>
</div>

<div id="toast" class="toast"></div>

<script>
/* Regex: يلتقط إيميل ثم أقرب كلمة بعده أو بعد : أو - */
const emailPwRegex = /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\s*[:\-]?\s*([^\s"']+)/g;

const input = document.getElementById('input');
const parseBtn = document.getElementById('parseBtn');
const list = document.getElementById('list');
const toast = document.getElementById('toast');
const clearBtn = document.getElementById('clearBtn');
const copyAllBtn = document.getElementById('copyAllBtn');
const downloadBtn = document.getElementById('downloadBtn');

function showToast(txt){
  toast.textContent = txt;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=> toast.classList.remove('show'),1500);
}

function parseText(){
  const text = input.value;
  list.innerHTML = '';
  if(!text.trim()){ showToast('الصندوق فاضي'); return; }

  const pairs = [];
  let m;
  while ((m = emailPwRegex.exec(text)) !== null) {
    // m[1]=email  m[2]=password-like
    pairs.push([m[1].trim(), m[2].trim()]);
  }

  if(pairs.length === 0){
    showToast('ماكو ايميلات مع باسوردات قابلة للاستخراج');
    return;
  }

  // remove duplicates keeping first
  const seen = new Set();
  const unique = [];
  for(const p of pairs){
    const key = p[0]+':'+p[1];
    if(!seen.has(key)){ seen.add(key); unique.push(p); }
  }

  for(const [em,pw] of unique){
    const row = document.createElement('div');
    row.className = 'item';

    const left = document.createElement('div'); left.className='left';
    const e = document.createElement('div'); e.className='email'; e.textContent = em;
    const p = document.createElement('div'); p.className='pw'; p.textContent = pw;
    left.appendChild(e); left.appendChild(p);

    const controls = document.createElement('div'); controls.className='controls';

    const copyEmailBtn = document.createElement('button');
    copyEmailBtn.className = 'small';
    copyEmailBtn.textContent = 'نسخ الإيميل';
    copyEmailBtn.onclick = ()=> {
      copyText(em);
      showToast('الإيميل نُسِخ');
    };

    const copyPwBtn = document.createElement('button');
    copyPwBtn.className = 'small outline';
    copyPwBtn.textContent = 'نسخ الباسورد';
    copyPwBtn.onclick = ()=> {
      copyText(pw);
      showToast('الباسورد نُسِخ');
    };

    controls.appendChild(copyEmailBtn);
    controls.appendChild(copyPwBtn);

    row.appendChild(left);
    row.appendChild(controls);
    list.appendChild(row);
  }
  showToast(unique.length + ' سطر/سطور محتوطة');
}

async function copyText(s){
  try{
    await navigator.clipboard.writeText(s);
  }catch(e){
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = s; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy'); ta.remove();
  }
}

parseBtn.addEventListener('click', parseText);
clearBtn.addEventListener('click', ()=>{ input.value=''; list.innerHTML=''; showToast('انمسح');});
copyAllBtn.addEventListener('click', async ()=>{
  const nodes = list.querySelectorAll('.item');
  if(nodes.length === 0){ showToast('ماكو شيء لنسخه'); return; }
  const all = Array.from(nodes).map(n=>{
    const em = n.querySelector('.email').textContent.trim();
    const pw = n.querySelector('.pw').textContent.trim();
    return em + ':' + pw;
  }).join('\\n');
  await copyText(all);
  showToast('كل النتائج نُسخت');
});
downloadBtn.addEventListener('click', ()=>{
  const nodes = list.querySelectorAll('.item');
  if(nodes.length === 0){ showToast('ماكو شيء لتحميله'); return; }
  const all = Array.from(nodes).map(n=>{
    const em = n.querySelector('.email').textContent.trim();
    const pw = n.querySelector('.pw').textContent.trim();
    return em + ':' + pw;
  }).join('\\n');
  const blob = new Blob([all], {type:'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'emails_passwords.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('تم تنزيل الملف');
});

/* Quick demo fill (optional) */
// input.value = "hello\\nuser@example.com:pass123\\nnotanemail foo\\nabc@d.com passwordX";

</script>
</body>
</html>
