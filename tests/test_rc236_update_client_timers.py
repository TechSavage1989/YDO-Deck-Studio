import os
from pathlib import Path
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from threading import Thread, Lock
import json, time
from playwright.sync_api import sync_playwright, expect

root=Path(__file__).resolve().parents[1]
app=(root/'web/js/app.js').read_text()
start=app.index('function startApplicationUpdater()')
update_js=app[start:]
state={'checks':0,'heartbeats':0,'installs':0,'downloads':0,'mode':'available'}
lock=Lock()

class H(BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def sendj(self,obj,status=200):
        b=json.dumps(obj).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Access-Control-Allow-Origin','*');self.send_header('Access-Control-Allow-Headers','Content-Type');self.end_headers();self.wfile.write(b)
    def do_OPTIONS(self): self.send_response(204);self.send_header('Access-Control-Allow-Origin','*');self.send_header('Access-Control-Allow-Headers','Content-Type');self.end_headers()
    def do_GET(self):
        if self.path=='/api/update/ping': return self.sendj({'app_id':'com.techsavage1989.ygo-deck-studio','version':'3.0.0-alpha.221-duelcore.1-rc238'})
        if self.path=='/api/update/status':
            return self.sendj({'state':'downloading','installed_version':'3.0.0-alpha.221-duelcore.1-rc238','latest':{'version':'3.0.0-alpha.221-duelcore.1-rc239','notes':['One'],'read_more':False},'download_progress':55,'message':'Downloading update...'})
        self.send_error(404)
    def do_POST(self):
        l=int(self.headers.get('Content-Length','0') or 0); self.rfile.read(l)
        if self.path.startswith('/api/update/hello'): return self.sendj({'ok':True})
        if self.path.startswith('/api/update/heartbeat'):
            with lock: state['heartbeats']+=1
            return self.sendj({'ok':True})
        if self.path.startswith('/api/update/check'):
            with lock:
                state['checks']+=1; mode=state['mode']
            if mode=='error': return self.sendj({'error':'offline'},500)
            return self.sendj({'state':'downloaded' if mode=='downloaded' else 'available','installed_version':'3.0.0-alpha.221-duelcore.1-rc238','latest':{'version':'3.0.0-alpha.221-duelcore.1-rc239','page_url':'https://example.invalid/release','notes':['First','Second'],'read_more':True},'downloaded':mode=='downloaded','download_progress':100 if mode=='downloaded' else 0,'message':'Update downloaded and verified.' if mode=='downloaded' else 'An update is available.'})
        if self.path.startswith('/api/update/download'):
            with lock: state['downloads']+=1
            time.sleep(.12)
            with lock: state['mode']='downloaded'
            return self.sendj({'state':'downloaded','installed_version':'3.0.0-alpha.221-duelcore.1-rc238','latest':{'version':'3.0.0-alpha.221-duelcore.1-rc239','notes':['First'],'read_more':False},'downloaded':True,'download_progress':100,'message':'Update downloaded and verified.'})
        if self.path.startswith('/api/update/install'):
            with lock: state['installs']+=1
            return self.sendj({'ok':True,'restart':True})
        self.send_error(404)

server=ThreadingHTTPServer(('127.0.0.1',49357),H);Thread(target=server.serve_forever,daemon=True).start()
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get("YGO_CHROMIUM_EXECUTABLE"),headless=True,args=['--no-sandbox'])
        page=browser.new_page()
        html='''<!doctype html><html><body><div id="appMenuPanel"><section class="modern-menu-section"><h3>Database & Help</h3><button data-menu-action="help">Help</button></section></div><div id="toastStack"></div></body></html>'''
        page.set_content(html)
        page.add_style_tag(content=(root/'web/styles.css').read_text())
        stubs="""
        const state={dirty:false}; let integratedDuelController={running:false};
        const dom={}; const toast=(m,t='')=>{window.__toasts=(window.__toasts||[]).concat(m)};
        const appConfirm=async()=>true; const closeAppMenus=()=>{}; let shutdowns=0; const requestApplicationShutdown=()=>{shutdowns++};
        window.__YGO_UPDATE_TEST_TIMINGS__={intervalMs:500,focusMs:100,heartbeatMs:80};
        """
        page.add_script_tag(content=stubs+update_js+'\nstartApplicationUpdater();')
        def wait_state(predicate):
            deadline=time.monotonic()+5
            while not predicate():
                if time.monotonic()>=deadline: raise AssertionError(state.copy())
                page.wait_for_timeout(20)
        wait_state(lambda: state['checks']>=2 and state['heartbeats']>=2)
        expect(page.locator('#appUpdateBanner')).to_be_visible()
        expect(page.locator('[data-update-version]')).to_contain_text('Latest 3.0.0-alpha.221-duelcore.1-rc239', timeout=5000)
        page.wait_for_timeout(120)
        before=state['checks'];page.evaluate("window.dispatchEvent(new Event('focus'))")
        wait_state(lambda: state['checks']>before)
        page.locator('[data-update-download]').click()
        wait_state(lambda: state['downloads']==1)
        expect(page.locator('[data-update-install]')).to_be_visible(timeout=5000)
        page.evaluate('state.dirty=true');page.locator('[data-update-install]').click()
        page.wait_for_function("(window.__toasts||[]).some(x=>x.includes('Save the current deck'))")
        assert state['installs']==0,state
        page.evaluate('state.dirty=false; integratedDuelController.running=true');page.locator('[data-update-install]').click()
        page.wait_for_function("(window.__toasts||[]).some(x=>x.includes('End the active duel'))")
        assert state['installs']==0,state
        page.evaluate('integratedDuelController.running=false');page.locator('[data-update-install]').click()
        wait_state(lambda: state['installs']==1)
        with lock: state['mode']='error'
        page.wait_for_timeout(120);before=state['checks'];page.evaluate("window.dispatchEvent(new Event('focus'))")
        wait_state(lambda: state['checks']>before)
        expect(page.locator('[data-update-title]')).to_have_text('Update check unavailable', timeout=5000)
        assert 'up to date' not in page.locator('#appUpdateBanner').inner_text().lower()
        browser.close()
finally:
    server.shutdown();server.server_close()
print('rc236 real browser update timers, focus checks, progress, restart guards, and error state: PASS')
