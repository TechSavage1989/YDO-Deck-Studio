import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
js_source = (root / 'web' / 'js' / 'duel-core.js').read_text(encoding='utf-8')
assert "duelcore.1-rc238" in js_source
assert "exact-count SELECT_UNSELECT_CARD decisions do not need a second Confirm click" in js_source
js = js_source.replace('export function ', 'function ').replace('export class ', 'class ') + '\nwindow.IntegratedDuelController=IntegratedDuelController;'

html = """<!doctype html><html><body>
<div id='root'><main id='board' class='duel-board-wrap' style='position:relative;width:900px;height:600px'>
<section id='prompt' class='duel-field-prompt'><h2 id='title'></h2><div id='body'></div></section>
<section id='dock' class='duel-direct-selection-dock'><strong id='dockTitle'></strong><div id='dockBody'></div></section>
</main></div>
</body></html>"""

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get("YGO_CHROMIUM_EXECUTABLE"),headless=True, args=['--no-sandbox'])
    page = browser.new_page()
    page.set_content(html)
    page.add_script_tag(content=js)
    result = page.evaluate("""async()=>{
      const proto=window.IntegratedDuelController.prototype;
      const T={SELECT_UNSELECT_CARD:18};
      const R={SELECT_UNSELECT_CARD:118};
      const L={HAND:2,MZONE:4,SZONE:8};
      const m={type:T.SELECT_UNSELECT_CARD,player:0,select_cards:[{code:32314730,controller:0,location:L.MZONE,sequence:2}],unselect_cards:[],can_finish:false,can_cancel:true,max:1};
      const c=Object.create(proto),responses=[];
      Object.assign(c,{
        mod:{OcgMessageType:T,OcgResponseType:R,OcgLocation:L},
        root:document.getElementById('root'),boardWrap:document.getElementById('board'),
        prompt:document.getElementById('prompt'),promptTitle:document.getElementById('title'),promptBody:document.getElementById('body'),
        directSelectionDock:document.getElementById('dock'),directSelectionTitle:document.getElementById('dockTitle'),directSelectionBody:document.getElementById('dockBody'),
        currentPrompt:m,currentPromptRevision:51,pendingResolve:()=>{},pendingSpecialSummon:{code:34755994,name:'Artemis, the Magistus Moon Maiden',player:0,sourceKey:'extra'},
        stagedCardSelection:null,inlineCardSelection:null,stagedUnselectCommit:null,directHandFieldSelectionEnabled:true,confirmCardSelectionsEnabled:true,
        promptRestoreButton:null,promptMinimized:false,selectedCardContext:null,pendingMoveArrivals:new Set(),activeMonsterStatKeys:new Set()
      });
      c.locationKey=v=>v===L.HAND?'hand':v===L.MZONE?'mzone':v===L.SZONE?'szone':'';
      c.surfaceSelectionLocationKey=item=>`${item.controller}:${item.location}:${item.sequence}`;
      c.isInlineSurfaceSelectionItem=item=>['hand','mzone','szone'].includes(c.locationKey(Number(item.location)||0));
      c.attachDirectSurfaceSelectionPrompt=()=>true;c.positionDirectSurfaceSelectionDock=()=>{};c.ensureDirectSurfaceSelectionDock=()=>c.directSelectionDock;
      c.selectionPurpose=()=>({title:'Choose materials',intro:'Choose material.',action:'Selection',roleLabel:'Current Required Action'});c.selectionInstructionIsRedundant=()=>true;c.semanticPromptSection=()=>null;c.isChainRelatedCardSelectionPrompt=()=>false;c.summonTargetReference=()=>null;c.scheduleSelectionPromptSizing=()=>{};c.renderField=()=>{};
      c.legalActionsForContext=()=>[];c.appendLiveMonsterStats=()=>{};c.bindInspectorHover=()=>{};c.handleCardClick=()=>{};c.playSound=()=>{};c.syncExactPhysicalSelectionFocus=()=>{};c.cardName=code=>code===32314730?\"Magician's Rod\":'Card '+code;
      c.button=(label,fn,o={})=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=!!o.disabled;b.addEventListener('click',fn);return b;};c.submitResponse=r=>responses.push(r);c.toast=()=>{};

      c.renderUnselectStagingPrompt(m);
      const confirm=[...c.directSelectionBody.querySelectorAll('button')].find(b=>/Confirm Materials/.test(b.textContent));
      const before={confirmExists:!!confirm,confirmHidden:!!confirm&&confirm.hidden,dockText:c.directSelectionBody.textContent};
      const physical=c.makeCard({code:32314730,location:L.MZONE,sequence:2},{player:0,locationKey:'mzone',sequence:2});
      if(!physical.classList.contains('duel-selection-candidate'))throw new Error('physical material was not directly selectable');
      physical.click();
      await new Promise(r=>setTimeout(r,10));
      return {before,responses,selected:[...(c.inlineCardSelection?.selected||[])]};
    }""")
    assert result['before']['confirmExists'] is False, result
    assert 'Confirm Materials' not in result['before']['dockText'], result
    assert result['responses'] == [{'type':118,'index':0}], result
    assert result['selected'] == [0], result

    prompt_result = page.evaluate("""async()=>{
      const proto=window.IntegratedDuelController.prototype;
      const T={SELECT_UNSELECT_CARD:18},R={SELECT_UNSELECT_CARD:118},L={MZONE:4};
      const m={type:T.SELECT_UNSELECT_CARD,player:0,select_cards:[{code:32314730,controller:0,location:L.MZONE,sequence:2}],unselect_cards:[],can_finish:false,can_cancel:false,min:1,max:1};
      const c=Object.create(proto),responses=[];
      Object.assign(c,{mod:{OcgMessageType:T,OcgResponseType:R,OcgLocation:L},prompt:document.getElementById('prompt'),promptTitle:document.getElementById('title'),promptBody:document.getElementById('body'),currentPrompt:m,currentPromptRevision:52,pendingResolve:()=>{},pendingSpecialSummon:{code:34755994,name:'Artemis, the Magistus Moon Maiden',player:0,sourceKey:'extra'},stagedCardSelection:null,inlineCardSelection:null,stagedUnselectCommit:null,directHandFieldSelectionEnabled:false,confirmCardSelectionsEnabled:true});
      c.promptBody.replaceChildren();c.locationKey=()=> 'mzone';c.selectionPurpose=()=>({title:'Choose materials',intro:'Choose material.',action:'Selection',roleLabel:'Current Required Action'});c.selectionInstructionIsRedundant=()=>true;c.semanticPromptSection=()=>null;c.isChainRelatedCardSelectionPrompt=()=>false;c.summonTargetReference=()=>null;c.scheduleSelectionPromptSizing=()=>{};c.syncExactPhysicalSelectionFocus=()=>{};c.cardName=code=>code===32314730?\"Magician's Rod\":'Card '+code;c.playSound=()=>{};c.submitResponse=r=>responses.push(r);c.toast=()=>{};
      c.button=(label,fn,o={})=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=!!o.disabled;b.addEventListener('click',fn);return b;};
      c.actionCard=(item,onClick,label,options={})=>{const b=document.createElement('button');b.type='button';b.className='duel-prompt-card';b.textContent=label;b.addEventListener('click',()=>{if(options.confirmSelection&&options.isSelected?.())options.onDeselect?.();else onClick();});return b;};
      c.renderUnselectStagingPrompt(m);
      const confirm=[...c.promptBody.querySelectorAll('button')].find(b=>/Confirm Materials/.test(b.textContent));
      const tile=c.promptBody.querySelector('.duel-prompt-card');tile.click();await new Promise(r=>setTimeout(r,10));
      return {confirmExists:!!confirm,responses};
    }""")
    assert prompt_result['confirmExists'] is False, prompt_result
    assert prompt_result['responses'] == [{'type':118,'index':0}], prompt_result
    browser.close()

print('rc230 exact SELECT_UNSELECT_CARD material auto-submit: PASS')
