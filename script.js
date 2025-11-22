// ------------------- CONFIG & STATE -------------------
const WAPP_NUMBER = "50683737202";
const MARACUMANGO_LIMITS = { MAX_TOPPINGS: 2 };
const TOTAL_STEPS = 6;

let order = [];
let current = {};
let currentStep = 1;
let isEditing = -1;

function newCup() {
  return {
    base: null,
    size: null,
    crema: null,
    glaseado: null,
    topping: [],
    jarabe: null,
    price: 0
  };
}
current = newCup();

// ------------------- UI HELPERS -------------------
const steps = document.querySelectorAll('.step');

function showStep(n){
  steps.forEach(s => s.classList.remove('visible'));
  const step = document.querySelector(`#step-${n}`);
  if(step) step.classList.add('visible');
  document.getElementById('progress-step').textContent = n;
  document.getElementById('progress-fill').style.width = ((n-1)/(TOTAL_STEPS - 1) * 100) + '%';
  handleMaracumangoRestrictions();
  updateNextButtonsState();

  const addBtn = document.getElementById('add-to-order');
  if(addBtn) addBtn.textContent = isEditing >= 0 ? 'Guardar cambios' : 'Agregar al pedido';
}

// Botones "Siguiente" inferiores (existentes)
document.querySelectorAll('[id^="next-"]').forEach(btn=>{
  btn.addEventListener('click',()=>{ advanceStep(); });
});

// Botones "Siguiente" superiores (móvil)
['1','2','3','4','5'].forEach(n=>{
  const topBtn = document.getElementById(`top-next-${n}`);
  if (topBtn) topBtn.addEventListener('click', ()=> { advanceStep(); });
});

// Avanzar (respeta Maracumango)
function advanceStep(){
  const isMaracu = current.base && current.base.id === 'maracumango';
  if (currentStep === 1 && isMaracu) {
    currentStep = 5;         // 1 -> 5 (toppings)
  } else if (currentStep === 5 && isMaracu) {
    currentStep = 6;         // 5 -> 6 (botón final)
  } else {
    currentStep++;
  }
  showStep(currentStep);
}

// Botones "Regresar"
document.querySelectorAll('[id^="back-"]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const isMaracu = current.base && current.base.id === 'maracumango';
    if (currentStep === 6 && isMaracu) {
      currentStep = 5;
    } else if (currentStep === 5 && isMaracu) {
      currentStep = 1;
    } else {
      currentStep--;
    }
    showStep(currentStep);
  });
});

// ------------------- NEXT BUTTON STATE -------------------
function updateNextButtonsState() {
  const isMaracu = current.base && current.base.id === 'maracumango';

  const next1 = document.getElementById('next-1');
  const top1  = document.getElementById('top-next-1');
  if (next1) next1.disabled = !current.base;
  if (top1)  top1.disabled  = !current.base;

  const next2 = document.getElementById('next-2');
  const top2  = document.getElementById('top-next-2');
  const en2   = isMaracu ? true : !!current.size;
  if (next2) next2.disabled = !en2;
  if (top2)  top2.disabled  = !en2;

  const next3 = document.getElementById('next-3');
  const top3  = document.getElementById('top-next-3');
  const en3   = isMaracu ? true : !!current.crema;
  if (next3) next3.disabled = !en3;
  if (top3)  top3.disabled  = !en3;

  const next4 = document.getElementById('next-4');
  const top4  = document.getElementById('top-next-4');
  if (next4) next4.disabled = false;
  if (top4)  top4.disabled  = false;

  const next5 = document.getElementById('next-5');
  const top5  = document.getElementById('top-next-5');
  if (next5) next5.disabled = false;
  if (top5)  top5.disabled  = false;

  // Botón final habilitado si cumple mínimos
  const addBtn = document.getElementById('add-to-order');
  if(addBtn){
    const canAdd = current.base && (isMaracu || (current.size && current.crema));
    addBtn.disabled = !canAdd;
  }
}

