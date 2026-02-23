const KEY_IMPROVEMENTS = 'improvements';

let improvements = [];
try{ improvements = JSON.parse(localStorage.getItem(KEY_IMPROVEMENTS) || '[]') || []; }
catch{ improvements = []; }

const $ = (id) => document.getElementById(id);
const container = $('improvement-container');
const input = $('improvement-input');
const addBtn = $('add-improvement');
const resetBtn = $('reset-improvements');

function persist(){
  localStorage.setItem(KEY_IMPROVEMENTS, JSON.stringify(improvements));
}

function render(){
  container.innerHTML = '';

  if(!improvements.length){
    container.innerHTML = '<div class="helper">— هنوز موردی اضافه نکردی.</div>';
    return;
  }

  improvements.forEach((improvement, index) => {
    const el = document.createElement('div');
    el.classList.add('improvement-item');

    const span = document.createElement('span');
    span.textContent = String(improvement);

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

function addImprovement(){
  const text = (input.value || '').trim();
  if(!text) return;

  if(improvements.length >= 10){
    alert('شما به حداکثر تعداد (۱۰) رسیده‌اید!');
    return;
  }

  improvements.unshift(text);
  persist();
  input.value = '';
  render();
}

addBtn.addEventListener('click', addImprovement);

input.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)){
    e.preventDefault();
    addImprovement();
  }
});

container.addEventListener('click', (event)=>{
  const btn = event.target;
  if(!(btn instanceof HTMLElement)) return;
  if(btn.classList.contains('delete')){
    const idx = parseInt(btn.getAttribute('data-index') || '-1', 10);
    if(Number.isNaN(idx) || idx < 0) return;
    improvements.splice(idx, 1);
    persist();
    render();
  }
});

resetBtn.addEventListener('click', ()=>{
  if(!improvements.length){
    alert('لیست خالی است.');
    return;
  }
  if(confirm('همهٔ نقاط بهبود پاک شود؟')){
    improvements = [];
    persist();
    render();
  }
});

render();
