(function(){
  const $=id=>document.getElementById(id);
  const fmt=n=>isFinite(n)?Math.round(n).toLocaleString('he-IL')+' ₪':'—';

  // checklist with progress (per-browser)
  const boxes=[...document.querySelectorAll('.steps input[type=checkbox]')];
  if(boxes.length){
    let state={}; try{state=JSON.parse(localStorage.getItem('pituarim-steps')||'{}')}catch(e){}
    const save=()=>{try{localStorage.setItem('pituarim-steps',JSON.stringify(state))}catch(e){}};
    const refresh=()=>{const d=boxes.filter(b=>b.checked).length;
      if($('barFill')) $('barFill').style.width=(d/boxes.length*100)+'%';
      if($('barText')) $('barText').textContent=d+' מתוך '+boxes.length+' צעדים';
      boxes.forEach(b=>b.closest('li').classList.toggle('done',b.checked));};
    boxes.forEach(b=>{b.checked=!!state[b.id];b.addEventListener('change',()=>{state[b.id]=b.checked;save();refresh();});});
    refresh();
  }

  // severance calculator
  if($('salary')){
    const run=()=>{const s=+$('salary').value||0,y=+$('years').value||0;
      const ok=y>=1, total=ok?s*y:0;
      $('sevTotal').textContent=ok?fmt(total):'פחות משנה';
      $('sevFree').textContent=ok?fmt(Math.min(total,13750*y)):'—';
      $('sevTax').textContent=ok?fmt(Math.max(0,total-13750*y)):'—';};
    ['salary','years'].forEach(id=>$(id).addEventListener('input',run)); run();
  }

  // runway calculator
  if($('cash')){
    const run=()=>{const cash=+$('cash').value||0,debt=+$('debt').value||0,inc=+$('income').value||0,sp=+$('spend').value||0;
      const left=cash-debt,gap=inc-sp;
      $('left').textContent=fmt(left);
      $('gap').textContent=(gap>=0?'+':'')+fmt(gap);
      let r; if(left<0) r='חסר לסגירת החובות'; else if(gap>=0) r='ההכנסה מכסה'; else r=(Math.round(left/(-gap)*10)/10).toLocaleString('he-IL')+' חודשים';
      $('runway').textContent=r;};
    ['cash','debt','income','spend'].forEach(id=>$(id).addEventListener('input',run)); run();
  }

  // unemployment calculator (2026 brackets)
  if($('u_income')){
    const brackets=[[207.5,.60,.80],[311,.40,.50],[415,.35,.45],[2075,.25,.30]];
    const maxDays=(age,dep)=>{ if(age<25) return dep?138:50; if(age<28) return dep?138:67; if(age<35) return dep?138:100; if(age<45) return dep?175:138; return 175;};
    const run=()=>{const inc=+$('u_income').value||0, age=+$('u_age').value||0, dep=$('u_dep').value==='1';
      const daily=inc/150; let prev=0, ben=0; const col=age<28?1:2;
      for(const b of brackets){ const top=b[0]; if(daily>prev){ ben+=(Math.min(daily,top)-prev)*b[col]; } prev=top; }
      const first=Math.min(ben,550.76), later=Math.min(ben,367.17);
      const days=maxDays(age,dep);
      $('u_daily').textContent=fmt(daily);
      $('u_ben').textContent=fmt(first);
      $('u_month').textContent=fmt(first*25);
      $('u_days').textContent=days+' ימים';
      const total= days<=125 ? first*days : first*125 + later*(days-125);
      $('u_total').textContent=fmt(total);};
    ['u_income','u_age','u_dep'].forEach(id=>$(id).addEventListener('input',run)); run();
  }

  // copy buttons
  document.querySelectorAll('[data-copy]').forEach(btn=>btn.addEventListener('click',()=>{
    const el=$(btn.dataset.copy), t=el.innerText;
    const ok=()=>{btn.textContent='הועתק';setTimeout(()=>btn.textContent='העתקה',1800)};
    const sel=()=>{const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r);btn.textContent='הטקסט מסומן, אפשר להעתיק';};
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok,sel); else sel();
  }));
})();

// personal deadlines
(function(){
  const $=id=>document.getElementById(id); if(!$('z_end')) return;
  const end=$('z_end'); if(!end.value){ const t=new Date(); end.value=t.toISOString().slice(0,10); }
  const add=(d,days=0,months=0,years=0)=>{const x=new Date(d); x.setFullYear(x.getFullYear()+years); x.setMonth(x.getMonth()+months); x.setDate(x.getDate()+days); return x;};
  const f=d=>d.toLocaleDateString('he-IL',{day:'numeric',month:'long',year:'numeric'});
  const run=()=>{
    if(!end.value) return; const D=new Date(end.value+'T12:00:00');
    const m=+$('z_months').value||0, a=+$('z_aksh').value||0;
    const notice = m>=12 ? 'חודש' : (m<=6 ? m+' ימים' : (6+2.5*(m-6)).toLocaleString('he-IL')+' ימים');
    const reg = a>=18?6:a>=17?5:a>=16?4:a>=12?3:0;
    const items=[
      [f(D),'יום העבודה האחרון','זה היום שבו הפיצויים צריכים להיות משולמים. ההודעה המוקדמת שמגיעה לך לפי הוותק: '+notice+'.'],
      [f(add(D,1)),'להירשם בשירות התעסוקה','כמה שיותר מהר: דמי האבטלה נספרים רק מיום הרישום. אחרי רישום מקוון מגיעים ללשכה תוך 14 יום.'],
      [f(add(D,15)),'פיצויים שלא שולמו עד היום נחשבים מולנים','מכאן נצברת תוספת על האיחור. זה הזמן לשלוח דרישה בכתב.'],
      reg? [f(add(D,0,reg)),'המועד האחרון להירשם לאבטלה','לפי '+a+' חודשי עבודה מתוך 18, צריך להירשם תוך '+reg+' חודשים מסיום העבודה, כדי לא לאבד את הזכאות.']
         : [f(D),'ייתכן שאין זכאות לדמי אבטלה','נדרשים לפחות 12 חודשי עבודה מתוך 18. כדאי לבדוק בביטוח לאומי אם יש חודשים נוספים שנספרים.'],
      [f(add(D,15,0,1)),'המועד האחרון לתבוע פיצויי הלנה','שנה מהיום שבו הפיצויים נחשבו מולנים. פניות למעסיק לא עוצרות את הספירה.'],
      [f(add(D,0,0,7)),'התיישנות תביעה על פיצויי פיטורים','שבע שנים מסיום העבודה. עדיף לא לחכות: ככל שעובר זמן, קשה יותר להוכיח.'],
    ];
    $('z_out').innerHTML=items.map(([d,t,w])=>`<li><time>${d}</time><b>${t}</b><p>${w}</p></li>`).join('');
  };
  ['z_end','z_months','z_aksh'].forEach(id=>$(id).addEventListener('input',run)); run();
})();

// hero quick severance
(function(){const $=id=>document.getElementById(id); if(!$('h_salary')) return;
 const fmt=n=>Math.round(n).toLocaleString('he-IL')+' ₪';
 const run=()=>{const s=+$('h_salary').value||0,y=+$('h_years').value||0;
  if(y<1){$('h_total').textContent='פחות משנה';$('h_free').textContent='—';$('h_tax').textContent='—';return;}
  const t=s*y; $('h_total').textContent=fmt(t); $('h_free').textContent=fmt(Math.min(t,13750*y)); $('h_tax').textContent=fmt(Math.max(0,t-13750*y));};
 ['h_salary','h_years'].forEach(id=>$(id).addEventListener('input',run)); run();})();