// ------------------- TOPPING LIMIT -------------------
function getMaxToppingLimit(cup) {
  if (cup.base && cup.base.id === 'maracumango') return MARACUMANGO_LIMITS.MAX_TOPPINGS;
  if (cup.size) {
    const sizeChip = document.querySelector(`[data-group="size"][data-id="${cup.size.id}"]`);
    if (sizeChip && sizeChip.dataset.maxToppings) return parseInt(sizeChip.dataset.maxToppings);
  }
  return 0;
}

// ------------------- CHIP SELECTION -------------------
document.querySelectorAll('.chip').forEach(chip=>{
  chip.addEventListener('click',()=>{
    const group = chip.dataset.group;
    const id = chip.dataset.id;
    const price = parseFloat(chip.dataset.price || 0);
    const name = chip.querySelector('p')?.textContent;

    if (group !== 'topping') {
      if (group === 'base') {
        current = newCup();
        current.base = { id, name, price };
        isEditing = -1;
        clearUISelection();
        chip.classList.add('selected');
      } else {
        document.querySelectorAll(`[data-group="${group}"]`).forEach(c=>c.classList.remove('selected'));
        chip.classList.add('selected');
        current[group] = { id, name, price };
      }
    } else {
      const sinToppingChip = document.querySelector('[data-group="topping"][data-id="sin_topping"]');
      const contentChips = document.querySelectorAll('#topping-grid .chip:not([data-id="sin_topping"])');

      if (id === 'sin_topping') {
        current.topping = [];
        chip.classList.add('selected');
        contentChips.forEach(c => {
          c.classList.remove('selected');
          c.style.opacity = '0.5';
          c.style.pointerEvents = 'auto';
        });
      } else {
        contentChips.forEach(c => { c.style.opacity = '1'; c.style.pointerEvents = 'auto'; });
        if (sinToppingChip) sinToppingChip.classList.remove('selected');

        const max = getMaxToppingLimit(current);
        const ix = current.topping.findIndex(t=>t.id===id);
        if (ix > -1) {
          current.topping.splice(ix,1);
          chip.classList.remove('selected');
        } else {
          if (current.topping.length >= max) {
            alert(`Límite alcanzado. Solo puedes seleccionar ${max} toppings para este vaso.`);
            return;
          }
          current.topping.push({ id, name, price });
          chip.classList.add('selected');
        }

        if (current.topping.length === 0 && sinToppingChip) {
          sinToppingChip.classList.add('selected');
          contentChips.forEach(c => { c.style.opacity = '0.5'; c.style.pointerEvents = 'auto'; });
        }
      }
    }

    updateNextButtonsState();
    updateSummary();
    handleMaracumangoRestrictions();
  });
});

// ------------------- MARACUMANGO RULES -------------------
function handleMaracumangoRestrictions() {
  const isMaracu = current.base && current.base.id === 'maracumango';

  const stepsToToggle = ['#step-2', '#step-3', '#step-4'];
  stepsToToggle.forEach(sel=>{
    const step = document.querySelector(sel);
    if (!step) return;
    if (isMaracu) { step.style.pointerEvents = 'none'; step.style.opacity = '0.5'; }
    else { step.style.pointerEvents = 'auto'; step.style.opacity = '1'; }
  });

  if (isMaracu) {
    current.size = null;
    current.crema = null;
    current.glaseado = null;
    current.jarabe = null;

    const sinJar = document.querySelector('[data-group="jarabe"][data-id="sin_jarabe"]');
    document.querySelectorAll('#jarabe-grid .chip').forEach(c => c.classList.remove('selected'));
    if (sinJar) sinJar.classList.add('selected');
    document.getElementById('jarabe-grid').style.opacity = '0.5';

    const sinGla = document.querySelector('[data-group="glaseado"][data-id="sin_glaseado"]');
    document.querySelectorAll('#glaseado-grid .chip').forEach(c => c.classList.remove('selected'));
    if (sinGla) sinGla.classList.add('selected');
    document.getElementById('glaseado-grid').style.opacity = '0.5';
  } else {
    const sinG = document.querySelector('[data-group="glaseado"][data-id="sin_glaseado"]');
    document.getElementById('glaseado-grid').style.opacity = (sinG && sinG.classList.contains('selected')) ? '0.5' : '1';
    const sinJ = document.querySelector('[data-group="jarabe"][data-id="sin_jarabe"]');
    document.getElementById('jarabe-grid').style.opacity = (sinJ && sinJ.classList.contains('selected')) ? '0.5' : '1';
  }
}

