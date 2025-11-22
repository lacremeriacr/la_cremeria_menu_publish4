;(function(){
  const API_BASE = (window.importMetaEnv && window.importMetaEnv.VITE_API_URL) || '';
  const DEFAULT_PROVIDER = 'bac';
  const AUTO_BACK_MS = 6000;

  document.addEventListener('DOMContentLoaded', () => {
    injectCardPayControls();
    hookSuccessScreen();
  });

  function findActionsContainer(){
    const selectors = [
      '.summary-actions',
      '.summary .actions',
      '.cart-actions',
      '#summary .actions',
      'aside .actions',
      '#cart-actions',
      '.sidebar .actions'
    ];
    for (const sel of selectors){
      const el = document.querySelector(sel);
      if (el) return el;
    }
    // fallback: create one under body end
    let fallback = document.getElementById('payments-actions-fallback');
    if (!fallback){
      fallback = document.createElement('div');
      fallback.id = 'payments-actions-fallback';
      document.body.appendChild(fallback);
    }
    return fallback;
  }

  function injectCardPayControls(){
    const actions = findActionsContainer();
    if (!actions || document.getElementById('btn-card-pay')) return;

    const wrap = document.createElement('div');
    wrap.style.display='flex';
    wrap.style.gap='8px';
    wrap.style.alignItems='center';
    wrap.style.flexWrap='wrap';

    const sel=document.createElement('select');
    sel.id='provider-select';
    sel.className='cta cta--small';
    sel.innerHTML=`
      <option value="bac">BAC Credomatic</option>
      <option value="bncr">Banco Nacional</option>
      <option value="bcr">Banco de Costa Rica</option>
      <option value="popular">Banco Popular</option>
      <option value="promerica">Promerica</option>
      <option value="scotiabank">Scotiabank</option>
      <option value="davivienda">Davivienda</option>`;

    const btn=document.createElement('button');
    btn.id='btn-card-pay';
    btn.className='cta cta--blue';
    btn.textContent='Pagar con tarjeta 💳';

    wrap.appendChild(sel);
    wrap.appendChild(btn);
    actions.appendChild(wrap);

    btn.addEventListener('click',onPayClick);
  }

  async function onPayClick(){
    try{
      const provider = document.getElementById('provider-select')?.value || DEFAULT_PROVIDER;
      if(!window.order || !Array.isArray(window.order) || window.order.length===0){
        alert('Agrega al menos un pedido antes de pagar.');
        return;
      }
      const items = window.order.map(c=>formatCupToItem(c));
      const totalCRC = items.reduce((a,i)=>a+i.amount_crc,0);
      const orderId = buildOrderId(); // A–Z + 01..99

      const res = await fetch(normalize(API_BASE) + '/cr/payments/init',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({provider,order:{order_id:orderId,currency:'CRC',amount_crc:totalCRC,items}})
      });
      if(!res.ok) throw new Error(await res.text() || 'No se pudo iniciar el pago');
      const data = await res.json();
      if(!data.redirectUrl) throw new Error('Sin URL de pago');
      window.location.href = data.redirectUrl;
    }catch(e){
      alert('Error iniciando el pago: ' + (e.message||e));
    }
  }

  // === ID de pedido: una letra A–Z + número 01–99 (excluye 100) ===
  function buildOrderId(){
    const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letter=letters[Math.floor(Math.random()*letters.length)];
    const number=Math.floor(Math.random()*99)+1; // 1..99
    return letter + number.toString().padStart(2,'0');
  }

  // Helpers
  function calcCupTotalCRC(cup){
    try{ if(typeof window.calculateTotal==='function') return Number(window.calculateTotal(cup)); }catch(_){}
    let t=0; if(!cup||!cup.base) return 0;
    if(cup.base.id==='maracumango'){
      t+=cup.base.price||0; (cup.topping||[]).forEach(x=>t+=x.price||0);
    } else {
      t+=cup.size?(cup.size.price||0):0;
      if(cup.glaseado) t+=cup.glaseado.price||0;
      if(cup.jarabe)   t+=cup.jarabe.price||0;
      (cup.topping||[]).forEach(x=>t+=x.price||0);
    }
    return t;
  }

  function formatCupToItem(cup){
    const amount=calcCupTotalCRC(cup);
    return { sku:`VASO-${cup.base?.id||'custom'}`, name:cup.base?.name||'Vaso', quantity:1, amount_crc:amount };
  }

  function hookSuccessScreen(){
    const p=new URLSearchParams(window.location.search);
    const estado=p.get('estado'),orden=p.get('orden');
    if(estado==='exito'&&orden){
      showPreparingScreen(orden);
      setTimeout(()=>{const u=new URL(window.location.href);u.search='';window.location.replace(u)},AUTO_BACK_MS);
    } else if(estado==='cancelado'&&orden){
      alert('Pago cancelado. No se realizó ningún cargo.');
      const u=new URL(window.location.href);u.search='';window.history.replaceState({},'',u);
    }
  }

  function showPreparingScreen(orderId){
    const o=document.createElement('div');
    o.style.position='fixed';o.style.inset='0';o.style.background='rgba(255,255,255,0.95)';
    o.style.display='flex';o.style.alignItems='center';o.style.justifyContent='center';o.style.zIndex='2000';
    o.innerHTML=`<div style="text-align:center"><h2>Pedido en preparación</h2><p>Gracias por tu compra</p><p>Número de pedido:</p><div style="font-size:1.5rem;font-weight:700;color:#e6007e">`+orderId+`</div><p>Redirigiendo...</p></div>`;
    document.body.appendChild(o);
  }

  function normalize(base){ return (base||'').replace(/\/$/,''); }

  // Tests añadidos (NODE_ENV==='test')
  if(typeof window==='undefined' && typeof process!=='undefined' && process.env && process.env.NODE_ENV==='test'){
    for(let i=0;i<200;i++){
      const id=buildOrderId();
      if(!/^[A-Z]\d{2}$/.test(id)) throw new Error('ID no cumple patrón A-Z01-99');
      const n=Number(id.slice(1));
      if(!(n>=1 && n<=99)) throw new Error('ID fuera de rango 01..99');
    }
  }
})();