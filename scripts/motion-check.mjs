import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:5184/';
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1200,height:1000}});
context.setDefaultTimeout(15000);
const fixture=await context.newPage(),guest=await context.newPage();
const errors=[];guest.on('pageerror',e=>errors.push(e.message));
try{
 await fixture.goto(base);
 const code=await fixture.evaluate(async()=>{
   const {TableNetwork}=await import('/src/network.js');
   window.table=new TableNetwork(()=>{},e=>{throw Error(e);},()=>{});
   return await window.table.create('Host','uno');
 });
 await guest.goto(base+'?room='+code);await guest.locator('#player-name').fill('Player');await guest.locator('#room-form button').click();await guest.locator('.lobby-felt').waitFor();
 await fixture.evaluate(()=>{
   const t=window.table;t.send({type:'start'});
   t.s.players[0].hand=[{id:'a4',c:'wild',v:'+4'},{id:'a4b',c:'wild',v:'+4'},{id:'a9',c:'blue',v:'9'}];
   t.s.players[1].hand=[{id:'b2',c:'green',v:'+2'},{id:'b4',c:'wild',v:'+4'},{id:'b9',c:'yellow',v:'9'}];
   t.s.discard=[{id:'top',c:'red',v:'1'}];t.s.active='red';t.broadcast();
 });
 await guest.locator('[data-card="b2"]').waitFor();
 assert.ok(await guest.locator('.card-flight').count()>0,'deal animates');
 assert.equal(await guest.locator('.card-flight [data-card]').count(),0,'animation clones cannot be played');
 await fixture.evaluate(()=>window.table.send({type:'action',action:{type:'play',cards:['a4'],color:'yellow'}}));
 await guest.getByRole('button',{name:'Draw 4 cards',exact:true}).waitFor();
 assert.ok(await guest.locator('.card-flight').count()>0,'opponent play animates');
 assert.ok(await guest.locator('[data-card="b9"]').evaluate(el=>el.classList.contains('muted')));
 await guest.locator('[data-card="b2"]').click();
 await guest.getByText('+6 stacked · stack +2 / +4 or draw',{exact:true}).waitFor();
 assert.ok(await guest.locator('.card-flight').count()>0,'own play animates');
 assert.equal(await fixture.evaluate(()=>window.table.s.pendingDraw),6);
 await fixture.evaluate(()=>window.table.send({type:'action',action:{type:'play',cards:['a4b'],color:'yellow'}}));
 await guest.getByRole('button',{name:'Draw 10 cards',exact:true}).click();
 await guest.waitForFunction(()=>document.querySelectorAll('.hand-cards [data-card]').length===12);
 assert.ok(await guest.locator('.card-flight').count()>0,'stack draw animates multiple cards');
 assert.equal(await fixture.evaluate(()=>window.table.s.pendingDraw),0);
 assert.equal(await fixture.evaluate(()=>window.table.s.turn),0);
 await guest.screenshot({path:'test-results/stack-draw-animation.png',fullPage:true});
 // A chat render must not replay old moves.
 await guest.waitForFunction(()=>document.querySelectorAll('.card-flight').length===0);
 await fixture.evaluate(()=>window.table.send({type:'chat',text:'Nice stack!'}));
 await guest.getByRole('button',{name:'Table chat',exact:true}).click();
 await guest.getByText('Nice stack!',{exact:true}).waitFor();
 assert.equal(await guest.locator('.card-flight').count(),0);
 await guest.emulateMedia({reducedMotion:'reduce'});
 await fixture.evaluate(()=>window.table.send({type:'action',action:{type:'draw'}}));
 await guest.locator('.turn-label.your-turn').waitFor();
 await guest.locator('[data-do="draw"]').click();
 await guest.waitForFunction(()=>document.querySelectorAll('.hand-cards [data-card]').length===13);
 assert.equal(await guest.locator('.card-flight').count(),0,'reduced motion disables flights');
 assert.deepEqual(errors,[]);
 console.log('PASS: cross-color mixed stacking, +10 draw and skip, deal/play/draw animations, no chat replays, reduced motion, no browser errors.');
}finally{await fixture.evaluate(()=>window.table?.close()).catch(()=>{});await browser.close();}