// ------------------- CLEAR UI -------------------
function clearUISelection() {
  document.querySelectorAll('.chip.selected').forEach(c => c.classList.remove('selected'));
  const g = document.getElementById('glaseado-grid'); if (g) g.style.opacity = '1';
  const j = document.getElementById('jarabe-grid');   if (j) j.style.opacity = '1';
  document.querySelectorAll('#topping-grid .chip').forEach(c=>{ c.style.opacity='1'; c.style.pointerEvents='auto'; });
}

// ------------------- EDIT/REMOVE/DUPLICATE -------------------
window.editOrder = function(index) {
  if (index < 0 || index >= order.length) return;
  isEditing = index;
  current = JSON.parse(JSON.stringify(order[index]));
  clearUISelection();

  ['base','size','crema','glaseado','jarabe'].forEach(g=>{
    if (current[g] && current[g].id) {
      document.querySelector(`[data-group="${g}"][data-id="${current[g].id}"]`)?.classList.add('selected');
    }
  });
  current.topping.forEach(t=>{
    document.querySelector(`[data-group="topping"][data-id="${t.id}"]`)?.classList.add('selected');
  });

  currentStep = 1;
  showStep(currentStep);
  updateSummary();
  alert(`Editando Pedido #${index + 1}. Modifica la selección y presiona "Guardar cambios".`);
};

window.duplicateOrder = function(index) {
  if (index < 0 || index >= order.length) return;
  order.push(JSON.parse(JSON.stringify(order[index])));
  updateSummary();
  alert(`Pedido #${index + 1} duplicado.`);
};

window.removeOrder = function(index) {
  if (index < 0 || index >= order.length) return;
  if (confirm(`¿Eliminar el Pedido #${index + 1}?`)) {
    order.splice(index,1);
    updateSummary();
  }
};

function clearAll(){
  if (confirm('¿Borrar todos los pedidos y empezar de nuevo?')) {
    order = [];
    current = newCup();
    isEditing = -1;
    currentStep = 1;
    showStep(currentStep);
    clearUISelection();
    updateSummary();
  }
}

// ------------------- CALCULOS -------------------
function calculateTotal(cup) {
  let total = 0;
  if (!cup.base) return 0;

  if (cup.base.id === 'maracumango') {
    total += cup.base.price;
    cup.topping.forEach(t => total += t.price || 0);
  } else {
    total += cup.size ? cup.size.price : 0;
    if (cup.glaseado) total += cup.glaseado.price || 0;
    if (cup.jarabe)   total += cup.jarabe.price || 0;
    cup.topping.forEach(t => { total += t.price || 0; });
  }
  return total;
}

