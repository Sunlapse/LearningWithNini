/* Lessons and question generators for the two extended fraction modes. */
let questionExplanation='',questionHint='';
const fractionSkills={
 decimal:[['tenths','Tenths & hundredths','Grade 4 · A whole can be split into 10 tenths or 100 hundredths. The first digit after the decimal point counts tenths; the second counts hundredths.','3/10 = 0.3 = 0.30 = 30/100. Three tenths cover 30 squares of a 100-square grid.'],['connections','Fractions to decimals','Grade 4 · Rename a fraction with a denominator of 10 or 100. Multiply its numerator and denominator by the same number.','1/2 = 50/100 = 0.50. Also, 1/4 = 25/100 = 0.25.'],['decimalCompare','Compare decimals','Grade 4 · Compare tenths first, then hundredths. A zero at the end does not change the value.','0.5 = 0.50. Since 50 hundredths is more than 35 hundredths, 0.5 > 0.35.']],
 operations:[['like','Add & subtract · like denominators','Grade 4 · When pieces are the same size, add or subtract the numerators. Keep the denominator. Simplify if possible.','1/4 + 2/4 = 3/4. For subtraction: 3/4 − 1/4 = 2/4 = 1/2.'],['unlike','Add & subtract · unlike denominators','Grade 5 · Rename both fractions using a common denominator. Then add or subtract the numerators.','1/2 + 1/3 = 3/6 + 2/6 = 5/6. For subtraction: 3/4 − 1/2 = 3/4 − 2/4 = 1/4.'],['whole','Multiply by a whole number','Grade 4 · Multiplication counts equal groups of a fraction. Multiply the numerator by the whole number. Keep the denominator.','3 × 1/4 = 1/4 + 1/4 + 1/4 = 3/4. A result greater than 1 may be written as an improper fraction: 3 × 1/2 = 3/2.'],['multiply','Multiply two fractions','Grade 5 · Find a fraction of a fraction. Multiply the numerators and multiply the denominators.','1/2 × 3/4 = 3/8. Half of three fourths is three eighths.']]
};
function isNewMode(){return level==='decimal'||level==='operations'}
function grid100(n){return '<div class="decimal-grid" role="img" aria-label="'+n+' of 100 equal squares shaded">'+Array.from({length:100},(_,i)=>'<i class="'+(i<n?'shaded':'')+'"></i>').join('')+'</div><div class="model-label">One whole · 100 equal squares</div>'}
function setupLesson(){el('lessonPanel').hidden=!isNewMode();if(!isNewMode())return;el('skill').innerHTML=fractionSkills[level].map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join('');el('skill').onchange=()=>{q=1;round=1;score=0;streak=0;showLesson();fresh()};showLesson()}
function showLesson(){const x=fractionSkills[level].find(x=>x[0]===el('skill').value);el('lessonText').innerHTML='<p>'+x[2]+'</p><p><strong>Example:</strong> '+x[3]+'</p>'+(level==='decimal'?grid100(el('skill').value==='connections'?50:30):'<div class="model-label">One whole split into fourths · three fourths shaded</div>'+mini(3,4));el('lesson').open=true}
function reduced(n,d){const g=gcd(n,d);return [n/g,d/g]}
function fractionValue(n,d){const f=reduced(n,d);return f[1]===1?String(f[0]):f.join('/')}
function newQ(){
 const skill=el('skill').value;let prompt,model='',opts=[];
 if(level==='decimal'){
  if(skill==='decimalCompare'){
   const a=rnd(1,99),b=Math.random()<.2?a:rnd(1,99);correct=a>b?'>':a<b?'<':'=';prompt=(a/100)+' ? '+(b/100);opts=['<','=','>'];questionHint='Write both values in hundredths. Compare the number of shaded squares.';questionExplanation=a+' hundredths '+correct+' '+b+' hundredths.';model='<div class="compare"><div>'+grid100(a)+'</div><span>?</span><div>'+grid100(b)+'</div></div>';
  }else{
   let n,d;
   if(skill==='tenths'){d=Math.random()<.5?10:100;n=rnd(1,d-1)}else{d=[2,4,5,10,20,25][rnd(0,5)];n=rnd(1,d-1)}
   const h=n*100/d;correct=String(h/100);prompt='Write '+n+'/'+d+' as a decimal';model=grid100(h);const values=new Set([h]);for(const v of [100-h,h+10,h-10,h+1,h-1])if(v>=0&&v<=100&&values.size<4)values.add(v);while(values.size<4)values.add(rnd(0,100));opts=[...values].map(v=>String(v/100));questionHint='Rename the fraction in hundredths: multiply top and bottom by '+(100/d)+'.';questionExplanation=n+'/'+d+' = '+h+'/100 = '+correct+'.';
  }
 }else{
  let a,b,c,d,n,den,op;
  if(skill==='like'||skill==='unlike'){
   b=[3,4,5,6,8,10][rnd(0,5)];d=skill==='like'?b:[2,3,4,5,6,8][rnd(0,5)];if(skill==='unlike'&&d===b)d=b===3?4:3;a=rnd(1,b-1);c=rnd(1,d-1);op=Math.random()<.5?'+':'−';if(op==='−'&&a*d<c*b){[a,c]=[c,a];[b,d]=[d,b]}den=b*d/gcd(b,d);n=a*(den/b)+(op==='+'?1:-1)*c*(den/d);prompt=a+'/'+b+' '+op+' '+c+'/'+d;questionHint='Use '+den+' as a common denominator. Keep that denominator when you '+(op==='+'?'add':'subtract')+'.';questionExplanation=a+'/'+b+' '+op+' '+c+'/'+d+' = '+(a*den/b)+'/'+den+' '+op+' '+(c*den/d)+'/'+den+' = '+fractionValue(n,den)+'.';model='<div class="compare"><div>'+mini(a,b)+'</div><span>'+op+'</span><div>'+mini(c,d)+'</div></div>';
  }else{
   b=rnd(2,8);a=rnd(1,b-1);d=skill==='whole'?1:rnd(2,8);c=skill==='whole'?rnd(2,5):rnd(1,d-1);n=a*c;den=b*d;prompt=(d===1?c+' × '+a+'/'+b:a+'/'+b+' × '+c+'/'+d);questionHint=d===1?'Count '+c+' groups of '+a+'/'+b+'. Multiply '+a+' by '+c+' and keep '+b+' as the denominator.':'Multiply the two numerators. Then multiply the two denominators. Simplify the result.';questionExplanation=prompt+' = '+n+'/'+den+' = '+fractionValue(n,den)+'.';model='<div class="model-label">'+(d===1?'Each group shows '+a+'/'+b:'Start with '+a+'/'+b+' of a whole; find '+c+'/'+d+' of that shaded amount.')+'</div>'+mini(a,b);
  }
  correct=fractionValue(n,den);const values=new Set([correct]);for(const [nn,dd] of [[n+1,den],[Math.abs(n-1),den],[n,den+1],[n+2,den]])if(values.size<4)values.add(fractionValue(nn,dd));let k=1;while(values.size<4)values.add(fractionValue(n+k++,den));opts=[...values];
 }
 el('title').textContent=prompt;el('sub').textContent=level==='decimal'?'Use the model and choose the matching answer.':'Choose the answer in simplest form. Results greater than one may be improper fractions.';el('explain').textContent='Need a reminder? Open the worked example above or ask for a hint.';
 el('visual').innerHTML=model+'<div class="choicegrid">'+shuffle(opts).map(v=>'<button class="choice" data-v="'+esc(v)+'">'+esc(v)+'</button>').join('')+'</div>';el('visual').querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>pick(b));el('selected').textContent='—';stat('Choose an answer, then check it.');
}
