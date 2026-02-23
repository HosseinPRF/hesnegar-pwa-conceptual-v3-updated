const KEY_ACHIEVEMENTS = 'achievements';

let achievements = [];
try{ achievements = JSON.parse(localStorage.getItem(KEY_ACHIEVEMENTS) || '[]') || []; }
catch{ achievements = []; }

const $ = (id) => document.getElementById(id);
const container = $('achievements-container');
const input = $('achievement-input');
const addBtn = $('add-achievement');
const resetBtn = $('reset-achievements');

function persist(){
  localStorage.setItem(KEY_ACHIEVEMENTS, JSON.stringify(achievements));
}

function render(){
  container.innerHTML = '';

  if(!achievements.length){
    container.innerHTML = '<div class="helper">— هنوز موردی اضافه نکردی.</div>';
    return;
  }

  achievements.forEach((achievement, index) => {
    const el = document.createElement('div');
    el.classList.add('achievement-item');

    const span = document.createElement('span');
    span.textContent = String(achievement);

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

function addAchievement(){
  const text = (input.value || '').trim();
  if(!text) return;

  if(achievements.length >= 10){
    alert('شما به حداکثر تعداد (۱۰) رسیده‌اید!');
    return;
  }

  achievements.unshift(text);
  persist();
  input.value = '';
  render();
}

addBtn.addEventListener('click', addAchievement);

// Ctrl/Cmd + Enter برای افزودن سریع
input.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)){
    e.preventDefault();
    addAchievement();
  }
});

container.addEventListener('click', (event) => {
  const btn = event.target;
  if(!(btn instanceof HTMLElement)) return;
  if(btn.classList.contains('delete')){
    const idx = parseInt(btn.getAttribute('data-index') || '-1', 10);
    if(Number.isNaN(idx) || idx < 0) return;
    achievements.splice(idx, 1);
    persist();
    render();
  }
});

resetBtn.addEventListener('click', ()=>{
  if(!achievements.length){
    alert('لیست خالی است.');
    return;
  }
  if(confirm('همهٔ دستاوردها/موهبت‌ها پاک شود؟')){
    achievements = [];
    persist();
    render();
  }
});

render();