// ------------------- RESUMEN -------------------
function updateSummary(){
  const summaryOrder = document.getElementById('summary');
  const currentBox = document.getElementById('current-summary');
  let totalOrder = 0;

  let currentHTML = '';
  let currentTotal = 0;

  if (current.base) {
    const isMaracu = current.base.id === 'maracumango';
    const rows = [];

    rows.push(`<div>Base: <strong>${current.base.name}</strong>${isMaracu ? ` (₡${current.base.price.toLocaleString('es-CR')})` : ''}</div>`);
    if (!isMaracu) {
      if (current.size) rows.push(`<div>Tamaño: <strong>${current.size.name}</strong> (+₡${(current.size.price||0).toLocaleString('es-CR')})</div>`);
      if (current.crema) rows.push(`<div>Crema: <strong>${current.crema.name}</strong></div>`);
      rows.push(`<div>Glaseado: <strong>${current.glaseado ? current.glaseado.name : 'SIN'}</strong>${current.glaseado && current.glaseado.price ? ` (+₡${current.glaseado.price.toLocaleString('es-CR')})` : ''}</div>`);
      rows.push(`<div>Jarabe: <strong>${current.jarabe ? current.jarabe.name : 'SIN'}</strong>${current.jarabe && current.jarabe.price ? ` (+₡${current.jarabe.price.toLocaleString('es-CR')})` : ''}</div>`);
    } else {
      rows.push(`<div>Tamaño/Crema: <strong>Fijo</strong></div>`);
      rows.push(`<div>Glaseado/Jarabe: <strong>SIN</strong></div>`);
    }

    if (current.topping.length > 0) {
      const tnames = current.topping.map(t=>`${t.name}${t.price?` (+₡${t.price.toLocaleString('es-CR')})`:''}`).join(', ');
      rows.push(`<div>Toppings: <strong>${tnames}</strong></div>`);
    } else {
      rows.push(`<div>Toppings: <strong>SIN</strong></div>`);
    }

    currentTotal = calculateTotal(current);
    rows.push(`<div style="margin-top:6px;">Total Vaso: <strong>₡${currentTotal.toLocaleString('es-CR')}</strong></div>`);
    currentHTML = rows.join('');
  } else {
    currentHTML = 'Aún no ha seleccionado la base de su pedido.';
  }
  currentBox.innerHTML = currentHTML;

  if (order.length > 0) {
    let html = '';
    order.forEach((item, i)=>{
      const itTotal = calculateTotal(item);
      totalOrder += itTotal;
      const title = item.base.name + (item.size ? ` (${item.size.name})` : '');
      html += `
        <div class="order-item" style="margin-top:10px;border-top:1px solid #eee;padding-top:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:600;">Pedido #${i+1}: ${title}</div>
              <div>Total: ₡${itTotal.toLocaleString('es-CR')}</div>
            </div>
            <div style="display:flex;gap:5px;">
              <button onclick="duplicateOrder(${i})" class="cta cta--xsmall cta--orange-outline">x2</button>
              <button onclick="editOrder(${i})" class="cta cta--xsmall cta--blue">Editar</button>
              <button onclick="removeOrder(${i})" class="cta cta--xsmall cta--red">Eliminar</button>
            </div>
          </div>
        </div>`;
    });
    summaryOrder.innerHTML = html;
    document.getElementById('order-summary-title').style.display = 'block';
  } else {
    summaryOrder.innerHTML = 'Aún no hay pedidos agregados.';
    document.getElementById('order-summary-title').style.display = 'none';
  }

  const grand = totalOrder + currentTotal;
  ['total-top','total-bottom','total-mobile'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.textContent = `₡${grand.toLocaleString('es-CR')}`;
  });

  updateMobileSummary(grand, current);
}

// ------------------- MOBILE SUMMARY -------------------
function updateMobileSummary(grandTotal, currentCup) {
  const mobileSummaryEl = document.getElementById('mobile-summary-details');
  const mobileActionsEl = document.getElementById('mobile-summary-actions');
  const totalEl = document.getElementById('total-mobile');

  if (!currentCup.base && order.length === 0) {
    mobileSummaryEl.innerHTML = 'Arma tu primer pedido';
    mobileActionsEl.innerHTML = '';
    totalEl.textContent = `₡${grandTotal.toLocaleString('es-CR')}`;
    return;
  }

  let summaryText = '';
  const isMaracu = currentCup.base && currentCup.base.id === 'maracumango';
  if (currentCup.base) {
    summaryText += `<span style="font-weight:600;">${isEditing>=0?'Editando':'Actual'}: </span>${currentCup.base.name}`;
    if (!isMaracu && currentCup.size) summaryText += ` (${currentCup.size.name})`;
    const tc = currentCup.topping.length;
    if (tc>0) summaryText += `, ${tc} Topping${tc>1?'s':''}`;
  } else {
    summaryText = `Tienes ${order.length} pedido${order.length>1?'s':''} listo(s).`;
  }
  mobileSummaryEl.innerHTML = summaryText;

  let actions = '';
  const canAdd = currentCup.base && (isMaracu || (currentCup.size && currentCup.crema));
  if (currentCup.base) {
    actions += `<button id="mobile-clear-btn" class="cta cta--xsmall cta--red-outline">Borrar</button>`;
    actions += `<button id="mobile-add-btn" class="cta cta--small cta--green" ${canAdd?'':'disabled'}>${isEditing>=0?'Guardar':'Agregar'}</button>`;
  } else if (order.length > 0) {
    actions += `<button id="mobile-clear-btn" class="cta cta--xsmall cta--red-outline">Borrar</button>`;
    actions += `<button id="mobile-send-btn" class="cta cta--small cta--green">Enviar (${order.length})</button>`;
  }
  mobileActionsEl.innerHTML = actions;

  totalEl.textContent = `₡${grandTotal.toLocaleString('es-CR')}`;

  document.getElementById('mobile-add-btn')?.addEventListener('click', addCurrentToOrder);
  document.getElementById('mobile-send-btn')?.addEventListener('click', sendOrderToWhatsapp);
  document.getElementById('mobile-clear-btn')?.addEventListener('click', clearAll);
}

