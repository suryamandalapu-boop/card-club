import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.TEST_URL||'http://127.0.0.1:5174/';
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[];
const context=await browser.newContext({viewport:{width:1440,height:1100}});
context.setDefaultTimeout(15000);
const host=await context.newPage();
host.on('pageerror',e=>errors.push(e.message));
await fs.mkdir('test-results',{recursive:true});
try{
 await host.goto(base);await host.locator('h1').waitFor();await host.screenshot({path:'test-results/home-desktop.png',fullPage:true});
 await host.getByRole('button',{name:'Create a room',exact:false}).click();await host.locator('#player-name').fill('Alex');await host.locator('#room-form button').click();
 await host.locator('.lobby-felt').waitFor({timeout:25000});
 const code=await host.locator('.code-button strong').innerText();const room=code.match(/[A-Z0-9]{8}/)[0];
 console.log('Host room created:',room);
 const guestContext=await browser.newContext({viewport:{width:1100,height:900}});guestContext.setDefaultTimeout(15000);const guest=await guestContext.newPage();guest.on('pageerror',e=>errors.push(e.message));
 await guest.goto(base+'?room='+room);await guest.locator('#player-name').fill('Sam');await guest.locator('#room-form button').click();await guest.locator('.lobby-felt').waitFor({timeout:30000});
 assert.equal(await host.locator('.player-row').count(),2);console.log('Second browser joined successfully');
 await guest.locator('[data-tab="chat"]').click();await guest.locator('#chat-input').fill('<script>alert(1)</script> Hello!');await guest.locator('#chat-form button').click();
 await host.locator('[data-tab="chat"]').click();await host.screenshot({path:'test-results/chat-debug.png',fullPage:true});console.log('HOST CHAT',await host.locator('.chat-log').innerText());console.log('GUEST CHAT',await guest.locator('.chat-log').innerText());await host.getByText('<script>alert(1)</script> Hello!',{exact:true}).waitFor();console.log('Chat delivered as escaped text');
 await host.locator('[data-tab="games"]').click();await host.locator('[data-do="start"]').click();await guest.locator('.hand-cards [data-card]').first().waitFor();assert.equal(await host.locator('.hand-cards [data-card]').count(),7);assert.equal(await guest.locator('.hand-cards [data-card]').count(),7);assert.equal(await guest.locator('.opponent-cards .back').count(),5);
 await host.locator('[data-do="draw"]').click();await guest.locator('.turn-label.your-turn').waitFor();console.log('Private deal and synchronized turns verified');
 await host.screenshot({path:'test-results/table-desktop.png',fullPage:true});
 await guest.reload();await guest.locator('#room-form button').click();await guest.locator('.playing-felt').waitFor({timeout:30000});assert.equal(await host.locator('.player-row').count(),2);console.log('Guest rejoined existing hand');
 await host.locator('[data-do="leave"]').click();await host.locator('[data-do="confirm-leave"]').click();await host.getByRole('button',{name:'Try a practice table',exact:false}).click();await host.locator('#player-name').fill('Alex');await host.locator('#new-game').selectOption('poker');await host.locator('#room-form button').click();await host.locator('[data-do="start"]').click();await host.locator('[data-do="call"]').click();await host.locator('[data-do="exchange"]').waitFor({timeout:15000});await host.locator('[data-do="exchange"]').click();await host.locator('[data-do="call"]').waitFor({timeout:15000});await host.locator('[data-do="call"]').click();await host.locator('.win-badge').waitFor({timeout:15000});console.log('Poker practice completed through showdown');
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await mobile.newPage();await page.goto(base);await page.screenshot({path:'test-results/home-mobile.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Mobile page overflow');
 await page.getByRole('button',{name:'Try a practice table',exact:false}).click();await page.locator('#player-name').fill('Mobile');await page.locator('#new-game').selectOption('scum');await page.locator('#room-form button').click();await page.locator('[data-do="start"]').click();await page.screenshot({path:'test-results/table-mobile.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Mobile table overflow');
 assert.deepEqual(errors,[]);console.log('Mobile layout, practice and browser errors checked');
}finally{await browser.close();}


