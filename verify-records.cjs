const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert');
(async()=>{
 const server=http.createServer((req,res)=>{let file=path.join(__dirname,req.url==='/'?'index.html':req.url.slice(1));if(!fs.existsSync(file)){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.end(fs.readFileSync(file));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',acceptDownloads:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url='http://127.0.0.1:'+server.address().port;
  const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('concept-roleta-records-v2')));
  const spin=async name=>{await page.locator('#consultantName').fill(name);await page.locator('#spinBtn').tap();await page.waitForFunction(()=>!document.querySelector('#spinBtn').disabled||document.querySelector('#spinBtn').textContent==='Ciclo completo!');};
  await page.goto(url);
  await page.locator('#spinBtn').tap();assert.equal(await read(),null,'empty name must not create a draw');
  await page.evaluate(()=>localStorage.setItem('concept-roleta-mobile-v1','[0,1]'));await page.reload();
  await spin('Ana Souza');let state=await read();assert.equal(state.drawn.length,3);assert.equal(state.records.length,1);assert.equal(state.records[0].status,'waiting');const anaId=state.activeId;
  await page.reload();assert.equal(await page.locator('#evaluationName').textContent(),'Ana Souza');
  await page.locator('.pt-btn[data-i="0"][data-v="0"]').tap();await page.locator('#feedback').fill('Boa abertura. Melhorar a comparação.');
  await page.locator('#saveLater').tap();await page.reload();assert.equal(await page.locator('#feedback').inputValue(),'Boa abertura. Melhorar a comparação.');assert.equal((await read()).records[0].scores[0],0);
  await page.locator('#finishEvaluation').tap();assert.notEqual((await read()).records[0].status,'done');
  await spin('Bruno Lima');assert.equal((await read()).records.length,2);assert.equal(await page.locator('#feedback').inputValue(),'');
  for(let i=0;i<5;i++)await page.locator('.pt-btn[data-i="'+i+'"][data-v="2"]').tap();
  await page.locator('#finishEvaluation').tap();assert.equal((await read()).records[1].status,'done');assert.match(await page.locator('#rankingList').textContent(),/10,0/);
  await page.locator('[data-record-id="'+anaId+'"]').tap();assert.equal(await page.locator('#feedback').inputValue(),'Boa abertura. Melhorar a comparação.');
  for(let i=1;i<5;i++)await page.locator('.pt-btn[data-i="'+i+'"][data-v="2"]').tap();
  await page.locator('#finishEvaluation').tap();assert.equal((await read()).records[0].status,'done');assert.match(await page.locator('#rankingList').textContent(),/8,0/);
  await spin('  ANA   SOUZA ');assert.equal((await read()).records[2].name,'Ana Souza');
  assert.equal(await page.locator('.ranking-row').count(),2);assert.match(await page.locator('#rankingList').textContent(),/8,0/,'pending should not reduce average');
  const longName='<img src=x onerror=alert(1)> '+ 'Consultor '.repeat(7);
  await spin(longName.slice(0,100));assert.equal(await page.locator('#recordsList img').count(),0);
  await page.locator('#historySearch').fill('Bruno');assert.equal(await page.locator('.record-card').count(),1);await page.locator('#clearFilters').tap();
  await page.locator('#historyStatus').selectOption('pending');assert.equal(await page.locator('.record-card').count(),2);await page.locator('#clearFilters').tap();
  for(const width of [320,375,390,430,844]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);}
  await page.setViewportSize({width:390,height:844});
  for(let i=0;i<6;i++)await spin('Consultor '+i);
  assert.equal((await read()).drawn.length,12);assert.equal(new Set((await read()).drawn).size,12);
  await page.locator('#resetCycle').tap();assert.equal((await read()).records.length,10);assert.equal((await read()).drawn.length,0);
  await page.getByText('Cópia de segurança',{exact:true}).tap();
  const downloaded=page.waitForEvent('download');await page.locator('#exportRecords').tap();const download=await downloaded;const backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(backup.records.length,10);
  await page.locator('#importRecords').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});assert.equal((await read()).records.length,10);
  await page.locator('#importRecords').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{}')});await page.waitForFunction(()=>document.querySelector('#backupStatus').textContent.includes('inválido'));assert.equal((await read()).records.length,10);
  await page.locator('[data-record-id="'+anaId+'"]').tap();await page.locator('#checklist').screenshot({path:path.join(__dirname,'../tmp/avaliacao-consultor.png')});
  await page.locator('#historySearch').fill('Ana');await page.locator('#historico').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(__dirname,'../tmp/historico-consultor.png')});
  const other=await context.newPage();await other.goto(url);await other.locator('#consultantName').fill('Outra aba');await other.locator('#spinBtn').tap();
  await page.locator('#feedback').fill('Alteração conflitante');assert.match(await page.locator('#recordError').textContent(),/outra aba/);assert(!(await read()).records.some(r=>r.feedback==='Alteração conflitante'));
  const blocked=await browser.newContext({reducedMotion:'reduce'});await blocked.addInitScript(()=>{Storage.prototype.setItem=function(){throw new Error('quota');};});const failure=await blocked.newPage();await failure.goto(url);await failure.locator('#consultantName').fill('Não salvo');await failure.locator('#spinBtn').click();assert.match(await failure.locator('#recordError').textContent(),/Não foi possível salvar/);assert.equal(await failure.locator('#resultValue').textContent(),'Toque em girar');await blocked.close();
  const restored=await browser.newContext();const restorePage=await restored.newPage();await restorePage.goto(url);await restorePage.getByText('Cópia de segurança',{exact:true}).click();await restorePage.locator('#importRecords').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await restorePage.waitForFunction(()=>document.querySelector('#backupStatus').textContent.includes('10 registro'));await restorePage.reload();assert.equal(await restorePage.locator('.record-card').count(),10);await restored.close();
  assert.deepEqual(errors,[]);console.log('PASS: nome obrigatório, migração, avaliação em outro dia, notas zero/parciais, múltiplos consultores, ranking sem pendências, filtros, 5 larguras, ciclo sem apagar histórico, backup, restauração, conflito entre abas e falha de armazenamento.');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});


