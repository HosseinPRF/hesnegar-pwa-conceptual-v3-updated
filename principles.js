const KEY_PRINCIPLES = 'principles';

let principles = [];
try{ principles = JSON.parse(localStorage.getItem(KEY_PRINCIPLES) || '[]') || []; }
catch{ principles = []; }

const $ = (id) => document.getElementById(id);
const container = $('principles-container');
const input = $('principle-input');
const addBtn = $('add-principle');
const resetBtn = $('reset-principles');

function persist(){
  localStorage.setItem(KEY_PRINCIPLES, JSON.stringify(principles));
}

function render(){
  container.innerHTML = '';

  if(!principles.length){
    container.innerHTML = '<div class="helper">— هنوز موردی اضافه نکردی.</div>';
    return;
  }

  principles.forEach((principle, index) => {
    const el = document.createElement('div');
    el.classList.add('principle-item');

    const span = document.createElement('span');
    span.textContent = String(principle);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn danger small delete';
    btn.setAttribute('data-index', String(index));
    btn.textContent = 'حذف';

    el.appendChild(span);
    el.appendChild(btn);
    container.appendChild(el);
  });
}

function addPrinciple(){
  const text = (input.value || '').trim();
  if(!text) return;

  if(principles.length >= 10){
    alert('شما به حداکثر تعداد (۱۰) رسیده‌اید!');
    return;
  }

  principles.unshift(text);
  persist();
  input.value = '';
  render();
}

addBtn.addEventListener('click', addPrinciple);

input.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)){
    e.preventDefault();
    addPrinciple();
  }
});

container.addEventListener('click', (event)=>{
  const btn = event.target;
  if(!(btn instanceof HTMLElement)) return;
  if(btn.classList.contains('delete')){
    const idx = parseInt(btn.getAttribute('data-index') || '-1', 10);
    if(Number.isNaN(idx) || idx < 0) return;
    principles.splice(idx, 1);
    persist();
    render();
  }
});

resetBtn.addEventListener('click', ()=>{
  if(!principles.length){
    alert('لیست خالی است.');
    return;
  }
  if(confirm('همهٔ اصول زندگی پاک شود؟')){
    principles = [];
    persist();
    render();
  }
});

render();
