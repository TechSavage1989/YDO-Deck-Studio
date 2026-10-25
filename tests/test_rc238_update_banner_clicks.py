import os
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError, expect, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
APP_ID = 'com.techsavage1989.ygo-deck-studio'
VERSION = re.search(r'AppVersion\s*=\s*"([^"]+)"', (ROOT / 'launcher/version.go').read_text()).group(1)
LATEST = VERSION.rsplit('rc', 1)[0] + 'rc' + str(int(VERSION.rsplit('rc', 1)[1]) + 1)
APP = (ROOT / 'web/js/app.js').read_text()
UPDATE_JS = APP[APP.index('function startApplicationUpdater()'):]
STUBS = """
const state={dirty:false}; let integratedDuelController={running:false}; const dom={};
const toast=()=>{}; const appConfirm=async()=>true; const closeAppMenus=()=>{};
const requestApplicationShutdown=()=>{};
window.__YGO_UPDATE_TEST_TIMINGS__={intervalMs:60000,focusMs:60000,heartbeatMs:5000};
"""


def run(legacy=False):
    requests = {'downloads': 0, 'installs': 0, 'downloaded': False}

    def status():
        return {
            'state': 'downloaded' if requests['downloaded'] else 'available',
            'installed_version': VERSION,
            'latest': {'version': LATEST, 'notes': ['A newer build is available.'], 'read_more': False},
            'downloaded': requests['downloaded'],
            'message': 'Update downloaded and verified.' if requests['downloaded'] else 'Please wait before checking again.',
        }

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def send_json(self, payload):
            body = json.dumps(payload).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(body)

        def do_OPTIONS(self):
            self.send_response(204)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()

        def do_GET(self):
            if self.path == '/api/update/ping':
                self.send_json({'app_id': APP_ID, 'version': VERSION})
            elif self.path == '/api/update/status':
                self.send_json(status())
            else:
                self.send_error(404)

        def do_POST(self):
            self.rfile.read(int(self.headers.get('Content-Length', '0')))
            if self.path.startswith('/api/update/download'):
                requests['downloads'] += 1
                requests['downloaded'] = True
                self.send_json(status())
            elif self.path.startswith('/api/update/install'):
                requests['installs'] += 1
                self.send_json({'ok': True})
            elif self.path.startswith('/api/update/check'):
                self.send_json(status())
            elif self.path.startswith(('/api/update/hello', '/api/update/heartbeat')):
                self.send_json({'ok': True})
            else:
                self.send_error(404)

    source_css = (ROOT / 'web/styles.css').read_text()
    styles = [('source stylesheet', source_css)]
    if not legacy:
        import sys
        sys.path.insert(0, str(ROOT / 'tools'))
        from patch_embedded_web import PEImage, read_embed_table
        core = (ROOT / 'launcher/payload/YGODeckStudioCore.exe').read_bytes()
        image = PEImage(bytearray(core))
        entry = read_embed_table(image)['web/styles.css']
        offset = image.va_to_offset(entry.data_va)
        styles.append(('packaged native stylesheet', core[offset:offset + entry.original_size].decode()))

    server = ThreadingHTTPServer(('127.0.0.1', 49357), Handler)
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=os.environ.get('YGO_CHROMIUM_EXECUTABLE'), headless=True, args=['--no-sandbox'])
            for label, css in styles:
                for width in (823, 1280):
                    requests.update(downloads=0, installs=0, downloaded=False)
                    page = browser.new_page(viewport={'width': width, 'height': 600})
                    page.set_content('<!doctype html><html><body><div id="appMenuPanel"><section class="modern-menu-section"><h3>Database &amp; Help</h3><button data-menu-action="help">Help</button></section></div><div id="toastStack"></div></body></html>')
                    page.add_style_tag(content=css)
                    page.add_script_tag(content=STUBS + UPDATE_JS + '\nstartApplicationUpdater();')
                    button = page.locator('[data-update-download]')
                    expect(page.locator('[data-update-title]')).to_have_text('Update available')
                    expect(button).to_be_visible()
                    expect(button).to_be_enabled()
                    assert requests['downloads'] == 0 and requests['installs'] == 0
                    pointer = button.evaluate('(el)=>getComputedStyle(el).pointerEvents')
                    if legacy:
                        assert pointer == 'none'
                        try:
                            button.click(timeout=600)
                            raise AssertionError('The affected baseline unexpectedly accepted a mouse click')
                        except PlaywrightTimeoutError:
                            pass
                        assert requests['downloads'] == 0
                        for _ in range(20):
                            page.keyboard.press('Tab')
                            if page.evaluate('document.activeElement?.hasAttribute("data-update-download")'):
                                break
                        else:
                            raise AssertionError('Download was not keyboard focusable')
                        page.keyboard.press('Enter')
                    else:
                        assert pointer == 'auto', (label, width, pointer)
                        assert not page.locator('#appUpdateBanner').evaluate('(el)=>el.classList.contains("is-progress")')
                        button.click(timeout=5000)
                    expect(page.locator('[data-update-install]')).to_be_visible()
                    assert requests['downloads'] == 1 and requests['installs'] == 0
                    assert page.locator('[data-update-install]').evaluate('(el)=>getComputedStyle(el).pointerEvents') == 'auto'
                    print(('LEGACY mouse-block reproduction and Tab/Enter recovery' if legacy else 'REAL MOUSE download') + f': {label}, width {width}: PASS')
                    page.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    run()
