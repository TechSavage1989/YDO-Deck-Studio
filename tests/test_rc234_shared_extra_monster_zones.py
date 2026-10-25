import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
js_source=(root/'web/js/duel-core.js').read_text(encoding='utf-8')
assert "duelcore.1-rc241" in js_source
assert 'physicalExtraMonsterSequence' in js_source
assert 'data-physical-sequence' in js_source
js=js_source.replace('export function ','function ').replace('export class ','class ')+'\nwindow.IntegratedDuelController=IntegratedDuelController;'
html='<!doctype html><html><body><main id="board" class="duel-board-wrap"><div id="duelExtraMonsterZones" class="duel-extra-row"></div></main></body></html>'

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get("YGO_CHROMIUM_EXECUTABLE"),headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1000,'height':700})
    page.set_content(html)
    page.add_script_tag(content=js)
    result=page.evaluate("""()=>{
      const proto=window.IntegratedDuelController.prototype,L={MZONE:4,SZONE:8,HAND:2,GRAVE:16,REMOVED:32,EXTRA:64,DECK:1};
      const c=Object.create(proto),conflicts=[];
      const empty=()=>({mzone:Array(7).fill(null),szone:Array(8).fill(null),hand:[],deck:[],grave:[],removed:[],extra:[]});
      Object.assign(c,{mod:{OcgLocation:L},boardWrap:document.getElementById('board'),field:{players:[empty(),empty()]},activePlacePrompt:null,currentPrompt:null,selectedPlaces:[],traceSession:(event,data)=>conflicts.push({event,data})});
      c.makeCard=(card,{player,locationKey,sequence})=>{const n=document.createElement('div');n.className='duel-card';n.dataset.player=String(player);n.dataset.location=locationKey;n.dataset.sequence=String(sequence);n.dataset.code=String(card.code);n.dataset.renderSlot=`card:${player}:${sequence}`;n.dataset.renderSignature=`${card.code}`;return n;};

      c.field.players[0].mzone[5]={code:34755994,controller:0,location:L.MZONE,sequence:5,position:1};
      c.field.players[1].mzone[5]={code:42097666,controller:1,location:L.MZONE,sequence:5,position:1};
      c.renderExtraZones();
      const zones=[...document.querySelectorAll('#duelExtraMonsterZones .duel-zone')];
      const state=zones.map(z=>({physical:Number(z.dataset.physicalSequence),player:z.querySelector('.duel-card')?.dataset.player||'',sequence:z.querySelector('.duel-card')?.dataset.sequence||'',code:Number(z.querySelector('.duel-card')?.dataset.code)||0}));
      const opponentNodePhysical=Number(c.extraMonsterZoneNode(1,5)?.dataset.physicalSequence);
      const ownNodePhysical=Number(c.extraMonsterZoneNode(0,5)?.dataset.physicalSequence);
      zones[0].getBoundingClientRect=()=>({left:100,top:200,width:80,height:80,right:180,bottom:280,x:100,y:200});
      zones[1].getBoundingClientRect=()=>({left:500,top:200,width:80,height:80,right:580,bottom:280,x:500,y:200});
      const opponentFallbackLeft=c.rectForLocation({controller:1,location:L.MZONE,sequence:5},{preferCard:false})?.left;
      const ownFallbackLeft=c.rectForLocation({controller:0,location:L.MZONE,sequence:5},{preferCard:false})?.left;

      c.field={players:[empty(),empty()]};
      c.currentPrompt={player:1};c.activePlacePrompt={places:[{player:1,location:L.MZONE,sequence:5,label:'Opponent Right Extra Monster Zone'}],count:1,responseType:10};c.selectedPlaces=[];
      c.renderExtraZones();
      const legal=[...document.querySelectorAll('#duelExtraMonsterZones .duel-zone.legal-target')].map(z=>Number(z.dataset.physicalSequence));

      c.field={players:[empty(),empty()]};c.activePlacePrompt=null;c.currentPrompt=null;
      c.field.players[0].mzone[5]={code:34755994,controller:0,location:L.MZONE,sequence:5,position:1};
      c.field.players[1].mzone[6]={code:24361622,controller:1,location:L.MZONE,sequence:6,position:1};
      c.renderExtraZones();
      const physicalFive=document.querySelector('#duelExtraMonsterZones .duel-zone[data-physical-sequence="5"]');
      const conflictCards=physicalFive.querySelectorAll('.duel-card').length;

      return {state,opponentNodePhysical,ownNodePhysical,opponentFallbackLeft,ownFallbackLeft,legal,conflictCards,conflicts,
        map:[c.physicalExtraMonsterSequence(0,5),c.physicalExtraMonsterSequence(0,6),c.physicalExtraMonsterSequence(1,5),c.physicalExtraMonsterSequence(1,6)],
        labels:[c.extraMonsterZoneLabel(0,5),c.extraMonsterZoneLabel(1,5)]};
    }""")
    print(result)
    assert result['map']==[5,6,6,5], result
    assert result['state']==[
        {'physical':5,'player':'0','sequence':'5','code':34755994},
        {'physical':6,'player':'1','sequence':'5','code':42097666},
    ], result
    assert result['ownNodePhysical']==5 and result['opponentNodePhysical']==6, result
    assert result['ownFallbackLeft']==100 and result['opponentFallbackLeft']==500, result
    assert result['legal']==[6], result
    assert result['conflictCards']==1, result
    assert any(x['event']=='shared-emz-conflict-suppressed' for x in result['conflicts']), result
    assert result['labels']==['Your Left Extra Monster Zone','Opponent Right Extra Monster Zone'], result
    browser.close()

print('rc234 shared Extra Monster Zone physical mapping and occupancy guard: PASS')
