import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
js_source=(root/'web/js/duel-core.js').read_text(encoding='utf-8')
css=(root/'web/duel-core.css').read_text(encoding='utf-8')+'\n'+(root/'web/styles.css').read_text(encoding='utf-8')
assert "duelcore.1-rc237" in js_source
assert 'overlay_sequence' in js_source
assert 'Attached Xyz Materials' in js_source
assert "summary.links.size<1" in js_source
js=js_source.replace('export function ','function ').replace('export class ','class ')+'\nwindow.IntegratedDuelController=IntegratedDuelController;'
html='''<!doctype html><html><head><style>'''+css+'''</style></head><body>
<div id="root"><main id="board" class="duel-board-wrap" style="position:relative;width:940px;height:650px">
<section id="prompt" class="duel-field-prompt selection-prompt"><h2 id="title"></h2><div id="body" class="duel-prompt-body"></div></section>
</main></div></body></html>'''

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get("YGO_CHROMIUM_EXECUTABLE"),headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1100,'height':760})
    page.set_content(html)
    page.add_script_tag(content=js)
    result=page.evaluate('''async()=>{
      const proto=window.IntegratedDuelController.prototype;
      const T={SELECT_CARD:15,SELECT_TRIBUTE:24,SELECT_SUM:23,SELECT_UNSELECT_CARD:26};
      const R={SELECT_CARD:5,SELECT_TRIBUTE:6,SELECT_SUM:14};
      const L={DECK:1,HAND:2,MZONE:4,SZONE:8,GRAVE:16,REMOVED:32,EXTRA:64};
      const P={FACEUP:1,FACEUP_ATTACK:1};
      const host={code:93039339,controller:0,location:L.MZONE,sequence:2,position:1};
      const field={players:[{mzone:[null,null,host,null,null,null,null],szone:Array(8).fill(null),hand:[],deck:[],grave:[],removed:[],extra:[]},{mzone:Array(7).fill(null),szone:Array(8).fill(null),hand:[],deck:[],grave:[],removed:[],extra:[]}]};
      const prompt=document.getElementById('prompt'),body=document.getElementById('body'),title=document.getElementById('title');
      const c=Object.create(proto),responses=[];
      Object.assign(c,{mod:{OcgMessageType:T,OcgResponseType:R,OcgLocation:L,OcgPosition:P,OcgReason:{}},root:document.getElementById('root'),boardWrap:document.getElementById('board'),prompt,promptTitle:title,promptBody:body,field,currentPromptRevision:77,stagedCardSelection:null,inlineCardSelection:null,pendingSpecialSummon:null,pendingPlayerAttack:null,directHandFieldSelectionEnabled:true,confirmCardSelectionsEnabled:false,promptRestoreButton:null,promptMinimized:false,chainEffectHoverEnabled:false,selectedCardContext:null,pendingMoveArrivals:new Set(),activeMonsterStatKeys:new Set(),pendingDrawArrivals:new Set(),pendingDrawPresentationCounts:[0,0],knownHands:[[],[]],knownDecks:[[],[]],knownExtras:[[],[]],knownPiles:[{grave:[],removed:[]},{grave:[],removed:[]}],knownField:[{mzone:[null,null,{...host},null,null,null,null],szone:Array(8).fill(null)},{mzone:Array(7).fill(null),szone:Array(8).fill(null)}],opponentCardsVisible:true,cardMovementAnimationsEnabled:true,duelAnimationsEnabled:true});
      c.cardName=code=>({93039339:'Super Starslayer TY-PHON - Sky Crisis',59400890:'Dark Magician of Destruction',24361622:'Hieratic Seal of the Heavenly Spheres'}[Number(code)]||'Card '+code);
      c.inferPromptEffectText=()=> 'Once per turn: You can detach 1 material from this card; return 1 monster from the field to the hand.';
      c.effectSourceCode=()=>93039339;c.projectIgnisSelectionDescriptor=()=>null;c.selectionInstructionIsRedundant=()=>false;c.semanticPromptSection=(label,text)=>{const x=document.createElement('section');x.textContent=label+' '+text;return x};c.isChainRelatedCardSelectionPrompt=()=>false;c.isPlayerAttackTargetPrompt=()=>false;c.renderRecentRevealPreview=()=>null;c.summonTargetReference=()=>null;c.scheduleSelectionPromptSizing=()=>{};c.syncStagedChainPhysicalFocus=()=>{};c.syncExactPhysicalSelectionFocus=()=>{};c.renderField=()=>{};c.playSound=()=>{};c.bindInspectorHover=()=>{};c.inspectCard=()=>{};c.renderCardDetailsModal=()=>{};c.submitResponse=r=>responses.push(r);c.pendingResolve=()=>{};
      c.button=(label,fn,o={})=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=!!o.disabled;b.addEventListener('click',fn);return b;};

      const material={code:59400890,controller:0,location:L.MZONE,sequence:2,position:1,overlay_sequence:0};
      const m={type:T.SELECT_CARD,player:0,can_cancel:false,min:1,max:1,selects:[material]};c.currentPrompt=m;
      const purpose=c.selectionPurpose(m);
      c.renderMultiCardPrompt(m);
      const group=body.querySelector('.duel-xyz-material-selection'),tile=body.querySelector('.duel-xyz-material-choice');
      const hostWouldBeDirect=c.isInlineSurfaceSelectionItem(material);
      const materialNumber=tile?.dataset.overlayNumber||'';
      tile?.click();await new Promise(r=>setTimeout(r,10));

      // Duplicate-code materials remain distinct because overlay_sequence participates in identity.
      const material2={...material,overlay_sequence:1};
      const identityDistinct=c.selectionIdentity(material)!==c.selectionIdentity(material2);

      // Overlay moves must not clear the host slot or use the host art as the moving material art.
      const beforeHost=Number(c.knownField[0].mzone[2]?.code)||0;c.clearKnownLocation(material,material.code);const afterClearHost=Number(c.knownField[0].mzone[2]?.code)||0;
      c.rememberKnownLocation(material,material.code,1);const afterRememberHost=Number(c.knownField[0].mzone[2]?.code)||0;
      const detachText=c.movementText({card:59400890,from:material,to:{controller:0,location:L.GRAVE,sequence:5,position:1}});
      const attachText=c.movementText({card:59400890,from:{controller:0,location:L.MZONE,sequence:2,position:1},to:{controller:0,location:L.EXTRA,sequence:4,position:1,overlay_sequence:0}});
      const hostNode=document.createElement('div');hostNode.className='duel-card';hostNode.dataset.player='0';hostNode.dataset.location='mzone';hostNode.dataset.sequence='2';const hostImg=document.createElement('img');hostImg.src='host-image.png';hostNode.append(hostImg);document.getElementById('board').append(hostNode);hostNode.getBoundingClientRect=()=>({left:100,top:100,width:50,height:70,right:150,bottom:170,x:100,y:100});
      c.animationQueue=[];c.rectForLocation=()=>({left:200,top:200,width:50,height:70,right:250,bottom:270,x:200,y:200});c.animationCodeVisible=code=>Number(code)||0;c.moveArrivalKey=()=> 'arrival';
      const moveItem=c.queueMoveAnimation({card:59400890,from:material,to:{controller:0,location:L.GRAVE,sequence:5,position:1}});

      // A one-link chain must produce the same terminal summary event as a multi-link chain.
      const logged=[];const summary=Object.create(proto);Object.assign(summary,{activeChainSummary:{id:'chain-typhon',links:new Map([[1,{chainLink:1,code:93039339,controller:0,effect:'Detach 1 material; return 1 monster.',respondsToLink:0,outcome:'Resolved'}]]),resolutionOrder:[1],events:[],startedTurn:3,startedPhase:'Main Phase 1'},consolidatedChainSummariesEnabled:true,log:(text,details)=>logged.push({text,details}),traceSession:()=>{}});summary.finalizeChainSummary();
      const finalEntry=logged.find(x=>x.details.type==='chain-summary');

      // Visual final-chain entry keeps event-tile click and card-image click as separate actions.
      let eventOpened=0,cardOpened=0;const visual=Object.create(proto);Object.assign(visual,{turn:3,logEntryClasses:()=>'',logEntryReferencedCodes:()=>[93039339],cardName:c.cardName,bindInspectorHover:()=>{},inspectCard:()=>{cardOpened++},renderCardDetailsModal:()=>{},renderLogEvent:()=>{eventOpened++}});visual.logVisualDescriptor=proto.logVisualDescriptor.bind(visual);
      const finalLine={text:'CHAIN SUMMARY - 1 Chain Link resolved.',turn:3,phase:'Main Phase 1',details:{type:'chain-summary',chainInstanceId:'chain-typhon',cards:[{code:93039339}],chainSequence:[{chainLink:1,code:93039339,controller:0,outcome:'Resolved'}],resolutionSequence:[{chainLink:1,code:93039339,controller:0,outcome:'Resolved'}],outcome:'Chain complete'}};
      const logTile=visual.renderVisualLogEntry(finalLine);document.body.append(logTile);const chainImg=logTile.querySelector('.duel-log-final-chain-card img');chainImg.click();const cardClickCounts={eventOpened,cardOpened};logTile.click();const tileClickCounts={eventOpened,cardOpened};
      return {purposeTitle:purpose.title,group:!!group,tile:!!tile,hostWouldBeDirect,materialNumber,responses,identityDistinct,beforeHost,afterClearHost,afterRememberHost,detachText,attachText,moveSource:moveItem?.sourceSrc||'',finalTypes:logged.map(x=>x.details.type),finalLinks:finalEntry?.details?.chainSequence?.length||0,finalClass:logTile.className,finalTitle:logTile.title,cardClickCounts,tileClickCounts,chainBadge:logTile.querySelector('.duel-log-final-chain-card b')?.textContent||''};
    }''')
    print(result)
    assert 'Xyz Material' in result['purposeTitle'] and 'TY-PHON' in result['purposeTitle'], result
    assert result['group'] and result['tile'], result
    assert result['hostWouldBeDirect'] is False, result
    assert result['materialNumber']=='1', result
    assert result['responses']==[{'type':5,'indicies':[0]}], result
    assert result['identityDistinct'], result
    assert result['beforeHost']==93039339 and result['afterClearHost']==93039339 and result['afterRememberHost']==93039339, result
    assert 'detaches Dark Magician of Destruction' in result['detachText'] and 'TY-PHON' in result['detachText'], result
    assert 'attaches Dark Magician of Destruction' in result['attachText'], result
    assert '59400890' in result['moveSource'] and 'host-image' not in result['moveSource'], result
    assert result['finalTypes']==['chain-visual','chain-summary'] and result['finalLinks']==1, result
    assert 'duel-log-final-chain-entry' in result['finalClass'] and result['finalTitle']=='Open Chain Summary' and result['chainBadge']=='CL1', result
    assert result['cardClickCounts']=={'eventOpened':0,'cardOpened':1}, result
    assert result['tileClickCounts']=={'eventOpened':1,'cardOpened':1}, result
    browser.close()

print('rc233 Xyz Material routing, detach semantics, and final-chain visual summary: PASS')
