import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
js_source = (root / 'web' / 'js' / 'duel-core.js').read_text(encoding='utf-8')
assert "duelcore.1-rc241" in js_source
assert "without changing legality" in js_source
assert "directSelectionBody.append(x)" in js_source
js = js_source.replace('export function ', 'function ').replace('export class ', 'class ') + '\nwindow.IntegratedDuelController=IntegratedDuelController;'

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get("YGO_CHROMIUM_EXECUTABLE"),headless=True, args=['--no-sandbox'])
    page = browser.new_page()
    page.set_content('<!doctype html><html><body></body></html>')
    page.add_script_tag(content=js)
    result = page.evaluate(r'''()=>{
      const proto=window.IntegratedDuelController.prototype;
      const c=Object.create(proto);
      const L={DECK:1,HAND:2,MZONE:4,SZONE:8,GRAVE:16,REMOVED:32,EXTRA:64};
      const dm=46986420, dmod=59400890, eternal=48680970, dragonKnight=41721210;
      const names={
        [dm]:'Dark Magician',
        [dmod]:'Dark Magician of Destruction',
        [eternal]:'Eternal Soul',
        [dragonKnight]:'Dark Magician the Dragon Knight'
      };
      const desc={
        [dm]:'The ultimate wizard in terms of attack and defense.',
        [dmod]:'"Dark Magician" + 1 LIGHT or DARK monster Must be either Fusion Summoned, or Special Summoned (from your Extra Deck) during the turn a Spell Card or effect is activated, by banishing 1 Level 6 or higher DARK Spellcaster monster you control as material. You can only Special Summon "Dark Magician of Destruction" once per turn this way, no matter which method you use. This card\'s name becomes "Dark Magician" while on the field or in the GY. If this card is Special Summoned: You can add 1 "Dark Magician" or 1 card that mentions it from your Deck to your hand.',
        [eternal]:'Every "Dark Magician" in your Monster Zone is unaffected by your opponent\'s card effects. You can activate 1 of these effects; Special Summon 1 "Dark Magician" from your hand or GY. Add 1 "Dark Magic Attack" or "Thousand Knives" from your Deck to your hand.',
        [dragonKnight]:'"Dark Magician" + 1 Dragon monster. This card\'s name becomes "Dark Magician" while on the field or in the GY.'
      };
      Object.assign(c,{
        mod:{OcgLocation:L},
        knownHands:[[{code:dm,position:10}],[]],
        knownPiles:[{grave:[{code:dmod,position:5},{code:dragonKnight,position:5}],removed:[]},{grave:[],removed:[]}],
        knownDecks:[[],[]],knownExtras:[[],[]],
        knownField:[{mzone:Array(7).fill(null),szone:Array(8).fill(null)},{mzone:Array(7).fill(null),szone:Array(8).fill(null)}],
        currentPrompt:null,currentPromptRevision:1,pendingResolve:()=>{}
      });
      c.normalizeActionCode=value=>Number(value)||0;
      c.cardName=code=>names[Number(code)]||`Card ${code}`;
      c.cardDescription=code=>desc[Number(code)]||'';
      c.conciseEffectText=text=>String(text||'').replace(/\s+/g,' ').trim();
      c.inferPromptEffectText=()=> 'Special Summon 1 "Dark Magician" from your hand or GY.';
      c.effectSourceCode=()=>eternal;
      c.selectionIdentity=item=>`${Number(item.controller)||0}:${Number(item.location)||0}:${Number(item.sequence)||0}:${Number(item.overlay_sequence??-1)}`;
      const m={player:0,type:15,min:1,max:1,selects:[{code:dm,controller:0,location:L.HAND,sequence:0,position:10}]};
      const legal=[...m.selects];
      const blocked=c.relatedUnavailableSelectionCards(m,legal);
      if(blocked.length!==2)throw new Error('Expected both name-equivalent GY cards to be reference-only unavailable cards: '+JSON.stringify(blocked));
      const dmodEntry=blocked.find(entry=>entry.item.code===dmod),dkEntry=blocked.find(entry=>entry.item.code===dragonKnight);
      if(!dmodEntry)throw new Error('Dark Magician of Destruction was not detected');
      const dmodName=c.selectionCurrentName(dmod,L.GRAVE);if(dmodName.name!=='Dark Magician'||!dmodName.changed)throw new Error('GY name identity was not applied');
      if(!/mandatory Summoning condition/.test(dmodEntry.reason)||!/Eternal Soul/.test(dmodEntry.reason))throw new Error('DMoD explanation was not specific enough: '+dmodEntry.reason);
      if(!dkEntry)throw new Error('Dragon Knight should still be reported when OCGCore excludes it');
      if(!/another rule/.test(dkEntry.reason))throw new Error('Generic authoritative exclusion explanation missing');

      let detailsOpened=0,submits=0;
      c.inspectCard=()=>{};c.renderCardDetailsModal=()=>{detailsOpened++};c.submitResponse=()=>{submits++};c.bindInspectorHover=()=>{};c.playSound=()=>{};
      c.locationKey=loc=>loc===L.HAND?'hand':loc===L.GRAVE?'grave':'';
      c.actionCard=(item,onClick,label)=>{const tile=document.createElement('div');tile.className='duel-prompt-card';tile.textContent=label;tile.addEventListener('click',onClick);return tile;};
      const section=c.renderUnavailableSelectionContext(m,legal);
      if(!section)throw new Error('Unavailable context was not rendered');
      const unavailable=[...section.querySelectorAll('.duel-unavailable-card')];
      if(unavailable.length!==2)throw new Error('Unexpected unavailable-card count');
      unavailable[0].click();
      if(detailsOpened!==1)throw new Error('Reference card did not open Card Details');
      if(submits!==0)throw new Error('Unavailable reference card changed the OCGCore selection');
      return {
        legalCount:legal.length,blockedCount:blocked.length,dmodReason:dmodEntry.reason,
        dmodCurrentName:dmodName.name,dragonKnightReason:dkEntry.reason,
        badgeCount:section.querySelectorAll('.duel-unavailable-badge').length,detailsOpened,submits
      };
    }''')
    assert result['legalCount'] == 1, result
    assert result['blockedCount'] == 2, result
    assert result['dmodCurrentName'] == 'Dark Magician', result
    assert result['badgeCount'] == 2, result
    assert result['detailsOpened'] == 1 and result['submits'] == 0, result
    browser.close()

print('rc235 named-identity legality explanation regression: PASS')