// ------------------- ADD / SEND -------------------
function addCurrentToOrder() {
  const isMaracu = current.base && current.base.id === 'maracumango';
  if (!current.base || (!isMaracu && !current.size)) { alert('Selecciona base y tamaño (para Fresas con Crema).'); return; }
  if (!isMaracu && !current.crema) { alert('Selecciona una crema.'); return; }

  if (isMaracu) { current.size=null; current.crema=null; current.glaseado=null; current.jarabe=null; }

  if (isEditing >= 0) {
    order[isEditing] = JSON.parse(JSON.stringify(current));
    isEditing = -1;
  } else {
    order.push(JSON.parse(JSON.stringify(current)));
  }

  current = newCup();
  currentStep = 1; showStep(currentStep);
  clearUISelection();
  updateSummary();
}

function sendOrderToWhatsapp() {
  if (order.length === 0) { alert('Agrega al menos un pedido.'); return; }
  let msg = "Hola 👋 Quiero hacer los siguientes pedidos:\n";
  let grand = 0;

  order.forEach((item, i)=>{
    msg += `\n--- Pedido #${i+1} ---\n`;
    const isMaracu = item.base.id === 'maracumango';
    const itTotal = calculateTotal(item); grand += itTotal;

    msg += `Base: ${item.base.name}\n`;
    if (!isMaracu) {
      msg += `Tamaño: ${item.size?.name || ''}\n`;
      msg += `Crema: ${item.crema?.name || 'SIN'}\n`;
      msg += `Glaseado: ${item.glaseado ? item.glaseado.name + (item.glaseado.price?` (+₡${item.glaseado.price.toLocaleString('es-CR')})`:``) : 'SIN'}\n`;
      msg += `Jarabe: ${item.jarabe ? item.jarabe.name + (item.jarabe.price?` (+₡${item.jarabe.price.toLocaleString('es-CR')})`:``) : 'SIN'}\n`;
    } else {
      msg += `Tamaño/Crema: FIJO\nGlaseado/Jarabe: SIN\nPrecio Base: ₡${item.base.price.toLocaleString('es-CR')}\n`;
    }
    if (item.topping.length>0) {
      msg += `Toppings: ${item.topping.map(t=>t.name + (t.price?` (+₡${t.price.toLocaleString('es-CR')})`:``)).join(', ')}\n`;
    } else { msg += `Toppings: SIN\n`; }

    msg += `Total del Vaso: ₡${itTotal.toLocaleString('es-CR')}\n`;
  });

  msg += `\n--- TOTAL GENERAL: ₡${grand.toLocaleString('es-CR')} ---`;
  window.open(`https://wa.me/${WAPP_NUMBER}?text=${encodeURIComponent(msg)}`,'_blank');
}

// ------------------- INIT -------------------
document.getElementById('add-to-order').addEventListener('click', addCurrentToOrder);
document.getElementById('btn-make-order').addEventListener('click', sendOrderToWhatsapp);
document.getElementById('btn-clear-all').addEventListener('click', clearAll);

document.addEventListener('DOMContentLoaded', ()=>{
  clearUISelection();
  updateSummary();
  showStep(currentStep);
});
