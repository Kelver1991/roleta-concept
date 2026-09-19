(function(){
  var SUPA_URL='https://jfnzxezhlrtqujppjzbb.supabase.co';
  var SUPA_KEY='sb_publishable_ESjFBOIV0mD6i0Nzi4vtJg_PGZAVjoj';
  var supabaseClient=null, remoteLoading=false;
  function show(id,on){var e=document.getElementById(id);if(e)e.hidden=!on;}
  function msg(t){var e=document.getElementById('authMessage');if(e)e.textContent=t;}
  function recordsRows(state,userId){return state.records.map(function(r){return {id:r.id,owner_id:userId,consultant_name:r.name,theme:r.theme,created_at:r.createdAt,updated_at:r.updatedAt,received:r.received,status:r.status,scores:r.scores,feedback:r.feedback};});}
  async function loadRemote(user){
    remoteLoading=true;msg('Carregando seus registros…');
    var res=await supabaseClient.from('roleta_records').select('*').order('created_at',{ascending:true});
    if(res.error){msg('Não foi possível carregar os registros. Tente atualizar a página.');remoteLoading=false;return;}
    var local=window.RoletaRecords.getState(), rows=res.data||[];
    var incoming={version:2,drawn:local.drawn,activeId:null,records:rows.map(function(r){return {id:r.id,name:r.consultant_name,theme:r.theme,createdAt:r.created_at,updatedAt:r.updated_at,received:r.received,status:r.status,scores:r.scores,feedback:r.feedback};})};
    if(incoming.records.length){incoming.activeId=incoming.records[incoming.records.length-1].id;window.RoletaRecords.replaceState(incoming);}
    msg('Conectada como '+(user.email||'Evelyn')+'. Os registros ficam sincronizados.');show('authScreen',false);show('appContent',true);remoteLoading=false;
  }
  async function sync(){
    if(!supabaseClient||remoteLoading)return;
    var user=(await supabaseClient.auth.getUser()).data.user;if(!user)return;
    var state=window.RoletaRecords.getState();
    await supabaseClient.from('roleta_records').delete().eq('owner_id',user.id);
    if(state.records.length)await supabaseClient.from('roleta_records').insert(recordsRows(state,user.id));
  }
  async function boot(){
    if(!window.supabase||!window.RoletaRecords)return;
    supabaseClient=window.supabase.createClient(SUPA_URL,SUPA_KEY);
    var session=(await supabaseClient.auth.getSession()).data.session;
    if(session){await loadRemote(session.user);}else{show('authScreen',true);show('appContent',false);}
    document.getElementById('authForm').addEventListener('submit',async function(e){e.preventDefault();var email=document.getElementById('authEmail').value.trim(),pass=document.getElementById('authPassword').value;
      msg('Entrando…');var result=await supabaseClient.auth.signInWithPassword({email:email,password:pass});
      if(result.error){msg('E-mail ou senha incorretos. No primeiro acesso, use “Criar acesso”.');return;}await loadRemote(result.data.user);
    });
    document.getElementById('createAccess').addEventListener('click',async function(){var email=document.getElementById('authEmail').value.trim(),pass=document.getElementById('authPassword').value;
      if(!email||!pass||pass.length<8){msg('Digite o e-mail e uma senha com pelo menos 8 caracteres.');return;}msg('Criando acesso…');var result=await supabaseClient.auth.signUp({email:email,password:pass});
      if(result.error){msg(result.error.message);return;}if(result.data.session)await loadRemote(result.data.user);else msg('Acesse seu e-mail para confirmar o cadastro e depois entre aqui.');
    });
    document.getElementById('logoutCloud').addEventListener('click',async function(){await supabaseClient.auth.signOut();location.reload();});
    ['saveLater','finishEvaluation','videoReceived'].forEach(function(id){var e=document.getElementById(id);if(e)e.addEventListener('click',function(){setTimeout(sync,300);});});
    document.getElementById('spinBtn').addEventListener('click',function(){setTimeout(sync,5000);});
    document.getElementById('resetCycle').addEventListener('click',function(){setTimeout(sync,500);});
  }
  window.addEventListener('load',boot);
})();
