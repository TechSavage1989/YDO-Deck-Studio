import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
js_source=(root/'web/js/duel-core.js').read_text(encoding='utf-8')
css=(root/'web/duel-core.css').read_text(encoding='utf-8')+'\n'+(root/'web/styles.css').read_text(encoding='utf-8')
assert 'duelcore.1-rc241' in js_source
assert 'duel-log-inline-card-image' in js_source
js=js_source.replace('export function ','function ').replace('export class ','class ')+'\nwindow.IntegratedDuelController=IntegratedDuelController;'
html="""<!doctype html><html><head><style>"""+css+"""</style></head><body><aside style='width:390px'><div id='duelLog' class='duel-log'></div></aside></body></html>"""
entry={
    'id':17,'turn':3,'phase':'Main Phase 1','text':"Player activates Dark Magical Circle.",
    'details':{'type':'chain','controller':0,'code':47222536,'chainLink':1,'cards':[{'code':47222536,'controller':0,'location':8,'sequence':2}]}
}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get("YGO_CHROMIUM_EXECUTABLE"),headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':800,'height':600})
    page.set_content(html)
    page.add_script_tag(content=js)
    result=page.evaluate("""(entry)=>{
      const proto=window.IntegratedDuelController.prototype,c=Object.create(proto),eventOpens=[],cardOpens=[],inspections=[];
      Object.assign(c,{logNode:document.getElementById('duelLog'),logLines:[entry],turn:3,phase:0,selectedLogCardCode:0,hoverLogCardCode:0,selectedLogCardInfo:null,hoverLogCardInfo:null});
      c.normalizeActionCode=v=>Number(v)||0;
      c.cardName=code=>Number(code)===47222536?'Dark Magical Circle':`Card ${code}`;
      c.renderLogEvent=line=>eventOpens.push(line.id);
      c.renderCardDetailsModal=(code,info)=>cardOpens.push({code,location:info?.location,sequence:info?.sequence});
      c.inspectCard=(code,info)=>inspections.push({code,location:info?.location,sequence:info?.sequence});
      c.bindInspectorHover=()=>{};
      c.updateLogCardHighlights=()=>{};
      c.renderLog();
      const tile=c.logNode.querySelector('.duel-log-visual-entry'),img=tile.querySelector('.duel-log-inline-card-image'),summary=tile.querySelector('.duel-log-visual-summary');
      summary.click();
      const afterEvent=[...eventOpens];
      img.click();
      return {afterEvent,eventOpens,cardOpens,inspections,title:img.title,cursor:getComputedStyle(img).cursor};
    }""",entry)
    print(result)
    assert result['afterEvent']==[17],result
    assert result['eventOpens']==[17],result
    assert result['cardOpens']==[{'code':47222536,'location':8,'sequence':2}],result
    assert result['inspections']==[{'code':47222536,'location':8,'sequence':2}],result
    assert result['title']=='View Dark Magical Circle Card Details',result
    assert result['cursor']=='pointer',result
    browser.close()
print('rc232 visual Duel Log event/card click routing: PASS')
