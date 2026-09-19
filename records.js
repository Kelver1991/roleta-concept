(function(){
  'use strict';
  var KEY='concept-roleta-records-v2', LEGACY='concept-roleta-mobile-v1';
  var state={version:2,drawn:[],records:[],activeId:null}, raw=null, blocked=false, opened=function(){};
  var $=function(id){return document.getElementById(id);};
  var nameKey=function(name){return name.trim().replace(/\s+/g,' ').normalize('NFC').toLocaleLowerCase('pt-BR');};
  var total=function(r){return r.scores.reduce(function(sum,n){return sum+(n===null?0:n);},0);};
  function valid(data){
    return data && data.version===2 && Array.isArray(data.drawn) && data.drawn.length<=12 &&
      data.drawn.every(function(n,i){return Number.isInteger(n)&&n>=0&&n<12&&data.drawn.indexOf(n)===i;}) &&
      Array.isArray(data.records) && data.records.every(function(r,i){return r && typeof r.id==='string' && r.id.length>0 && data.records.findIndex(function(x){return x.id===r.id;})===i &&
        typeof r.name==='string' && r.name.trim().length>0 && r.name.length<=100 && typeof r.theme==='string' && r.theme.length<=100 &&
        typeof r.createdAt==='string' && Number.isFinite(Date.parse(r.createdAt)) && typeof r.updatedAt==='string' && Number.isFinite(Date.parse(r.updatedAt)) &&
        Array.isArray(r.scores)&&r.scores.length===5&&r.scores.every(function(n){return n===null||n===0||n===1||n===2;}) &&
        ['waiting','draft','done'].includes(r.status) && (r.status!=='done'||r.scores.every(function(n){return n!==null;})) &&
        typeof r.feedback==='string'&&r.feedback.length<=5000 && typeof r.received==='boolean';}) &&
      (data.activeId===null||data.records.some(function(r){return r.id===data.activeId;}));
  }
  function error(message){$('recordError').hidden=false;$('recordError').textContent=message;}
  try{
    raw=localStorage.getItem(KEY);
    if(raw!==null){var saved=JSON.parse(raw);if(!valid(saved))throw new Error('invalid');state=saved;}
    else{
      var old=JSON.parse(localStorage.getItem(LEGACY)||'[]');
      if(Array.isArray(old)&&old.length<=12&&old.every(function(n,i){return Number.isInteger(n)&&n>=0&&n<12&&old.indexOf(n)===i;}))state.drawn=old;
    }
  }catch(e){blocked=true;error('Não foi possível ler os registros salvos. Nenhum dado foi substituído. Reabra a página no navegador usado anteriormente.');}
  function commit(next){
    if(blocked)return false;
    try{
      if(localStorage.getItem(KEY)!==raw){error('Os registros mudaram em outra aba. Atualize esta página antes de continuar. Sua alteração atual não foi salva.');blocked=true;return false;}
      var nextRaw=JSON.stringify(next);localStorage.setItem(KEY,nextRaw);raw=nextRaw;state=next;
      $('recordError').hidden=true;return true;
    }catch(e){error('Não foi possível salvar neste navegador. Libere espaço ou saia da navegação privada e tente novamente. Não feche esta tela se houver alterações pendentes.');return false;}
  }
  function copy(){return JSON.parse(JSON.stringify(state));}
  function active(){return state.records.find(function(r){return r.id===state.activeId;})||null;}
  function el(tag,text,cls){var node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;}
  function date(value){return new Date(value).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});}
  function month(value){var d=new Date(value);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');}
  function label(r){return r.status==='done'?'Avaliado · '+total(r)+' / 10':r.received?'Em avaliação':'Aguardando vídeo';}
  function select(id,scroll){
    var next=copy();next.activeId=id;if(!commit(next))return;
    renderEditor();opened(active());
    if(scroll)$('checklist').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function renderEditor(){
    var r=active();$('recordEditor').hidden=!r;$('evaluationFields').disabled=!r;
    $('evaluationEmpty').hidden=!!r;
    if(!r)return;
    $('evaluationName').textContent=r.name;$('evaluationTheme').textContent=r.theme+' · Sorteado em '+date(r.createdAt);
    $('evaluationBadge').textContent=label(r);$('evaluationBadge').className='record-badge'+(r.status==='done'?' done':'');
    $('videoReceived').checked=r.received;$('feedback').value=r.feedback;
    $('recordSaveStatus').textContent='Registro salvo neste aparelho · '+date(r.updatedAt);
  }
  function renderHistory(){
    var query=nameKey($('historySearch').value), status=$('historyStatus').value, selectedMonth=$('historyMonth').value;
    var records=state.records.filter(function(r){return (!query||nameKey(r.name).includes(query))&&(!selectedMonth||month(r.createdAt)===selectedMonth)&&
      (status==='all'||(status==='pending'&&r.status!=='done')||r.status===status);}).slice().reverse();
    var list=$('recordsList');list.replaceChildren();
    $('historySummary').textContent=state.records.length+' sorteio(s) salvo(s) · '+state.records.filter(function(r){return r.status!=='done';}).length+' pendente(s) de conclusão. Exibindo '+records.length+'.';
    if(!records.length)list.appendChild(el('p','Nenhum registro encontrado. Cadastre o consultor e gire a roleta para começar.','record-summary'));
    records.forEach(function(r){
      var card=el('article',undefined,'record-card');card.appendChild(el('span',label(r),'record-badge'+(r.status==='done'?' done':'')));
      card.appendChild(el('h3',r.name));card.appendChild(el('p',r.theme+' · '+date(r.createdAt),'record-meta'));
      if(r.feedback)card.appendChild(el('p',r.feedback,'record-meta'));
      var button=el('button',r.status==='done'?'Ver / editar avaliação':'Abrir para avaliar','nav-btn');button.type='button';button.dataset.recordId=r.id;
      button.addEventListener('click',function(){select(r.id,true);});card.appendChild(button);list.appendChild(card);
    });
    var names=$('consultantNames');names.replaceChildren();var seen=new Set();
    state.records.forEach(function(r){var key=nameKey(r.name);if(!seen.has(key)){seen.add(key);var option=el('option');option.value=r.name;names.appendChild(option);}});
    renderRanking();
  }
  function renderRanking(){
    var selectedMonth=$('historyMonth').value, groups=new Map();
    state.records.filter(function(r){return !selectedMonth||month(r.createdAt)===selectedMonth;}).forEach(function(r){
      var key=nameKey(r.name), row=groups.get(key)||{name:r.name,count:0,sum:0,pending:0};
      if(r.status==='done'){row.count++;row.sum+=total(r);}else row.pending++;
      groups.set(key,row);
    });
    var rows=Array.from(groups.values()).sort(function(a,b){return (b.count?b.sum/b.count:-1)-(a.count?a.sum/a.count:-1)||a.name.localeCompare(b.name,'pt-BR');});
    var root=$('rankingList');root.replaceChildren();
    rows.forEach(function(r){var card=el('div',undefined,'ranking-row'), info=el('div',r.name,'ranking-name');
      info.appendChild(el('small',r.count+' avaliação(ões) concluída(s) · '+r.pending+' pendente(s)'));
      card.appendChild(info);card.appendChild(el('span',r.count?(r.sum/r.count).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+' / 10':'—','ranking-score'));root.appendChild(card);
    });
    if(!rows.length)root.appendChild(el('p','A comparação aparece conforme os sorteios forem registrados.','record-summary'));
  }
  function update(patch){
    var next=copy(), record=next.records.find(function(r){return r.id===next.activeId;});if(!record)return false;
    Object.assign(record,patch,{updatedAt:new Date().toISOString()});
    if(!commit(next)){$('recordSaveStatus').textContent='Alteração não salva. Veja o aviso acima.';return false;}
    $('recordSaveStatus').textContent='Salvo neste aparelho · '+date(record.updatedAt);
    $('evaluationBadge').textContent=label(record);$('evaluationBadge').className='record-badge'+(record.status==='done'?' done':'');
    renderHistory();return true;
  }
  ['historySearch','historyStatus','historyMonth'].forEach(function(id){$(id).addEventListener('input',renderHistory);});
  $('clearFilters').addEventListener('click',function(){$('historySearch').value='';$('historyStatus').value='all';$('historyMonth').value='';renderHistory();});
  $('videoReceived').addEventListener('change',function(){var r=active();if(r)update({received:this.checked,status:r.status==='done'?'done':this.checked?'draft':'waiting'});});
  $('feedback').addEventListener('input',function(){var r=active();if(r)update({feedback:this.value,status:r.status==='done'?'draft':r.status});});
  $('finishEvaluation').addEventListener('click',function(){
    var r=active();if(!r)return;
    if(r.scores.some(function(n){return n===null;})){$('recordSaveStatus').textContent='Preencha as cinco notas antes de concluir. O rascunho continua salvo.';return;}
    if(update({status:'done',received:true})){$('videoReceived').checked=true;$('recordSaveStatus').textContent='Avaliação concluída e incluída na comparação.';}
  });
  $('saveLater').addEventListener('click',function(){
    var r=active();if(!r)return;
    if(update({feedback:$('feedback').value,received:$('videoReceived').checked}))$('recordSaveStatus').textContent='Salvo! Você pode fechar a página e continuar pelo Histórico outro dia.';
  });
  $('exportRecords').addEventListener('click',function(){
    var blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');
    a.href=url;a.download='roleta-backup-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},10000);
  });
  $('importRecords').addEventListener('change',async function(){
    var file=this.files[0];if(!file)return;
    try{
      if(file.size>10*1024*1024)throw new Error();
      var incoming=JSON.parse(await file.text());if(!valid(incoming))throw new Error();
      var next=copy(),added=0;incoming.records.forEach(function(r){if(!next.records.some(function(x){return x.id===r.id;})){next.records.push(r);added++;}});
      if(!state.records.length){next.drawn=incoming.drawn;next.activeId=incoming.activeId;}
      if(commit(next)){renderHistory();renderEditor();opened(active());$('backupStatus').textContent=added+' registro(s) importado(s). Registros já existentes foram preservados.';}
    }catch(e){$('backupStatus').textContent='Arquivo inválido. Selecione um backup JSON exportado por esta roleta.';}
    this.value='';
  });
  window.RoletaRecords={
    getDrawn:function(){return state.drawn.slice();},
    resetCycle:function(){var next=copy();next.drawn=[];return commit(next);},
    draw:function(pick,theme,drawn){
      var input=$('consultantName'),name=input.value.trim().replace(/\s+/g,' ').normalize('NFC');
      if(!name){input.setCustomValidity('Digite o nome do consultor antes de sortear.');input.reportValidity();input.focus();return false;}
      input.setCustomValidity('');if(name.length>100)return false;
      var existing=state.records.find(function(r){return nameKey(r.name)===nameKey(name);});if(existing)name=existing.name;
      var stamp=new Date().toISOString(),id=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
      var next=copy();next.drawn=drawn.concat(pick);next.activeId=id;
      next.records.push({id:id,name:name,theme:theme,createdAt:stamp,updatedAt:stamp,scores:[null,null,null,null,null],feedback:'',received:false,status:'waiting'});
      if(!commit(next))return false;
      renderHistory();renderEditor();opened(active());input.value='';return true;
    },
    saveScores:function(scores){return update({scores:scores.slice(),status:active()&&active().received?'draft':'waiting'});},
    active:active,
    onOpen:function(fn){opened=fn;renderEditor();fn(active());},
    refresh:function(){renderHistory();renderEditor();}
  };
  $('consultantName').addEventListener('input',function(){this.setCustomValidity('');});
  renderHistory();renderEditor();
})();
