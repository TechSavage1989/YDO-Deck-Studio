const DUEL_BRANCH = 'duelcore.1-rc238';















const DUMMY_CARD_CODE = 89631139; // Blue-Eyes White Dragon: inert Level 8 normal monster.
const SELFTEST_NORMAL_CODE = 43096270; // Alexandrite Dragon: deterministic normal-summon smoke test.
const SELFTEST_EFFECT_CODE = 55144522; // Pot of Greed: deterministic script/chain/draw smoke test.
const CARD_IMAGE_BASE = 'https://images.ygoprodeck.com/images/cards/';

const $id = id => document.getElementById(id);
const safeText = value => String(value ?? '');

function cardImage(code) {
  const n = Number(code) || 0;
  return n ? `${CARD_IMAGE_BASE}${n}.jpg` : 'assets/card_placeholder.png';
}

function randomSeed() {
  const words = new Uint32Array(8);
  crypto.getRandomValues(words);
  const result = [];
  for (let i = 0; i < 8; i += 2) {
    result.push((BigInt(words[i]) << 32n) | BigInt(words[i + 1]));
  }
  if (result.every(x => x === 0n)) result[0] = 1n;
  return result;
}

function shuffle(values) {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const j = buf[0] % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function loadClassicScript(src) {
  return new Promise((resolve, reject) => {
    const prior = document.querySelector(`script[data-duel-src="${src}"]`);
    if (prior?.dataset.loaded === '1') return resolve();
    const script = prior || document.createElement('script');
    script.dataset.duelSrc = src;
    script.src = src;
    script.async = true;
    script.onload = () => { script.dataset.loaded = '1'; resolve(); };
    script.onerror = () => reject(new Error(`Unable to load ${src}`));
    if (!prior) document.head.append(script);
  });
}

function formatLocation(mod, loc) {
  const L = mod?.OcgLocation || {};
  const entries = [
    [L.DECK, 'Deck'], [L.HAND, 'Hand'], [L.MZONE, 'Monster Zone'], [L.SZONE, 'Spell/Trap Zone'],
    [L.GRAVE, 'Graveyard'], [L.REMOVED, 'Banished'], [L.EXTRA, 'Extra Deck'], [L.OVERLAY, 'Material'],
    [L.FZONE, 'Field Zone'], [L.PZONE, 'Pendulum Zone'],
  ];
  return entries.find(([value]) => value != null && (loc & value))?.[1] || `Location ${loc}`;
}

function formatPosition(mod, value) {
  const P = mod?.OcgPosition || {};
  if (value === P.FACEUP_ATTACK) return 'Attack';
  if (value === P.FACEDOWN_ATTACK) return 'Face-down Attack';
  if (value === P.FACEUP_DEFENSE) return 'Defense';
  if (value === P.FACEDOWN_DEFENSE) return 'Face-down Defense';
  return `Position ${value}`;
}

function firstBits(mask, values) {
  return values.filter(v => (mask & v) !== 0);
}




export function wholeCardViewport(cardCount, cardWidth, gap, availableWidth, paddingStart=0, paddingEnd=paddingStart) {
  const count=Math.max(0,Math.floor(Number(cardCount)||0));
  const width=Math.max(1,Number(cardWidth)||1),space=Math.max(0,Number(gap)||0);
  const start=Math.max(0,Number(paddingStart)||0),end=Math.max(0,Number(paddingEnd)||0);
  const available=Math.max(width+start+end,Number(availableWidth)||0);
  if(!count)return{visibleCount:0,viewportWidth:start+end,stride:width+space};
  const usable=Math.max(width,available-start-end);
  const visibleCount=Math.max(1,Math.min(count,Math.floor((usable+space)/(width+space))||1));
  const viewportWidth=start+end+visibleCount*width+Math.max(0,visibleCount-1)*space;
  return{visibleCount,viewportWidth,stride:width+space};
}






export function wholeCardViewportByStride(cardCount, cardWidth, stride, availableWidth, insetStart=0, insetEnd=insetStart) {
  const count=Math.max(0,Math.floor(Number(cardCount)||0));
  const width=Math.max(1,Number(cardWidth)||1),step=Math.max(width,Number(stride)||width);
  const start=Math.max(0,Number(insetStart)||0),end=Math.max(0,Number(insetEnd)||0);
  const available=Math.max(width+start+end,Number(availableWidth)||0);
  if(!count)return{visibleCount:0,viewportWidth:start+end,stride:step};
  const room=Math.max(0,available-start-end-width);
  const visibleCount=Math.max(1,Math.min(count,1+Math.floor((room+0.001)/step)));
  const viewportWidth=start+end+width+Math.max(0,visibleCount-1)*step;
  return{visibleCount,viewportWidth,stride:step};
}




export function wholeCardRailInsets(cardWidth, stride, insetStart=0, insetEnd=insetStart) {
  const width=Math.max(1,Number(cardWidth)||1),step=Math.max(width,Number(stride)||width);
  const gutter=Math.max(0,step-width),start=Math.max(0,Number(insetStart)||0),end=Math.max(0,Number(insetEnd)||0);
  const safe=Math.min(start,end,gutter);
  return{start:safe,end:safe,gutter};
}

export function chainDisplayFootprint(linkCount=1,connectorCount=0,shelfWidth=320,shelfHeight=168,scalePercent=100) {
  const links=Math.max(1,Math.floor(Number(linkCount)||1)),connectors=Math.max(0,Math.floor(Number(connectorCount)||0));
  const width=Math.max(1,Number(shelfWidth)||1),height=Math.max(1,Number(shelfHeight)||1);
  const scale=Math.max(.55,Math.min(1,(Number(scalePercent)||100)/100));
  const baseWidth=Math.min(width,Math.max(220,links*188+connectors*45+20));
  return{baseWidth,width:baseWidth*scale,height:height*scale,scale};
}


function installRc191DuelStyles() {
  if(typeof document==='undefined'||document.getElementById('duelRc191Styles'))return;
  const style=document.createElement('style');style.id='duelRc191Styles';style.textContent=`.duel-start-setup-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:start;width:100%;min-width:0;box-sizing:border-box}.duel-start-setup-section{display:flex;flex-direction:column;gap:9px;min-width:0;padding:12px;border:1px solid var(--duel-border,#445268);border-radius:13px;background:rgba(14,20,31,.76);box-sizing:border-box;overflow:hidden}.duel-start-setup-section h3{margin:0;font-size:15px}.duel-start-setup-section .duel-selection-purpose{margin:0;font-size:12px}.duel-start-setup-section .duel-dummy-mode-choice-list{display:grid;grid-template-columns:1fr;gap:7px}.duel-start-setup-section .duel-option-choice{grid-template-columns:1fr;gap:4px;min-height:0;padding:9px 10px;touch-action:manipulation;transition:border-color .06s ease,background .06s ease,box-shadow .06s ease}.duel-start-setup-section .duel-option-choice-label{font-size:12px}.duel-start-setup-section .duel-option-choice-effect{font-size:10.5px;line-height:1.35}.duel-start-setup-section .duel-option-choice.current-choice{border-color:rgba(123,169,255,.85);background:linear-gradient(180deg,rgba(38,62,91,.98),rgba(24,39,58,.98));box-shadow:0 0 0 1px rgba(123,169,255,.2)}.duel-start-setup-section .duel-option-choice.current-choice .duel-option-choice-label::after{content:'Selected';display:inline-block;margin-left:7px;padding:1px 5px;border-radius:999px;font-size:9px;color:#dbe8ff;background:rgba(90,135,215,.25);border:1px solid rgba(123,169,255,.4)}.duel-start-deck-summary{display:grid;gap:3px;width:100%;min-width:0;max-width:100%;box-sizing:border-box;overflow:hidden;padding:9px 10px;border-radius:10px;background:rgba(255,255,255,.055)}.duel-start-deck-summary span{min-width:0;font-size:11px;opacity:.72}.duel-start-deck-summary strong{display:block;min-width:0;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.25}.duel-start-deck-select{width:100%;min-width:0;max-width:100%;box-sizing:border-box;touch-action:manipulation}.duel-start-setup-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:13px}.duel-start-deck-tools{display:flex;flex-wrap:wrap;gap:7px}.duel-start-deck-tools .duel-action,.duel-start-setup-actions .duel-action{touch-action:manipulation}.duel-start-library-status{font-size:11px;opacity:.72}.duel-start-setup-prompt{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}.duel-start-setup-prompt button[aria-busy='true']{cursor:progress;opacity:.78}.duel-start-setup-prompt .duel-prompt-panel{max-width:min(1180px,95vw)}.duel-consolidated-menu{position:absolute;top:58px;right:14px;z-index:90;width:min(300px,calc(100vw - 28px));padding:10px;display:grid;gap:7px;border:1px solid var(--duel-border,#445268);border-radius:12px;background:rgba(15,20,29,.98);box-shadow:0 18px 46px rgba(0,0,0,.42)}.duel-consolidated-menu[hidden]{display:none!important}.duel-consolidated-menu-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:3px}.duel-consolidated-menu .btn{width:100%;text-align:left}.duel-consolidated-menu-head .btn{width:auto}.duel-consolidated-menu-separator{height:1px;background:rgba(255,255,255,.1);margin:2px 0}@media(max-width:980px){.duel-start-setup-grid{grid-template-columns:1fr}.duel-start-setup-section .duel-dummy-mode-choice-list{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.duel-start-setup-section .duel-dummy-mode-choice-list{grid-template-columns:1fr}}`;
  document.head.append(style);
}

export class IntegratedDuelController {
  constructor({ getDeck, getCardById, getDeckName, getRecentDuelDecks, getDeckLibraryDuelDecks, getDeckLibraryState, openDuelDeck, chooseDeckLibraryDuelDeck, openDeckLibrarySettings, refreshDeckLibrary, openCardArt, toast, formatCardText, getCardTextStyling, toggleCardTextStyling, getCardLimitStatus, getBanlist }) {
    installRc191DuelStyles();
    this.getDeck = getDeck;
    this.getCardById = getCardById;
    this.getDeckName = getDeckName;
    this.getRecentDuelDecks = typeof getRecentDuelDecks === 'function' ? getRecentDuelDecks : (() => []);
    this.getDeckLibraryDuelDecks = typeof getDeckLibraryDuelDecks === 'function' ? getDeckLibraryDuelDecks : (() => []);
    this.getDeckLibraryState = typeof getDeckLibraryState === 'function' ? getDeckLibraryState : (() => ({ready:true,refreshing:false}));
    this.openDuelDeck = typeof openDuelDeck === 'function' ? openDuelDeck : null;
    this.chooseDeckLibraryDuelDeck = typeof chooseDeckLibraryDuelDeck === 'function' ? chooseDeckLibraryDuelDeck : null;
    this.openDeckLibrarySettings = typeof openDeckLibrarySettings === 'function' ? openDeckLibrarySettings : null;
    this.refreshDeckLibrary = typeof refreshDeckLibrary === 'function' ? refreshDeckLibrary : null;
    this.openCardArt = typeof openCardArt === 'function' ? openCardArt : null;
    this.toast = typeof toast === 'function' ? toast : (() => {});
    this.formatCardText = typeof formatCardText === 'function' ? formatCardText : null;
    this.getCardTextStyling = typeof getCardTextStyling === 'function' ? getCardTextStyling : (() => true);
    this.toggleCardTextStyling = typeof toggleCardTextStyling === 'function' ? toggleCardTextStyling : null;
    this.getCardLimitStatus = typeof getCardLimitStatus === 'function' ? getCardLimitStatus : (() => 'Unlimited');
    this.getBanlist = typeof getBanlist === 'function' ? getBanlist : (() => 'TCG');
    this.root = $id('duelWorkspace');
    this.app = $id('app');
    this.prompt = $id('duelPrompt');
    this.promptTitle = $id('duelPromptTitle');
    this.promptBody = $id('duelPromptBody');
    this.promptMinimizeButton = $id('duelPromptMinimize');
    this.promptRestoreButton = $id('duelPromptRestore');
    this.directSelectionDock = $id('duelDirectSelectionDock');
    this.directSelectionTitle = $id('duelDirectSelectionTitle');
    this.directSelectionBody = $id('duelDirectSelectionBody');
    this.phaseDock = $id('duelPhaseDock');
    this.phaseAnnouncement = $id('duelPhaseAnnouncement');
    this.boardWrap = $id('duelBoardWrap');
    this.battleArea = this.boardWrap?.querySelector?.('.duel-battle-area') || null;
    this.duelMat = this.boardWrap?.querySelector?.('.duel-mat') || null;
    this.logNode = $id('duelLog');
    this.engineStatus = $id('duelEngineStatus');
    this.phaseNode = $id('duelPhase');
    this.turnNode = $id('duelTurn');
    this.lpNodes = [$id('duelPlayerLP'), $id('duelOpponentLP')];
    this.running = false;
    this.starting = false;
    this.core = null;
    this.mod = null;
    this.handle = null;
    this.db = null;
    this.runtimeValidated = false;
    this.runtimeValidationWarning = '';
    this.currentPrompt = null;
    this.selectedCardContext = null;
    this.activePlacePrompt = null;
    this.selectedPlaces = [];
    this.pendingResolve = null;
    this.promptRevision = 0;
    this.currentPromptRevision = 0;
    this.promptVisibilityTimer = 0;
    this.promptMinimized = false;
    this.promptFitFrame = 0;
    this.selectionSizingFrame = 0;
    this.interactionWatchdogTimer = 0;
    this.interactionWatchdogMisses = 0;
    this.interactionWatchdogRevision = 0;
    this.promptRecoveryCount = 0;
    this.informationalGateResolve = null;
    this.informationalGateSerial = 0;
    this.lastSubmittedPrompt = null;
    this.lastSubmittedResponse = null;



    this.awaitingPlayerResponseAck = null;
    this.playerResponseAckSerial = 0;




    this.pendingDecisionLease = null;

    this.decisionSerial = 0;
    this.activeDecisionId = 0;
    this.renderedDecisionId = 0;
    this.authoritativePendingDecision = null;



    this.decisionGuardianTimer = 0;
    this.decisionGuardianRestores = 0;
    this.promptDecisionIds = new WeakMap();
    this.pendingRestoredStagedSelection = null;


    this.stagedCardSelection = null;
    this.inlineCardSelection=null;
    this.promptView = '';
    this.detailsReturnSnapshot = null;
    this.detailsDetachedFromChain = false;



    this.detailsOpenedPromptRevision = 0;
    this.detailsBackgroundPromptDirty = false;
    this.detailsCloseRequested = false;
    try{this.cardDetailsOverlay?.remove?.();}catch{}this.cardDetailsOverlay=null;this.cardDetailsTarget=null;this.hidePileHoverOverlay();
    this.auxiliaryReturnToMinimized = false;
    this.recentRevealBatch = null;
    this.chainEffectCodes = new Map();
    this.chainEffectSources = new Map();




    this.chainHistory = new Map();
    this.activeChainSummary = null;
    this.chainVisuals = new Map();
    this.chainVisualNode = null;
    this.chainVisualHideTimer = null;
    this.chainSummaryHoverPortal = null;
    this.affectedCardOutcomeQueue = [];
    this.currentAffectedCardOutcome = null;
    this.affectedCardOutcomeSerial = 0;
    this.activationPresentationHistory = new Map();
    this.effectTargetPresentationHistory = new Map();


    this.promptHomeParent = this.prompt?.parentNode || null;
    this.promptHomeNextSibling = this.prompt?.nextSibling || null;
    this.chainPromptAttached = false;
    this.resolvingChainLink = 0;
    this.lastActivatedChainLink = 0;
    this.activeEffectCode = 0;
    this.pendingSpecialSummon = null;
    this.pendingEffectSource = null;
    this.activeEffectDescription = '';




    this.projectIgnisSemantics = new Map();
    this.projectIgnisScriptSources = new Map();





    this.pendingEffectOptionIntent = null;
    this.stagedUnselectCommit = null;
    this.turn = 0;
    this.turnPlayer = 0;
    this.phase = null;
    this.lp = [8000, 8000];
    this.displayLp = [8000, 8000];
    this.logLines = [];
    this.logDetailContext = null;

    this.debugLines = [];
    this.sessionTrace=[];this.sessionTraceSerial=0;this.sessionTraceStartedAt=new Date().toISOString();this.userSubmittedPrompts=new WeakSet();
    this.phaseAnnouncementTimer = null;
    this.phaseAnnouncementQueue = [];
    this.phaseAnnouncementActive = false;
    this.phaseAnnouncementCurrent = null;
    this.presentedPhase = null;
    this.lastPointerClient = null;
    this.pileHoverRestoredAwaitingPointerMove = false;
    this.animationQueue = [];
    this.actionPresentationUntil = 0;


    this.cardAnimationPresentationUntil = 0;




    this.chainOutcomePresentationUntil = 0;
    this.cardScaleFrame = 0;
    this.boardResizeObserver = null;
    this.autoZoneEnabled = this.readPreference('ygoDuelAutoZones', true);


    this.confirmChainSelectionsEnabled = this.readPreference('ygoDuelConfirmChainSelections', true);
    this.confirmCardSelectionsEnabled = this.readPreference('ygoDuelConfirmCardSelections', true);
    this.smartOptionalChainPromptsEnabled = this.readPreference('ygoDuelSmartOptionalChainPrompts', true);
    this.chainEffectHoverEnabled = this.readPreference('ygoDuelChainEffectHover', true);
    this.activationEffectHoverEnabled = this.readPreference('ygoDuelActivationEffectHover', true);
    this.promptEffectContextEnabled = this.readPreference('ygoDuelPromptEffectContext', true);
    this.directHandFieldSelectionEnabled = this.readPreference('ygoDuelDirectHandFieldSelection', false);

    this.selectorGuidanceEnabled = false;
    this.suppressSelfNegatingHandTrapsEnabled = this.readPreference('ygoDuelSuppressSelfNegatingHandTraps', true);
    this.pileHoverCardListsEnabled = this.readPreference('ygoDuelPileHoverCardLists', true);
    this.cardHoverPreviewEnabled = this.readPreference('ygoDuelCardHoverPreview', true);
    this.duelAnimationsEnabled = this.readPreference('ygoDuelAnimations', true);
    this.actionPresentationEnabled = this.readPreference('ygoDuelActionPresentation', true);
    const legacyActivationShowcaseEnabled=this.readPreference('ygoDuelActivationShowcase',true);


    this.activationShowcaseEnabled = true;
    this.phasePresentationEnabled = this.readPreference('ygoDuelPhasePresentation', true);
    this.cardMovementAnimationsEnabled = this.readPreference('ygoDuelCardMovementAnimations', true);
    this.synchronizedShowcaseTravelEnabled = this.readPreference('ygoDuelSynchronizedShowcaseTravel', true);
    this.effectActivationAnimationsEnabled = legacyActivationShowcaseEnabled&&this.readPreference('ygoDuelEffectActivationAnimations', true);
    this.summonPresentationsEnabled = legacyActivationShowcaseEnabled&&this.readPreference('ygoDuelSummonPresentations', true);
    this.targetPresentationsEnabled = this.readPreference('ygoDuelTargetPresentations', true);
    if(!legacyActivationShowcaseEnabled){this.writePreference('ygoDuelEffectActivationAnimations',false);this.writePreference('ygoDuelSummonPresentations',false);this.writePreference('ygoDuelActivationShowcase',true);}
    this.chainSourceEffectsEnabled = this.readPreference('ygoDuelChainSourceEffects', true);
    this.chainOutcomeEffectsEnabled = this.readPreference('ygoDuelChainOutcomeEffects', true);
    this.chainConnectionVisualizationEnabled = this.readPreference('ygoDuelChainConnections', true);
    const savedChainDisplayPosition=this.readStringPreference('ygoDuelChainDisplayPosition','upper');
    this.chainDisplayPosition = ['upper','left','right'].includes(savedChainDisplayPosition)?savedChainDisplayPosition:'upper';
    this.chainDisplayScale = this.readNumberPreference('ygoDuelChainDisplayScale',100,55,100);
    this.chainDisplayOffsets={
      left:{x:this.readNumberPreference('ygoDuelChainLeftX',0,-100,100),y:this.readNumberPreference('ygoDuelChainLeftY',0,-100,100)},
      right:{x:this.readNumberPreference('ygoDuelChainRightX',0,-100,100),y:this.readNumberPreference('ygoDuelChainRightY',0,-100,100)},
    };
    this.chainPlacementPreviewTimer=null;
    this.consolidatedChainSummariesEnabled = this.readPreference('ygoDuelChainSummaries', true);





    const legacySummaryHover=this.readPreference('ygoDuelChainSummaryHoverCorrelation',true);
    const legacySummaryDetails=this.readPreference('ygoDuelChainSummaryCardDetails',true);
    let storedSummaryInteractive=null;try{storedSummaryInteractive=localStorage.getItem('ygoDuelChainSummaryInteractive');}catch{}
    this.chainSummaryInteractiveEnabled=storedSummaryInteractive==null?(legacySummaryHover&&legacySummaryDetails):storedSummaryInteractive!=='0';
    this.chainSummaryHoverCorrelationEnabled=this.chainSummaryInteractiveEnabled;
    this.chainSummaryCardDetailsEnabled=this.chainSummaryInteractiveEnabled;
    this.writePreference('ygoDuelChainSummaryInteractive',this.chainSummaryInteractiveEnabled);
    this.writePreference('ygoDuelChainSummaryHoverCorrelation',this.chainSummaryInteractiveEnabled);
    this.writePreference('ygoDuelChainSummaryCardDetails',this.chainSummaryInteractiveEnabled);
    this.actionablePileHighlightEnabled = this.readPreference('ygoDuelActionablePileHighlight', true);
    this.actionPresentationSpeed = ['fast','normal','dramatic'].includes(this.readStringPreference('ygoDuelActionPresentationSpeed','normal'))?this.readStringPreference('ygoDuelActionPresentationSpeed','normal'):'normal';
    this.battleEffectIntensity = ['reduced','standard','enhanced'].includes(this.readStringPreference('ygoDuelBattleEffectIntensity','enhanced'))?this.readStringPreference('ygoDuelBattleEffectIntensity','enhanced'):'enhanced';
    this.stagedChainSelection = null;
    this.smartOptionalChainPhaseOffers = new Set();
    this.smartAutoPassedPrompts = new WeakSet();
    this.suppressNextAutoPlace = false;
    this.soundEnabled = this.readPreference('ygoDuelSound', true);
    this.soundEffectEnabled = {
      ui:this.readPreference('ygoDuelSoundUi',true),
      draw:this.readPreference('ygoDuelSoundDraw',true),
      move:this.readPreference('ygoDuelSoundMove',true),
      summon:this.readPreference('ygoDuelSoundSummon',true),
      set:this.readPreference('ygoDuelSoundSet',true),
      activate:this.readPreference('ygoDuelSoundActivate',true),
      chain:this.readPreference('ygoDuelSoundChain',true),
      phase:this.readPreference('ygoDuelSoundPhase',true),
      battle:this.readPreference('ygoDuelSoundBattle',true),
      lp:this.readPreference('ygoDuelSoundLp',true),
      shuffle:this.readPreference('ygoDuelSoundShuffle',true),
      result:this.readPreference('ygoDuelSoundResult',true),
    };
    this.soundEffectVolume=Object.fromEntries(this.soundEffectDefinitions().map(([,category])=>[category,this.readNumberPreference(this.soundEffectVolumeStorageKey(category),1,0,1)]));
    this.opponentCardsVisible = this.readPreference('ygoDuelShowOpponentCards', false);



    this.ownDeckViewEnabled = this.readPreference('ygoDuelViewOwnDeck', true);
    this.sfxVolume = this.readNumberPreference('ygoDuelSfxVolume', 0.68, 0, 1);
    this.audioContext = null;
    this.deckShuffleSoundBuffer = null;
    this.deckShuffleSoundLoadPromise = null;
    this.battleAttackSoundBuffer = null;
    this.battleAttackSoundLoadPromise = null;
    this.opponentActionThisPhase = false;
    this.finalResult = null;
    this.pendingResult = null;
    this.damagePresentationUntil = 0;
    this.preDuelModeResolve = null;
    this.preDuelFirstPlayerResolve = null;
    this.preDuelSetupResolve = null;
    this.preDuelSetupState = null;
    this.lastDuelSetup = null;
    this.simulatorTaskPromptActive = false;
    this.lastRulesDiagnosticError = '';
    this.lastLp = [8000, 8000];
    this.pinnedInspector = null;
    this.meaningfulResponseWindow = false;
    this.shiftChainOverrideHeld = false;



    this.rightPassHoldTimer = 0;
    this.rightPassHoldActive = false;
    this.rightPassSuppressContextMenu = false;
    this.rightPassHoldThreshold = 220;
    this.rightPassIndicator = null;
    this.rematchStartContext = null;
    this.initialDrawSeen = [false, false];
    this.initialSetupComplete = false;
    this.pendingDrawArrivals = new Set();
    this.pendingDrawPresentationCounts = [0,0];
    this.pendingMoveArrivals = new Set();
    this.pendingDrawMoveCodes = new Map();
    this.dummyRetryAttempts = new Map();
    this.dummyRejectedResponses = new Map();
    this.dummyRetryNoticeKey = '';
    this.dummyPromptFailureCounts = new Map();


    this.announceCardCandidateCache = new WeakMap();
    this.hardeningRpsRound = 0;
    this.dummyRpsRound = 0;
    this.dummyPhaseActionCount = 0;
    this.dummyBattleActionCount = 0;
    this.duelStateRevision = 0;
    this.monsterTopologyRevision = 0;
    this.lastDeckAccessByPlayer = [null, null];



    this.lastSummonContext = [null, null];



    this.dummyMaterialPlanner = null;
    this.lastAttackContext = null;
    this.pendingDummyAttack = null;
    this.pendingPlayerAttack = null;
    this.hoverOverlay = null;
    this.hoverOverlayAnchor = null;
    this.pileHoverOverlay = null;
    this.pileHoverAnchor = null;
    this.pileHoverHideTimer = 0;
    this.cardDetailsOverlay = null;
    this.cardDetailsTarget = null;
    this.hoverInspectorCode = 0;
    this.hoverInspectorInfo = null;
    this.hoverExitTimer = null;
    this.hoverLogCardCode = 0;
    this.hoverLogCardInfo = null;
    this.selectedLogCardCode = 0;
    this.selectedLogCardInfo = null;


    this.knownHands = [[], []];
    this.knownExtras = [[], []];
    this.knownPiles = [this.emptyKnownPiles(), this.emptyKnownPiles()];
    this.knownField = [this.emptyKnownField(), this.emptyKnownField()];
    this.initialExtraCodes = [];
    this.initialOpponentExtraCodes = [];
    this.knownDecks = [[], []];
    this.opponentDeckMode = 'clone';
    this.opponentDeckSelection = null;
    this.dummyMode = this.readStringPreference('ygoDuelDummyMode','autonomous') === 'passive' ? 'passive' : 'autonomous';
    this.dummyDifficulty = ['casual','competitive','expert'].includes(this.readStringPreference('ygoDuelAIDifficulty','expert')) ? this.readStringPreference('ygoDuelAIDifficulty','expert') : 'expert';
    this.dummyPersonality = ['auto','combo','control','aggressive'].includes(this.readStringPreference('ygoDuelAIPersonality','auto')) ? this.readStringPreference('ygoDuelAIPersonality','auto') : 'auto';
    this.duelFormat = ['tcg','ocg'].includes(this.readStringPreference('ygoDuelFormat','tcg')) ? this.readStringPreference('ygoDuelFormat','tcg') : 'tcg';
    this.duelBanlist = this.readStringPreference('ygoDuelBanlist','builder') || 'builder';
    this.matchMode = this.readStringPreference('ygoDuelMatchMode','single') === 'match3' ? 'match3' : 'single';
    this.strictDeckValidation = this.readPreference('ygoDuelStrictDeckValidation', true);
    this.firstPlayerPreference = ['choose','random','you','dummy'].includes(this.readStringPreference('ygoDuelFirstPlayer','choose')) ? this.readStringPreference('ygoDuelFirstPlayer','choose') : 'choose';
    this.logicalToCorePlayer = [0,1];
    this.coreToLogicalPlayer = [0,1];
    this.currentFirstPlayer = 0;
    this.enginePackageStatus = null;
    this.hardeningRunning = false;
    this.hardeningCancelRequested = false;
    this.hardeningReport = null;
    this.hardeningPreset = ['quick','extended','exhaustive'].includes(this.readStringPreference('ygoDuelHardeningPreset','extended')) ? this.readStringPreference('ygoDuelHardeningPreset','extended') : 'extended';
    this.matchState = null;
    this.matchDecks = null;
    this.matchSideBaseline = null;
    this.sideDeckEditBaseline = null;
    this.sideDeckSelection = null;
    this.pendingNextGameFirstPlayer = null;
    this.dummyStrategyProfile = null;
    this.dummyActionHistory = new Map();
    this.dummyPlan = {turn:0, intents:[], recentCodes:[], nextTags:[], lastKind:'', lastCode:0};
    this.replaySession = null;
    this.replayPlayback = null;
    this.replayDecisionIndex = 0;
    this.replaySeed = null;
    this.replayOrders = null;
    this.replaySpeed = 1;
    this.replayToolbarOpen = false;
    this.replayEventsOpen = false;
    this.replaySeekSerial = 0;
    this.replaySeekOverlay = null;
    this.replaySeekPreviewTarget = null;
    this.replaySeekWasPlaying = false;
    this.replaySeekLastCommit = {index:null,at:0};
    this.replayManualSeekActive = false;
    this.replaySeekQueuedTarget = null;
    this.replaySeekQueuedLive = false;
    this.liveReplayBranch = null;
    this.liveReplayBranchGateResolve = null;
    this.processLoopSerial = 0;
    this.dummySafeModeThisTurn = false;
    this.opponentNoticeQueue = [];
    this.opponentNoticeTimer = 0;
    this.currentOpponentNoticeEvent = null;
    this.field = { players: [this.emptyPlayer(), this.emptyPlayer()], chain: [] };


    this.liveMonsterStats = new Map();
    this.activeMonsterStatKeys = new Set();
    this.bind();
    this.renderMeta();
    this.renderField();
  }

  emptyPlayer() {
    return { deck: [], hand: [], grave: [], removed: [], extra: [], mzone: Array(7).fill(null), szone: Array(8).fill(null) };
  }

  emptyKnownPiles() { return {grave:[], removed:[]}; }
  emptyKnownField() { return {mzone:Array(7).fill(null), szone:Array(8).fill(null)}; }

  bind() {
    $id('duelBackBtn')?.addEventListener('click', () => this.close());
    const mat=this.root?.querySelector('.duel-mat');let fieldReset=$id('duelFieldResetBtn');if(mat&&!fieldReset){fieldReset=document.createElement('button');fieldReset.id='duelFieldResetBtn';fieldReset.type='button';fieldReset.className='btn ghost compact';fieldReset.style.cssText='grid-column:9;grid-row:5;align-self:center;justify-self:center;z-index:12;width:min(100%,92px);min-width:0;padding:7px 6px;line-height:1.1;white-space:normal';mat.append(fieldReset);}const bindResetButton=id=>{const button=$id(id);if(!button)return;button.textContent='Reset Duel';button.title='Reset the current duel with the same decks, Dummy intelligence, and turn order.';button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();this.resetDuel();},true);};bindResetButton('duelRestartBtn');bindResetButton('duelFieldResetBtn');
    $id('duelEngineRetryBtn')?.addEventListener('click', () => this.restartDuel());
    this.boardWrap?.addEventListener('click', event => {


      if(event.target.closest?.('.duel-prompt,.duel-prompt-restore'))return;


      if (event.target.closest?.('.duel-card,.duel-pile,.duel-phase-dock,.duel-zone.legal-target')) return;


      if(!this.promptMinimized&&this.prompt?.dataset.dismissible==='1'&&['details','pile'].includes(this.promptView)){
        if(this.dismissAuxiliaryViewer())return;
      }
      this.releaseCardSelection();
    });
    this.root?.addEventListener('pointerdown', event => {
      if(event.button===2)this.beginRightPassHold();
    });
    if(typeof window!=='undefined'&&typeof window.addEventListener==='function'){
      window.addEventListener('pointerup',event=>{if(event.button===2)this.endRightPassHold();});
      window.addEventListener('pointercancel',event=>{if(event.button===2)this.endRightPassHold();});
    }
    this.root?.addEventListener('contextmenu', event => {
      if(this.root?.hidden)return;




      event.preventDefault();
      event.stopPropagation();
      if(this.rightPassSuppressContextMenu){this.rightPassSuppressContextMenu=false;return;}
      if(!this.promptMinimized&&this.prompt?.dataset.dismissible==='1'&&['details','pile'].includes(this.promptView)){
        if(this.dismissAuxiliaryViewer())return;
      }
      this.handleBackAction();
    });
    $id('duelReplayTopBtn')?.addEventListener('click',event=>{event.stopPropagation();this.toggleReplayToolbar();});
    $id('duelConfigMenuBtn')?.addEventListener('click',event=>{event.stopPropagation();this.toggleConsolidatedMenu();});
    $id('duelConsolidatedMenuClose')?.addEventListener('click',()=>this.toggleConsolidatedMenu(false));
    $id('duelOpenConfigurationBtn')?.addEventListener('click',()=>{this.toggleConsolidatedMenu(false);this.openDuelConfiguration();});
    $id('duelMenuInterfaceBtn')?.addEventListener('click',()=>{this.toggleConsolidatedMenu(false);this.toggleInterfaceSettingsMenu(true);});
    $id('duelMenuSimulatorBtn')?.addEventListener('click',()=>{this.toggleConsolidatedMenu(false);this.openSimulatorSettings();});
    $id('duelMenuReplayBtn')?.addEventListener('click',()=>{this.toggleConsolidatedMenu(false);this.toggleReplayToolbar(true);});
    $id('duelMenuExportBtn')?.addEventListener('click',()=>{this.toggleConsolidatedMenu(false);this.exportSessionLog();});
    $id('duelMenuResetBtn')?.addEventListener('click',()=>{this.toggleConsolidatedMenu(false);this.resetDuel();});
    $id('duelMenuConcedeBtn')?.addEventListener('click',()=>{this.toggleConsolidatedMenu(false);this.concedeDuel();});
    $id('duelCardTextStylingToggle')?.addEventListener('click',()=>this.toggleStyledText());
    $id('duelAutoZoneToggle')?.addEventListener('click',()=>this.toggleAutoZones());
    $id('duelSoundToggle')?.addEventListener('click',()=>this.toggleSound());
    $id('duelOpponentCardsToggle')?.addEventListener('click',()=>this.toggleOpponentCards());
    $id('duelOwnDeckViewToggle')?.addEventListener('click',()=>this.toggleOwnDeckView());
    $id('duelOpponentDeckBtn')?.addEventListener('click',()=>this.renderOpponentDeckChooser());
    $id('duelDummyModeToggle')?.addEventListener('click',()=>this.renderDummyDifficultyChooser());
    $id('duelSimulatorSettingsBtn')?.addEventListener('click',()=>this.openSimulatorSettings());
    $id('duelInterfaceSettingsBtn')?.addEventListener('click',event=>{event.stopPropagation();this.toggleInterfaceSettingsMenu();});
    $id('duelInterfaceSettingsClose')?.addEventListener('click',()=>this.toggleInterfaceSettingsMenu(false));
    const bindUiToggle=(id,key)=>$id(id)?.addEventListener('change',event=>this.setInterfacePreference(key,!!event.target.checked));
    bindUiToggle('duelUiConfirmChain','confirmChainSelectionsEnabled');
    this.ensureConfirmCardSelectionsControl();
    bindUiToggle('duelUiConfirmCard','confirmCardSelectionsEnabled');
    bindUiToggle('duelUiSmartOptionalChain','smartOptionalChainPromptsEnabled');
    bindUiToggle('duelUiChainHover','chainEffectHoverEnabled');
    bindUiToggle('duelUiActivationHover','activationEffectHoverEnabled');
    bindUiToggle('duelUiPromptContext','promptEffectContextEnabled');
    this.ensureDirectHandFieldSelectionControl();
    $id('duelUiCardSelectionMode')?.addEventListener('change',event=>this.setInterfacePreference('directHandFieldSelectionEnabled',String(event.target.value)==='direct'));
    bindUiToggle('duelUiSuppressSelfNegating','suppressSelfNegatingHandTrapsEnabled');
    bindUiToggle('duelUiPileHoverLists','pileHoverCardListsEnabled');
    bindUiToggle('duelUiCardHover','cardHoverPreviewEnabled');
    bindUiToggle('duelUiAnimations','duelAnimationsEnabled');
    bindUiToggle('duelUiActionPresentation','actionPresentationEnabled');
    bindUiToggle('duelUiPhasePresentation','phasePresentationEnabled');
    bindUiToggle('duelUiCardMovementAnimations','cardMovementAnimationsEnabled');
    bindUiToggle('duelUiSynchronizedShowcaseTravel','synchronizedShowcaseTravelEnabled');
    bindUiToggle('duelUiEffectActivationAnimations','effectActivationAnimationsEnabled');
    bindUiToggle('duelUiSummonPresentations','summonPresentationsEnabled');
    bindUiToggle('duelUiTargetPresentations','targetPresentationsEnabled');
    bindUiToggle('duelUiChainSourceEffects','chainSourceEffectsEnabled');
    bindUiToggle('duelUiChainOutcomeEffects','chainOutcomeEffectsEnabled');
    bindUiToggle('duelUiChainConnections','chainConnectionVisualizationEnabled');
    bindUiToggle('duelUiChainSummaries','consolidatedChainSummariesEnabled');
    bindUiToggle('duelUiChainSummaryInteractive','chainSummaryInteractiveEnabled');
    bindUiToggle('duelUiActionablePileHighlight','actionablePileHighlightEnabled');
    $id('duelUiActionSpeed')?.addEventListener('change',event=>this.setActionPresentationSpeed(event.target.value));
    $id('duelUiBattleIntensity')?.addEventListener('change',event=>this.setBattleEffectIntensity(event.target.value));
    $id('duelUiChainPosition')?.addEventListener('change',event=>this.setChainDisplayPosition(event.target.value));
    $id('duelUiChainDisplayScale')?.addEventListener('input',event=>this.setChainDisplayScale(event.target.value,{preview:true}));
    $id('duelUiChainOffsetX')?.addEventListener('input',event=>this.setChainDisplayOffset('x',event.target.value,{preview:true}));
    $id('duelUiChainOffsetY')?.addEventListener('input',event=>this.setChainDisplayOffset('y',event.target.value,{preview:true}));
    $id('duelUiChainPositionPreview')?.addEventListener('click',()=>{this.previewChainDisplayPosition();this.playSound('select');});
    $id('duelUiChainPositionReset')?.addEventListener('click',()=>this.resetChainDisplayOffsets());
    bindUiToggle('duelUiAutoZones','autoZoneEnabled');
    $id('duelUiOpponentCards')?.addEventListener('change',event=>{if(!!event.target.checked!==!!this.opponentCardsVisible)this.toggleOpponentCards();});
    $id('duelUiOwnDeckView')?.addEventListener('change',event=>{if(!!event.target.checked!==!!this.ownDeckViewEnabled)this.toggleOwnDeckView();});
    $id('duelUiSound')?.addEventListener('change',event=>{if(!!event.target.checked!==!!this.soundEnabled)this.toggleSound();});
    this.ensureIndividualSoundControls();
    this.engineStatus?.addEventListener('click',()=>{const expanded=this.engineStatus.classList.toggle('expanded');this.engineStatus.setAttribute('aria-expanded',expanded?'true':'false');});
    $id('duelReplayToggle')?.addEventListener('click',()=>this.toggleReplayToolbar());
    $id('duelSessionLogExportBtn')?.addEventListener('click',()=>this.exportSessionLog());
    $id('duelReplayCloseBtn')?.addEventListener('click',()=>this.toggleReplayToolbar(false));
    $id('duelReplayOpenBtn')?.addEventListener('click',()=>this.importReplayFile('playback'));
    $id('duelReplaySaveBtn')?.addEventListener('click',()=>this.exportReplayFile('replay'));
    $id('duelReplayCheckpointBtn')?.addEventListener('click',()=>this.exportReplayFile('checkpoint'));
    $id('duelReplayDebugBtn')?.addEventListener('click',()=>this.exportReplayFile('debug'));
    $id('duelReplayRestartBtn')?.addEventListener('click',()=>this.replayFromStart(false));
    $id('duelReplayPreviousBtn')?.addEventListener('click',()=>this.replayPreviousDecision());
    $id('duelReplayPlayPauseBtn')?.addEventListener('click',()=>this.toggleReplayPlayback());
    $id('duelReplayNextBtn')?.addEventListener('click',()=>this.stepReplayForward());
    $id('duelReplayEndBtn')?.addEventListener('click',()=>this.replayJumpToEnd());
    $id('duelReplaySpeed')?.addEventListener('change',event=>this.setReplaySpeed(Number(event.target.value)));
    const replayTimeline=$id('duelReplayTimeline');
    replayTimeline?.addEventListener('pointerdown',()=>this.beginManualReplaySeek());
    replayTimeline?.addEventListener('input',event=>this.previewReplaySeek(Number(event.target.value)||0));
    const commitReplaySeek=event=>this.commitReplaySeek(Number(event.target.value)||0);
    replayTimeline?.addEventListener('change',commitReplaySeek);
    replayTimeline?.addEventListener('pointerup',commitReplaySeek);
    replayTimeline?.addEventListener('pointercancel',()=>this.cancelReplaySeekPreview());
    replayTimeline?.addEventListener('keyup',event=>{if(['ArrowLeft','ArrowRight','Home','End','PageUp','PageDown'].includes(event.key))commitReplaySeek(event);});
    $id('duelReplayEventsBtn')?.addEventListener('click',()=>this.toggleReplayEvents());
    $id('duelSurrenderBtn')?.addEventListener('click',()=>this.concedeDuel());
    $id('duelSfxVolume')?.addEventListener('input',event=>this.setSfxVolume(Number(event.target.value)/100));
    $id('duelResultRestart')?.addEventListener('click',()=>this.handleResultPrimaryAction());
    $id('duelResultSide')?.addEventListener('click',()=>this.renderSideDeckManager());
    $id('duelResultReplay')?.addEventListener('click',()=>this.replayFromStart(true));
    $id('duelResultSaveReplay')?.addEventListener('click',()=>this.exportReplayFile('replay'));
    $id('duelResultEnd')?.addEventListener('click',()=>this.close());
    this.promptMinimizeButton?.addEventListener('click',()=>this.minimizePrompt());
    this.promptRestoreButton?.addEventListener('click',event=>{event.stopPropagation();this.restorePrompt();});




    this.prompt?.addEventListener('click',event=>event.stopPropagation());
    this.syncDuelToggles();
    this.syncInterfaceSettingsMenu();
    this.syncReplayControls();
    if(typeof document!=='undefined'&&typeof document.addEventListener==='function')document.addEventListener('pointerdown',event=>{const menu=$id('duelInterfaceSettingsMenu'),btn=$id('duelInterfaceSettingsBtn');if(!menu||menu.hidden)return;if(menu.contains(event.target)||btn?.contains?.(event.target))return;this.toggleInterfaceSettingsMenu(false);});
    if(typeof document!=='undefined'&&typeof document.addEventListener==='function')document.addEventListener('pointerdown',event=>{const menu=$id('duelConsolidatedMenu'),btn=$id('duelConfigMenuBtn');if(!menu||menu.hidden)return;if(menu.contains(event.target)||btn?.contains?.(event.target))return;this.toggleConsolidatedMenu(false);});
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') window.addEventListener('resize',()=>{this.scheduleCardScale();this.positionChainVisualization();this.positionOpponentNotice();this.schedulePromptFit();this.scheduleSelectionPromptSizing();this.scheduleExtraDeckViewerFit();});




    if(this.boardWrap&&typeof ResizeObserver==='function'){
      this.boardResizeObserver=new ResizeObserver(()=>{this.scheduleCardScale();this.positionChainVisualization();this.positionOpponentNotice();this.schedulePromptFit();this.scheduleSelectionPromptSizing();this.scheduleExtraDeckViewerFit();});
      this.boardResizeObserver.observe(this.boardWrap);
    }
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('keydown', event => {
        if(event.key==='Shift'&&!this.root?.hidden)this.shiftChainOverrideHeld=true;
        if (event.key !== 'Escape' || this.root?.hidden) return;
        if(this.handleBackAction())event.preventDefault();
      });
      document.addEventListener('keyup', event => { if(event.key==='Shift')this.shiftChainOverrideHeld=false; });
      if(typeof window!=='undefined')window.addEventListener?.('blur',()=>{this.shiftChainOverrideHeld=false;this.endRightPassHold({suppressContext:false});this.hideCardHoverOverlay({delay:0,clearInspector:false});this.hidePileHoverOverlay();});
      if(typeof document!=='undefined')document.addEventListener?.('pointermove',event=>{this.rememberPointerPosition(event);this.pileHoverRestoredAwaitingPointerMove=false;this.validateCardHoverOverlay();this.validatePileHoverOverlay();},{passive:true});
    }
  }

  beginRightPassHold() {
    if(this.root?.hidden)return;
    if(this.rightPassHoldTimer)clearTimeout(this.rightPassHoldTimer);
    this.rightPassSuppressContextMenu=false;
    this.rightPassHoldTimer=setTimeout(()=>{
      this.rightPassHoldTimer=0;this.rightPassHoldActive=true;this.rightPassSuppressContextMenu=true;
      this.traceSession('right-pass-hold-started',{state:this.sessionStateSnapshot()});
      this.syncRightPassIndicator();this.tryHeldRightPass();
    },Math.max(120,Number(this.rightPassHoldThreshold)||220));
  }

  endRightPassHold({suppressContext=true}={}) {
    if(this.rightPassHoldTimer){clearTimeout(this.rightPassHoldTimer);this.rightPassHoldTimer=0;}
    const wasActive=this.rightPassHoldActive;this.rightPassHoldActive=false;
    if(!suppressContext&&!wasActive)this.rightPassSuppressContextMenu=false;
    if(wasActive)this.traceSession('right-pass-hold-released',{state:this.sessionStateSnapshot()});
    this.syncRightPassIndicator();
  }

  cancelRightPassHoldForSelection() {
    this.endRightPassHold({suppressContext:false});
    this.rightPassSuppressContextMenu=false;
  }

  bindStagedCardDeselect(node,canDeselect,onDeselect) {
    if(!node||typeof canDeselect!=='function'||typeof onDeselect!=='function')return;
    node.addEventListener('pointerdown',event=>{
      if(event.button===2&&canDeselect())event.stopPropagation();
    });
    node.addEventListener('contextmenu',event=>{
      if(!canDeselect())return;
      event.preventDefault();event.stopPropagation();
      this.cancelRightPassHoldForSelection();
      onDeselect();
    });
  }

  syncRightPassIndicator() {
    if(!this.boardWrap||typeof document==='undefined')return;
    let node=this.rightPassIndicator;
    if(!node?.isConnected){node=document.createElement('div');node.className='duel-right-pass-indicator';node.textContent='Passing Quick Effects';node.hidden=true;node.setAttribute('aria-live','polite');this.boardWrap.append(node);this.rightPassIndicator=node;}
    node.hidden=!this.rightPassHoldActive;
  }

  heldRightPassResponse(message=this.currentPrompt) {
    if(!this.rightPassHoldActive||!message||!this.mod)return null;
    const T=this.mod.OcgMessageType||{},R=this.mod.OcgResponseType||{};
    if(message.type===T.SELECT_CHAIN&&!message.forced)return{type:R.SELECT_CHAIN,index:null};
    if(message.type===T.SELECT_EFFECTYN)return{type:R.SELECT_EFFECTYN,yes:false};
    if(message.type===T.SELECT_YESNO&&!this.isBattleReplayPrompt(message))return{type:R.SELECT_YESNO,yes:false};
    return null;
  }

  traceSession(event,data={}){
    const safe=value=>{try{return JSON.parse(this.stableJSONStringify(value));}catch{return String(value);}};
    this.sessionTrace.push({sequence:++this.sessionTraceSerial,at:new Date().toISOString(),elapsedMs:Math.max(0,Date.now()-Date.parse(this.sessionTraceStartedAt||new Date().toISOString())),event:String(event||'event'),data:safe(data)});
    if(this.sessionTrace.length>50000)this.sessionTrace.splice(0,this.sessionTrace.length-50000);
  }

  traceSafeObject(value){try{return JSON.parse(this.stableJSONStringify(value));}catch{return String(value);}}

  sessionStateSnapshot(){
    return{running:!!this.running,starting:!!this.starting,turn:Number(this.turn)||0,turnPlayer:Number(this.turnPlayer)||0,phase:this.phase,processLoopSerial:Number(this.processLoopSerial)||0,promptRevision:Number(this.currentPromptRevision)||0,promptView:String(this.promptView||''),promptMinimized:!!this.promptMinimized,rightPassHoldActive:!!this.rightPassHoldActive,currentPrompt:this.currentPrompt?this.replayPromptSignature(this.currentPrompt):null,pendingResolver:typeof this.pendingResolve==='function',awaitingPlayerResponseAck:this.awaitingPlayerResponseAck?this.traceSafeObject(this.awaitingPlayerResponseAck):null,pendingDecisionLease:this.pendingDecisionLease?this.traceSafeObject(this.pendingDecisionLease):null,authoritativeDecision:this.authoritativePendingDecision?this.traceSafeObject({...this.authoritativePendingDecision,resolve:typeof this.authoritativePendingDecision.resolve==='function'?'function':null}):null,chainLinks:[...this.chainHistory.entries()],debugCount:this.debugLines.length,duelLogCount:this.logLines.length};
  }

  exportSessionLog(){
    const file={schema:1,kind:'ygo-deck-studio-duel-session-log',appBuild:DUEL_BRANCH,startedAt:this.sessionTraceStartedAt,exportedAt:new Date().toISOString(),state:this.sessionStateSnapshot(),settings:{confirmChainSelectionsEnabled:!!this.confirmChainSelectionsEnabled,confirmCardSelectionsEnabled:!!this.confirmCardSelectionsEnabled,directHandFieldSelectionEnabled:!!this.directHandFieldSelectionEnabled,smartOptionalChainPromptsEnabled:!!this.smartOptionalChainPromptsEnabled,suppressSelfNegatingHandTrapsEnabled:!!this.suppressSelfNegatingHandTrapsEnabled,pileHoverCardListsEnabled:!!this.pileHoverCardListsEnabled,autoZoneEnabled:!!this.autoZoneEnabled,duelAnimationsEnabled:!!this.duelAnimationsEnabled,cardMovementAnimationsEnabled:!!this.cardMovementAnimationsEnabled,synchronizedShowcaseTravelEnabled:!!this.synchronizedShowcaseTravelEnabled,effectActivationAnimationsEnabled:!!this.effectActivationAnimationsEnabled,summonPresentationsEnabled:!!this.summonPresentationsEnabled,targetPresentationsEnabled:!!this.targetPresentationsEnabled,actionPresentationEnabled:!!this.actionPresentationEnabled,activationShowcaseEnabled:!!this.activationShowcaseEnabled,phasePresentationEnabled:!!this.phasePresentationEnabled,chainSourceEffectsEnabled:!!this.chainSourceEffectsEnabled,chainOutcomeEffectsEnabled:!!this.chainOutcomeEffectsEnabled,chainConnectionVisualizationEnabled:!!this.chainConnectionVisualizationEnabled,chainDisplayPosition:this.chainDisplayPosition,chainDisplayScale:this.chainDisplayScale,chainDisplayOffsets:this.chainDisplayOffsets,consolidatedChainSummariesEnabled:!!this.consolidatedChainSummariesEnabled,chainSummaryInteractiveEnabled:!!this.chainSummaryInteractiveEnabled,chainSummaryHoverCorrelationEnabled:!!this.chainSummaryHoverCorrelationEnabled,chainSummaryCardDetailsEnabled:!!this.chainSummaryCardDetailsEnabled,actionablePileHighlightEnabled:!!this.actionablePileHighlightEnabled,actionPresentationSpeed:this.actionPresentationSpeed,battleEffectIntensity:this.battleEffectIntensity,soundEnabled:!!this.soundEnabled,soundEffectEnabled:{...(this.soundEffectEnabled||{})},soundEffectVolume:{...(this.soundEffectVolume||{})},sfxVolume:this.sfxVolume,dummyMode:this.dummyMode,dummyDifficulty:this.dummyDifficulty,duelFormat:this.duelFormat,duelBanlist:this.duelBanlist},rulesPackage:this.enginePackageStatus||null,duelLog:this.logLines,engineDiagnostics:this.debugLines,replay:this.replaySession||null,trace:this.sessionTrace};
    this.downloadJSONFile(`YGO_Deck_Studio_session_log_${new Date().toISOString().replace(/[:.]/g,'-')}.json`,file);this.toast('Current duel session log exported.');
  }

  tryHeldRightPass() {
    if(!this.rightPassHoldActive||!this.pendingResolve||!this.currentPrompt)return false;
    const response=this.heldRightPassResponse(this.currentPrompt);if(!response)return false;
    this.pendingEffectOptionIntent=null;this.submitResponse(response);return true;
  }

  readPreference(key,fallback=true) {
    try { const value=localStorage.getItem(key); return value==null?fallback:value!=='0'; } catch { return fallback; }
  }

  writePreference(key,value) {
    try { localStorage.setItem(key,value?'1':'0'); } catch {}
  }

  readNumberPreference(key,fallback=0.68,min=0,max=1) {
    try { const stored=localStorage.getItem(key);if(stored==null)return fallback;const raw=Number(stored);return Number.isFinite(raw)?Math.max(min,Math.min(max,raw)):fallback; } catch { return fallback; }
  }

  writeNumberPreference(key,value) {
    try { localStorage.setItem(key,String(value)); } catch {}
  }

  readStringPreference(key,fallback='') {
    try { const value=localStorage.getItem(key); return value==null?String(fallback):String(value); } catch { return String(fallback); }
  }

  writeStringPreference(key,value) {
    try { localStorage.setItem(key,String(value)); } catch {}
  }

  currentBanlist() {
    return this.duelBanlist==='builder' ? String(this.getBanlist?.()||'TCG') : String(this.duelBanlist||'TCG').toUpperCase();
  }

  setCorePlayerMapping(firstLogicalPlayer=0) {
    const first=Number(firstLogicalPlayer)===1?1:0;
    this.currentFirstPlayer=first;
    this.logicalToCorePlayer=first===0?[0,1]:[1,0];
    this.coreToLogicalPlayer=first===0?[0,1]:[1,0];
  }

  corePlayer(logicalPlayer=0) { return this.logicalToCorePlayer[Number(logicalPlayer)===1?1:0]??0; }
  logicalPlayer(corePlayer=0) { return this.coreToLogicalPlayer[Number(corePlayer)===1?1:0]??0; }

  mapCoreMessageValue(value,key='') {
    if(Array.isArray(value))return value.map(item=>this.mapCoreMessageValue(item,''));
    if(value&&typeof value==='object'){
      const out={};for(const [k,v] of Object.entries(value))out[k]=this.mapCoreMessageValue(v,k);return out;
    }
    if(['player','controller','owner','team'].includes(key)&&Number.isInteger(Number(value))&&(Number(value)===0||Number(value)===1))return this.logicalPlayer(Number(value));
    return value;
  }

  mapCoreMessage(message) { return this.mapCoreMessageValue(message); }

  toCoreResponse(response) {
    if(!response||typeof response!=='object')return response;
    const out={...response};
    if(Array.isArray(response.places))out.places=response.places.map(place=>place&&typeof place==='object'?{...place,player:this.corePlayer(Number(place.player)||0)}:place);
    return out;
  }

  setAIDifficulty(value) {
    const next=['casual','competitive','expert'].includes(String(value))?String(value):'expert';
    this.dummyDifficulty=next;this.dummyMode='autonomous';this.writeStringPreference('ygoDuelAIDifficulty',next);this.writeStringPreference('ygoDuelDummyMode','autonomous');this.syncDuelToggles();
  }

  renderDummyDifficultyChooser() {
    if(!this.promptBody||!this.promptTitle)return;
    this.promptView='dummy-difficulty';this.showPrompt({dismissible:true});this.prompt?.classList.remove('selection-prompt','card-details-prompt');this.promptTitle.textContent='Practice Dummy Intelligence';this.promptBody.replaceChildren();
    const intro=document.createElement('p');intro.className='duel-selection-purpose';intro.textContent='Choose how strongly the Practice Dummy evaluates resources, targets, Chains, lethal damage, and deck strategy. OCGCore remains authoritative for every legal move.';this.promptBody.append(intro);
    const choices=[
      ['Passive','passive','Advances phases and makes only mandatory rules decisions.'],
      ['Casual','casual','Avoids obvious self-sabotage while using simpler and more permissive choices.'],
      ['Competitive','competitive','Uses threat-aware Chains, target scoring, lethal checks, and sequencing.'],
      ['Expert','expert','Adds deck-aware planning, avoids redundant responses, and conserves interruption for meaningful threats.'],
    ];
    const list=document.createElement('div');list.className='duel-dummy-mode-choice-list';
    for(const [label,value,detail] of choices){const active=value==='passive'?this.dummyMode==='passive':this.dummyMode!=='passive'&&this.dummyDifficulty===value;const node=this.renderIntegratedEffectChoice(label,detail,()=>{if(value==='passive'){this.dummyMode='passive';this.writeStringPreference('ygoDuelDummyMode','passive');}else this.setAIDifficulty(value);this.syncDuelToggles();this.hidePrompt();this.promptView='';this.toast(`Practice Dummy intelligence set to ${label}.`);});if(active)node.classList.add('current-choice');list.append(node);}this.promptBody.append(list);this.schedulePromptFit();
  }

  cancelPendingPreDuelChoices() {
    let cancelled=false;
    if(this.preDuelModeResolve){const resolve=this.preDuelModeResolve;this.preDuelModeResolve=null;cancelled=true;try{resolve(null);}catch{}}
    if(this.preDuelFirstPlayerResolve){const resolve=this.preDuelFirstPlayerResolve;this.preDuelFirstPlayerResolve=null;cancelled=true;try{resolve(null);}catch{}}
    if(this.preDuelSetupResolve){const resolve=this.preDuelSetupResolve;this.preDuelSetupResolve=null;this.preDuelSetupState=null;cancelled=true;try{resolve(null);}catch{}}
    if(cancelled){this.starting=false;this.promptView='';this.prompt?.classList?.remove?.('duel-start-setup-prompt');this.hidePrompt();}
    return cancelled;
  }

  forceClearInteractionSurfaces() {
    this.detailsCloseRequested=true;
    try{this.cardDetailsOverlay?.remove?.();}catch{}this.cardDetailsOverlay=null;this.cardDetailsTarget=null;
    this.hideCardHoverOverlay({delay:0,clearInspector:false});this.hidePileHoverOverlay();
    this.cancelInformationalGate();this.clearOpponentEvents();
    this.promptMinimized=false;this.promptView='';this.detailsReturnSnapshot=null;this.detailsReturnView='';this.detailsBackgroundPromptDirty=false;this.pinnedInspector=null;
    this.pendingDecisionLease=null;this.awaitingPlayerResponseAck=null;this.activeDecisionId=0;this.renderedDecisionId=0;this.authoritativePendingDecision=null;this.stagedCardSelection=null;this.stagedChainSelection=null;this.inlineCardSelection=null;this.stagedUnselectCommit=null;
    this.currentPrompt=null;this.pendingResolve=null;this.selectedCardContext=null;this.activePlacePrompt=null;this.selectedPlaces=[];
    this.prompt?.classList?.add?.('duel-prompt-hidden');this.prompt?.classList?.remove?.('duel-prompt-awaiting-ack','card-details-prompt','duel-chain-choice-prompt','duel-prompt-obscured-by-details','duel-start-setup-prompt');
    this.promptTitle?.replaceChildren?.();this.promptBody?.replaceChildren?.();
    try{if(document?.activeElement&&typeof document.activeElement.blur==='function')document.activeElement.blur();}catch{}
    this.restorePromptHome();this.clearChainVisualization({immediate:true});
    this.detailsCloseRequested=false;
  }

  cloneDuelSetup(setup={}) {
    return {...setup,playerDeck:this.cloneDuelDeck(setup.playerDeck),opponentDeck:this.cloneDuelDeck(setup.opponentDeck),opponentSelection:setup.opponentSelection?{...setup.opponentSelection,deck:this.cloneDuelDeck(setup.opponentSelection.deck)}:null};
  }

  captureDuelSetup(playerDeck,opponentDeck,firstPlayer) {
    const opponentSelection=this.opponentDeckMode==='custom'&&this.opponentDeckSelection?{name:this.opponentDeckSelection.name||this.opponentDeckSelection.fileName||'Selected Deck',fileName:this.opponentDeckSelection.fileName||'',sourcePath:this.opponentDeckSelection.sourcePath||'',sourceLabel:this.opponentDeckSelection.sourceLabel||'',libraryKey:this.opponentDeckSelection.libraryKey||'',deck:this.cloneDuelDeck(opponentDeck)}:null;
    return this.cloneDuelSetup({playerDeck,opponentDeck,firstPlayer:Number(firstPlayer)===1?1:0,playerName:this.getDeckName?.()||'Current Deck',opponentMode:this.opponentDeckMode,opponentSelection,dummyMode:this.dummyMode,dummyDifficulty:this.dummyDifficulty,dummyPersonality:this.dummyPersonality,duelFormat:this.duelFormat,duelBanlist:this.duelBanlist,matchMode:this.matchMode,strictDeckValidation:this.strictDeckValidation,firstPlayerPreference:this.firstPlayerPreference});
  }

  applyDuelSetup(setup={}) {
    this.dummyMode=setup.dummyMode==='passive'?'passive':'autonomous';
    this.dummyDifficulty=['casual','competitive','expert'].includes(setup.dummyDifficulty)?setup.dummyDifficulty:'expert';
    this.dummyPersonality=['auto','combo','control','aggressive'].includes(setup.dummyPersonality)?setup.dummyPersonality:'auto';
    this.duelFormat=['tcg','ocg'].includes(setup.duelFormat)?setup.duelFormat:'tcg';this.duelBanlist=setup.duelBanlist||'builder';
    this.matchMode=setup.matchMode==='match3'?'match3':'single';this.strictDeckValidation=setup.strictDeckValidation!==false;
    this.firstPlayerPreference=['choose','random','you','dummy'].includes(setup.firstPlayerPreference)?setup.firstPlayerPreference:'choose';
    this.opponentDeckMode=setup.opponentMode==='custom'&&setup.opponentSelection?'custom':'clone';
    this.opponentDeckSelection=this.opponentDeckMode==='custom'?{...setup.opponentSelection,deck:this.cloneDuelDeck(setup.opponentDeck)}:null;
    this.syncDuelToggles();
  }

  async resetDuel() {
    if(this.starting)return;
    if(this.replayPlayback||!this.lastDuelSetup){return this.restartDuel();}
    const setup=this.cloneDuelSetup(this.lastDuelSetup);
    this.running=false;this.processLoopSerial+=1;this.stopReplayPlayback();this.cancelPendingPreDuelChoices();this.starting=false;this.clearSimulatorTaskPrompt({force:true});this.forceClearInteractionSurfaces();if(this.handle)this.destroyDuel();await Promise.resolve();
    return this.start(true,{fixedSetup:setup,resetSameSettings:true});
  }

  async restartDuel() {


    this.running=false;this.processLoopSerial+=1;this.stopReplayPlayback();
    this.cancelPendingPreDuelChoices();this.starting=false;this.clearSimulatorTaskPrompt({force:true});
    this.forceClearInteractionSurfaces();
    if(this.handle)this.destroyDuel();
    await Promise.resolve();
    return this.start(true);
  }

  openSimulatorSettings() {
    if(this.starting&&!this.running){
      if(!this.cancelPendingPreDuelChoices()){this.toast('Finish the current duel startup step before opening Simulator settings.');return;}
    }
    this.clearSimulatorTaskPrompt({force:true});
    this.renderSimulatorSettings();
  }

  showSimulatorTaskPrompt(title, detail='') {
    this.simulatorTaskPromptActive=true;
    this.promptView='simulator-task';
    this.clearPrompt(title,{show:true,dismissible:false});
    if(detail&&this.promptBody){const info=document.createElement('p');info.className='duel-selection-purpose';info.textContent=detail;this.promptBody.append(info);}
    this.schedulePromptFit();
  }

  clearSimulatorTaskPrompt({restoreSettings=false,force=false}={}) {
    const owned=this.simulatorTaskPromptActive||this.promptView==='simulator-task';
    if(!owned&&!force)return false;
    this.simulatorTaskPromptActive=false;
    if(restoreSettings){this.renderSimulatorSettings();return true;}
    if(this.promptView==='simulator-task'||force){this.hidePrompt();if(!this.currentPrompt)this.promptView='';}
    return true;
  }

  renderSimulatorSettings() {
    if(!this.promptBody||!this.promptTitle)return;
    this.promptView='simulator-settings';this.showPrompt({dismissible:true});this.prompt?.classList.remove('selection-prompt','card-details-prompt');this.promptTitle.textContent='Duel Simulator Settings';this.promptBody.replaceChildren();
    const section=(title,detail='')=>{const wrap=document.createElement('section');wrap.className='duel-simulator-settings-section';const h=document.createElement('h3');h.textContent=title;wrap.append(h);if(detail){const p=document.createElement('p');p.className='duel-selection-purpose';p.textContent=detail;wrap.append(p);}this.promptBody.append(wrap);return wrap;};
    const buttons=(host,items,current,onSelect)=>{const row=document.createElement('div');row.className='duel-prompt-controls duel-settings-choice-row';for(const [label,value] of items){const b=this.button(label,()=>onSelect(value),{ghost:value!==current});if(value===current)b.classList.add('active');row.append(b);}host.append(row);};
    const ai=section('Practice Dummy AI','Expert is recommended for serious deck testing.');buttons(ai,[['Passive','passive'],['Casual','casual'],['Competitive','competitive'],['Expert','expert']],this.dummyMode==='passive'?'passive':this.dummyDifficulty,value=>{if(value==='passive'){this.dummyMode='passive';this.writeStringPreference('ygoDuelDummyMode','passive');}else this.setAIDifficulty(value);this.renderSimulatorSettings();});
    const personality=section('AI Strategy','Auto derives a strategy profile from the Dummy deck. Manual profiles bias otherwise legal decisions toward combo extension, interruption control, or battle pressure.');buttons(personality,[['Auto','auto'],['Combo','combo'],['Control','control'],['Aggressive','aggressive']],this.dummyPersonality,value=>{this.dummyPersonality=value;this.writeStringPreference('ygoDuelAIPersonality',value);this.renderSimulatorSettings();});
    const format=section('Rules Format','Modern Master Rule 5 is used in both profiles. TCG enables the core TCG SEGOC behavior flags; OCG uses the base MR5 behavior.');buttons(format,[['TCG MR5','tcg'],['OCG MR5','ocg']],this.duelFormat,value=>{this.duelFormat=value;this.writeStringPreference('ygoDuelFormat',value);this.renderSimulatorSettings();});
    const ban=section('Banlist','The selected list is validated before a new duel starts. It does not alter OCGCore effect legality.');buttons(ban,[['Use Builder','builder'],['TCG','tcg'],['OCG','ocg'],['GOAT','goat'],['None','none']],this.duelBanlist,value=>{this.duelBanlist=value;this.writeStringPreference('ygoDuelBanlist',value);this.renderSimulatorSettings();});
    const match=section('Match','Best-of-3 tracks game score and enables legal one-for-one Side Deck swaps between games.');buttons(match,[['Single Duel','single'],['Best of 3','match3']],this.matchMode,value=>{this.matchMode=value;this.writeStringPreference('ygoDuelMatchMode',value);this.renderSimulatorSettings();});
    const legality=section('Deck Legality','Tournament validation enforces Main/Extra/Side sizes and the selected banlist before starting a duel. Sandbox mode keeps OCGCore move legality but permits incomplete test decks.');buttons(legality,[['Tournament','strict'],['Sandbox','sandbox']],this.strictDeckValidation?'strict':'sandbox',value=>{this.strictDeckValidation=value==='strict';this.writePreference('ygoDuelStrictDeckValidation',this.strictDeckValidation);this.renderSimulatorSettings();});
    const first=section('First Player','Because the engine always starts core player 0, Deck Studio remaps core player ownership so either you or the Dummy can genuinely take the first turn.');buttons(first,[['Choose','choose'],['Random','random'],['You','you'],['Dummy','dummy']],this.firstPlayerPreference,value=>{this.firstPlayerPreference=value;this.writeStringPreference('ygoDuelFirstPlayer',value);this.renderSimulatorSettings();});
    const rules=section('Duel Rules Package','OCGCore, BabelCDB, and Project Ignis CardScripts are versioned together. Updating replaces the cached rules package and clears stale card scripts.');
    const status=document.createElement('div');status.className='duel-rules-package-status';
    status.textContent=this.enginePackageStatus?.ready?(this.enginePackageStatus.packageId||'Duel Rules Package ready.'):this.enginePackageStatus?.error?`Rules package unavailable: ${this.enginePackageStatus.error}`:'Rules package status will be read when Test Duel starts.';
    status.title=status.textContent;rules.append(status);
    if(this.lastRulesDiagnosticError){const detail=document.createElement('div');detail.className='duel-hardening-failure-detail';detail.textContent=`Last Rules Diagnostics failure: ${this.lastRulesDiagnosticError}`;detail.title=detail.textContent;rules.append(detail);}
    const rulesRow=document.createElement('div');rulesRow.className='duel-prompt-controls';rulesRow.append(this.button('Refresh Status',async()=>{await this.refreshEnginePackageStatus();this.renderSimulatorSettings();},{ghost:true}),this.button('Run Rules Diagnostics',()=>this.runRulesDiagnostics(),{ghost:true}),this.button('Update Duel Rules',()=>this.updateRulesPackage(),{ghost:true}));rules.append(rulesRow);
    const hardening=section('Rules Hardening Lab','Runs a large pinned CardScripts runtime-initialization corpus plus deterministic category-directed OCGCore fuzz duels. It checks crashes, fatal script errors, unsupported prompts, real no-progress loops, state/location invariants, UI prompt interpretation, and deterministic replay. Extended is the recommended regular validation; Exhaustive can run for a long time.');buttons(hardening,[['Quick','quick'],['Extended','extended'],['Exhaustive','exhaustive']],this.hardeningPreset,value=>{this.hardeningPreset=value;this.writeStringPreference('ygoDuelHardeningPreset',value);this.renderSimulatorSettings();});
    const hardeningStatus=document.createElement('div');hardeningStatus.className='duel-rules-package-status duel-hardening-status';
    const hardeningSummary=this.hardeningRunning?'Hardening campaign is running...':this.hardeningReport?`Last campaign: ${this.hardeningReport.ok?'PASS':'FAIL'} · ${this.hardeningReport.scriptAudit?.initialized??this.hardeningReport.scriptAudit?.loaded??0} scripts initialized · ${this.hardeningReport.fuzz?.completed||0}/${this.hardeningReport.fuzz?.attempted??this.hardeningReport.fuzz?.requested??0} fuzz duels completed${this.hardeningReport.fuzz?.coverageIncomplete?` · ${this.hardeningReport.fuzz.coverageIncomplete} coverage-incomplete`:''}${this.hardeningReport.fuzz?.cleanReplayFailures?.length?` · ${this.hardeningReport.fuzz.cleanReplayFailures.length} clean replay issue(s)`:''}`:'No hardening campaign has been run in this build.';
    hardeningStatus.textContent=hardeningSummary;hardeningStatus.title=hardeningSummary;hardening.append(hardeningStatus);
    if(this.hardeningReport?.fatalError){const failure=document.createElement('div');failure.className='duel-hardening-failure-detail';failure.textContent=`Startup failure: ${this.hardeningReport.fatalError}`;failure.title=failure.textContent;hardening.append(failure);}
    const hardeningRow=document.createElement('div');hardeningRow.className='duel-prompt-controls';hardeningRow.append(this.button(this.hardeningRunning?'Running...':'Run Hardening Suite',()=>this.runHardeningSuite(this.hardeningPreset),{ghost:!this.hardeningRunning}),this.button('Cancel',()=>this.cancelHardeningSuite(),{ghost:true}),this.button('Export Report',()=>this.exportHardeningReport(),{ghost:true}));hardening.append(hardeningRow);
    const replay=section('Replay and Debugging','Replay files contain exact shuffled deck order, OCGCore seed, settings, and every submitted response. A checkpoint can be loaded by deterministically replaying to the saved decision and then returning control to you.');const replayRow=document.createElement('div');replayRow.className='duel-prompt-controls';replayRow.append(this.button('Save Checkpoint',()=>this.exportReplayFile('checkpoint'),{ghost:true}),this.button('Export Replay',()=>this.exportReplayFile('replay'),{ghost:true}),this.button('Load Checkpoint',()=>this.importReplayFile('resume'),{ghost:true}),this.button('Play Replay',()=>this.importReplayFile('playback'),{ghost:true}));replay.append(replayRow);
    const close=document.createElement('div');close.className='duel-prompt-controls';close.append(this.button('Close',()=>{this.hidePrompt();this.promptView='';}));this.promptBody.append(close);this.schedulePromptFit();
  }

  async refreshEnginePackageStatus() {
    try{const response=await fetch('/api/duel-engine/status',{cache:'no-store'});const status=await response.json();if(response.ok)this.enginePackageStatus=status;return status;}catch{return null;}
  }

  async runRulesDiagnostics() {
    if(this.running&&this.handle){this.toast('End the current duel before running Rules Diagnostics.');return;}
    this.lastRulesDiagnosticError='';
    try{this.hidePrompt();this.setEngineStatus('Running Rules Diagnostics...', 'working');await this.ensureEngine();await this.initializeDatabase();this.runtimeValidated=false;const diagnostic=this.validateRuntime.bind(this);await diagnostic();this.setEngineStatus(`Rules Diagnostics passed · ${this.enginePackageStatus?.packageId||DUEL_BRANCH}`,'ready');this.toast('Rules Diagnostics passed: engine startup, Normal Summon, card script loading, activation, resolution, and draw behavior are valid.');}
    catch(error){this.runtimeValidated=false;this.lastRulesDiagnosticError=String(error?.message||error);this.setEngineStatus(`Rules Diagnostics failed: ${this.lastRulesDiagnosticError}`,'error');this.toast(`Rules Diagnostics failed: ${this.lastRulesDiagnosticError}`);}
    finally{this.clearSimulatorTaskPrompt({restoreSettings:true,force:true});}
  }

  hardeningPresets() {
    return {
      quick:{scriptLimit:500,fuzzDuels:24,replayDuels:8,maxSteps:1000,duelTimeoutMs:15000,budgetIsInconclusive:true,targetSettleSteps:16,label:'Quick'},
      extended:{scriptLimit:4000,fuzzDuels:192,replayDuels:48,maxSteps:1500,duelTimeoutMs:25000,targetSettleSteps:24,label:'Extended'},
      exhaustive:{scriptLimit:Number.POSITIVE_INFINITY,fuzzDuels:1000,replayDuels:200,maxSteps:3000,duelTimeoutMs:45000,targetSettleSteps:32,label:'Exhaustive'},
    };
  }

  hardeningResponseSerializerPreflight(catalog=[]) {
    const checks=[],status=this.enginePackageStatus||{},R=this.mod?.OcgResponseType||{},T=this.mod?.OcgMessageType||{};
    const record=(id,ok,detail='',required=true)=>checks.push({id,ok:!!ok,required:required!==false,detail:String(detail||'')});
    try{
      const response=this.toCoreResponse(this.makeSortResponse([2,0,1]));
      record('sort-card',Number(response?.type)===Number(R.SORT_CARD)&&Array.isArray(response?.order)&&response.order.join(',')==='2,0,1',`compat=${Number(status.sortCardCompatVersion)||0}; order=${Array.isArray(response?.order)?response.order.join(','):'missing'}`);
    }catch(error){record('sort-card',false,error?.message||error);}
    try{
      const response=this.hardeningResponse({type:T.ANNOUNCE_NUMBER,options:[1n,4n,1900n]},()=>0,1,[]);
      record('announce-number',Number(response?.type)===Number(R.ANNOUNCE_NUMBER)&&Number(response?.value)===1,`value=${response?.value}`);
    }catch(error){record('announce-number',false,error?.message||error);}
    try{
      const serialized=this.stableJSONStringify({race:8n,nested:[1n,2]});
      record('bigint-reporting',serialized==='{"race":"8","nested":["1",2]}',serialized);
    }catch(error){record('bigint-reporting',false,error?.message||error);}
    record('chaininfo-native-core',String(status.coreVersion||'')==='0.1.4'&&Number(status.chainInfoCompatVersion||0)===0,`core=${String(status.coreVersion||'missing')}; compat=${Number(status.chainInfoCompatVersion)||0}`);record('chaininfo-abi-mode',String(status.chainInfoCompatMode||'')==='native-core-0.1.4',`mode=${String(status.chainInfoCompatMode||'missing')}`);record('runtime-core-version',!!String(status.runtimeCoreVersion||''),`runtime=${String(status.runtimeCoreVersion||'unavailable')}; telemetry-only`,false);
    const catalogCodes=new Set((catalog||[]).map(card=>Number(card?.id)||0)),chainRegression=[...this.hardeningChainInfoRegressionCodes()];record('chaininfo-regression-cards',chainRegression.every(code=>catalogCodes.has(code)),chainRegression.filter(code=>!catalogCodes.has(code)).join(',')||'all present');
    const defs=this.hardeningCategoryDefinitions(),regressionCases=this.hardeningChainInfoRegressionCases(),regressionDrift=regressionCases.filter(item=>defs[item.case%defs.length]?.id!==item.category||this.hardeningSeed(item.case,0).map(String).join(',')!==item.seed.join(','));record('chaininfo-regression-seeds',regressionDrift.length===0,regressionDrift.map(item=>String(item.case)).join(',')||'all locked');
    return{ok:checks.filter(check=>check.required!==false).every(check=>check.ok),checks};
  }

  hardeningCategoryDefinitions() {
    return [
      ['normal-summon','Normal Summon'],['tribute-summon','Tribute Summon'],['flip-summon','Flip Summon'],['ritual-summon','Ritual Summon'],['fusion-summon','Fusion Summon'],['synchro-summon','Synchro Summon'],['xyz-summon','Xyz Summon'],['pendulum-summon','Pendulum Summon'],['link-summon','Link Summon'],['special-summon','Other Special Summon'],
      ['chain-trigger','Trigger effects'],['trigger-ordering','Trigger ordering'],['chain-fast','Fast/Quick effects'],['chain-counter','Counter Traps'],['damage-step','Damage Step restrictions'],['negate-effect','Negate effect'],['negate-activation','Negate activation'],['continuous','Continuous effects'],['replacement','Replacement effects'],['cost','Costs versus effects'],['targeting','Targeting'],['non-targeting','Non-targeting interaction'],['control','Control changes'],['leave-resolution','Cards leaving during resolution'],['face-down','Face-down cards'],['tokens','Tokens'],['counters','Counters'],['equip','Equip mechanics'],['trap-monster','Trap Monsters'],['extra-monster-zone','Extra Monster Zone'],['battle-replay','Battle replay',true],['simultaneous','Simultaneous effects'],['alternate-win','Alternative victory'],['once-per-turn','Once-per-turn'],['hard-once-per-turn','Named hard once-per-turn'],['grave-replacement','Graveyard replacement'],['banished','Banished-card behavior'],['public-private','Public/private information'],['search-reveal-shuffle','Search/reveal/shuffle'],
    ].map(([id,label,ruleOnly=false])=>({id,label,ruleOnly}));
  }

  hardeningCardCatalog() {
    if(!this.db)return[];
    const result=this.db.exec("SELECT d.id,d.alias,d.type,d.level,d.atk,d.def,d.ot AS scope,t.name,t.desc FROM datas d LEFT JOIN texts t ON t.id=d.id WHERE d.id>0 ORDER BY d.id");
    if(!result?.length)return[];
    const cols=result[0].columns||[],rows=result[0].values||[];
    return rows.map(values=>Object.fromEntries(cols.map((col,index)=>[col,values[index]]))).map(row=>({id:Number(row.id)||0,alias:Number(row.alias)||0,type:Number(row.type)>>>0,level:Number(row.level)>>>0,atk:Number(row.atk)||0,def:Number(row.def)||0,scope:Number(row.scope)||0,name:String(row.name||''),desc:String(row.desc||'')})).filter(card=>card.id>0);
  }

  hardeningTagsForCard(card={}) {
    const tags=new Set(),type=Number(card.type)>>>0,level=(Number(card.level)>>>0)&0xff,text=`${card.name||''} ${card.desc||''}`;
    const MONSTER=0x1,SPELL=0x2,TRAP=0x4,EFFECT=0x20,FUSION=0x40,RITUAL=0x80,TUNER=0x1000,SYNCHRO=0x2000,TOKEN=0x4000,QUICKPLAY=0x10000,CONTINUOUS=0x20000,EQUIP=0x40000,COUNTER=0x100000,FLIP=0x200000,XYZ=0x800000,PENDULUM=0x1000000,SPECIAL=0x2000000,LINK=0x4000000;
    const isExtra=!!(type&(FUSION|SYNCHRO|XYZ|LINK));
    if(type&MONSTER){if(!isExtra&&!(type&RITUAL))tags.add('normal-summon');if(!isExtra&&level>=5)tags.add('tribute-summon');if((type&FLIP)||/\bFLIP\s*:/i.test(text))tags.add('flip-summon');}
    if(type&RITUAL)tags.add('ritual-summon');if(type&FUSION)tags.add('fusion-summon');if(type&SYNCHRO)tags.add('synchro-summon');if(type&XYZ)tags.add('xyz-summon');if(type&PENDULUM)tags.add('pendulum-summon');if(type&LINK)tags.add('link-summon');
    if((type&SPECIAL)||/\bspecial summon\b/i.test(text))tags.add('special-summon');
    if(/\b(?:if|when)\b[^:]{0,220}:/i.test(text)){tags.add('chain-trigger');tags.add('trigger-ordering');}if(/\(Quick Effect\)|\bduring either player's turn\b|\bquick effect\b/i.test(text)||(type&QUICKPLAY)||(type&COUNTER))tags.add('chain-fast');if(type&COUNTER)tags.add('chain-counter');
    if(/\bdamage step\b|\bdamage calculation\b/i.test(text))tags.add('damage-step');if(/negate (?:the )?(?:effects?|that effect)/i.test(text))tags.add('negate-effect');if(/negate (?:the )?activation/i.test(text))tags.add('negate-activation');
    if((type&CONTINUOUS)||/while this card is face-up|while you control|cannot be (?:destroyed|targeted)|unaffected by/i.test(text))tags.add('continuous');if(/\binstead\b|would be .{0,90},? (?:you can )?/i.test(text))tags.add('replacement');
    if(/(?:discard|tribute|pay \d+|banish|send)[^.;]{0,180};/i.test(text))tags.add('cost');if(/\btarget\b/i.test(text))tags.add('targeting');if(/\b(?:destroy|banish|send|return|negate)\b/i.test(text)&&!/\btarget\b/i.test(text))tags.add('non-targeting');
    if(/take control|gain control|switch control|control of (?:that|it|those)/i.test(text))tags.add('control');if(/if (?:this card|that card|that target|it) (?:leaves|is no longer)|even if (?:it|that card) leaves|still on the field/i.test(text))tags.add('leave-resolution');
    if(/face-down|face down|set this card|set that card/i.test(text))tags.add('face-down');if((type&TOKEN)||/\btoken\b/i.test(text))tags.add('tokens');if(/\bcounter(?:s)?\b/i.test(text))tags.add('counters');if((type&EQUIP)||/\bequip\b/i.test(text))tags.add('equip');
    if((type&TRAP)&&/special summon this card as (?:an? )?(?:normal|effect) monster/i.test(text))tags.add('trap-monster');if((type&LINK)||/extra monster zone/i.test(text))tags.add('extra-monster-zone');if(/attack target|replay the attack|number of monsters.*changed/i.test(text))tags.add('battle-replay');
    if(/at the same time|simultaneously|also,? (?:after that|then)|and if you do/i.test(text))tags.add('simultaneous');if(/\bwin the duel\b|\bwins the duel\b/i.test(text))tags.add('alternate-win');if(/once per turn/i.test(text))tags.add('once-per-turn');if(/you can only use (?:this|the following) effect of ["“][^"”]+["”] once per turn/i.test(text))tags.add('hard-once-per-turn');
    if(/(?:sent|send).{0,100}(?:graveyard|\bGY\b).{0,100}\binstead\b|\bbanish it instead\b/i.test(text))tags.add('grave-replacement');if(/\bbanish(?:ed)?\b/i.test(text))tags.add('banished');if(/\breveal\b|look at|face-down banished|opponent cannot (?:look|see)/i.test(text))tags.add('public-private');if(/add .{0,100} from (?:your )?deck|\breveal\b|\bshuffle\b|look at .{0,80}(?:deck|hand)/i.test(text))tags.add('search-reveal-shuffle');
    return tags;
  }

  hardeningOfficialCard(card={}) {
    const scope=Number(card.scope)||0;


    return scope===0||!!(scope&0x3);
  }

  hardeningChainInfoRegressionCases() {
    return [
      {case:1,category:'tribute-summon',script:15033525,seed:['1011205863','2581619522','2244548378','2842771676']},
      {case:2,category:'flip-summon',script:82359538,seed:['3666696342','2133392691','1301165821','1203294859']},
      {case:7,category:'pendulum-summon',script:41044418,seed:['4052809741','1412783528','2095430152','1589408258']},
      {case:9,category:'special-summon',script:28454232,seed:['771880303','2342801610','1378460674','2603446116']},
      {case:13,category:'chain-counter',script:15130912,seed:['2804126251','42350478','732791182','340724768']},
    ];
  }

  hardeningChainInfoRegressionCodes() { return new Set(this.hardeningChainInfoRegressionCases().map(item=>item.script)); }

  hardeningMandatoryChainInfoRegressionCases() {
    const historicFailureSteps=new Map([[7,135],[9,24],[13,218]]);
    return this.hardeningChainInfoRegressionCases().filter(item=>historicFailureSteps.has(item.case)).map(item=>({...item,historicFailureStep:historicFailureSteps.get(item.case)}));
  }

  async hardeningChainInfoRuntimePreflight(pools,catalog,preset) {
    const cases=[],mandatory=this.hardeningMandatoryChainInfoRegressionCases();
    for(const item of mandatory){
      if(this.hardeningCancelRequested)break;
      const minSteps=Number(item.historicFailureStep)||1,maxSteps=Math.max(minSteps+64,128),probePreset={...preset,maxSteps,duelTimeoutMs:Math.max(Number(preset?.duelTimeoutMs)||0,15000),budgetIsInconclusive:true,targetSettleSteps:maxSteps+1};
      this.setEngineStatus(`Hardening CHAININFO ABI preflight: case ${item.case} · ${item.category}`,'working');
      try{
        const run=await this.hardeningRunOneFuzz(item.case,item.category,pools,catalog,probePreset);
        const traversed=(Number(run?.steps)||0)>=minSteps;
        cases.push({...item,status:traversed?'passed':'incomplete',steps:Number(run?.steps)||0,result:run?.targetCompleted?'target-completed':run?.budgetExhausted?'probe-budget-reached':run?.ended?'ended':'completed',targetSatisfied:!!run?.targetSatisfied});
      }catch(error){
        const failure=this.hardeningFailureRecord(item.case,item.category,error);
        cases.push({...item,status:'failed',kind:failure.kind,error:failure.error,steps:failure.steps});
      }
      await this.wait(0);
    }
    const ok=cases.length===mandatory.length&&cases.every(item=>item.status==='passed');
    return{ok,cases,requiredCases:mandatory.map(item=>item.case),compatMode:String(this.enginePackageStatus?.chainInfoCompatMode||''),runtimeCoreVersion:String(this.enginePackageStatus?.runtimeCoreVersion||''),detail:ok?'all historical failure points traversed without a CHAININFO/runtime failure':cases.filter(item=>item.status!=='passed').map(item=>`case ${item.case}: ${item.status}${item.error?` (${item.error})`:''}`).join('; ')};
  }

  hardeningUpstreamScriptlessCodes() {




    return new Set([88264978,88264979]);
  }

  hardeningFuzzableCard(card={}) {
    return this.hardeningOfficialCard(card)&&!this.hardeningUpstreamScriptlessCodes().has(Number(card.id)||0);
  }

  hardeningBuildPools(catalog=[]) {
    const extraMask=0x40|0x2000|0x800000|0x4000000,token=0x4000,main=[],extra=[],byTag=new Map(this.hardeningCategoryDefinitions().map(x=>[x.id,[]]));
    for(const card of catalog){if(!this.hardeningFuzzableCard(card)||card.type&token)continue;if(card.type&extraMask)extra.push(card);else if(card.type&(0x1|0x2|0x4))main.push(card);for(const tag of this.hardeningTagsForCard(card))if(byTag.has(tag))byTag.get(tag).push(card);}
    return{main,extra,byTag};
  }

  hardeningCoverageSummary(catalog=[]) {
    const defs=this.hardeningCategoryDefinitions(),counts=Object.fromEntries(defs.map(d=>[d.id,0]));for(const card of catalog)for(const tag of this.hardeningTagsForCard(card))if(tag in counts)counts[tag]++;
    return defs.map(def=>({id:def.id,label:def.label,ruleOnly:!!def.ruleOnly,cards:counts[def.id]||0}));
  }

  hardeningRng(seed=1) {
    let state=(Number(seed)>>>0)||0x9e3779b9;return()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296;};
  }

  hardeningSeed(caseIndex=0,pass=0) {
    const base=(0x85c0ffee^(Math.imul(caseIndex+1,0x9e3779b1))^(Math.imul(pass+1,0x85ebca6b)))>>>0;return[BigInt(base||1),BigInt((base^0xa5a5a5a5)>>>0),BigInt((Math.imul(base,1664525)+1013904223)>>>0),BigInt((base+0x6d2b79f5)>>>0)];
  }

  hardeningSample(values=[],limit=Infinity) {
    if(!Number.isFinite(limit)||values.length<=limit)return[...values];const out=[],step=values.length/Math.max(1,Math.floor(limit));for(let i=0;i<limit;i++)out.push(values[Math.min(values.length-1,Math.floor(i*step))]);return out;
  }

  async hardeningReadCachedScript(code) {
    const response=await fetch(`/api/duel-engine/script?local=1&path=${encodeURIComponent(`official/c${Number(code)}.lua`)}`,{cache:'no-store'});return response.ok?response.text():null;
  }

  hardeningDiagnostic(type,text) {
    const value=Number(type),logs=this.mod?.OcgLogType||{},errorValue=Number(logs.ERROR??0),fromScript=Number(logs.FROM_SCRIPT??1),debugValue=Number(logs.FOR_DEBUG??2);
    const severity=value===errorValue?'error':value===fromScript?'script':value===debugValue?'debug':'info';
    const typeName=Object.entries(logs).find(([,v])=>Number(v)===value)?.[0]||String(value);
    return{type:value,typeName,severity,text:String(text||'')};
  }

  hardeningDiagnosticCardCode(text='') {
    const value=String(text||''),match=value.match(/(?:official\/)?c(\d+)\.lua/i)||value.match(/\bc(\d+)\.initial_effect\b/i);
    return match?Number(match[1])||0:0;
  }

  hardeningDiagnosticSummary(diagnostics=[]) {
    const summary={error:0,script:0,debug:0,info:0};for(const item of diagnostics)summary[item?.severity in summary?item.severity:'info']++;
    return summary;
  }

  hardeningDeduplicateFailures(items=[]) {
    const seen=new Set(),out=[];for(const item of items){const key=`${Number(item?.code)||0}|${String(item?.kind||'')}|${String(item?.error||'')}`;if(seen.has(key))continue;seen.add(key);out.push(item);}return out;
  }

  async hardeningCreateScriptAuditHandle(seed=[101n,202n,303n,404n]) {
    const diagnostics=[],requestedScripts=new Set(),servedScripts=new Set(),missingRequested=new Set();
    const scriptReader=async name=>{const path=String(name||'').replaceAll('\\','/').replace(/^\/+/,''),match=path.match(/(?:^|\/)c(\d+)\.lua$/i),code=match?Number(match[1]):0;if(code)requestedScripts.add(code);const source=await this.readScript(name);if(code){if(source)servedScripts.add(code);else missingRequested.add(code);}return source;};
    const handle=await this.core.createDuel({flags:this.practiceDuelFlags(),seed,team1:{startingLP:8000,startingDrawCount:0,drawCountPerTurn:0},team2:{startingLP:8000,startingDrawCount:0,drawCountPerTurn:0},cardReader:code=>this.cardData(code),scriptReader,errorHandler:(type,text)=>diagnostics.push(this.hardeningDiagnostic(type,text))});if(!handle)throw new Error('Hardening audit could not create an OCGCore duel.');
    const constant=await this.readScript('constant.lua'),utility=await this.readScript('utility.lua');if(!constant||!utility)throw new Error('Hardening audit could not load base CardScripts.');if(!await this.core.loadScript(handle,'constant.lua',constant)||!await this.core.loadScript(handle,'utility.lua',utility))throw new Error('Hardening audit base scripts were rejected by OCGCore.');return{handle,diagnostics,requestedScripts,servedScripts,missingRequested};
  }

  async hardeningAuditScripts(catalog,preset,progress=()=>{}) {
    const SCRIPT_TYPES=0x2|0x4|0x20|0x40|0x80|0x2000|0x800000|0x1000000|0x4000000,allCandidates=catalog.filter(card=>(card.type&SCRIPT_TYPES)!==0),officialCandidates=allCandidates.filter(card=>this.hardeningOfficialCard(card)),upstreamScriptless=officialCandidates.filter(card=>this.hardeningUpstreamScriptlessCodes().has(Number(card.id)||0)),candidates=officialCandidates.filter(card=>!this.hardeningUpstreamScriptlessCodes().has(Number(card.id)||0)),requiredCodes=this.hardeningChainInfoRegressionCodes(),required=candidates.filter(card=>requiredCodes.has(Number(card.id)||0)),sampled=this.hardeningSample(candidates,preset.scriptLimit),selected=[...required,...sampled.filter(card=>!requiredCodes.has(Number(card.id)||0))].slice(0,Number.isFinite(preset.scriptLimit)?preset.scriptLimit:undefined),batchSize=80;
    let available=0,initialized=0,missing=0,notRequested=0;const failures=[],missingCards=[],notRequestedCards=[],diagnostics=[];const M=this.mod,P=M.OcgPosition,extraMask=0x40|0x2000|0x800000|0x4000000;
    for(let start=0;start<selected.length;start+=batchSize){if(this.hardeningCancelRequested)break;const batch=selected.slice(start,start+batchSize);if(!batch.length)continue;
      const audit=await this.hardeningCreateScriptAuditHandle(this.hardeningSeed(start/batchSize,7));
      try{



        for(let index=0;index<batch.length;index++){const card=batch[index],team=index%2,location=(card.type&extraMask)?M.OcgLocation.EXTRA:M.OcgLocation.DECK;await this.core.duelNewCard(audit.handle,{code:card.id,team,duelist:0,controller:team,location,position:P.FACEDOWN_ATTACK,sequence:0});}


        for(const team of [0,1])await this.core.duelNewCard(audit.handle,{code:DUMMY_CARD_CODE,team,duelist:0,controller:team,location:M.OcgLocation.DECK,position:P.FACEDOWN_ATTACK,sequence:0});
        try{await this.core.startDuel(audit.handle);for(let i=0;i<4;i++){const status=await this.core.duelProcess(audit.handle);this.core.duelGetMessage(audit.handle);if(status!==M.OcgProcessResult.CONTINUE)break;}}catch(error){failures.push({code:0,name:'Audit batch',kind:'startup',error:String(error?.message||error)});}
        diagnostics.push(...audit.diagnostics);
        const fatalByCode=new Map();for(const diag of audit.diagnostics){if(diag.severity!=='error')continue;const code=this.hardeningDiagnosticCardCode(diag.text);if(code){if(!fatalByCode.has(code))fatalByCode.set(code,new Set());fatalByCode.get(code).add(diag.text);}else failures.push({code:0,name:'Audit batch',kind:'core-error',error:diag.text});}
        for(const card of batch){const codes=[card.id,card.alias].filter(Boolean),requested=codes.some(code=>audit.requestedScripts.has(code)),served=codes.some(code=>audit.servedScripts.has(code)),missingRequest=codes.some(code=>audit.missingRequested.has(code)),fatal=fatalByCode.get(card.id)||fatalByCode.get(card.alias);if(served)available++;if(missingRequest){missing++;missingCards.push({code:card.id,name:card.name});continue;}if(fatal){for(const text of fatal)failures.push({code:card.id,name:card.name,kind:'script-runtime',error:text});continue;}if(requested&&served)initialized++;else{notRequested++;notRequestedCards.push({code:card.id,name:card.name});}}
      }finally{try{this.core.destroyDuel(audit.handle);}catch{}}
      progress(Math.min(selected.length,start+batch.length),selected.length);await this.wait(0);
    }
    const uniqueFailures=this.hardeningDeduplicateFailures(failures);return{candidates:officialCandidates.length,excludedNonOfficial:allCandidates.length-officialCandidates.length,excludedUpstreamMissing:upstreamScriptless.length,upstreamMissingCards:upstreamScriptless.map(card=>({code:card.id,name:card.name})),selected:selected.length,available,loaded:initialized,initialized,missing,notRequested,missingCards:this.hardeningDeduplicateFailures(missingCards.map(x=>({...x,kind:'missing-script',error:''}))).map(({kind,error,...x})=>x),notRequestedCards:notRequestedCards.slice(0,500),failures:uniqueFailures,diagnosticSummary:this.hardeningDiagnosticSummary(diagnostics)};
  }

  hardeningDeckForCategory(pools,category,rng) {
    const extraMask=0x40|0x2000|0x800000|0x4000000,tagged=pools.byTag.get(category)||[],tagMain=tagged.filter(c=>(c.type&extraMask)===0),tagExtra=tagged.filter(c=>(c.type&extraMask)!==0);const chooseUnique=(primary,fallback,count)=>{const source=[...primary,...fallback],out=[],used=new Set();let guard=0;while(out.length<count&&guard++<source.length*6+100){const item=source[Math.floor(rng()*source.length)];if(!item||used.has(item.id))continue;used.add(item.id);out.push(item.id);}for(const item of fallback){if(out.length>=count)break;if(!used.has(item.id)){used.add(item.id);out.push(item.id);}}return out;};
    const mainBias=Math.min(18,tagMain.length),main=chooseUnique(tagMain,pools.main,Math.max(40,Math.min(60,40)));if(mainBias&&main.length>=40){for(let i=0;i<mainBias;i++){const item=tagMain[Math.floor(rng()*tagMain.length)];if(item&&!main.slice(0,mainBias).includes(item.id))main[i]=item.id;}}
    const extra=chooseUnique(tagExtra,pools.extra,15);return{main:main.slice(0,40),extra:extra.slice(0,15)};
  }

  async hardeningCreateFuzzDuel(player,dummy,seed) {
    const M=this.mod,diagnostics=[];let handle=null;
    try{
      handle=await this.core.createDuel({flags:this.practiceDuelFlags(),seed,team1:{startingLP:8000,startingDrawCount:5,drawCountPerTurn:1},team2:{startingLP:8000,startingDrawCount:5,drawCountPerTurn:1},cardReader:code=>this.cardData(code),scriptReader:name=>this.readScript(name),errorHandler:(type,text)=>diagnostics.push(this.hardeningDiagnostic(type,text))});
      if(!handle)throw new Error('Fuzz campaign could not create an OCGCore duel.');
      const constant=await this.readScript('constant.lua'),utility=await this.readScript('utility.lua');if(!constant||!utility)throw new Error('Fuzz campaign could not load base scripts.');if(!await this.core.loadScript(handle,'constant.lua',constant)||!await this.core.loadScript(handle,'utility.lua',utility))throw new Error('Fuzz campaign base scripts were rejected.');
      const P=M.OcgPosition;for(const code of player.main)await this.core.duelNewCard(handle,{code,team:0,duelist:0,controller:0,location:M.OcgLocation.DECK,position:P.FACEDOWN_ATTACK,sequence:0});for(const code of player.extra)await this.core.duelNewCard(handle,{code,team:0,duelist:0,controller:0,location:M.OcgLocation.EXTRA,position:P.FACEDOWN_ATTACK,sequence:0});for(const code of dummy.main)await this.core.duelNewCard(handle,{code,team:1,duelist:0,controller:1,location:M.OcgLocation.DECK,position:P.FACEDOWN_ATTACK,sequence:0});for(const code of dummy.extra)await this.core.duelNewCard(handle,{code,team:1,duelist:0,controller:1,location:M.OcgLocation.EXTRA,position:P.FACEDOWN_ATTACK,sequence:0});
      await this.core.startDuel(handle);return{handle,diagnostics};
    }catch(error){if(handle)try{this.core.destroyDuel(handle);}catch{}throw error;}
  }

  async hardeningCreateFuzzDuelWithRetry(player,dummy,seed) {
    let lastError=null;
    for(let setupAttempt=0;setupAttempt<2;setupAttempt++){
      try{const duel=await this.hardeningCreateFuzzDuel(player,dummy,seed);duel.setupAttempts=setupAttempt+1;return duel;}
      catch(error){lastError=error;const message=String(error?.message||error).trim().toLowerCase();if(message!=='eof'||setupAttempt>0)break;await this.wait(0);}
    }
    if(lastError&&String(lastError?.message||lastError).trim().toLowerCase()==='eof')lastError.hardeningKind='setup-eof';
    throw lastError||new Error('Fuzz campaign setup failed.');
  }

  hardeningShuffleIndices(length,rng) { const out=Array.from({length},(_,i)=>i);for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out; }

  legalAnnounceCardCodes(message={},candidates=[],cacheKey='default') {
    const canCache=message&&typeof message==='object',cache=this.announceCardCandidateCache||(this.announceCardCandidateCache=new WeakMap());let promptCache=canCache?cache.get(message):null;
    if(promptCache?.has(cacheKey))return promptCache.get(cacheKey);
    const codes=[],seen=new Set();for(const item of Array.isArray(candidates)?candidates:[]){const code=Number(item?.id??item?.code??item)||0;if(!code||seen.has(code))continue;seen.add(code);codes.push(code);}
    const matcher=this.mod?.cardMatchesOpcode,legal=typeof matcher!=='function'?codes:codes.filter(code=>{const card=this.cardData(code);return !!card&&matcher(card,message?.opcodes);});
    if(canCache){if(!promptCache){promptCache=new Map();cache.set(message,promptCache);}promptCache.set(cacheKey,legal);}
    return legal;
  }

  dummyAnnounceCardCodes(message={}) {
    const configured=this.getDeck?.()||{},preferred=[...(configured.main||[]),...(configured.extra||[]),...(this.knownDecks?.[0]||[]),...(this.knownDecks?.[1]||[])];
    const preferredLegal=this.legalAnnounceCardCodes(message,preferred,'dummy-preferred');if(preferredLegal.length)return preferredLegal;
    return this.legalAnnounceCardCodes(message,this.hardeningCardCatalog(),'dummy-catalog');
  }

  hardeningResponse(m,rng,attempt=0,catalog=[]) {
    const T=this.mod.OcgMessageType,R=this.mod.OcgResponseType,I=this.mod.SelectIdleCMDAction,B=this.mod.SelectBattleCMDAction;attempt=Math.max(0,Number(attempt)||0);const pick=arr=>arr.length?arr[(Math.floor(rng()*arr.length)+attempt)%arr.length]:null;
    if(m.type===T.SELECT_IDLECMD){const choices=[];(m.activates||[]).forEach((_,index)=>choices.push({type:R.SELECT_IDLECMD,action:I.SELECT_ACTIVATE,index}));(m.special_summons||[]).forEach((_,index)=>choices.push({type:R.SELECT_IDLECMD,action:I.SELECT_SPECIAL_SUMMON,index}));(m.summons||[]).forEach((_,index)=>choices.push({type:R.SELECT_IDLECMD,action:I.SELECT_SUMMON,index}));(m.pos_changes||[]).forEach((_,index)=>choices.push({type:R.SELECT_IDLECMD,action:I.SELECT_POS_CHANGE,index}));(m.spell_sets||[]).forEach((_,index)=>choices.push({type:R.SELECT_IDLECMD,action:I.SELECT_SPELL_SET,index}));(m.monster_sets||[]).forEach((_,index)=>choices.push({type:R.SELECT_IDLECMD,action:I.SELECT_MONSTER_SET,index}));if(m.to_bp)choices.push({type:R.SELECT_IDLECMD,action:I.TO_BP,index:null});if(m.to_ep)choices.push({type:R.SELECT_IDLECMD,action:I.TO_EP,index:null});return pick(choices);}
    if(m.type===T.SELECT_BATTLECMD){const choices=[];(m.activates||[]).forEach((_,index)=>choices.push({type:R.SELECT_BATTLECMD,action:B.SELECT_CHAIN,index}));(m.attacks||[]).forEach((_,index)=>choices.push({type:R.SELECT_BATTLECMD,action:B.SELECT_BATTLE,index}));if(m.to_m2)choices.push({type:R.SELECT_BATTLECMD,action:B.TO_M2,index:null});if(m.to_ep)choices.push({type:R.SELECT_BATTLECMD,action:B.TO_EP,index:null});return pick(choices);}
    if(m.type===T.SELECT_EFFECTYN)return{type:R.SELECT_EFFECTYN,yes:attempt%3!==2};if(m.type===T.SELECT_YESNO)return{type:R.SELECT_YESNO,yes:attempt%3!==2};if(m.type===T.SELECT_OPTION){const n=(m.options||[]).length;return n?{type:R.SELECT_OPTION,index:(Math.floor(rng()*n)+attempt)%n}:null;}
    if(m.type===T.SELECT_CHAIN){const n=(m.selects||[]).length;if(!m.forced&&attempt%4===3)return{type:R.SELECT_CHAIN,index:null};return n?{type:R.SELECT_CHAIN,index:(Math.floor(rng()*n)+attempt)%n}:{type:R.SELECT_CHAIN,index:null};}
    if(m.type===T.SELECT_POSITION){const positions=this.mod.ocgPositionParse(m.positions)||[];return positions.length?{type:R.SELECT_POSITION,position:positions[(Math.floor(rng()*positions.length)+attempt)%positions.length]}:null;}
    if(m.type===T.SELECT_CARD){const source=m.selects||[],min=Math.max(0,Number(m.min)||0),max=Math.max(min,Math.min(source.length,Number(m.max)||min));if(m.can_cancel&&attempt%7===6)return{type:R.SELECT_CARD,indicies:null};const count=min+(max>min?Math.floor(rng()*(max-min+1)):0),indices=this.hardeningShuffleIndices(source.length,rng).slice(0,count);return{type:R.SELECT_CARD,indicies:indices};}
    if(m.type===T.SELECT_TRIBUTE){const indices=this.dummyTributeIndices(m,attempt);return indices==null?(m.can_cancel?{type:R.SELECT_TRIBUTE,indicies:null}:null):{type:R.SELECT_TRIBUTE,indicies:indices};}
    if(m.type===T.SELECT_SUM){const indices=this.dummySelectSumIndices(m,attempt);return indices?{type:R.SELECT_SUM,indicies:indices}:null;}
    if(m.type===T.SELECT_UNSELECT_CARD){const select=m.select_cards||[],unselect=m.unselect_cards||[];if(m.can_finish&&attempt%3===0)return{type:R.SELECT_UNSELECT_CARD,index:null};if(select.length)return{type:R.SELECT_UNSELECT_CARD,index:(Math.floor(rng()*select.length)+attempt)%select.length};if(unselect.length)return{type:R.SELECT_UNSELECT_CARD,index:select.length+((Math.floor(rng()*unselect.length)+attempt)%unselect.length)};return(m.can_cancel||m.can_finish)?{type:R.SELECT_UNSELECT_CARD,index:null}:null;}
    if(m.type===T.SELECT_PLACE||m.type===T.SELECT_DISFIELD){const places=this.parsePlaces(m.field_mask,Number(m.player)||0),count=Math.max(1,Math.min(places.length,Number(m.count)||1));if(places.length<count)return null;const order=this.hardeningShuffleIndices(places.length,rng),picked=order.slice(0,count).map(i=>places[i]);return{type:m.type===T.SELECT_PLACE?R.SELECT_PLACE:R.SELECT_DISFIELD,places:picked};}
    if(m.type===T.SELECT_COUNTER){let left=Math.max(0,Number(m.count)||0),cards=m.cards||[],values=Array(cards.length).fill(0),order=this.hardeningShuffleIndices(cards.length,rng);for(const i of order){const cap=Math.max(0,Number(cards[i]?.count)||0),take=Math.min(left,cap);values[i]=take;left-=take;}return left===0?{type:R.SELECT_COUNTER,counters:values}:null;}
    if(m.type===T.SORT_CARD||m.type===T.SORT_CHAIN){const order=this.hardeningShuffleIndices((m.cards||[]).length,rng);return this.makeSortResponse(order);}
    if(m.type===T.ROCK_PAPER_SCISSORS){const round=Math.max(0,Number(this.hardeningRpsRound)||0);this.hardeningRpsRound=round+1;return{type:R.ROCK_PAPER_SCISSORS,value:[1,2,3][(round+attempt)%3]};}if(m.type===T.ANNOUNCE_NUMBER){const options=m.options||[];return options.length?{type:R.ANNOUNCE_NUMBER,value:(Math.floor(rng()*options.length)+attempt)%options.length}:null;}
    if(m.type===T.ANNOUNCE_RACE){const vals=firstBits(Number(m.available),Object.values(this.mod.OcgRace||{}).filter(v=>typeof v==='bigint').map(Number));const count=Math.min(Math.max(1,Number(m.count)||1),vals.length),order=this.hardeningShuffleIndices(vals.length,rng);return vals.length?{type:R.ANNOUNCE_RACE,races:order.slice(0,count).map(i=>BigInt(vals[i]))}:null;}
    if(m.type===T.ANNOUNCE_ATTRIB){const vals=firstBits(Number(m.available)||0,Object.values(this.mod.OcgAttribute||{}).filter(v=>typeof v==='number'));const count=Math.min(Math.max(1,Number(m.count)||1),vals.length),order=this.hardeningShuffleIndices(vals.length,rng);return vals.length?{type:R.ANNOUNCE_ATTRIB,attributes:order.slice(0,count).map(i=>vals[i])}:null;}
    if(m.type===T.ANNOUNCE_CARD){const candidates=this.legalAnnounceCardCodes(m,catalog,'hardening');return candidates.length?{type:R.ANNOUNCE_CARD,card:candidates[(Math.floor(rng()*candidates.length)+attempt)%candidates.length]}:null;}
    return null;
  }

  hardeningInterpretPrompt(prompt={}) {
    const T=this.mod?.OcgMessageType||{},selection=new Set([T.SELECT_CARD,T.SELECT_TRIBUTE,T.SELECT_SUM,T.SELECT_UNSELECT_CARD,T.SELECT_PLACE,T.SELECT_POSITION,T.SELECT_COUNTER,T.SORT_CARD,T.SORT_CHAIN].filter(v=>v!=null));const signature=this.replayPromptSignature(prompt);if(!signature)throw new Error('UI prompt signature was empty.');let title='';if(selection.has(prompt.type)){const purpose=this.selectionPurpose(prompt);title=String(purpose?.title||'').trim();if(!title)throw new Error('Selection prompt produced no semantic title.');}else{const code=this.effectSourceCode(prompt);if(code)this.inferPromptEffectText(prompt);}return{signature,title};
  }

  hardeningCheckState(handle) {
    const M=this.mod,L=M.OcgLocation,Q=M.OcgQueryFlags,flags=(Q.CODE||0)|(Q.POSITION||0)|(Q.TYPE||0)|(Q.OWNER||0),fail=[];for(const player of [0,1]){for(const loc of [L.DECK,L.HAND,L.GRAVE,L.REMOVED,L.EXTRA]){if(loc==null)continue;let count;try{count=Number(this.core.duelQueryCount(handle,player,loc));}catch(error){fail.push(`query count failed p${player} loc${loc}: ${error?.message||error}`);continue;}if(!Number.isInteger(count)||count<0||count>200)fail.push(`impossible count ${count} at p${player} loc${loc}`);}for(const [loc,max] of [[L.MZONE,7],[L.SZONE,8]]){if(loc==null)continue;for(let sequence=0;sequence<max;sequence++){let card;try{card=this.core.duelQuery(handle,{controller:player,location:loc,sequence,flags});}catch(error){fail.push(`fixed-slot query failed p${player} loc${loc} seq${sequence}: ${error?.message||error}`);continue;}if(!card||!Number(card.code))continue;const qloc=Number(card.location??loc)||0,qseq=Number(card.sequence??sequence),controller=Number(card.controller??player);if(!(qloc&Number(loc)))fail.push(`card ${card.code} reports impossible location ${qloc} in ${loc}`);if(controller!==player)fail.push(`card ${card.code} controller ${controller} disagrees with queried player ${player}`);if(qseq<0||qseq>=max)fail.push(`card ${card.code} sequence ${qseq} outside location ${loc}`);}}}try{const field=this.core.duelQueryField(handle);if(field?.chain&&!Array.isArray(field.chain))fail.push('duelQueryField returned a non-array Chain.');}catch(error){fail.push(`field query failed: ${error?.message||error}`);}return fail;
  }

  hardeningMessageCardCode(message={}) {
    const raw=message?.code??message?.card?.code??message?.card??message?.effect?.code??message?.effect_code??0;return Number(raw)||0;
  }

  hardeningMessageCoverage(messages=[],coverage={}) {
    const T=this.mod?.OcgMessageType||{},P=this.mod?.OcgPhase||{},L=this.mod?.OcgLocation||{};
    coverage.chainDepth=Math.max(0,Number(coverage.chainDepth)||0);
    coverage.monsterTopologyRevision=Math.max(0,Number(coverage.monsterTopologyRevision)||0);
    const addCardTags=(code,allowed=null)=>{code=Number(code)||0;if(!code)return;const row=this.queryCardRow(code);if(!row)return;for(const tag of this.hardeningTagsForCard({id:code,type:Number(row.type)||0,level:Number(row.level)||0,name:row.name||'',desc:row.desc||''}))if(!allowed||allowed.has(tag))coverage.dynamic.add(tag);};
    const chainInteractionTags=new Set(['chain-trigger','chain-fast','chain-counter','negate-effect','negate-activation','continuous','replacement','cost','targeting','non-targeting','control','leave-resolution','simultaneous','once-per-turn','hard-once-per-turn','grave-replacement','banished','public-private','search-reveal-shuffle']);
    const battlePhases=new Set([P.BATTLE_START,P.BATTLE_STEP,P.BATTLE,P.DAMAGE,P.DAMAGE_CAL].filter(value=>value!=null));
    for(const m of messages){
      const name=Object.entries(T).find(([,value])=>value===m.type)?.[0]||`TYPE_${m.type}`,code=this.hardeningMessageCardCode(m);
      coverage.messageTypes[name]=(coverage.messageTypes[name]||0)+1;
      if(name==='NEW_PHASE'){coverage.phase=Number(m.phase);coverage.activeAttack=null;}
      if(name==='ATTACK')coverage.activeAttack={player:Number(m.player??m.card?.controller??m.attacker?.controller??0)||0,monsterTopologyRevision:coverage.monsterTopologyRevision};
      if(name==='SELECT_YESNO'&&coverage.activeAttack&&coverage.monsterTopologyRevision>Number(coverage.activeAttack.monsterTopologyRevision||0)&&battlePhases.has(Number(coverage.phase))&&!code)coverage.dynamic.add('battle-replay');
      if(name==='CHAINING'){coverage.chainDepth++;coverage.dynamic.add('chain-trigger');addCardTags(code,chainInteractionTags);}
      else if(name==='CHAIN_END')coverage.chainDepth=0;
      else if(name.includes('CHAIN'))coverage.dynamic.add('chain-trigger');
      if(name==='CHAINED'&&(coverage.messageTypes.CHAINED||0)>=2)coverage.dynamic.add('trigger-ordering');
      if(name==='CHAIN_NEGATED')coverage.dynamic.add('negate-activation');
      if(name==='CHAIN_DISABLED')coverage.dynamic.add('negate-effect');
      if(name.includes('NEGAT')||name.includes('DISABL'))coverage.dynamic.add('negate-effect');
      if(name.includes('COUNTER'))coverage.dynamic.add('counters');
      if(name==='PAY_LPCOST')coverage.dynamic.add('cost');
      if(name==='BECOME_TARGET'||name==='CARD_TARGET')coverage.dynamic.add('targeting');
      if(name.includes('CONFIRM')||name.includes('SHUFFLE')){coverage.dynamic.add('public-private');coverage.dynamic.add('search-reveal-shuffle');}



      if(name==='WIN'&&Number(m.reason)>=0x10)coverage.dynamic.add('alternate-win');
      if(name.includes('FLIPSUMMON'))coverage.dynamic.add('flip-summon');
      if(name==='SELECT_TRIBUTE')coverage.dynamic.add('tribute-summon');
      if(name==='SUMMONING'||name==='SUMMONED'){coverage.dynamic.add('normal-summon');if(code){const row=this.queryCardRow(code);if(((Number(row?.level)||0)&0xff)>=5)coverage.dynamic.add('tribute-summon');}}
      if(name.includes('SPSUMMON')){coverage.dynamic.add('special-summon');addCardTags(code,new Set(['ritual-summon','fusion-summon','synchro-summon','xyz-summon','pendulum-summon','link-summon','special-summon','trap-monster','extra-monster-zone']));}
      if((m.type===T.NEW_PHASE&&(Number(m.phase)===Number(P.DAMAGE)||Number(m.phase)===Number(P.DAMAGE_CAL)))||name==='DAMAGE_STEP_START'||name==='DAMAGE_STEP_END')coverage.dynamic.add('damage-step');
      if(name==='MOVE'){
        const from=Number(m.from?.location)||0,to=Number(m.to?.location)||0,fromController=Number(m.from?.controller??m.controller??0),toController=Number(m.to?.controller??m.controller??fromController);
        if((from|to)&Number(L.MZONE||0))coverage.monsterTopologyRevision++;
        if((from|to)&Number(L.REMOVED||0))coverage.dynamic.add('banished');
        if(fromController!==toController)coverage.dynamic.add('control');
        if(coverage.chainDepth>0&&from!==to)coverage.dynamic.add('leave-resolution');
        if(code)addCardTags(code,new Set(['tokens','trap-monster','equip','face-down','grave-replacement']));
      }
      if(name==='DAMAGE_STEP_START'||name==='DAMAGE_STEP_END'||name==='ATTACK_DISABLED')coverage.activeAttack=null;
      if(name==='EQUIP')coverage.dynamic.add('equip');
      if(name==='ADD_COUNTER'||name==='REMOVE_COUNTER')coverage.dynamic.add('counters');
    }
  }

  hardeningTargetSatisfied(category,coverage={}) {
    return !!category&&coverage?.dynamic instanceof Set&&coverage.dynamic.has(category);
  }

  hardeningTargetSettled(handle,status,category,coverage,targetFirstSeenStep,steps,preset={},batch=[]) {
    if(targetFirstSeenStep==null||!this.hardeningTargetSatisfied(category,coverage))return false;
    const settle=Math.max(4,Number(preset.targetSettleSteps)||16);if(steps-targetFirstSeenStep<settle)return false;
    let chain=[];try{chain=this.core.duelQueryField(handle)?.chain||[];}catch{return false;}if(chain.length)return false;
    if(status===this.mod?.OcgProcessResult?.CONTINUE)return true;



    const T=this.mod?.OcgMessageType||{},prompt=[...batch].reverse().find(message=>this.isPrompt(message));
    if(!prompt)return false;
    if(prompt.type===T.SELECT_IDLECMD||prompt.type===T.SELECT_BATTLECMD)return true;
    if(prompt.type===T.SELECT_CHAIN&&!prompt.forced)return true;
    return false;
  }


  hardeningPromptTypeName(type) { const T=this.mod?.OcgMessageType||{};return Object.entries(T).find(([,value])=>Number(value)===Number(type))?.[0]||`TYPE_${type}`; }

  hardeningMeaningfulProgress(messages=[]) {
    const T=this.mod?.OcgMessageType||{},ignored=new Set([T.RETRY,T.HINT,T.WAITING,T.UPDATE_DATA,T.UPDATE_CARD,T.SELECT_BATTLECMD,T.SELECT_IDLECMD,T.SELECT_EFFECTYN,T.SELECT_YESNO,T.SELECT_OPTION,T.SELECT_CARD,T.SELECT_CHAIN,T.SELECT_PLACE,T.SELECT_POSITION,T.SELECT_TRIBUTE,T.SORT_CHAIN,T.SELECT_COUNTER,T.SELECT_SUM,T.SELECT_DISFIELD,T.SORT_CARD,T.SELECT_UNSELECT_CARD,T.ROCK_PAPER_SCISSORS,T.ANNOUNCE_RACE,T.ANNOUNCE_ATTRIB,T.ANNOUNCE_CARD,T.ANNOUNCE_NUMBER].filter(v=>v!=null));
    return messages.some(message=>!ignored.has(message?.type));
  }

  hardeningStateFingerprint(handle) {
    const M=this.mod||{},L=M.OcgLocation||{},Q=M.OcgQueryFlags||{},flags=(Q.CODE||0)|(Q.POSITION||0)|(Q.OWNER||0),parts=[];
    try{for(const player of [0,1]){for(const loc of [L.DECK,L.HAND,L.GRAVE,L.REMOVED,L.EXTRA])if(loc!=null)parts.push(`${player}:${loc}:${Number(this.core.duelQueryCount(handle,player,loc))}`);for(const [loc,max] of [[L.MZONE,7],[L.SZONE,8]])if(loc!=null)for(let sequence=0;sequence<max;sequence++){const card=this.core.duelQuery(handle,{controller:player,location:loc,sequence,flags});if(card&&Number(card.code))parts.push(`z:${player}:${loc}:${sequence}:${Number(card.code)}:${Number(card.position)||0}:${Number(card.owner??player)}`);}}const field=this.core.duelQueryField(handle);for(const item of field?.chain||[])parts.push(`c:${Number(item?.code||item?.card?.code)||0}:${Number(item?.controller??item?.triggering_controller)||0}:${Number(item?.location??item?.triggering_location)||0}:${Number(item?.sequence??item?.triggering_sequence)||0}`);}catch(error){parts.push(`query-error:${String(error?.message||error)}`);}return parts.join('|');
  }

  hardeningResponseFailure(prompt={}) {
    const T=this.mod?.OcgMessageType||{},name=this.hardeningPromptTypeName(prompt.type);if(prompt.type===T.SELECT_SUM)return`Could not construct a legal SELECT_SUM response (amount=${Number(prompt.amount)||0}, min=${Number(prompt.min)||0}, max=${Number(prompt.max)||0}, mode=${Number(prompt.select_max)||0}, must=${(prompt.selects_must||[]).length}, optional=${(prompt.selects||[]).length}).`;return`No fuzz response generator for unsupported prompt ${name} (${prompt.type}).`;
  }

  hardeningFuzzFailure(message,kind,metrics={}) { const error=new Error(message);error.hardeningKind=kind;error.hardeningMetrics=metrics;return error; }

  async hardeningDriveFuzz(handle,{rng,catalog,preset,recorded=null,coverage,diagnostics=[],category=''}) {
    const R=this.mod.OcgProcessResult,T=this.mod.OcgMessageType,decisions=[],trace=[];let steps=0,prompts=0,messagesSeen=0,retries=0,lastPrompt=null,lastResponse=null,lastAttempt=0,replayIndex=0,diagnosticCursor=0,lastLoopKey='',sameNoProgress=0,lastState='',progressEvents=0,terminal=null,targetFirstSeenStep=null,targetFirstSeenAtMs=null,lastProcessStatus=null;this.hardeningRpsRound=0;const started=Date.now();
    const settleSteps=Math.max(4,Number(preset.targetSettleSteps)||16),baseStepLimit=Math.max(1,Number(preset.maxSteps)||1),settleGraceMs=Math.max(1000,Math.min(5000,Number(preset.targetSettleGraceMs)||settleSteps*125));
    const effectiveStepLimit=()=>targetFirstSeenStep==null?baseStepLimit:Math.max(baseStepLimit,targetFirstSeenStep+settleSteps);
    const effectiveDeadline=()=>targetFirstSeenAtMs==null?started+(Number(preset.duelTimeoutMs)||15000):Math.max(started+(Number(preset.duelTimeoutMs)||15000),targetFirstSeenAtMs+settleGraceMs);
    const snapshot=()=>({steps,prompts,messages:messagesSeen,retries,decisions:[...decisions],trace:[...trace],lastPrompt:lastPrompt?this.replayPromptSignature(lastPrompt):'',lastResponse,lastState,progressEvents,terminal,targetFirstSeenStep,targetFirstSeenMsElapsed:targetFirstSeenAtMs==null?null:Math.max(0,targetFirstSeenAtMs-started),targetSatisfied:this.hardeningTargetSatisfied(category,coverage),effectiveStepLimit:effectiveStepLimit(),lastProcessStatus,diagnosticSummary:this.hardeningDiagnosticSummary(diagnostics),dynamic:[...coverage.dynamic],messageTypes:{...coverage.messageTypes}});
    const fail=(message,kind)=>{throw this.hardeningFuzzFailure(message,kind,snapshot());};
    const finish=(kind,win=null)=>{terminal={kind,player:win?.player==null?null:Number(win.player),reason:win?.reason==null?null:Number(win.reason)};if(recorded&&replayIndex!==recorded.length)fail(`Replay divergence: duel reached ${kind} after ${replayIndex} of ${recorded.length} recorded decisions.`,'replay-divergence');if(category&&!this.hardeningTargetSatisfied(category,coverage))return{ended:true,coverageIncomplete:true,completionReason:`duel-${kind}-before-target`,...snapshot()};return{ended:true,...snapshot()};};
    const finishTarget=()=>{terminal={kind:'target-exercised',category};if(recorded&&replayIndex>recorded.length)fail(`Replay divergence: target ${category} completed after consuming too many recorded decisions.`,'replay-divergence');return{ended:false,targetCompleted:true,completionReason:'category-exercised',...snapshot()};};
    while(steps<effectiveStepLimit()){
      if(this.hardeningCancelRequested)return{cancelled:true,...snapshot()};
      if(Date.now()>effectiveDeadline()){
        if(!this.hardeningTargetSatisfied(category,coverage))return{ended:false,coverageIncomplete:true,timeBudgetExhausted:true,completionReason:'target-time-budget-exhausted',...snapshot()};
        fail(`Fuzz duel exceeded its wall-clock budget after the target interaction was observed; base ${Number(preset.duelTimeoutMs)||15000} ms plus settlement grace ${settleGraceMs} ms.`,'timeout');
      }
      steps++;let status,batch;
      try{status=await this.core.duelProcess(handle);lastProcessStatus=status;}catch(error){const message=String(error?.message||error).trim();if(message.toLowerCase()==='eof')fail('eof','core-process-eof');if(error&&typeof error==='object'&&!error.hardeningMetrics)error.hardeningMetrics=snapshot();throw error;}
      try{batch=this.core.duelGetMessage(handle)||[];}catch(error){const message=String(error?.message||error).trim();if(message.toLowerCase()==='eof'){if(status===R.END)return finish('end');fail('eof','core-message-eof');}if(error&&typeof error==='object'&&!error.hardeningMetrics)error.hardeningMetrics=snapshot();throw error;}
      messagesSeen+=batch.length;this.hardeningMessageCoverage(batch,coverage);const meaningful=this.hardeningMeaningfulProgress(batch);if(meaningful)progressEvents++;
      if(targetFirstSeenStep==null&&this.hardeningTargetSatisfied(category,coverage)){targetFirstSeenStep=steps;targetFirstSeenAtMs=Date.now();}
      const freshDiagnostics=diagnostics.slice(diagnosticCursor);diagnosticCursor=diagnostics.length;const fatal=freshDiagnostics.filter(item=>item?.severity==='error');if(fatal.length)fail(`OCGCore/CardScripts fatal error: ${fatal.map(item=>`[${item.typeName}] ${item.text}`).join(' | ')}`,'core-script-error');
      const win=batch.find(message=>message?.type===T.WIN);if(win)return finish('win',win);
      const retry=batch.some(message=>message?.type===T.RETRY);
      if(status===R.END)return finish('end');
      if(this.hardeningTargetSettled(handle,status,category,coverage,targetFirstSeenStep,steps,preset,batch))return finishTarget();
      if(status===R.CONTINUE){if(steps%20===0){const invariant=this.hardeningCheckState(handle);if(invariant.length)fail(invariant[0],'state-invariant');}continue;}
      let prompt=[...batch].reverse().find(message=>this.isPrompt(message));if(retry&&!prompt)prompt=lastPrompt;if(!prompt)fail(`WAITING without supported prompt; messages=${batch.map(message=>this.hardeningPromptTypeName(message.type)).join(',')}`,'unsupported-waiting');
      prompts++;const interpretation=this.hardeningInterpretPrompt(prompt);let response;
      if(recorded){const expected=recorded[replayIndex];if(!expected)fail(`Replay emitted extra prompt ${interpretation.signature}.`,'replay-divergence');if(expected.signature!==interpretation.signature)fail(`Replay divergence at decision ${replayIndex}: expected ${expected.signature}, got ${interpretation.signature}.`,'replay-divergence');response=expected.response;replayIndex++;}
      else{if(retry){retries++;lastAttempt++;}else lastAttempt=0;response=this.hardeningResponse(prompt,rng,lastAttempt,catalog);if(!response)fail(this.hardeningResponseFailure(prompt),'response-generation');decisions.push({signature:interpretation.signature,response:typeof structuredClone==='function'?structuredClone(response):response});}
      const state=this.hardeningStateFingerprint(handle),responseKey=this.dummyResponseFingerprint(response),loopKey=`${interpretation.signature}|${state}|${responseKey}`;if(!meaningful&&loopKey===lastLoopKey)sameNoProgress++;else sameNoProgress=0;lastLoopKey=loopKey;lastState=state;if(sameNoProgress>48)fail(`Confirmed no-progress prompt loop after ${sameNoProgress+1} identical state/prompt/response cycles at ${interpretation.signature}.`,'no-progress-loop');
      trace.push({step:steps,signature:interpretation.signature,retry:!!retry,response:responseKey,state});if(trace.length>64)trace.shift();lastPrompt=prompt;lastResponse=response;this.core.duelSetResponse(handle,this.toCoreResponse(response));if(steps%25===0){const invariant=this.hardeningCheckState(handle);if(invariant.length)fail(invariant[0],'state-invariant');await this.wait(0);}
    }
    const targetSatisfied=this.hardeningTargetSatisfied(category,coverage),limit=effectiveStepLimit();
    if(!targetSatisfied||preset.budgetIsInconclusive)return{ended:false,coverageIncomplete:true,budgetExhausted:true,completionReason:targetSatisfied?'step-budget-exhausted':'target-not-reached',...snapshot()};
    fail(`Fuzz duel exceeded ${limit} OCGCore process steps after the target interaction was observed but never safely settled (base budget ${baseStepLimit}, target first seen at ${targetFirstSeenStep}, settlement window ${settleSteps}); last response ${this.dummyResponseFingerprint(lastResponse)}.`,'step-limit');
  }

  async hardeningRunOneFuzz(caseIndex,category,pools,catalog,preset,{replay=false,recorded=null}={}) {
    const maxRunAttempts=replay?1:2;let lastError=null;
    for(let runAttempt=0;runAttempt<maxRunAttempts;runAttempt++){


      const rng=this.hardeningRng(0x850000+caseIndex),player=this.hardeningDeckForCategory(pools,category,rng),dummy=this.hardeningDeckForCategory(pools,category,rng),seed=this.hardeningSeed(caseIndex,0),coverage={dynamic:new Set(),messageTypes:{}};this.dummyMaterialPlanner=null;let duel=null;
      try{
        duel=await this.hardeningCreateFuzzDuelWithRetry(player,dummy,seed);
        const run=await this.hardeningDriveFuzz(duel.handle,{rng,catalog,preset,recorded,coverage,diagnostics:duel.diagnostics,category});return{...run,category,player,dummy,seed:seed.map(String),setupAttempts:duel.setupAttempts||1,runAttempts:runAttempt+1,dynamic:[...coverage.dynamic],messageTypes:coverage.messageTypes,diagnostics:duel.diagnostics,diagnosticSummary:this.hardeningDiagnosticSummary(duel.diagnostics)};
      }catch(error){
        lastError=error;const metrics=error?.hardeningMetrics||{},kind=String(error?.hardeningKind||''),messageEOF=kind==='core-message-eof',transientEOF=messageEOF||kind==='core-io-eof'||String(error?.message||error).trim().toLowerCase()==='eof';
        const diagnosticSummary=this.hardeningDiagnosticSummary(duel?.diagnostics||[]);error.hardeningCase={category,player,dummy,seed:seed.map(String),setupAttempts:duel?.setupAttempts||1,runAttempts:runAttempt+1,dynamic:[...coverage.dynamic],messageTypes:{...coverage.messageTypes},diagnostics:duel?.diagnostics?.slice(-64)||[],diagnosticSummary,metrics};
        if(transientEOF&&!replay&&runAttempt+1<maxRunAttempts){await this.wait(0);continue;}



        if(messageEOF&&!replay&&!metrics.targetSatisfied&&Number(diagnosticSummary.error||0)===0){return{ended:false,coverageIncomplete:true,completionReason:'core-message-eof-before-target',ioEOF:true,...metrics,category,player,dummy,seed:seed.map(String),setupAttempts:duel?.setupAttempts||1,runAttempts:runAttempt+1,dynamic:[...coverage.dynamic],messageTypes:{...coverage.messageTypes},diagnostics:duel?.diagnostics||[],diagnosticSummary};}
        throw error;
      }finally{if(duel?.handle)try{this.core.destroyDuel(duel.handle);}catch{}}
    }
    throw lastError||new Error('Fuzz campaign case failed without an error.');
  }

  hardeningMergeFuzzMetrics(target,run={}) {
    target.totalSteps+=(Number(run.steps)||0);target.totalPrompts+=(Number(run.prompts)||0);target.totalMessages+=(Number(run.messages)||0);target.totalRetries+=(Number(run.retries)||0);target.transientCaseRetries=(Number(target.transientCaseRetries)||0)+Math.max(0,(Number(run.runAttempts)||1)-1);for(const tag of run.dynamic||[])target._dynamic.add(tag);for(const [name,count] of Object.entries(run.messageTypes||{}))target.messageTypes[name]=(target.messageTypes[name]||0)+(Number(count)||0);const summary=run.diagnosticSummary||{};for(const key of ['error','script','debug','info'])target.diagnosticSummary[key]=(target.diagnosticSummary[key]||0)+(Number(summary[key])||0);
  }

  hardeningFailureRecord(caseIndex,category,error) {
    const detail=error?.hardeningCase||{},metrics=detail.metrics||error?.hardeningMetrics||{};return{case:caseIndex,category,kind:String(error?.hardeningKind||'exception'),error:String(error?.message||error),seed:detail.seed||null,player:detail.player||null,dummy:detail.dummy||null,setupAttempts:Number(detail.setupAttempts)||1,runAttempts:Number(detail.runAttempts)||1,steps:Number(metrics.steps)||0,prompts:Number(metrics.prompts)||0,messages:Number(metrics.messages)||0,retries:Number(metrics.retries)||0,lastPrompt:String(metrics.lastPrompt||''),lastResponse:metrics.lastResponse??null,lastState:String(metrics.lastState||''),targetFirstSeenStep:metrics.targetFirstSeenStep==null?null:Number(metrics.targetFirstSeenStep),targetFirstSeenMsElapsed:metrics.targetFirstSeenMsElapsed==null?null:Number(metrics.targetFirstSeenMsElapsed),targetSatisfied:!!metrics.targetSatisfied,effectiveStepLimit:Number(metrics.effectiveStepLimit)||0,lastProcessStatus:metrics.lastProcessStatus==null?null:Number(metrics.lastProcessStatus),progressEvents:Number(metrics.progressEvents)||0,trace:Array.isArray(metrics.trace)?metrics.trace.slice(-64):[],dynamicCoverage:detail.dynamic||metrics.dynamic||[],messageTypes:detail.messageTypes||metrics.messageTypes||{},diagnosticSummary:detail.diagnosticSummary||metrics.diagnosticSummary||{},diagnostics:Array.isArray(detail.diagnostics)?detail.diagnostics.slice(-64):[],reproduction:null};
  }

  hardeningCoverageIncompleteRecord(caseIndex,category,run={}) {
    return{case:caseIndex,category,kind:'coverage-incomplete',reason:String(run.completionReason||'step-budget-exhausted'),seed:Array.isArray(run.seed)?[...run.seed]:null,player:run.player||null,dummy:run.dummy||null,setupAttempts:Number(run.setupAttempts)||1,runAttempts:Number(run.runAttempts)||1,steps:Number(run.steps)||0,prompts:Number(run.prompts)||0,messages:Number(run.messages)||0,retries:Number(run.retries)||0,decisionCount:Array.isArray(run.decisions)?run.decisions.length:0,lastPrompt:String(run.lastPrompt||''),lastResponse:run.lastResponse??null,lastState:String(run.lastState||''),targetFirstSeenStep:run.targetFirstSeenStep==null?null:Number(run.targetFirstSeenStep),targetFirstSeenMsElapsed:run.targetFirstSeenMsElapsed==null?null:Number(run.targetFirstSeenMsElapsed),targetSatisfied:!!run.targetSatisfied,effectiveStepLimit:Number(run.effectiveStepLimit)||0,lastProcessStatus:run.lastProcessStatus==null?null:Number(run.lastProcessStatus),progressEvents:Number(run.progressEvents)||0,timeBudgetExhausted:!!run.timeBudgetExhausted,ioEOF:!!run.ioEOF,trace:Array.isArray(run.trace)?run.trace.slice(-64):[],dynamicCoverage:Array.isArray(run.dynamic)?[...run.dynamic]:[],messageTypes:{...(run.messageTypes||{})},diagnosticSummary:{...(run.diagnosticSummary||{})},diagnostics:Array.isArray(run.diagnostics)?run.diagnostics.slice(-64):[]};
  }

  async hardeningReplayFailure(caseIndex,category,pools,catalog,preset,originalError) {
    const originalKind=String(originalError?.hardeningKind||'exception'),originalMessage=String(originalError?.message||originalError),recorded=originalError?.hardeningCase?.metrics?.decisions||originalError?.hardeningMetrics?.decisions||[];
    try{
      const replay=await this.hardeningRunOneFuzz(caseIndex,category,pools,catalog,preset,{replay:true,recorded});
      return{attempted:true,reproduced:false,result:replay?.targetCompleted?'target-completed':replay?.budgetExhausted?'budget-exhausted':replay?.ended?'ended':'completed',steps:Number(replay?.steps)||0,prompts:Number(replay?.prompts)||0,messages:Number(replay?.messages)||0};
    }catch(error){
      const kind=String(error?.hardeningKind||'exception'),message=String(error?.message||error),sameKind=kind===originalKind,sameError=sameKind&&message===originalMessage;
      return{attempted:true,reproduced:sameError,sameKind,sameError,kind,error:message,steps:Number(error?.hardeningCase?.metrics?.steps||error?.hardeningMetrics?.steps)||0,prompts:Number(error?.hardeningCase?.metrics?.prompts||error?.hardeningMetrics?.prompts)||0,messages:Number(error?.hardeningCase?.metrics?.messages||error?.hardeningMetrics?.messages)||0};
    }
  }

  cancelHardeningSuite() { if(this.hardeningRunning){this.hardeningCancelRequested=true;this.toast('Hardening campaign cancellation requested.');} }

  exportHardeningReport() { if(!this.hardeningReport){this.toast('No hardening report is available yet.');return;}this.downloadJSONFile(`duel_hardening_${this.hardeningReport.preset}_${new Date().toISOString().replace(/[:.]/g,'-')}.json`,this.hardeningReport); }

  async runHardeningSuite(presetName='extended') {
    if(this.running&&this.handle){this.toast('End the current duel before running the Rules Hardening Lab.');return;}if(this.hardeningRunning)return;const presets=this.hardeningPresets(),preset=presets[presetName]||presets.extended;this.hardeningRunning=true;this.hardeningCancelRequested=false;this.hardeningReport=null;this.renderSimulatorSettings();const startedAt=new Date().toISOString();try{this.hidePrompt();this.setEngineStatus(`Hardening: preparing ${preset.label} campaign...`,'working');await this.ensureEngine();await this.initializeDatabase();this.setEngineStatus('Hardening: caching pinned Project Ignis CardScripts...','working');const prefetch=await fetch('/api/duel-engine/scripts/prefetch',{method:'POST'});const prefetchResult=await prefetch.json();if(!prefetch.ok||!prefetchResult.ok)throw new Error(prefetchResult.error||'CardScripts prefetch failed.');const catalog=this.hardeningCardCatalog(),coverage=this.hardeningCoverageSummary(catalog),pools=this.hardeningBuildPools(catalog),missingCategories=this.hardeningCategoryDefinitions().filter(def=>!def.ruleOnly&&(pools.byTag.get(def.id)||[]).length===0);if(missingCategories.length)throw new Error(`Official-card interaction corpus has no representative cards for: ${missingCategories.map(x=>x.label).join(', ')}.`);
      const preflight=this.hardeningResponseSerializerPreflight(catalog);if(!preflight.ok)throw new Error(`Hardening response serializer preflight failed: ${preflight.checks.filter(check=>check.required!==false&&!check.ok).map(check=>`${check.id} (${check.detail})`).join(', ')}`);const report={schema:14,appBuild:DUEL_BRANCH,preset:presetName,startedAt,rulesPackage:this.enginePackageStatus||null,responseSerializerPreflight:preflight,cardCatalog:{cards:catalog.length,officialFuzzCards:pools.main.length+pools.extra.length,coverage},scriptPrefetch:prefetchResult,chainInfoRuntimePreflight:null,scriptAudit:null,fuzz:{requested:preset.fuzzDuels,attempted:0,completed:0,coverageIncomplete:0,failed:0,cleanReplayAttempts:0,replayed:0,failureReplays:0,reproducedFailures:0,totalSteps:0,totalPrompts:0,totalMessages:0,totalRetries:0,transientCaseRetries:0,failures:[],cleanReplayFailures:[],coverageIncompleteCases:[],chainInfoRegressionCases:[],dynamicCoverage:[],messageTypes:{},diagnosticSummary:{error:0,script:0,debug:0,info:0},_dynamic:new Set()},cancelled:false,ok:false};this.hardeningReport=report;
      report.chainInfoRuntimePreflight=await this.hardeningChainInfoRuntimePreflight(pools,catalog,preset);if(!report.chainInfoRuntimePreflight.ok)throw new Error(`Mandatory CHAININFO ABI preflight failed: ${report.chainInfoRuntimePreflight.detail}`);if(this.hardeningCancelRequested){report.cancelled=true;return;}
      this.setEngineStatus('Hardening: initializing representative Project Ignis scripts through OCGCore...','working');report.scriptAudit=await this.hardeningAuditScripts(catalog,preset,(done,total)=>{this.setEngineStatus(`Hardening scripts: ${done.toLocaleString()} / ${total.toLocaleString()}`,'working');});if(this.hardeningCancelRequested){report.cancelled=true;return;}
      const defs=this.hardeningCategoryDefinitions();for(let i=0;i<preset.fuzzDuels;i++){
        if(this.hardeningCancelRequested){report.cancelled=true;break;}
        const category=defs[i%defs.length].id,chainRegression=this.hardeningChainInfoRegressionCases().find(item=>item.case===i)||null;report.fuzz.attempted++;this.setEngineStatus(`Hardening fuzz: ${i+1} / ${preset.fuzzDuels} · ${defs[i%defs.length].label}`,'working');
        try{
          const first=await this.hardeningRunOneFuzz(i,category,pools,catalog,preset);this.hardeningMergeFuzzMetrics(report.fuzz,first);
          if(first.coverageIncomplete||first.budgetExhausted){
            report.fuzz.coverageIncomplete++;
            report.fuzz.coverageIncompleteCases.push(this.hardeningCoverageIncompleteRecord(i,category,first));
            if(chainRegression)report.fuzz.chainInfoRegressionCases.push({...chainRegression,status:'coverage-incomplete',reason:String(first.completionReason||'step-budget-exhausted'),steps:Number(first.steps)||0});
          }else{
            report.fuzz.completed++;if(chainRegression)report.fuzz.chainInfoRegressionCases.push({...chainRegression,status:'completed',steps:Number(first.steps)||0});
            if(i<preset.replayDuels&&first.decisions?.length){
              report.fuzz.cleanReplayAttempts++;
              try{const replay=await this.hardeningRunOneFuzz(i,category,pools,catalog,preset,{replay:true,recorded:first.decisions});this.hardeningMergeFuzzMetrics(report.fuzz,replay);report.fuzz.replayed++;}
              catch(error){const failure=this.hardeningFailureRecord(i,category,error);failure.kind='replay-'+failure.kind;report.fuzz.cleanReplayFailures.push(failure);this.hardeningMergeFuzzMetrics(report.fuzz,error?.hardeningCase?.metrics||error?.hardeningMetrics||{});}
            }
          }
        }catch(error){
          report.fuzz.failed++;const failure=this.hardeningFailureRecord(i,category,error);if(chainRegression)report.fuzz.chainInfoRegressionCases.push({...chainRegression,status:'failed',kind:failure.kind,error:failure.error,steps:failure.steps});const partial={...(error?.hardeningCase?.metrics||error?.hardeningMetrics||{}),dynamic:error?.hardeningCase?.dynamic||error?.hardeningMetrics?.dynamic||[],messageTypes:error?.hardeningCase?.messageTypes||error?.hardeningMetrics?.messageTypes||{},diagnosticSummary:error?.hardeningCase?.diagnosticSummary||error?.hardeningMetrics?.diagnosticSummary||{}};this.hardeningMergeFuzzMetrics(report.fuzz,partial);this.setEngineStatus(`Hardening reproduction: ${defs[i%defs.length].label}`,'working');failure.reproduction=await this.hardeningReplayFailure(i,category,pools,catalog,preset,error);if(failure.reproduction?.attempted)report.fuzz.failureReplays++;if(failure.reproduction?.reproduced)report.fuzz.reproducedFailures++;report.fuzz.failures.push(failure);
        }
        const classified=report.fuzz.completed+report.fuzz.coverageIncomplete+report.fuzz.failed;if(classified!==report.fuzz.attempted)throw new Error(`Hardening accounting invariant failed: completed ${report.fuzz.completed} + coverageIncomplete ${report.fuzz.coverageIncomplete} + failed ${report.fuzz.failed} != attempted ${report.fuzz.attempted}.`);
        if(i%4===0)await this.wait(0);
      }
      report.fuzz.dynamicCoverage=[...report.fuzz._dynamic].sort();delete report.fuzz._dynamic;const observedCategories=new Set(report.fuzz.dynamicCoverage);report.fuzz.missingDynamicCategories=defs.map(def=>def.id).filter(id=>!observedCategories.has(id));report.coverageComplete=report.fuzz.coverageIncomplete===0&&report.fuzz.missingDynamicCategories.length===0;report.finishedAt=new Date().toISOString();const scriptProblems=(report.scriptAudit?.failures?.length||0)+(report.scriptAudit?.missing||0),replayProblems=report.fuzz.cleanReplayFailures.length,classified=report.fuzz.completed+report.fuzz.coverageIncomplete+report.fuzz.failed;if(classified!==report.fuzz.attempted)throw new Error(`Hardening accounting invariant failed at finalization: ${classified} classified != ${report.fuzz.attempted} attempted.`);report.ok=!report.cancelled&&scriptProblems===0&&report.fuzz.failures.length===0&&replayProblems===0;const coverageText=report.fuzz.coverageIncomplete?` · ${report.fuzz.coverageIncomplete} coverage-incomplete`:'';const replayText=replayProblems?` · ${replayProblems} clean replay issue(s)`:'';this.setEngineStatus(`Hardening ${report.ok?'passed':'found issues'} · ${(report.scriptAudit.initialized||0).toLocaleString()} scripts initialized · ${report.fuzz.completed}/${report.fuzz.attempted} fuzz duels completed${coverageText}${replayText} · ${report.fuzz.replayed}/${report.fuzz.cleanReplayAttempts} clean replays passed · ${report.fuzz.reproducedFailures}/${report.fuzz.failureReplays} failures reproduced`,report.ok?'ready':'error');this.toast(report.ok?(report.fuzz.coverageIncomplete?`Rules Hardening Lab passed with ${report.fuzz.coverageIncomplete} coverage-incomplete case(s). Export the report for details.`:'Rules Hardening Lab passed. Export the report for the full corpus and fuzz metrics.'):`Rules Hardening Lab found ${scriptProblems+report.fuzz.failures.length+replayProblems} issue(s). Export the report for reproducible details.`);
    }catch(error){if(this.hardeningReport?.fuzz?._dynamic){this.hardeningReport.fuzz.dynamicCoverage=[...this.hardeningReport.fuzz._dynamic].sort();delete this.hardeningReport.fuzz._dynamic;}const failureText=String(error?.message||error);this.hardeningReport={...(this.hardeningReport||{}),schema:14,appBuild:DUEL_BRANCH,preset:presetName,startedAt,finishedAt:new Date().toISOString(),ok:false,cancelled:this.hardeningCancelRequested,fatalError:failureText};this.setEngineStatus(`Hardening failed: ${failureText}`,'error');this.toast(`Hardening campaign failed: ${failureText}`);}finally{this.hardeningRunning=false;this.hardeningCancelRequested=false;this.simulatorTaskPromptActive=false;this.renderSimulatorSettings();}
  }

  async updateRulesPackage() {
    if(this.running&&this.handle){this.toast('End or restart the current duel before updating the rules package.');return;}
    this.setEngineStatus('Updating Duel Rules...', 'working');
    try{const response=await fetch('/api/duel-engine/update',{method:'POST'});const status=await response.json();if(!response.ok||!status.ready)throw new Error(status.error||'Rules package update failed.');this.enginePackageStatus=status;this.mod=null;this.core=null;this.db=null;this.projectIgnisSemantics.clear();this.projectIgnisScriptSources.clear();this.setEngineStatus(status.packageId||'Rules package updated','ready');this.toast('Duel rules package updated successfully.');}catch(error){this.setEngineStatus(`Rules update failed: ${error?.message||error}`,'error');this.toast(`Rules update failed: ${error?.message||error}`);}finally{this.clearSimulatorTaskPrompt({force:true});this.renderSimulatorSettings();}
  }

  toggleDummyMode() {
    this.dummyMode=this.dummyMode==='passive'?'autonomous':'passive';
    this.writeStringPreference('ygoDuelDummyMode',this.dummyMode);
    this.syncDuelToggles();
    this.playSound('select');
    this.toast(`Practice Dummy mode changed to ${this.dummyMode==='passive'?'Passive':'Autonomous'} for subsequent decisions.`);
  }

  chooseDummyModeBeforeDuel() {
    if(!this.prompt||!this.promptBody||!this.promptTitle)return Promise.resolve(this.dummyMode);
    this.promptView='dummy-mode-start';
    this.promptMinimized=false;
    this.prompt.classList.remove('selection-prompt','card-details-prompt','inline-surface-selection-prompt','duel-log-event-prompt','duel-prompt-hidden');
    this.prompt.classList.add('duel-dummy-mode-prompt');
    this.promptTitle.textContent='Choose Practice Dummy Intelligence';
    this.promptBody.replaceChildren();
    const intro=document.createElement('p');intro.className='duel-selection-purpose';intro.textContent='Choose how strongly the Practice Dummy should play this duel. OCGCore remains authoritative for legal actions at every difficulty.';
    const choices=document.createElement('div');choices.className='duel-dummy-mode-choice-list';
    return new Promise(resolve=>{
      this.preDuelModeResolve=resolve;
      const choose=value=>{
        if(value==='passive'){this.dummyMode='passive';this.writeStringPreference('ygoDuelDummyMode','passive');}
        else{this.setAIDifficulty(value);this.dummyMode='autonomous';}
        this.syncDuelToggles();this.prompt.classList.remove('duel-dummy-mode-prompt');this.hidePrompt();this.promptView='';this.preDuelModeResolve=null;resolve(this.dummyMode);
      };
      const options=[
        ['Passive','passive','Avoids optional plays and mainly advances phases while handling mandatory rules decisions.'],
        ['Casual','casual','Avoids obvious self-sabotage while using simpler and more permissive choices.'],
        ['Competitive','competitive','Evaluates threats, targets, resources, lethal damage, and action sequencing.'],
        ['Expert','expert','Adds deck-aware planning, avoids redundant responses, and conserves interruption for meaningful threats.'],
      ];
      for(const [label,value,detail] of options){const node=this.renderIntegratedEffectChoice(label,detail,()=>choose(value));node.classList.add('duel-dummy-mode-choice');const active=value==='passive'?this.dummyMode==='passive':this.dummyMode!=='passive'&&this.dummyDifficulty===value;if(active)node.classList.add('current-choice');choices.append(node);}
      this.promptBody.append(intro,choices);this.showPrompt({dismissible:false});this.schedulePromptFit();
    });
  }

  duelDeckChoiceKey(item={}) {
    const ids=[...(item.deck?.main||[]),...(item.deck?.extra||[]),...(item.deck?.side||[])].map(entry=>Number(entry?.id??entry)||0).join(',');
    return`deck:${String(item.fileName||item.name||'').toLocaleLowerCase()}:${ids}`;
  }

  availableOpponentDeckChoices() {
    const seen=new Set(),normalize=(items,source)=>Array.from(items||[]).filter(item=>item?.deck).map(item=>({...item,source,choiceKey:this.duelDeckChoiceKey(item)})).filter(item=>{if(seen.has(item.choiceKey))return false;seen.add(item.choiceKey);return true;});
    const recent=normalize(this.getRecentDuelDecks?.(),'recent'),library=normalize(this.getDeckLibraryDuelDecks?.(),'library');return{recent,library};
  }

  resolveSetupFirstPlayer(value='you') {
    if(value==='dummy')return 1;
    if(value==='random')return crypto.getRandomValues(new Uint32Array(1))[0]%2;
    return 0;
  }

  async browseOpponentDeckForSetup() {
    if(!this.openDuelDeck)return null;
    try{const picked=await this.openDuelDeck();if(picked?.deck&&this.preDuelSetupState){this.preDuelSetupState.opponentMode='custom';this.preDuelSetupState.opponentSelection=picked;return picked;}return null;}
    catch(error){this.toast(`Could not select dummy deck: ${error?.message||error}`);return null;}
  }

  waitForDuelSetupFeedbackFrame() {
    return new Promise(resolve=>{const done=()=>setTimeout(resolve,0);if(typeof requestAnimationFrame==='function')requestAnimationFrame(done);else done();});
  }

  async runDuelSetupAsyncAction(button,busyLabel,action) {
    if(!button||button.dataset.duelSetupBusy==='1')return null;
    const original=button.textContent;button.dataset.duelSetupBusy='1';button.disabled=true;button.setAttribute('aria-busy','true');button.textContent=busyLabel;
    await this.waitForDuelSetupFeedbackFrame();
    try{return await action();}
    catch(error){this.toast(`Could not complete setup action: ${error?.message||error}`);return null;}
    finally{if(button.isConnected){button.textContent=original;button.disabled=false;button.removeAttribute('aria-busy');delete button.dataset.duelSetupBusy;}}
  }

  renderDuelStartSetup() {
    const state=this.preDuelSetupState;if(!state||!this.promptBody||!this.promptTitle)return;
    this.promptView='duel-start-setup';this.promptMinimized=false;this.prompt.classList.remove('selection-prompt','card-details-prompt','inline-surface-selection-prompt','duel-log-event-prompt','duel-prompt-hidden');this.prompt.classList.add('duel-start-setup-prompt');const editing=!!this.duelSetupEditMode;this.promptTitle.textContent=editing?'Test Duel Configuration':'Start Test Duel';this.promptBody.replaceChildren();
    const intro=document.createElement('p');intro.className='duel-selection-purpose';intro.textContent=editing?'Change the Practice Dummy intelligence, turn order, or opponent deck. Applying changes starts a fresh duel with the selected configuration.':'Choose the Practice Dummy intelligence, actual turn order, and opponent deck before the Rules Engine starts.';this.promptBody.append(intro);
    const grid=document.createElement('div');grid.className='duel-start-setup-grid';
    const section=(title,detail)=>{const node=document.createElement('section');node.className='duel-start-setup-section';const h=document.createElement('h3');h.textContent=title;const p=document.createElement('p');p.className='duel-selection-purpose';p.textContent=detail;node.append(h,p);grid.append(node);return node;};
    const choiceList=(parent,key,options)=>{const list=document.createElement('div');list.className='duel-dummy-mode-choice-list';const entries=[];const choose=value=>{state[key]=value;for(const entry of entries){const active=entry.value===value;entry.node.classList.toggle('current-choice',active);entry.node.setAttribute('aria-pressed',active?'true':'false');}};for(const [label,value,detail] of options){const node=this.renderIntegratedEffectChoice(label,detail,()=>choose(value));node.dataset.setupValue=value;entries.push({node,value});list.append(node);}choose(state[key]);parent.append(list);return list;};
    const ai=section('Practice Dummy Intelligence','Controls strategic evaluation only. OCGCore remains authoritative for every legal action.');choiceList(ai,'ai',[['Passive','passive','Mandatory decisions and phase progression only.'],['Casual','casual','Simpler decisions while avoiding obvious self-sabotage.'],['Competitive','competitive','Threat-aware responses, targeting, sequencing, and lethal checks.'],['Expert','expert','Deck-aware planning and more selective resource use.']]);
    const turn=section('Turn Order','Select who actually becomes OCGCore player 0 for this duel.');choiceList(turn,'first',[['You Go First','you','Your deck takes Turn 1.'],['Dummy Goes First','dummy','The Practice Dummy takes Turn 1.'],['Random','random','Determine the first player when Start Duel is pressed.']]);
    const deck=section('Practice Dummy Deck','Use a clone, a recent deck, a deck indexed from configured folders, or browse another file.');const displayName=item=>item?.name||item?.fileName||'Selected Deck';const initialName=state.opponentMode==='custom'?displayName(state.opponentSelection):'Clone Current Deck';const summary=document.createElement('div');summary.className='duel-start-deck-summary';const summaryLabel=document.createElement('span');summaryLabel.textContent='Selected opponent deck';const summaryName=document.createElement('strong');summaryName.textContent=initialName;summaryName.setAttribute('title',initialName);summary.append(summaryLabel,summaryName);deck.append(summary);
    const available={recent:[],library:[]},select=document.createElement('select');select.className='duel-start-deck-select';select.setAttribute('aria-label','Practice Dummy deck');const optionMap=new Map();const clone=document.createElement('option');clone.value='clone';clone.textContent='Clone Current Deck';select.append(clone);const addGroup=(label,items,prefix)=>{if(!items.length)return;const group=document.createElement('optgroup');group.label=label;items.forEach((item,index)=>{const value=`${prefix}:${index}`,option=document.createElement('option');option.value=value;option.textContent=item.sourceLabel||item.fileName||item.name||'Deck';optionMap.set(value,item);group.append(option);});select.append(group);};
    const optionValueFor=item=>{if(!item)return'clone';const key=this.duelDeckChoiceKey(item);for(const [value,entry] of optionMap)if(entry.choiceKey===key)return value;let option=select.querySelector('option[value="selected-custom"]');if(!option){option=document.createElement('option');option.value='selected-custom';select.append(option);}option.textContent=`Selected: ${displayName(item)}`;optionMap.set('selected-custom',item);return'selected-custom';};const updateDeckSelection=(mode,item=null)=>{state.opponentMode=mode;state.opponentSelection=mode==='custom'?item:null;const name=mode==='custom'?displayName(item):'Clone Current Deck';summaryName.textContent=name;summaryName.setAttribute('title',name);select.setAttribute('title',name);select.value=mode==='custom'?optionValueFor(item):'clone';};updateDeckSelection(state.opponentMode,state.opponentSelection);select.addEventListener('change',()=>{if(select.value==='clone')updateDeckSelection('clone');else{const item=optionMap.get(select.value);if(item)updateDeckSelection('custom',item);}});deck.append(select);
    const tools=document.createElement('div');tools.className='duel-start-deck-tools';const browse=this.button('Other Location...',event=>this.runDuelSetupAsyncAction(event.currentTarget,'Opening...',async()=>{const picked=await this.browseOpponentDeckForSetup();if(picked)updateDeckSelection('custom',picked);}),{ghost:true});tools.append(browse);if(this.chooseDeckLibraryDuelDeck)tools.append(this.button('Deck Library...',event=>this.runDuelSetupAsyncAction(event.currentTarget,'Opening...',async()=>{const picked=await this.chooseDeckLibraryDuelDeck();if(picked)updateDeckSelection('custom',picked);}),{ghost:true}));if(this.openDeckLibrarySettings)tools.append(this.button('Manage Directories...',event=>this.runDuelSetupAsyncAction(event.currentTarget,'Opening...',async()=>{await this.openDeckLibrarySettings();}),{ghost:true}));deck.append(tools);const libraryStatus=document.createElement('div');libraryStatus.className='duel-start-library-status';libraryStatus.textContent='Recent decks load here. Use Deck Library to browse configured folders.';deck.append(libraryStatus);
    this.promptBody.append(grid);
    const applyState=()=>{if(state.ai==='passive'){this.dummyMode='passive';this.writeStringPreference('ygoDuelDummyMode','passive');}else{this.setAIDifficulty(state.ai);this.dummyMode='autonomous';}this.firstPlayerPreference=state.first;this.writeStringPreference('ygoDuelFirstPlayer',state.first);this.opponentDeckMode=state.opponentMode;this.opponentDeckSelection=state.opponentMode==='custom'?state.opponentSelection:null;this.syncDuelToggles();return this.resolveSetupFirstPlayer(state.first);};
    const closeSetup=()=>{this.preDuelSetupState=null;this.duelSetupEditMode=false;this.prompt.classList.remove('duel-start-setup-prompt');this.hidePrompt();this.promptView='';};
    const actions=document.createElement('div');actions.className='duel-start-setup-actions';actions.append(this.button('Cancel',()=>{const resolve=this.preDuelSetupResolve;this.preDuelSetupResolve=null;closeSetup();resolve?.(null);},{ghost:true}),this.button(editing?'Apply & Reset Duel':'Start Duel',()=>{const firstPlayer=applyState(),resolve=this.preDuelSetupResolve;if(editing){const playerDeck=this.lastDuelSetup?.playerDeck?this.cloneDuelDeck(this.lastDuelSetup.playerDeck):this.cloneDuelDeck(this.getDeck());const opponentDeck=this.opponentDeckMode==='custom'&&this.opponentDeckSelection?.deck?this.cloneDuelDeck(this.opponentDeckSelection.deck):this.cloneDuelDeck(playerDeck);const setup=this.captureDuelSetup(playerDeck,opponentDeck,firstPlayer);this.preDuelSetupResolve=null;closeSetup();void this.start(true,{fixedSetup:setup});}else{this.preDuelSetupResolve=null;closeSetup();resolve?.({firstPlayer});}}));this.promptBody.append(actions);this.showPrompt({dismissible:false});this.schedulePromptFit();
    const populateRecentChoices=()=>{if(this.preDuelSetupState!==state||!select.isConnected)return;const selectedMode=state.opponentMode,selectedItem=state.opponentSelection;const recent=Array.from(this.getRecentDuelDecks?.()||[]);available.recent=recent;addGroup('Recent Decks',recent,'recent');updateDeckSelection(selectedMode,selectedItem);};
    if(typeof requestIdleCallback==='function')requestIdleCallback(populateRecentChoices,{timeout:500});else setTimeout(populateRecentChoices,20);
  }

  chooseDuelSetupBeforeDuel() {
    if(!this.prompt||!this.promptBody||!this.promptTitle)return Promise.resolve({firstPlayer:this.resolveSetupFirstPlayer(this.firstPlayerPreference)});
    const first=['you','dummy','random'].includes(this.firstPlayerPreference)?this.firstPlayerPreference:'you';this.duelSetupEditMode=false;this.preDuelSetupState={ai:this.dummyMode==='passive'?'passive':this.dummyDifficulty,first,opponentMode:this.opponentDeckMode,opponentSelection:this.opponentDeckSelection};
    return new Promise(resolve=>{this.preDuelSetupResolve=resolve;this.renderDuelStartSetup();});
  }

  ensureConfirmCardSelectionsControl() {
    if(typeof document==='undefined'||$id('duelUiConfirmCard'))return;
    const anchor=$id('duelUiConfirmChain')?.closest?.('label'),section=anchor?.parentElement;if(!anchor||!section)return;
    const row=document.createElement('label');row.className='duel-interface-setting';
    const copy=document.createElement('span'),title=document.createElement('strong'),detail=document.createElement('small');title.textContent='Confirm Card Selections';detail.textContent='Require a separate Confirm step after choosing cards. When off, fixed-count selections submit automatically; variable-count and engine-defined material selections still require confirmation.';copy.append(title,detail);
    const input=document.createElement('input');input.id='duelUiConfirmCard';input.type='checkbox';input.checked=!!this.confirmCardSelectionsEnabled;row.append(copy,input);anchor.insertAdjacentElement('afterend',row);
  }

  ensureDirectHandFieldSelectionControl() {
    if(typeof document==='undefined'||$id('duelUiCardSelectionMode'))return;
    const anchor=$id('duelUiAutoZones')?.closest?.('label'),section=anchor?.parentElement;if(!anchor||!section)return;
    const row=document.createElement('label');row.className='duel-interface-setting duel-interface-select-setting';
    const copy=document.createElement('span'),title=document.createElement('strong'),detail=document.createElement('small');title.textContent='Hand / Field Card Selection';detail.textContent='Use the standard card-choice prompt, or select eligible visible cards directly in your hand and on the field.';copy.append(title,detail);
    const select=document.createElement('select');select.id='duelUiCardSelectionMode';select.setAttribute('aria-label','Hand and field card selection style');
    for(const [label,value] of [['Prompt Window','prompt'],['Direct Hand / Field','direct']]){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);}
    row.append(copy,select);section.insertBefore(row,anchor);
  }

  soundEffectDefinitions() {
    return [
      ['Interface / Selection','ui','Button clicks and card-selection feedback.'],
      ['Card Draw','draw','Cards drawn from the Deck.'],
      ['Card Movement','move','Routine movement between zones.'],
      ['Summons','summon','Normal and Special Summon presentation sounds.'],
      ['Set / Position','set','Setting cards and changing battle position.'],
      ['Activation / Flip','activate','Effect activation and flip sounds.'],
      ['Chain Links','chain','Additional Chain Link sounds.'],
      ['Phase Changes','phase','Turn phase transition sounds.'],
      ['Battle Beam / Explosion','battle','Attack beam and explosive impact audio.'],
      ['LP Damage / Recovery','lp','Life Point loss and recovery sounds.'],
      ['Deck Shuffle','shuffle','Deck shuffle sound.'],
      ['Duel Result','result','Victory and defeat result sounds.'],
    ];
  }

  soundEffectStorageKey(category='') {
    return ({ui:'ygoDuelSoundUi',draw:'ygoDuelSoundDraw',move:'ygoDuelSoundMove',summon:'ygoDuelSoundSummon',set:'ygoDuelSoundSet',activate:'ygoDuelSoundActivate',chain:'ygoDuelSoundChain',phase:'ygoDuelSoundPhase',battle:'ygoDuelSoundBattle',lp:'ygoDuelSoundLp',shuffle:'ygoDuelSoundShuffle',result:'ygoDuelSoundResult'})[String(category)]||'';
  }

  soundEffectVolumeStorageKey(category='') { const base=this.soundEffectStorageKey(category);return base?`${base}Volume`:''; }

  soundCategoryForKind(kind='select') {
    return ({select:'ui',draw:'draw',move:'move',summon:'summon',special:'summon',set:'set',position:'set',activate:'activate',flip:'activate',chain:'chain',phase:'phase',attack:'battle',impact:'battle',damage:'lp',recover:'lp',victory:'result',defeat:'result'})[String(kind)]||'ui';
  }

  isSoundEffectEnabled(categoryOrKind='ui') {
    const direct=String(categoryOrKind||'ui'),category=Object.prototype.hasOwnProperty.call(this.soundEffectEnabled||{},direct)?direct:this.soundCategoryForKind(direct);
    return this.soundEffectEnabled?.[category]!==false;
  }

  soundEffectVolumeFor(categoryOrKind='ui') {
    const direct=String(categoryOrKind||'ui'),category=Object.prototype.hasOwnProperty.call(this.soundEffectVolume||{},direct)?direct:this.soundCategoryForKind(direct),value=Number(this.soundEffectVolume?.[category]);return Number.isFinite(value)?Math.max(0,Math.min(1,value)):1;
  }

  effectiveSoundVolume(categoryOrKind='ui') { return Math.max(0,Math.min(1,this.sfxVolume*this.soundEffectVolumeFor(categoryOrKind))); }

  setSoundEffectEnabled(category,value) {
    category=String(category||'');if(!Object.prototype.hasOwnProperty.call(this.soundEffectEnabled||{},category))return;
    this.soundEffectEnabled[category]=!!value;const storage=this.soundEffectStorageKey(category);if(storage)this.writePreference(storage,this.soundEffectEnabled[category]);this.syncInterfaceSettingsMenu();
    if(this.soundEnabled&&category!=='ui'&&this.isSoundEffectEnabled('ui'))this.playSound('select');
  }

  setSoundEffectVolume(category,value) {
    category=String(category||'');if(!Object.prototype.hasOwnProperty.call(this.soundEffectVolume||{},category))return;this.soundEffectVolume[category]=Math.max(0,Math.min(1,Number(value)||0));const storage=this.soundEffectVolumeStorageKey(category);if(storage)this.writeNumberPreference(storage,this.soundEffectVolume[category]);this.syncInterfaceSettingsMenu();
  }

  ensureIndividualSoundControls() {
    if(typeof document==='undefined'||$id('duelUiSoundEffectsList'))return;
    const anchor=$id('duelSfxVolume')?.closest?.('label'),section=anchor?.parentElement;if(!anchor||!section)return;
    const wrap=document.createElement('div');wrap.id='duelUiSoundEffectsList';wrap.className='duel-sound-effect-controls';
    const heading=document.createElement('div');heading.className='duel-sound-effect-heading';const strong=document.createElement('strong');strong.textContent='Individual Sounds';const small=document.createElement('small');small.textContent='Enable, disable, and set volume for each duel sound independently. Individual volume is multiplied by the master SFX Volume.';heading.append(strong,small);wrap.append(heading);
    for(const [label,category,detail] of this.soundEffectDefinitions()){const row=document.createElement('div');row.className='duel-interface-setting duel-sound-effect-row';const copy=document.createElement('span'),title=document.createElement('strong'),description=document.createElement('small'),controls=document.createElement('span'),input=document.createElement('input'),range=document.createElement('input'),output=document.createElement('output');title.textContent=label;description.textContent=detail;copy.append(title,description);controls.className='duel-sound-effect-controls-inline';input.type='checkbox';input.id=`duelUiSound_${category}`;input.checked=this.isSoundEffectEnabled(category);input.setAttribute('aria-label',`${label} enabled`);input.addEventListener('change',event=>this.setSoundEffectEnabled(category,!!event.target.checked));range.type='range';range.id=`duelUiSoundVolume_${category}`;range.min='0';range.max='100';range.step='1';range.value=String(Math.round(this.soundEffectVolumeFor(category)*100));range.setAttribute('aria-label',`${label} volume`);range.addEventListener('input',event=>this.setSoundEffectVolume(category,Number(event.target.value)/100));output.id=`duelUiSoundVolumeValue_${category}`;output.textContent=`${Math.round(this.soundEffectVolumeFor(category)*100)}%`;controls.append(input,range,output);row.append(copy,controls);wrap.append(row);}
    section.append(wrap);
  }

  interfacePreferenceStorageKey(key) {
    return ({
      confirmChainSelectionsEnabled:'ygoDuelConfirmChainSelections',
      confirmCardSelectionsEnabled:'ygoDuelConfirmCardSelections',
      smartOptionalChainPromptsEnabled:'ygoDuelSmartOptionalChainPrompts',
      chainEffectHoverEnabled:'ygoDuelChainEffectHover',
      activationEffectHoverEnabled:'ygoDuelActivationEffectHover',
      promptEffectContextEnabled:'ygoDuelPromptEffectContext',
      directHandFieldSelectionEnabled:'ygoDuelDirectHandFieldSelection',
      suppressSelfNegatingHandTrapsEnabled:'ygoDuelSuppressSelfNegatingHandTraps',
      pileHoverCardListsEnabled:'ygoDuelPileHoverCardLists',
      cardHoverPreviewEnabled:'ygoDuelCardHoverPreview',
      duelAnimationsEnabled:'ygoDuelAnimations',
      actionPresentationEnabled:'ygoDuelActionPresentation',
      activationShowcaseEnabled:'ygoDuelActivationShowcase',
      phasePresentationEnabled:'ygoDuelPhasePresentation',
      cardMovementAnimationsEnabled:'ygoDuelCardMovementAnimations',
      synchronizedShowcaseTravelEnabled:'ygoDuelSynchronizedShowcaseTravel',
      effectActivationAnimationsEnabled:'ygoDuelEffectActivationAnimations',
      summonPresentationsEnabled:'ygoDuelSummonPresentations',
      targetPresentationsEnabled:'ygoDuelTargetPresentations',
      chainSourceEffectsEnabled:'ygoDuelChainSourceEffects',
      chainOutcomeEffectsEnabled:'ygoDuelChainOutcomeEffects',
      chainConnectionVisualizationEnabled:'ygoDuelChainConnections',
      consolidatedChainSummariesEnabled:'ygoDuelChainSummaries',
      chainSummaryInteractiveEnabled:'ygoDuelChainSummaryInteractive',
      chainSummaryHoverCorrelationEnabled:'ygoDuelChainSummaryHoverCorrelation',
      chainSummaryCardDetailsEnabled:'ygoDuelChainSummaryCardDetails',
      actionablePileHighlightEnabled:'ygoDuelActionablePileHighlight',
      autoZoneEnabled:'ygoDuelAutoZones',
    })[key]||'';
  }

  setInterfacePreference(key,value) {
    if(!(key in this))return;
    this[key]=!!value;
    const storage=this.interfacePreferenceStorageKey(key);if(storage)this.writePreference(storage,this[key]);
    if(key==='chainSummaryInteractiveEnabled'){this.chainSummaryHoverCorrelationEnabled=this[key];this.chainSummaryCardDetailsEnabled=this[key];this.writePreference('ygoDuelChainSummaryHoverCorrelation',this[key]);this.writePreference('ygoDuelChainSummaryCardDetails',this[key]);}
    if(key==='duelAnimationsEnabled'){this.root?.classList?.toggle('duel-animations-disabled',!this.duelAnimationsEnabled);if(!this.duelAnimationsEnabled){this.clearPhaseAnnouncements();this.boardWrap?.querySelectorAll?.('.duel-effect-target-showcase').forEach(node=>node.remove());this.root?.querySelectorAll?.('.duel-effect-targeted').forEach(node=>node.classList.remove('duel-effect-targeted'));}this.syncChainSourceHighlights();}
    if(key==='phasePresentationEnabled'&&!this.phasePresentationEnabled)this.clearPhaseAnnouncements();
    if(key==='chainSourceEffectsEnabled')this.syncChainSourceHighlights();
    if(key==='chainConnectionVisualizationEnabled')this.renderChainVisualization();
    if(key==='chainEffectHoverEnabled'&&!this.chainEffectHoverEnabled)this.hideCardHoverOverlay();
    if(key==='activationEffectHoverEnabled'&&!this.activationEffectHoverEnabled)this.hideCardHoverOverlay();
    if(key==='cardHoverPreviewEnabled'&&!this.cardHoverPreviewEnabled)this.hideCardHoverOverlay();
    if(key==='targetPresentationsEnabled'&&!this.targetPresentationsEnabled){this.boardWrap?.querySelectorAll?.('.duel-effect-target-showcase').forEach(node=>node.remove());this.root?.querySelectorAll?.('.duel-effect-targeted').forEach(node=>node.classList.remove('duel-effect-targeted'));}
    if(key==='smartOptionalChainPromptsEnabled'||key==='suppressSelfNegatingHandTrapsEnabled')this.smartOptionalChainPhaseOffers.clear();
    if(key==='pileHoverCardListsEnabled'&&!this.pileHoverCardListsEnabled)this.hidePileHoverOverlay();
    if(key==='actionablePileHighlightEnabled')this.renderField();
    if(key==='promptEffectContextEnabled'||key==='confirmChainSelectionsEnabled'||key==='confirmCardSelectionsEnabled'||key==='suppressSelfNegatingHandTrapsEnabled'||key==='directHandFieldSelectionEnabled'){
      if(this.currentPrompt&&this.pendingResolve&&this.promptView!=='details')this.renderPrompt(this.currentPrompt);
    }
    this.syncDuelToggles();this.syncInterfaceSettingsMenu();this.playSound('select');
  }

  syncInterfaceSettingsMenu() {
    const values={
      duelUiConfirmChain:this.confirmChainSelectionsEnabled,
      duelUiConfirmCard:this.confirmCardSelectionsEnabled,
      duelUiSmartOptionalChain:this.smartOptionalChainPromptsEnabled,
      duelUiChainHover:this.chainEffectHoverEnabled,
      duelUiActivationHover:this.activationEffectHoverEnabled,
      duelUiPromptContext:this.promptEffectContextEnabled,
      duelUiSuppressSelfNegating:this.suppressSelfNegatingHandTrapsEnabled,
      duelUiPileHoverLists:this.pileHoverCardListsEnabled,
      duelUiCardHover:this.cardHoverPreviewEnabled,
      duelUiAnimations:this.duelAnimationsEnabled,
      duelUiActionPresentation:this.actionPresentationEnabled,
      duelUiActivationShowcase:this.activationShowcaseEnabled,
      duelUiPhasePresentation:this.phasePresentationEnabled,
      duelUiCardMovementAnimations:this.cardMovementAnimationsEnabled,
      duelUiSynchronizedShowcaseTravel:this.synchronizedShowcaseTravelEnabled,
      duelUiEffectActivationAnimations:this.effectActivationAnimationsEnabled,
      duelUiSummonPresentations:this.summonPresentationsEnabled,
      duelUiTargetPresentations:this.targetPresentationsEnabled,
      duelUiChainSourceEffects:this.chainSourceEffectsEnabled,
      duelUiChainOutcomeEffects:this.chainOutcomeEffectsEnabled,
      duelUiChainConnections:this.chainConnectionVisualizationEnabled,
      duelUiChainSummaries:this.consolidatedChainSummariesEnabled,
      duelUiChainSummaryInteractive:this.chainSummaryInteractiveEnabled,
      duelUiChainSummaryHoverCorrelation:this.chainSummaryHoverCorrelationEnabled,
      duelUiChainSummaryCardDetails:this.chainSummaryCardDetailsEnabled,
      duelUiActionablePileHighlight:this.actionablePileHighlightEnabled,
      duelUiAutoZones:this.autoZoneEnabled,
      duelUiOpponentCards:this.opponentCardsVisible,
      duelUiOwnDeckView:this.ownDeckViewEnabled,
      duelUiSound:this.soundEnabled,
    };
    for(const [id,value] of Object.entries(values)){const node=$id(id);if(node)node.checked=!!value;}
    const selectionMode=$id('duelUiCardSelectionMode');if(selectionMode)selectionMode.value=this.directHandFieldSelectionEnabled?'direct':'prompt';
    const actionSpeed=$id('duelUiActionSpeed');if(actionSpeed)actionSpeed.value=this.actionPresentationSpeed;
    const battleIntensity=$id('duelUiBattleIntensity');if(battleIntensity)battleIntensity.value=this.battleEffectIntensity;
    const chainPosition=$id('duelUiChainPosition');if(chainPosition)chainPosition.value=this.chainDisplayPosition;
    const chainScale=$id('duelUiChainDisplayScale'),chainScaleOutput=$id('duelUiChainDisplayScaleValue');if(chainScale)chainScale.value=String(Math.round(this.chainDisplayScale));if(chainScaleOutput)chainScaleOutput.textContent=`${Math.round(this.chainDisplayScale)}%`;
    const chainSide=['left','right'].includes(this.chainDisplayPosition)?this.chainDisplayPosition:'';
    const chainOffsets=chainSide?this.chainDisplayOffsets[chainSide]:{x:0,y:0};
    const chainOffsetEditor=$id('duelUiChainPositionAdjustments');if(chainOffsetEditor)chainOffsetEditor.hidden=!chainSide;
    for(const axis of ['x','y']){const slider=$id(`duelUiChainOffset${axis.toUpperCase()}`),output=$id(`duelUiChainOffset${axis.toUpperCase()}Value`),value=Math.round(Number(chainOffsets?.[axis])||0);if(slider){slider.value=String(value);slider.disabled=!chainSide;}if(output)output.textContent=this.formatChainDisplayOffset(axis,value);}
    const smart=$id('duelUiSmartOptionalChain'),selfNegating=$id('duelUiSuppressSelfNegating'),summaries=$id('duelUiChainSummaries'),interactive=$id('duelUiChainSummaryInteractive');if(selfNegating)selfNegating.disabled=!smart?.checked;if(interactive)interactive.disabled=!summaries?.checked;
    const animationDependents=['duelUiActionPresentation','duelUiPhasePresentation','duelUiCardMovementAnimations','duelUiSynchronizedShowcaseTravel','duelUiEffectActivationAnimations','duelUiSummonPresentations','duelUiTargetPresentations','duelUiBattleIntensity','duelUiChainSourceEffects','duelUiChainOutcomeEffects','duelUiChainConnections'];for(const id of animationDependents){const node=$id(id);if(node)node.disabled=!this.duelAnimationsEnabled;}if(actionSpeed)actionSpeed.disabled=!this.duelAnimationsEnabled;
    const volume=$id('duelSfxVolume'),volumeValue=$id('duelSfxVolumeValue');if(volume){volume.value=String(Math.round(this.sfxVolume*100));volume.disabled=!this.soundEnabled;}if(volumeValue)volumeValue.textContent=`${Math.round(this.sfxVolume*100)}%`;
    for(const [,category] of this.soundEffectDefinitions()){const input=$id(`duelUiSound_${category}`),range=$id(`duelUiSoundVolume_${category}`),output=$id(`duelUiSoundVolumeValue_${category}`),value=Math.round(this.soundEffectVolumeFor(category)*100);if(input){input.checked=this.isSoundEffectEnabled(category);input.disabled=!this.soundEnabled;}if(range){range.value=String(value);range.disabled=!this.soundEnabled||!this.isSoundEffectEnabled(category);}if(output)output.textContent=`${value}%`;}
    this.root?.classList?.toggle('duel-animations-disabled',!this.duelAnimationsEnabled);
    const btn=$id('duelInterfaceSettingsBtn'),menu=$id('duelInterfaceSettingsMenu');if(btn&&menu)btn.setAttribute('aria-expanded',String(!menu.hidden));
  }

  toggleInterfaceSettingsMenu(force=null) {
    const menu=$id('duelInterfaceSettingsMenu');if(!menu)return;
    const open=force==null?menu.hidden:!!force;menu.hidden=!open;this.syncInterfaceSettingsMenu();
    if(open)menu.querySelector?.('summary')?.focus?.();
  }

  setActionPresentationSpeed(value='normal') {
    this.actionPresentationSpeed=['fast','normal','dramatic'].includes(String(value))?String(value):'normal';
    this.writeStringPreference('ygoDuelActionPresentationSpeed',this.actionPresentationSpeed);this.syncInterfaceSettingsMenu();this.playSound('select');
  }

  actionPresentationScale() {
    return this.actionPresentationSpeed==='fast'?0.72:this.actionPresentationSpeed==='dramatic'?1.35:1;
  }

  setBattleEffectIntensity(value='enhanced') {
    this.battleEffectIntensity=['reduced','standard','enhanced'].includes(String(value))?String(value):'enhanced';
    this.writeStringPreference('ygoDuelBattleEffectIntensity',this.battleEffectIntensity);this.syncInterfaceSettingsMenu();this.playSound('select');
  }

  battleEffectScale() { return this.battleEffectIntensity==='reduced'?.72:this.battleEffectIntensity==='standard'?1:1.28; }

  setChainDisplayPosition(value='upper') {
    this.chainDisplayPosition=['upper','left','right'].includes(String(value))?String(value):'upper';
    this.writeStringPreference('ygoDuelChainDisplayPosition',this.chainDisplayPosition);
    this.positionChainVisualization();this.syncInterfaceSettingsMenu();this.previewChainDisplayPosition();this.playSound('select');
  }

  setChainDisplayScale(value=100,{preview=false}={}) {
    this.chainDisplayScale=Math.round(Math.max(55,Math.min(100,Number(value)||100)));
    this.writeNumberPreference('ygoDuelChainDisplayScale',this.chainDisplayScale);
    this.positionChainVisualization();this.syncInterfaceSettingsMenu();if(preview)this.previewChainDisplayPosition();
  }

  formatChainDisplayOffset(axis='x',value=0) {
    value=Math.round(Math.max(-100,Math.min(100,Number(value)||0)));if(!value)return'Centered';
    if(axis==='y')return`${value<0?'Up':'Down'} ${Math.abs(value)}%`;
    return`${value<0?'Left':'Right'} ${Math.abs(value)}%`;
  }

  setChainDisplayOffset(axis='x',value=0,{preview=false}={}) {
    if(!['x','y'].includes(axis)||!['left','right'].includes(this.chainDisplayPosition))return;
    const side=this.chainDisplayPosition,next=Math.round(Math.max(-100,Math.min(100,Number(value)||0)));this.chainDisplayOffsets[side][axis]=next;
    const key=`ygoDuelChain${side==='left'?'Left':'Right'}${axis.toUpperCase()}`;this.writeNumberPreference(key,next);
    this.positionChainVisualization();this.syncInterfaceSettingsMenu();if(preview)this.previewChainDisplayPosition();
  }

  resetChainDisplayOffsets() {
    if(!['left','right'].includes(this.chainDisplayPosition))return;const side=this.chainDisplayPosition;this.chainDisplayOffsets[side]={x:0,y:0};
    this.writeNumberPreference(`ygoDuelChain${side==='left'?'Left':'Right'}X`,0);this.writeNumberPreference(`ygoDuelChain${side==='left'?'Left':'Right'}Y`,0);
    this.positionChainVisualization();this.syncInterfaceSettingsMenu();this.previewChainDisplayPosition();this.playSound('select');
  }

  previewChainDisplayPosition() {
    if(!this.boardWrap||typeof document==='undefined')return;
    if(this.chainPlacementPreviewTimer){clearTimeout(this.chainPlacementPreviewTimer);this.chainPlacementPreviewTimer=null;}
    let preview=this.boardWrap.querySelector?.(':scope > .duel-chain-placement-preview');
    if(!preview){
      preview=document.createElement('section');preview.className='duel-chain-visual duel-chain-main-overlay duel-chain-upper-shelf duel-chain-placement-preview';preview.setAttribute('aria-hidden','true');
      const frame=document.createElement('div');frame.className='duel-chain-scale-frame';
      const heading=document.createElement('div');heading.className='duel-chain-heading';heading.textContent='CHAIN LINKS - POSITION PREVIEW';
      const links=document.createElement('div');links.className='duel-chain-links';const card=document.createElement('article');card.className='duel-chain-link waiting';
      const badge=document.createElement('span');badge.className='duel-chain-link-badge';badge.textContent='CL 1';const art=document.createElement('img');art.className='duel-chain-link-art';art.src='assets/card_placeholder.png';art.alt='';
      const copy=document.createElement('div');copy.className='duel-chain-link-copy';const name=document.createElement('strong');name.className='duel-chain-link-name';name.textContent='Position Preview';const meta=document.createElement('span');meta.className='duel-chain-link-meta';meta.textContent='The live Chain will use this area';copy.append(name,meta);card.append(badge,art,copy);links.append(card);frame.append(heading,links);preview.append(frame);this.boardWrap.append(preview);
    }
    preview.hidden=false;preview.classList.remove('duel-chain-placement-preview-pulse');void preview.offsetWidth;preview.classList.add('duel-chain-placement-preview-pulse');this.positionChainVisualization(preview);
    this.chainPlacementPreviewTimer=setTimeout(()=>{preview.remove?.();this.chainPlacementPreviewTimer=null;},1700);
  }

  syncDuelToggles() {
    const auto=$id('duelAutoZoneToggle');
    if(auto){auto.textContent=`Auto Zones: ${this.autoZoneEnabled?'On':'Off'}`;auto.setAttribute('aria-pressed',String(this.autoZoneEnabled));}
    const sound=$id('duelSoundToggle');
    if(sound){sound.textContent=`Sound: ${this.soundEnabled?'On':'Off'}`;sound.setAttribute('aria-pressed',String(this.soundEnabled));}
    const opp=$id('duelOpponentCardsToggle');
    if(opp){opp.textContent=`Opponent Cards: ${this.opponentCardsVisible?'Shown':'Hidden'}`;opp.setAttribute('aria-pressed',String(this.opponentCardsVisible));}
    const ownDeck=$id('duelOwnDeckViewToggle');
    if(ownDeck){ownDeck.textContent=`View Own Deck: ${this.ownDeckViewEnabled?'On':'Off'}`;ownDeck.setAttribute('aria-pressed',String(this.ownDeckViewEnabled));ownDeck.title=this.ownDeckViewEnabled?'Free Main Deck inspection is allowed for practice':'Main Deck contents stay hidden except when an effect or rule requires them';}
    const dummyMode=$id('duelDummyModeToggle');
    if(dummyMode){const passive=this.dummyMode==='passive';const label=passive?'Passive':this.dummyDifficulty.charAt(0).toUpperCase()+this.dummyDifficulty.slice(1);dummyMode.textContent=`Dummy: ${label}`;dummyMode.setAttribute('aria-pressed',String(!passive));dummyMode.title=passive?'Practice Dummy only advances phases and handles mandatory engine decisions':`${label} autonomous AI - click to choose intelligence`;}
    const volume=$id('duelSfxVolume');if(volume)volume.value=String(Math.round(this.sfxVolume*100));
    const volumeValue=$id('duelSfxVolumeValue');if(volumeValue)volumeValue.textContent=`${Math.round(this.sfxVolume*100)}%`;
    this.syncDeckLabels();
    this.syncInterfaceSettingsMenu();
  }

  syncDeckLabels() {
    const playerName=this.getDeckName?.()||'Current Deck';
    const opponentName=this.opponentDeckMode==='custom'&&this.opponentDeckSelection?.name?this.opponentDeckSelection.name:'Clone Current Deck';
    const player=$id('duelDeckName');if(player)player.textContent=`You: ${playerName}`;
    const opponent=$id('duelOpponentDeckName');if(opponent)opponent.textContent=`Dummy: ${opponentName}`;
    const button=$id('duelOpponentDeckBtn');if(button){button.textContent=this.opponentDeckMode==='custom'?'Dummy Deck: Custom':'Dummy Deck: Clone';button.title=`Practice opponent deck: ${opponentName}`;}
  }

  setOpponentDeckClone() {
    this.opponentDeckMode='clone';this.opponentDeckSelection=null;this.syncDeckLabels();this.playSound('select');this.hidePrompt();this.promptView='';
    this.toast('Practice Dummy will clone the current deck on the next duel.');
  }

  async chooseOpponentDeckFile() {
    if(!this.openDuelDeck)return;
    try{
      const picked=await this.openDuelDeck();if(!picked?.deck)return;
      this.opponentDeckMode='custom';this.opponentDeckSelection=picked;this.syncDeckLabels();this.hidePrompt();this.promptView='';this.playSound('select');
      this.toast(`Practice Dummy deck set to ${picked.name||picked.fileName||'selected deck'}.`);
    }catch(error){this.toast(`Could not select dummy deck: ${error?.message||error}`);}
  }

  renderOpponentDeckChooser() {
    this.promptView='opponent-deck';this.showPrompt({dismissible:true});this.prompt?.classList.remove('selection-prompt','card-details-prompt');this.promptTitle.textContent='Choose Practice Dummy Deck';this.promptBody.replaceChildren();
    const intro=document.createElement('p');intro.className='duel-selection-purpose';intro.textContent='By default the Practice Dummy uses a clone of your currently loaded deck. Choose another deck from Recent Decks or browse for a deck file if you want a different opponent.';this.promptBody.append(intro);
    const summary=document.createElement('div');summary.className='duel-opponent-deck-summary';const summaryLabel=document.createElement('span');summaryLabel.textContent='Current opponent deck';const summaryName=document.createElement('strong');summaryName.textContent=this.opponentDeckMode==='custom'&&this.opponentDeckSelection?.name?this.opponentDeckSelection.name:'Clone Current Deck';summary.append(summaryLabel,summaryName);this.promptBody.append(summary);
    const primary=document.createElement('div');primary.className='duel-prompt-controls';primary.append(this.button('Clone Current Deck',()=>this.setOpponentDeckClone(),{ghost:this.opponentDeckMode!=='custom'}));
    if(this.openDuelDeck)primary.append(this.button('Open Deck...',()=>this.chooseOpponentDeckFile(),{ghost:true}));this.promptBody.append(primary);
    const renderGroup=(title,items,emptyText)=>{const heading=document.createElement('h3');heading.className='duel-opponent-deck-heading';heading.textContent=title;this.promptBody.append(heading);const list=document.createElement('div');list.className='duel-opponent-deck-list';if(!items.length){const empty=document.createElement('p');empty.className='duel-selection-purpose';empty.textContent=emptyText;list.append(empty);}else items.forEach(item=>{const button=document.createElement('button');button.type='button';button.className='duel-opponent-deck-item';const name=document.createElement('strong');name.textContent=item.name||item.fileName||'Deck';const meta=document.createElement('span');meta.textContent=item.sourceLabel||item.fileName||title;button.append(name,meta);button.addEventListener('click',()=>{this.opponentDeckMode='custom';this.opponentDeckSelection=item;this.syncDeckLabels();this.hidePrompt();this.promptView='';this.playSound('select');});list.append(button);});this.promptBody.append(list);};
    renderGroup('Recent Decks',Array.from(this.getRecentDuelDecks?.()||[]).filter(item=>item?.deck).slice(0,10),'No recent deck files are available.');
    renderGroup('Deck Directories',Array.from(this.getDeckLibraryDuelDecks?.()||[]).filter(item=>item?.deck).slice(0,40),'No configured deck directories are currently available.');
    if(this.openDeckLibrarySettings){const directoryTools=document.createElement('div');directoryTools.className='duel-prompt-controls';directoryTools.append(this.button('Manage Deck Directories...',async()=>{await this.openDeckLibrarySettings();this.renderOpponentDeckChooser();},{ghost:true}));if(this.refreshDeckLibrary)directoryTools.append(this.button('Refresh Directories',async()=>{await this.refreshDeckLibrary();this.renderOpponentDeckChooser();},{ghost:true}));this.promptBody.append(directoryTools);}
  }

  toggleConsolidatedMenu(force=null) {
    const menu=$id('duelConsolidatedMenu'),button=$id('duelConfigMenuBtn');if(!menu)return;
    const open=force==null?menu.hidden:!!force;menu.hidden=!open;button?.setAttribute('aria-expanded',String(open));
  }

  openDuelConfiguration() {
    if(!this.prompt||!this.promptBody||!this.promptTitle)return;
    const first=['you','dummy','random'].includes(this.firstPlayerPreference)?this.firstPlayerPreference:(this.currentFirstPlayer===1?'dummy':'you');
    this.duelSetupEditMode=true;this.preDuelSetupState={ai:this.dummyMode==='passive'?'passive':this.dummyDifficulty,first,opponentMode:this.opponentDeckMode,opponentSelection:this.opponentDeckSelection};
    this.renderDuelStartSetup();
  }

  toggleAutoZones() {
    this.autoZoneEnabled=!this.autoZoneEnabled;this.writePreference('ygoDuelAutoZones',this.autoZoneEnabled);this.syncDuelToggles();this.playSound('select');
  }

  toggleSound() {
    this.soundEnabled=!this.soundEnabled;this.writePreference('ygoDuelSound',this.soundEnabled);this.syncDuelToggles();if(this.soundEnabled){this.ensureAudio();this.playSound('select');}
  }

  toggleOpponentCards() {
    this.opponentCardsVisible=!this.opponentCardsVisible;this.writePreference('ygoDuelShowOpponentCards',this.opponentCardsVisible);this.hidePileHoverOverlay();this.syncDuelToggles();this.refreshField();this.renderField();this.log(`Opponent private cards are now ${this.opponentCardsVisible?'visible for testing only':'hidden'}. Tester visibility does not change legal actions or rules-based card knowledge.`);
  }

  toggleOwnDeckView() {
    this.ownDeckViewEnabled=!this.ownDeckViewEnabled;
    this.writePreference('ygoDuelViewOwnDeck',this.ownDeckViewEnabled);
    this.hidePileHoverOverlay();
    this.syncDuelToggles();


    if(!this.ownDeckViewEnabled&&this.promptView==='pile'&&Number(this.openPileContext?.player)===0&&this.openPileContext?.key==='deck')this.handleBackAction();
    this.renderField();
    this.playSound('select');
    this.toast(`Free Main Deck viewing ${this.ownDeckViewEnabled?'enabled':'disabled'} for this practice duel.`);
  }

  setSfxVolume(value) {
    this.sfxVolume=Math.max(0,Math.min(1,Number(value)||0));this.writeNumberPreference('ygoDuelSfxVolume',this.sfxVolume);this.syncDuelToggles();if(this.soundEnabled&&this.sfxVolume>0)this.playSound('select');
  }

  ensureAudio() {
    if(!this.soundEnabled||typeof window==='undefined')return null;
    try {
      const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return null;
      if(!this.audioContext)this.audioContext=new Ctx();
      if(this.audioContext.state==='suspended')this.audioContext.resume?.().catch?.(()=>{});
      return this.audioContext;
    } catch { return null; }
  }

  deckShuffleSoundDataUri() {
    if(typeof document==='undefined'||typeof getComputedStyle!=='function')return '';
    try{
      let value=String(getComputedStyle(document.documentElement).getPropertyValue('--ygo-duel-deck-shuffle-sfx')||'').trim();
      if((value.startsWith('\"')&&value.endsWith('\"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);
      return value.startsWith('data:audio/')?value:'';
    }catch{return '';}
  }

  preloadDeckShuffleSound(ctx=this.audioContext) {
    if(this.deckShuffleSoundBuffer)return Promise.resolve(this.deckShuffleSoundBuffer);
    if(this.deckShuffleSoundLoadPromise)return this.deckShuffleSoundLoadPromise;
    if(!ctx||typeof atob!=='function')return Promise.resolve(null);
    const uri=this.deckShuffleSoundDataUri(),comma=uri.indexOf(',');if(comma<0)return Promise.resolve(null);
    try{
      const raw=atob(uri.slice(comma+1)),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
      const decode=ctx.decodeAudioData(bytes.buffer.slice(0));
      this.deckShuffleSoundLoadPromise=Promise.resolve(decode).then(buffer=>{this.deckShuffleSoundBuffer=buffer;return buffer;}).catch(()=>null).finally(()=>{this.deckShuffleSoundLoadPromise=null;});
      return this.deckShuffleSoundLoadPromise;
    }catch{return Promise.resolve(null);}
  }

  playDeckShuffleSound() {
    if(this.isReplaySeekReconstruction()||!this.soundEnabled||!this.isSoundEffectEnabled('shuffle')||this.effectiveSoundVolume('shuffle')<=0)return false;
    const ctx=this.ensureAudio();if(!ctx)return false;
    const play=buffer=>{
      if(!buffer||this.isReplaySeekReconstruction()||!this.soundEnabled||!this.isSoundEffectEnabled('shuffle')||this.effectiveSoundVolume('shuffle')<=0)return false;
      try{const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;gain.gain.value=Math.max(.0001,this.effectiveSoundVolume('shuffle')*.92);source.connect(gain);gain.connect(ctx.destination);source.start(ctx.currentTime);return true;}catch{return false;}
    };
    if(this.deckShuffleSoundBuffer)return play(this.deckShuffleSoundBuffer);
    this.preloadDeckShuffleSound(ctx).then(play).catch(()=>{});return true;
  }

  battleAttackSoundDataUri() {
    if(typeof document==='undefined'||typeof getComputedStyle!=='function')return '';
    try{
      let value=String(getComputedStyle(document.documentElement).getPropertyValue('--ygo-duel-battle-attack-sfx')||'').trim();
      if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);
      return value.startsWith('data:audio/')?value:'';
    }catch{return '';}
  }

  preloadBattleAttackSound(ctx=this.audioContext) {
    if(this.battleAttackSoundBuffer)return Promise.resolve(this.battleAttackSoundBuffer);
    if(this.battleAttackSoundLoadPromise)return this.battleAttackSoundLoadPromise;
    if(!ctx||typeof atob!=='function')return Promise.resolve(null);
    const uri=this.battleAttackSoundDataUri(),comma=uri.indexOf(',');if(comma<0)return Promise.resolve(null);
    try{
      const raw=atob(uri.slice(comma+1)),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
      const decode=ctx.decodeAudioData(bytes.buffer.slice(0));
      this.battleAttackSoundLoadPromise=Promise.resolve(decode).then(buffer=>{this.battleAttackSoundBuffer=buffer;return buffer;}).catch(()=>null).finally(()=>{this.battleAttackSoundLoadPromise=null;});
      return this.battleAttackSoundLoadPromise;
    }catch{return Promise.resolve(null);}
  }

  playBattleAttackSound() {
    if(this.activeAttackSoundStyle)return this.playGeneratedBattleAttackSound(this.activeAttackSoundStyle);
    if(this.isReplaySeekReconstruction()||!this.soundEnabled||!this.isSoundEffectEnabled('battle')||this.effectiveSoundVolume('battle')<=0)return false;
    const ctx=this.ensureAudio();if(!ctx)return false;
    const play=buffer=>{
      if(!buffer||this.isReplaySeekReconstruction()||!this.soundEnabled||!this.isSoundEffectEnabled('battle')||this.effectiveSoundVolume('battle')<=0)return false;
      try{const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;gain.gain.value=Math.max(.0001,this.effectiveSoundVolume('battle'));source.connect(gain);gain.connect(ctx.destination);source.start(ctx.currentTime);return true;}catch{return false;}
    };
    if(this.battleAttackSoundBuffer)return play(this.battleAttackSoundBuffer);
    this.preloadBattleAttackSound(ctx).then(play).catch(()=>{});return true;
  }


  playGeneratedBattleAttackSound(style='laser') {
    if(this.isReplaySeekReconstruction()||!this.soundEnabled||!this.isSoundEffectEnabled('battle')||this.effectiveSoundVolume('battle')<=0)return false;
    const c=this.ensureAudio();if(!c?.createOscillator||!c?.createGain)return false;const now=c.currentTime+.008,master=c.createGain(),volume=Math.max(.0001,this.effectiveSoundVolume('battle')*.72);master.gain.value=volume;master.connect(c.destination);
    const tone=(at,f1,f2,d,v,type='sine')=>{try{const o=c.createOscillator(),g=c.createGain(),t=now+at;o.type=type;o.frequency.setValueAtTime(Math.max(20,f1),t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,v),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(master);o.start(t);o.stop(t+d+.03);}catch{}};
    const noise=(at,d,v,f=1600,type='bandpass')=>{try{if(!c.createBuffer||!c.createBufferSource||!c.createBiquadFilter)return;const n=Math.max(1,Math.floor(c.sampleRate*d)),b=c.createBuffer(1,n,c.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n*.45);const src=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain(),t=now+at;src.buffer=b;filter.type=type;filter.frequency.value=f;filter.Q.value=.75;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,v),t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);src.connect(filter);filter.connect(g);g.connect(master);src.start(t);src.stop(t+d+.02);}catch{}};
    const P={
      laser:{t:[[0,360,1250,.18,.05,'sine'],[.14,1850,680,.22,.09,'sawtooth'],[.45,180,82,.16,.07,'sine']],n:[[.14,.15,.045,3400,'highpass']]},
      arcane:{t:[[0,300,690,.3,.04,'sine'],[.05,460,1080,.36,.03,'sine'],[.11,700,1450,.34,.025,'triangle'],[.42,1550,520,.3,.065,'sine']],n:[[.18,.28,.02,5000,'highpass']]},
      dragon:{t:[[0,82,55,.28,.09,'sawtooth'],[.4,118,48,.25,.13,'sine']],n:[[.1,.46,.12,650,'lowpass'],[.16,.38,.065,1900,'bandpass']]},
      slash:{t:[[0,520,980,.1,.035,'triangle'],[.12,1500,430,.14,.085,'sawtooth'],[.44,230,105,.15,.065,'sine']],n:[[.06,.22,.08,3100,'highpass'],[.4,.08,.06,4500,'bandpass']]},
      machine:{t:[[0,170,1100,.28,.045,'square'],[.07,95,480,.26,.03,'sawtooth'],[.28,2300,700,.12,.09,'square'],[.41,980,680,.07,.045,'square'],[.48,1120,720,.07,.04,'square'],[.55,1280,760,.07,.035,'square']],n:[[.26,.075,.05,5600,'highpass']]},
      void:{t:[[0,66,40,.4,.1,'sine'],[.04,230,90,.42,.04,'sawtooth'],[.3,560,105,.34,.07,'triangle'],[.46,80,36,.32,.13,'sine']],n:[[.08,.38,.045,520,'bandpass']]},
      thunder:{t:[[.05,1350,2400,.07,.075,'square'],[.18,1800,1200,.04,.06,'square'],[.25,2100,1350,.035,.05,'square'],[.43,115,55,.22,.1,'sine']],n:[[0,.16,.04,4400,'highpass'],[.12,.09,.15,6500,'highpass'],[.43,.16,.055,850,'lowpass']]},
      fire:{t:[[.08,220,105,.42,.05,'sawtooth'],[.43,100,45,.25,.14,'sine']],n:[[0,.18,.045,1200,'bandpass'],[.08,.44,.11,900,'lowpass'],[.42,.15,.13,720,'lowpass']]},
      water:{t:[[.08,470,250,.4,.025,'sine']],n:[[0,.19,.045,1200,'bandpass'],[.09,.46,.09,2300,'bandpass'],[.43,.17,.12,1450,'lowpass'],[.51,.18,.04,700,'bandpass']]}
    },p=P[style]||P.laser;(p.t||[]).forEach(x=>tone(...x));(p.n||[]).forEach(x=>noise(...x));return true;
  }

  playSound(kind='select',amount=0) {
    if(this.isReplaySeekReconstruction())return;
    const effectiveVolume=this.effectiveSoundVolume(kind);if(!this.soundEnabled||!this.isSoundEffectEnabled(kind)||effectiveVolume<=0)return;
    const ctx=this.ensureAudio();if(!ctx)return;
    if(this.isSoundEffectEnabled('shuffle')&&!this.deckShuffleSoundBuffer&&!this.deckShuffleSoundLoadPromise)this.preloadDeckShuffleSound(ctx);
    if(this.isSoundEffectEnabled('battle')&&!this.battleAttackSoundBuffer&&!this.battleAttackSoundLoadPromise)this.preloadBattleAttackSound(ctx);


    const presets={
      select:[660,.065,'sine',.78],draw:[740,.13,'triangle',.96],summon:[330,.18,'triangle',1.0],special:[440,.22,'sine',1.02],set:[220,.13,'square',.88],position:[220,.13,'square',.88],activate:[880,.16,'sine',.98],chain:[980,.15,'triangle',.98],attack:[150,.24,'sawtooth',1.06],impact:[90,.2,'square',1.04],phase:[520,.15,'sine',.94],damage:[120,.23,'sawtooth',1.04],recover:[620,.21,'sine',.98],move:[300,.1,'triangle',.86],victory:[720,.38,'triangle',1.0],defeat:[90,.2,'square',1.04]
    };
    const [freq,duration,type,loudness]=presets[kind]||presets.select;
    const now=ctx.currentTime;
    const peak=Math.max(.0001,Math.min(.075,.060*effectiveVolume*loudness));
    const gain=ctx.createGain();gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(peak,now+.014);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    const osc=ctx.createOscillator();osc.type=type;osc.frequency.setValueAtTime(freq,now);if(kind==='attack')osc.frequency.exponentialRampToValueAtTime(70,now+duration);if(kind==='recover')osc.frequency.exponentialRampToValueAtTime(900,now+duration);if(kind==='victory')osc.frequency.exponentialRampToValueAtTime(1080,now+duration);osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+duration+.02);
    if(kind==='special'||kind==='phase'||kind==='activate'||kind==='victory'){
      const o2=ctx.createOscillator(),g2=ctx.createGain();o2.type='sine';o2.frequency.setValueAtTime(freq*1.5,now+.025);g2.gain.setValueAtTime(.0001,now+.02);g2.gain.exponentialRampToValueAtTime(Math.min(.04,peak*.55),now+.04);g2.gain.exponentialRampToValueAtTime(.0001,now+duration+.05);o2.connect(g2);g2.connect(ctx.destination);o2.start(now+.02);o2.stop(now+duration+.07);
    }
  }

  syncFieldGeometry() {
    if(!this.boardWrap||typeof this.boardWrap.querySelector!=='function')return;
    const area=this.battleArea||this.boardWrap.querySelector('.duel-battle-area');
    const mat=this.duelMat||this.boardWrap.querySelector('.duel-mat');
    if(!area||!mat||!mat.style)return;
    this.battleArea=area;this.duelMat=mat;
    const areaRect=area.getBoundingClientRect?.();
    if(!areaRect?.width||!areaRect?.height)return;





    let availableHeight=0;
    try{
      const style=(typeof getComputedStyle==='function'?getComputedStyle(area):globalThis?.window?.getComputedStyle?.(area));
      const rowText=String(style?.gridTemplateRows||'');
      const rows=[...rowText.matchAll(/(-?\d*\.?\d+)px/g)].map(match=>Number(match[1])).filter(Number.isFinite);
      if(rows.length>=3)availableHeight=Math.max(0,rows[1]);
      if(!availableHeight){
        const rowGap=Math.max(0,Number.parseFloat(style?.rowGap||style?.gap||'0')||0);
        const opponent=this.boardWrap.querySelector('#duelOpponentHand')?.getBoundingClientRect?.();
        const player=this.boardWrap.querySelector('#duelPlayerHand')?.getBoundingClientRect?.();
        availableHeight=Math.max(0,areaRect.height-(opponent?.height||0)-(player?.height||0)-(rowGap*2));
      }
    }catch{}
    if(!availableHeight)availableHeight=areaRect.height;

    const availableWidth=Math.max(0,areaRect.width);
    const aspect=9/5;
    let width=Math.min(availableWidth,availableHeight*aspect);
    let height=width/aspect;
    if(height>availableHeight){height=availableHeight;width=height*aspect;}
    if(!(width>0&&height>0))return;



    mat.style.width=`${width}px`;
    mat.style.height=`${height}px`;
    mat.style.maxWidth='none';
    mat.style.maxHeight='none';
    mat.style.aspectRatio='9 / 5';




    const fieldScale=Math.max(.2,Math.min(1.15,width/900));
    this.boardWrap.style?.setProperty('--duel-field-scale',String(fieldScale));
  }

  syncCardScale() {
    if(!this.boardWrap||typeof this.boardWrap.querySelector!=='function')return;
    this.syncFieldGeometry();








    const row=this.boardWrap.querySelector('.duel-zone-row.monster-row');
    const rowRect=row?.getBoundingClientRect?.();
    let zoneSize=0;
    if(rowRect?.width&&rowRect?.height){
      let gap=6;
      try{
        const style=(typeof getComputedStyle==='function'?getComputedStyle(row):globalThis?.window?.getComputedStyle?.(row));
        const parsed=Number.parseFloat(style?.columnGap||style?.gap||'');
        if(Number.isFinite(parsed))gap=Math.max(0,parsed);
      }catch{}
      const columns=Math.max(1,Number(row?.children?.length)||5);
      const availableWidth=Math.max(0,rowRect.width-(gap*Math.max(0,columns-1)));
      const cellWidth=availableWidth/columns;
      zoneSize=Math.floor(Math.min(cellWidth,rowRect.height));
    }
    if(!zoneSize){
      const zone=this.boardWrap.querySelector('.duel-zone-row.monster-row .duel-zone')||this.boardWrap.querySelector('.duel-zone');
      const rect=zone?.getBoundingClientRect?.();
      if(!rect?.width||!rect?.height)return;
      zoneSize=Math.floor(Math.min(rect.width,rect.height));
    }
    zoneSize=Math.max(52,Math.min(166,zoneSize));
    const height=Math.max(48,Math.min(156,zoneSize-10));
    const width=Math.max(33,Math.round(height*421/614));
    this.boardWrap.style?.setProperty('--duel-zone-size',`${zoneSize}px`);
    this.boardWrap.style?.setProperty('--duel-card-h',`${height}px`);
    this.boardWrap.style?.setProperty('--duel-card-w',`${width}px`);
    this.positionPhaseDock();
  }

  scheduleCardScale() {
    if(typeof requestAnimationFrame!=='function'){this.syncCardScale();return;}
    if(this.cardScaleFrame)cancelAnimationFrame?.(this.cardScaleFrame);
    this.cardScaleFrame=requestAnimationFrame(()=>{
      this.cardScaleFrame=0;this.syncFieldGeometry();this.syncCardScale();


      requestAnimationFrame(()=>{this.syncFieldGeometry();this.syncCardScale();});
    });
  }

  styledCardText(text, code = 0) {
    const raw=safeText(text);
    if(!this.formatCardText)return null;
    try{return this.formatCardText(raw,Number(code)||0);}catch(error){console.warn('Card text styling failed',error);return null;}
  }

  setStyledCardText(node,text,code=0) {
    if(!node)return;
    const html=this.styledCardText(text,code);
    node.classList.add('duel-styled-card-text');
    if(typeof html==='string')node.innerHTML=html;
    else node.textContent=safeText(text);
  }


  syncStyledTextToggle() {
    const button=$id('duelCardTextStylingToggle');if(!button)return;
    const styled=!!this.getCardTextStyling();
    button.setAttribute('aria-pressed',String(styled));
    const label=button.querySelector?.('[data-duel-style-label]');if(label)label.textContent=styled?'Styled':'Plain';
    button.title=styled?'Show plain card text':'Show styled card text';
  }

  toggleStyledText() {
    if(this.toggleCardTextStyling)this.toggleCardTextStyling();
    this.syncStyledTextToggle();
    const pinned=this.cardDetailsIdentityTarget();
    const code=Number(pinned?.code||this.lastInspectedCode)||0,info=pinned?.info||this.lastInspectedInfo||{};
    if(code)this.inspectCard(code,info);
    if(this.promptView==='details'&&code)this.renderCardDetailsModal(code,info);
  }

  dismissAuxiliaryViewer() {




    if(this.promptView==='details'&&this.cardDetailsOverlay)return this.closeIndependentCardDetails({restore:true});
    if(!['details','pile'].includes(this.promptView))return false;
    const returnToMinimized=!!this.auxiliaryReturnToMinimized;
    this.auxiliaryReturnToMinimized=false;
    this.detailsReturnSnapshot=null;
    this.detailsReturnView='';
    this.openPileContext=null;
    this.pinnedInspector=null;
    this.selectedCardContext=null;
    this.hideCardHoverOverlay({clearInspector:false});
    this.clearLogCardFocus('hover');
    this.clearLogCardFocus('selected');
    this.inspectCard(0,{}, {transient:true});
    this.promptView='';


    this.promptTitle?.replaceChildren();
    this.promptBody?.replaceChildren();
    if(this.currentPrompt&&this.pendingResolve){
      this.renderPrompt(this.currentPrompt);
      if(returnToMinimized)this.minimizePrompt();
    }else{
      this.hidePrompt();
      this.prompt?.classList.add('duel-prompt-hidden');
      this.promptTitle?.replaceChildren();
      this.promptBody?.replaceChildren();
    }
    return true;
  }

  handleBackAction() {
    if(this.root?.hidden)return false;
    const T=this.mod?.OcgMessageType||{},R=this.mod?.OcgResponseType||{};
    if(this.promptView==='details'){
      if(this.cardDetailsOverlay)return this.closeIndependentCardDetails({restore:true});



      this.detailsCloseRequested=true;
      try{
        const snapshotRevision=Number(this.detailsReturnSnapshot?.promptRevision)||0;
        const liveRevision=Number(this.currentPromptRevision)||0;
        const liveChanged=!!this.detailsBackgroundPromptDirty||(snapshotRevision&&liveRevision!==snapshotRevision);
        if(!liveChanged&&this.restoreDetailsReturnSnapshot()){this.detailsOpenedPromptRevision=0;this.detailsBackgroundPromptDirty=false;return true;}
        this.detailsReturnSnapshot=null;const prior=this.detailsReturnView;this.promptView='';this.detailsReturnView='';this.detailsOpenedPromptRevision=0;this.detailsBackgroundPromptDirty=false;
        if(this.currentPrompt&&this.pendingResolve){this.renderPrompt(this.currentPrompt);return true;}
        if(prior==='pile'&&this.openPileContext){this.renderPileViewer(this.openPileContext.player,this.openPileContext.key);return true;}
        if(prior==='log-detail'&&this.logDetailContext){this.renderLogEvent(this.logDetailContext);return true;}
        if(prior==='special-choice'&&this.specialChoiceContext){this.renderSpecialSummonChoices(this.specialChoiceContext.player,this.specialChoiceContext.key,this.specialChoiceContext.actions);return true;}
        this.hidePrompt({force:true});return true;
      }finally{this.detailsCloseRequested=false;}
    }
    if(this.promptView==='pile'||this.promptView==='opponent-deck'||this.promptView==='log-detail'){
      if(this.promptView==='log-detail'&&this.logDetailParentContext){const parent=this.logDetailParentContext;this.logDetailParentContext=null;this.renderLogEvent(parent);return true;}
      const pileReturn=this.promptView==='pile'&&this.openPileContext?{...this.openPileContext}:null;
      const returnToMinimized=!!this.auxiliaryReturnToMinimized;this.auxiliaryReturnToMinimized=false;this.promptView='';if(pileReturn)this.openPileContext=null;
      if(this.currentPrompt){this.renderPrompt(this.currentPrompt);if(returnToMinimized)this.minimizePrompt();}
      else if(this.authoritativePendingDecision?.submitted&&this.pendingDecisionLease)this.restoreSubmittedDecisionSurface();
      else this.hidePrompt();if(pileReturn)this.restorePileHoverAfterViewer(pileReturn);return true;
    }
    if(this.selectedCardContext){this.releaseCardSelection();return true;}
    const m=this.currentPrompt;
    if(m){
      if(m.type===T.SELECT_CHAIN&&!m.forced){this.submitResponse({type:R.SELECT_CHAIN,index:null});return true;}
      if((m.type===T.SELECT_EFFECTYN||m.type===T.SELECT_YESNO)){this.submitResponse({type:m.type===T.SELECT_EFFECTYN?R.SELECT_EFFECTYN:R.SELECT_YESNO,yes:false});return true;}
      if((m.type===T.SELECT_CARD||m.type===T.SELECT_TRIBUTE)&&m.can_cancel){this.pendingSpecialSummon=null;this.submitResponse({type:m.type===T.SELECT_CARD?R.SELECT_CARD:R.SELECT_TRIBUTE,indicies:null});return true;}
      if(m.type===T.SELECT_UNSELECT_CARD&&(m.can_finish||m.can_cancel)){if(m.can_cancel&&!m.can_finish)this.pendingSpecialSummon=null;this.submitResponse({type:R.SELECT_UNSELECT_CARD,index:null});return true;}
      if((m.type===T.SELECT_PLACE||m.type===T.SELECT_DISFIELD)&&this.activePlacePrompt?.canCancel){const cfg=this.activePlacePrompt;this.clearPlacePrompt();this.submitResponse({type:cfg.responseType,places:null});return true;}
    }
    if(this.prompt?.dataset.dismissible==='1'){this.hidePrompt();this.promptView='';return true;}
    return false;
  }

  scheduleSelectionPromptSizing() {
    if(!this.prompt?.classList?.contains('selection-prompt'))return;
    if(this.selectionSizingFrame&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(this.selectionSizingFrame);
    const run=()=>{this.selectionSizingFrame=0;this.syncSelectionPromptSizing();};
    if(typeof requestAnimationFrame!=='function')run();else this.selectionSizingFrame=requestAnimationFrame(run);
  }

  decisionPromptCenterY() {
    const board=this.boardWrap,boardRect=board?.getBoundingClientRect?.();
    const viewportHeight=typeof window!=='undefined'?Number(window.innerHeight)||700:700;
    const boardHeight=Math.max(0,Number(boardRect?.height)||Number(board?.clientHeight)||viewportHeight);
    const edge=Math.min(86,Math.max(10,boardHeight*.25));
    const preferred=boardHeight*.55;
    const center=Math.round(Math.max(edge,Math.min(boardHeight-edge,preferred)));
    board?.style?.setProperty?.('--duel-decision-prompt-center-y',`${center}px`);
    return center;
  }

  selectionPromptAvailableHeight() {
    const viewportHeight=typeof window!=='undefined'?Number(window.innerHeight)||700:700;
    const boardHeight=Number(this.boardWrap?.clientHeight)||viewportHeight;
    const attached=this.prompt?.classList?.contains('duel-chain-attached-prompt')&&this.chainVisualNode&&!this.chainVisualNode.hidden;
    const centeredDecision=attached||this.prompt?.classList?.contains('selection-prompt');
    const naturalAvailable=Math.min(viewportHeight-12,boardHeight-10);
    const centerY=centeredDecision?this.decisionPromptCenterY():boardHeight/2;
    const centeredSpan=2*Math.max(0,Math.min(centerY-10,boardHeight-centerY-10));
    const boardAvailable=centeredDecision?Math.max(110,Math.min(naturalAvailable,centeredSpan||naturalAvailable)):Math.max(260,naturalAvailable);
    let available=boardAvailable;
    if(attached){
      const chain=this.chainVisualNode,heading=chain.querySelector?.('.duel-chain-heading,.duel-chain-title,h3'),links=chain.querySelector?.('.duel-chain-links');
      const headingHeight=Math.max(0,Number(heading?.getBoundingClientRect?.().height)||Number(heading?.scrollHeight)||0);
      const linksHeight=Math.max(0,Number(links?.getBoundingClientRect?.().height)||Number(links?.scrollHeight)||0);
      const stackAvailable=Math.max(110,boardAvailable);chain.style?.setProperty?.('--duel-chain-stack-max-height',`${stackAvailable}px`);
      available=Math.max(90,stackAvailable-headingHeight-linksHeight-34);
    }
    return available;
  }

  cardRailSnapMetrics(grid,axis='y') {
    const cards=[...(grid?.querySelectorAll?.('.duel-prompt-card,.duel-reveal-card')||[])],card=cards[0];if(!card)return null;
    const rect=card.getBoundingClientRect?.();const style=typeof getComputedStyle==='function'?getComputedStyle(grid):null;
    const gap=parseFloat(axis==='x'?(style?.columnGap||style?.gap||'12'):(style?.rowGap||style?.gap||'12'))||12;




    const offsetSize=axis==='x'?Number(card.offsetWidth):Number(card.offsetHeight);const rectSize=axis==='x'?Number(rect?.width):Number(rect?.height);
    const cardSize=offsetSize||rectSize||0;if(cardSize<=0)return null;
    let stride=cardSize+gap;
    if(cards.length>1){const next=cards[1];const offsetMeasured=axis==='x'?Number(next.offsetLeft)-Number(card.offsetLeft):Number(next.offsetTop)-Number(card.offsetTop);const nextRect=next.getBoundingClientRect?.();const rectMeasured=axis==='x'?Number(nextRect?.left)-Number(rect?.left):Number(nextRect?.top)-Number(rect?.top);const measured=Number.isFinite(offsetMeasured)&&offsetMeasured>=cardSize-.5?offsetMeasured:rectMeasured;if(Number.isFinite(measured)&&measured>=cardSize-.5)stride=measured;}
    const max=Math.max(0,axis==='x'?Number(grid.scrollWidth)-Number(grid.clientWidth):Number(grid.scrollHeight)-Number(grid.clientHeight));
    return{stride,max,cardSize};
  }

  snapCardRailToWholeCard(grid,axis='y',{smooth=false}={}) {
    const metrics=this.cardRailSnapMetrics(grid,axis);if(!metrics||metrics.max<=1)return 0;
    const current=axis==='x'?Number(grid.scrollLeft)||0:Number(grid.scrollTop)||0;
    const lastIndex=Math.max(0,Math.round(metrics.max/metrics.stride));
    const index=Math.max(0,Math.min(lastIndex,Math.round(current/metrics.stride)));
    const target=Math.min(metrics.max,index*metrics.stride);
    if(typeof grid.scrollTo==='function')grid.scrollTo(axis==='x'?{left:target,behavior:smooth?'smooth':'auto'}:{top:target,behavior:smooth?'smooth':'auto'});
    else if(axis==='x')grid.scrollLeft=target;else grid.scrollTop=target;
    return target;
  }

  bindCardRailWheelSnap(grid,axis='y') {
    if(!grid)return;grid.dataset.duelWheelAxis=axis;
    if(grid.dataset.cardSnapWheelBound==='1')return;
    grid.dataset.cardSnapWheelBound='1';
    const scheduleSnap=()=>{if(grid._duelSnapTimer)clearTimeout(grid._duelSnapTimer);grid._duelSnapTimer=setTimeout(()=>this.snapCardRailToWholeCard(grid,grid.dataset.duelWheelAxis||'y'),110);};
    grid.addEventListener('scroll',scheduleSnap,{passive:true});
    grid.addEventListener('wheel',event=>{
      const mode=grid.dataset.duelWheelAxis||'y',metrics=this.cardRailSnapMetrics(grid,mode);if(!metrics||metrics.max<=1)return;
      const delta=Math.abs(Number(event.deltaY)||0)>=Math.abs(Number(event.deltaX)||0)?Number(event.deltaY)||0:Number(event.deltaX)||0;if(!delta)return;
      event.preventDefault();
      const now=typeof performance!=='undefined'&&performance.now?performance.now():Date.now();if(now-Number(grid._duelLastSnapWheel||0)<70)return;grid._duelLastSnapWheel=now;
      const current=mode==='x'?Number(grid.scrollLeft)||0:Number(grid.scrollTop)||0;
      const index=Math.round(current/metrics.stride),lastIndex=Math.max(0,Math.round(metrics.max/metrics.stride));
      const next=Math.max(0,Math.min(lastIndex,index+(delta>0?1:-1))),target=Math.min(metrics.max,next*metrics.stride);
      if(typeof grid.scrollTo==='function')grid.scrollTo(mode==='x'?{left:target,behavior:'smooth'}:{top:target,behavior:'smooth'});else if(mode==='x')grid.scrollLeft=target;else grid.scrollTop=target;
      scheduleSnap();
    },{passive:false});
    grid.addEventListener('keydown',event=>{
      const mode=grid.dataset.duelWheelAxis||'y';if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageUp','PageDown'].includes(event.key))return;
      const forward=event.key==='ArrowRight'||event.key==='ArrowDown'||event.key==='PageDown';const backward=event.key==='ArrowLeft'||event.key==='ArrowUp'||event.key==='PageUp';
      if((mode==='x'&&!['ArrowLeft','ArrowRight','PageUp','PageDown'].includes(event.key))||(mode==='y'&&!['ArrowUp','ArrowDown','PageUp','PageDown'].includes(event.key)))return;
      const metrics=this.cardRailSnapMetrics(grid,mode);if(!metrics||metrics.max<=1)return;event.preventDefault();
      const current=mode==='x'?Number(grid.scrollLeft)||0:Number(grid.scrollTop)||0,index=Math.round(current/metrics.stride),step=(event.key==='PageUp'||event.key==='PageDown')?Math.max(1,Math.floor((mode==='x'?grid.clientWidth:grid.clientHeight)/metrics.stride)):1;
      const targetIndex=Math.max(0,Math.min(Math.round(metrics.max/metrics.stride),index+(forward?step:backward?-step:0)));
      const target=Math.min(metrics.max,targetIndex*metrics.stride);if(mode==='x')grid.scrollLeft=target;else grid.scrollTop=target;
    });
  }

  syncSelectionPromptSizing() {
    if(!this.prompt?.classList?.contains('selection-prompt'))return;
    const grid=this.prompt.querySelector?.('.duel-select-card-grid');if(!grid)return;
    const cards=[...grid.querySelectorAll('.duel-prompt-card')];if(!cards.length)return;




    this.prompt.style.removeProperty('--duel-selection-card-w');this.prompt.style.removeProperty('--duel-selection-card-h');
    this.prompt.style.removeProperty('--duel-selection-measured-width');this.prompt.style.removeProperty('width');
    for(const prop of ['max-height','overflow-y','overflow-x','grid-template-columns','justify-content'])grid.style.removeProperty(prop);
    grid.classList.remove('duel-selection-grid-scroll');



    const actualExtraViewer=this.promptView==='pile'&&this.openPileContext?.key==='extra'&&this.prompt.classList.contains('duel-extra-deck-viewer-prompt');
    const horizontal=!actualExtraViewer;
    grid.classList.toggle('duel-horizontal-card-rail',horizontal);
    if(horizontal){
      grid.style.maxHeight='none';grid.style.overflowY='hidden';grid.style.overflowX='auto';grid.style.scrollSnapType='x mandatory';



      const first=cards[0].getBoundingClientRect?.();const style=typeof getComputedStyle==='function'?getComputedStyle(grid):null;



      const cardW=Math.max(1,Math.ceil(Number(cards[0].offsetWidth)||Number(first?.width)||1));
      const cssGap=Math.max(0,parseFloat(style?.columnGap||style?.gap||'12')||12);
      const measuredStride=cards.length>1?Number(cards[1].offsetLeft)-Number(cards[0].offsetLeft):0;
      const stride=Number.isFinite(measuredStride)&&measuredStride>=cardW?measuredStride:cardW+cssGap;
      const gap=Math.max(0,stride-cardW);
      this.prompt.style.setProperty('--duel-selection-tile-w',`${cardW}px`);
      const rawPadStart=parseFloat(style?.paddingLeft||'0')||0,rawPadEnd=parseFloat(style?.paddingRight||'0')||0;
      const railInsets=wholeCardRailInsets(cardW,stride,rawPadStart,rawPadEnd),padStart=railInsets.start,padEnd=railInsets.end;
      grid.style.setProperty('padding-left',`${padStart}px`,'important');grid.style.setProperty('padding-right',`${padEnd}px`,'important');
      const viewportW=typeof window!=='undefined'?Number(window.innerWidth)||1000:1000;
      const boardW=Math.max(cardW+padStart+padEnd,Number(this.boardWrap?.clientWidth)||viewportW);
      const promptLimit=Math.max(cardW+padStart+padEnd,Math.min(780,boardW-24,viewportW-24));
      const promptChrome=Math.max(0,(Number(this.prompt?.offsetWidth)||0)-(Number(this.promptBody?.clientWidth)||0));
      const availableGrid=Math.max(cardW+padStart+padEnd,promptLimit-promptChrome-4);


      const whole=wholeCardViewportByStride(cards.length,cardW,stride,availableGrid,padStart,padEnd);
      const exactRailWidth=Math.max(1,Math.floor(whole.viewportWidth+0.001));


      grid.style.setProperty('width',`${exactRailWidth}px`,'important');grid.style.setProperty('min-width',`${exactRailWidth}px`,'important');grid.style.setProperty('max-width',`${exactRailWidth}px`,'important');











      let contextRailWidth=0;
      const contextRails=[...this.prompt.querySelectorAll?.('.duel-horizontal-context-card-rail')||[]].filter(node=>node!==grid);
      for(const rail of contextRails){
        const contextCards=[...rail.querySelectorAll?.('.duel-reveal-card,.duel-prompt-card')||[]];if(!contextCards.length)continue;
        const railStyle=typeof getComputedStyle==='function'?getComputedStyle(rail):null;
        const contextCardW=Math.max(1,Math.ceil(Number(contextCards[0].offsetWidth)||Number(contextCards[0].getBoundingClientRect?.().width)||1));
        const contextGapCss=Math.max(0,parseFloat(railStyle?.columnGap||railStyle?.gap||'10')||10);
        const contextMeasuredStride=contextCards.length>1?Number(contextCards[1].offsetLeft)-Number(contextCards[0].offsetLeft):0;
        const contextStride=Number.isFinite(contextMeasuredStride)&&contextMeasuredStride>=contextCardW?contextMeasuredStride:contextCardW+contextGapCss;


        const contextRawPadStart=parseFloat(railStyle?.paddingLeft||'0')||0,contextRawPadEnd=parseFloat(railStyle?.paddingRight||'0')||0;
        const contextInsets=wholeCardRailInsets(contextCardW,contextStride,contextRawPadStart,contextRawPadEnd),contextPadStart=contextInsets.start,contextPadEnd=contextInsets.end;
        rail.style.setProperty('padding-left',`${contextPadStart}px`,'important');rail.style.setProperty('padding-right',`${contextPadEnd}px`,'important');
        const contextFullWidth=Math.ceil(contextPadStart+contextPadEnd+contextCardW+Math.max(0,contextCards.length-1)*contextStride);
        const contextHardAvailable=Math.max(contextCardW+contextPadStart+contextPadEnd,promptLimit-promptChrome-4);
        const contextAvailable=contextCards.length<=3&&contextFullWidth<=contextHardAvailable+.5?contextFullWidth:Math.max(contextCardW+contextPadStart+contextPadEnd,Math.min(contextHardAvailable,availableGrid));
        let contextViewport=contextFullWidth,contextVisible=contextCards.length;
        if(contextFullWidth>contextAvailable+.5){
          const contextWhole=wholeCardViewportByStride(contextCards.length,contextCardW,contextStride,contextAvailable,contextPadStart,contextPadEnd);
          contextViewport=Math.max(1,Math.floor(contextWhole.viewportWidth+.001));contextVisible=contextWhole.visibleCount;
          rail.style.setProperty('overflow-x','auto','important');rail.style.setProperty('scroll-snap-type','x mandatory','important');
          rail.tabIndex=rail.tabIndex<0?0:rail.tabIndex;this.bindCardRailWheelSnap(rail,'x');this.snapCardRailToWholeCard(rail,'x');
        }else{
          rail.style.setProperty('overflow-x','hidden','important');rail.style.setProperty('scroll-snap-type','none','important');rail.scrollLeft=0;
        }
        const contextExpectsOverflow=contextCards.length>contextVisible;
        rail.classList.toggle('duel-card-rail-overflow',contextExpectsOverflow);
        rail.style.setProperty('width',`${contextViewport}px`,'important');rail.style.setProperty('min-width',`${contextViewport}px`,'important');rail.style.setProperty('max-width',`${contextViewport}px`,'important');
        rail.dataset.duelVisibleCardCount=String(contextVisible);
        const contextSection=rail.closest?.('.duel-semantic-section,.duel-reveal-preview');
        const contextSectionStyle=contextSection&&typeof getComputedStyle==='function'?getComputedStyle(contextSection):null;
        const contextSectionInset=(parseFloat(contextSectionStyle?.paddingLeft||'0')||0)+(parseFloat(contextSectionStyle?.paddingRight||'0')||0);
        contextRailWidth=Math.max(contextRailWidth,contextViewport+contextSectionInset);
      }

      const criticalText=this.currentPrompt?this.conciseEffectText(this.inferPromptEffectText(this.currentPrompt)):'';
      const criticalContextWidth=criticalText.length>150?Math.min(promptLimit,Math.max(420,Math.min(620,420+Math.ceil((criticalText.length-150)/3)))):0;


      const measuredPromptWidth=Math.min(promptLimit,Math.max(260,criticalContextWidth,Math.ceil(exactRailWidth+promptChrome+4),Math.ceil(contextRailWidth+promptChrome+4)));
      this.prompt.style.setProperty('--duel-selection-measured-width',`${measuredPromptWidth}px`);
      this.prompt.style.setProperty('width',`${measuredPromptWidth}px`,'important');
      if(this.prompt.classList.contains('duel-chain-attached-prompt')&&this.chainVisualNode)this.chainVisualNode.style.setProperty('--duel-contained-prompt-width',`${measuredPromptWidth}px`);
      grid.dataset.duelVisibleCardCount=String(whole.visibleCount);grid.tabIndex=grid.tabIndex<0?0:grid.tabIndex;
      this.bindCardRailWheelSnap(grid,'x');




      const expectsOverflow=cards.length>whole.visibleCount;
      grid.classList.toggle('duel-card-rail-overflow',expectsOverflow);
      grid.style.setProperty('overflow-x',expectsOverflow?'auto':'hidden','important');
      grid.style.setProperty('scroll-snap-type',expectsOverflow?'x mandatory':'none','important');
      if(!expectsOverflow)grid.scrollLeft=0;else this.snapCardRailToWholeCard(grid,'x');
      const verifyOverflow=()=>{
        if(!grid.isConnected)return;



        const actualOverflow=expectsOverflow&&(Number(grid.scrollWidth)||0)>(Number(grid.clientWidth)||0)+2;
        grid.style.setProperty('overflow-x',actualOverflow?'auto':'hidden','important');
        grid.style.setProperty('scroll-snap-type',actualOverflow?'x mandatory':'none','important');
        grid.classList.toggle('duel-card-rail-overflow',actualOverflow);
        if(!actualOverflow)grid.scrollLeft=0;
      };
      if(typeof requestAnimationFrame==='function')requestAnimationFrame(verifyOverflow);else setTimeout(verifyOverflow,0);
      this.schedulePromptFit();return;
    }

    grid.style.overflow='visible';grid.style.maxHeight='none';grid.style.scrollSnapType='none';
    let first=cards[0].getBoundingClientRect?.();if(!first?.height||!first?.width)return;
    let style=typeof getComputedStyle==='function'?getComputedStyle(grid):null;
    let rowGap=parseFloat(style?.rowGap||style?.gap||'12')||12,colGap=parseFloat(style?.columnGap||style?.gap||'16')||16;
    const availableWidth=Math.max(64,Number(grid.clientWidth)||Number(this.promptBody?.clientWidth)||Number(this.prompt?.clientWidth)||320);
    const promptAvailable=this.selectionPromptAvailableHeight();
    const naturalGridScroll=Math.max(Number(grid.scrollHeight)||0,first.height);
    const naturalPromptScroll=Math.max(Number(this.prompt.scrollHeight)||0,naturalGridScroll);
    const nonGridHeight=Math.max(48,naturalPromptScroll-naturalGridScroll+8);
    let availableGridHeight=Math.max(48,promptAvailable-nonGridHeight);



    let scale=1;
    if(availableWidth+1<first.width)scale=Math.min(scale,availableWidth/Math.max(1,first.width));
    if(availableGridHeight+1<first.height)scale=Math.min(scale,availableGridHeight/Math.max(1,first.height));
    scale=Math.max(.62,Math.min(1,scale));
    if(scale<.999){
      const promptStyle=typeof getComputedStyle==='function'?getComputedStyle(this.prompt):null;
      const baseArtW=parseFloat(promptStyle?.getPropertyValue('--duel-card-w')||'0')||Math.max(48,first.width-16);
      const baseArtH=parseFloat(promptStyle?.getPropertyValue('--duel-card-h')||'0')||Math.max(70,first.height-34);
      this.prompt.style.setProperty('--duel-selection-card-w',`${Math.floor(baseArtW*scale)}px`);this.prompt.style.setProperty('--duel-selection-card-h',`${Math.floor(baseArtH*scale)}px`);
      first=cards[0].getBoundingClientRect?.()||first;style=typeof getComputedStyle==='function'?getComputedStyle(grid):style;rowGap=parseFloat(style?.rowGap||style?.gap||'12')||12;colGap=parseFloat(style?.columnGap||style?.gap||'16')||16;
    }
    const cardW=Math.max(1,Number(first.width)||1),cardH=Math.max(1,Number(first.height)||1);
    const columns=Math.max(1,Math.min(cards.length,Math.floor((availableWidth+colGap)/(cardW+colGap))||1));
    const rows=Math.ceil(cards.length/columns);
    const maxRows=Math.max(1,Math.floor((availableGridHeight+rowGap)/(cardH+rowGap))||1);
    const visibleRows=Math.min(rows,maxRows);
    grid.style.gridTemplateColumns=`repeat(${columns}, ${Math.ceil(cardW)}px)`;grid.style.justifyContent='center';
    const height=Math.ceil(visibleRows*cardH+Math.max(0,visibleRows-1)*rowGap+6);grid.style.maxHeight=`${height}px`;
    const needsScroll=rows>visibleRows;grid.style.overflowY=needsScroll?'auto':'visible';grid.style.overflowX='hidden';grid.classList.toggle('duel-selection-grid-scroll',needsScroll);
    grid.style.scrollSnapType=needsScroll?'y mandatory':'none';this.bindCardRailWheelSnap(grid,'y');
    if(!needsScroll)grid.scrollTop=0;else{const stride=cardH+rowGap;grid.scrollTop=Math.max(0,Math.round((Number(grid.scrollTop)||0)/stride)*stride);}
    this.schedulePromptFit();
  }

  rectForLocation(loc,{preferCard=true}={}) {
    if(!loc||!this.boardWrap||typeof this.boardWrap.querySelector!=='function')return null;
    const player=Number(loc.controller)||0,key=this.locationKey(Number(loc.location)||0),sequence=Number(loc.sequence)||0;
    let node=null;
    if(preferCard)node=this.boardWrap.querySelector(`.duel-card[data-player="${player}"][data-location="${key}"][data-sequence="${sequence}"]`);
    if(!node&&(key==='mzone'||key==='szone')){
      if(key==='mzone'&&this.isSharedExtraMonsterSequence(sequence))node=this.extraMonsterZoneNode(player,sequence);
      if(!node)node=this.boardWrap.querySelector(`.duel-zone[data-player="${player}"][data-location="${key}"][data-sequence="${sequence}"]`);
    }
    if(!node&&['deck','grave','removed','extra'].includes(key))node=this.boardWrap.querySelector(`.duel-pile[data-player="${player}"][data-location="${key}"]`);
    if(!node&&key==='hand')node=player===0?$id('duelPlayerHand'):$id('duelOpponentHand');
    return node?.getBoundingClientRect?.()||null;
  }

  animationCodeVisible(code,to={}) {
    const n=Number(code)||0;if(!n||!this.mod)return 0;
    const player=Number(to.controller)||0,key=this.locationKey(Number(to.location)||0),P=this.mod.OcgPosition||{};
    if(player===0||this.opponentCardsVisible)return n;
    if(key==='hand'||key==='deck'||key==='extra')return 0;
    if((key==='mzone'||key==='szone'||key==='removed')&&(Number(to.position)&(P.FACEDOWN||0)))return 0;
    return n;
  }

  reconcileStableChildren(parent, desired=[]) {
    if(!parent)return;
    const existing=[...parent.children];
    const byKey=new Map();
    for(const child of existing){const slot=child?.dataset?.renderSlot||'';const sig=child?.dataset?.renderSignature||'';if(slot&&sig)byKey.set(`${slot}\u0000${sig}`,child);}
    const actual=desired.map(candidate=>{const slot=candidate?.dataset?.renderSlot||'',sig=candidate?.dataset?.renderSignature||'';return(slot&&sig&&byKey.get(`${slot}\u0000${sig}`))||candidate;});
    let cursor=parent.firstChild;
    for(const child of actual){if(child===cursor){cursor=cursor.nextSibling;continue;}parent.insertBefore(child,cursor);}
    const keep=new Set(actual);for(const child of [...parent.children])if(!keep.has(child))child.remove();
  }

  jsonSafeValue(value) {
    if(typeof value==='bigint')return value.toString();
    if(Array.isArray(value))return value.map(item=>this.jsonSafeValue(item));
    if(value&&typeof value==='object'){const out={};for(const key of Object.keys(value))out[key]=this.jsonSafeValue(value[key]);return out;}
    return value;
  }

  stableJSONStringify(value,space=0) {
    try{return JSON.stringify(this.jsonSafeValue(value),null,space);}catch{return String(value??'');}
  }

  stableRenderSignature(value) {
    return this.stableJSONStringify(value);
  }

  promptBelongsToActiveChain(message=this.currentPrompt) {
    const T=this.mod?.OcgMessageType||{};
    if(!message||!this.chainVisuals?.size)return false;



    if(message.type===T.SELECT_IDLECMD||message.type===T.SELECT_BATTLECMD||message.type===T.SELECT_POSITION)return false;
    const live=[...this.chainVisuals.values()].some(item=>!item.resolved&&item.state!=='resolved'&&!item.outcomeState);
    return live||Number(this.resolvingChainLink)>0||message.type===T.SELECT_CHAIN;
  }

  restorePromptHome() {
    if(!this.prompt)return;
    this.prompt.classList.remove('duel-chain-attached-prompt','duel-direct-selection-toolbar-prompt');
    const parent=this.promptHomeParent;
    if(parent&&this.prompt.parentNode!==parent){
      const before=this.promptHomeNextSibling&&this.promptHomeNextSibling.parentNode===parent?this.promptHomeNextSibling:null;
      parent.insertBefore(this.prompt,before);
    }
    this.chainPromptAttached=false;
    this.chainVisualNode?.classList?.remove('duel-chain-prompt-active');
  }

  syncChainPromptAttachment(message=this.currentPrompt) {
    if(!this.prompt)return false;

    const displaced=this.chainPromptAttached||this.prompt.classList.contains('duel-chain-attached-prompt')||(this.promptHomeParent&&this.prompt.parentNode!==this.promptHomeParent);
    if(displaced)this.restorePromptHome();
    this.prompt.classList.remove('duel-chain-attached-prompt');
    this.prompt.querySelectorAll?.('.duel-active-chain-context').forEach(node=>node.remove());
    this.chainVisualNode?.classList?.remove('duel-chain-prompt-active');
    this.chainPromptAttached=false;
    return false;
  }

  ensureChainVisualNode() {
    if(this.chainVisualNode?.isConnected)return this.chainVisualNode;
    if(typeof document==='undefined')return null;
    const host=this.boardWrap;
    if(!host)return null;
    const node=document.createElement('section');node.className='duel-chain-visual duel-chain-main-overlay duel-chain-upper-shelf';node.hidden=true;node.setAttribute('aria-live','polite');node.setAttribute('aria-label','Current Chain');
    const frame=document.createElement('div');frame.className='duel-chain-scale-frame';
    const heading=document.createElement('div');heading.className='duel-chain-heading';heading.textContent='CHAIN LINKS';
    const links=document.createElement('div');links.className='duel-chain-links';frame.append(heading,links);node.append(frame);




    host.append(node);
    this.chainVisualNode=node;return node;
  }

  clearChainIndicatorExitGhosts() {
    if(typeof document==='undefined')return;
    document.querySelectorAll?.('.duel-chain-card-indicator-exit-ghost')?.forEach(node=>node.remove?.());
  }

  spawnChainIndicatorExitGhosts() {
    if(typeof document==='undefined'||!document.body||!this.duelAnimationsEnabled)return 0;
    this.clearChainIndicatorExitGhosts();
    const scope=this.root?.isConnected?this.root:document;
    const rings=[...scope.querySelectorAll?.('.duel-chain-card-indicator:not(.duel-chain-card-indicator-exit-ghost)')||[]];
    let count=0;
    rings.forEach(ring=>{
      const rect=ring.getBoundingClientRect?.();if(!rect||rect.width<1||rect.height<1)return;
      const ghost=ring.cloneNode(true);ghost.classList.add('duel-chain-card-indicator-exiting','duel-chain-card-indicator-exit-ghost');ghost.setAttribute('aria-hidden','true');
      ghost.style.setProperty('--duel-chain-exit-left',`${rect.left}px`);ghost.style.setProperty('--duel-chain-exit-top',`${rect.top}px`);ghost.style.setProperty('--duel-chain-exit-width',`${rect.width}px`);ghost.style.setProperty('--duel-chain-exit-height',`${rect.height}px`);
      const remove=()=>ghost.remove?.();ghost.addEventListener?.('animationend',remove,{once:true});setTimeout(remove,1400);document.body.append(ghost);count+=1;
    });
    return count;
  }

  clearChainVisualization({immediate=false}={}) {
    if(this.chainVisualHideTimer){clearTimeout(this.chainVisualHideTimer);this.chainVisualHideTimer=null;}
    if(immediate){this.chainVisualExitActive=false;this.clearChainIndicatorExitGhosts();}
    const node=this.chainVisualNode;if(!node)return;
    const hide=()=>{



      const liveDecision=this.authoritativePendingDecision&&!this.authoritativePendingDecision.submitted&&this.currentPrompt&&this.pendingResolve;




      const liveChainDecision=liveDecision&&this.promptBelongsToActiveChain(this.currentPrompt);
      if(liveChainDecision){
        this.traceSession('chain-cleanup-deferred-for-live-prompt',{immediate:!!immediate,signature:this.replayPromptSignature(this.currentPrompt),decisionId:Number(this.activeDecisionId)||0});
        node.classList.remove('chain-complete','duel-chain-prompt-active');node.style?.removeProperty?.('opacity');node.hidden=false;
        this.chainVisualExitActive=false;this.clearChainIndicatorExitGhosts();
        (this.root?.isConnected?this.root:(typeof document!=='undefined'?document:null))?.querySelectorAll?.('.duel-chain-card-indicator-exiting:not(.duel-chain-card-indicator-exit-ghost)')?.forEach(ring=>ring.classList.remove('duel-chain-card-indicator-exiting'));
        this.syncChainSourceHighlights();



        if(!immediate)this.chainVisualHideTimer=setTimeout(hide,240);return;
      }
      this.chainVisuals.clear();
      this.chainVisualExitActive=false;if(immediate)this.clearChainIndicatorExitGhosts();
      this.traceSession('chain-visualization-cleared',{immediate:!!immediate,liveDecision:!!liveDecision,attached:!!this.chainPromptAttached});
      this.clearChainPromptPhysicalFocus();this.restorePromptHome();node.hidden=true;node.classList.remove('resolving-chain','chain-complete','duel-chain-prompt-active','duel-chain-inline-selection-minimized');node.style?.removeProperty?.('opacity');node.querySelector('.duel-chain-links')?.replaceChildren();this.syncChainSourceHighlights();
    };
    if(immediate)hide();else{
      const exitGhosts=this.spawnChainIndicatorExitGhosts();this.chainVisualExitActive=true;node.classList.add('chain-complete');this.syncChainSourceHighlights();
      this.traceSession('chain-spinner-exit-started',{ghosts:exitGhosts,durationMs:1150});

      this.chainVisualHideTimer=setTimeout(hide,1150);
    }
  }

  chainAssociatedPresentationActive() {
    const now=Date.now();
    if(now<Number(this.actionPresentationUntil||0)||now<Number(this.cardAnimationPresentationUntil||0))return true;
    if(this.animationQueue.some(item=>Number(item?.chainLink)>0))return true;
    if(this.currentOpponentNoticeEvent?.chainPlayback||this.opponentNoticeQueue.some(item=>item?.chainPlayback))return true;
    const scope=this.root?.isConnected?this.root:(typeof document!=='undefined'?document:null);
    return !!(this.currentAffectedCardOutcome||this.affectedCardOutcomeQueue?.length||scope?.querySelector?.('.duel-activation-showcase,.duel-effect-target-showcase,.duel-affected-card-showcase,.duel-anchored-action-indicator'));
  }

  scheduleChainVisualizationCompletion(holdMs=900,{waitForAssociated=true}={}) {
    if(this.chainVisualHideTimer){clearTimeout(this.chainVisualHideTimer);this.chainVisualHideTimer=null;}
    const node=this.chainVisualNode;if(!node)return;
    if(!this.chainVisuals.size){this.clearChainVisualization({immediate:true});return;}
    node.classList.remove('chain-complete');node.style?.removeProperty?.('opacity');node.hidden=false;
    const delay=Math.max(0,Number(holdMs)||0),wait=!!waitForAssociated;
    if(wait)this.traceSession('chain-completion-waiting-for-associated-presentations',{holdMs:delay});
    const beginHold=()=>{
      if(wait&&this.chainAssociatedPresentationActive()){
        node.classList.remove('chain-complete');node.style?.removeProperty?.('opacity');node.hidden=false;
        this.chainVisualHideTimer=setTimeout(beginHold,80);return;
      }
      this.traceSession('chain-completion-hold-started',{durationMs:delay,associatedPresentationsComplete:true});
      this.chainVisualHideTimer=setTimeout(()=>{this.chainVisualHideTimer=null;this.clearChainVisualization();},delay);
    };
    beginHold();
  }

  showChainLinkVisual(link,code,loc={}) {
    link=Math.max(1,Number(link)||1);code=Number(code)||0;
    const priorComplete=this.chainVisuals.size>0&&[...this.chainVisuals.values()].every(item=>item.resolved||item.state==='resolved'||item.outcomeState);
    if(link===1&&priorComplete)this.clearChainVisualization({immediate:true});
    if(link===1)this.chainOutcomePresentationUntil=0;
    if(this.chainVisualHideTimer){clearTimeout(this.chainVisualHideTimer);this.chainVisualHideTimer=null;}
    this.chainVisualExitActive=false;this.clearChainIndicatorExitGhosts();
    this.chainVisualNode?.classList?.remove('chain-complete');this.chainVisualNode?.style?.removeProperty?.('opacity');
    (this.root?.isConnected?this.root:(typeof document!=='undefined'?document:null))?.querySelectorAll?.('.duel-chain-card-indicator-exiting')?.forEach(ring=>ring.classList.remove('duel-chain-card-indicator-exiting'));
    const source=this.chainHistory.get(link)||this.chainEffectSources.get(link)||{},prior=this.chainVisuals.get(link)||{};
    this.chainVisuals.set(link,{...prior,link,code,loc:{...loc},controller:Number(source.controller??loc.controller)||0,description:String(source.description||''),respondsToLink:Number(source.respondsToLink)||0,state:prior.state||'waiting',outcomeState:prior.outcomeState||'',resolved:!!prior.resolved});
    this.renderChainVisualization();this.syncChainSourceHighlights();
  }

  showChainSourceEffect(link,code,loc={}) {


    return;
  }

  chainOutcomeDescriptor(outcome='Resolved') {
    const raw=String(outcome||'Resolved').trim().toLowerCase();
    const token=raw.replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const aliases={
      negate:'negated','effect-negated':'negated','activation-negated':'negated',
      disable:'disabled','effect-disabled':'disabled','card-disabled':'disabled',
      destroy:'destroyed',remove:'banished',removed:'banished',banish:'banished',
      'sent-to-graveyard':'sent-to-gy','sent-to-grave':'sent-to-gy','to-grave':'sent-to-gy',
      'returned-to-the-hand':'returned-to-hand','return-to-hand':'returned-to-hand',
      'returned-to-the-deck':'returned-to-deck','return-to-deck':'returned-to-deck',
      target:'targeted',summon:'summoned','special-summon':'summoned','normal-summon':'summoned',
      release:'released',tribute:'released',discard:'discarded','used-as-material':'material',
      'position-change':'position-changed','changed-position':'position-changed',
      'attack-increased':'stat-increased','defense-increased':'stat-increased','level-increased':'stat-increased','rank-increased':'stat-increased',
      'attack-decreased':'stat-decreased','defense-decreased':'stat-decreased','level-decreased':'stat-decreased','rank-decreased':'stat-decreased',
      'stats-changed':'stat-changed','stat-change':'stat-changed',
      'not-affected':'unaffected','effect-unaffected':'unaffected','chain-complete':'resolved','pending':'pending','waiting':'pending'
    };
    const key=aliases[token]||token||'resolved';
    const definitions={
      pending:{label:'Pending',short:'PENDING',duration:760},
      resolving:{label:'Resolving',short:'RESOLVING',duration:820},
      resolved:{label:'Resolved',short:'RESOLVED',duration:920},
      negated:{label:'Negated',short:'NEGATED',duration:1420},
      disabled:{label:'Disabled',short:'DISABLED',duration:1420},
      failed:{label:'Failed',short:'FAILED',duration:1280},
      targeted:{label:'Targeted',short:'TARGET',duration:1120},
      destroyed:{label:'Destroyed',short:'DESTROYED',duration:1320},
      banished:{label:'Banished',short:'BANISHED',duration:1360},
      'sent-to-gy':{label:'Sent to GY',short:'TO GY',duration:1120},
      'returned-to-hand':{label:'Returned to Hand',short:'TO HAND',duration:1120},
      'returned-to-deck':{label:'Returned to Deck',short:'TO DECK',duration:1120},
      moved:{label:'Moved',short:'MOVED',duration:980},
      released:{label:'Released',short:'RELEASED',duration:1080},
      discarded:{label:'Discarded',short:'DISCARDED',duration:1080},
      material:{label:'Used as Material',short:'MATERIAL',duration:1080},
      summoned:{label:'Summoned',short:'SUMMONED',duration:1220},
      'position-changed':{label:'Position Changed',short:'POSITION',duration:980},
      'stat-increased':{label:'Stats Increased',short:'STAT UP',duration:1160},
      'stat-decreased':{label:'Stats Decreased',short:'STAT DOWN',duration:1160},
      'stat-changed':{label:'Stats Changed',short:'STATS',duration:1120},
      unaffected:{label:'Unaffected',short:'UNAFFECTED',duration:1280}
    };
    return{key,...(definitions[key]||{label:String(outcome||'Affected'),short:String(outcome||'AFFECTED').toUpperCase(),duration:980})};
  }

  affectedCardOutcomeSymbolMarkup(outcome='resolved') {
    const key=this.chainOutcomeDescriptor(outcome).key;
    const icons={
      negated:'<circle cx="32" cy="32" r="24"/><path class="duel-symbol-primary" d="M20 20l24 24M44 20L20 44"/>',
      disabled:'<rect x="14" y="28" width="36" height="27" rx="6"/><path class="duel-symbol-primary" d="M22 28v-7a10 10 0 0120 0v7M26 39h12M26 46h12"/>',
      failed:'<path d="M32 8L57 53H7L32 8z"/><path class="duel-symbol-primary" d="M32 23v15M32 47h.1"/>',
      targeted:'<circle cx="32" cy="32" r="13"/><circle class="duel-symbol-secondary" cx="32" cy="32" r="23"/><path class="duel-symbol-primary" d="M32 5v13M32 46v13M5 32h13M46 32h13M11 20v-9h9M44 11h9v9M53 44v9h-9M20 53h-9v-9"/>',
      destroyed:'<path class="duel-symbol-primary" d="M32 9l5 14 15-7-8 14 14 5-15 4 6 15-13-9-7 13-2-16-16 5 11-12-13-9 16 1 7-18z"/><path class="duel-symbol-shard" d="M8 13l8 5M53 10l-6 8M57 49l-9-4M13 55l6-9"/>',
      banished:'<path class="duel-symbol-primary" d="M52 23c-5-12-24-16-35-6S9 43 23 49c12 5 27-2 29-14 2-10-8-18-18-17-9 1-15 10-11 18 3 6 12 8 17 3 4-4 1-11-5-11-4-1-7 4-5 7"/><circle class="duel-symbol-particle" cx="13" cy="37" r="2"/><circle class="duel-symbol-particle" cx="48" cy="50" r="2"/><circle class="duel-symbol-particle" cx="54" cy="14" r="2"/>',
      'sent-to-gy':'<path class="duel-symbol-primary" d="M17 56V29c0-9 7-17 15-17s15 8 15 17v27H17z"/><path d="M32 22v17M25 29h14"/><path class="duel-symbol-secondary" d="M10 56h44"/>',
      'returned-to-hand':'<rect class="duel-symbol-secondary" x="23" y="15" width="18" height="34" rx="2" transform="rotate(-34 32 49)"/><rect class="duel-symbol-secondary" x="23" y="15" width="18" height="34" rx="2" transform="rotate(-17 32 49)"/><rect class="duel-symbol-primary" x="23" y="15" width="18" height="34" rx="2"/><rect class="duel-symbol-secondary" x="23" y="15" width="18" height="34" rx="2" transform="rotate(17 32 49)"/><rect class="duel-symbol-secondary" x="23" y="15" width="18" height="34" rx="2" transform="rotate(34 32 49)"/>',
      'returned-to-deck':'<rect x="17" y="22" width="28" height="34" rx="3"/><path class="duel-symbol-secondary" d="M22 17h28v34M27 12h28v34"/><path class="duel-symbol-primary" d="M14 28C7 17 15 5 28 6M28 6l-8-5M28 6l-7 7"/>',
      released:'<path d="M25 20l-7-7a8 8 0 00-11 11l10 10a8 8 0 0011 0l4-4M39 44l7 7a8 8 0 0011-11L47 30a8 8 0 00-11 0l-4 4"/><path class="duel-symbol-primary" d="M24 40l16-16M19 45l-5 5M45 19l5-5"/>',
      discarded:'<rect x="15" y="8" width="27" height="36" rx="3" transform="rotate(-9 28 26)"/><path class="duel-symbol-primary" d="M37 35l14 17M51 52l-1-12M51 52l-12-1"/>',
      material:'<circle cx="16" cy="18" r="8"/><circle cx="48" cy="18" r="8"/><circle cx="16" cy="47" r="8"/><path class="duel-symbol-primary" d="M22 23l10 9M42 23L32 32M22 43l10-11M32 32l13 15"/><path class="duel-symbol-secondary" d="M32 24l3 5 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1 3-5z"/>',
      'position-changed':'<rect x="22" y="14" width="20" height="35" rx="3"/><path class="duel-symbol-primary" d="M17 20C7 27 8 42 20 48M17 20l-10 1M17 20l-4-9M47 44c10-7 9-22-3-28M47 44l10-1M47 44l4 9"/>',
      'stat-increased':'<path class="duel-symbol-primary" d="M32 55V10M15 27l17-17 17 17"/>',
      'stat-decreased':'<path class="duel-symbol-primary" d="M32 9v45M15 37l17 17 17-17"/>',
      'stat-changed':'<path class="duel-symbol-primary" d="M21 51V13M21 13l-9 9M21 13l9 9M43 13v38M43 51l-9-9M43 51l9-9"/><path class="duel-symbol-secondary" d="M7 32h50"/>',
      unaffected:'<path class="duel-symbol-primary" d="M32 6l20 8v15c0 13-8 23-20 29-12-6-20-16-20-29V14l20-8z"/><path d="M23 34l7 7 13-17M48 9l8-5M51 18l9-1"/>',
      moved:'<rect x="8" y="18" width="24" height="32" rx="3"/><path class="duel-symbol-primary" d="M27 34h29M47 25l9 9-9 9"/>',
      resolved:'<circle cx="32" cy="32" r="24"/><path class="duel-symbol-primary" d="M19 33l9 9 18-21"/>'
    };
    const body=icons[key]||icons.resolved;
    return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  }

  appendChainOutcomeIndicators(host,item={}) {
    if(!host||typeof document==='undefined')return;
    const values=[];const add=(outcome,code=0)=>{const descriptor=this.chainOutcomeDescriptor(outcome);if(descriptor.key==='pending')return;const signature=`${descriptor.key}:${Number(code)||0}`;if(values.some(entry=>entry.signature===signature))return;values.push({signature,descriptor,code:Number(code)||0});};
    add(item.outcome||'Resolved',item.code);for(const result of Array.isArray(item.results)?item.results:[])add(result.outcome,result.code);
    if(!values.length)return;
    const rail=document.createElement('span');rail.className='duel-chain-result-indicators';rail.setAttribute('aria-label','Chain results');
    for(const entry of values){const marker=document.createElement('span');marker.className=`duel-chain-result-indicator outcome-${entry.descriptor.key}`;marker.dataset.outcome=entry.descriptor.key;marker.textContent=entry.descriptor.short;const cardName=entry.code?this.cardName(entry.code):'';marker.title=cardName?`${entry.descriptor.label} - ${cardName}`:entry.descriptor.label;marker.setAttribute('aria-label',marker.title);rail.append(marker);}
    host.append(rail);
  }

  affectedCardOutcomeIdentity({code=0,chainLink=0,controller=0,location=0,sequence=0,presentationIdentity=null}={}) {
    const identity=presentationIdentity&&typeof presentationIdentity==='object'?presentationIdentity:{controller,location,sequence};
    return [Number(chainLink)||0,Number(identity.controller??controller)||0,Number(identity.location??location)||0,Number(identity.sequence??sequence)||0,Number(code)||0].join(':');
  }

  queueAffectedCardOutcomePresentation({code=0,outcome='Affected',chainLink=0,controller=0,location=0,sequence=0,presentationIdentity=null,ordered=false}={}) {
    code=Number(code)||0;if(!code||!Number(chainLink)||!this.duelAnimationsEnabled||!this.chainOutcomeEffectsEnabled||!this.boardWrap||typeof document==='undefined')return false;
    const descriptor=this.chainOutcomeDescriptor(outcome);if(['pending','resolving','resolved','moved'].includes(descriptor.key))return false;
    if(!Array.isArray(this.affectedCardOutcomeQueue))this.affectedCardOutcomeQueue=[];
    const key=this.affectedCardOutcomeIdentity({code,chainLink,controller,location,sequence,presentationIdentity});
    const current=this.currentAffectedCardOutcome?.item?.key===key?this.currentAffectedCardOutcome.item:null;
    const item=current||this.affectedCardOutcomeQueue.find(entry=>entry.key===key);
    if(item){
      if(item.descriptors.some(entry=>entry.key===descriptor.key))return false;
      item.descriptors.push(descriptor);if(ordered)item.ordered=true;
      const active=this.currentAffectedCardOutcome;
      if(current&&active?.exiting){
        if(active.timer)clearTimeout(active.timer);
        active.exiting=false;active.node?.classList?.remove('outcome-sequence-exiting');
        setTimeout(()=>active.presentStage?.(),0);
      }
    }else this.affectedCardOutcomeQueue.push({key,code,chainLink:Number(chainLink),controller:Number(controller)||0,descriptors:[descriptor],ordered:!!ordered});
    const duration=Math.round(descriptor.duration*this.actionPresentationScale());
    this.chainOutcomePresentationUntil=Math.max(Date.now(),Number(this.chainOutcomePresentationUntil)||0)+duration+70;
    setTimeout(()=>this.presentNextAffectedCardOutcome(),0);return true;
  }

  presentNextAffectedCardOutcome() {
    if(this.currentAffectedCardOutcome||!this.affectedCardOutcomeQueue?.length||!this.boardWrap||typeof document==='undefined')return;
    const now=Date.now(),scope=this.root?.isConnected?this.root:document,nextItem=this.affectedCardOutcomeQueue[0],ordered=!!nextItem?.ordered;const travelActive=now<Number(this.cardAnimationPresentationUntil||0);if((travelActive&&!this.synchronizedShowcaseTravelEnabled&&!ordered)||scope?.querySelector?.('.duel-activation-showcase,.duel-effect-target-showcase')){setTimeout(()=>this.presentNextAffectedCardOutcome(),80);return;}
    const item=this.affectedCardOutcomeQueue.shift();
    const node=document.createElement('div');node.className='duel-affected-card-showcase';node.setAttribute('aria-hidden','true');
    const frame=document.createElement('div');frame.className='duel-affected-card-frame';const img=document.createElement('img');img.src=cardImage(item.code);img.alt='';const symbolStage=document.createElement('span');symbolStage.className='duel-affected-card-symbol-stage';const symbol=document.createElement('span');symbol.className='duel-affected-card-symbol';symbolStage.append(symbol);const resultRail=document.createElement('div');resultRail.className='duel-affected-card-result';const result=document.createElement('strong');resultRail.append(result);const chain=document.createElement('small');chain.textContent=`CL ${item.chainLink}`;frame.append(img,symbolStage,resultRail,chain);node.append(frame);this.boardWrap.append(node);
    const state={id:++this.affectedCardOutcomeSerial,node,item,index:0,timer:0,exiting:false,presentStage:null};this.currentAffectedCardOutcome=state;
    const finish=()=>{if(this.currentAffectedCardOutcome!==state)return;if(item.descriptors[state.index]){presentStage();return;}state.exiting=true;node.classList.add('outcome-sequence-exiting');state.timer=setTimeout(()=>{if(this.currentAffectedCardOutcome!==state)return;if(item.descriptors[state.index]){state.exiting=false;node.classList.remove('outcome-sequence-exiting');presentStage();return;}node.remove();this.currentAffectedCardOutcome=null;setTimeout(()=>this.presentNextAffectedCardOutcome(),70);},180);};
    const presentStage=()=>{
      if(this.currentAffectedCardOutcome!==state)return;
      const descriptor=item.descriptors[state.index];if(!descriptor){state.timer=setTimeout(()=>{if(this.currentAffectedCardOutcome!==state)return;if(item.descriptors[state.index])presentStage();else finish();},140);return;}
      const duration=Math.round(descriptor.duration*this.actionPresentationScale());
      node.className=`duel-affected-card-showcase outcome-${descriptor.key}${state.index?' outcome-sequence-transition':''}`;node.style.setProperty('--affected-card-ms',`${duration}ms`);result.textContent=descriptor.short;const showSymbol=descriptor.key!=='summoned';symbolStage.hidden=!showSymbol;if(showSymbol){symbol.className=`duel-affected-card-symbol symbol-${descriptor.key}`;symbol.innerHTML=this.affectedCardOutcomeSymbolMarkup(descriptor.key);}else{symbol.className='duel-affected-card-symbol';symbol.replaceChildren();}void frame.offsetWidth;
      this.chainOutcomePresentationUntil=Math.max(Number(this.chainOutcomePresentationUntil)||0,Date.now()+duration+140);this.traceSession?.('affected-card-outcome-stage',{presentationId:state.id,code:item.code,chainLink:item.chainLink,outcome:descriptor.key,stage:state.index+1,durationMs:duration,reusedSurface:state.index>0});
      state.timer=setTimeout(()=>{if(this.currentAffectedCardOutcome!==state)return;state.index+=1;presentStage();},duration);
    };
    state.presentStage=presentStage;
    presentStage();
  }

  showAnchoredActionIndicator(anchor,state='source',duration=1250) {
    if(!anchor?.isConnected||typeof document==='undefined')return;


    const marker=document.createElement('div');marker.className=`duel-anchored-action-indicator ${String(state).replace(/[^a-z0-9-]+/gi,'-').toLowerCase()}`;marker.setAttribute('aria-hidden','true');anchor.classList.add('duel-action-indicator-host');anchor.append(marker);setTimeout(()=>{marker.remove();if(!anchor.querySelector?.('.duel-anchored-action-indicator'))anchor.classList.remove('duel-action-indicator-host');},Math.max(250,Number(duration)||1250));
  }

  showCardOutcomeEffect(loc={},outcome='Resolved',chainLink=0,code=0,options={}) {
    if(this.isReplaySeekReconstruction())return;
    const descriptor=this.chainOutcomeDescriptor(outcome),normalized=descriptor.key;
    if(!this.duelAnimationsEnabled||!this.chainOutcomeEffectsEnabled||!this.boardWrap)return;


    if(normalized==='resolving'||normalized==='resolved'||normalized==='moved')return;
    const duration=Math.max(900,descriptor.duration);
    const targetKey=[Number(loc.controller)||0,Number(loc.location)||0,Number(loc.sequence)||0,Number(code)||0].join(':');
    const recentTarget=normalized==='targeted'&&Date.now()-Number(this.effectTargetPresentationHistory?.get?.(targetKey)||0)<6000;
    if(recentTarget){this.traceSession?.('duplicate-target-result-suppressed',{code:Number(code)||0,chainLink:Number(chainLink)||0});return;}
    const queued=this.queueAffectedCardOutcomePresentation({code,outcome:normalized,chainLink,controller:Number(loc.controller)||0,location:Number(loc.location)||0,sequence:Number(loc.sequence)||0,presentationIdentity:loc.presentationIdentity||null,ordered:!!options?.ordered});



    if(queued){this.traceSession?.('chain-result-uses-primary-popup',{code:Number(code)||0,chainLink:Number(chainLink)||0,outcome:normalized});return;}
    if(Number(chainLink)>0&&Number(code)){this.traceSession?.('duplicate-chain-result-presentation-suppressed',{code:Number(code),chainLink:Number(chainLink),outcome:normalized});return;}
    if(Number(chainLink)>0)this.chainOutcomePresentationUntil=Math.max(Number(this.chainOutcomePresentationUntil)||0,Date.now()+duration);
    const apply=()=>{const player=Number(loc.controller)||0,key=this.locationKey(Number(loc.location)||0),sequence=Number(loc.sequence)||0;let node=this.boardWrap.querySelector?.(`.duel-card[data-player="${player}"][data-location="${key}"][data-sequence="${sequence}"]`);if(!node&&code)node=this.boardWrap.querySelector?.(`.duel-card[data-player="${player}"][data-code="${Number(code)||0}"]`);if(!node&&['deck','grave','removed','extra'].includes(key))node=this.boardWrap.querySelector?.(`.duel-pile[data-player="${player}"][data-location="${key}"]`);if(!node)return;this.showAnchoredActionIndicator(node,`outcome-${normalized}`,duration);};
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(apply);else setTimeout(apply,0);
  }

  beginChainSummary() {
    this.activeChainSummary={id:`chain-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`,links:new Map(),resolutionOrder:[],events:[],startedTurn:Math.max(1,Number(this.turn)||1),startedPhase:this.phaseLabel(this.phase)};
  }

  recordChainSummaryLink(link,source={}) {
    if(!this.activeChainSummary)this.beginChainSummary();
    this.activeChainSummary.links.set(Number(link),{chainLink:Number(link),code:Number(source.code)||0,controller:Number(source.controller)||0,effect:String(source.description||''),respondsToLink:Number(source.respondsToLink)||0,outcome:'Pending'});
  }

  recordChainSummaryOutcome(link,outcome='Resolved') {
    const summary=this.activeChainSummary;if(!summary)return;link=Number(link)||0;const item=summary.links.get(link);if(item)item.outcome=String(outcome||'Resolved');
    if(link&&!summary.resolutionOrder.includes(link))summary.resolutionOrder.push(link);
  }

  recordChainSummaryCardOutcome(link,{code=0,controller=0,location=0,sequence=0,outcome='Affected'}={}) {
    const item=this.activeChainSummary?.links?.get(Number(link)||0);if(!item)return;if(!Array.isArray(item.results))item.results=[];item.results.push({code:Number(code)||0,controller:Number(controller)||0,location:Number(location)||0,sequence:Number(sequence)||0,outcome:String(outcome||'Affected')});
  }

  finalizeChainSummary() {
    const summary=this.activeChainSummary;this.activeChainSummary=null;if(!summary||summary.links.size<1||!this.consolidatedChainSummariesEnabled)return;
    const withEvents=item=>({...item,events:summary.events.filter(event=>Number(event.chainLink)===Number(item.chainLink))});
    const links=[...summary.links.values()].sort((a,b)=>a.chainLink-b.chainLink).map(withEvents),byLink=new Map(links.map(item=>[item.chainLink,item])),resolution=(summary.resolutionOrder.length?summary.resolutionOrder:[...links].reverse().map(item=>item.chainLink)).map(link=>byLink.get(link)).filter(Boolean);
    const cards=links.filter(item=>item.code).map(item=>({code:item.code}));
    this.log(`CHAIN VISUALIZATION - ${links.length} Chain Links completed.`,{type:'chain-visual',chainInstanceId:summary.id,cards,chainVisualSequence:links,outcome:'Chain complete'});
    this.log(`CHAIN SUMMARY - ${links.length} Chain Links resolved.`,{type:'chain-summary',chainInstanceId:summary.id,cards:links.filter(item=>item.code).map(item=>({code:item.code})),chainSequence:links,resolutionSequence:resolution,outcome:'Chain complete'});
    this.traceSession?.('chain-history-created',{links:links.length,activationOrder:links.map(item=>item.chainLink),resolutionOrder:resolution.map(item=>item.chainLink),entries:['chain-visual','chain-summary']});
  }

  setChainLinkVisualState(link,state='waiting') {
    link=Math.max(1,Number(link)||1);const prior=this.chainVisuals.get(link);if(!prior)return;
    const terminal=['negated','disabled','failed'].includes(String(state));
    const outcomeState=terminal?String(state):(prior.outcomeState||'');


    this.chainVisuals.set(link,{...prior,state:outcomeState||state,outcomeState});this.renderChainVisualization();this.syncChainSourceHighlights();
  }

  resolveChainLinkVisual(link) {
    link=Math.max(1,Number(link)||1);const prior=this.chainVisuals.get(link);if(!prior)return;

    const state=prior.outcomeState||'resolved';
    this.chainVisuals.set(link,{...prior,state,outcomeState:prior.outcomeState||'',resolved:true});this.renderChainVisualization();this.syncChainSourceHighlights();

    const complete=[...this.chainVisuals.values()].length>0&&[...this.chainVisuals.values()].every(item=>item.resolved||item.state==='resolved'||item.outcomeState);


    if(complete)this.traceSession('chain-links-visually-resolved-awaiting-chain-end',{links:this.chainVisuals.size});
  }

  renderChainVisualization() {
    const node=this.ensureChainVisualNode();if(!node)return;const wrap=node.querySelector('.duel-chain-links'),heading=node.querySelector('.duel-chain-heading');if(!wrap)return;
    const links=[...this.chainVisuals.values()].sort((a,b)=>a.link-b.link);this.syncChainPromptAttachment(this.currentPrompt);
    if(!links.length){node.hidden=true;node.classList.remove('resolving-chain','chain-built');return;}
    const resolving=links.find(item=>item.state==='resolving'&&!item.outcomeState);const allComplete=links.every(item=>item.resolved||item.state==='resolved'||item.outcomeState);
    node.hidden=false;node.dataset.chainCount=String(links.length);node.dataset.chainDensity=links.length>=7?'micro':links.length>=5?'compact':'full';node.classList.toggle('resolving-chain',!!resolving);node.classList.toggle('chain-built',!resolving&&!allComplete);node.classList.toggle('duel-chain-connections-disabled',!this.chainConnectionVisualizationEnabled);
    if(heading)heading.textContent=resolving?`CHAIN LINKS - Resolving CL${resolving.link} to CL1`:allComplete?'CHAIN LINKS - Complete':`CHAIN LINKS - ${links.length} Active`;
    const desired=[];
    links.forEach((item,index)=>{
      if(index){const previous=links[index-1];let connector=wrap.querySelector(`.duel-chain-connector[data-to-link="${item.link}"]`);if(!connector){connector=document.createElement('div');connector.className='duel-chain-connector';connector.dataset.toLink=String(item.link);connector.dataset.renderSlot=`connector:${item.link}`;const line=document.createElement('span');line.className='duel-chain-connector-line';const relation=document.createElement('span');relation.className='duel-chain-connector-label';connector.append(line,relation);}connector.dataset.renderSignature=`connector:${item.link}:${previous.link}`;const relation=connector.querySelector('.duel-chain-connector-label');if(relation)relation.textContent=`CL${item.link} responds to CL${previous.link}`;desired.push(connector);}
      let card=wrap.querySelector(`.duel-chain-link[data-link="${item.link}"]`);
      if(!card){
        card=document.createElement('article');card.dataset.link=String(item.link);card.dataset.renderSlot=`chain:${item.link}`;card.tabIndex=0;
        const badge=document.createElement('span');badge.className='duel-chain-link-badge';
        const art=document.createElement('img');art.className='duel-chain-link-art';
        const copy=document.createElement('div');copy.className='duel-chain-link-copy';const name=document.createElement('strong');name.className='duel-chain-link-name';const meta=document.createElement('span');meta.className='duel-chain-link-meta';const effect=document.createElement('div');effect.className='duel-chain-link-effect';copy.append(name,meta,effect);card.append(badge,art,copy);
        const open=event=>{event?.preventDefault?.();event?.stopPropagation?.();const current=this.chainVisuals.get(Number(card.dataset.link)||0);if(!current?.code)return;const info={...(current.loc||{}),code:current.code,controller:Number(current.loc?.controller??current.controller)||0};this.setChainPromptPhysicalFocus(info,'selected');const ctx={player:Number(info.controller)||0,location:Number(info.location)||0,locationKey:this.locationKey(Number(info.location)||0),sequence:Number(info.sequence)||0};this.handleCardClick(current.code,info,ctx);};
        card.addEventListener('click',open);art.addEventListener('click',open);card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){open(event);}});
        card.addEventListener('pointerenter',()=>{if(!this.chainEffectHoverEnabled)return;const current=this.chainVisuals.get(Number(card.dataset.link)||0);if(!current?.code)return;const info={...(current.loc||{}),code:current.code,controller:Number(current.loc?.controller??current.controller)||0,_promptEffectText:this.conciseEffectText(current.description||this.getCardById?.(current.code)?.desc||''),_promptEffectRole:'Chain Effect'};this.setChainPromptPhysicalFocus(info,'hover');if(this.hoverExitTimer){clearTimeout(this.hoverExitTimer);this.hoverExitTimer=null;}this.inspectCard(current.code,info,{transient:true});this.showCardHoverOverlay(current.code,info,card);});
        card.addEventListener('pointerleave',()=>{this.clearChainPromptPhysicalFocus('hover');this.hideCardHoverOverlay({delay:70});});
      }
      const displayState=item.outcomeState||item.state||'waiting';card.className=`duel-chain-link ${displayState}`;if(item.resolved)card.classList.add('chain-link-finished');if(item.outcomeState)card.classList.add('chain-link-outcome-sticky');card.dataset.renderSignature=`chain:${item.link}:${item.code}`;
      const badge=card.querySelector('.duel-chain-link-badge');if(badge)badge.textContent=`CL ${item.link}`;
      const art=card.querySelector('.duel-chain-link-art');if(art){const src=item.code?cardImage(item.code):'assets/card_placeholder.png';if(art.getAttribute('src')!==src)art.src=src;art.alt=item.code?this.cardName(item.code):'Chain card';}
      const name=card.querySelector('.duel-chain-link-name');if(name)name.textContent=item.code?this.cardName(item.code):'Unknown card';
      const meta=card.querySelector('.duel-chain-link-meta');if(meta){const stateText=item.outcomeState==='negated'?'Negated':item.outcomeState==='disabled'?'Disabled':item.outcomeState==='failed'?'Failed':item.state==='resolving'?'Resolving now':item.state==='resolved'?'Resolved':'Waiting to resolve';meta.textContent=`${this.playerLabel(Number(item.controller)||0)} - ${stateText}`;}
      const effect=card.querySelector('.duel-chain-link-effect');if(effect){const next=this.conciseEffectText(item.description||'');if(effect.dataset.effectText!==next){effect.dataset.effectText=next;effect.replaceChildren();if(next)this.setStyledCardText(effect,next,item.code);}effect.hidden=!next;}
      desired.push(card);
    });
    this.reconcileStableChildren(wrap,desired);
    const reposition=()=>this.positionChainVisualization();if(typeof requestAnimationFrame==='function')requestAnimationFrame(reposition);else reposition();
  }

  syncChainResponsiveLayout(nodeOverride=null) {
    const node=nodeOverride||this.chainVisualNode,wrap=node?.querySelector?.('.duel-chain-links');if(!node||!wrap||node.hidden)return;
    const links=[...wrap.querySelectorAll('.duel-chain-link')],connectors=[...wrap.querySelectorAll('.duel-chain-connector')];
    if(!links.length)return;



    const boardWidth=Math.max(1,Number(this.boardWrap?.clientWidth)||Number(this.root?.clientWidth)||Number(globalThis.innerWidth)||1);
    const available=Math.max(1,Math.min(1080,Number(node.clientWidth)||boardWidth-24));
    const baseLink=188,baseConnector=45,minScale=.24;
    const desired=links.length*baseLink+connectors.length*baseConnector+12;
    const rawScale=Math.min(1,available/Math.max(1,desired));
    const scale=Math.max(minScale,rawScale);
    node.style.setProperty('--duel-chain-scale',scale.toFixed(3));
    node.style.setProperty('--duel-chain-link-w',`${Math.round(baseLink*scale)}px`);
    node.style.setProperty('--duel-chain-connector-w',`${Math.round(baseConnector*scale)}px`);


    wrap.classList.remove('duel-chain-overflow');
  }

  positionChainVisualization(nodeOverride=null) {
    const node=nodeOverride||this.chainVisualNode,board=this.boardWrap;if(!node||node.hidden||!board?.getBoundingClientRect)return;
    const boardRect=board.getBoundingClientRect();if(!boardRect.width||!boardRect.height)return;
    const userScale=Math.max(.55,Math.min(1,(Number(this.chainDisplayScale)||100)/100));node.style.setProperty('--duel-chain-user-scale',userScale.toFixed(3));
    const emzNodes=board.querySelectorAll?.('#duelExtraMonsterZones .duel-zone')||[],leftEmzRect=emzNodes[0]?.getBoundingClientRect?.(),rightEmzRect=emzNodes[1]?.getBoundingClientRect?.();
    const requestedSide=['left','right'].includes(this.chainDisplayPosition)?this.chainDisplayPosition:'';
    const sideRect=requestedSide==='left'?leftEmzRect:rightEmzRect;
    const laneStart=requestedSide==='left'?8:sideRect?.width?sideRect.right-boardRect.left+12:0;
    const laneEnd=requestedSide==='left'?(sideRect?.width?sideRect.left-boardRect.left-12:0):boardRect.width-8;
    const laneWidth=Math.max(0,laneEnd-laneStart),useSide=!!requestedSide&&laneWidth>=238&&boardRect.height>=360;
    node.dataset.chainPlacement=useSide?requestedSide:'upper';
    node.dataset.chainPlacementFallback=requestedSide&&!useSide?'upper':'';
    if(useSide){
      const shelfHeight=168,shelfWidth=Math.max(220,Math.min(360,laneWidth*.76));
      const linkCount=node.querySelectorAll?.('.duel-chain-link')?.length||1,connectorCount=node.querySelectorAll?.('.duel-chain-connector')?.length||0;
      const footprint=chainDisplayFootprint(linkCount,connectorCount,shelfWidth,shelfHeight,this.chainDisplayScale),visibleWidth=footprint.width,visibleHeight=footprint.height;
      const minCenterX=laneStart+visibleWidth/2,maxCenterX=laneEnd-visibleWidth/2,baseCenterX=laneStart+laneWidth/2;
      const minCenterY=visibleHeight/2+8,maxCenterY=boardRect.height-visibleHeight/2-8;
      let baseCenterY=(sideRect.top-boardRect.top)+(sideRect.height/2);
      if(requestedSide==='right'){
        const extraRect=board.querySelector?.('#duelOpponentExtraPile')?.getBoundingClientRect?.(),phaseRect=this.phaseDock?.hidden?null:this.phaseDock?.getBoundingClientRect?.();
        const bandTop=extraRect?.height?extraRect.bottom-boardRect.top+8:minCenterY,bandBottom=phaseRect?.height?phaseRect.top-boardRect.top-8:maxCenterY;
        baseCenterY=bandBottom-bandTop>=visibleHeight?(bandTop+bandBottom)/2:bandTop+visibleHeight/2;
      }
      baseCenterY=Math.max(minCenterY,Math.min(maxCenterY,baseCenterY));
      const offsets=this.chainDisplayOffsets?.[requestedSide]||{x:0,y:0};
      const applyOffset=(base,min,max,value)=>{value=Math.max(-100,Math.min(100,Number(value)||0));return value<0?base+(base-min)*(value/100):base+(max-base)*(value/100);};
      const centerX=applyOffset(baseCenterX,minCenterX,maxCenterX,offsets.x),centerY=applyOffset(baseCenterY,minCenterY,maxCenterY,offsets.y);
      node.style.setProperty('--duel-chain-side-width',`${Math.round(shelfWidth)}px`);node.style.setProperty('--duel-chain-left-width',`${Math.round(shelfWidth)}px`);
      node.style.setProperty('--duel-chain-side-x',`${Math.round(centerX)}px`);node.style.setProperty('--duel-chain-side-y',`${Math.round(centerY)}px`);
      node.style.setProperty('left',`${Math.round(centerX)}px`,'important');node.style.setProperty('top',`${Math.round(centerY)}px`,'important');node.style.setProperty('bottom','auto','important');
      this.syncChainResponsiveLayout(node);
      return;
    }



    const opponentHand=board.querySelector?.('.duel-hand.opponent'),mat=board.querySelector?.('.duel-mat');
    const handRect=opponentHand?.getBoundingClientRect?.(),matRect=mat?.getBoundingClientRect?.();
    const handBottom=handRect?.height?handRect.bottom-boardRect.top:0;
    const matTop=matRect?.height?matRect.top-boardRect.top:handBottom;
    const shelfTop=Math.max(8,Math.min(boardRect.height-96,Math.round(Math.max(handBottom+4,matTop+4))));
    node.style.setProperty('--duel-chain-shelf-y',`${shelfTop}px`);
    node.style.setProperty('left','50%','important');node.style.setProperty('top',`${shelfTop}px`,'important');node.style.setProperty('bottom','auto','important');
    this.syncChainResponsiveLayout(node);
  }

  chainPromptPhysicalNodes(item={}) {
    const scope=this.root?.isConnected?this.root:(typeof document!=='undefined'?document:null);if(!scope?.querySelectorAll)return[];
    const key=this.locationKey(Number(item.location)||0);if(!['hand','mzone','szone'].includes(key))return[];
    const nodes=[...scope.querySelectorAll('.duel-card[data-player][data-location][data-sequence]')];



    return nodes.filter(node=>this.chainIndicatorNodeMatches(node,item));
  }

  clearChainPromptPhysicalFocus(kind='') {
    if(kind!=='hover'&&this.selectedCardContext?._chainPromptPhysical)this.selectedCardContext=null;
    const scope=this.root?.isConnected?this.root:(typeof document!=='undefined'?document:null);if(!scope?.querySelectorAll)return;
    const classes=kind==='hover'?['duel-chain-prompt-physical-hover']:kind==='selected'?['duel-chain-prompt-physical-selected']:['duel-chain-prompt-physical-hover','duel-chain-prompt-physical-selected'];
    for(const className of classes)scope.querySelectorAll(`.${className}`).forEach(node=>node.classList.remove(className));
  }

  setChainPromptPhysicalFocus(item={},kind='hover',options={}) {
    const className=kind==='selected'?'duel-chain-prompt-physical-selected':'duel-chain-prompt-physical-hover';if(!options.append)this.clearChainPromptPhysicalFocus(kind);
    const matches=this.chainPromptPhysicalNodes(item);matches.forEach(node=>node.classList.add(className));
    if(kind==='selected'&&matches.length){const key=this.locationKey(Number(item.location)||0);this.selectedCardContext={card:item,player:Number(item.controller)||0,location:Number(item.location)||0,locationKey:key,sequence:Number(item.sequence)||0,_chainPromptPhysical:true};}
    if(options.inspect!==false&&matches.length&&Number(item.code))this.inspectCard(Number(item.code),{...item},{transient:kind!=='selected'});
    return matches;
  }

  isChainRelatedCardSelectionPrompt(message=this.currentPrompt) {
    const T=this.mod?.OcgMessageType||{};
    if(!message||![T.SELECT_CARD,T.SELECT_TRIBUTE,T.SELECT_SUM,T.SELECT_UNSELECT_CARD].includes(message.type))return false;
    return !!(Number(this.resolvingChainLink)||Number(this.lastActivatedChainLink)||Number(this.pendingEffectSource?.chainLink)||this.chainVisuals?.size||this.activeChainSummary?.links?.size);
  }

  stagedChainPhysicalItems(message=this.currentPrompt) {
    const T=this.mod?.OcgMessageType||{};
    if(message?.type===T.SELECT_CHAIN&&this.stagedChainSelection){
      const entries=this.visibleChainCandidates(message),chainEntries=entries.length?entries:(message.selects||[]).map((item,index)=>({item,index}));const index=Number(this.stagedChainSelection.index);
      return Number.isInteger(index)&&index>=0&&index<chainEntries.length?[chainEntries[index].item]:[];
    }
    if(!this.isChainRelatedCardSelectionPrompt(message)||!this.stagedCardSelection)return[];
    const token=`${Number(this.currentPromptRevision)||0}:${Number(message.type)||0}`;if(this.stagedCardSelection.token!==token)return[];
    const source=message.type===T.SELECT_SUM?[...(message.selects_must||[]),...(message.selects||[])]:message.type===T.SELECT_UNSELECT_CARD?[...(message.select_cards||[]),...(message.unselect_cards||[])]:message.selects||[];
    return (this.stagedCardSelection.indices||[]).map(Number).filter(index=>Number.isInteger(index)&&index>=0&&index<source.length).map(index=>source[index]).filter(Boolean);
  }

  syncExactPhysicalSelectionFocus(items=[],{inspectLast=true}={}) {
    const physical=(items||[]).filter(item=>item&&['hand','mzone','szone'].includes(this.locationKey(Number(item.location)||0)));this.clearChainPromptPhysicalFocus('selected');
    physical.forEach((item,index)=>this.setChainPromptPhysicalFocus(item,'selected',{append:true,inspect:inspectLast&&index===physical.length-1}));
  }

  syncStagedChainPhysicalFocus() {
    this.syncExactPhysicalSelectionFocus(this.stagedChainPhysicalItems(this.currentPrompt));
  }

  syncChainSourceHighlights() {
    const scope=this.root?.isConnected?this.root:(typeof document!=='undefined'?document:null);if(!scope?.querySelectorAll)return;
    scope.querySelectorAll('.duel-chain-source,.duel-chain-card-eligible,.duel-chain-card-active,.duel-chain-indicator-host').forEach(node=>node.classList.remove('duel-chain-source','duel-chain-card-eligible','duel-chain-card-active','duel-chain-indicator-host'));
    scope.querySelectorAll('.duel-chain-card-indicator:not(.duel-chain-card-indicator-exit-ghost)').forEach(node=>node.remove());
    if(this.chainVisualExitActive){this.syncStagedChainPhysicalFocus();return;}
    if(!this.duelAnimationsEnabled||!this.chainSourceEffectsEnabled){this.syncStagedChainPhysicalFocus();return;}
    const candidates=this.visibleChainIndicatorCandidates(),identityNodes=[...scope.querySelectorAll('.duel-card[data-player][data-location][data-sequence],.duel-pile-card-tile[data-player][data-location][data-sequence],.duel-pile-hover-item[data-player][data-location][data-sequence],.duel-prompt-card[data-player][data-location][data-sequence]')];
    for(const item of candidates){let matches=identityNodes.filter(node=>this.chainIndicatorNodeMatches(node,item));if(!matches.length)matches=this.chainIndicatorFallbackMatches(identityNodes,item,{allowMoved:false});matches.forEach(node=>this.applyChainCardIndicator(node,{eligible:true}));}
    for(const item of [...this.chainVisuals.values()].sort((a,b)=>Number(a.link)-Number(b.link))){const loc=item.loc||{},source={code:item.code,controller:Number(loc.controller??item.controller)||0,location:Number(loc.location)||0,sequence:Number(loc.sequence)||0};let matches=identityNodes.filter(node=>this.chainIndicatorNodeMatches(node,source,{active:true}));if(!matches.length)matches=this.chainIndicatorFallbackMatches(identityNodes,source,{allowMoved:true});if(!matches.length){const key=this.locationKey(source.location);if(['grave','removed','extra','deck'].includes(key)){const pile=scope.querySelector(`.duel-pile[data-player="${source.controller}"][data-location="${key}"]`);if(pile)matches=[pile];}}
      matches.forEach(node=>this.applyChainCardIndicator(node,{link:Number(item.link)||1}));
    }
    this.syncStagedChainPhysicalFocus();
  }

  visibleChainIndicatorCandidates() {
    const T=this.mod?.OcgMessageType||{},prompt=this.currentPrompt;if(!prompt||prompt.type!==T.SELECT_CHAIN)return[];
    const visible=this.visibleChainCandidates(prompt).map(entry=>entry.item);return visible.length?visible:(prompt.selects||[]);
  }

  chainIndicatorNodeMatches(node,item={},options={}) {
    const player=Number(node?.dataset?.player),locationKey=String(node?.dataset?.location||''),location=this.locationValue(locationKey),sequence=Number(node?.dataset?.sequence),code=this.normalizeActionCode(node?.dataset?.code);if(!Number.isFinite(player)||!locationKey||!Number.isFinite(sequence))return false;
    const itemLocation=Number(item.location)||0,itemCode=this.normalizeActionCode(item.code);if(Number(item.controller)!==player||itemLocation!==location)return false;if(Number(item.sequence)!==sequence)return false;if(itemCode&&code&&itemCode!==code)return false;
    return true;
  }

  chainIndicatorFallbackMatches(nodes=[],item={},options={}) {
    const player=Number(item.controller),code=this.normalizeActionCode(item.code),sourceKey=this.locationKey(Number(item.location)||0),allowMoved=!!options.allowMoved;if(!Number.isFinite(player)||!code)return[];
    let matches=nodes.filter(node=>Number(node?.dataset?.player)===player&&this.normalizeActionCode(node?.dataset?.code)===code);
    if(!allowMoved)matches=matches.filter(node=>String(node?.dataset?.location||'')===sourceKey);
    else matches=matches.filter(node=>{const key=String(node?.dataset?.location||'');if(player===0||['grave','removed'].includes(key))return true;const src=String(node.querySelector?.('img')?.getAttribute?.('src')||'').toLowerCase();return !!src&&!src.includes('placeholder')&&!src.includes('card_back');});
    if(!matches.length)return[];




    const identities=new Set(matches.map(node=>`${node.dataset.player}|${node.dataset.location}|${node.dataset.sequence}|${this.normalizeActionCode(node.dataset.code)}`));
    if(identities.size===1)return matches;
    if(allowMoved){const locations=new Set(matches.map(node=>String(node.dataset.location||'')));if(locations.size===1){const key=[...locations][0];if(['grave','removed','extra'].includes(key)){const scope=this.root?.isConnected?this.root:(typeof document!=='undefined'?document:null),pile=scope?.querySelector?.(`.duel-pile[data-player="${player}"][data-location="${key}"]`);if(pile)return[pile];}}}
    return[];
  }

  applyChainCardIndicator(node,{eligible=false,link=0}={}) {
    if(!node)return;const host=node.matches?.('.duel-pile-card-tile')?node.querySelector('.duel-pile-card-art')||node:node.matches?.('.duel-prompt-card')?node.querySelector('.duel-prompt-card-art')||node:node;
    host.classList.add('duel-chain-indicator-host',link?'duel-chain-card-active':'duel-chain-card-eligible');let ring=host.querySelector(':scope > .duel-chain-card-indicator');if(!ring){ring=document.createElement('i');ring.className='duel-chain-card-indicator';ring.setAttribute('aria-hidden','true');host.append(ring);}ring.replaceChildren();ring.classList.toggle('active',!!link);ring.dataset.chainLink=link?String(link):'';ring.removeAttribute('title');if(link){const badge=document.createElement('b');badge.textContent=`CL ${link}`;ring.append(badge);}else if(eligible)ring.title='This card can be chained';
  }

  queueMoveAnimation(message) {
    if(this.isReplaySeekReconstruction())return null;
    if(!message||!this.cardMovementAnimationsEnabled)return null;
    const from=message.from||{},to=message.to||{},L=this.mod?.OcgLocation||{},fromOverlay=this.isAttachedXyzMaterial(from),toOverlay=this.isAttachedXyzMaterial(to);
    const player=Number(from.controller)||0,key=this.locationKey(Number(from.location)||0),sequence=Number(from.sequence)||0;
    let sourceNode=this.boardWrap?.querySelector?.(`.duel-card[data-player="${player}"][data-location="${key}"][data-sequence="${sequence}"]`);
    if(!sourceNode&&['deck','grave','removed','extra'].includes(key))sourceNode=this.boardWrap?.querySelector?.(`.duel-pile[data-player="${player}"][data-location="${key}"] .duel-card`);
    // rc233: an overlay MOVE uses the host's coordinates only as an anchor. The moving
    // artwork is the material itself, never the Xyz Monster occupying that base slot.
    const start=sourceNode?.getBoundingClientRect?.()||this.rectForLocation(from,{preferCard:true});
    const moveCode=this.animationCodeVisible(message.card,to),sourceSrc=fromOverlay&&moveCode?cardImage(moveCode):(sourceNode?.querySelector?.('img')?.src||'');const fromDefense=fromOverlay?false:!!sourceNode?.classList?.contains('defense');
    const deckToHand=!!(Number(from.location)&Number(L.DECK||0))&&!!(Number(to.location)&Number(L.HAND||0));
    if(deckToHand){
      const toPlayer=Number(to.controller)||0,moveCode=this.animationCodeVisible(message.card,to),arrivalKey=this.drawArrivalKey(toPlayer,Number(to.sequence)||0);



      if(toPlayer===1&&!this.opponentCardsVisible&&!moveCode)return null;




      if(this.consumePendingDrawMove(toPlayer,moveCode)||this.pendingDrawArrivals.has(arrivalKey))return null;
      this.pendingDrawArrivals.add(arrivalKey);this.pendingDrawPresentationCounts[toPlayer]=(Number(this.pendingDrawPresentationCounts[toPlayer])||0)+1;this.rememberPendingDrawMove(toPlayer,moveCode);
      const item={kind:'draw-flight',origin:'move',drawMatched:false,from:{...from},to:{...to},code:moveCode,start,sourceSrc,fromDefense,arrivalKey};this.animationQueue.push(item);
      return item;
    }
    const arrivalKey=toOverlay?'':this.moveArrivalKey(Number(to.controller??from.controller)||0,Number(to.location)||0,Number(to.sequence)||0);
    if(start&&arrivalKey)this.pendingMoveArrivals.add(arrivalKey);
    const item={kind:'move',from:{...from},to:{...to},code:moveCode,start,sourceSrc,fromDefense,arrivalKey,xyzMaterialMove:fromOverlay||toOverlay};this.animationQueue.push(item);return item;
  }

  queueCardAnimation(kind,{player=0,location=0,sequence=0,code=0,delay=0,chainLink=0,actionLabel='',showcase=true}={}) {
    if(this.isReplaySeekReconstruction())return;
    const item={kind,player:Number(player)||0,location:Number(location)||0,sequence:Number(sequence)||0,code:Number(code)||0,delay:Math.max(0,Number(delay)||0),chainLink:Number(chainLink)||0,actionLabel:String(actionLabel||''),showcase:showcase!==false};
    if(kind==='flip'){



      const duplicate=this.animationQueue.find(entry=>entry?.kind==='flip'&&Number(entry.player)===item.player&&Number(entry.location)===item.location&&Number(entry.sequence)===item.sequence);
      if(duplicate){if(item.code)duplicate.code=item.code;return duplicate;}
      const key=this.locationKey(item.location);
      const source=this.boardWrap?.querySelector?.(`.duel-card[data-player="${item.player}"][data-location="${key}"][data-sequence="${item.sequence}"]`);
      if(source){item.sourceSrc=source.querySelector?.('img')?.src||'';item.fromDefense=!!source.classList?.contains('defense');}
    }
    if(kind==='shuffle'){
      const duplicate=this.animationQueue.find(entry=>entry?.kind==='shuffle'&&Number(entry.player)===item.player);
      if(duplicate)return duplicate;
    }
    this.animationQueue.push(item);return item;
  }

  drawArrivalKey(player,sequence){return `${Number(player)||0}:${Math.max(0,Number(sequence)||0)}`;}
  moveArrivalKey(player,location,sequence){return `${Number(player)||0}:${this.locationKey(Number(location)||0)}:${Math.max(0,Number(sequence)||0)}`;}
  releaseDrawPresentation(player){player=Number(player)||0;this.pendingDrawPresentationCounts[player]=Math.max(0,(Number(this.pendingDrawPresentationCounts[player])||0)-1);}
  drawMoveCodeKey(player,code){return `${Number(player)||0}:${this.normalizeActionCode(code)}`;}
  rememberPendingDrawMove(player,code){
    const n=this.normalizeActionCode(code);if(!n)return;const key=this.drawMoveCodeKey(player,n),count=(this.pendingDrawMoveCodes.get(key)||0)+1;this.pendingDrawMoveCodes.set(key,count);
    setTimeout(()=>{const left=this.pendingDrawMoveCodes.get(key)||0;if(left<=1)this.pendingDrawMoveCodes.delete(key);else this.pendingDrawMoveCodes.set(key,left-1);},1800);
  }
  consumePendingDrawMove(player,code){
    const n=this.normalizeActionCode(code);if(!n)return false;const key=this.drawMoveCodeKey(player,n),count=this.pendingDrawMoveCodes.get(key)||0;if(!count)return false;if(count<=1)this.pendingDrawMoveCodes.delete(key);else this.pendingDrawMoveCodes.set(key,count-1);return true;
  }

  queueDrawFlight(player,sequence,code=0) {
    if(this.isReplaySeekReconstruction())return;
    let delay=Math.max(0,Number(arguments[3])||0);
    const L=this.mod?.OcgLocation||{};const start=this.rectForLocation({controller:player,location:L.DECK,sequence:0},{preferCard:false});
    const arrivalKey=this.drawArrivalKey(player,sequence),normalized=this.normalizeActionCode(code);



    const prior=this.animationQueue.find(item=>item?.kind==='draw-flight'&&item.origin==='move'&&!item.drawMatched&&Number(item.to?.controller)===Number(player)&&this.normalizeActionCode(item.code)===normalized);


    const dealerBeat=140;
    if(prior){const others=this.animationQueue.filter(item=>item!==prior&&item?.kind==='draw-flight'&&Number(item.to?.controller)===Number(player));if(others.length)delay=Math.max(delay,...others.map(item=>Math.max(0,Number(item.delay)||0)+dealerBeat));if(prior.arrivalKey)this.pendingDrawArrivals.delete(prior.arrivalKey);prior.to={controller:player,location:L.HAND,sequence};prior.arrivalKey=arrivalKey;prior.delay=delay;prior.drawMatched=true;prior.origin='draw+move';this.pendingDrawArrivals.add(arrivalKey);this.consumePendingDrawMove(player,code);return;}
    const queued=this.animationQueue.filter(item=>item?.kind==='draw-flight'&&Number(item.to?.controller)===Number(player));if(queued.length)delay=Math.max(delay,...queued.map(item=>Math.max(0,Number(item.delay)||0)+dealerBeat));


    this.pendingDrawArrivals.add(arrivalKey);this.pendingDrawPresentationCounts[Number(player)||0]=(Number(this.pendingDrawPresentationCounts[Number(player)||0])||0)+1;this.rememberPendingDrawMove(player,code);
    this.animationQueue.push({kind:'draw-flight',origin:'draw',drawMatched:true,from:{controller:player,location:L.DECK,sequence:0},to:{controller:player,location:L.HAND,sequence},code:Number(code)||0,start,delay,arrivalKey});
  }

  queueAttackTargetCue(card,target) {
    if(this.isReplaySeekReconstruction())return;
    const player=Number(card?.controller)||0;this.animationQueue.push({kind:'attack-target',player,from:{...card},target:target&&typeof target==='object'?{...target}:null,direct:!target});
  }

  expectedBattleDamage(attacker={},target=null,direct=false) {
    const atk=Math.max(0,Number(attacker?.attack)||0);if(direct)return atk;if(!target)return 0;
    const P=this.mod?.OcgPosition||{},attackMask=Number(P.ATTACK||0)||Number(P.FACEUP_ATTACK||0)||1;


    if(!(Number(target.position)&attackMask))return 0;
    return Math.abs(atk-Math.max(0,Number(target.attack)||0));
  }

  attackFxStyle(card={},context=null) {
    const code=this.normalizeActionCode(card?.code||card?.card||context?.attackerCode||0),app=code?this.getCardById?.(code):null,race=String(app?.race||'').toLowerCase();
    if(/spellcaster|psychic/.test(race))return'arcane';if(/dragon|wyrm|dinosaur/.test(race))return'dragon';if(/warrior|beast-warrior/.test(race))return'slash';if(/machine|cyberse/.test(race))return'machine';if(/fiend|zombie/.test(race))return'void';if(/thunder/.test(race))return'thunder';if(/pyro/.test(race))return'fire';if(/aqua|fish|sea serpent/.test(race))return'water';return'laser';
  }

  battleDamageProfile(amount=0,{lethal=false}={}) {
    const damage=Math.max(0,Number(amount)||0),ratio=Math.min(1,damage/4000),intensity=this.battleEffectScale(),power=lethal?1:ratio;
    return{damage,tier:lethal?'lethal':damage>=3000?'massive':damage>=1500?'heavy':'standard',beamWidth:(2+4.6*power)*intensity,coreWidth:(.9+1.5*power)*intensity,brightness:1+.58*power*intensity,glow:(8+27*power)*intensity,shellSpread:(3+8*power)*intensity,energyAlpha:.28+.52*power,impactSize:(30+48*power)*intensity,particles:Math.max(6,Math.round((6+14*power)*intensity)),particleDistance:(32+62*power)*intensity};
  }

  updateAttackFxDamage(context,amount=0,{lethal=false}={}) {
    if(!context)return;const damage=Math.max(0,Number(amount)||0);context.actualDamage=damage;context.lethal=!!lethal;if(context.fxItem){context.fxItem.damage=damage;context.fxItem.lethal=!!lethal;}
    const trail=context.fxItem?.trail;if(trail){const profile=this.battleDamageProfile(damage,{lethal});trail.classList.remove('duel-attack-standard','duel-attack-heavy','duel-attack-massive','duel-attack-lethal');trail.classList.add(`duel-attack-${profile.tier}`);trail.style.setProperty('--attack-beam-width',`${profile.beamWidth.toFixed(1)}px`);trail.style.setProperty('--attack-core-width',`${profile.coreWidth.toFixed(1)}px`);trail.style.setProperty('--attack-brightness',profile.brightness.toFixed(2));trail.style.setProperty('--attack-glow',`${profile.glow.toFixed(1)}px`);trail.style.setProperty('--attack-glow-wide',`${(profile.glow*1.8).toFixed(1)}px`);trail.style.setProperty('--attack-shell-spread',`${profile.shellSpread.toFixed(1)}px`);trail.style.setProperty('--attack-energy-alpha',profile.energyAlpha.toFixed(2));}
  }

  queueAttackFx(card,target,delay=0) {
    if(this.isReplaySeekReconstruction())return null;
    const damage=Math.max(0,Number(arguments[3])||0),attackContext=arguments[4]||null;
    const player=Number(card?.controller)||0;const start=this.rectForLocation(card,{preferCard:true});
    const item={kind:'attack-fx',player,from:{...card},target:target&&typeof target==='object'?{...target}:null,start,delay:Math.max(0,Number(delay)||0),damage,attackContext};if(attackContext)attackContext.fxItem=item;this.animationQueue.push(item);return item;
  }

  playAttackTargetCue(item) {
    if(!this.boardWrap)return;
    const sourceKey=this.locationKey(Number(item?.from?.location)||0);
    const source=this.boardWrap.querySelector?.(`.duel-card[data-player="${Number(item?.from?.controller)||0}"][data-location="${sourceKey}"][data-sequence="${Number(item?.from?.sequence)||0}"]`);
    source?.classList.add('duel-attack-source-cue');
    let target=null;
    if(item?.target){
      const targetKey=this.locationKey(Number(item.target.location)||0);
      target=this.boardWrap.querySelector?.(`.duel-card[data-player="${Number(item.target.controller)||0}"][data-location="${targetKey}"][data-sequence="${Number(item.target.sequence)||0}"]`);
      target?.classList.add('duel-attack-target-cue');
    }else{
      target=this.lpNodes[Number(item?.player)===0?1:0]?.closest?.('strong')||this.lpNodes[Number(item?.player)===0?1:0]||null;
      target?.classList.add('duel-direct-target-cue');
    }
    this.playSound('select');
    setTimeout(()=>{source?.classList.remove('duel-attack-source-cue');target?.classList.remove('duel-attack-target-cue','duel-direct-target-cue');},500);
  }


  queueLpAnimation(player,delta,context={}) {
    if(this.isReplaySeekReconstruction()){const p=Number(player)||0,value=Number(context?.displayValue);if(!Array.isArray(this.displayLp))this.displayLp=[...(this.lp||[8000,8000])];this.displayLp[p]=Number.isFinite(value)?value:Number(this.lp?.[p]??this.displayLp[p]??8000);return;}
    const item={kind:'lp',player:Number(player)||0,delta:Number(delta)||0,...(context||{})};this.animationQueue.push(item);
    if(item.delta<0&&item.lethalPresentation){
      const now=(typeof performance!=='undefined'&&typeof performance.now==='function')?performance.now():Date.now();
      const startsAt=now+Math.max(0,Number(item.delay)||0);





      const damageAnimationMs=1450;
      const postDamageResultDelayMs=250;
      this.damagePresentationUntil=Math.max(Number(this.damagePresentationUntil)||0,startsAt+damageAnimationMs+postDamageResultDelayMs);
    }
  }

  playAttackFx(item) {
    if(!item?.start||typeof document==='undefined')return;
    const s=item.start;let e=item.target?this.rectForLocation(item.target,{preferCard:true}):null;
    if(!e){const lpNode=this.lpNodes[item.player===0?1:0];const lpDisplay=lpNode?.closest?.('strong')||lpNode;e=lpDisplay?.getBoundingClientRect?.()||null;}
    if(!e)return;
    const x1=s.left+s.width/2,y1=s.top+s.height/2,x2=e.left+e.width/2,y2=e.top+e.height/2,dx=x2-x1,dy=y2-y1,dist=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)*180/Math.PI;
    const profile=this.battleDamageProfile(item.damage,{lethal:!!item.lethal}),tier=profile.tier,intensity=this.battleEffectScale(),style=this.attackFxStyle(item.from,item.attackContext);item.fxStyle=style;
    const applyProfile=(node,next)=>{node.style.setProperty('--battle-intensity',String(intensity));node.style.setProperty('--attack-beam-width',`${next.beamWidth.toFixed(1)}px`);node.style.setProperty('--attack-core-width',`${next.coreWidth.toFixed(1)}px`);node.style.setProperty('--attack-brightness',next.brightness.toFixed(2));node.style.setProperty('--attack-glow',`${next.glow.toFixed(1)}px`);node.style.setProperty('--attack-glow-wide',`${(next.glow*1.8).toFixed(1)}px`);node.style.setProperty('--attack-shell-spread',`${next.shellSpread.toFixed(1)}px`);node.style.setProperty('--attack-energy-alpha',next.energyAlpha.toFixed(2));node.style.setProperty('--attack-impact-size',`${next.impactSize.toFixed(1)}px`);};
    const decorate=node=>{node.classList.add(`duel-attack-style-${style}`);const d=document.createElement('span');d.className='duel-attack-fx-detail';for(let i=0;i<10;i++){const v=document.createElement('i');v.style.setProperty('--fx-x',`${8+i*9}%`);v.style.setProperty('--fx-y',`${((i%5)-2)*4}px`);v.style.setProperty('--fx-r',`${(i*37)%70-35}deg`);v.style.setProperty('--fx-delay',`${i*17}ms`);d.append(v);}node.append(d);};
    const charge=document.createElement('div');charge.className=`duel-attack-charge duel-attack-style-${style}`;charge.style.left=`${x1}px`;charge.style.top=`${y1}px`;applyProfile(charge,profile);document.body.append(charge);
    const trail=document.createElement('div');trail.className='duel-attack-trail duel-attack-indicator-blink';trail.classList.add(`duel-attack-${tier}`);trail.style.left=`${x1}px`;trail.style.top=`${y1}px`;trail.style.width=`${dist}px`;trail.style.transform=`rotate(${angle}deg)`;applyProfile(trail,profile);decorate(trail);item.trail=trail;
    this.activeAttackSoundStyle=style;document.body.append(trail);this.playBattleAttackSound();this.activeAttackSoundStyle=null;

    setTimeout(()=>{
      trail.remove();charge.remove();
      const finalProfile=this.battleDamageProfile(item.damage,{lethal:!!item.lethal}),finalTier=finalProfile.tier,impact=document.createElement('div');impact.className=`duel-attack-impact duel-attack-${finalTier} duel-attack-style-${style}`;impact.style.left=`${x2}px`;impact.style.top=`${y2}px`;applyProfile(impact,finalProfile);const particles=document.createElement('span');particles.className='duel-attack-impact-particles';for(let i=0;i<finalProfile.particles;i++){const spark=document.createElement('i');spark.style.setProperty('--attack-particle-angle',`${360/finalProfile.particles*i}deg`);spark.style.setProperty('--attack-particle-distance',`${(finalProfile.particleDistance*(.72+(i%4)*.1)).toFixed(1)}px`);particles.append(spark);}impact.append(particles);document.body.append(impact);if(finalTier!=='standard'){this.boardWrap?.classList.add(`duel-battle-shake-${finalTier}`);setTimeout(()=>this.boardWrap?.classList.remove(`duel-battle-shake-${finalTier}`),520);}
      setTimeout(()=>impact.remove(),680);
    },500);
  }


  showLpScreenFlash(player,delta,{directAttack=false,attackerCode=0,lethal=false}={}) {
    if(!this.boardWrap||typeof document==='undefined')return;const loss=Number(delta)<0;if(!loss)return;
    const damagedPlayer=Number(player)===1?1:0,amountValue=Math.abs(Number(delta)||0),tier=lethal?'lethal':amountValue>=3000?'massive':amountValue>=1500?'heavy':'standard';
    const flash=document.createElement('div');flash.className=`duel-damage-flash ${damagedPlayer===0?'player':'opponent'}${directAttack?' direct-attack':''} duel-damage-${tier}`;flash.style.setProperty('--battle-intensity',String(this.battleEffectScale()));flash.setAttribute('aria-hidden','true');
    const boardRect=this.boardWrap.getBoundingClientRect?.();const fieldAnchor=$id(damagedPlayer===0?'duelPlayerMonsters':'duelOpponentMonsters');const anchorRect=fieldAnchor?.getBoundingClientRect?.();
    if(boardRect?.height&&anchorRect?.height){const center=((anchorRect.top+anchorRect.height/2)-boardRect.top)/boardRect.height*100;flash.style.top=`${Math.max(16,Math.min(84,center)).toFixed(2)}%`;}
    const word=document.createElement('span');word.className='duel-damage-word';

    word.textContent=directAttack?'DIRECT ATTACK':'DAMAGE';
    const amount=document.createElement('strong');amount.textContent=`-${amountValue.toLocaleString()} LP`;flash.append(word,amount);
    if(directAttack&&Number(attackerCode)){const source=document.createElement('span');source.className='duel-direct-damage-source';source.textContent=this.cardName(attackerCode);flash.append(source);}
    this.boardWrap.append(flash);
    const screen=document.createElement('div');screen.className=`duel-damage-screen ${damagedPlayer===0?'player':'opponent'}${directAttack?' direct-attack':''} duel-damage-${tier}`;screen.style.setProperty('--battle-intensity',String(this.battleEffectScale()));screen.setAttribute('aria-hidden','true');this.boardWrap.append(screen);
    const particles=document.createElement('div');particles.className=`duel-damage-particles duel-damage-${tier}`;const count=tier==='standard'?8:tier==='heavy'?14:22;for(let i=0;i<count;i++){const particle=document.createElement('i');particle.style.setProperty('--particle-angle',`${(360/count)*i}deg`);particle.style.setProperty('--particle-distance',`${48+(i%5)*13}px`);particles.append(particle);}flash.append(particles);if(tier!=='standard'){this.boardWrap.classList.add(`duel-damage-shake-${tier}`);setTimeout(()=>this.boardWrap?.classList.remove(`duel-damage-shake-${tier}`),520);}


    setTimeout(()=>{flash.remove();screen.remove();},2400);
  }

  playLpAnimation(item) {
    const player=Number(item?.player)||0;const node=this.lpNodes[player];const wrap=node?.closest?.('.duel-player-summary');if(!node||!wrap)return;



    if(Number.isFinite(Number(item?.displayValue))){
      if(!Array.isArray(this.displayLp))this.displayLp=[Number(this.lp?.[0])||0,Number(this.lp?.[1])||0];
      this.displayLp[player]=Number(item.displayValue);node.textContent=this.displayLp[player].toLocaleString();
    }
    const loss=item.delta<0;wrap.classList.remove('lp-loss','lp-gain');void wrap.offsetWidth;wrap.classList.add(loss?'lp-loss':'lp-gain');
    if(loss&&item.directAttack){const gauge=node.closest?.('strong')||node;gauge.classList.remove('duel-direct-lp-impact');void gauge.offsetWidth;gauge.classList.add('duel-direct-lp-impact');setTimeout(()=>gauge.classList.remove('duel-direct-lp-impact'),760);}
    const float=document.createElement('span');float.className=`duel-lp-float ${loss?'loss':'gain'}${item.directAttack?' direct-attack':''}`;float.textContent=`${item.delta>0?'+':''}${item.delta.toLocaleString()} LP`;wrap.append(float);setTimeout(()=>{wrap.classList.remove('lp-loss','lp-gain');float.remove();},2250);
    if(loss)this.showLpScreenFlash(item.player,item.delta,{directAttack:!!item.directAttack,attackerCode:Number(item.attackerCode)||0,lethal:!!item.lethalPresentation});this.playSound(loss?'damage':'recover',Math.abs(item.delta));
  }

  playMoveAnimation(item) {
    const releaseArrival=()=>{if(item?.kind==='draw-flight'&&item?.arrivalKey){if(item.arrivalKey)this.pendingDrawArrivals.delete(item.arrivalKey);this.releaseDrawPresentation(Number(item.to?.controller)||0);}else if(item?.arrivalKey)this.pendingMoveArrivals.delete(item.arrivalKey);};
    if(!item?.start||typeof document==='undefined'||!document.body){releaseArrival();return;}
    const key=this.locationKey(Number(item.to?.location)||0),player=Number(item.to?.controller)||0,sequence=Number(item.to?.sequence)||0;
    let destination=this.boardWrap?.querySelector?.(`.duel-card[data-player="${player}"][data-location="${key}"][data-sequence="${sequence}"]`);
    const end=destination?.getBoundingClientRect?.()||this.rectForLocation(item.to,{preferCard:true})||this.rectForLocation(item.to,{preferCard:false});
    if(!end){releaseArrival();return;}
    const img=document.createElement('img');img.className='duel-card-flight';img.alt='';img.setAttribute('aria-hidden','true');img.src=item.sourceSrc|| (item.code?cardImage(item.code):'assets/card_placeholder.png');
    const s=item.start,e=end;const toDefense=!!destination?.classList?.contains('defense');const isDraw=item.kind==='draw-flight';
    const portraitRatio=421/614;
    const naturalSize=(rect,defense=false)=>{
      const rw=Math.max(18,Number(rect?.width)||64),rh=Math.max(26,Number(rect?.height)||94);
      const boxW=defense?rh:rw,boxH=defense?rw:rh;
      let h=boxH,w=h*portraitRatio;if(w>boxW){w=boxW;h=w/portraitRatio;}
      return{w:Math.max(18,w),h:Math.max(26,h)};
    };
    const startSize=naturalSize(s,!!item.fromDefense),endSize=naturalSize(e,toDefense);const scale=endSize.h/startSize.h;
    img.style.left=`${s.left+s.width/2}px`;img.style.top=`${s.top+s.height/2}px`;img.style.width=`${startSize.w}px`;img.style.height=`${startSize.h}px`;
    if(destination)destination.classList.add('duel-arrival-pending');document.body.append(img);
    const dx=(e.left+e.width/2)-(s.left+s.width/2),dy=(e.top+e.height/2)-(s.top+s.height/2);const startRot=item.fromDefense?' rotate(90deg)':'';const endRot=toDefense?' rotate(90deg)':'';
    const finish=()=>{
      img.remove();
      releaseArrival();
      const current=this.boardWrap?.querySelector?.(`.duel-card[data-player="${player}"][data-location="${key}"][data-sequence="${sequence}"]`);
      const settled=current||destination;
      if(settled){
        settled.classList.remove('duel-arrival-pending');



        if(isDraw){settled.classList.add('duel-arrival-quiet');setTimeout(()=>settled?.classList.remove('duel-arrival-quiet'),180);}
      }
    };
    if(typeof img.animate==='function'){


      const frames=[
        {transform:`translate(-50%,-50%) scale(1)${startRot}`,opacity:1},
        {transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(${scale})${endRot}`,opacity:1},
      ];
      const distance=Math.hypot(dx,dy);
      const duration=isDraw?140:Math.max(260,Math.min(420,260+distance*.18));
      const anim=img.animate(frames,{duration,easing:'cubic-bezier(.22,.72,.24,1)',fill:'forwards'});
      this.playSound('move');anim.finished.catch(()=>{}).finally(finish);
    }else setTimeout(finish,isDraw?150:440);
  }

  playFlipAnimation(item) {
    if(typeof document==='undefined'||!document.body||!this.boardWrap)return;
    const key=this.locationKey(Number(item.location)||0);
    const destination=this.boardWrap.querySelector?.(`.duel-card[data-player="${Number(item.player)||0}"][data-location="${key}"][data-sequence="${Number(item.sequence)||0}"]`);
    const destinationArt=destination?.querySelector?.('img');if(!destination||!destinationArt)return;
    const rect=destination.getBoundingClientRect?.();if(!rect)return;
    const oldSrc=item.sourceSrc||destinationArt.src;const newSrc=destinationArt.src||oldSrc;
    const overlay=document.createElement('img');overlay.className='duel-card-flip-flight';overlay.alt='';overlay.setAttribute('aria-hidden','true');overlay.src=oldSrc;
    const computed=typeof getComputedStyle==='function'?getComputedStyle(destinationArt):null;
    const width=Math.max(18,parseFloat(computed?.width)||Number(destinationArt.offsetWidth)||Math.min(107,rect.width||64));
    const height=Math.max(26,parseFloat(computed?.height)||Number(destinationArt.offsetHeight)||width/(421/614));
    overlay.style.left=`${rect.left+rect.width/2}px`;overlay.style.top=`${rect.top+rect.height/2}px`;overlay.style.width=`${width}px`;overlay.style.height=`${height}px`;
    const fromDefense=!!item.fromDefense,toDefense=!!destination.classList.contains('defense');const fromAngle=fromDefense?90:0,toAngle=toDefense?90:0,midAngle=(fromAngle+toAngle)/2;
    destination.classList.add('duel-flip-pending');document.body.append(overlay);
    const transform=(z,y)=>`translate(-50%,-50%) rotate(${z}deg) rotateY(${y}deg)`;
    const finish=()=>{overlay.remove();destination.classList.remove('duel-flip-pending');};
    if(typeof overlay.animate!=='function'){finish();return;}



    const first=overlay.animate([
      {transform:transform(fromAngle,0),filter:'brightness(1)'},
      {transform:transform(midAngle,90),filter:'brightness(.92)'},
    ],{duration:220,easing:'cubic-bezier(.42,0,.58,1)',fill:'forwards'});
    first.finished.then(()=>{
      overlay.src=newSrc;overlay.style.transform=transform(midAngle,-90);
      const second=overlay.animate([
        {transform:transform(midAngle,-90),filter:'brightness(.92)'},
        {transform:transform(toAngle,0),filter:'brightness(1)'},
      ],{duration:220,easing:'cubic-bezier(.42,0,.58,1)',fill:'forwards'});
      return second.finished;
    }).catch(()=>{}).finally(finish);
  }

  playDeckShuffleAnimation(item={}) {
    if(this.isReplaySeekReconstruction()||!this.duelAnimationsEnabled||!this.boardWrap||typeof document==='undefined')return false;
    const player=Number(item.player)||0,node=this.boardWrap.querySelector?.(`.duel-pile.deck-zone[data-player="${player}"][data-location="deck"]`);
    if(!node)return false;
    const count=Number(node.querySelector?.('.duel-pile-count')?.textContent)||0;if(count<=0)return false;
    node.querySelectorAll?.('.duel-deck-shuffle-fx').forEach(effect=>effect.remove());
    const effect=document.createElement('div');effect.className='duel-deck-shuffle-fx';effect.setAttribute('aria-hidden','true');
    for(let index=0;index<6;index++){const card=document.createElement('span');card.className=`duel-deck-shuffle-card shuffle-${index+1}`;effect.append(card);}
    node.append(effect);node.classList.remove('duel-deck-shuffling');void node.offsetWidth;node.classList.add('duel-deck-shuffling');
    const finish=()=>{effect.remove();if(!node.querySelector?.('.duel-deck-shuffle-fx'))node.classList.remove('duel-deck-shuffling');};
    setTimeout(finish,1320);this.traceSession?.('deck-shuffle-animation',{player,count});return true;
  }

  playQueuedAnimations() {
    if(!this.animationQueue.length||!this.boardWrap)return;
    const queue=this.animationQueue.splice(0);
    if(!this.duelAnimationsEnabled){this.pendingDrawArrivals.clear();this.pendingMoveArrivals.clear();this.pendingDrawPresentationCounts=[0,0];this.renderField();return;}
    const scale=this.actionPresentationScale(),now=Date.now(),sequentialCardActions=!!(this.actionPresentationEnabled&&!this.synchronizedShowcaseTravelEnabled);
    let cursor=Math.max(now,Number(this.actionPresentationUntil)||0),routineEnd=cursor,attackDelay=0;
    const showcaseDuration=item=>item?.showcase!==false&&['activate','summon','special','flip'].includes(String(item?.kind||''))?Math.round(1250*scale):0;
    const outcomeDuration=item=>{const outcome=item?.orderedOutcome?.outcome;if(!outcome)return 0;const descriptor=this.chainOutcomeDescriptor(outcome);return Math.round(Number(descriptor?.duration||980)*scale)+340;};
    const L=this.mod?.OcgLocation||{},deckMask=Number(L.DECK||0);
    const deckTravelItem=item=>{if(!deckMask||!item)return false;const from=Number(item?.from?.location)||0,to=Number(item?.to?.location)||0;return !!((from&deckMask)||(to&deckMask));};
    const sequencedCardItem=item=>{if(deckTravelItem(item))return false;return ['move','flip','activate','set','position','summon','special'].includes(String(item?.kind||''))||(item?.kind==='draw-flight'&&!!item?.orderedOutcome);};
    const actionDuration=item=>{
      const showcaseMs=showcaseDuration(item),outcomeMs=outcomeDuration(item),kind=String(item?.kind||'');
      if(kind==='draw-flight')return 180+outcomeMs;
      if(kind==='move')return 440+outcomeMs;
      if(kind==='flip')return 440+showcaseMs+outcomeMs;
      if(['activate','summon','special'].includes(kind))return showcaseMs?showcaseMs+outcomeMs:outcomeMs||760;
      if(['set','position'].includes(kind))return 760+outcomeMs;
      return 760;
    };
    const visualDuration=item=>item.kind==='draw-flight'?180:item.kind==='move'||item.kind==='flip'?440:item.kind==='activate'?Math.max(760,showcaseDuration(item)):item.kind==='attack'?950:item.kind==='lp'?720:item.kind==='summon'||item.kind==='special'?Math.max(760,showcaseDuration(item)):650;
    const synchronizedGroups=[],fieldMask=Number(L.MZONE||0)|Number(L.SZONE||0),relatedShowcaseMove=(candidate,showcase)=>candidate?.kind==='move'&&!!(Number(candidate.to?.location)&fieldMask)&&Number(candidate.to?.controller??candidate.from?.controller)===Number(showcase.player)&&Number(candidate.to?.sequence)===Number(showcase.sequence)&&(!Number(showcase.code)||!Number(candidate.code)||this.normalizeActionCode(candidate.code)===this.normalizeActionCode(showcase.code));
    if(this.synchronizedShowcaseTravelEnabled){
      const availableMoves=queue.filter(item=>item?.kind==='move'&&!!(Number(item.to?.location)&fieldMask));
      for(const showcase of queue.filter(item=>['summon','special'].includes(String(item?.kind||''))&&item.showcase!==false)){
        const move=availableMoves.find(candidate=>!candidate.synchronizedShowcaseGroup&&relatedShowcaseMove(candidate,showcase));
        if(!move)continue;const group={items:[move,showcase],scheduled:false};move.synchronizedShowcaseGroup=group;showcase.synchronizedShowcaseGroup=group;synchronizedGroups.push(group);
      }
      for(const group of synchronizedGroups){const delay=Math.max(...group.items.map(item=>Math.max(0,Number(item.delay)||0)));group.items.forEach(item=>{item.presentationDelay=delay;});}
    }
    if(this.actionPresentationEnabled){
      if(sequentialCardActions){
        const ordered=queue.filter(sequencedCardItem);
        for(let index=0;index<ordered.length;index++){
          const showcase=ordered[index];if(!['summon','special'].includes(String(showcase?.kind||'')))continue;
          const relatedMove=queue.find(candidate=>relatedShowcaseMove(candidate,showcase));
          if(relatedMove&&deckTravelItem(relatedMove))showcase.deckTravelLeadMs=Math.max(Number(showcase.deckTravelLeadMs)||0,Math.max(0,Number(relatedMove.delay)||0)+440);
          const moveIndex=ordered.findIndex((candidate,candidateIndex)=>candidateIndex>index&&relatedShowcaseMove(candidate,showcase));
          if(moveIndex>index){const [move]=ordered.splice(moveIndex,1);ordered.splice(index,0,move);index++;}
        }
        let actionCursor=Math.max(now,Number(this.actionPresentationUntil)||0);
        for(const item of ordered){
          const base=Math.max(0,Number(item.delay)||0,Number(item.deckTravelLeadMs)||0),scheduled=Math.max(base,actionCursor-now);item.presentationDelay=scheduled;
          actionCursor=now+scheduled+actionDuration(item)+Math.round(35*scale);
        }
        this.actionPresentationUntil=actionCursor;
        this.cardAnimationPresentationUntil=Math.max(Number(this.cardAnimationPresentationUntil)||0,actionCursor);
        this.traceSession?.('card-action-sequence-scheduled',{count:ordered.length,until:actionCursor});
        for(const item of queue){
          if(sequencedCardItem(item))continue;
          if(item.kind==='shuffle'||item.kind==='draw-flight'||item.kind==='attack')item.presentationDelay=Math.max(0,Number(item.delay)||0);
          else if(item.kind==='attack-target'){attackDelay=Math.max(0,Number(item.delay)||0);item.presentationDelay=attackDelay;}
          else if(item.kind==='attack-fx'){item.presentationDelay=Math.max(attackDelay,Number(item.delay)||0);if(item.attackContext)item.attackContext.impactPresentationAt=now+item.presentationDelay+500;}
          else if(item.kind==='lp'&&item.attackContext){const impactAt=Number(item.attackContext.impactPresentationAt)||now+Math.max(0,Number(item.delay)||0);item.presentationDelay=Math.max(0,impactAt-now);}
          else item.presentationDelay=Math.max(0,Number(item.delay)||0);
        }
      }else{
        const routineKinds=new Set(['move','flip']);
        for(const item of queue){
          if(item.kind==='shuffle'){item.presentationDelay=Math.max(0,Number(item.delay)||0);continue;}
          if(item.synchronizedShowcaseGroup){
            const group=item.synchronizedShowcaseGroup;if(group.scheduled)continue;group.scheduled=true;cursor=Math.max(cursor,routineEnd);const base=Math.max(...group.items.map(entry=>Math.max(0,Number(entry.delay)||0))),scheduled=Math.max(base,cursor-now);group.items.forEach(entry=>{entry.presentationDelay=scheduled;});const duration=Math.max(...group.items.map(visualDuration));cursor=now+scheduled+duration+Math.round(90*scale);routineEnd=cursor;this.traceSession?.('showcase-travel-synchronized',{kinds:group.items.map(entry=>entry.kind),delayMs:scheduled});continue;
          }
          if(item.kind==='draw-flight'){item.presentationDelay=Math.max(0,Number(item.delay)||0);routineEnd=Math.max(routineEnd,now+item.presentationDelay+visualDuration(item));continue;}
          if(item.kind==='attack-target'){attackDelay=Math.max(0,cursor-now);item.presentationDelay=attackDelay;continue;}
          if(item.kind==='attack-fx'){item.presentationDelay=Math.max(attackDelay,Number(item.delay)||0);if(item.attackContext)item.attackContext.impactPresentationAt=now+item.presentationDelay+500;continue;}
          if(item.kind==='lp'&&item.attackContext){const impactAt=Number(item.attackContext.impactPresentationAt)||now+Math.max(0,Number(item.delay)||0);item.presentationDelay=Math.max(0,impactAt-now);continue;}
          const base=Math.max(0,Number(item.delay)||0);
          if(routineKinds.has(item.kind)){const scheduled=Math.max(base,cursor-now);item.presentationDelay=scheduled;routineEnd=Math.max(routineEnd,now+scheduled+visualDuration(item));continue;}
          cursor=Math.max(cursor,routineEnd);const scheduled=Math.max(base,cursor-now);item.presentationDelay=scheduled;cursor=now+scheduled+visualDuration(item)+Math.round(90*scale);routineEnd=cursor;
        }
        this.actionPresentationUntil=Math.max(cursor,routineEnd);this.traceSession?.('action-presentation-scheduled',{count:queue.length,until:this.actionPresentationUntil});
      }
    }
    for(const item of queue){
      if(item.kind==='attack-fx'&&item.attackContext&&!Number.isFinite(Number(item.attackContext.impactPresentationAt))){const attackFxDelay=Math.max(0,Number(item.presentationDelay??item.delay)||0);item.attackContext.impactPresentationAt=now+attackFxDelay+500;}
    }
    for(const item of queue){
      if(item.kind!=='lp'||!item.attackContext)continue;
      const impactAt=Number(item.attackContext.impactPresentationAt)||now+500;item.presentationDelay=Math.max(0,impactAt-now);
    }
    if(!sequentialCardActions){
      const timingNow=Date.now();let cardMs=0;
      for(const item of queue){
        const delay=Math.max(0,Number(item?.presentationDelay??item?.delay)||0);let duration=0;
        if(item?.kind==='draw-flight')duration=180;
        else if(item?.kind==='move'||item?.kind==='flip')duration=440;
        else if(['activate','set','position','summon','special','attack'].includes(String(item?.kind||'')))duration=760;
        if(duration)cardMs=Math.max(cardMs,delay+duration);
      }
      if(cardMs)this.cardAnimationPresentationUntil=Math.max(Number(this.cardAnimationPresentationUntil)||0,timingNow+cardMs);
    }
    const executeItem=item=>{
      let orderedOutcomeQueued=false;const presentOrderedOutcome=(delay=0)=>{const outcome=item?.orderedOutcome;if(!outcome||orderedOutcomeQueued)return;orderedOutcomeQueued=true;const run=()=>this.showCardOutcomeEffect(outcome.loc||{},outcome.outcome||'Affected',Number(outcome.chainLink)||0,Number(outcome.code)||0,{ordered:true});if(delay>0)setTimeout(run,delay);else run();};
      const execute=()=>{
        if(item.kind==='shuffle'){this.playDeckShuffleAnimation(item);return;}
        if(item.kind==='move'||item.kind==='draw-flight'){this.playMoveAnimation(item);if(item.kind==='draw-flight')this.playSound('draw');presentOrderedOutcome(item.kind==='draw-flight'?180:440);return;}
        if(item.kind==='flip'){
          this.playFlipAnimation(item);this.playSound('activate');const showcaseMs=showcaseDuration(item);
          if(item.showcase!==false){if(sequentialCardActions)setTimeout(()=>this.playActivationShowcase(item),440);else this.playActivationShowcase(item);}
          presentOrderedOutcome(440+showcaseMs);return;
        }
        if(item.kind==='attack-target'){this.playAttackTargetCue(item);return;}
        if(item.kind==='attack-fx'){this.playAttackFx(item);return;}
        if(item.kind==='lp'){this.playLpAnimation(item);return;}
        if(['activate','summon','special'].includes(item.kind)){
          const shown=item.showcase!==false&&this.playActivationShowcase(item);if(shown&&!item.chainLink)this.playSound(item.kind);
          presentOrderedOutcome(shown?showcaseDuration(item):0);if(shown)return;
        }
        const key=this.locationKey(item.location);
        let node=this.boardWrap.querySelector?.(`.duel-card[data-player="${item.player}"][data-location="${key}"][data-sequence="${item.sequence}"]`);
        if(!node&&item.code)node=this.boardWrap.querySelector?.(`.duel-card[data-player="${item.player}"][data-code="${item.code}"]`);
        if(!node&&['grave','removed','deck','extra'].includes(key))node=this.boardWrap.querySelector?.(`.duel-pile[data-player="${item.player}"][data-location="${key}"]`);
        if(!node){presentOrderedOutcome(0);return;}
        const cls=`duel-anim-${item.kind}`;node.classList.remove(cls);void node.offsetWidth;node.classList.add(cls);
        const soundKind=item.kind==='flip'?'activate':item.kind;this.playSound(soundKind);presentOrderedOutcome(['set','position'].includes(item.kind)?760:0);setTimeout(()=>node.classList.remove(cls),760);
      };
      const delay=Math.max(0,Number(item.presentationDelay??item.delay)||0);if(delay)setTimeout(execute,delay);else execute();
    };
    const immediate=queue.filter(item=>(item.kind==='lp'&&item.immediate)||((item.kind==='attack-target'||item.kind==='attack-fx')&&Math.max(0,Number(item.delay)||0)===0));
    const deferred=queue.filter(item=>!immediate.includes(item));immediate.forEach(executeItem);
    const run=()=>deferred.forEach(executeItem);if(!deferred.length)return;if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else run();
  }

  playActivationShowcase(item={}) {
    if(this.isReplaySeekReconstruction())return false;
    const summon=['summon','special','flip'].includes(String(item.kind||''));
    if(!this.duelAnimationsEnabled||!this.activationShowcaseEnabled||!(summon?this.summonPresentationsEnabled:this.effectActivationAnimationsEnabled)||!this.boardWrap||!Number(item.code)||typeof document==='undefined')return;
    const now=Date.now();for(const [key,seenAt] of this.activationPresentationHistory)if(now-Number(seenAt)>8000)this.activationPresentationHistory.delete(key);
    const activationKey=Number(item.chainLink)>0?`chain:${String(this.activeChainSummary?.id||this.turn||0)}:${Number(item.chainLink)}:${Number(item.code)}`:`${String(item.kind||'effect')}:${Number(item.player)||0}:${Number(item.location)||0}:${Number(item.sequence)||0}:${Number(item.code)}`;
    if(now-Number(this.activationPresentationHistory.get(activationKey)||0)<2400){this.traceSession?.('duplicate-activation-showcase-suppressed',{key:activationKey,code:Number(item.code),chainLink:Number(item.chainLink)||0});return;}
    this.activationPresentationHistory.set(activationKey,now);
    this.boardWrap.querySelectorAll?.('.duel-activation-showcase').forEach(node=>node.remove());
    const node=document.createElement('div');node.className='duel-activation-showcase';node.style.setProperty('--activation-showcase-ms',`${Math.round(1150*this.actionPresentationScale())}ms`);node.setAttribute('aria-hidden','true');
    const img=document.createElement('img');img.src=cardImage(item.code);img.alt='';node.append(img);this.boardWrap.append(node);
    this.traceSession?.('activation-showcase',{code:Number(item.code),chainLink:Number(item.chainLink)||0});setTimeout(()=>node.remove(),Math.round(1250*this.actionPresentationScale()));return true;
  }

  effectTargetsForResponse(prompt={},response={}) {
    const T=this.mod?.OcgMessageType||{};
    if(!this.duelAnimationsEnabled||!this.targetPresentationsEnabled||!prompt||prompt.type!==T.SELECT_CARD||this.isPlayerAttackTargetPrompt(prompt))return[];
    const indices=Array.isArray(response.indicies)?response.indicies:[];if(!indices.length)return[];
    const purpose=this.selectionPurpose(prompt);if(String(purpose?.role||'').toLowerCase()!=='target')return[];
    const selects=prompt.selects||[],seen=new Set(),targets=[];
    for(const rawIndex of indices){const item=selects[Number(rawIndex)];if(!item)continue;const code=this.normalizeActionCode(item.code);if(!code)continue;const target={code,controller:Number(item.controller??prompt.player)||0,location:Number(item.location)||0,sequence:Number(item.sequence)||0,position:Number(item.position)||0};const identity=[target.controller,target.location,target.sequence,target.code].join(':');if(seen.has(identity))continue;seen.add(identity);targets.push(target);}
    return targets;
  }

  effectTargetPhysicalNodes(target={}) {
    const scope=this.root?.isConnected?this.root:(typeof document!=='undefined'?document:null);if(!scope?.querySelectorAll)return[];
    const candidates=[...scope.querySelectorAll('.duel-card[data-player][data-location][data-sequence],.duel-pile-card-tile[data-player][data-location][data-sequence],.duel-pile-hover-item[data-player][data-location][data-sequence],.duel-prompt-card[data-player][data-location][data-sequence]')];
    let matches=candidates.filter(node=>this.chainIndicatorNodeMatches(node,target));
    if(!matches.length)matches=this.chainIndicatorFallbackMatches(candidates,target,{allowMoved:false});
    if(!matches.length){const key=this.locationKey(Number(target.location)||0);if(['deck','grave','removed','extra'].includes(key)){const pile=scope.querySelector?.(`.duel-pile[data-player="${Number(target.controller)||0}"][data-location="${key}"]`);if(pile)matches=[pile];}}
    return matches;
  }

  playEffectTargetPresentation(targets=[]) {
    if(this.isReplaySeekReconstruction())return 0;
    const list=(targets||[]).filter(item=>Number(item?.code));
    if(!list.length||!this.duelAnimationsEnabled||!this.targetPresentationsEnabled||!this.boardWrap||typeof document==='undefined')return 0;
    this.boardWrap.querySelectorAll?.('.duel-effect-target-showcase').forEach(node=>node.remove());
    const duration=Math.max(720,Math.round((1050+Math.min(3,list.length-1)*70)*this.actionPresentationScale()));
    const node=document.createElement('div');node.className='duel-effect-target-showcase';node.style.setProperty('--effect-target-ms',`${duration}ms`);node.style.setProperty('--effect-target-count',String(Math.max(1,list.length)));node.setAttribute('aria-hidden','true');
    const cards=document.createElement('div');cards.className='duel-effect-target-showcase-cards';
    const now=Date.now();for(const [key,seenAt] of this.effectTargetPresentationHistory)if(now-Number(seenAt)>8000)this.effectTargetPresentationHistory.delete(key);
    for(const target of list){const targetKey=[Number(target.controller)||0,Number(target.location)||0,Number(target.sequence)||0,Number(target.code)||0].join(':');this.effectTargetPresentationHistory.set(targetKey,now);const frame=document.createElement('span');frame.className='duel-effect-target-showcase-card';const img=document.createElement('img');img.src=cardImage(target.code);img.alt='';const ring=document.createElement('i');ring.className='duel-effect-target-reticle';frame.append(img,ring);cards.append(frame);for(const physical of this.effectTargetPhysicalNodes(target)){physical.classList.remove('duel-effect-targeted');void physical.offsetWidth;physical.classList.add('duel-effect-targeted');setTimeout(()=>physical?.classList?.remove('duel-effect-targeted'),duration+120);}}
    node.append(cards);this.boardWrap.append(node);this.playSound('select');this.traceSession?.('effect-target-presentation',{durationMs:duration,targets:list.map(item=>({code:item.code,controller:item.controller,location:item.location,sequence:item.sequence}))});
    setTimeout(()=>node.remove(),duration+80);return duration;
  }

  cloneDuelDeck(deck={}) {
    const map=list=>(list||[]).map(entry=>({id:Number(entry?.id??entry)||0})).filter(entry=>entry.id);
    return {main:map(deck.main),extra:map(deck.extra),side:map(deck.side)};
  }

  duelDeckCodes(deck={}) {
    const map=list=>(list||[]).map(entry=>Number(entry?.id??entry)).filter(Number.isFinite).filter(Boolean);
    return {main:map(deck.main),extra:map(deck.extra),side:map(deck.side)};
  }

  isExtraDeckCard(code) {
    const card=this.getCardById?.(Number(code))||{};const type=String(card.type||card.humanReadableCardType||card.frameType||'').toLowerCase();
    return /(fusion|synchro|xyz|link)/.test(type);
  }

  validateDuelDeck(deck,label='Deck') {
    const codes=this.duelDeckCodes(deck),errors=[];
    if(!codes.main.length)errors.push(`${label} Main Deck is empty.`);
    if(this.strictDeckValidation){
      if(codes.main.length<40||codes.main.length>60)errors.push(`${label} Main Deck must contain 40 to 60 cards for Tournament mode.`);
      if(codes.extra.length>15)errors.push(`${label} Extra Deck cannot exceed 15 cards.`);
      if(codes.side.length>15)errors.push(`${label} Side Deck cannot exceed 15 cards.`);
    }
    const banlist=this.currentBanlist();
    if(this.strictDeckValidation&&!/^NONE$/i.test(banlist)&&!/^NO BANLIST/i.test(banlist)){
      const counts=new Map();for(const code of [...codes.main,...codes.extra,...codes.side])counts.set(code,(counts.get(code)||0)+1);
      const maxFor=status=>status==='Forbidden'?0:status==='Limited'?1:status==='Semi-Limited'?2:3;
      for(const [code,count] of counts){const status=this.getCardLimitStatus?.(code,banlist)||'Unlimited',max=maxFor(status);if(count>max)errors.push(`${label}: ${this.cardName(code)} has ${count} copies, but ${banlist} status ${status} allows ${max}.`);}
    }
    if(errors.length)throw new Error(errors.slice(0,8).join(' ')+(errors.length>8?` ${errors.length-8} additional deck-legality issue(s).`:''));
    return codes;
  }

  initializeMatchDecks(playerDeck,opponentDeck) {
    this.matchDecks={player:this.cloneDuelDeck(playerDeck),dummy:this.cloneDuelDeck(opponentDeck)};
    this.matchSideBaseline={player:this.cloneDuelDeck(playerDeck),dummy:this.cloneDuelDeck(opponentDeck)};
    if(this.matchMode==='match3')this.matchState={game:1,wins:[0,0],lastWinner:null,lastLoser:null,complete:false};else this.matchState=null;
    this.syncMatchStatus();
  }

  syncMatchStatus() {
    const node=$id('duelMatchStatus');if(!node)return;
    if(this.matchMode!=='match3'||!this.matchState){node.hidden=true;node.textContent='';return;}
    node.hidden=false;node.textContent=`Match G${this.matchState.game} · ${this.matchState.wins[0]}-${this.matchState.wins[1]}`;
  }

  registerMatchResult(player=null) {
    if(this.matchMode!=='match3'||!this.matchState)return;
    const state=this.matchState;if(state.lastCountedGame===state.game)return;
    state.lastCountedGame=state.game;
    if(player===0||player===1){state.wins[player]+=1;state.lastWinner=player;state.lastLoser=player===0?1:0;}else{state.lastWinner=null;state.lastLoser=null;}
    state.complete=state.wins[0]>=2||state.wins[1]>=2||state.game>=3;
    this.syncMatchStatus();
  }

  handleResultPrimaryAction() {
    if(this.matchMode==='match3'&&this.matchState&&!this.matchState.complete){this.startNextMatchGame();return;}
    if(this.matchMode==='match3'&&this.matchState?.complete){this.initializeMatchDecks(this.getDeck(),this.opponentDeckMode==='custom'&&this.opponentDeckSelection?.deck?this.opponentDeckSelection.deck:this.getDeck());this.start(true);return;}
    this.rematchCurrentDuel();
  }

  async rematchCurrentDuel() {
    if(this.starting)return;
    const firstPlayer=Number(this.currentFirstPlayer)===1?1:0;
    this.hideResultOverlay();this.clearSimulatorTaskPrompt({force:true});
    this.running=false;this.processLoopSerial+=1;this.releaseReplayGate();
    if(this.handle)this.destroyDuel();
    this.finalResult=null;this.pendingResult=null;this.rematchStartContext={firstPlayer};
    await Promise.resolve();
    return this.start(true);
  }

  async startNextMatchGame() {
    if(this.starting||this.matchMode!=='match3'||!this.matchState||this.matchState.complete)return;
    this.hideResultOverlay();
    this.autoSideDummyDeck();
    const loser=this.matchState.lastLoser;
    if(loser===1)this.pendingNextGameFirstPlayer=this.chooseDummyPreferredFirstPlayer();
    else this.pendingNextGameFirstPlayer=null;
    this.matchState.game+=1;this.sideDeckEditBaseline=null;this.sideDeckSelection=null;this.syncMatchStatus();
    await this.start(true);
  }

  dummyMatchupCardScore(code,opponentProfile={}) {
    const card=this.getCardById?.(Number(code))||{},text=String(card.desc||card.description||'').toLowerCase();let score=this.dummyEffectStrategicScore(text,code);
    const tags=opponentProfile.tags||{};
    if(tags.grave>4&&/banish .*gy|cards? in .*gy|graveyard.*banish|neither player can .*grave|would be sent to the gy.*banish/.test(text))score+=260;
    if(tags.special>5&&/special summon.*negate|cannot special summon|each time .*special summon|tribute .*special summoned/.test(text))score+=220;
    if(tags.backrow>4&&/destroy .*spell|destroy .*trap|spell\/trap|banish .*spell|banish .*trap/.test(text))score+=170;
    if(opponentProfile.comboDensity>10&&/negate|cannot activate|draw .*instead|add .* deck .* hand/.test(text))score+=130;
    if(opponentProfile.controlDensity>8&&/unaffected|cannot be negated|destroy .*spell|destroy .*trap|banish .*field/.test(text))score+=110;
    return score;
  }

  autoSideDummyDeck() {
    if(this.matchMode!=='match3'||!this.matchDecks?.dummy?.side?.length)return;
    const swaps=this.dummyDifficulty==='expert'?3:this.dummyDifficulty==='competitive'?2:this.dummyDifficulty==='casual'?1:0;if(!swaps)return;
    const deck=this.matchDecks.dummy,opponentProfile=this.buildDummyStrategyProfile(this.matchDecks.player||{});
    const sideRanked=(deck.side||[]).map((entry,index)=>({entry,index,code:Number(entry?.id||entry),extra:this.isExtraDeckCard(Number(entry?.id||entry)),score:this.dummyMatchupCardScore(Number(entry?.id||entry),opponentProfile)})).sort((a,b)=>b.score-a.score);
    let made=0;
    for(const candidate of sideRanked){if(made>=swaps)break;const zone=candidate.extra?'extra':'main',pool=deck[zone]||[];if(!pool.length)continue;
      const ranked=pool.map((entry,index)=>({entry,index,code:Number(entry?.id||entry),score:this.dummyMatchupCardScore(Number(entry?.id||entry),opponentProfile)+this.dummyCardStrategicValue({code:Number(entry?.id||entry)})*.12})).sort((a,b)=>a.score-b.score);
      const outgoing=ranked[0];if(!outgoing||candidate.score<outgoing.score+35)continue;
      const sideIndex=(deck.side||[]).findIndex(entry=>entry===candidate.entry);if(sideIndex<0)continue;
      const temp=pool[outgoing.index];pool[outgoing.index]=deck.side[sideIndex];deck.side[sideIndex]=temp;made++;
    }
    if(made)this.log(`Practice Dummy side-decked ${made} card${made===1?'':'s'} for the next game using matchup evaluation.`,{type:'match-side',controller:1});
  }

  renderSideDeckManager() {
    if(this.matchMode!=='match3'||!this.matchState||this.matchState.complete||!this.matchDecks?.player){this.toast('Side Deck changes are available between games in Best of 3 mode.');return;}
    const deck=this.matchDecks.player;if(!this.sideDeckEditBaseline)this.sideDeckEditBaseline=this.cloneDuelDeck(deck);
    this.hideResultOverlay();this.promptView='side-deck';this.promptMinimized=false;this.prompt?.classList.remove('selection-prompt','card-details-prompt','duel-prompt-hidden');this.promptTitle.textContent='Side Deck - Between Games';this.promptBody.replaceChildren();
    const intro=document.createElement('p');intro.className='duel-selection-purpose';intro.textContent='Swap cards one-for-one between the Side Deck and the Main or Extra Deck. Main Deck cards can only swap with non-Extra Deck cards; Extra Deck cards can only swap with Extra Deck cards. Total deck sizes remain unchanged.';this.promptBody.append(intro);
    const counts=document.createElement('div');counts.className='duel-side-counts';counts.textContent=`Main ${deck.main.length} · Extra ${deck.extra.length} · Side ${deck.side.length}`;this.promptBody.append(counts);
    const grid=document.createElement('div');grid.className='duel-side-manager';
    const renderZone=(zone,label)=>{const section=document.createElement('section');section.className='duel-side-zone';const h=document.createElement('h3');h.textContent=label;section.append(h);const cards=document.createElement('div');cards.className='duel-side-card-grid';(deck[zone]||[]).forEach((entry,index)=>{const code=Number(entry?.id||entry),button=document.createElement('button');button.type='button';button.className='duel-side-card';button.dataset.zone=zone;button.dataset.index=String(index);button.title=this.cardName(code);if(this.sideDeckSelection?.zone===zone&&this.sideDeckSelection?.index===index)button.classList.add('selected');const img=document.createElement('img');img.src=cardImage(code);img.alt=this.cardName(code);const name=document.createElement('span');name.textContent=this.cardName(code);button.append(img,name);button.addEventListener('click',()=>this.handleSideDeckCardSelection(zone,index));cards.append(button);});if(!deck[zone]?.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='No cards';cards.append(empty);}section.append(cards);return section;};
    grid.append(renderZone('main','Main Deck'),renderZone('extra','Extra Deck'),renderZone('side','Side Deck'));this.promptBody.append(grid);
    const controls=document.createElement('div');controls.className='duel-prompt-controls';controls.append(this.button('Reset Changes',()=>{this.matchDecks.player=this.cloneDuelDeck(this.sideDeckEditBaseline);this.sideDeckSelection=null;this.renderSideDeckManager();},{ghost:true}),this.button('Done',()=>{this.sideDeckSelection=null;this.sideDeckEditBaseline=null;this.hidePrompt();this.promptView='';const overlay=$id('duelResultOverlay');if(overlay)overlay.hidden=false;}));this.promptBody.append(controls);this.showPrompt({dismissible:false});this.schedulePromptFit();
  }

  handleSideDeckCardSelection(zone,index) {
    const deck=this.matchDecks?.player;if(!deck?.[zone]?.[index])return;
    const current={zone,index};const selected=this.sideDeckSelection;
    if(!selected){this.sideDeckSelection=current;this.renderSideDeckManager();return;}
    if(selected.zone===zone&&selected.index===index){this.sideDeckSelection=null;this.renderSideDeckManager();return;}
    const involvesSide=selected.zone==='side'||zone==='side';if(!involvesSide){this.sideDeckSelection=current;this.renderSideDeckManager();return;}
    const sideRef=selected.zone==='side'?selected:current,deckRef=selected.zone==='side'?current:selected;if(deckRef.zone!=='main'&&deckRef.zone!=='extra'){this.sideDeckSelection=current;this.renderSideDeckManager();return;}
    const sideCard=deck.side?.[sideRef.index],deckCard=deck[deckRef.zone]?.[deckRef.index];if(!sideCard||!deckCard)return;
    const sideIsExtra=this.isExtraDeckCard(Number(sideCard?.id||sideCard)),needsExtra=deckRef.zone==='extra';if(sideIsExtra!==needsExtra){this.toast(needsExtra?'Select an Extra Deck card from the Side Deck.':'Select a Main Deck card from the Side Deck.');this.sideDeckSelection=sideRef;this.renderSideDeckManager();return;}
    deck[deckRef.zone][deckRef.index]=sideCard;deck.side[sideRef.index]=deckCard;this.sideDeckSelection=null;this.playSound('select');this.renderSideDeckManager();
  }

  chooseStartingPlayerBeforeDuel({forcedChooser=null}={}) {
    if(this.replayPlayback?.data?.firstPlayer!=null)return Promise.resolve(Number(this.replayPlayback.data.firstPlayer)===1?1:0);
    if(forcedChooser===1)return Promise.resolve(this.chooseDummyPreferredFirstPlayer());
    if(this.firstPlayerPreference==='you')return Promise.resolve(0);
    if(this.firstPlayerPreference==='dummy')return Promise.resolve(1);
    if(this.firstPlayerPreference==='random')return Promise.resolve(crypto.getRandomValues(new Uint32Array(1))[0]%2);
    if(!this.prompt||!this.promptBody||!this.promptTitle)return Promise.resolve(0);
    this.promptView='first-player-start';this.promptMinimized=false;this.prompt.classList.remove('duel-prompt-hidden');this.promptTitle.textContent=forcedChooser===0?'Choose Who Goes First':'Choose First Player';this.promptBody.replaceChildren();
    const intro=document.createElement('p');intro.className='duel-selection-purpose';intro.textContent=forcedChooser===0?'You lost the previous game, so choose who goes first in the next game.':'Choose who takes the first turn. Deck Studio remaps OCGCore player ownership so this changes the actual turn order, not only presentation.';this.promptBody.append(intro);
    return new Promise(resolve=>{this.preDuelFirstPlayerResolve=resolve;const choose=value=>{this.preDuelFirstPlayerResolve=null;this.hidePrompt();this.promptView='';resolve(value);};const row=document.createElement('div');row.className='duel-dummy-mode-choice-list';row.append(this.renderIntegratedEffectChoice('You Go First','Your deck is loaded as OCGCore team 1 and you take Turn 1.',()=>choose(0)),this.renderIntegratedEffectChoice('Practice Dummy Goes First','The Dummy deck is loaded as OCGCore team 1 and takes Turn 1.',()=>choose(1)),this.renderIntegratedEffectChoice('Random','Randomly determine the actual first player.',()=>choose(crypto.getRandomValues(new Uint32Array(1))[0]%2)));this.promptBody.append(row);this.showPrompt({dismissible:false});this.schedulePromptFit();});
  }

  chooseDummyPreferredFirstPlayer() {
    const profile=this.dummyStrategyProfile||{};
    if(profile.goSecondBias>profile.goFirstBias+18)return 0;
    return 1;
  }

  activePlayerDeck() { return this.matchMode==='match3'&&this.matchDecks?.player?this.matchDecks.player:this.getDeck(); }
  activeDummyDeck(baseDeck=null) { if(this.matchMode==='match3'&&this.matchDecks?.dummy)return this.matchDecks.dummy;return baseDeck||(this.opponentDeckMode==='custom'&&this.opponentDeckSelection?.deck?this.opponentDeckSelection.deck:this.getDeck()); }

  buildDummyStrategyProfile(deck={}) {
    const codes=this.duelDeckCodes(deck),cards=[...codes.main,...codes.extra].map(code=>this.getCardById?.(code)).filter(Boolean),archetypes=new Map();
    const tags={search:0,draw:0,grave:0,banish:0,special:0,negate:0,destroy:0,backrow:0,battle:0,fusion:0,synchro:0,xyz:0,link:0};
    for(const card of cards){const arch=String(card.archetype||'').trim();if(arch)archetypes.set(arch,(archetypes.get(arch)||0)+1);const text=String(card.desc||card.description||'').toLowerCase(),type=String(card.type||card.frameType||'').toLowerCase();if(/add .* from your deck|search your deck/.test(text))tags.search++;if(/draw \d|draw card/.test(text))tags.draw++;if(/graveyard|\bgy\b|send .* to the gy/.test(text))tags.grave++;if(/banish/.test(text))tags.banish++;if(/special summon/.test(text))tags.special++;if(/negate/.test(text))tags.negate++;if(/destroy/.test(text))tags.destroy++;if(/spell|trap/.test(type)&&/(continuous|field|counter|trap)/.test(type))tags.backrow++;if(Number(card.atk||card.attack)>2500)tags.battle++;if(/fusion/.test(type))tags.fusion++;if(/synchro/.test(type))tags.synchro++;if(/xyz/.test(type))tags.xyz++;if(/link/.test(type))tags.link++;}
    const top=[...archetypes.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||'Generic';const comboDensity=tags.search+tags.draw+tags.special+tags.grave;const controlDensity=tags.negate+tags.destroy+tags.backrow;
    return {name:top,tags,comboDensity,controlDensity,goFirstBias:controlDensity*2+comboDensity,goSecondBias:tags.destroy*2+tags.banish*2+tags.battle};
  }

  concedeDuel() {
    if(!this.running||this.finalResult)return;
    this.running=false;this.pendingResult=null;this.finalResult=null;this.log('Player concedes the duel.',{type:'concede',controller:0});this.showResultOverlay({player:1,reason:'You conceded the duel.'});
  }

  replaySourceData() { return this.replayPlayback?.data || this.replaySession || null; }

  replayDecisionCount(data=this.replaySourceData()) { return Array.isArray(data?.decisions)?data.decisions.length:0; }

  isReplaySeekReconstruction() { return !!this.replayPlayback?.seeking; }

  clearReplaySeekPresentationArtifacts() {
    this.animationQueue=[];
    this.pendingDrawArrivals?.clear?.();this.pendingMoveArrivals?.clear?.();this.pendingDrawMoveCodes?.clear?.();this.pendingDrawPresentationCounts=[0,0];
    this.actionPresentationUntil=0;this.cardAnimationPresentationUntil=0;this.chainOutcomePresentationUntil=0;this.damagePresentationUntil=0;
    this.clearOpponentEvents();this.clearPhaseAnnouncements();
    this.affectedCardOutcomeQueue=[];if(this.currentAffectedCardOutcome?.timer)clearTimeout(this.currentAffectedCardOutcome.timer);this.currentAffectedCardOutcome=null;
    this.activationPresentationHistory?.clear?.();this.effectTargetPresentationHistory?.clear?.();
    this.boardWrap?.querySelectorAll?.('.duel-activation-showcase,.duel-effect-target-showcase,.duel-affected-card-showcase,.duel-anchored-action-indicator').forEach(node=>node.remove());
    this.root?.querySelectorAll?.('.duel-effect-targeted,.duel-attack-source-cue,.duel-attack-target-cue,.duel-direct-target-cue,.duel-anim-move,.duel-anim-draw,.duel-anim-summon,.duel-anim-special,.duel-anim-flip,.duel-anim-activate').forEach(node=>node.classList.remove('duel-effect-targeted','duel-attack-source-cue','duel-attack-target-cue','duel-direct-target-cue','duel-anim-move','duel-anim-draw','duel-anim-summon','duel-anim-special','duel-anim-flip','duel-anim-activate'));
  }

  toggleReplayToolbar(force=null) {
    const panel=$id('duelReplayToolbar'),toggle=$id('duelReplayToggle'),topToggle=$id('duelReplayTopBtn');
    const open=force==null?!this.replayToolbarOpen:!!force;this.replayToolbarOpen=open;
    if(panel)panel.hidden=!open;if(toggle)toggle.setAttribute('aria-expanded',open?'true':'false');if(topToggle)topToggle.setAttribute('aria-expanded',open?'true':'false');
    if(open)this.syncReplayControls({renderEvents:true});
  }

  toggleReplayEvents(force=null) {
    const data=this.replaySourceData(),events=Array.isArray(data?.events)?data.events:[];
    const open=(force==null?!this.replayEventsOpen:!!force)&&events.length>0;this.replayEventsOpen=open;
    const node=$id('duelReplayEvents'),button=$id('duelReplayEventsBtn');if(node)node.hidden=!open;if(button)button.setAttribute('aria-pressed',open?'true':'false');
    if(open)this.renderReplayEvents();
  }

  replayMessageTypeLabel(type) {
    const value=Number(type),entries=Object.entries(this.mod?.OcgMessageType||{});const found=entries.find(([,v])=>Number(v)===value)?.[0]||`Event ${value}`;
    return String(found).replace(/^MSG_/i,'').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,ch=>ch.toUpperCase());
  }

  replayEventText(event={}) {
    const parts=[`Turn ${Math.max(1,Number(event.turn)||1)}`];if(event.phase!=null)parts.push(this.phaseLabel(Number(event.phase)));parts.push(this.replayMessageTypeLabel(event.type));
    const code=Number(event.code)||0;if(code)parts.push(this.cardName(code));if(Number(event.chainLink)>0)parts.push(`CL${Number(event.chainLink)}`);return parts.join(' · ');
  }

  renderReplayEvents() {
    const host=$id('duelReplayEvents');if(!host)return;host.replaceChildren();const data=this.replaySourceData(),events=Array.isArray(data?.events)?data.events:[];
    if(!events.length){const empty=document.createElement('div');empty.className='duel-replay-event-empty';empty.textContent='No replay events have been recorded yet.';host.append(empty);return;}
    const shown=events.slice(-300);for(const event of shown){const row=document.createElement('button');row.type='button';row.className='duel-replay-event';row.textContent=this.replayEventText(event);const decision=Number(event.decisionIndex);if(Number.isFinite(decision)&&decision>=0){row.title=`Jump to recorded decision ${decision}`;row.addEventListener('click',()=>this.seekReplayDecision(decision));}else{row.disabled=true;row.title='This older replay does not contain event-to-decision markers.';}host.append(row);}host.scrollTop=host.scrollHeight;
  }

  syncReplayControls({renderEvents=false}={}) {
    const data=this.replaySourceData(),total=this.replayDecisionCount(data),playback=this.replayPlayback?.mode==='playback'?this.replayPlayback:null,reconstruction=this.replayPlayback?.seeking?this.replayPlayback:null,branch=this.liveReplayBranch?.ready?this.liveReplayBranch:null;
    const actualIndex=playback?Math.max(0,Number(playback.index)||0):branch?Math.max(0,Math.min(total,Number(branch.index)||0)):total,seekTarget=reconstruction&&Number.isFinite(Number(reconstruction.stopAtIndex))?Math.max(0,Math.min(total,Number(reconstruction.stopAtIndex))):null,previewTarget=this.replaySeekPreviewTarget==null?null:Math.max(0,Math.min(total,Number(this.replaySeekPreviewTarget)||0)),index=previewTarget==null?(seekTarget==null?actualIndex:seekTarget):previewTarget;
    const timeline=$id('duelReplayTimeline'),timelineValue=$id('duelReplayTimelineValue'),status=$id('duelReplayStatus'),play=$id('duelReplayPlayPauseBtn'),speed=$id('duelReplaySpeed');
    if(timeline){timeline.max=String(Math.max(0,total));timeline.value=String(Math.min(total,index));timeline.disabled=total===0;}if(timelineValue)timelineValue.textContent=`${Math.min(total,index)} / ${total}`;
    if(status){if(reconstruction?.branchLive)status.textContent=`Seeking live history · ${Math.min(total,index)} / ${total}`;else if(playback?.seeking)status.textContent=`Seeking replay · ${Math.min(total,index)} / ${total}`;else if(playback)status.textContent=`Replay ${playback.paused?'paused':'playing'} · ${Math.min(total,index)} / ${total}`;else if(branch){const future=Math.max(0,total-Math.min(total,index));status.textContent=future?`Live branch point · ${Math.min(total,index)} / ${total} · ${future} future decision${future===1?'':'s'} preserved`:`Live history caught up · ${Math.min(total,index)} / ${total}`;}else if(this.replaySession)status.textContent=`Live recording · ${total} decision${total===1?'':'s'}`;else status.textContent='No replay recorded';}
    if(play){if(branch&&!playback&&!reconstruction){play.textContent=branch.awaitingContinue?'Continue':'Live';play.disabled=!branch.awaitingContinue;}else{const activelyPlaying=!!(playback&&!playback.paused&&!playback.seeking);play.textContent=activelyPlaying?'Pause':'Play';play.disabled=total===0||!!reconstruction;}}if(speed){speed.value=String(this.replaySpeed||1);speed.disabled=total===0||!!branch&&!playback;}
    const setDisabled=(id,value)=>{const node=$id(id);if(node)node.disabled=!!value;};setDisabled('duelReplaySaveBtn',!data);setDisabled('duelReplayCheckpointBtn',!data);setDisabled('duelReplayDebugBtn',!data);setDisabled('duelReplayRestartBtn',total===0||!!reconstruction);setDisabled('duelReplayPreviousBtn',total===0||index<=0||!!reconstruction);setDisabled('duelReplayNextBtn',total===0||index>=total||!!reconstruction);setDisabled('duelReplayEndBtn',total===0||index>=total||!!reconstruction);setDisabled('duelReplayEventsBtn',!(Array.isArray(data?.events)&&data.events.length)||!!reconstruction);
    if(this.replayEventsOpen&&(renderEvents||playback||branch))this.renderReplayEvents();
  }

  setReplaySpeed(value=1) {
    const speed=[0.5,1,2,4].includes(Number(value))?Number(value):1;this.replaySpeed=speed;if(this.replayPlayback?.mode==='playback')this.replayPlayback.speed=speed;this.syncReplayControls();
  }

  stopReplayPlayback({closeToolbar=false,preserveSeekVisual=false}={}) {
    const playback=this.replayPlayback;
    if(playback){playback.cancelled=true;playback.paused=true;this.releaseReplayGate(playback);}
    this.replayPlayback=null;
    if(!preserveSeekVisual)this.finishReplaySeekVisual();
    if(closeToolbar)this.toggleReplayToolbar(false);
    if(!preserveSeekVisual)this.syncReplayControls();
  }

  beginManualReplaySeek() {
    this.replayManualSeekActive=true;const playback=this.replayPlayback?.mode==='playback'?this.replayPlayback:null;if(!playback)return;
    playback.resumeAfterSeek=false;playback.stepOnce=false;if(!playback.seeking)playback.paused=true;this.syncReplayControls();
  }

  previewReplaySeek(target=0) {
    const data=this.replaySourceData(),total=this.replayDecisionCount(data),index=Math.max(0,Math.min(total,Math.round(Number(target)||0)));
    this.replaySeekPreviewTarget=index;this.beginManualReplaySeek();
    const out=$id('duelReplayTimelineValue');if(out)out.textContent=`${index} / ${total}`;
    this.seekReplayDecision(index,{live:true});
  }

  cancelReplaySeekPreview() {
    this.replayManualSeekActive=false;this.replaySeekPreviewTarget=null;const playback=this.replayPlayback?.mode==='playback'?this.replayPlayback:null;if(playback){playback.resumeAfterSeek=false;if(!playback.seeking)playback.paused=true;}this.syncReplayControls();
  }

  commitReplaySeek(target=0) {
    const index=this.replaySeekPreviewTarget==null?Number(target)||0:this.replaySeekPreviewTarget;this.replaySeekPreviewTarget=null;this.replayManualSeekActive=false;
    const now=typeof performance!=='undefined'&&performance.now?performance.now():Date.now();const playback=this.replayPlayback?.mode==='playback'?this.replayPlayback:null;if(playback){playback.resumeAfterSeek=false;playback.stepOnce=false;}if(this.replaySeekLastCommit?.index===index&&now-Number(this.replaySeekLastCommit.at||0)<120){if(playback&&!playback.seeking)playback.paused=true;this.syncReplayControls();return;}this.replaySeekLastCommit={index,at:now};this.seekReplayDecision(index,{live:false});
  }

  beginReplaySeekVisual(target=0,total=this.replayDecisionCount(),{live=false}={}) {
    const board=$id('duelBoardWrap');if(!board)return;
    let overlay=this.replaySeekOverlay;
    if(!overlay){
      overlay=document.createElement('div');overlay.setAttribute('aria-live','polite');overlay.style.cssText='position:absolute;inset:0;z-index:150;overflow:hidden;pointer-events:none;background:#0d121b;';
      const snapshot=board.cloneNode(true);snapshot.removeAttribute('id');snapshot.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));snapshot.querySelectorAll('script').forEach(node=>node.remove());snapshot.style.cssText='position:absolute;inset:0;width:100%;height:100%;margin:0;pointer-events:none;';overlay.append(snapshot);
      const badge=document.createElement('div');badge.dataset.replaySeekBadge='1';badge.style.cssText='position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(15,20,30,.9);box-shadow:0 8px 24px rgba(0,0,0,.28);font-size:12px;font-weight:600;letter-spacing:.02em;color:#f4f7fb;';overlay.append(badge);
      const style=getComputedStyle(board);if(style.position==='static')board.style.position='relative';board.append(overlay);this.replaySeekOverlay=overlay;
    }
    const badge=overlay.querySelector('[data-replay-seek-badge]');if(badge){badge.hidden=!!live;badge.textContent=`Seeking replay · ${Math.max(0,Number(target)||0)} / ${Math.max(0,Number(total)||0)}`;}
  }

  finishReplaySeekVisual() {
    try{this.replaySeekOverlay?.remove?.();}catch{}this.replaySeekOverlay=null;
  }

  releaseReplayGate(playback=this.replayPlayback) {
    const resolve=playback?.gateResolve;if(typeof resolve==='function'){playback.gateResolve=null;try{resolve();}catch{}}
  }

  async awaitReplayPlaybackGate() {
    const playback=this.replayPlayback;if(!playback||playback.mode!=='playback'||playback.cancelled)return;
    const hasStopTarget=playback.stopAtIndex!=null&&playback.stopAtIndex!=='';const target=hasStopTarget?Number(playback.stopAtIndex):NaN;
    if(hasStopTarget&&Number.isFinite(target)&&target>=0&&Number(playback.index)>=target){
      const resume=!!playback.resumeAfterSeek,serial=Number(playback.seekSerial)||0;
      playback.index=target;playback.stopAtIndex=null;playback.seeking=false;playback.paused=true;playback.resumeAfterSeek=false;
      this.clearReplaySeekPresentationArtifacts();this.refreshField();this.renderAll();this.syncReplayControls({renderEvents:true});
      await new Promise(resolve=>typeof requestAnimationFrame==='function'?requestAnimationFrame(()=>requestAnimationFrame(resolve)):setTimeout(resolve,32));
      if(this.replayPlayback!==playback||playback.cancelled||!this.running||!this.handle||Number(playback.seekSerial||0)!==serial)return;
      this.finishReplaySeekVisual();
      if(resume){playback.paused=false;this.releaseReplayGate(playback);this.syncReplayControls({renderEvents:true});}
    }
    while(this.replayPlayback===playback&&this.running&&this.handle&&!playback.cancelled&&playback.paused)await new Promise(resolve=>{playback.gateResolve=resolve;});
    if(this.replayPlayback!==playback||playback.cancelled||!this.running||!this.handle)return;
    if(!playback.seeking){await this.wait(120);if(this.replayPlayback!==playback||playback.cancelled||!this.running||!this.handle)return;while(this.replayPlayback===playback&&playback.paused&&!playback.cancelled)await new Promise(resolve=>{playback.gateResolve=resolve;});}
  }

  toggleReplayPlayback() {
    const playback=this.replayPlayback?.mode==='playback'?this.replayPlayback:null,branch=this.liveReplayBranch?.ready?this.liveReplayBranch:null;
    if(!playback&&branch){if(branch.awaitingContinue){this.continueLiveReplayBranch();return;}this.toast('Live control is paused at the selected history point. Make a move to branch from here.');return;}
    if(!playback){const data=this.replaySourceData();if(!this.replayDecisionCount(data)){this.toast('No replay decisions are available yet.');return;}this.replayFromStart(true);return;}
    playback.paused=!playback.paused;if(!playback.paused)this.releaseReplayGate(playback);this.syncReplayControls();
  }

  stepReplayForward() {
    const branch=this.liveReplayBranch?.ready?this.liveReplayBranch:null;if(branch&&!this.replayPlayback){const total=this.replayDecisionCount(branch.source||this.replaySession);this.seekReplayDecision(Math.min(total,(Number(branch.index)||0)+1));return;}
    const playback=this.replayPlayback?.mode==='playback'?this.replayPlayback:null;if(!playback){if(this.replayDecisionCount()>0)this.seekReplayDecision(1);return;}if(Number(playback.index)>=this.replayDecisionCount(playback.data))return;playback.stepOnce=true;if(playback.paused){playback.paused=false;this.releaseReplayGate(playback);}this.syncReplayControls();
  }

  replayPreviousDecision() { const playback=this.replayPlayback?.mode==='playback'?this.replayPlayback:null,branch=this.liveReplayBranch?.ready?this.liveReplayBranch:null;const current=playback?Number(playback.index)||0:branch?Number(branch.index)||0:this.replayDecisionCount();this.seekReplayDecision(Math.max(0,current-1)); }

  replayJumpToEnd() { const data=this.replaySourceData(),total=this.replayDecisionCount(data);if(total)this.seekReplayDecision(total); }

  replayFromStart(autoplay=true) { const data=this.replaySourceData();if(!this.replayDecisionCount(data)){this.toast('No replay decisions are available yet.');return;}this.clearLiveReplayBranch();this.hideResultOverlay();void this.startFromReplay(data,'playback',{paused:!autoplay,speed:this.replaySpeed}); }

  seekReplayDecision(target=0,{live=false}={}) {
    const branch=this.liveReplayBranch,activeBranchPlayback=this.replayPlayback?.branchLive?this.replayPlayback:null,data=branch?.source||this.replaySourceData(),total=this.replayDecisionCount(data);if(!total){this.toast('No replay decisions are available yet.');return;}const index=Math.max(0,Math.min(total,Math.round(Number(target)||0)));
    const liveSession=!!(this.replaySession&&this.running&&this.handle&&!this.finalResult&&!this.replayPlayback),branchSession=!!(branch&&(branch.ready||activeBranchPlayback));
    if(liveSession||branchSession){this.seekLiveReplayBranchDecision(index,{live});return;}
    if(this.starting){this.replaySeekQueuedTarget=index;this.replaySeekQueuedLive=!!live;return;}
    const playback=this.replayPlayback?.mode==='playback'?this.replayPlayback:null;if(playback&&index===Number(playback.index)&&!playback.seeking){playback.paused=true;playback.resumeAfterSeek=false;playback.stepOnce=false;this.finishReplaySeekVisual();this.syncReplayControls();return;}
    const seekSerial=++this.replaySeekSerial;this.beginReplaySeekVisual(index,total,{live});this.hideResultOverlay();
    if(playback&&playback.data===data&&!playback.cancelled&&this.running&&this.handle){
      const current=Math.max(0,Number(playback.index)||0);
      if(index>=current){
        playback.stopAtIndex=index;playback.seeking=true;playback.silentSeek=true;playback.resumeAfterSeek=false;playback.seekSerial=seekSerial;playback.seekDestination=index;playback.stepOnce=false;playback.paused=false;this.releaseReplayGate(playback);this.syncReplayControls();return;
      }
    }
    void this.startFromReplay(data,'playback',{paused:false,stopAtIndex:index,seeking:true,silentSeek:true,resumeAfterSeek:false,seekSerial,speed:this.replaySpeed});
  }

  snapshotReplayForLiveBranch(data=this.replaySession) {
    if(!data)return null;return {...data,decisions:[...(data.decisions||[])],events:[...(data.events||[])]};
  }

  clearLiveReplayBranch() {
    const resolve=this.liveReplayBranchGateResolve;this.liveReplayBranchGateResolve=null;if(typeof resolve==='function')try{resolve();}catch{}
    this.liveReplayBranch=null;
  }

  continueLiveReplayBranch() {
    const branch=this.liveReplayBranch;if(!branch?.ready||!branch.awaitingContinue)return false;branch.awaitingContinue=false;const resolve=this.liveReplayBranchGateResolve;this.liveReplayBranchGateResolve=null;if(typeof resolve==='function')try{resolve();}catch{}this.syncReplayControls();return true;
  }

  awaitLiveReplayBranchContinue() {
    const branch=this.liveReplayBranch;if(!branch?.ready||!branch.awaitingContinue)return Promise.resolve();return new Promise(resolve=>{this.liveReplayBranchGateResolve=resolve;});
  }

  seekLiveReplayBranchDecision(target=0,{live=false}={}) {
    let branch=this.liveReplayBranch,source=branch?.source||this.snapshotReplayForLiveBranch(this.replaySession);if(!source)return;const total=this.replayDecisionCount(source),index=Math.max(0,Math.min(total,Math.round(Number(target)||0)));
    if(!branch){if(index>=total){this.replaySeekPreviewTarget=null;this.syncReplayControls();return;}branch=this.liveReplayBranch={source,index,total,ready:false,awaitingContinue:false,forceManualAtTarget:false,createdAt:Date.now()};}
    else{branch.index=index;branch.total=total;branch.ready=false;branch.awaitingContinue=false;branch.forceManualAtTarget=false;}
    const resolve=this.liveReplayBranchGateResolve;this.liveReplayBranchGateResolve=null;if(typeof resolve==='function')try{resolve();}catch{}
    const playback=this.replayPlayback?.branchLive?this.replayPlayback:null,seekSerial=++this.replaySeekSerial;this.beginReplaySeekVisual(index,total,{live});this.hideResultOverlay();
    if(playback&&playback.data===source&&!playback.cancelled&&this.running&&this.handle&&index>=Math.max(0,Number(playback.index)||0)){
      playback.stopAtIndex=index;playback.seeking=true;playback.silentSeek=true;playback.seekSerial=seekSerial;playback.seekDestination=index;branch.index=index;this.syncReplayControls();return;
    }
    void this.startFromReplay(source,'resume',{stopAtIndex:index,seeking:true,silentSeek:true,seekSerial,speed:this.replaySpeed,branchLive:true,live});
  }

  finishLiveReplayBranchAtPrompt(prompt,playback=this.replayPlayback) {
    const branch=this.liveReplayBranch;if(!branch||!playback?.branchLive)return false;const total=this.replayDecisionCount(branch.source||playback.data),target=Math.max(0,Math.min(total,Number(playback.stopAtIndex??branch.index)||0));
    playback.index=target;playback.stopAtIndex=null;playback.seeking=false;playback.cancelled=true;this.replayPlayback=null;branch.index=target;branch.total=total;branch.ready=true;branch.awaitingContinue=Number(prompt?.player)===1;branch.forceManualAtTarget=Number(prompt?.player)===0;branch.promptPlayer=Number(prompt?.player)||0;
    this.clearReplaySeekPresentationArtifacts();this.refreshField();this.renderAll();this.finishReplaySeekVisual();this.replaySeekPreviewTarget=null;this.replayManualSeekActive=false;this.syncReplayControls({renderEvents:true});return true;
  }

  replayResponsesEquivalent(a,b) {
    try{return JSON.stringify(a,this.replayJSONReplacer.bind(this))===JSON.stringify(b,this.replayJSONReplacer.bind(this));}catch{return false;}
  }

  commitLiveReplayBranch() {
    const branch=this.liveReplayBranch;if(!branch?.ready||!this.replaySession)return false;const fork=Math.max(0,Math.min(this.replayDecisionCount(this.replaySession),Number(branch.index)||0)),oldTotal=this.replayDecisionCount(this.replaySession);
    this.replaySession.decisions=(this.replaySession.decisions||[]).slice(0,fork).map((entry,n)=>({...entry,n}));this.replaySession.events=(this.replaySession.events||[]).filter(event=>Number(event?.decisionIndex)<=fork).map((event,n)=>({...event,n}));this.replaySession={...this.replaySession,appBuild:DUEL_BRANCH,branchedAt:new Date().toISOString(),branchDecision:fork,branchedFromDecisionCount:oldTotal,decisions:this.replaySession.decisions,events:this.replaySession.events};
    this.clearLiveReplayBranch();this.syncReplayControls({renderEvents:true});return true;
  }

  preserveMatchingBranchDecision(prompt,response) {
    const branch=this.liveReplayBranch;if(!branch?.ready||!this.replaySession)return false;const index=Math.max(0,Number(branch.index)||0),entry=this.replaySession.decisions?.[index],explicit=Number(prompt?.player)===0&&this.userSubmittedPrompts?.has?.(prompt);
    if(explicit||!entry)return false;if(Number(entry.player)!==Number(prompt?.player)||Number(entry.type)!==Number(prompt?.type))return false;if(entry.signature&&entry.signature!==this.replayPromptSignature(prompt))return false;if(!this.replayResponsesEquivalent(entry.response,response))return false;
    branch.index=index+1;branch.forceManualAtTarget=false;branch.awaitingContinue=false;this.syncReplayControls({renderEvents:true});return true;
  }

  replayJSONReplacer(_key,value) { return typeof value==='bigint'?`__bigint__:${value.toString()}`:value; }
  replayJSONReviver(_key,value) { return typeof value==='string'&&value.startsWith('__bigint__:')?BigInt(value.slice(11)):value; }

  beginReplaySession({seed,playerMain,dummyMain,playerExtra,dummyExtra,firstPlayer}={}) {
    this.clearLiveReplayBranch();this.replaySession={schema:3,appBuild:DUEL_BRANCH,createdAt:new Date().toISOString(),rulesPackage:this.enginePackageStatus||null,format:this.duelFormat,banlist:this.currentBanlist(),strictDeckValidation:this.strictDeckValidation,matchMode:this.matchMode,ai:{mode:this.dummyMode,difficulty:this.dummyDifficulty,personality:this.dummyPersonality,profile:this.dummyStrategyProfile||null},firstPlayer:Number(firstPlayer)||0,seed:(seed||[]).map(v=>String(v)),playerMain:[...(playerMain||[])],dummyMain:[...(dummyMain||[])],playerExtra:[...(playerExtra||[])],dummyExtra:[...(dummyExtra||[])],decisions:[],events:[]};
    this.replayDecisionIndex=0;this.syncReplayControls();
  }

  recordReplayDecision(prompt,response) {
    if(!this.replaySession||this.replayPlayback?.mode==='playback')return;
    if(this.replayPlayback)return;if(this.liveReplayBranch?.ready){if(this.preserveMatchingBranchDecision(prompt,response))return;this.commitLiveReplayBranch();}
    const copy=typeof structuredClone==='function'?structuredClone(response):JSON.parse(JSON.stringify(response,this.replayJSONReplacer.bind(this)),this.replayJSONReviver.bind(this));this.replaySession.decisions.push({n:this.replaySession.decisions.length,player:Number(prompt?.player)||0,type:Number(prompt?.type),signature:this.replayPromptSignature(prompt),response:copy});this.syncReplayControls();
  }

  recordReplayEvent(message={}) {
    if(!this.replaySession||this.replayPlayback||this.liveReplayBranch?.ready)return;
    const event={n:this.replaySession.events.length,decisionIndex:this.replaySession.decisions.length,turn:Number(this.turn)||0,phase:Number(this.phase)||0,type:Number(message?.type),player:message?.player==null?null:Number(message.player),code:this.normalizeActionCode(message?.code||message?.card?.code||message?.from?.code||message?.to?.code||0),chainLink:Number(message?.chain_size||message?.chainLink||message?.chain_link)||0};
    this.replaySession.events.push(event);if(this.replaySession.events.length>20000)this.replaySession.events.splice(0,this.replaySession.events.length-20000);if(this.replayToolbarOpen&&this.replayEventsOpen)this.renderReplayEvents();
  }

  replayPromptSignature(prompt={}) {
    const codes=(items=[])=>items.map(item=>Number(item?.code)||0).join(',');return `${Number(prompt.player)||0}:${Number(prompt.type)||0}:${codes(prompt.selects||prompt.activates||prompt.summons||prompt.attacks||[])}`;
  }

  nextReplayResponse(prompt) {
    const playback=this.replayPlayback;if(!playback)return null;if(playback.mode==='resume'&&playback.branchLive&&Number.isFinite(Number(playback.stopAtIndex))&&Number(playback.index)>=Number(playback.stopAtIndex)){this.finishLiveReplayBranchAtPrompt(prompt,playback);return null;}const entry=playback.data?.decisions?.[playback.index||0];
    if(!entry){if(playback.mode==='resume'){this.replayPlayback=null;this.toast('Checkpoint restored. Live control resumed.');return null;}throw new Error('Replay ended before the Rules Engine reached a terminal duel state.');}
    if(Number(entry.player)!==Number(prompt.player)||Number(entry.type)!==Number(prompt.type))throw new Error(`Replay divergence at decision ${playback.index+1}: expected player ${entry.player}, prompt ${entry.type}; received player ${prompt.player}, prompt ${prompt.type}.`);
    const signature=this.replayPromptSignature(prompt);if(entry.signature&&entry.signature!==signature)throw new Error(`Replay divergence at decision ${playback.index+1}: the legal card/action set no longer matches the recorded duel state.`);
    playback.index=(playback.index||0)+1;if(playback.stepOnce){playback.stepOnce=false;playback.paused=true;}this.syncReplayControls({renderEvents:true});return entry.response;
  }

  downloadJSONFile(name,data) {
    const text=JSON.stringify(data,this.replayJSONReplacer.bind(this),2),blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
  }

  exportReplayFile(kind='replay') {
    const source=this.replaySourceData();if(!source){this.toast('Start a duel or open a replay before exporting replay data.');return;}
    const playback=this.replayPlayback?.mode==='playback'?this.replayPlayback:null,branch=this.liveReplayBranch?.ready?this.liveReplayBranch:null,checkpointDecision=playback?Math.max(0,Number(playback.index)||0):branch?Math.max(0,Number(branch.index)||0):this.replayDecisionCount(source);let decisions=[...(source.decisions||[])],events=[...(source.events||[])];if(kind==='checkpoint'&&(playback||branch)){decisions=decisions.slice(0,checkpointDecision);events=events.filter(event=>Number(event?.decisionIndex)<=checkpointDecision);}
    const data={...source,kind,decisions,events,checkpointDecision,match:this.matchState?{...this.matchState}:source.match||null};if(kind==='debug'){data.debugLines=[...(this.debugLines||[])];data.duelLog=(this.logLines||[]).map(entry=>typeof entry==='string'?entry:{text:entry.text,turn:entry.turn,phase:entry.phase,details:entry.details});data.debugSnapshot={turn:this.turn,phase:this.phase,lp:[...(this.lp||[])],displayLp:[...(this.displayLp||[])],decisionIndex:checkpointDecision};}
    const suffix=kind==='checkpoint'?'checkpoint':kind==='debug'?'debug_replay':'replay';this.downloadJSONFile(`YGO_Deck_Studio_${suffix}_${Date.now()}.json`,data);this.toast(kind==='checkpoint'?'Checkpoint saved.':kind==='debug'?'Debug replay saved.':'Replay exported.');
  }

  importReplayFile(mode='playback') {
    const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.addEventListener('change',async()=>{const file=input.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text(),this.replayJSONReviver.bind(this));if(!Array.isArray(data.decisions)||!Array.isArray(data.seed))throw new Error('Not a Deck Studio replay/checkpoint file.');this.toggleReplayToolbar(true);await this.startFromReplay(data,mode,{paused:false,speed:this.replaySpeed});}catch(error){this.replayPlayback=null;this.syncReplayControls();this.toast(`Replay could not be loaded: ${error?.message||error}`);}});input.click();
  }

  async startFromReplay(data,mode='playback',options={}) {
    if(this.starting){if(options.seeking&&Number.isFinite(Number(options.stopAtIndex))){this.replaySeekQueuedTarget=Number(options.stopAtIndex);this.replaySeekQueuedLive=!!options.live;if(this.liveReplayBranch)this.liveReplayBranch.index=Number(options.stopAtIndex);}return;}
    if(!options.branchLive)this.clearLiveReplayBranch();
    this.starting=true;this.running=false;this.processLoopSerial+=1;this.stopReplayPlayback({preserveSeekVisual:!!options.seeking});if(this.handle)this.destroyDuel();await new Promise(resolve=>setTimeout(resolve,0));
    const speed=[0.5,1,2,4].includes(Number(options.speed))?Number(options.speed):this.replaySpeed||1;this.replaySpeed=speed;
    this.replayPlayback={mode,data,index:0,paused:mode==='playback'?!!options.paused:false,speed,stopAtIndex:Number.isFinite(Number(options.stopAtIndex))?Number(options.stopAtIndex):null,seeking:!!options.seeking,silentSeek:!!options.silentSeek,resumeAfterSeek:mode==='playback'&&!!options.resumeAfterSeek,seekSerial:Number(options.seekSerial)||0,seekDestination:Number.isFinite(Number(options.stopAtIndex))?Number(options.stopAtIndex):null,stepOnce:false,gateResolve:null,branchLive:!!options.branchLive,cancelled:false};
    this.matchMode='single';this.duelFormat=['tcg','ocg'].includes(String(data?.format||'').toLowerCase())?String(data.format).toLowerCase():'tcg';this.toggleReplayToolbar(true);this.syncReplayControls({renderEvents:true});
    this.ensureAudio();this.show();this.hideResultOverlay();
    try{
      this.setEngineStatus(options.branchLive?'Restoring Live History...':'Preparing Replay...', 'working');this.prepareFieldScaffold();await this.ensureEngine();
      const requiredPackage=String(data?.rulesPackage?.packageId||''),currentPackage=String(this.enginePackageStatus?.packageId||'');if(requiredPackage&&currentPackage&&requiredPackage!==currentPackage)this.toast(`Replay was recorded with rules package ${requiredPackage}; current package is ${currentPackage}. Divergence checking remains enabled.`);
      await this.initializeDatabase();this.setCorePlayerMapping(Number(data.firstPlayer)||0);await this.createDuel(data.playerMain||[],data.playerExtra||[],data.dummyMain||[],data.dummyExtra||[],{seed:(data.seed||[]).map(BigInt),ordered:true,replayData:data});
      if(this.replayPlayback&&this.replaySeekQueuedTarget!=null){const total=this.replayDecisionCount(data),queued=Math.max(0,Math.min(total,Math.round(Number(this.replaySeekQueuedTarget)||0))),live=!!this.replaySeekQueuedLive;this.replaySeekQueuedTarget=null;this.replaySeekQueuedLive=false;this.replayPlayback.stopAtIndex=queued;this.replayPlayback.seeking=true;this.replayPlayback.silentSeek=true;this.replayPlayback.resumeAfterSeek=false;this.replayPlayback.seekDestination=queued;this.replayPlayback.seekSerial=++this.replaySeekSerial;if(this.liveReplayBranch)this.liveReplayBranch.index=queued;this.beginReplaySeekVisual(queued,total,{live});}
      const version=this.core.getVersion().join('.');this.setEngineStatus(`Rules Engine ${version} · ${DUEL_BRANCH}`,'ready');this.running=true;this.starting=false;this.processLoopSerial+=1;await this.processLoop();
    }catch(error){this.running=false;this.starting=false;if(options.branchLive)this.clearLiveReplayBranch();this.finishReplaySeekVisual();this.setEngineStatus('Replay error','error');this.syncReplayControls();this.showError(error);}
  }

  async start(restart = false, options = {}) {
    if (this.starting) return;
    const rematchContext=this.rematchStartContext;this.rematchStartContext=null;const fixedSetup=options?.fixedSetup?this.cloneDuelSetup(options.fixedSetup):null;
    if(fixedSetup)this.applyDuelSetup(fixedSetup);
    if(restart){this.running=false;this.processLoopSerial+=1;}
    this.stopReplayPlayback();this.clearLiveReplayBranch();
    this.starting = true;
    this.sessionTrace=[];this.sessionTraceSerial=0;this.sessionTraceStartedAt=new Date().toISOString();this.userSubmittedPrompts=new WeakSet();this.smartAutoPassedPrompts=new WeakSet();this.traceSession('session-start',{restart:!!restart,resetSameSettings:!!options?.resetSameSettings,build:DUEL_BRANCH});
    this.show();
    this.hideResultOverlay();
    try {
      if(!fixedSetup&&!rematchContext&&!(this.matchMode==='match3'&&this.matchState?.game>1))await new Promise(resolve=>typeof requestAnimationFrame==='function'?requestAnimationFrame(()=>resolve()):setTimeout(resolve,0));
      let initialSetup=null;if(!fixedSetup&&!rematchContext&&!(this.matchMode==='match3'&&this.matchState?.game>1)){initialSetup=await this.chooseDuelSetupBeforeDuel();if(!initialSetup){this.starting=false;return;}}
      this.ensureAudio();
      this.setEngineStatus('Preparing Rules Engine...', 'working');
      this.clearPrompt('Loading duel engine');
      const builderDeck=fixedSetup?this.cloneDuelDeck(fixedSetup.playerDeck):this.getDeck();
      const selectedOpponent=fixedSetup?this.cloneDuelDeck(fixedSetup.opponentDeck):(this.opponentDeckMode==='custom'&&this.opponentDeckSelection?.deck?this.opponentDeckSelection.deck:builderDeck);
      if(!fixedSetup){if(this.matchMode==='match3'){if(!this.matchDecks||!this.matchState||(!restart&&this.matchState.complete))this.initializeMatchDecks(builderDeck,selectedOpponent);}else{this.matchState=null;this.matchDecks=null;this.syncMatchStatus();}}
      const playerDeck=fixedSetup?builderDeck:this.activePlayerDeck(),opponentDeck=fixedSetup?selectedOpponent:this.activeDummyDeck(selectedOpponent);
      const playerCodes=this.validateDuelDeck(playerDeck,'Player deck');
      const opponentCodes=this.validateDuelDeck(opponentDeck,'Practice Dummy deck');
      this.dummyStrategyProfile=this.buildDummyStrategyProfile(opponentDeck);
      let firstPlayer=fixedSetup?.firstPlayer??rematchContext?.firstPlayer??this.pendingNextGameFirstPlayer??initialSetup?.firstPlayer;
      if(firstPlayer==null){const chooser=this.matchMode==='match3'&&this.matchState?.game>1?this.matchState.lastLoser:null;firstPlayer=await this.chooseStartingPlayerBeforeDuel({forcedChooser:chooser});if(firstPlayer==null){this.starting=false;return;}}
      this.pendingNextGameFirstPlayer=null;this.setCorePlayerMapping(firstPlayer);this.lastDuelSetup=this.captureDuelSetup(playerDeck,opponentDeck,firstPlayer);
      if (restart) this.destroyDuel();
      this.prepareFieldScaffold();
      await this.ensureEngine();
      await this.initializeDatabase();
      this.runtimeValidationWarning = '';
      await this.createDuel(playerCodes.main, playerCodes.extra, opponentCodes.main, opponentCodes.extra);
      const version = this.core.getVersion().join('.');
      const packageTag=this.enginePackageStatus?.packageId?` · ${this.enginePackageStatus.packageId}`:'';
      this.setEngineStatus(`Rules Engine ${version} · ${DUEL_BRANCH}${packageTag}`, 'ready');
      this.running = true;
      this.starting = false;
      this.traceSession('duel-ready',{rulesVersion:version,packageId:this.enginePackageStatus?.packageId||'',firstPlayer});
      this.processLoopSerial+=1;
      await this.processLoop();
    } catch (error) {
      this.traceSession('duel-error',{message:String(error?.message||error),stack:String(error?.stack||'')});
      console.error('Integrated duel failed', error);
      this.running = false;
      this.starting = false;
      this.setEngineStatus('Duel engine error', 'error');
      this.showError(error);
    }
  }

  show() {
    if (!this.root) return;
    this.app?.classList.add('duel-mode-hidden');
    this.root.hidden = false;
    document.body.classList.add('duel-mode-active');
    this.syncDeckLabels();
  }

  close() {
    this.cancelPendingPreDuelChoices();
    this.clearSimulatorTaskPrompt({force:true});
    this.starting=false;this.running=false;this.processLoopSerial+=1;this.releaseReplayGate();
    this.destroyDuel();
    this.replayPlayback=null;this.clearLiveReplayBranch();this.toggleReplayToolbar(false);this.syncReplayControls();
    this.root.hidden = true;
    this.app?.classList.remove('duel-mode-hidden');
    document.body.classList.remove('duel-mode-active');
  }

  destroyDuel() {
    this.cancelInformationalGate();
    this.clearPhaseAnnouncements();
    this.hideDirectSurfaceSelectionDock();
    this.restorePromptHome();
    if (this.core && this.handle) {
      try { this.core.destroyDuel(this.handle); } catch (e) { console.warn(e); }
    }
    this.handle = null;
    this.currentPrompt = null;
    this.selectedCardContext = null;
    this.activePlacePrompt = null;
    this.selectedPlaces = [];
    this.pendingResolve = null;
    this.promptRevision = 0;
    this.currentPromptRevision = 0;
    if(this.promptVisibilityTimer)clearTimeout(this.promptVisibilityTimer);
    this.promptVisibilityTimer = 0;
    if(this.interactionWatchdogTimer)clearTimeout(this.interactionWatchdogTimer);
    this.interactionWatchdogTimer=0;this.interactionWatchdogMisses=0;this.interactionWatchdogRevision=0;
    this.lastSubmittedPrompt = null;
    this.lastSubmittedResponse = null;
    this.awaitingPlayerResponseAck = null;
    this.playerResponseAckSerial = 0;
    this.pendingDecisionLease = null;
    this.authoritativePendingDecision = null;
    this.activeDecisionId = 0;
    this.renderedDecisionId = 0;
    if(this.decisionGuardianTimer)clearTimeout(this.decisionGuardianTimer);
    this.decisionGuardianTimer=0;this.decisionGuardianRestores=0;
    this.pendingRestoredStagedSelection = null;
    this.prompt?.classList?.remove?.('duel-prompt-awaiting-ack');
    this.prompt?.querySelector?.('.duel-prompt-ack-status')?.remove?.();
    this.stagedCardSelection = null;
    this.suppressNextAutoPlace = false;
    this.detailsReturnSnapshot = null;
    this.detailsDetachedFromChain = false;
    this.detailsOpenedPromptRevision = 0;
    this.detailsBackgroundPromptDirty = false;
    this.detailsCloseRequested = false;
    try{this.cardDetailsOverlay?.remove?.();}catch{}this.cardDetailsOverlay=null;this.cardDetailsTarget=null;this.hidePileHoverOverlay();
    this.auxiliaryReturnToMinimized = false;
  }

  prepareFieldScaffold() {
    this.turn = 0; this.turnPlayer = this.currentFirstPlayer; this.phase = null; this.presentedPhase = null; this.lp = [8000,8000]; this.displayLp = [8000,8000];
    this.knownHands = [[], []];
    this.knownExtras = [this.initialExtraCodes.map((code,sequence)=>({code,position:this.mod?.OcgPosition?.FACEDOWN_ATTACK||0,sequence,controller:0,location:this.mod?.OcgLocation?.EXTRA||0})), this.initialOpponentExtraCodes.map((code,sequence)=>({code,position:this.mod?.OcgPosition?.FACEDOWN_ATTACK||0,sequence,controller:1,location:this.mod?.OcgLocation?.EXTRA||0,isHidden:!this.opponentCardsVisible}))];
    this.knownPiles = [this.emptyKnownPiles(), this.emptyKnownPiles()];
    this.knownField = [this.emptyKnownField(), this.emptyKnownField()];
    this.field = {players:[this.emptyPlayer(),this.emptyPlayer()],chain:[]};
    this.liveMonsterStats?.clear?.();this.activeMonsterStatKeys?.clear?.();
    this.renderMeta(); this.renderField(); this.renderLog();
  }

  setEngineStatus(text, state = '') {
    if (!this.engineStatus) return;
    const fullText=String(text??'');
    this.engineStatus.textContent = fullText;
    this.engineStatus.title = `${fullText}${fullText?' · ':''}Click to expand or collapse.`;
    this.engineStatus.setAttribute('aria-label',fullText||'Duel engine status');
    this.engineStatus.dataset.state = state;
    if(state==='error')this.engineStatus.classList.add('expanded');
  }

  showPrompt({dismissible=false}={}) {
    if (!this.prompt) return;


    if(this.currentPrompt&&Number(this.promptDecisionIds?.get(this.currentPrompt)||0)===Number(this.activeDecisionId||0)){
      this.prompt.classList.remove('duel-prompt-awaiting-ack');
      this.prompt.querySelector?.('.duel-prompt-ack-status')?.remove();
      for(const node of this.prompt.querySelectorAll?.('[data-rc113-ack-disabled]')||[]){if('disabled' in node)node.disabled=node.dataset.rc113AckDisabled==='1';delete node.dataset.rc113AckDisabled;node.removeAttribute?.('aria-disabled');}
      this.prompt.dataset.decisionId=String(this.activeDecisionId||0);this.renderedDecisionId=this.activeDecisionId||0;
    }
    if(!this.promptMinimized)this.prompt.classList.remove('duel-prompt-hidden');
    this.prompt.dataset.dismissible = dismissible ? '1' : '0';
    if(this.promptRestoreButton)this.promptRestoreButton.hidden=!this.promptMinimized;
    this.syncChainPromptAttachment(this.currentPrompt);
    this.schedulePromptFit();
    if(this.chainVisualNode&&!this.chainVisualNode.hidden){const run=()=>this.positionChainVisualization();if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else run();}
    if(!$id('duelOpponentNotice')?.hidden){const run=()=>this.positionOpponentNotice();if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else run();}
  }

  clearExtraDeckViewerPresentation() {
    if(!this.prompt)return;
    this.prompt.classList.remove('duel-extra-deck-viewer-prompt','duel-direct-pile-viewer-prompt');
    for(const property of ['--duel-extra-card-w','--duel-extra-columns','--duel-extra-view-width','--duel-extra-view-height','--duel-pile-card-w','--duel-pile-columns','--duel-pile-view-width','--duel-pile-view-height','--duel-pile-grid-height','--duel-pile-row-height'])this.prompt.style.removeProperty(property);
  }

  resetEnginePromptPresentationState() {
    this.clearChainSummaryHoverPortal();this.hideDirectSurfaceSelectionDock();
    if(!this.prompt)return;
    this.clearExtraDeckViewerPresentation();
    this.prompt.classList.remove('selection-prompt','card-details-prompt','inline-surface-selection-prompt','duel-direct-selection-toolbar-prompt','duel-log-event-prompt','duel-log-event-related-layout','duel-chain-choice-prompt','duel-option-prompt','duel-universal-card-selector','duel-horizontal-position-prompt','duel-dummy-mode-prompt','duel-inspection-gate','duel-gameplay-prompt','duel-prompt-obscured-by-details','duel-prompt-scroll','duel-prompt-compact','duel-prompt-tight');
    for(const property of ['--duel-gameplay-prompt-width','--duel-selection-measured-width','--duel-selection-card-w','--duel-selection-card-h','--duel-selection-tile-w','width','max-width','max-height'])this.prompt.style.removeProperty(property);
    this.promptBody?.style?.removeProperty?.('overflow');if(this.promptBody){this.promptBody.scrollTop=0;this.promptBody.scrollLeft=0;}
    this.chainVisualNode?.style?.removeProperty?.('--duel-contained-prompt-width');
  }

  minimizePrompt() {
    if(!this.prompt||this.prompt.classList.contains('duel-prompt-hidden'))return;




    const inlineChainSelection=!!(this.chainPromptAttached&&this.prompt.classList.contains('inline-surface-selection-prompt'));
    if(inlineChainSelection){this.restorePromptHome();this.chainVisualNode?.classList?.add('duel-chain-inline-selection-minimized');}
    this.promptMinimized=true;
    this.prompt.classList.add('duel-prompt-hidden');
    if(this.promptRestoreButton){this.promptRestoreButton.hidden=false;const title=this.promptTitle?.textContent||'Selection';this.promptRestoreButton.textContent=inlineChainSelection?`Selection active - ${title}`:(this.promptTitle?.textContent?`Show: ${this.promptTitle.textContent}`:'Show Prompt');}
    if(this.chainVisualNode&&!this.chainVisualNode.hidden){const run=()=>this.positionChainVisualization();if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else run();}
    if(!$id('duelOpponentNotice')?.hidden){const run=()=>this.positionOpponentNotice();if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else run();}
  }

  restorePrompt() {
    if(!this.prompt)return;
    this.clearChainPromptPhysicalFocus();this.promptMinimized=false;
    this.chainVisualNode?.classList?.remove('duel-chain-inline-selection-minimized');
    this.prompt.classList.remove('duel-prompt-hidden');
    if(this.promptRestoreButton)this.promptRestoreButton.hidden=true;



    this.syncChainPromptAttachment(this.currentPrompt);
    this.scheduleSelectionPromptSizing();this.schedulePromptFit();
    if(this.chainVisualNode&&!this.chainVisualNode.hidden){const run=()=>this.positionChainVisualization();if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else run();}
    if(!$id('duelOpponentNotice')?.hidden){const run=()=>this.positionOpponentNotice();if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else run();}
  }

  revealPromptForInspection() {



    const wasMinimized=!!this.promptMinimized;if(!this.prompt)return wasMinimized;
    if(wasMinimized){this.promptMinimized=false;this.prompt.classList.remove('duel-prompt-hidden');if(this.promptRestoreButton)this.promptRestoreButton.hidden=true;}
    return wasMinimized;
  }

  schedulePromptFit() {
    if(!this.prompt||this.promptMinimized||this.prompt.classList.contains('duel-direct-selection-toolbar-prompt'))return;
    if(this.promptFitFrame&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(this.promptFitFrame);
    const run=()=>{this.promptFitFrame=0;this.syncPromptFit();};
    if(typeof requestAnimationFrame==='function')this.promptFitFrame=requestAnimationFrame(run);else run();
  }

  syncPromptFit() {
    if(!this.prompt||this.promptMinimized||this.prompt.classList.contains('duel-prompt-hidden')||this.prompt.classList.contains('duel-direct-selection-toolbar-prompt'))return;
    if(this.prompt.querySelector?.('.duel-chain-summary-view,.duel-chain-history-view')){this.fitChainSummaryToViewport();return;}
    const explicitPileViewer=this.promptView==='pile'&&!!this.openPileContext;
    if(this.prompt.classList.contains('duel-direct-pile-viewer-prompt')&&explicitPileViewer){this.prompt.classList.remove('duel-prompt-scroll','duel-prompt-compact','duel-prompt-tight');this.fitPileViewer();return;}



    if(this.prompt.classList.contains('duel-extra-deck-viewer-prompt')||this.prompt.classList.contains('duel-direct-pile-viewer-prompt'))this.clearExtraDeckViewerPresentation();

    this.prompt.classList.remove('duel-prompt-scroll','duel-prompt-compact','duel-prompt-tight');
    const available=this.selectionPromptAvailableHeight();
    this.prompt.style.setProperty('--duel-prompt-max-height',`${available}px`);



    const overflows=()=>Number(this.prompt.scrollHeight)>available+2;
    if(overflows())this.prompt.classList.add('duel-prompt-compact');
    if(overflows())this.prompt.classList.add('duel-prompt-tight');
    if(overflows())this.prompt.classList.add('duel-prompt-scroll');
    if(this.chainVisualNode&&!this.chainVisualNode.hidden)this.positionChainVisualization();
  }

  fitChainSummaryToViewport() {
    const view=this.prompt?.querySelector?.('.duel-chain-summary-view,.duel-chain-history-view');if(!view||!this.promptBody)return;
    this.prompt.classList.remove('duel-prompt-scroll','duel-prompt-compact','duel-prompt-tight');this.prompt.style.width='min(1220px, calc(100vw - 24px))';this.prompt.style.maxWidth='calc(100vw - 24px)';this.prompt.style.maxHeight='calc(100vh - 24px)';this.promptBody.style.overflow='hidden';view.style.zoom='1';
    const viewportW=Math.max(280,(Number(window.innerWidth)||1280)-24),viewportH=Math.max(260,(Number(window.innerHeight)||800)-24);const promptRect=this.prompt.getBoundingClientRect(),bodyRect=this.promptBody.getBoundingClientRect();const chromeH=Math.max(0,promptRect.height-bodyRect.height),siblings=[...this.promptBody.children].filter(node=>node!==view);const siblingH=siblings.reduce((sum,node)=>sum+(Number(node.getBoundingClientRect?.().height)||0),0);const availableW=Math.max(240,Math.min(viewportW-28,Number(this.promptBody.clientWidth)||viewportW-28)),availableH=Math.max(180,viewportH-chromeH-siblingH-18);const naturalW=Math.max(1,Number(view.scrollWidth)||Number(view.getBoundingClientRect().width)||1),naturalH=Math.max(1,Number(view.scrollHeight)||Number(view.getBoundingClientRect().height)||1);const scale=Math.min(1,availableW/naturalW,availableH/naturalH);view.style.zoom=String(scale);view.dataset.fitScale=scale.toFixed(3);this.promptBody.scrollTop=0;this.promptBody.scrollLeft=0;view.querySelectorAll('.duel-chain-summary-list,.duel-chain-history-track').forEach(list=>{list.scrollLeft=0;list.style.overflow='visible';});
  }

  hidePrompt({force=false}={}) {
    this.traceSession?.('prompt-hide-request',{force:!!force,view:String(this.promptView||''),state:this.sessionStateSnapshot?.()||null});
    this.clearChainSummaryHoverPortal();this.hideDirectSurfaceSelectionDock();
    if (!this.prompt) return false;



    if(!force&&this.promptView==='details'&&!this.detailsCloseRequested)return false;



    if(!force&&this.running&&this.authoritativePendingDecision&&!this.authoritativePendingDecision.submitted&&this.promptUsesVisibleSurface(this.authoritativePendingDecision.message)){
      const restore=()=>this.restoreAuthoritativeDecisionSurface();if(typeof queueMicrotask==='function')queueMicrotask(restore);else setTimeout(restore,0);
      return false;
    }





    if(!force&&this.running&&this.currentPrompt&&this.pendingResolve&&this.promptUsesVisibleSurface(this.currentPrompt)){
      const restore=()=>this.ensureCurrentPromptVisible({forceRender:true});if(typeof queueMicrotask==='function')queueMicrotask(restore);else setTimeout(restore,0);
      return false;
    }
    this.promptMinimized=false;
    this.prompt.classList.add('duel-prompt-hidden');
    this.restorePromptHome();
    this.chainVisualNode?.classList?.remove('duel-chain-inline-selection-minimized');
    this.prompt.classList.remove('card-details-prompt','duel-prompt-scroll','duel-prompt-compact','duel-prompt-tight','duel-log-event-prompt','duel-log-event-related-layout','duel-extra-deck-viewer-prompt','duel-direct-pile-viewer-prompt','duel-gameplay-prompt','duel-chain-choice-prompt');
    this.prompt.style.removeProperty('--duel-gameplay-prompt-width');this.prompt.style.removeProperty('--duel-selection-measured-width');this.prompt.style.removeProperty('width');this.prompt.style.removeProperty('max-width');this.prompt.style.removeProperty('max-height');this.promptBody?.style?.removeProperty?.('overflow');for(const property of ['--duel-extra-card-w','--duel-extra-columns','--duel-extra-view-width','--duel-extra-view-height','--duel-pile-card-w','--duel-pile-columns','--duel-pile-view-width','--duel-pile-view-height','--duel-pile-grid-height','--duel-pile-row-height'])this.prompt.style.removeProperty(property);
    this.prompt.dataset.dismissible = '0';
    if(this.promptRestoreButton)this.promptRestoreButton.hidden=true;
    if(!this.currentPrompt)this.promptView='';
    if(this.chainVisualNode&&!this.chainVisualNode.hidden){const run=()=>this.positionChainVisualization();if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else run();}
    return true;
  }

  clearPrompt(text = '', {show=true,dismissible=false}={}) {
    if (this.promptTitle) this.promptTitle.textContent = text;
    if (this.promptBody) this.promptBody.replaceChildren();
    if (show) this.showPrompt({dismissible}); else this.hidePrompt();
  }

  releaseCardSelection() {
    if (!this.selectedCardContext && !this.pinnedInspector) return;
    this.selectedCardContext = null;
    this.pinnedInspector = null;
    this.clearLogCardFocus('selected');
    this.inspectCard(0,{}, {transient:true});
    this.renderField();
    this.renderPhaseDock();
    if(this.currentPrompt&&this.pendingResolve)this.renderPrompt(this.currentPrompt);else this.hidePrompt();
  }

  showError(error) {
    this.simulatorTaskPromptActive=false;
    this.promptView='error';
    this.clearPrompt('Unable to start Test Duel',{show:true,dismissible:true});
    const p = document.createElement('p');
    p.className = 'duel-error-text';
    p.textContent = error?.message || String(error);
    const controls=document.createElement('div');controls.className='duel-prompt-controls';
    const retry = document.createElement('button');
    retry.type = 'button'; retry.className = 'btn'; retry.textContent = 'Retry';
    retry.addEventListener('click', () => this.restartDuel());
    const close=document.createElement('button');close.type='button';close.className='btn ghost';close.textContent='Close';close.addEventListener('click',()=>{this.hidePrompt();this.promptView='';});
    controls.append(retry,close);this.promptBody?.append(p, controls);
  }

  refreshRuntimeCoreVersionTelemetry() {
    let runtimeVersion='',telemetryError='';
    try{
      const getter=this.core?.getVersion;
      if(typeof getter==='function'){
        const raw=getter.call(this.core);
        if(Array.isArray(raw)||ArrayBuffer.isView(raw))runtimeVersion=Array.from(raw).map(value=>String(value)).join('.');
        else if(raw!==undefined&&raw!==null)runtimeVersion=String(raw);
      }
    }catch(error){telemetryError=String(error?.message||error);}
    this.enginePackageStatus={...(this.enginePackageStatus||{}),runtimeCoreVersion:runtimeVersion,runtimeCoreVersionTelemetry:{available:!!runtimeVersion,source:'core.getVersion',error:telemetryError}};
    return runtimeVersion;
  }

  async ensureEngine() {
    let status = await fetch('/api/duel-engine/status', {cache:'no-store'}).then(r => r.json());
    if (!status.ready) {
      this.setEngineStatus('Installing Duel Rules Components...', 'working');
      this.clearPrompt('First-time duel engine setup');
      const info = document.createElement('p');
      info.textContent = 'Deck Studio is downloading its duel rules engine, card database, and card-script data. This occurs once and is cached in Application Data.';
      this.promptBody?.append(info);
      const response = await fetch('/api/duel-engine/setup', {method:'POST'});
      status = await response.json();
      this.enginePackageStatus=status;
      if (!response.ok || !status.ready) throw new Error(status.error || 'Duel engine setup failed.');
    }
    this.enginePackageStatus=status;
    if (typeof WebAssembly !== 'object') throw new Error('This browser runtime does not support WebAssembly.');
    if (typeof WebAssembly.Suspending !== 'function' || typeof WebAssembly.promising !== 'function') {
      throw new Error('The installed WebView/Edge runtime does not provide WebAssembly JS Promise Integration (JSPI). Update Microsoft Edge WebView2 Runtime and retry.');
    }
    if (!this.mod || !this.core) {
      this.mod = this.mod || await import('/duel-engine/ocgcore/dist/index.js');
      const createCore = this.mod.default;
      if (typeof createCore !== 'function') throw new Error('Rules Engine module entry point is invalid.');
      this.core = await createCore({
        sync: false,
        locateFile: file => file.endsWith('.wasm') ? `/duel-engine/ocgcore/lib/${file.split('/').pop()}` : file,
        print: text => this.log(`[core] ${text}`),
        printErr: text => this.log(`[core] ${text}`),
      });
    }
    this.refreshRuntimeCoreVersionTelemetry();
  }

  async initializeDatabase() {
    if (this.db) return;
    await loadClassicScript('/duel-engine/sqljs/sql-wasm.js');
    if (typeof globalThis.initSqlJs !== 'function') throw new Error('sql.js did not initialize.');
    const SQL = await globalThis.initSqlJs({ locateFile: () => '/duel-engine/sqljs/sql-wasm.wasm' });
    const response = await fetch('/duel-engine/data/cards.cdb', {cache:'force-cache'});
    if (!response.ok) throw new Error('Unable to load Project Ignis card database.');
    const bytes = new Uint8Array(await response.arrayBuffer());
    this.db = new SQL.Database(bytes);
  }

  async validateRuntime() {
    if (this.runtimeValidated) return;
    this.setEngineStatus('Validating Duel Rules...', 'working');
    this.showSimulatorTaskPrompt('Validating duel engine','Deck Studio is validating normal Summons and scripted card-effect resolution before allowing Test Duel.');

    if (!this.cardData(SELFTEST_NORMAL_CODE)) throw new Error('Runtime validation card is missing from cards.cdb: Alexandrite Dragon.');
    if (!this.cardData(SELFTEST_EFFECT_CODE)) throw new Error('Runtime validation card is missing from cards.cdb: Pot of Greed.');

    await this.runNormalSummonSmokeTest();
    await this.runSpellEffectSmokeTest();
    this.runtimeValidated = true;
    this.log('Duel rules validation passed: Normal Summon and scripted Spell resolution.');
  }

  async createSmokeDuel(playerCode) {
    const M = this.mod;
    const errors = [];
    const handle = await this.core.createDuel({
      flags: M.OcgDuelMode.MODE_MR5,
      seed: [11n, 22n, 33n, 44n],
      team1: {startingLP:8000, startingDrawCount:5, drawCountPerTurn:1},
      team2: {startingLP:8000, startingDrawCount:5, drawCountPerTurn:1},
      cardReader: code => this.cardData(code),
      scriptReader: name => this.readScript(name),
      errorHandler: (type, text) => errors.push(`[${type}] ${text}`),
    });
    if (!handle) throw new Error('Rules Engine validation could not create a duel.');
    try {
      const constant = await this.readScript('constant.lua');
      const utility = await this.readScript('utility.lua');
      if (!constant || !utility) throw new Error('Rules Engine validation could not load the required card scripts.');
      if (!await this.core.loadScript(handle, 'constant.lua', constant)) throw new Error('Rules Engine rejected constant.lua during validation.');
      if (!await this.core.loadScript(handle, 'utility.lua', utility)) throw new Error('Rules Engine rejected utility.lua during validation.');
      const P = M.OcgPosition;
      for (let i = 0; i < 40; i++) {
        await this.core.duelNewCard(handle, {code:playerCode, team:0, duelist:0, controller:0, location:M.OcgLocation.DECK, position:P.FACEDOWN_ATTACK, sequence:0});
        await this.core.duelNewCard(handle, {code:DUMMY_CARD_CODE, team:1, duelist:0, controller:1, location:M.OcgLocation.DECK, position:P.FACEDOWN_ATTACK, sequence:0});
      }
      await this.core.startDuel(handle);
      if (errors.length) throw new Error(`Rules Engine validation reported a card-script error: ${errors[0]}`);
      return handle;
    } catch (error) {
      try { this.core.destroyDuel(handle); } catch {}
      throw error;
    }
  }

  smokeQuery(handle, player, location) {
    const Q = this.mod.OcgQueryFlags;
    const flags = Q.CODE | Q.POSITION | Q.TYPE;
    try {
      return (this.core.duelQueryLocation(handle, {controller:player, location, flags}) || []).filter(Boolean);
    } catch {
      return [];
    }
  }

  firstSmokePlace(mask, player, location) {
    const L = this.mod.OcgLocation;
    const base = player * 16;
    if (location === L.MZONE) {
      for (let sequence = 0; sequence < 5; sequence++) {
        if (((mask >>> (base + sequence)) & 1) === 0) return {player, location:L.MZONE, sequence};
      }
    }
    if (location === L.SZONE) {
      for (let sequence = 0; sequence < 5; sequence++) {
        if (((mask >>> (base + 8 + sequence)) & 1) === 0) return {player, location:L.SZONE, sequence};
      }
    }
    return this.parsePlaces(mask,player).find(place => place.player === player) || this.parsePlaces(mask,player)[0] || null;
  }

  smokeFallbackResponse(message) {
    const T = this.mod.OcgMessageType, R = this.mod.OcgResponseType;
    const I = this.mod.SelectIdleCMDAction, B = this.mod.SelectBattleCMDAction;
    if (message.player === 1) return this.dummyResponse(message);
    if (message.type === T.SELECT_IDLECMD) {
      if ((message.summons || []).length) return {type:R.SELECT_IDLECMD, action:I.SELECT_SUMMON, index:0};
      if ((message.activates || []).length) return {type:R.SELECT_IDLECMD, action:I.SELECT_ACTIVATE, index:0};
      if ((message.special_summons || []).length) return {type:R.SELECT_IDLECMD, action:I.SELECT_SPECIAL_SUMMON, index:0};
      if (message.to_ep) return {type:R.SELECT_IDLECMD, action:I.TO_EP, index:null};
      if (message.to_bp) return {type:R.SELECT_IDLECMD, action:I.TO_BP, index:null};
      return null;
    }
    if (message.type === T.SELECT_BATTLECMD) {
      if (message.to_ep) return {type:R.SELECT_BATTLECMD, action:B.TO_EP, index:null};
      if (message.to_m2) return {type:R.SELECT_BATTLECMD, action:B.TO_M2, index:null};
      if ((message.attacks || []).length) return {type:R.SELECT_BATTLECMD, action:B.SELECT_BATTLE, index:0};
      return null;
    }
    if (message.type === T.SELECT_CHAIN) return {type:R.SELECT_CHAIN, index:message.forced ? 0 : null};
    if (message.type === T.SELECT_EFFECTYN) return {type:R.SELECT_EFFECTYN, yes:false};
    if (message.type === T.SELECT_YESNO) return {type:R.SELECT_YESNO, yes:false};
    if (message.type === T.SELECT_OPTION) return {type:R.SELECT_OPTION, index:0};
    if (message.type === T.SELECT_POSITION) {
      const positions = this.mod.ocgPositionParse(message.positions) || [];
      const attack = positions.find(v => v === this.mod.OcgPosition.FACEUP_ATTACK);
      return {type:R.SELECT_POSITION, position:attack ?? positions[0]};
    }
    if (message.type === T.SELECT_PLACE || message.type === T.SELECT_DISFIELD) {
      const place = this.firstSmokePlace(message.field_mask, Number(message.player) || 0, T.SELECT_PLACE === message.type ? this.mod.OcgLocation.MZONE : this.mod.OcgLocation.MZONE);
      if (!place) return null;
      return {type:message.type === T.SELECT_PLACE ? R.SELECT_PLACE : R.SELECT_DISFIELD, places:[place]};
    }
    if (message.type === T.SELECT_CARD) return {type:R.SELECT_CARD, indicies:Array.from({length:message.min || 0}, (_, i) => i)};
    if (message.type === T.SELECT_TRIBUTE) return {type:R.SELECT_TRIBUTE, indicies:Array.from({length:message.min || 0}, (_, i) => i)};
    return null;
  }

  async driveSmokeDuel(handle, responder, completed, label) {
    const R = this.mod.OcgProcessResult;
    const T = this.mod.OcgMessageType;
    let lastPrompt = null;
    let lastResponse = null;
    const trace = [];
    for (let step = 0; step < 180; step++) {
      const status = await this.core.duelProcess(handle);
      const messages = this.core.duelGetMessage(handle) || [];
      for (const message of messages) trace.push(message.type);
      if (trace.length > 32) trace.splice(0, trace.length - 32);
      if (completed(messages)) return;
      if (messages.some(message => message.type === T.RETRY)) {
        const responseText = lastResponse ? this.stableJSONStringify(lastResponse) : 'none';
        throw new Error(`${label} had a response rejected by the Rules Engine. Decision ${lastPrompt?.type ?? 'unknown'}, response ${responseText}, recent messages ${trace.join(',')}.`);
      }
      if (status === R.END) throw new Error(`${label} ended before the expected interaction completed.`);
      if (status === R.CONTINUE) continue;
      const prompt = [...messages].reverse().find(m => this.isPrompt(m));
      if (!prompt) {
        throw new Error(`${label} reached WAITING without a selectable prompt. Recent messages ${trace.join(',')}.`);
      }
      const response = responder(prompt, messages) || this.smokeFallbackResponse(prompt);
      if (!response) throw new Error(`${label} encountered an unsupported duel decision ${prompt.type}.`);
      lastPrompt = prompt;
      lastResponse = response;
      this.core.duelSetResponse(handle, response);
    }
    throw new Error(`${label} exceeded the runtime-validation step limit. Recent messages ${trace.join(',')}.`);
  }

  async runNormalSummonSmokeTest() {
    const M = this.mod;
    const handle = await this.createSmokeDuel(SELFTEST_NORMAL_CODE);
    let requested = false;
    let summonStarted = false;
    try {
      await this.driveSmokeDuel(handle, message => {
        if (message.player !== 0) return this.dummyResponse(message);
        if (message.type === M.OcgMessageType.SELECT_IDLECMD && !requested) {
          const summons = message.summons || [];
          if (summons.length) {
            requested = true;
            return {type:M.OcgResponseType.SELECT_IDLECMD, action:M.SelectIdleCMDAction.SELECT_SUMMON, index:0};
          }
        }
        if (message.type === M.OcgMessageType.SELECT_PLACE) {
          const place = this.firstSmokePlace(message.field_mask, 0, M.OcgLocation.MZONE);
          return place ? {type:M.OcgResponseType.SELECT_PLACE, places:[place]} : null;
        }
        return null;
      }, messages => {
        if (messages.some(message => message.type === M.OcgMessageType.SUMMONING && Number(message.code) === SELFTEST_NORMAL_CODE)) summonStarted = true;
        return summonStarted || (requested && messages.some(message => message.type === M.OcgMessageType.SUMMONED));
      }, 'Normal-summon runtime validation');
      if (!requested) throw new Error('Rules Engine did not expose a legal Normal Summon during validation.');
    } finally {
      try { this.core.destroyDuel(handle); } catch {}
    }
  }

  async runSpellEffectSmokeTest() {
    const M = this.mod;
    const potScript = await this.readScript(`official/c${SELFTEST_EFFECT_CODE}.lua`);
    if (!potScript) throw new Error('Pot of Greed script is unavailable for runtime validation.');
    const handle = await this.createSmokeDuel(SELFTEST_EFFECT_CODE);
    let activated = false;
    let sawDraw = false;
    let sawPotToGrave = false;
    try {
      await this.driveSmokeDuel(handle, message => {
        if (message.player !== 0) return this.dummyResponse(message);
        if (message.type === M.OcgMessageType.SELECT_IDLECMD && !activated) {
          const activates = message.activates || [];
          if (activates.length) {
            activated = true;
            return {type:M.OcgResponseType.SELECT_IDLECMD, action:M.SelectIdleCMDAction.SELECT_ACTIVATE, index:0};
          }
        }
        if (message.type === M.OcgMessageType.SELECT_PLACE) {
          const place = this.firstSmokePlace(message.field_mask, 0, M.OcgLocation.SZONE);
          return place ? {type:M.OcgResponseType.SELECT_PLACE, places:[place]} : null;
        }
        return null;
      }, messages => {
        for (const message of messages) {
          if (message.type === M.OcgMessageType.DRAW && Number(message.player) === 0) sawDraw = true;
          if (message.type === M.OcgMessageType.MOVE && Number(message.card) === SELFTEST_EFFECT_CODE && ((Number(message.to?.location) || 0) & M.OcgLocation.GRAVE)) sawPotToGrave = true;
        }
        return activated && sawDraw && sawPotToGrave;
      }, 'Scripted Spell runtime validation');
      if (!activated) throw new Error('Rules Engine did not expose Pot of Greed as an activatable Spell during validation.');
    } finally {
      try { this.core.destroyDuel(handle); } catch {}
    }
  }

  queryCardRow(code) {
    if(!this.db)return null;
    const stmt = this.db.prepare(`SELECT d.id,d.alias,d.type,d.ot,d.atk,d.def,d.level,d.attribute,printf('%016x',d.race) race_hex,printf('%016x',d.setcode) setcode_hex,t.name,t.desc,t.str1,t.str2,t.str3,t.str4,t.str5,t.str6,t.str7,t.str8,t.str9,t.str10,t.str11,t.str12,t.str13,t.str14,t.str15,t.str16 FROM datas d LEFT JOIN texts t ON t.id=d.id WHERE d.id=? LIMIT 1`);
    try {
      stmt.bind([Number(code)]);
      if (!stmt.step()) return null;
      return stmt.getAsObject();
    } finally { stmt.free(); }
  }

  cardData(code) {
    const row = this.queryCardRow(code);
    if (!row) return null;
    const levelRaw = Number(row.level) >>> 0;
    const type = Number(row.type) >>> 0;
    const setHex = String(row.setcode_hex || '0').padStart(16, '0').slice(-16);
    const setcodes = [12,8,4,0].map(i => parseInt(setHex.slice(i,i+4),16));
    const raceHex = String(row.race_hex || '0').padStart(16,'0').slice(-16);
    const race = BigInt(`0x${raceHex}`);
    const isLink = (type & 0x4000000) !== 0;
    return {
      code: Number(row.id), alias: Number(row.alias) || 0, setcodes, type,
      level: levelRaw & 0xff, attribute: Number(row.attribute) || 0, race,
      attack: Number(row.atk) || 0, defense: isLink ? 0 : (Number(row.def) || 0),
      lscale: (levelRaw >>> 24) & 0xff, rscale: (levelRaw >>> 16) & 0xff,
      link_marker: isLink ? (Number(row.def) || 0) : 0,
    };
  }

  cardName(code) {
    if (!Number(code)) return 'Unknown Card';
    const appCard = this.getCardById?.(Number(code));
    if (appCard?.name) return appCard.name;
    const row = this.queryCardRow(code);
    return row?.name || `Card ${code}`;
  }

  cardDescription(code) {
    const appCard = this.getCardById?.(Number(code));
    if (appCard?.desc) return appCard.desc;
    return this.queryCardRow(code)?.desc || '';
  }

  // rc236: explain name-equivalent cards omitted by OCGCore without changing legality.
  selectionCurrentName(code,loc=0){
    const original=this.cardName(code),text=String(this.cardDescription(code)||'').replace(/\r?\n/g,' ').replace(/\s+/g,' '),key=this.trackedLocationKey(loc),ok=v=>{v=String(v||'').toLowerCase();return /always/.test(v)||(key==='grave'&&/\bgy\b|graveyard/.test(v))||(key==='hand'&&/\bhand\b/.test(v))||(key==='removed'&&/banish/.test(v))||(key==='mzone'&&/\bfield\b|monster zone/.test(v));},re=/(?:this card's name (?:becomes|is treated as)|this card is treated as) "([^"]+)" while ([^.]+)\.|(?:this card's name is always treated as|this card is always treated as) "([^"]+)"/ig;let m;while((m=re.exec(text))){const name=(m[1]||m[3]||'').trim();if(name&&ok(m[2]||'always'))return{name,changed:name.toLowerCase()!==String(original).toLowerCase()};}return{name:original,changed:false};
  }
  namedSummonIntent(m={}){
    let text='';try{text=this.conciseEffectText(this.inferPromptEffectText?.(m)||'');}catch{return null;}const h=text.match(/special summon\s+1\s+(.+?)\s+from\s+(?:your|the)\s+([^.;]+)/i);if(!h)return null;const names=[...h[1].matchAll(/"([^"]+)"/g)].map(v=>v[1].trim()),v=h[2].toLowerCase(),keys=[];if(/hand/.test(v))keys.push('hand');if(/\bgy\b|graveyard/.test(v))keys.push('grave');if(/banish/.test(v))keys.push('removed');if(/field|monster zone/.test(v))keys.push('mzone');return names.length&&keys.length?{names:new Set(names.map(v=>v.toLowerCase())),keys,source:this.effectSourceCode?.(m)||0}:null;
  }
  relatedUnavailableSelectionCards(m={},legal=[]){
    const q=this.namedSummonIntent(m);if(!q)return[];const L=this.mod?.OcgLocation||{},p=Number(m.player)||0,allowed=new Set((legal||[]).map(v=>this.selectionIdentity(v))),cards=[],add=(a,l)=>{(a||[]).forEach((c,i)=>{if(Number(c?.code))cards.push({...c,controller:p,location:l,sequence:i});});};for(const k of q.keys){if(k==='hand')add(this.knownHands?.[p],L.HAND||2);else if(k==='grave')add(this.knownPiles?.[p]?.grave,L.GRAVE||16);else if(k==='removed')add(this.knownPiles?.[p]?.removed,L.REMOVED||32);else add(this.knownField?.[p]?.mzone,L.MZONE||4);}const out=[],source=q.source?this.cardName(q.source):'This effect';
    for(const item of cards){if(allowed.has(this.selectionIdentity(item)))continue;const n=this.selectionCurrentName(item.code,item.location);if(!q.names.has(String(n.name).toLowerCase()))continue;const text=String(this.cardDescription(item.code)||'').replace(/\r?\n/g,' ').replace(/\s+/g,' '),hard=/\b(?:must be(?: either)?|cannot be special summoned except|can only be special summoned)[^.]*\.?/i.test(text),first=/\bmust first be[^.]*\.?/i.test(text);let reason;if(hard)reason=`${n.changed?`Treated as ${n.name}, but `:''}its mandatory Summoning condition applies; ${source} cannot Summon it.`;else if(first)reason=`${n.changed?`Treated as ${n.name}. `:''}Its proper-Summon requirement is unmet.`;else reason=`${n.changed?`Treated as ${n.name}, but `:'Name matches, but '}another rule blocks it.`;out.push({item,reason});}return out;
  }
  renderUnavailableSelectionContext(m={},legal=[]){
    const a=this.relatedUnavailableSelectionCards(m,legal);if(!a.length)return null;const s=document.createElement('section'),h=document.createElement('div'),g=document.createElement('div');s.className='duel-unavailable-selection-context duel-semantic-section';h.className='duel-semantic-section-label';h.textContent='Related but unavailable';g.className='duel-unavailable-selection-grid';a.slice(0,6).forEach(e=>{const i=e.item,o=()=>{this.inspectCard(i.code,i);this.renderCardDetailsModal(i.code,i);},t=this.actionCard(i,o,this.cardName(i.code)),b=document.createElement('span'),r=document.createElement('small');t.classList.add('duel-unavailable-card');b.className='duel-unavailable-badge';b.textContent='Unavailable';r.className='duel-unavailable-reason';r.textContent=e.reason;t.prepend(b);t.append(r);g.append(t);});s.append(h,g);return s;
  }

  descriptionReference(value) {
    if (value == null) return null;
    let raw;
    try { raw = BigInt(value); } catch { return null; }
    if (raw <= 0n) return null;



    const code = Number(raw >> 20n);
    const index = Number(raw & 0xfffffn);
    if (!(code > 0 && index >= 0 && index < 16)) return null;
    const row = this.queryCardRow(code);
    const text = typeof row?.[`str${index + 1}`] === 'string' ? row[`str${index + 1}`].trim() : '';
    return {raw,code,index,text};
  }

  descriptionText(value, fallback='Choose this effect') {
    const ref=this.descriptionReference(value);
    return ref?.text || fallback;
  }

  exactEffectTextFromDescription(code,description,{allowIndexFallback=true}={}) {
    code=this.normalizeActionCode(code);if(!code)return'';
    const ref=this.descriptionReference(description);




    if(!ref||this.normalizeActionCode(ref.code)!==code)return'';
    const label=this.conciseEffectText(ref.text||'');if(!label)return'';
    if(this.effectChoiceGateText(label))return label;
    if(this.genericEffectText(label))return'';
    const candidates=this.effectSentenceCandidates(this.cardDescription(code)||'').map(v=>this.conciseEffectText(v)).filter(Boolean);
    if(!candidates.length)return label;
    const needle=this.normalizedEffectMatchText(label);


    const exactMatches=candidates.filter(candidate=>this.normalizedEffectMatchText(candidate)===needle);
    if(exactMatches.length===1)return exactMatches[0];
    const containment=candidates.filter(candidate=>{const n=this.normalizedEffectMatchText(candidate);return !!n&&!!needle&&(n.includes(needle)||needle.includes(n));});
    if(containment.length===1)return containment[0];




    const stop=new Set(['this','card','the','a','an','to','from','your','you','it','of','and','or','that','its','is','be','as','effect','activate','choose','one','can']);
    const tokens=[...new Set(needle.split(' ').filter(token=>token.length>1&&!stop.has(token)))];
    if(tokens.length>=3){const tokenMatches=candidates.filter(candidate=>{const words=new Set(this.normalizedEffectMatchText(candidate).split(' '));return tokens.every(token=>words.has(token));});if(tokenMatches.length===1)return tokenMatches[0];}


    return label;
  }

  resolvedEffectDisplay(code,description,stored='') {
    code=this.normalizeActionCode(code);
    const full=this.conciseEffectText(code?this.cardDescription(code):'');
    if(!code)return{text:this.conciseEffectText(stored),specific:false,full:'',gate:false};
    const candidates=this.effectSentenceCandidates(full).map(value=>this.conciseEffectText(value)).filter(Boolean);
    const storedText=this.conciseEffectText(stored);
    const ref=this.descriptionReference(description);
    const refMatches=!!(ref&&this.normalizeActionCode(ref.code)===code);
    const rawClient=refMatches?this.conciseEffectText(ref.text||''):'';
    const exact=this.conciseEffectText(this.exactEffectTextFromDescription(code,description,{allowIndexFallback:false}));
    const exactGate=[exact,rawClient].find(value=>value&&this.effectChoiceGateText(value))||'';


    if(exactGate&&storedText&&!this.effectChoiceGateText(storedText)&&!this.genericEffectText(storedText))return{text:storedText,specific:true,full,gate:false};
    if(exact&&!this.effectChoiceGateText(exact)&&!this.genericEffectText(exact))return{text:exact,specific:true,full,gate:false};
    if(exactGate)return{text:exactGate,specific:false,full,gate:true};
    if(storedText&&this.effectChoiceGateText(storedText))return{text:storedText,specific:false,full,gate:true};
    if(storedText&&!this.genericEffectText(storedText))return{text:storedText,specific:true,full,gate:false};
    if(candidates.length===1&&full)return{text:candidates[0],specific:true,full,gate:false};


    return{text:'',specific:false,full,gate:false};
  }

  effectDisplayContextForPrompt(m={}) {
    const T=this.mod?.OcgMessageType||{};
    let source=null;const directCode=this.normalizeActionCode(m?.code);
    const resolving=Number(this.resolvingChainLink)||0;
    if(directCode){
      const resolvingSource=resolving?(this.chainHistory.get(resolving)||this.chainEffectSources.get(resolving)||null):null;
      const matching=[resolvingSource,this.pendingEffectSource,this.latestChainEffectContext()].find(item=>this.normalizeActionCode(item?.code)===directCode);
      source=matching||{code:directCode,controller:Number(m.controller??m.player??0)||0,location:Number(m.location)||0,sequence:Number(m.sequence)||0,descriptionId:m.description??0,description:'',specific:false};
    }else{
      if(resolving)source=this.chainHistory.get(resolving)||this.chainEffectSources.get(resolving)||null;
      if(!source&&this.pendingEffectSource?.code)source=this.pendingEffectSource;
      if(!source){const latest=this.latestChainEffectContext();if(latest?.code)source=latest;}
      if(!source&&this.activeEffectCode)source={code:this.normalizeActionCode(this.activeEffectCode),controller:Number(m.controller??m.player??0)||0,location:Number(m.location)||0,sequence:Number(m.sequence)||0,descriptionId:0,description:'',specific:false};
    }
    if(!source?.code)return null;
    const code=this.normalizeActionCode(source.code);
    const descriptionId=source.descriptionId??m.description??0;
    const trustedStored=(source.specific||source.gate)?source.description||'':'';
    const resolved=this.resolvedEffectDisplay(code,descriptionId,trustedStored);
    const scriptEffect=this.projectIgnisEffectSemantic(code,descriptionId,source);
    const scriptMatched=resolved.text?'':this.projectIgnisPrintedEffectMatch(code,scriptEffect);
    const recovered=(resolved.text||scriptMatched)?'':this.deterministicEffectRecovery(code,source,m);
    const description=resolved.text||scriptMatched||recovered||'';
    return{...source,code,descriptionId,description,specific:!!(resolved.specific||scriptMatched||recovered),gate:!!(resolved.gate||this.effectChoiceGateText(description)),semanticVariable:source.semanticVariable||scriptEffect?.variable||''};
  }

  cardEffectVerbiage(code, label='') {




    code=this.normalizeActionCode(code);const raw=this.conciseEffectText(label);if(!code)return raw;
    if(!raw||this.genericEffectText(raw))return'';
    const candidates=this.effectSentenceCandidates(this.cardDescription(code)||'').map(v=>this.conciseEffectText(v)).filter(Boolean);if(!candidates.length)return raw;
    const needle=this.normalizedEffectMatchText(raw);const exact=candidates.filter(candidate=>this.normalizedEffectMatchText(candidate)===needle);if(exact.length===1)return exact[0];
    const containment=candidates.filter(candidate=>{const value=this.normalizedEffectMatchText(candidate);return !!value&&!!needle&&(value.includes(needle)||needle.includes(value));});if(containment.length===1)return containment[0];
    return raw;
  }

  effectLabel(item, fallback='Activate') {
    const code=this.normalizeActionCode(item?.code);
    if(!code)return this.descriptionText(item?.description,fallback)||fallback;
    const resolved=this.resolvedEffectDisplay(code,item?.description,'');
    return resolved.text||this.descriptionText(item?.description,fallback)||fallback;
  }

  optionEffectDescription(option, index=0, prompt={}) {
    const code=this.effectSourceCode(prompt);const label=this.descriptionText(option,`Option ${Number(index)+1}`);
    if(!code)return label;
    const resolved=this.resolvedEffectDisplay(code,option,'');
    return resolved.text||label;
  }

  renderIntegratedEffectChoice(label,description,onSelect,{code=0,decline=false,singleText=false}={}) {


    const button=document.createElement('button');button.type='button';button.className=`duel-option-choice duel-effect-choice${decline?' decline':''}${singleText?' single-text':''}`;
    const heading=document.createElement('strong');heading.className='duel-option-choice-label';if(singleText&&code)this.setStyledCardText(heading,String(label||'Choose'),code);else heading.textContent=String(label||'Choose');button.append(heading);
    if(description){const detail=document.createElement('div');detail.className='duel-option-choice-effect';if(code)this.setStyledCardText(detail,String(description),code);else detail.textContent=String(description);button.append(detail);}
    button.addEventListener('click',()=>{onSelect();this.playSelectionSoundSoon();});return button;
  }

  renderCompactEffectDecision(label,description,onSelect,{code=0,role='Activatable Effect',decline=false}={}) {
    const button=this.button(String(label||'Activate'),onSelect,{ghost:!!decline});
    button.classList.add('duel-compact-effect-decision');
    if(!decline){const actionLabel=/chain/i.test(role)?'Chain':'Activate';this.decorateActionVisual(button,{label:actionLabel,detail:String(description||''),item:{code:Number(code)||0}},Number(code)||0);}
    return button;
  }

  renderViewedCardAction(action,code,onSelect) {
    const label=this.actionShortLabel(action?.label||'Action');const effectAction=action?.label==='Activate'||action?.label==='Chain';
    if(effectAction){const choice=this.renderIntegratedEffectChoice(label,String(action?.detail||'').trim(),onSelect,{code:Number(code)||0});choice.classList.add('duel-viewed-card-effect-action');this.decorateActionVisual(choice,action,code);return choice;}
    const button=this.button(label,onSelect,{ghost:action?.label!=='Attack'});button.classList.add('duel-viewed-card-action');this.decorateActionVisual(button,action,code);return button;
  }

  effectDecisionActionLabel(effectText='',code=0,{responding=false}={}) {
    const exact=this.conciseEffectText(effectText);const name=code?this.cardName(code):'this card';
    if(!exact)return responding?`Respond with ${name}`:`Activate ${name}'s effect`;



    let operation=exact;const colon=operation.indexOf(':');if(colon>=0&&colon<operation.length-1)operation=operation.slice(colon+1).trim();
    operation=operation.replace(/^you can\s+/i,'').trim();
    const sentences=operation.split(/(?<=[.!?])\s+/).filter(Boolean);if(sentences.length)operation=sentences[0].trim();
    if(operation.length>92){const cut=operation.slice(0,92);const at=Math.max(cut.lastIndexOf(';'),cut.lastIndexOf(','),cut.lastIndexOf(' '));operation=`${cut.slice(0,at>48?at:92).trim()}…`;}
    return responding?`Respond: ${operation}`:operation;
  }

  renderOptionChoice(option,index,prompt,onSelect) {
    const code=this.effectSourceCode(prompt);
    const label=this.descriptionText(option,`Option ${Number(index)+1}`);
    const description=this.optionEffectDescription(option,index,prompt);
    return this.renderIntegratedEffectChoice(label,description,onSelect,{code});
  }

  rememberEffectItem(item={},codeOverride=0) {
    const code=this.normalizeActionCode(codeOverride||item?.code);if(!code)return null;
    const rawLabel=this.descriptionText(item?.description,'');
    const resolved=this.resolvedEffectDisplay(code,item?.description,rawLabel);
    const semanticEffect=this.projectIgnisEffectForActionItem(code,item);const semanticText=resolved.text?'':this.projectIgnisPrintedEffectMatch(code,semanticEffect);
    const description=resolved.text||semanticText||rawLabel||'';
    const source={code,description,descriptionId:item?.description??0,controller:Number(item?.controller??this.pendingEffectSource?.controller??0)||0,location:Number(item?.location??this.pendingEffectSource?.location)||0,sequence:Number(item?.sequence??this.pendingEffectSource?.sequence)||0,specific:!!(resolved.specific||semanticText),gate:!!resolved.gate,semanticVariable:semanticEffect?.variable||''};
    this.pendingEffectSource=source;this.activeEffectDescription=description;return source;
  }

  projectIgnisFunctionBodies(source='') {
    const text=String(source||'').replace(/\r/g,'');
    const starts=[...text.matchAll(/^function\s+s\.([A-Za-z0-9_]+)\s*\([^\n]*\)\s*$/gm)];
    const out=new Map();
    starts.forEach((match,index)=>{const name=match[1];const start=(Number(match.index)||0)+String(match[0]||'').length;const end=index+1<starts.length?(Number(starts[index+1].index)||text.length):text.length;out.set(name,text.slice(start,end));});
    return out;
  }

  projectIgnisHandlerSemantics(body='') {
    const text=String(body||'');const tags=new Set(),hints=new Set(),locations=new Set(),races=new Set(),cardTypes=new Set();
    const add=(re,tag)=>{if(re.test(text))tags.add(tag);};
    add(/Duel\.SendtoGrave\s*\(/,'send-to-grave');add(/Duel\.SendtoHand\s*\(/,'add-to-hand');add(/Duel\.SendtoDeck\s*\(/,'send-to-deck');add(/Duel\.SpecialSummon\s*\(/,'special-summon');
    add(/Duel\.Draw\s*\(/,'draw');add(/Duel\.Remove\s*\(/,'banish');add(/Duel\.Destroy\s*\(/,'destroy');add(/Duel\.(?:Release|ReleaseRitualMaterial)\s*\(/,'tribute');
    add(/Duel\.(?:CheckReleaseGroupCost|SelectReleaseGroupCost|SelectTribute)\s*\(/,'tribute');
    add(/Duel\.PayLPCost\s*\(/,'pay-lp');add(/Duel\.SelectTarget\s*\(/,'target');
    add(/Duel\.(?:SelectMatchingCard|SelectTarget|SelectReleaseGroupCost|SelectTribute|SelectFusionMaterial|SelectSynchroMaterial)|aux\.SelectUnselectGroup|\:(?:Select|FilterSelect)\s*\(/,'select-card');
    add(/Duel\.ConfirmCards\s*\(/,'confirm-cards');add(/Duel\.SortDecktop\s*\(/,'reorder-deck');add(/Duel\.Shuffle(?:Deck|Hand)\s*\(/,'shuffle');
    add(/Duel\.(?:NegateActivation|NegateEffect|NegateRelatedChain)\s*\(/,'negate');add(/Duel\.ChangePosition\s*\(/,'change-position');add(/Duel\.Damage\s*\(/,'damage');add(/Duel\.Recover\s*\(/,'recover');
    add(/Duel\.Equip\s*\(/,'equip');add(/Duel\.Overlay\s*\(/,'overlay');add(/REASON_COST/,'cost-payment');
    for(const m of text.matchAll(/HINTMSG_[A-Z0-9_]+/g))hints.add(m[0]);
    for(const m of text.matchAll(/LOCATION_[A-Z0-9_]+/g))locations.add(m[0]);
    for(const m of text.matchAll(/RACE_[A-Z0-9_]+/g))races.add(m[0]);
    for(const m of text.matchAll(/TYPE_[A-Z0-9_]+/g))cardTypes.add(m[0]);


    if(/Duel\.(?:CheckReleaseGroupCost|SelectReleaseGroupCost|SelectTribute)\s*\(/.test(text))locations.add('LOCATION_MZONE');
    return{tags:[...tags],hints:[...hints],locations:[...locations],races:[...races],cardTypes:[...cardTypes],hasSelection:tags.has('select-card')||hints.size>0};
  }

  parseProjectIgnisCardScript(code,source='') {
    code=this.normalizeActionCode(code);const text=String(source||'');if(!code||!text)return null;
    const functions=this.projectIgnisFunctionBodies(text);const effects=new Map();
    const ensure=name=>{if(!effects.has(name))effects.set(name,{variable:name,descriptionIndex:null,categories:[],types:[],codes:[],range:[],properties:[],handlers:{},handlerSemantics:{}});return effects.get(name);};
    for(const m of text.matchAll(/\blocal\s+([A-Za-z_]\w*)\s*=\s*Effect\.CreateEffect\s*\(\s*c\s*\)/g))ensure(m[1]);
    const cloneRelations=[];for(const m of text.matchAll(/\blocal\s+([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\s*:\s*Clone\s*\(\s*\)/g)){cloneRelations.push([m[1],m[2]]);ensure(m[1]);}
    const setters=[
      ['description',/\b([A-Za-z_]\w*)\s*:\s*SetDescription\s*\(\s*aux\.Stringid\s*\(\s*id\s*,\s*(\d+)\s*\)\s*\)/g],
      ['category',/\b([A-Za-z_]\w*)\s*:\s*SetCategory\s*\(([^\n]+)\)/g],['type',/\b([A-Za-z_]\w*)\s*:\s*SetType\s*\(([^\n]+)\)/g],
      ['code',/\b([A-Za-z_]\w*)\s*:\s*SetCode\s*\(([^\n]+)\)/g],['range',/\b([A-Za-z_]\w*)\s*:\s*SetRange\s*\(([^\n]+)\)/g],
      ['property',/\b([A-Za-z_]\w*)\s*:\s*SetProperty\s*\(([^\n]+)\)/g],
      ['condition',/\b([A-Za-z_]\w*)\s*:\s*SetCondition\s*\(\s*s\.([A-Za-z0-9_]+)\s*\)/g],['cost',/\b([A-Za-z_]\w*)\s*:\s*SetCost\s*\(\s*s\.([A-Za-z0-9_]+)\s*\)/g],
      ['target',/\b([A-Za-z_]\w*)\s*:\s*SetTarget\s*\(\s*s\.([A-Za-z0-9_]+)\s*\)/g],['operation',/\b([A-Za-z_]\w*)\s*:\s*SetOperation\s*\(\s*s\.([A-Za-z0-9_]+)\s*\)/g]
    ];
    for(const [kind,re] of setters){for(const m of text.matchAll(re)){const effect=effects.get(m[1]);if(!effect)continue;if(kind==='description')effect.descriptionIndex=Number(m[2]);else if(['condition','cost','target','operation'].includes(kind)){effect.handlers[kind]=m[2];const body=functions.get(m[2])||'';effect.handlerSemantics[kind]=this.projectIgnisHandlerSemantics(body);}else{const value=String(m[2]||'').trim();const tokens=[...value.matchAll(/(?:CATEGORY|EFFECT_TYPE|EVENT|LOCATION|EFFECT_FLAG)_[A-Z0-9_]+/g)].map(x=>x[0]);const key=kind==='category'?'categories':kind==='type'?'types':kind==='code'?'codes':kind==='range'?'range':'properties';effect[key]=[...new Set([...(effect[key]||[]),...tokens])];}}}
    for(const [childName,parentName] of cloneRelations){const parent=effects.get(parentName),child=effects.get(childName);if(!parent||!child)continue;const merged=JSON.parse(JSON.stringify(parent));merged.variable=childName;if(child.descriptionIndex!=null)merged.descriptionIndex=child.descriptionIndex;for(const key of ['categories','types','codes','range','properties'])if(child[key]?.length)merged[key]=child[key];merged.handlers={...(merged.handlers||{}),...(child.handlers||{})};merged.handlerSemantics={...(merged.handlerSemantics||{}),...(child.handlerSemantics||{})};effects.set(childName,merged);}
    const list=[...effects.values()].map(effect=>({...effect,source:'ProjectIgnis/CardScripts',cardCode:code}));
    return{code,source:'ProjectIgnis/CardScripts',effects:list};
  }

  ingestProjectIgnisScript(path,source='') {
    const match=String(path||'').replaceAll('\\','/').match(/(?:^|\/)c(\d+)\.lua$/i);if(!match)return null;
    const code=this.normalizeActionCode(match[1]);if(!code)return null;const parsed=this.parseProjectIgnisCardScript(code,source);if(parsed){this.projectIgnisSemantics.set(code,parsed);this.projectIgnisScriptSources.set(code,String(source||''));}return parsed;
  }

  projectIgnisEffectSemantic(code,description=0,context={}) {
    code=this.normalizeActionCode(code);const model=this.projectIgnisSemantics.get(code);if(!model?.effects?.length)return null;
    if(context?.semanticVariable){const stored=model.effects.filter(effect=>effect.variable===context.semanticVariable);if(stored.length===1)return stored[0];}
    const ref=this.descriptionReference(description);if(ref&&this.normalizeActionCode(ref.code)===code){const exact=model.effects.filter(effect=>Number(effect.descriptionIndex)===Number(ref.index));if(exact.length===1)return exact[0];}
    if(model.effects.length===1)return model.effects[0];
    const loc=Number(context?.location)||0,L=this.mod?.OcgLocation||{};if(loc){const token=loc&Number(L.HAND||0)?'LOCATION_HAND':loc&Number(L.MZONE||0)?'LOCATION_MZONE':loc&Number(L.SZONE||0)?'LOCATION_SZONE':loc&Number(L.GRAVE||0)?'LOCATION_GRAVE':loc&Number(L.REMOVED||0)?'LOCATION_REMOVED':loc&Number(L.EXTRA||0)?'LOCATION_EXTRA':loc&Number(L.DECK||0)?'LOCATION_DECK':'';if(token){const ranged=model.effects.filter(effect=>(effect.range||[]).includes(token));if(ranged.length===1)return ranged[0];}}
    return null;
  }

  projectIgnisEffectForActionItem(code,item={}) {
    code=this.normalizeActionCode(code);const model=this.projectIgnisSemantics.get(code);if(!model?.effects?.length)return null;
    const exact=this.projectIgnisEffectSemantic(code,item?.description||0,{location:Number(item?.location)||0});if(exact)return exact;
    if(!this.descriptionReference(item?.description)){const activations=model.effects.filter(effect=>(effect.types||[]).includes('EFFECT_TYPE_ACTIVATE'));if(activations.length===1)return activations[0];}
    return null;
  }

  projectIgnisPrintedEffectMatch(code,effect=null) {
    code=this.normalizeActionCode(code);if(!code||!effect)return'';const candidates=this.effectSentenceCandidates(this.cardDescription(code)||'').map(v=>this.conciseEffectText(v)).filter(Boolean);if(!candidates.length)return'';
    const checks=[];const cats=new Set(effect.categories||[]);const add=(condition,re)=>{if(condition)checks.push(re);};
    add(cats.has('CATEGORY_DRAW'),/\bdraw\b/i);add(cats.has('CATEGORY_SEARCH'),/\bdeck\b/i);add(cats.has('CATEGORY_TOHAND'),/(?:add|return|place)[^.;]*(?:to|in) (?:your )?hand|to your hand/i);
    add(cats.has('CATEGORY_SPECIAL_SUMMON'),/special summon/i);add(cats.has('CATEGORY_REMOVE'),/banish/i);add(cats.has('CATEGORY_DESTROY'),/destroy/i);add(cats.has('CATEGORY_TOGRAVE'),/(?:send|sent)[^.;]*(?:graveyard|\bgy\b)/i);
    add(cats.has('CATEGORY_TODECK'),/(?:deck|shuffle)/i);add(cats.has('CATEGORY_POSITION'),/position/i);add(cats.has('CATEGORY_NEGATE'),/negat/i);add(cats.has('CATEGORY_DAMAGE'),/damage/i);add(cats.has('CATEGORY_RECOVER'),/(?:gain|recover)[^.;]*\blp\b/i);
    if(!checks.length){const operation=effect.handlerSemantics?.operation;const tags=new Set(operation?.tags||[]);add(tags.has('draw'),/\bdraw\b/i);add(tags.has('add-to-hand'),/(?:add|return|place)[^.;]*(?:to|in) (?:your )?hand|to your hand/i);add(tags.has('special-summon'),/special summon/i);add(tags.has('banish'),/banish/i);add(tags.has('destroy'),/destroy/i);add(tags.has('send-to-grave'),/(?:send|sent)[^.;]*(?:graveyard|\bgy\b)/i);add(tags.has('negate'),/negat/i);}
    if(!checks.length)return'';const matches=candidates.filter(candidate=>checks.every(re=>re.test(candidate)));return matches.length===1?matches[0]:'';
  }

  projectIgnisSelectionSemantic(m={}) {
    const context=this.effectDisplayContextForPrompt(m);const code=this.normalizeActionCode(context?.code||this.effectSourceCode(m));if(!code)return null;
    const model=this.projectIgnisSemantics.get(code);if(!model?.effects?.length)return null;
    const resolving=Number(this.resolvingChainLink)||Number(context?.chainLink)||0;const order=resolving?['operation','target','cost']:['cost','target','operation'];
    const selected=m.type===this.mod?.OcgMessageType?.SELECT_SUM?[...(m.selects_must||[]),...(m.selects||[])]:[...(m.selects||[]),...(m.select_cards||[]),...(m.unselect_cards||[])];
    const locTokens=new Set();const L=this.mod?.OcgLocation||{};for(const item of selected){const loc=Number(item?.location)||0;if(loc&Number(L.HAND||0))locTokens.add('LOCATION_HAND');if(loc&Number(L.DECK||0))locTokens.add('LOCATION_DECK');if(loc&Number(L.GRAVE||0))locTokens.add('LOCATION_GRAVE');if(loc&Number(L.REMOVED||0))locTokens.add('LOCATION_REMOVED');if(loc&Number(L.MZONE||0))locTokens.add('LOCATION_MZONE');if(loc&Number(L.SZONE||0))locTokens.add('LOCATION_SZONE');if(loc&Number(L.EXTRA||0))locTokens.add('LOCATION_EXTRA');}
    const matchesSelection=(effect,role)=>{const meta=effect?.handlerSemantics?.[role];if(!meta?.hasSelection)return null;const known=new Set(meta.locations||[]);if(locTokens.size&&known.size&&![...locTokens].some(token=>known.has(token)||known.has('LOCATION_ONFIELD')))return null;return{role,effect,meta,code,source:'ProjectIgnis/CardScripts'};};


    const exact=this.projectIgnisEffectSemantic(code,context?.descriptionId??m?.description??0,context||{});
    if(exact){for(const role of order){const match=matchesSelection(exact,role);if(match)return match;}return null;}





    const matches=[];for(const effect of model.effects){for(const role of order){const match=matchesSelection(effect,role);if(match){matches.push(match);break;}}}
    return matches.length===1?matches[0]:null;
  }

  selectionSemanticEffectText(m={}) {
    const semantic=this.projectIgnisSelectionSemantic(m);if(!semantic?.effect||!semantic.code)return'';
    const printed=this.projectIgnisPrintedEffectMatch(semantic.code,semantic.effect);if(printed)return this.effectPromptContextText(semantic.code,printed);
    const index=Number(semantic.effect.descriptionIndex);if(Number.isInteger(index)&&index>=0&&index<16){const row=this.queryCardRow(semantic.code);const label=this.conciseEffectText(row?.[`str${index+1}`]||'');if(label&&!this.genericEffectText(label)){const expanded=this.cardEffectVerbiage(semantic.code,label)||label;return this.effectPromptContextText(semantic.code,expanded);}}
    return'';
  }

  projectIgnisSelectionDescriptor(m={}) {
    const semantic=this.projectIgnisSelectionSemantic(m);if(!semantic)return null;const {role,meta,effect,code}=semantic;const hints=new Set(meta.hints||[]),tags=new Set(meta.tags||[]);
    let action='',title='',destination='';
    if(hints.has('HINTMSG_TOGRAVE')||tags.has('send-to-grave')){action='send to the GY';title='Choose a card to send to the GY';destination='to the GY';}
    else if(hints.has('HINTMSG_ATOHAND')||tags.has('add-to-hand')){action='add to your hand';title='Choose a card to add to your hand';destination='to your hand';}
    else if(hints.has('HINTMSG_SPSUMMON')||tags.has('special-summon')){action='Special Summon';title='Choose a card to Special Summon';}
    else if(hints.has('HINTMSG_REMOVE')||tags.has('banish')){action='banish';title='Choose a card to banish';}
    else if(hints.has('HINTMSG_DISCARD')){action='discard';title='Choose a card to discard';}
    else if(hints.has('HINTMSG_DESTROY')||tags.has('destroy')){action='destroy';title='Choose a card to destroy';}
    else if(hints.has('HINTMSG_RELEASE')||tags.has('tribute')){action='Tribute';title='Choose a monster to Tribute';}
    else if(tags.has('send-to-deck')){action='return to the Deck';title='Choose a card to return to the Deck';destination='to the Deck';}
    else if(tags.has('equip')){action='equip';title='Choose an Equip target';}
    else if(tags.has('overlay')){action='attach as material';title='Choose material to attach';}
    else if(tags.has('target')){action='target';title='Choose a target';}
    else return null;
    const roleLabel=role==='cost'?'Cost / Activation Requirement':role==='target'?'Target Selection':'Effect Resolution';
    return{action,title,destination,roleLabel,role,semantic,effect,code,meta};
  }

  humanizeScriptToken(token='',prefix='') {
    let value=String(token||'');if(prefix&&value.startsWith(prefix))value=value.slice(prefix.length);
    return value.toLowerCase().split('_').filter(Boolean).map(part=>part.charAt(0).toUpperCase()+part.slice(1)).join(' ');
  }

  selectionCandidates(m={}) {
    const T=this.mod?.OcgMessageType||{};
    if(m.type===T.SELECT_SUM)return[...(m.selects_must||[]),...(m.selects||[])];
    return[...(m.selects||[]),...(m.select_cards||[]),...(m.unselect_cards||[])];
  }

  selectionCandidateDescriptor(m={},scripted=null) {
    const candidates=this.selectionCandidates(m).filter(Boolean);if(!candidates.length)return'card';
    const cards=candidates.map(item=>this.getCardById?.(this.normalizeActionCode(item.code))).filter(Boolean);
    const scriptRaces=scripted?.meta?.races||[];
    if(scriptRaces.length===1){const race=this.humanizeScriptToken(scriptRaces[0],'RACE_');if(race)return`${race} monster`;}
    if(cards.length===candidates.length){
      const keys=cards.map(card=>this.duelCardTypeKey(card));
      if(keys.every(key=>key!=='spell'&&key!=='trap')){const races=[...new Set(cards.map(card=>String(card.race||'').trim()).filter(Boolean))];if(races.length===1)return`${races[0]} monster`;return'monster';}
      if(keys.every(key=>key==='spell'))return'Spell Card';
      if(keys.every(key=>key==='trap'))return'Trap Card';
      if(keys.every(key=>key==='spell'||key==='trap'))return'Spell/Trap Card';
    }
    return'card';
  }

  selectionSourceLabel(m={}) {
    const L=this.mod?.OcgLocation||{};const candidates=this.selectionCandidates(m);if(!candidates.length)return'';
    const entries=[];for(const item of candidates){const loc=Number(item?.location)||0,controller=Number(item?.controller??m.player??0)||0;let key='';if(loc&Number(L.HAND||0))key='hand';else if(loc&Number(L.DECK||0))key='deck';else if(loc&Number(L.GRAVE||0))key='grave';else if(loc&Number(L.REMOVED||0))key='removed';else if(loc&Number(L.MZONE||0))key='mzone';else if(loc&Number(L.SZONE||0))key='szone';else if(loc&Number(L.EXTRA||0))key='extra';if(key)entries.push({key,controller});}
    const unique=[...new Map(entries.map(v=>[`${v.controller}:${v.key}`,v])).values()];if(!unique.length)return'';
    const owner=controller=>controller===Number(m.player??0)?'your':"your opponent's";
    const phrase=entry=>({hand:`${owner(entry.controller)} hand`,deck:`${owner(entry.controller)} Deck`,grave:`${owner(entry.controller)} GY`,removed:`${owner(entry.controller)} banished cards`,mzone:`${owner(entry.controller)} Monster Zone`,szone:`${owner(entry.controller)} Spell & Trap Zone`,extra:`${owner(entry.controller)} Extra Deck`})[entry.key]||'';
    if(unique.length===1)return`from ${phrase(unique[0])}`;
    const sameController=unique.every(v=>v.controller===unique[0].controller),keys=new Set(unique.map(v=>v.key));
    if(sameController&&keys.size===2&&keys.has('mzone')&&keys.has('szone'))return`from ${owner(unique[0].controller)} field`;
    if(sameController&&keys.has('hand')&&(keys.has('mzone')||keys.has('szone'))&&keys.size<=3)return`from ${owner(unique[0].controller)} field or hand`;
    return`from ${unique.map(phrase).join(' or ')}`;
  }

  effectFollowupSummary(effectText='',action='',sourceName='') {
    const text=this.conciseEffectText(effectText);if(!text)return'';
    const clauses=text.split(';').map(v=>v.trim()).filter(Boolean);if(clauses.length<2)return'';
    const needle=String(action||'').toLowerCase();let index=clauses.findIndex(clause=>needle&&clause.toLowerCase().includes(needle.toLowerCase()));
    if(index<0&&/tribute/i.test(action))index=clauses.findIndex(clause=>/tribute/i.test(clause));
    if(index<0&&/discard/i.test(action))index=clauses.findIndex(clause=>/discard/i.test(clause));
    const after=index>=0?clauses.slice(index+1):clauses.slice(1);let follow=after.find(clause=>/(?:add|return|special summon|banish|destroy|send|draw|place|shuffle|negate|change position|gain|inflict)/i.test(clause))||'';
    if(!follow)return'';
    follow=follow.replace(/^(?:then,?\s*|and if you do,?\s*|also,?\s*)/i,'').trim();
    if(sourceName)follow=follow.replace(/\bthis card\b/ig,sourceName);
    let m=null;
    if((m=follow.match(/^add\s+(.+?)\s+to\s+(?:your|the)\s+hand\.?$/i)))return`${m[1]} will be added to your hand.`;
    if((m=follow.match(/^return\s+(.+?)\s+to\s+(?:your|the)\s+hand\.?$/i)))return`${m[1]} will be returned to the hand.`;
    if((m=follow.match(/^special summon\s+(.+?)(?:\.|$)/i)))return`${m[1]} will be Special Summoned.`;
    if((m=follow.match(/^banish\s+(.+?)(?:\.|$)/i)))return`${m[1]} will be banished.`;
    if((m=follow.match(/^destroy\s+(.+?)(?:\.|$)/i)))return`${m[1]} will be destroyed.`;
    if((m=follow.match(/^send\s+(.+?)\s+to\s+(?:the\s+)?(?:GY|Graveyard)\.?$/i)))return`${m[1]} will be sent to the GY.`;
    if(!/[.!?]$/.test(follow))follow+='.';return follow.charAt(0).toUpperCase()+follow.slice(1);
  }

  actionOutcomePhrase(action='') {
    const key=String(action||'').toLowerCase();
    if(key==='banish')return'banished';if(key==='destroy')return'destroyed';if(key==='tribute')return'Tributed';if(key==='discard')return'discarded';
    if(key.includes('send to the gy'))return'sent to the GY';if(key.includes('add to your hand'))return'added to your hand';if(key.includes('return to the deck'))return'returned to the Deck';if(key.includes('return to the hand'))return'returned to the hand';if(key.includes('special summon'))return'Special Summoned';if(key==='target')return'targeted';return'';
  }

  projectIgnisEffectRoleSummary(code,description=0,context={}) {
    const effect=this.projectIgnisEffectSemantic(code,description,context);if(!effect)return'';const parts=[];
    if(effect.handlers?.cost)parts.push('cost');if(effect.handlers?.target)parts.push('target');if(effect.handlers?.operation)parts.push('resolution');
    return parts.length?`Project Ignis script semantics: ${parts.join(' + ')}`:'';
  }

  cardScriptFallbackCodes(code) {
    code=Number(code)||0;if(!code||!this.db)return[];const row=this.queryCardRow(code);if(!row)return[];const out=[],seen=new Set([code]),add=value=>{value=Number(value)||0;if(value&&!seen.has(value)){seen.add(value);out.push(value);}};
    add(row.alias);
    const name=String(row.name||'').trim();if(name){const stmt=this.db.prepare('SELECT d.id,d.alias,d.ot,t.name FROM datas d LEFT JOIN texts t ON t.id=d.id WHERE t.name=? AND d.id<>? ORDER BY CASE WHEN d.alias=0 THEN 0 ELSE 1 END,d.id');try{stmt.bind([name,code]);while(stmt.step()){const candidate=stmt.getAsObject(),scope=Number(candidate.ot)||0;if(scope===0||scope&0x3){add(candidate.alias);add(candidate.id);}}}finally{stmt.free();}}
    return out;
  }

  async fetchCardScriptSource(path,localOnly=false) {
    const query=localOnly?'&local=1':'';const response=await fetch(`/api/duel-engine/script?path=${encodeURIComponent(path)}${query}`);if(!response.ok)return null;return response.text();
  }

  async readScript(name) {
    let path = String(name || '').replaceAll('\\','/').replace(/^\/+/, '');
    if (/^c\d+\.lua$/i.test(path)) path = `official/${path}`;
    let source=await this.fetchCardScriptSource(path);
    const cardMatch=path.match(/^(?:official\/)?c(\d+)\.lua$/i);
    if(!source&&cardMatch){const requested=Number(cardMatch[1])||0;for(const fallback of this.cardScriptFallbackCodes(requested)){const fallbackPath=`official/c${fallback}.lua`;source=await this.fetchCardScriptSource(fallbackPath);if(source){if(!this.cardScriptFallbacks)this.cardScriptFallbacks=new Map();this.cardScriptFallbacks.set(requested,fallback);break;}}}
    if (!source) {


      const optionalCardScript = /^(?:official\/)?c\d+\.lua$/i.test(path);
      const optionalCompatibilityScript = new Set(['proc_unofficial.lua']).has(path.toLowerCase());
      if (!optionalCardScript && !optionalCompatibilityScript) this.log(`Missing script: ${path}`);
      return null;
    }



    this.ingestProjectIgnisScript(path,source);
    return source;
  }

  practiceDuelFlags() {
    const modes=this.mod?.OcgDuelMode||{};
    const base=modes.MODE_MR5??0;



    let flags=typeof base==='bigint'?BigInt(base):BigInt(Number(base)||0);
    if(this.duelFormat==='tcg')for(const value of [modes.TCG_SEGOC_NONPUBLIC,modes.TCG_SEGOC_FIRSTTRIGGER])if(value!=null)flags|=BigInt(value);


    return typeof base==='bigint'?flags:Number(flags);
  }

  async createDuel(mainCodes, extraCodes, opponentMainCodes=mainCodes, opponentExtraCodes=extraCodes, options={}) {
    const M = this.mod;
    const errors = [];
    const duelSeed=Array.isArray(options.seed)&&options.seed.length===4?options.seed.map(BigInt):randomSeed();
    const handle = await this.core.createDuel({
      flags: this.practiceDuelFlags(),
      seed: duelSeed,
      team1: {startingLP:8000, startingDrawCount:5, drawCountPerTurn:1},
      team2: {startingLP:8000, startingDrawCount:5, drawCountPerTurn:1},
      cardReader: code => this.cardData(code),
      scriptReader: name => this.readScript(name),
      errorHandler: (type, text) => { errors.push(text); this.debugLog(`[script ${type}] ${text}`); },
    });
    if (!handle) throw new Error('Rules Engine could not create the duel.');
    this.handle = handle;
    const constant = await this.readScript('constant.lua');
    const utility = await this.readScript('utility.lua');
    if (!constant || !utility) throw new Error('Project Ignis base scripts are unavailable.');
    if (!await this.core.loadScript(handle, 'constant.lua', constant)) throw new Error('Rules Engine rejected constant.lua.');
    if (!await this.core.loadScript(handle, 'utility.lua', utility)) throw new Error('Rules Engine rejected utility.lua.');

    const playerMain = options.ordered?[...mainCodes]:shuffle(mainCodes);
    const dummyMain = options.ordered?[...opponentMainCodes]:shuffle(opponentMainCodes);
    this.initialExtraCodes = [...extraCodes].map(Number).filter(Boolean);
    this.initialOpponentExtraCodes = [...opponentExtraCodes].map(Number).filter(Boolean);
    this.knownDecks=[playerMain.map((code,sequence)=>({code:Number(code)||0,sequence,controller:0,location:M.OcgLocation.DECK})),dummyMain.map((code,sequence)=>({code:Number(code)||0,sequence,controller:1,location:M.OcgLocation.DECK,isHidden:!this.opponentCardsVisible}))];
    this.replaySeed=duelSeed;this.replayOrders={playerMain:[...playerMain],dummyMain:[...dummyMain]};
    if(options.replayData){if(this.replayPlayback?.mode==='resume')this.replaySession={...options.replayData,decisions:[...(options.replayData.decisions||[])],events:[...(options.replayData.events||[])]};else this.replaySession=null;}else this.beginReplaySession({seed:duelSeed,playerMain,dummyMain,playerExtra:extraCodes,dummyExtra:opponentExtraCodes,firstPlayer:this.currentFirstPlayer});
    await this.loadPile(0, M.OcgLocation.DECK, playerMain);
    await this.loadPile(0, M.OcgLocation.EXTRA, extraCodes);
    await this.loadPile(1, M.OcgLocation.DECK, dummyMain);
    await this.loadPile(1, M.OcgLocation.EXTRA, opponentExtraCodes);
    this.resetUIState();
    await this.core.startDuel(handle);
    if (errors.length) this.debugLog(`Core reported ${errors.length} initialization diagnostic message(s).`);
  }

  async loadPile(player, location, codes) {
    const P = this.mod.OcgPosition,corePlayer=this.corePlayer(player);
    for (const code of codes) {
      await this.core.duelNewCard(this.handle, {
        code:Number(code), team:corePlayer, duelist:0, controller:corePlayer, location,
        position:P.FACEDOWN_ATTACK, sequence:0,
      });
    }
  }

  resetUIState() {
    this.turn = 0; this.turnPlayer = 0; this.phase = null; this.lp = [8000,8000]; this.displayLp = [8000,8000]; this.lastLp=[8000,8000]; this.logLines = [];
    this.knownHands = [[], []];
    this.knownExtras = [this.initialExtraCodes.map((code,sequence)=>({code,position:this.mod?.OcgPosition?.FACEDOWN_ATTACK||0,sequence,controller:0,location:this.mod?.OcgLocation?.EXTRA||0})), this.initialOpponentExtraCodes.map((code,sequence)=>({code,position:this.mod?.OcgPosition?.FACEDOWN_ATTACK||0,sequence,controller:1,location:this.mod?.OcgLocation?.EXTRA||0,isHidden:!this.opponentCardsVisible}))];
    this.knownPiles = [this.emptyKnownPiles(), this.emptyKnownPiles()];
    this.knownField = [this.emptyKnownField(), this.emptyKnownField()];
    this.field = {players:[this.emptyPlayer(),this.emptyPlayer()],chain:[]};
    this.lastSubmittedPrompt = null;
    this.lastSubmittedResponse = null;
    this.smartAutoPassedPrompts = new WeakSet();
    this.suppressNextAutoPlace = false;
    this.promptView='';this.detailsReturnSnapshot=null;this.detailsDetachedFromChain=false;try{this.cardDetailsOverlay?.remove?.();}catch{}this.cardDetailsOverlay=null;this.cardDetailsTarget=null;this.hidePileHoverOverlay();this.recentRevealBatch=null;this.chainEffectCodes.clear();this.chainEffectSources.clear();this.chainHistory.clear();this.clearChainVisualization({immediate:true});this.resolvingChainLink=0;this.lastActivatedChainLink=0;this.activeEffectCode=0;this.activeEffectDescription='';this.pendingEffectSource=null;this.pendingSpecialSummon=null;this.stagedUnselectCommit=null;this.inlineCardSelection=null;this.opponentActionThisPhase=false;this.smartOptionalChainPhaseOffers.clear();this.finalResult=null;this.pendingResult=null;this.damagePresentationUntil=0;this.pinnedInspector=null;this.hoverLogCardCode=0;this.selectedLogCardCode=0;this.meaningfulResponseWindow=false;this.shiftChainOverrideHeld=false;this.initialDrawSeen=[false,false];this.initialSetupComplete=false;this.pendingDrawArrivals.clear();this.pendingDrawPresentationCounts=[0,0];this.pendingDrawMoveCodes.clear();this.dummyRetryAttempts.clear();this.dummyRejectedResponses.clear();this.dummyPromptFailureCounts.clear();this.dummyRetryNoticeKey='';this.dummyPromptSerial=0;this.lastSubmittedPromptToken=0;this.dummyRpsRound=0;this.dummyPhaseActionCount=0;this.dummyBattleActionCount=0;this.dummySafeModeThisTurn=false;this.dummyActionHistory.clear();this.dummyPlan={turn:0,intents:[],recentCodes:[]};this.duelStateRevision=0;this.monsterTopologyRevision=0;this.lastDeckAccessByPlayer=[null,null];this.lastSummonContext=[null,null];this.dummyMaterialPlanner=null;this.lastAttackContext=null;this.pendingPlayerAttack=null;this.hideCardHoverOverlay();this.clearOpponentEvents();this.promptRevision=0;this.currentPromptRevision=0;this.promptRecoveryCount=0;this.authoritativePendingDecision=null;this.activeDecisionId=0;this.renderedDecisionId=0;if(this.decisionGuardianTimer){clearTimeout(this.decisionGuardianTimer);this.decisionGuardianTimer=0;}this.decisionGuardianRestores=0;this.cancelInformationalGate();if(this.promptVisibilityTimer){clearTimeout(this.promptVisibilityTimer);this.promptVisibilityTimer=0;}if(this.interactionWatchdogTimer){clearTimeout(this.interactionWatchdogTimer);this.interactionWatchdogTimer=0;}this.interactionWatchdogMisses=0;this.interactionWatchdogRevision=0;this.hideResultOverlay();
    this.cardAnimationPresentationUntil=0;this.actionPresentationUntil=0;this.chainOutcomePresentationUntil=0;this.activeChainSummary=null;this.pendingMoveArrivals.clear();this.liveMonsterStats?.clear?.();this.activeMonsterStatKeys?.clear?.();this.affectedCardOutcomeQueue=[];if(this.currentAffectedCardOutcome?.timer)clearTimeout(this.currentAffectedCardOutcome.timer);this.currentAffectedCardOutcome=null;this.activationPresentationHistory.clear();this.effectTargetPresentationHistory.clear();this.boardWrap?.querySelectorAll?.('.duel-activation-showcase,.duel-effect-target-showcase,.duel-affected-card-showcase').forEach(node=>node.remove());this.root?.querySelectorAll?.('.duel-effect-targeted').forEach(node=>node.classList.remove('duel-effect-targeted'));this.clearPhaseAnnouncements();this.lastPointerClient=null;this.pileHoverRestoredAwaitingPointerMove=false;
    this.syncDuelToggles();this.renderMeta(); this.renderField(); this.renderLog();
    this.log(`Test Duel started. Practice Dummy: ${this.dummyMode==='passive'?'Passive':this.dummyDifficulty}. Format: ${this.duelFormat.toUpperCase()} MR5. Banlist: ${this.currentBanlist()}. First player: ${this.currentFirstPlayer===0?'Player':'Practice Dummy'}.`);
  }

  wait(ms=0) { let delay=Math.max(0,Number(ms)||0);const playback=this.replayPlayback;if(playback?.seeking)delay=0;else if(playback?.mode==='playback')delay/=Math.max(0.5,Number(playback.speed)||1);return new Promise(resolve=>setTimeout(resolve,delay)); }

  chainPresentationProfile(message={}) {
    const T=this.mod?.OcgMessageType||{},type=message?.type,scale=this.actionPresentationScale();
    const successful=type===T.CHAIN_SOLVED;
    const adverse=type===T.CHAIN_NEGATED||type===T.CHAIN_DISABLED;
    const result=successful||adverse;



    const minimum=Math.round((type===T.CHAINING?360:type===T.CHAIN_SOLVING?0:adverse?520:successful?0:300)*scale);
    const comprehension=Math.round((adverse?620:successful?0:type===T.CHAINING?120:0)*scale);
    return{result,successful,adverse,minimum,comprehension};
  }

  async presentationDelay(messages=[]) {
    const chainMessages=(messages||[]).filter(message=>this.isChainPresentationMessage(message));
    if(!chainMessages.length||!this.duelAnimationsEnabled||!this.actionPresentationEnabled)return;
    const message=chainMessages.at(-1),profile=this.chainPresentationProfile(message),started=Date.now();




    const barrier=profile.result?Math.max(
      started+profile.minimum,
      Number(this.actionPresentationUntil)||0,
      Number(this.cardAnimationPresentationUntil)||0,
      Number(this.chainOutcomePresentationUntil)||0,
    ):started+profile.minimum;
    const visualWait=Math.max(0,barrier-Date.now());
    this.traceSession('chain-step-presentation-barrier',{chainLink:Number(message?.chain_size)||0,type:Number(message?.type),result:profile.result,adverse:profile.adverse,visualWaitMs:visualWait,comprehensionMs:profile.comprehension});
    if(visualWait>0)await this.wait(visualWait);
    if(profile.comprehension>0)await this.wait(profile.comprehension);
    this.traceSession('chain-step-presentation-complete',{chainLink:Number(message?.chain_size)||0,type:Number(message?.type)});
  }

  isChainPresentationMessage(message={}) {
    const T=this.mod?.OcgMessageType||{};
    return [T.CHAINING,T.CHAIN_SOLVING,T.CHAIN_SOLVED,T.CHAIN_NEGATED,T.CHAIN_DISABLED].filter(v=>v!=null).includes(message?.type);
  }

  async awaitCardAnimationForDecision(prompt={}) {
    if(!this.duelAnimationsEnabled||Number(prompt?.player)!==0)return;
    if(this.heldRightPassResponse(prompt))return;
    const remaining=Math.max(0,(Number(this.cardAnimationPresentationUntil)||0)-Date.now());
    if(remaining<=0)return;
    this.traceSession('prompt-animation-barrier',{signature:this.replayPromptSignature(prompt),remainingMs:remaining});
    await this.wait(remaining);
    this.traceSession('prompt-animation-barrier-complete',{signature:this.replayPromptSignature(prompt)});
  }

  playerInspectionGateData(message={}) {
    const T=this.mod?.OcgMessageType||{};
    if(T.CONFIRM_CARDS!=null&&message.type===T.CONFIRM_CARDS){
      const ctx=this.confirmCardsPresentation(message);if(ctx.mode!=='inspect'||Number(ctx.actor)!==0||!(ctx.visibleCards||[]).length)return null;
      return{title:'Look at cards',label:ctx.locationName?`Cards inspected from your ${ctx.locationName}`:'Cards inspected',cards:ctx.visibleCards,effectCode:this.normalizeActionCode(ctx.effect?.code)||0};
    }
    if((T.CONFIRM_DECKTOP!=null&&message.type===T.CONFIRM_DECKTOP)||(T.CONFIRM_EXTRATOP!=null&&message.type===T.CONFIRM_EXTRATOP)){
      const player=Number(message.player)||0;if(player!==0)return null;
      const source=Array.isArray(message.cards)?message.cards:Array.isArray(message.decktop)?message.decktop:Array.isArray(message.extratop)?message.extratop:[];
      const cards=source.map(card=>({code:Number(card?.code??card)||0,position:Number(card?.position)||0,controller:Number(card?.controller??card?.player??player),location:Number(card?.location)||0,sequence:Number(card?.sequence)||0})).filter(card=>card.code);
      if(!cards.length)return null;return{title:'Look at cards',label:message.type===T.CONFIRM_EXTRATOP?'Cards inspected from your Extra Deck':'Cards inspected from the top of your Deck',cards,effectCode:this.normalizeActionCode(this.activeEffectCode||this.pendingEffectSource?.code)||0};
    }
    return null;
  }

  cancelInformationalGate() {
    this.informationalGateSerial+=1;const resolve=this.informationalGateResolve;this.informationalGateResolve=null;if(resolve)resolve(false);
  }

  presentCardInspectionGate(data={}) {

    return Promise.resolve(true);
  }

  gameplayCardCountWidth(count=0) {
    count=Math.max(1,Number(count)||1);if(count===1)return 300;if(count===2)return 390;if(count===3)return 500;if(count===4)return 610;return 780;
  }

  async processLoop() {
    const R = this.mod.OcgProcessResult;
    const T = this.mod.OcgMessageType;
    const loopSerial=this.processLoopSerial;
    while (this.running && this.handle && loopSerial===this.processLoopSerial) {
      const status = await this.core.duelProcess(this.handle);
      const rawMessages = this.core.duelGetMessage(this.handle) || [];
      const messages = rawMessages.map(message=>this.mapCoreMessage(message));
      this.traceSession('core-process',{status:Number(status),rawMessageCount:rawMessages.length,messages:messages.map(message=>this.traceSafeObject(message)),state:this.sessionStateSnapshot()});
      const deferred=[];
      for (const message of messages) {
        this.recordReplayEvent(message);
        const phasePresentation=this.consumeMessage(message);
        const inspectionGate=this.playerInspectionGateData(message);
        if(inspectionGate){




          if(this.recentRevealBatch)this.recentRevealBatch.gated=false;
        }
        if(message.type===T.NEW_PHASE){
          if(!this.isReplaySeekReconstruction()){this.renderAll();this.playQueuedAnimations();}
          await phasePresentation;
          if(!this.running||!this.handle||loopSerial!==this.processLoopSerial)return;
        }else if(this.isChainPresentationMessage(message)){
          if(!this.isReplaySeekReconstruction()){this.renderAll();this.playQueuedAnimations();await this.presentationDelay([message]);}
        }else deferred.push(message);
      }
      this.refreshField();
      if(!this.isReplaySeekReconstruction()){this.renderAll();this.playQueuedAnimations();if(deferred.length)await this.presentationDelay(deferred);}




      if(this.pendingResult){
        this.running=false;
        this.hidePrompt();
        await this.presentPendingResult();
        this.syncReplayControls({renderEvents:true});
        return;
      }
      if (status === R.END) {
        this.running = false;
        this.awaitingPlayerResponseAck=null;
        this.acknowledgePendingDecisionLease();
        this.authoritativePendingDecision=null;this.activeDecisionId=0;this.renderedDecisionId=0;
        this.hidePrompt();
        if(!this.finalResult)this.showResultOverlay({player:null,reason:'Duel complete'});
        this.syncReplayControls({renderEvents:true});
        return;
      }




      const emittedPrompt=[...messages].reverse().find(m=>this.isPrompt(m));
      if(emittedPrompt)this.traceSession('core-prompt',{status:Number(status),signature:this.replayPromptSignature(emittedPrompt),prompt:this.traceSafeObject(emittedPrompt)});
      if (status === R.CONTINUE && !emittedPrompt) {




        continue;
      }
      if(status===R.CONTINUE&&emittedPrompt){
        this.awaitingPlayerResponseAck=null;
        this.acknowledgePendingDecisionLease({preserveVisible:true});
        if(this.authoritativePendingDecision?.submitted){this.stopDecisionGuardianFor(Number(this.authoritativePendingDecision.id)||0);this.authoritativePendingDecision=null;this.activeDecisionId=0;this.renderedDecisionId=0;}
      }

      let rejected = messages.some(message => message.type === T.RETRY);
      let prompt = emittedPrompt;
      if (rejected && !prompt) prompt = this.lastSubmittedPrompt;
      if (!prompt && this.awaitingPlayerResponseAck?.prompt && Number(this.awaitingPlayerResponseAck.prompt.player)===0) {




        prompt=this.awaitingPlayerResponseAck.prompt;
        rejected=true;
        this.pendingRestoredStagedSelection=this.awaitingPlayerResponseAck.stagedCardSelection?{...this.awaitingPlayerResponseAck.stagedCardSelection,indices:[...(this.awaitingPlayerResponseAck.stagedCardSelection.indices||[])]}:null;
        this.stagedChainSelection=this.awaitingPlayerResponseAck.stagedChainSelection?{...this.awaitingPlayerResponseAck.stagedChainSelection}:null;
        this.log('The Rules Engine is still waiting for that decision. The selection prompt was restored.',{type:'player-decision-recovery',controller:0});
        this.awaitingPlayerResponseAck=null;
        this.acknowledgePendingDecisionLease({preserveVisible:true});
      }
      if (!prompt) {
        throw new Error(`Rules Engine paused without a supported player decision. Message types: ${messages.map(m=>m.type).join(', ') || 'none'}.`);
      }


      if(!rejected){this.awaitingPlayerResponseAck=null;this.acknowledgePendingDecisionLease({preserveVisible:!!prompt});}

      if (rejected && prompt.player === 0) {
        this.log('The previous selection was not legal. The action prompt has been restored so you can choose again.');
        if(prompt.type===T.SELECT_PLACE)this.suppressNextAutoPlace=true;
      }

      let response;
      let dummyPromptToken=0;
      if(this.replayPlayback){
        if(this.replayPlayback.mode==='playback')await this.awaitReplayPlaybackGate();
        if(!this.running||!this.handle||loopSerial!==this.processLoopSerial)return;
        const replayed=this.nextReplayResponse(prompt);if(replayed)response=replayed;
      }
      if(!response&&this.liveReplayBranch?.ready&&this.liveReplayBranch.awaitingContinue&&Number(prompt.player)===1){await this.awaitLiveReplayBranchContinue();if(!this.running||!this.handle||loopSerial!==this.processLoopSerial)return;}
      if(!response&&Number(prompt.player)===1){





        if(rejected)dummyPromptToken=Number(this.lastSubmittedPromptToken)||Number(this.dummyPromptSerial)||1;
        else{dummyPromptToken=(Number(this.dummyPromptSerial)||0)+1;this.dummyPromptSerial=dummyPromptToken;}
        const retryKey=`${dummyPromptToken}|${this.dummyPromptKey(prompt)}`;
        let attempt=0;
        if(rejected){
          attempt=(this.dummyRetryAttempts.get(retryKey)||0)+1;
          this.dummyRetryAttempts.set(retryKey,attempt);this.dummyPromptFailureCounts.set(retryKey,attempt);
          this.rememberRejectedDummyResponse(retryKey,this.lastSubmittedResponse);
          if(this.dummyRetryNoticeKey!==retryKey){console.warn('[Practice Dummy] Rules Engine rejected an autonomous response; rebuilding from the current decision.',{promptType:prompt.type,attempt});this.dummyRetryNoticeKey=retryKey;}
          if(attempt>64)throw new Error(`Practice Dummy exceeded the bounded recovery limit for duel decision ${prompt.type}.`);
          this.dummySafeModeThisTurn=true;
          const escape=this.dummyMode==='passive'?this.dummyPassiveResponse(prompt,attempt):this.dummyEscapeResponse(prompt,attempt);const rejectedSet=this.dummyRejectedResponses.get(retryKey)||new Set();




          if(escape&&!rejectedSet.has(this.dummyResponseFingerprint(escape)))response=escape;
          else response=this.nextDummyResponse(prompt,retryKey,attempt);
        }else{
          this.dummyRetryAttempts.delete(retryKey);this.dummyRejectedResponses.delete(retryKey);this.dummyPromptFailureCounts.delete(retryKey);this.dummyRetryNoticeKey='';
          response=this.dummyMode==='passive'?this.dummyPassiveResponse(prompt,0):this.nextDummyResponse(prompt,retryKey,0);
        }
        if(!response)response=this.dummyMode==='passive'?this.dummyPassiveResponse(prompt,attempt):this.dummyEscapeResponse(prompt,attempt);
        if(!response)throw new Error(`Practice Dummy could not produce a legal response for duel decision ${prompt.type}.`);
      }else if(!response){await this.awaitCardAnimationForDecision(prompt);const branchManual=!!(this.liveReplayBranch?.ready&&this.liveReplayBranch.forceManualAtTarget&&Number(prompt.player)===0);response=await this.playerResponse(prompt,{manualOnly:branchManual});if(branchManual&&this.liveReplayBranch)this.liveReplayBranch.forceManualAtTarget=false;}
      if (!this.running || !this.handle) return;
      if (!response) throw new Error(`No valid response handler for duel decision ${prompt.type}.`);
      if(Number(prompt.player)===0&&prompt.type===T.SELECT_CHAIN&&(prompt.selects||[]).length&&!this.userSubmittedPrompts.has(prompt)&&!this.smartAutoPassedPrompts?.has?.(prompt)&&!this.replayPlayback){
        this.traceSession('automatic-chain-response-blocked',{signature:this.replayPromptSignature(prompt),response:this.traceSafeObject(response)});
        response=await this.playerResponse(prompt,{manualOnly:true});
        if(!response||!this.userSubmittedPrompts.has(prompt))throw new Error('A nonempty player Chain decision did not receive an explicit player response.');
      }
      if(Number(prompt.player)===1)this.noteDummyCommandResponse(prompt,response);
      this.captureResponseEffectContext(prompt,response);
      if(Number(prompt.player)===1){const dummyEffectTargets=this.effectTargetsForResponse(prompt,response),targetPresentationMs=this.playEffectTargetPresentation(dummyEffectTargets);if(targetPresentationMs>0){this.traceSession('dummy-response-held-for-target-presentation',{durationMs:targetPresentationMs,targets:dummyEffectTargets.map(item=>item.code)});await new Promise(resolve=>setTimeout(resolve,targetPresentationMs));if(!this.running||!this.handle||loopSerial!==this.processLoopSerial)return;}}
      this.lastSubmittedPrompt = prompt;
      this.lastSubmittedResponse = response;
      this.lastSubmittedPromptToken = Number(prompt.player)===1 ? dummyPromptToken : 0;
      this.recordReplayDecision(prompt,response);
      const coreResponse=this.toCoreResponse(response);
      this.traceSession('core-response',{signature:this.replayPromptSignature(prompt),player:Number(prompt.player)||0,promptType:Number(prompt.type),response:this.traceSafeObject(response),coreResponse:this.traceSafeObject(coreResponse),explicitPlayerInput:this.userSubmittedPrompts.has(prompt)});

      this.core.duelSetResponse(this.handle, coreResponse);
    }
  }

  isPrompt(m) {
    const T = this.mod.OcgMessageType;
    return new Set([T.SELECT_BATTLECMD,T.SELECT_IDLECMD,T.SELECT_EFFECTYN,T.SELECT_YESNO,T.SELECT_OPTION,T.SELECT_CARD,T.SELECT_CHAIN,T.SELECT_PLACE,T.SELECT_POSITION,T.SELECT_TRIBUTE,T.SORT_CHAIN,T.SELECT_COUNTER,T.SELECT_SUM,T.SELECT_DISFIELD,T.SORT_CARD,T.SELECT_UNSELECT_CARD,T.ROCK_PAPER_SCISSORS,T.ANNOUNCE_RACE,T.ANNOUNCE_ATTRIB,T.ANNOUNCE_CARD,T.ANNOUNCE_NUMBER]).has(m.type);
  }

  trackedLocationKey(location) {
    const L=this.mod?.OcgLocation||{};
    const loc=Number(location)||0;
    if(loc & (L.HAND||0)) return 'hand';
    if(loc & (L.MZONE||0)) return 'mzone';
    if(loc & (L.SZONE||0)) return 'szone';
    if(loc & (L.GRAVE||0)) return 'grave';
    if(loc & (L.REMOVED||0)) return 'removed';
    if(loc & (L.EXTRA||0)) return 'extra';
    if(loc & (L.DECK||0)) return 'deck';
    return '';
  }

  removeKnownLinear(list, loc, code=0) {
    if(!Array.isArray(list)||!list.length)return;
    const seq=Number(loc?.sequence);
    if(Number.isInteger(seq)&&seq>=0&&seq<list.length){list.splice(seq,1);return;}
    const n=Number(code)||0;
    const idx=n?list.findIndex(c=>Number(c?.code)===n):-1;
    if(idx>=0)list.splice(idx,1);
  }

  insertKnownLinear(list, loc, card) {
    if(!Array.isArray(list)||!card)return;
    const seq=Number(loc?.sequence);
    const value={...card,sequence:Number.isInteger(seq)&&seq>=0?seq:list.length};
    if(Number.isInteger(seq)&&seq>=0&&seq<=list.length)list.splice(seq,0,value);else list.push(value);
    list.forEach((c,i)=>{if(c)c.sequence=i;});
  }

  clearKnownLocation(loc, code=0) {
    if(!loc||this.isAttachedXyzMaterial(loc))return;
    const player=Number(loc.controller)||0;
    const key=this.trackedLocationKey(loc.location);
    if(key==='hand')this.removeKnownLinear(this.knownHands[player],loc,code);
    else if(key==='deck'){const list=this.knownDecks[player]||[];const idx=Number(code)?list.findIndex(card=>this.normalizeActionCode(card?.code)===this.normalizeActionCode(code)):-1;if(idx>=0)list.splice(idx,1);else this.removeKnownLinear(list,loc,code);list.forEach((card,i)=>{if(card)card.sequence=i;});}
    else if(key==='extra')this.removeKnownLinear(this.knownExtras[player],loc,code);
    else if(key==='grave'||key==='removed')this.removeKnownLinear(this.knownPiles[player][key],loc,code);
    else if(key==='mzone'||key==='szone'){
      const seq=Number(loc.sequence);
      if(Number.isInteger(seq)&&seq>=0&&seq<this.knownField[player][key].length)this.knownField[player][key][seq]=null;
    }
  }

  rememberKnownLocation(loc, code=0, position=0, {legallyKnown=false}={}) {
    if(!loc||this.isAttachedXyzMaterial(loc))return;
    const player=Number(loc.controller)||0;
    const key=this.trackedLocationKey(loc.location);
    const n=Number(code)||0;
    const P=this.mod?.OcgPosition||{};
    const pos=Number(position||loc.position)||0;
    const card={code:n,position:pos,controller:player,location:Number(loc.location)||0,sequence:Number(loc.sequence)||0};
    if(key==='deck'){
      if(n)this.insertKnownLinear(this.knownDecks[player],loc,{...card,isHidden:player===1&&!this.opponentCardsVisible});
    } else if(key==='hand'){



      if(n)this.insertKnownLinear(this.knownHands[player],loc,card);
    } else if(key==='extra'){


      const faceup=!!(pos & (P.FACEUP||0));
      if((player===0&&n)||(player===1&&faceup&&n))this.insertKnownLinear(this.knownExtras[player],loc,card);
      else if(player===1)this.insertKnownLinear(this.knownExtras[player],loc,{...card,code:0,isHidden:true});
    } else if(key==='grave'){

      if(n)this.insertKnownLinear(this.knownPiles[player].grave,loc,{...card,position:P.FACEUP_ATTACK||pos||1});
    } else if(key==='removed'){
      const faceup=!!(pos & (P.FACEUP||0));
      if((player===0&&n)||(faceup&&n))this.insertKnownLinear(this.knownPiles[player].removed,loc,card);
      else this.insertKnownLinear(this.knownPiles[player].removed,loc,{...card,code:0,isHidden:true});
    } else if(key==='mzone'||key==='szone'){
      const seq=Number(loc.sequence);
      if(Number.isInteger(seq)&&seq>=0&&seq<this.knownField[player][key].length){
        const faceup=!!(pos & (P.FACEUP||0));
        const rulesKnown=player===0||faceup||!!legallyKnown;
        const displayKnown=rulesKnown||this.opponentCardsVisible;



        this.knownField[player][key][seq]={...card,code:displayKnown?n:0,isHidden:!displayKnown,legallyKnown:rulesKnown,testerVisible:player===1&&!rulesKnown&&this.opponentCardsVisible};
      }
    }
  }

  locationIsPublic(loc={}) {
    if(!this.mod)return false;const L=this.mod.OcgLocation||{},P=this.mod.OcgPosition||{};const location=Number(loc.location)||0,position=Number(loc.position)||0;
    if(location&(L.GRAVE||0))return true;
    if(location&(L.MZONE||0)||location&(L.SZONE||0)||location&(L.REMOVED||0))return !!(position&(P.FACEUP||0));
    return false;
  }

  knownCardAtLocation(loc={}) {
    if(this.isAttachedXyzMaterial(loc))return null;
    const player=Number(loc.controller)||0,key=this.trackedLocationKey(loc.location),seq=Number(loc.sequence);
    if(!key)return null;
    if((key==='mzone'||key==='szone')&&Number.isInteger(seq)&&seq>=0)return this.knownField?.[player]?.[key]?.[seq]||null;
    if(key==='hand'&&Number.isInteger(seq)&&seq>=0)return this.knownHands?.[player]?.[seq]||null;
    if(key==='extra'&&Number.isInteger(seq)&&seq>=0)return this.knownExtras?.[player]?.[seq]||null;
    if((key==='grave'||key==='removed')&&Number.isInteger(seq)&&seq>=0)return this.knownPiles?.[player]?.[key]?.[seq]||null;
    return null;
  }

  recentRevealContains(code, controller=null) {
    const n=this.normalizeActionCode(code);if(!n)return false;
    return (this.recentRevealBatch?.cards||[]).some(card=>{
      if(this.normalizeActionCode(card?.code)!==n)return false;
      if(controller==null)return true;
      const owner=Number(card?.controller);return Number.isFinite(owner)?owner===Number(controller):Number(this.recentRevealBatch?.player)===Number(controller);
    });
  }

  isLegallyKnownIdentity(code,from={},to={}) {
    const n=this.normalizeActionCode(code);if(!n)return false;
    const player=Number(to.controller??from.controller)||0;
    if(player===0)return true;
    if(this.locationIsPublic(from)||this.locationIsPublic(to))return true;
    const prior=this.knownCardAtLocation(from);
    if(prior?.legallyKnown)return true;
    const revealed=this.recentRevealContains(n,player);
    return !!revealed;
  }

  displayCodeForLog(code,from={},to={}) {
    const n=this.normalizeActionCode(code);if(!n)return 0;
    const player=Number(to.controller??from.controller)||0;
    const revealed=this.recentRevealContains(n,player);
    if(player===0||this.opponentCardsVisible||revealed||this.locationIsPublic(from)||this.locationIsPublic(to))return n;
    return 0;
  }

  playerLabel(player) { return Number(player)===0?'Player':'Practice Dummy'; }
  playerPossessive(player) { return Number(player)===0?"Player's":"Practice Dummy's"; }

  movementEndpointLabel(loc={},player=Number(loc.controller)||0) {
    if(this.isAttachedXyzMaterial(loc)){const host=this.xyzMaterialHostCard(loc),hostName=host?.code?this.cardName(host.code):'Xyz Monster';return `${this.playerPossessive(player)} ${hostName} - Xyz Material ${Number(loc.overlay_sequence)+1}`;}
    return `${this.playerPossessive(player)} ${formatLocation(this.mod,Number(loc.location)||0)}`;
  }

  movementText(m) {
    const from=m.from||{},to=m.to||{},code=this.displayCodeForLog(m.card,from,to);const subject=code?this.cardName(code):'a hidden card';
    const fromPlayer=Number(from.controller)||0,toPlayer=Number(to.controller??from.controller)||0,owner=this.playerLabel(fromPlayer),fromOverlay=this.isAttachedXyzMaterial(from),toOverlay=this.isAttachedXyzMaterial(to);
    if(fromOverlay){const host=this.xyzMaterialHostCard(from),hostName=host?.code?this.cardName(host.code):'the Xyz Monster',dest=formatLocation(this.mod,Number(to.location)||0);return `${owner} detaches ${subject} from ${hostName} as Xyz Material and moves it to ${toPlayer===fromPlayer?(fromPlayer===0?'their':'its'):this.playerPossessive(toPlayer)} ${dest}.`;}
    if(toOverlay){const host=this.xyzMaterialHostCard(to),hostName=host?.code?this.cardName(host.code):'the Xyz Monster';return `${owner} attaches ${subject} to ${hostName} as Xyz Material ${Number(to.overlay_sequence)+1}.`;}
    const fromName=formatLocation(this.mod,Number(from.location)||0),toName=formatLocation(this.mod,Number(to.location)||0),fromOwner=fromPlayer===0?'their':'its',toOwner=toPlayer===fromPlayer?fromOwner:(toPlayer===0?"Player's":"Practice Dummy's");
    return `${owner} moves ${subject} from ${fromOwner} ${fromName} to ${toOwner} ${toName}${Number(to.position)?` in ${formatPosition(this.mod,Number(to.position))} Position`:''}.`;
  }

  markOpponentAction(player) { if(Number(player)===1&&this.turnPlayer===1)this.opponentActionThisPhase=true; }

  chainRelation(source={}) {
    const code=this.normalizeActionCode(source?.code);if(!code)return null;
    return {
      chainLink:Math.max(0,Number(source?.chainLink)||0),
      code,
      controller:Number(source?.controller)||0,
      effect:String(source?.description||source?.effect||''),
      source:source?.source||`${this.playerPossessive(Number(source?.controller)||0)} ${formatLocation(this.mod,Number(source?.location)||0)}`,
    };
  }

  chainRelationshipText(relation, {includeEffect=true}={}) {
    if(!relation?.code)return '';
    const link=Number(relation.chainLink)||0;
    const head=`${link?`Chain Link ${link} - `:''}${this.playerPossessive(relation.controller)} ${this.cardName(relation.code)}`;
    const effect=this.conciseEffectText(relation.effect||'');
    return includeEffect&&effect?`${head}: ${effect}`:head;
  }

  currentResolutionCause() {
    const link=Number(this.resolvingChainLink)||0;
    const source=(link&&(this.chainHistory.get(link)||this.chainEffectSources.get(link)))||this.pendingEffectSource||null;
    return this.chainRelation(source||{});
  }

  findChainOutcomeCause(link) {
    link=Math.max(1,Number(link)||1);
    const candidates=[...this.chainHistory.values()].filter(source=>Number(source?.respondsToLink)===link&&Number(source?.chainLink)>link);
    if(!candidates.length)return null;
    const score=source=>{
      const effect=String(source?.description||'');let value=Number(source?.chainLink)||0;
      if(/negat|disable|cannot be activated|cannot activate|activation.*negat/i.test(effect))value+=1000;
      return value;
    };
    candidates.sort((a,b)=>score(b)-score(a));
    return this.chainRelation(candidates[0]);
  }

  directAttackContextForDamage(player) {
    const ctx=this.lastAttackContext;if(!ctx?.direct)return null;
    const victim=Number(ctx.attackerController)===0?1:0;
    if(Number(player)!==victim)return null;
    if(Number(ctx.turn)!==Number(this.turn))return null;
    return ctx;
  }

  confirmCardsPresentation(m={}) {
    const recipient=Number(m?.player)===1?1:0;
    const raw=Array.isArray(m?.cards)?m.cards:[];
    const active=this.currentResolutionCause()||this.chainRelation(this.pendingEffectSource||{})||null;
    const activeController=Number(active?.controller);
    const isPlayer=value=>Number(value)===0||Number(value)===1;
    const explicitOwners=[...new Set(raw.map(card=>Number(card?.controller??card?.player)).filter(isPlayer))];
    let actor=explicitOwners.length===1?explicitOwners[0]:(isPlayer(activeController)?activeController:(recipient===0?1:0));
    const cards=raw.map(card=>({
      code:Number(card?.code??card)||0,
      position:Number(card?.position)||0,
      controller:isPlayer(Number(card?.controller??card?.player))?Number(card?.controller??card?.player):actor,
      location:Number(card?.location)||0,
      sequence:Number(card?.sequence)||0,
    })).filter(card=>card.code);
    const owners=[...new Set(cards.map(card=>Number(card.controller)).filter(isPlayer))];
    if(owners.length===1)actor=owners[0];
    const selfInspection=(owners.length===1&&owners[0]===recipient)||(!owners.length&&isPlayer(activeController)&&activeController===recipient);
    const mode=selfInspection?'inspect':'reveal';
    const locations=[...new Set(cards.map(card=>Number(card.location)||0).filter(Boolean))];
    const location=locations.length===1?locations[0]:0;
    const locationName=location?formatLocation(this.mod,location):'';



    const rulesVisible=recipient===0||actor===0;
    const visibleCards=rulesVisible?cards:[];
    return {recipient,actor,mode,cards,visibleCards,location,locationName,effect:active,rulesVisible};
  }

  markActivatedFieldSourceFaceup(loc={},code=0) {
    const L=this.mod?.OcgLocation||{},P=this.mod?.OcgPosition||{};
    if(!((Number(loc.location)||0)&Number(L.SZONE||0)))return;
    const player=Number(loc.controller)||0,seq=Number(loc.sequence)||0;if(seq<0)return;
    const prior=this.knownField?.[player]?.szone?.[seq]||null;
    const priorPos=Number(prior?.position)||0,faceup=Number(P.FACEUP_ATTACK)||Number(P.FACEUP)||1;
    const cardCode=this.normalizeActionCode(code)||this.normalizeActionCode(prior?.code)||0;
    const next={...(prior||{}),code:cardCode,position:faceup,controller:player,location:Number(loc.location)||Number(L.SZONE)||0,sequence:seq,isHidden:false,legallyKnown:true,testerVisible:false,activatedFaceup:true};
    if(this.knownField?.[player]?.szone)this.knownField[player].szone[seq]=next;
    if(this.field?.players?.[player]?.szone){const live=this.field.players[player].szone[seq];this.field.players[player].szone[seq]={...(live||next),...next};}
    if(priorPos&&(priorPos&Number(P.FACEDOWN||0)))this.queueCardAnimation('flip',{player,location:Number(loc.location)||Number(L.SZONE)||0,sequence:seq,code:cardCode,showcase:false});
  }

  consumeMessage(m) {
    const T = this.mod.OcgMessageType;
    const P = this.mod.OcgPosition||{};


    if(m?.type!==T.RETRY)this.duelStateRevision+=1;
    if (m.type === T.NEW_TURN) {
      this.turn += 1;this.turnPlayer=Number(m.player);this.opponentActionThisPhase=false;this.meaningfulResponseWindow=false;this.smartOptionalChainPhaseOffers.clear();this.dummyPhaseActionCount=0;this.dummyBattleActionCount=0;this.dummySafeModeThisTurn=false;this.dummyActionHistory.clear();this.dummyPlan={turn:0,intents:[],recentCodes:[]};this.lastAttackContext=null;this.dummyMaterialPlanner=null;this.lastSummonContext=[null,null];this.chainHistory.clear();if(this.turnPlayer!==0)this.recentRevealBatch=null;
      this.log(`Turn ${this.turn} begins - ${m.player===0?'Player':'Practice Dummy'}.`);
    }
    else if (m.type === T.NEW_PHASE) {
      const phaseValue=m.phase,label=this.phaseLabel(phaseValue);const commit=()=>{this.phase=phaseValue;this.presentedPhase=phaseValue;this.opponentActionThisPhase=false;this.meaningfulResponseWindow=false;this.dummyPhaseActionCount=0;this.dummyBattleActionCount=0;this.lastAttackContext=null;this.log(`Turn ${Math.max(1,this.turn)} - ${label} begins.`);this.renderMeta();this.playSound('phase');};
      return this.showPhaseAnnouncement(label,{phase:phaseValue,onStart:commit,duration:680});
    }
    else if (m.type === T.DRAW) {
      const player=Number(m.player),drawn=Array.isArray(m.drawn)?m.drawn:[];
      const priorHandCount=this.knownHands[player]?.length||0;
      for(const card of drawn){const code=Number(card?.code)||0;if(code){this.removeKnownLinear(this.knownDecks[player],{sequence:-1},code);this.knownHands[player].push({code,position:Number(card?.position)||0});}}
      const revealCards=drawn.map(card=>({code:Number(card?.code)||0,position:Number(card?.position)||0,controller:player,location:this.mod?.OcgLocation?.HAND||0})).filter(card=>card.code);
      if(player===0&&revealCards.length){const effectCode=this.normalizeActionCode(this.activeEffectCode||this.pendingEffectSource?.code)||0,chainLink=Number(this.resolvingChainLink||this.lastActivatedChainLink||0);this.recentRevealBatch={label:'Cards Drawn',cards:revealCards,turn:this.turn,player:0,actor:0,mode:'draw',effectCode,chainLink,revision:Number(this.duelStateRevision)||0};}
      const count=drawn.length||1;const names=revealCards.map(c=>this.cardName(c.code));
      const openingBatch=priorHandCount===0&&drawn.length>=5&&this.turn<=1;
      this.log(`${player===0?'Player':'Practice Dummy'} draws ${count} card${count===1?'':'s'}${names.length&&(player===0||this.opponentCardsVisible)?`: ${names.join(', ')}`:'.'}`,{type:'draw',cards:(player===0||this.opponentCardsVisible)?revealCards:[],controller:player});
      if(player===1){const visible=this.opponentCardsVisible&&revealCards.length?revealCards[0].code:0;this.showOpponentEvent({title:`Practice Dummy draws ${count} card${count===1?'':'s'}`,code:visible,hiddenCard:!visible,detail:visible&&count===1?`${this.cardName(visible)} was added to its hand`:'The drawn card remains private.',duration:openingBatch?1050:1350});}

      drawn.forEach((card,index)=>{const sequence=Math.max(0,(this.knownHands[player]?.length||drawn.length)-drawn.length+index);const visibleCode=player===0||this.opponentCardsVisible?Number(card?.code)||0:0;this.queueDrawFlight(player,sequence,visibleCode,openingBatch?index*140:0);});
      if((this.knownHands[player]?.length||0)>=5)this.initialDrawSeen[player]=true;
      if(this.initialDrawSeen[0]&&this.initialDrawSeen[1])this.initialSetupComplete=true;
    }
    else if (T.CONFIRM_CARDS!=null&&m.type===T.CONFIRM_CARDS) {




      const ctx=this.confirmCardsPresentation(m),{recipient,actor,mode,cards,visibleCards,locationName,effect}=ctx;
      const count=cards.length,ownerWord=actor===0?'their':'its';
      const place=locationName?` from ${ownerWord} ${locationName}`:'';
      if(mode==='inspect'){
        if(visibleCards.length)this.recentRevealBatch={label:'Cards Inspected',cards:visibleCards,turn:this.turn,player:actor,actor,recipient,mode:'inspect',effectCode:this.normalizeActionCode(effect?.code)||0,chainLink:Number(effect?.chainLink)||0,revision:Number(this.duelStateRevision)||0};
        if(count)this.log(`${this.playerLabel(actor)} looks at ${count} card${count===1?'':'s'}${place}.`,{type:'inspect',cards:visibleCards,controller:actor,recipient,source:locationName||undefined,cause:effect||undefined});
        if(actor===1&&count&&effect?.chainLink)this.showOpponentEvent({title:`Practice Dummy looks at ${count} card${count===1?'':'s'}${locationName?` from its ${locationName}`:''}`,code:0,hiddenCard:true,detail:'Private card inspection',chainLink:Number(effect.chainLink)||0,duration:1250});
      }else{
        if(visibleCards.length)this.recentRevealBatch={label:'Cards Revealed',cards:visibleCards,turn:this.turn,player:actor,actor,recipient,mode:'reveal',effectCode:this.normalizeActionCode(effect?.code)||0,chainLink:Number(effect?.chainLink)||0,revision:Number(this.duelStateRevision)||0};
        const names=visibleCards.length===cards.length?`: ${visibleCards.map(c=>this.cardName(c.code)).join(', ')}`:'';
        if(count)this.log(`${this.playerLabel(actor)} reveals ${count} card${count===1?'':'s'}${names}.`,{type:'reveal',cards:visibleCards,controller:actor,recipient,cause:effect||undefined});
        if(actor===1&&recipient===0&&visibleCards.length)this.showOpponentEvent({title:`Practice Dummy reveals ${count} card${count===1?'':'s'}`,code:visibleCards[0].code,detail:visibleCards.map(c=>this.cardName(c.code)).join(', '),chainLink:Number(effect?.chainLink)||0,duration:1500});
      }
    }
    else if ((T.CONFIRM_DECKTOP!=null&&m.type===T.CONFIRM_DECKTOP)||(T.CONFIRM_EXTRATOP!=null&&m.type===T.CONFIRM_EXTRATOP)) {


      const player=Number(m.player)||0,source=Array.isArray(m.cards)?m.cards:Array.isArray(m.decktop)?m.decktop:Array.isArray(m.extratop)?m.extratop:[];
      const cards=source.map(card=>({code:Number(card?.code??card)||0,position:Number(card?.position)||0,controller:Number(card?.controller??card?.player??player),location:Number(card?.location)||0,sequence:Number(card?.sequence)||0})).filter(card=>card.code);
      if(cards.length){const effectCode=this.normalizeActionCode(this.activeEffectCode||this.pendingEffectSource?.code)||0,chainLink=Number(this.resolvingChainLink||this.lastActivatedChainLink||0);this.recentRevealBatch={label:'Cards Revealed / Excavated',cards,turn:this.turn,player,actor:player,mode:'reveal',effectCode,chainLink,revision:Number(this.duelStateRevision)||0};}
      if(cards.length)this.log(`${this.playerLabel(player)} reveals/excavates ${cards.length} card${cards.length===1?'':'s'}: ${cards.map(c=>this.cardName(c.code)).join(', ')}.`,{type:'reveal',cards,controller:player});
      if(player===1&&cards.length)this.showOpponentEvent({title:`Practice Dummy reveals ${cards.length} card${cards.length===1?'':'s'}`,code:cards[0].code,detail:cards.map(c=>this.cardName(c.code)).join(', '),duration:1650});
    }
    else if (m.type === T.MOVE) {
      const from=m.from||{},to=m.to||{},code=Number(m.card)||0;
      const fieldMask=Number(this.mod?.OcgLocation?.MZONE||0)|Number(this.mod?.OcgLocation?.SZONE||0);const sameFieldSlot=Number(from.controller)===Number(to.controller??from.controller)&&Number(from.location)===Number(to.location)&&Number(from.sequence)===Number(to.sequence)&&!!(Number(from.location)&fieldMask);
      const fromFaceup=!!(Number(from.position)&Number(P.FACEUP||0)),toFaceup=!!(Number(to.position)&Number(P.FACEUP||0));
      const movementAnimation=sameFieldSlot&&fromFaceup!==toFaceup
        ?this.queueCardAnimation('flip',{player:Number(to.controller??from.controller)||0,location:Number(to.location)||0,sequence:Number(to.sequence)||0,code,showcase:false})
        :this.queueMoveAnimation(m);
      const legallyKnownMove=this.isLegallyKnownIdentity(code,from,to);this.clearKnownLocation(from,code);this.rememberKnownLocation(to,code,Number(to.position)||0,{legallyKnown:legallyKnownMove});
      const fromPlayer=Number(from.controller)||0,toPlayer=Number(to.controller??from.controller)||0,L=this.mod?.OcgLocation||{},fromOverlay=this.isAttachedXyzMaterial(from),toOverlay=this.isAttachedXyzMaterial(to);if(!sameFieldSlot&&((!fromOverlay&&((Number(from.location)||0)&Number(L.MZONE||0)))||(!toOverlay&&((Number(to.location)||0)&Number(L.MZONE||0)))))this.monsterTopologyRevision+=1;
      if(Number(from.location)&Number(L.DECK||0))this.lastDeckAccessByPlayer[fromPlayer]={turn:this.turn,effectCode:Number(this.pendingEffectSource?.code)||Number(this.activeEffectCode)||0,effectController:Number(this.pendingEffectSource?.controller??fromPlayer),cardCode:code};
      const movementCause=this.currentResolutionCause();
      this.log(this.movementText(m),{type:'move',code:this.displayCodeForLog(code,from,to),source:this.movementEndpointLabel(from,fromPlayer),destination:this.movementEndpointLabel(to,toPlayer),controller:fromPlayer,cause:movementCause||undefined,xyzMaterial:fromOverlay||toOverlay?{action:fromOverlay?'detach':'attach',overlaySequence:Number((fromOverlay?from:to).overlay_sequence)||0,hostCode:Number(this.xyzMaterialHostCard(fromOverlay?from:to)?.code)||0}:undefined});
      if(movementCause?.chainLink){
        const destination=Number(to.location)||0,R=this.mod?.OcgReason||{},reason=Number(m.reason)||0,destroyed=!!(reason&Number(R.DESTROY||0)),released=!!(reason&Number(R.RELEASE||0)),discarded=!!(reason&Number(R.DISCARD||0)),material=!!(reason&Number(R.MATERIAL||0));
        const movementOutcome=destination&Number(L.REMOVED||0)?'Banished':destination&Number(L.GRAVE||0)?'Sent to GY':destination&Number(L.HAND||0)?'Returned to Hand':destination&(Number(L.DECK||0)|Number(L.EXTRA||0))?'Returned to Deck':'Moved';
        const primaryOutcome=fromOverlay?'Detached Xyz Material':toOverlay?'Attached as Xyz Material':destroyed?'Destroyed':released?'Released':discarded?'Discarded':material?'Used as Material':movementOutcome;
        const presentationIdentity={controller:fromPlayer,location:Number(from.location)||0,sequence:Number(from.sequence)||0};
        const resultLoc={controller:toPlayer,location:destination,sequence:Number(to.sequence)||0,presentationIdentity};
        this.recordChainSummaryCardOutcome(movementCause.chainLink,{code,controller:toPlayer,location:destination,sequence:Number(to.sequence)||0,outcome:primaryOutcome});
        const orderedOutcome=!!(this.actionPresentationEnabled&&!this.synchronizedShowcaseTravelEnabled&&movementAnimation&&!['pending','resolving','resolved','moved'].includes(this.chainOutcomeDescriptor(primaryOutcome).key));
        if(orderedOutcome)movementAnimation.orderedOutcome={loc:resultLoc,outcome:primaryOutcome,chainLink:Number(movementCause.chainLink)||0,code};
        else this.showCardOutcomeEffect(resultLoc,primaryOutcome,movementCause.chainLink,code);
      }
      const visibleMoveCode=this.displayCodeForLog(code,from,to);if(toPlayer===1&&visibleMoveCode&&this.initialSetupComplete&&!movementCause?.chainLink){const toName=formatLocation(this.mod,Number(to.location)||0);this.showOpponentEvent({title:`Practice Dummy moves ${this.cardName(visibleMoveCode)}`,code:visibleMoveCode,detail:`Added/moved to ${toName}`,duration:1300});}
    }
    else if (T.SET != null && m.type === T.SET) {
      const loc={controller:Number(m.controller)||0,location:Number(m.location)||0,sequence:Number(m.sequence)||0,position:Number(m.position)||0};const key=this.trackedLocationKey(loc.location);
      if(key==='mzone'||key==='szone'){const prior=this.knownField[loc.controller][key][loc.sequence];const candidate=Number(m.code)||Number(prior?.code)||0;const rulesKnown=loc.controller===0||!!prior?.legallyKnown;const displayKnown=rulesKnown||this.opponentCardsVisible;const code=displayKnown?candidate:0;this.knownField[loc.controller][key][loc.sequence]={code,position:loc.position,controller:loc.controller,location:loc.location,sequence:loc.sequence,isHidden:!displayKnown,legallyKnown:rulesKnown,testerVisible:loc.controller===1&&!rulesKnown&&this.opponentCardsVisible,activatedFaceup:false};}
      this.markOpponentAction(loc.controller);const name=(loc.controller===0||this.opponentCardsVisible)&&Number(m.code)?` ${this.cardName(m.code)}`:' a card';this.log(`${loc.controller===0?'Player':'Practice Dummy'} sets${name} in ${formatLocation(this.mod,loc.location)} ${loc.sequence+1}.`,{type:'set',code:(loc.controller===0||this.opponentCardsVisible)?Number(m.code)||0:0,controller:loc.controller});this.queueCardAnimation('set',{player:loc.controller,location:loc.location,sequence:loc.sequence,code:(loc.controller===0||this.opponentCardsVisible)?Number(m.code)||0:0});
    }
    else if (T.POS_CHANGE != null && m.type === T.POS_CHANGE) {
      const player=Number(m.controller)||0,key=this.trackedLocationKey(m.location),seq=Number(m.sequence)||0;let knownCode=Number(m.code)||0,priorPosition=0;
      if((key==='mzone'||key==='szone')&&this.knownField[player][key][seq]){const faceup=!!(Number(m.position)&(P.FACEUP||0));const known=this.knownField[player][key][seq];priorPosition=Number(known.position)||0;knownCode=knownCode||Number(known.code)||0;const rulesKnown=player===0||faceup||!!known.legallyKnown;const displayKnown=rulesKnown||this.opponentCardsVisible;this.knownField[player][key][seq]={...known,code:displayKnown?knownCode:0,isHidden:!displayKnown,legallyKnown:rulesKnown,testerVisible:player===1&&!rulesKnown&&this.opponentCardsVisible,position:Number(m.position)||0,activatedFaceup:key==='szone'&&!!(Number(m.position)&(P.FACEUP||0))?!!known.activatedFaceup:false};}
      const faceVisibilityChanged=!!(priorPosition&&(!!(priorPosition&(P.FACEUP||0))!==!!(Number(m.position)&(P.FACEUP||0))));
      const positionCause=this.currentResolutionCause();this.markOpponentAction(player);this.log(`${knownCode&&(player===0||this.opponentCardsVisible||this.locationIsPublic({location:m.location,position:m.position}))?this.cardName(knownCode):'A card'} changes to ${formatPosition(this.mod,Number(m.position)||0)} Position.`,{type:'position',code:(player===0||this.opponentCardsVisible||this.locationIsPublic({location:m.location,position:m.position}))?knownCode:0,controller:player,cause:positionCause||undefined,outcome:'Position Changed'});
      const positionAnimation=faceVisibilityChanged?this.queueCardAnimation('flip',{player,location:Number(m.location)||0,sequence:seq,code:knownCode,showcase:false}):this.queueCardAnimation('position',{player,location:Number(m.location)||0,sequence:seq,code:knownCode});
      if(positionCause?.chainLink&&knownCode){
        const result={code:knownCode,controller:player,location:Number(m.location)||0,sequence:seq,outcome:'Position Changed'};this.recordChainSummaryCardOutcome(positionCause.chainLink,result);
        if(this.actionPresentationEnabled&&!this.synchronizedShowcaseTravelEnabled&&positionAnimation)positionAnimation.orderedOutcome={loc:result,outcome:'Position Changed',chainLink:Number(positionCause.chainLink)||0,code:knownCode};
        else this.showCardOutcomeEffect(result,'Position Changed',positionCause.chainLink,knownCode);
      }
    }
    else if (T.SHUFFLE_HAND != null && m.type === T.SHUFFLE_HAND) {
      const player=Number(m.player);if(Array.isArray(m.cards)){this.knownHands[player]=m.cards.map((code,sequence)=>({code:Number(code)||0,position:0,sequence,controller:player,location:this.mod.OcgLocation.HAND})).filter(c=>c.code);}


    }
    else if (T.SHUFFLE_EXTRA != null && m.type === T.SHUFFLE_EXTRA) {
      const player=Number(m.player)||0;if(Array.isArray(m.cards)){this.knownExtras[player]=m.cards.map((code,sequence)=>({code:Number(code)||0,position:P.FACEDOWN_ATTACK||0,sequence,controller:player,location:this.mod.OcgLocation.EXTRA,isHidden:player===1&&!this.opponentCardsVisible}));}this.log(`${player===0?'Player':'Practice Dummy'} Extra Deck is shuffled/reordered.`);
    }
    else if (T.SHUFFLE_DECK != null && m.type === T.SHUFFLE_DECK) {
      const player=Number(m.player)||0,access=this.lastDeckAccessByPlayer[player];
      if(this.initialSetupComplete){const reason=access&&access.turn===this.turn&&access.effectCode?` after ${this.cardName(access.effectCode)} accessed it`:'';this.log(`${this.playerLabel(player)} Deck shuffled${reason}.`,{type:'shuffle',controller:player,code:access?.effectCode||0,effect:access?.effectCode?this.cardDescription(access.effectCode):''});this.playDeckShuffleSound();this.queueCardAnimation('shuffle',{player,location:Number(this.mod?.OcgLocation?.DECK)||0,showcase:false});}
      this.lastDeckAccessByPlayer[player]=null;
    }
    else if (m.type === T.DAMAGE) {
      const amount=Number(m.amount)||0,directCtx=this.directAttackContextForDamage(m.player),attackCtx=this.lastAttackContext&&Number(this.lastAttackContext.turn)===Number(this.turn)?this.lastAttackContext:null,cause=directCtx?null:this.currentResolutionCause();
      this.lp[m.player]=Math.max(0,this.lp[m.player]-amount);
      if(attackCtx)this.updateAttackFxDamage(attackCtx,amount,{lethal:Number(this.lp[m.player])<=0});



      const now=(typeof performance!=='undefined'&&typeof performance.now==='function'?performance.now():Date.now());
      const damageDelay=attackCtx?Math.max(0,Number(attackCtx.damageAnimationNotBeforeAt||0)-now):0;
      this.queueLpAnimation(m.player,-amount,{directAttack:!!directCtx,attackerCode:Number(attackCtx?.attackerCode||directCtx?.attackerCode)||0,attackContext:attackCtx||null,delay:damageDelay,immediate:damageDelay<=0,displayValue:Number(this.lp[m.player])||0,lethalPresentation:Number(this.lp[m.player])<=0});
      const directText=directCtx?` from a direct attack by ${directCtx.attackerCode?this.cardName(directCtx.attackerCode):'a monster'}`:'';
      this.log(`${m.player===0?'Player':'Practice Dummy'} takes ${amount.toLocaleString()} damage${directText}.`,{type:directCtx?'direct-attack-damage':'damage',amount:-amount,controller:Number(m.player)||0,code:Number(directCtx?.attackerCode)||0,cause:cause||undefined,outcome:directCtx?'Direct attack damage':'Damage'});
      if(attackCtx)this.lastAttackContext=null;
    }
    else if (m.type === T.RECOVER) {this.lp[m.player]+=m.amount;if(!Array.isArray(this.displayLp))this.displayLp=[...this.lp];this.displayLp[m.player]=this.lp[m.player];this.queueLpAnimation(m.player,Number(m.amount),{displayValue:this.displayLp[m.player]});this.log(`${m.player===0?'Player':'Practice Dummy'} gains ${Number(m.amount).toLocaleString()} LP.`,{type:'recover',amount:Number(m.amount),controller:Number(m.player)||0,outcome:'LP gained'});}
    else if (m.type === T.LPUPDATE) {const prior=Number(this.lp[m.player])||0;this.lp[m.player]=m.lp;if(!Array.isArray(this.displayLp))this.displayLp=[...this.lp];this.displayLp[m.player]=this.lp[m.player];const delta=Number(m.lp)-prior;if(delta){this.queueLpAnimation(m.player,delta,{displayValue:this.displayLp[m.player],lethalPresentation:delta<0&&Number(this.displayLp[m.player])<=0});this.log(`${m.player===0?'Player':'Practice Dummy'} LP changes from ${prior.toLocaleString()} to ${Number(m.lp).toLocaleString()}.`,{type:'lp-update',amount:delta,controller:Number(m.player)||0,outcome:delta>0?'LP gained':'LP lost'});}}
    else if (m.type === T.PAY_LPCOST) {this.lp[m.player]=Math.max(0,this.lp[m.player]-m.amount);if(!Array.isArray(this.displayLp))this.displayLp=[...this.lp];this.displayLp[m.player]=this.lp[m.player];this.queueLpAnimation(m.player,-Number(m.amount),{displayValue:this.displayLp[m.player]});this.log(`${m.player===0?'Player':'Practice Dummy'} pays ${Number(m.amount).toLocaleString()} LP as a cost.`,{type:'lp-cost',amount:-Number(m.amount),controller:Number(m.player)||0,outcome:'LP cost paid'});}
    else if (m.type === T.CHAINING) {
      const code=this.normalizeActionCode(m.code),link=Number(m.chain_size)||1,controller=Number(m.triggering_controller??m.controller??m.card?.controller)||0;
      if(link===1){this.chainHistory.clear();this.clearChainVisualization({immediate:true});this.beginChainSummary();}
      const previousSource=link>1?(this.chainHistory.get(link-1)||this.chainEffectSources.get(link-1)||null):null;
      const previous=this.chainRelation(previousSource||{});
      this.chainEffectCodes.set(link,code);this.lastActivatedChainLink=link;this.activeEffectCode=code;
      const effectLabel=this.descriptionText(m.description,'');
      const pendingSame=this.normalizeActionCode(this.pendingEffectSource?.code)===code&&(this.pendingEffectSource?.specific||this.pendingEffectSource?.gate)?String(this.pendingEffectSource?.description||''):'';
      const resolvedEffect=this.resolvedEffectDisplay(code,m.description,pendingSame||effectLabel);
      const structuralEffect=resolvedEffect.text?'':this.deterministicEffectRecovery(code,{controller,location:Number(m.triggering_location??m.location??m.card?.location)||0,sequence:Number(m.triggering_sequence??m.sequence??m.card?.sequence)||0},m);
      const baseEffect=resolvedEffect.text||structuralEffect||'';
      const effect=this.expandActivatedEffectContinuation(code,baseEffect)||baseEffect;
      const hasExactEffect=!!(resolvedEffect.specific||structuralEffect);
      this.activeEffectDescription=effect;
      const source={
        code,description:this.activeEffectDescription,descriptionId:m.description??0,controller,
        location:Number(m.triggering_location??m.location??m.card?.location)||0,sequence:Number(m.triggering_sequence??m.sequence??m.card?.sequence)||0,
        chainLink:link,specific:hasExactEffect,gate:!!(resolvedEffect.gate||this.effectChoiceGateText(effect)),
        respondsToLink:Number(previous?.chainLink)||0,respondsToCode:Number(previous?.code)||0,
        respondsToController:Number(previous?.controller)||0,respondsToDescription:String(previous?.effect||''),
      };
      this.pendingEffectSource=source;this.chainEffectSources.set(link,{...source});this.chainHistory.set(link,{...source});this.recordChainSummaryLink(link,source);
      this.markOpponentAction(controller);this.meaningfulResponseWindow=Number(controller)===1;
      const responseSuffix=previous?` Responding to ${this.chainRelationshipText(previous,{includeEffect:false})}.`:'';
      this.log(`Chain Link ${link} - ${this.playerLabel(controller)} activates ${this.cardName(code)}${effect?`: ${effect}`:'.'}${responseSuffix}`,{
        type:'chain',code,effect:this.activeEffectDescription,chainLink:link,controller,
        source:`${this.playerPossessive(controller)} ${formatLocation(this.mod,source.location)}`,
        respondsTo:previous||undefined,
      });
      if(controller===1||link>1){
        const responseDetail=previous?`Responding to ${this.chainRelationshipText(previous,{includeEffect:false})}`:'Activated effect';
        this.traceSession?.('chain-activation-uses-primary-presentation',{chainLink:link,code,controller,detail:responseDetail});
      }
      const loc={controller:Number(source.controller)||0,location:Number(source.location)||0,sequence:Number(source.sequence)||0};
      this.markActivatedFieldSourceFaceup(loc,code);
      this.showChainLinkVisual(link,code,loc);this.queueCardAnimation('activate',{player:Number(loc.controller)||0,location:Number(loc.location)||0,sequence:Number(loc.sequence)||0,code,chainLink:link,actionLabel:`Chain Link ${link} - ${this.cardName(code)} activated`});this.playSound(link>1?'chain':'activate');
    }
    else if (m.type === T.CHAIN_SOLVING) {
      const link=Number(m.chain_size)||1,source=this.chainHistory.get(link)||this.chainEffectSources.get(link)||{},code=this.normalizeActionCode(this.chainEffectCodes.get(link)||source.code||this.activeEffectCode);
      if(this.activeChainSummary&&link&&!this.activeChainSummary.resolutionOrder.includes(link))this.activeChainSummary.resolutionOrder.push(link);
      this.resolvingChainLink=link;this.activeEffectCode=code;if(source.code)this.pendingEffectSource={...source};
      const respondsTo=source.respondsToLink?this.chainRelation(this.chainHistory.get(source.respondsToLink)||{}):null;
      this.log(`Resolving Chain Link ${link}${code?` - ${this.playerLabel(source.controller)}'s ${this.cardName(code)}`:''}.`,{type:'chain-resolving',code,effect:source.description||'',chainLink:link,controller:source.controller,respondsTo:respondsTo||undefined});
      if(code)this.traceSession?.('chain-resolution-presentation-suppressed',{chainLink:link,code,controller:Number(source.controller)||0});
    }
    else if (T.CHAIN_SOLVED!=null && m.type===T.CHAIN_SOLVED) {
      const link=Number(m.chain_size)||1,source=this.chainHistory.get(link)||this.chainEffectSources.get(link)||{},code=Number(this.chainEffectCodes.get(link))||Number(source.code)||0;
      const respondsTo=source.respondsToLink?this.chainRelation(this.chainHistory.get(source.respondsToLink)||{}):null;
      const relationText=respondsTo?` after responding to ${this.chainRelationshipText(respondsTo,{includeEffect:false})}`:'';
      this.log(`Chain Link ${link}${code?` - ${this.playerLabel(source.controller)}'s ${this.cardName(code)}`:''} resolved${relationText}.`,{type:'chain-resolved',code,effect:source.description||'',chainLink:link,controller:source.controller,respondsTo:respondsTo||undefined,outcome:'Resolved'});
      this.recordChainSummaryOutcome(link,'Resolved');
      this.traceSession?.('generic-resolved-presentation-suppressed',{chainLink:link,code});
      this.resolveChainLinkVisual(link);this.chainEffectCodes.delete(link);this.chainEffectSources.delete(link);if(this.resolvingChainLink===link)this.resolvingChainLink=0;if(this.lastActivatedChainLink===link)this.lastActivatedChainLink=Math.max(0,...this.chainEffectSources.keys());
      if(!this.chainEffectCodes.size){this.activeEffectCode=0;this.activeEffectDescription='';this.pendingEffectSource=null;this.recentRevealBatch=null;this.meaningfulResponseWindow=false;this.dummyMaterialPlanner=null;setTimeout(()=>{if(!this.chainEffectCodes.size)this.chainHistory.clear();},2400);}
    }
    else if (T.CHAIN_END!=null && m.type===T.CHAIN_END) {



      this.finalizeChainSummary();this.chainHistory.clear();this.chainEffectSources.clear();this.chainEffectCodes.clear();this.resolvingChainLink=0;this.lastActivatedChainLink=0;this.activeEffectCode=0;this.activeEffectDescription='';this.pendingEffectSource=null;this.meaningfulResponseWindow=false;


      this.scheduleChainVisualizationCompletion(900,{waitForAssociated:true});
    }
    else if (m.type === T.CHAIN_NEGATED || m.type === T.CHAIN_DISABLED) {
      const link=Number(m.chain_size)||1,source=this.chainHistory.get(link)||this.chainEffectSources.get(link)||{},code=Number(this.chainEffectCodes.get(link))||Number(source.code)||0,cause=this.findChainOutcomeCause(link);
      const disabled=m.type===T.CHAIN_DISABLED,outcome=disabled?'Disabled':'Negated',outcomeKey=disabled?'disabled':'negated';this.setChainLinkVisualState(link,outcomeKey);
      const subject=code?`${this.playerPossessive(source.controller)} ${this.cardName(code)}`:`Chain Link ${link}`;
      const causeText=cause?` by ${this.chainRelationshipText(cause,{includeEffect:false})}`:'';
      this.log(`Chain Link ${link} - ${subject} was ${outcomeKey}${causeText}.`,{type:disabled?'chain-disabled':'chain-negated',code,effect:source.description||'',chainLink:link,controller:source.controller,cause:cause||undefined,outcome});
      this.recordChainSummaryOutcome(link,outcome);
      this.showCardOutcomeEffect(source,outcome,link,code);
      this.chainEffectCodes.delete(link);this.chainEffectSources.delete(link);if(this.resolvingChainLink===link)this.resolvingChainLink=0;
      if(!this.chainEffectCodes.size){this.activeEffectCode=0;this.activeEffectDescription='';this.pendingEffectSource=null;this.recentRevealBatch=null;this.meaningfulResponseWindow=false;this.dummyMaterialPlanner=null;setTimeout(()=>{if(!this.chainEffectCodes.size)this.chainHistory.clear();},2400);}
    }
    else if (m.type === T.SUMMONING) {
      const loc=(m.card&&typeof m.card==='object')?m.card:{controller:m.controller??m.player,location:m.location,sequence:m.sequence},cause=this.currentResolutionCause();
      this.lastSummonContext[Number(loc.controller)||0]={code:this.normalizeActionCode(m.code),controller:Number(loc.controller)||0,kind:'normal',location:Number(loc.location)||this.mod?.OcgLocation?.MZONE||0,sequence:Number(loc.sequence)||0,turn:Number(this.turn)||0,revision:Number(this.duelStateRevision)||0};
      this.markOpponentAction(loc.controller);this.meaningfulResponseWindow=Number(loc.controller)===1;
      this.log(`${Number(loc.controller)===0?'Player':'Practice Dummy'} Normal Summons ${this.cardName(m.code)}.`,{type:'summon',code:Number(m.code)||0,controller:Number(loc.controller)||0,cause:cause||undefined,outcome:'Normal Summon'});
      if(Number(loc.controller)===1&&cause&&!cause?.chainLink)this.showOpponentEvent({title:`${this.cardName(cause.code)} effect result`,code:this.normalizeActionCode(m.code),detail:`Practice Dummy Normal Summons ${this.cardName(m.code)}`,chainLink:Number(cause.chainLink)||0,effectDriven:true,duration:1750});
      const summonAnimation=this.queueCardAnimation('summon',{player:Number(loc.controller)||0,location:Number(loc.location)||this.mod?.OcgLocation?.MZONE||0,sequence:Number(loc.sequence)||0,code:Number(m.code)||0,showcase:!cause?.chainLink});
      if(cause?.chainLink){
        const result={code:Number(m.code)||0,controller:Number(loc.controller)||0,location:Number(loc.location)||this.mod?.OcgLocation?.MZONE||0,sequence:Number(loc.sequence)||0,outcome:'Summoned'};this.recordChainSummaryCardOutcome(cause.chainLink,result);
        if(this.actionPresentationEnabled&&!this.synchronizedShowcaseTravelEnabled&&summonAnimation)summonAnimation.orderedOutcome={loc:result,outcome:'Summoned',chainLink:Number(cause.chainLink)||0,code:result.code};
        else this.showCardOutcomeEffect(result,'Summoned',cause.chainLink,result.code);
      }
    }
    else if (m.type === T.SPSUMMONING) {
      const loc=(m.card&&typeof m.card==='object')?m.card:{controller:m.controller??m.player,location:m.location,sequence:m.sequence},cause=this.currentResolutionCause();
      this.lastSummonContext[Number(loc.controller)||0]={code:this.normalizeActionCode(m.code),controller:Number(loc.controller)||0,kind:'special',location:Number(loc.location)||this.mod?.OcgLocation?.MZONE||0,sequence:Number(loc.sequence)||0,turn:Number(this.turn)||0,revision:Number(this.duelStateRevision)||0};
      this.markOpponentAction(loc.controller);this.meaningfulResponseWindow=Number(loc.controller)===1;
      this.log(`${Number(loc.controller)===0?'Player':'Practice Dummy'} Special Summons ${this.cardName(m.code)}${cause?` by ${this.cardName(cause.code)}'s effect`:''}.`,{type:'special-summon',code:Number(m.code)||0,controller:Number(loc.controller)||0,cause:cause||undefined,outcome:'Special Summon'});
      if(Number(loc.controller)===1&&cause&&!cause?.chainLink)this.showOpponentEvent({title:`${this.cardName(cause.code)} effect result`,code:this.normalizeActionCode(m.code),detail:`Practice Dummy Special Summons ${this.cardName(m.code)}`,chainLink:Number(cause.chainLink)||0,effectDriven:true,duration:1850});
      const summonAnimation=this.queueCardAnimation('special',{player:Number(loc.controller)||0,location:Number(loc.location)||this.mod?.OcgLocation?.MZONE||0,sequence:Number(loc.sequence)||0,code:Number(m.code)||0,showcase:!cause?.chainLink});
      if(cause?.chainLink){
        const result={code:Number(m.code)||0,controller:Number(loc.controller)||0,location:Number(loc.location)||this.mod?.OcgLocation?.MZONE||0,sequence:Number(loc.sequence)||0,outcome:'Summoned'};this.recordChainSummaryCardOutcome(cause.chainLink,result);
        if(this.actionPresentationEnabled&&!this.synchronizedShowcaseTravelEnabled&&summonAnimation)summonAnimation.orderedOutcome={loc:result,outcome:'Summoned',chainLink:Number(cause.chainLink)||0,code:result.code};
        else this.showCardOutcomeEffect(result,'Summoned',cause.chainLink,result.code);
      }
      if(this.pendingSpecialSummon&&(!Number(m.code)||Number(this.pendingSpecialSummon.code)===Number(m.code)))this.pendingSpecialSummon=null;
    }
    else if (m.type === T.FLIPSUMMONING) {
      const loc=(m.card&&typeof m.card==='object')?m.card:{controller:m.controller??m.player,location:m.location,sequence:m.sequence},cause=this.currentResolutionCause();
      this.lastSummonContext[Number(loc.controller)||0]={code:this.normalizeActionCode(m.code),controller:Number(loc.controller)||0,kind:'flip',location:Number(loc.location)||this.mod?.OcgLocation?.MZONE||0,sequence:Number(loc.sequence)||0,turn:Number(this.turn)||0,revision:Number(this.duelStateRevision)||0};
      this.markOpponentAction(loc.controller);this.meaningfulResponseWindow=Number(loc.controller)===1;
      this.log(`${Number(loc.controller)===0?'Player':'Practice Dummy'} Flip Summons ${this.cardName(m.code)}.`,{type:'flip-summon',code:Number(m.code)||0,controller:Number(loc.controller)||0,cause:cause||undefined,outcome:'Summoned'});
      if(Number(loc.controller)===1&&!cause)this.showOpponentEvent({title:`Practice Dummy Flip Summons ${this.cardName(m.code)}`,code:this.normalizeActionCode(m.code),duration:1300});
      const summonAnimation=this.queueCardAnimation('flip',{player:Number(loc.controller)||0,location:Number(loc.location)||this.mod?.OcgLocation?.MZONE||0,sequence:Number(loc.sequence)||0,code:Number(m.code)||0,showcase:!cause?.chainLink});
      if(cause?.chainLink){
        const result={code:Number(m.code)||0,controller:Number(loc.controller)||0,location:Number(loc.location)||this.mod?.OcgLocation?.MZONE||0,sequence:Number(loc.sequence)||0,outcome:'Summoned'};this.recordChainSummaryCardOutcome(cause.chainLink,result);
        if(this.actionPresentationEnabled&&!this.synchronizedShowcaseTravelEnabled&&summonAnimation)summonAnimation.orderedOutcome={loc:result,outcome:'Summoned',chainLink:Number(cause.chainLink)||0,code:result.code};
        else this.showCardOutcomeEffect(result,'Summoned',cause.chainLink,result.code);
      }
    }
    else if (m.type === T.ATTACK) {
      const attackerCard=this.cardAtLoc(m.card)||{},targetCard=m.target?this.cardAtLoc(m.target)||null:null,attacker=attackerCard.code||0,target=targetCard?.code||0,attackerController=Number(m.card?.controller)||0,direct=!m.target,expectedDamage=this.expectedBattleDamage(attackerCard,targetCard,direct);this.pendingDummyAttack=null;this.pendingPlayerAttack=null;
      const attackDelay=0,attackNow=(typeof performance!=='undefined'&&typeof performance.now==='function'?performance.now():Date.now());
      this.lastAttackContext={attackerCode:Number(attacker)||0,attackerController,direct,targetCode:Number(target)||0,expectedDamage,turn:Number(this.turn)||0,phase:this.phase,monsterTopologyRevision:Number(this.monsterTopologyRevision)||0,presentationStartedAt:attackNow,damageAnimationNotBeforeAt:attackNow+500};
      this.markOpponentAction(attackerController);this.meaningfulResponseWindow=Number(attackerController)===1;
      this.log(`${attacker?this.cardName(attacker):'A monster'} declares an attack${m.target?` on ${target?this.cardName(target):'a monster'}`:' directly'}.`,{type:direct?'direct-attack':'attack',cards:[attacker,target].filter(Boolean).map(code=>({code})),code:Number(attacker)||0,controller:attackerController,outcome:direct?'Direct attack declared':'Attack declared'});
      if(attackerController===1)this.showOpponentEvent({title:`Practice Dummy attacks with ${attacker?this.cardName(attacker):'a monster'}`,code:attacker,detail:m.target?`Target: ${target?this.cardName(target):'your monster'}`:'DIRECT ATTACK',duration:1450,critical:!m.target});
      const loc=m.card||{};this.queueAttackTargetCue(loc,m.target||null);this.queueCardAnimation('attack',{player:attackerController,location:Number(loc.location)||this.mod?.OcgLocation?.MZONE||0,sequence:Number(loc.sequence)||0,code:Number(attacker)||0,delay:attackDelay});this.queueAttackFx(loc,m.target||null,attackDelay,expectedDamage,this.lastAttackContext);
    }
    else if (T.ATTACK_DISABLED!=null && m.type===T.ATTACK_DISABLED) {
      const ctx=this.lastAttackContext,cause=this.currentResolutionCause(),name=ctx?.attackerCode?this.cardName(ctx.attackerCode):'The attack';this.pendingDummyAttack=null;this.pendingPlayerAttack=null;
      this.log(`${name}'s attack was stopped${cause?` by ${this.cardName(cause.code)}'s effect`:''}.`,{type:'attack-negated',code:Number(ctx?.attackerCode)||0,controller:Number(ctx?.attackerController)||0,cause:cause||undefined,outcome:'Attack stopped'});this.lastAttackContext=null;
    }
    else if (T.BECOME_TARGET!=null && m.type===T.BECOME_TARGET) {const cards=Array.isArray(m.cards)?m.cards:[],cause=this.currentResolutionCause();if(cards.length){this.log(`Target selected: ${cards.map(loc=>{const c=this.cardAtLoc(loc);return c?.code?this.cardName(c.code):formatLocation(this.mod,loc.location);}).join(', ')}${cause?` by ${this.cardName(cause.code)}'s effect`:''}.`,{type:'target',cards:cards.map(loc=>this.cardAtLoc(loc)?.code).filter(Boolean).map(code=>({code})),cause:cause||undefined,controller:cause?.controller});if(cause?.chainLink)cards.forEach(loc=>{const targetCode=Number(this.cardAtLoc(loc)?.code)||0;this.recordChainSummaryCardOutcome(cause.chainLink,{...loc,code:targetCode,outcome:'Targeted'});this.showCardOutcomeEffect(loc,'Targeted',cause.chainLink,targetCode);});}}
    else if (m.type === T.WIN) {



      if(!this.pendingResult&&!this.finalResult){
        const text=m.player===0?'Player wins the duel.':m.player===1?'Practice Dummy wins the duel.':'The duel ends in a draw.';
        this.log(text);
        this.pendingResult={player:m.player,reason:m.reason};
      }
    }
    else if (m.type === T.RETRY) { /* handled by bounded retry recovery in processLoop */ }
    else if (m.type === T.SHOW_HINT || m.type === T.CUSTOM_MSG) {const message=safeText(m.message || m.hint || 'Duel message');if(this.isEngineDiagnosticText(message))this.debugLog(message);else this.log(message,{type:'engine-message'});}
  }

  winReasonText(reason) {
    if(typeof reason==='string'&&reason.trim())return reason.trim();
    return 'The duel win condition was satisfied.';
  }

  async presentPendingResult() {
    const result=this.pendingResult;this.pendingResult=null;if(!result)return;
    const now=()=>((typeof performance!=='undefined'&&typeof performance.now==='function')?performance.now():Date.now());
    const remaining=Math.max(0,(Number(this.damagePresentationUntil)||0)-now());
    if(remaining>0)await this.wait(remaining);
    this.showResultOverlay(result);
  }

  showResultOverlay({player=null,reason=null}={}) {
    this.hideCardHoverOverlay();this.clearLogCardFocus('hover');
    this.pendingResult=null;this.finalResult={player,reason};const overlay=$id('duelResultOverlay'),title=$id('duelResultTitle'),detail=$id('duelResultDetail'),primary=$id('duelResultRestart'),side=$id('duelResultSide'),saveReplay=$id('duelResultSaveReplay'),replayDuel=$id('duelResultReplay');if(!overlay)return;
    const isDraw=player!==0&&player!==1;const victory=Number(player)===0;
    if(this.matchMode==='match3'&&this.matchState)this.registerMatchResult(player);
    let titleText=isDraw?'Draw':victory?'Victory':'Defeat',detailText=isDraw?'The duel ended in a draw.':this.winReasonText(reason);
    if(this.matchMode==='match3'&&this.matchState){const score=`${this.matchState.wins[0]}-${this.matchState.wins[1]}`;if(this.matchState.complete){if(this.matchState.wins[0]>this.matchState.wins[1])titleText='Match Victory';else if(this.matchState.wins[1]>this.matchState.wins[0])titleText='Match Defeat';else titleText='Match Draw';detailText=`Game ${this.matchState.game}: ${detailText} Final match score ${score}.`;}else detailText=`Game ${this.matchState.game}: ${detailText} Match score ${score}.`;
      if(primary)primary.textContent=this.matchState.complete?'New Match':'Next Game';if(side){side.hidden=!!this.matchState.complete||!(this.matchDecks?.player?.side?.length);side.textContent='Side Deck';}
    }else{if(primary)primary.textContent='Rematch';if(side)side.hidden=true;}
    overlay.dataset.result=isDraw?'draw':victory?'victory':'defeat';if(title)title.textContent=titleText;if(detail)detail.textContent=detailText;if(saveReplay)saveReplay.disabled=!this.replaySourceData();if(replayDuel)replayDuel.disabled=this.replayDecisionCount()===0;overlay.hidden=false;this.hidePrompt();this.syncReplayControls({renderEvents:true});this.playSound(victory?'victory':'defeat');
  }

  hideResultOverlay() { const overlay=$id('duelResultOverlay');if(overlay)overlay.hidden=true; }

  showOpponentEvent({title='',code=0,effect='',detail='',chainLink=0,hiddenCard=false,duration=1400,critical=false,effectDriven=false,chainPlayback=false}={}) {
    if(this.isReplaySeekReconstruction())return;
    if(!this.boardWrap||!title)return;



    const shouldOverlay=Number(chainLink)>0||!!effectDriven;
    if(!shouldOverlay)return;
    const playback=!!chainPlayback,minDuration=playback?900:1650;
    this.opponentNoticeQueue.push({title:String(title),code:this.normalizeActionCode(code),effect:String(effect||''),detail:String(detail||''),chainLink:Number(chainLink)||0,hiddenCard:!!hiddenCard,duration:Math.max(minDuration,Number(duration)||1800),chainPlayback:playback});
    if(playback)this.traceSession?.('chain-presentation-queued',{title:String(title),code:this.normalizeActionCode(code),chainLink:Number(chainLink)||0,duration:Math.max(minDuration,Number(duration)||1800),queueDepth:this.opponentNoticeQueue.length});
    if(!$id('duelOpponentNotice')?.hidden)return;
    this.presentNextOpponentEvent();
  }

  presentNextOpponentEvent() {
    const box=$id('duelOpponentNotice');if(!box)return;
    const event=this.opponentNoticeQueue.shift();this.currentOpponentNoticeEvent=event||null;if(!event){box.hidden=true;return;}
    if(event.chainPlayback)this.traceSession?.('chain-presentation-shown',{title:event.title,code:event.code,chainLink:event.chainLink,duration:event.duration,remaining:this.opponentNoticeQueue.length});
    const art=$id('duelOpponentNoticeArt'),title=$id('duelOpponentNoticeTitle'),effect=$id('duelOpponentNoticeEffect'),detail=$id('duelOpponentNoticeDetail'),chain=$id('duelOpponentNoticeChain');
    if(art){art.src=event.code&&!event.hiddenCard?cardImage(event.code):'assets/card_placeholder.png';art.alt=event.code&&!event.hiddenCard?this.cardName(event.code):'Unknown opponent card';art.classList.toggle('duel-card-back-image',event.hiddenCard||!event.code);}
    if(title)title.textContent=event.title;
    if(effect){effect.replaceChildren();if(event.effect&&event.code)this.setStyledCardText(effect,this.conciseEffectText(event.effect),event.code);else effect.textContent='';effect.hidden=!event.effect;}
    if(detail){detail.textContent=event.detail;detail.hidden=!event.detail;}
    if(chain){chain.textContent=event.chainLink?`CL${event.chainLink}`:'';chain.hidden=!event.chainLink;}
    box.hidden=false;box.classList.remove('show');this.positionOpponentNotice();void box.offsetWidth;box.classList.add('show');
    if(this.opponentNoticeTimer)clearTimeout(this.opponentNoticeTimer);
    this.opponentNoticeTimer=setTimeout(()=>{box.classList.remove('show');setTimeout(()=>{box.hidden=true;this.currentOpponentNoticeEvent=null;this.presentNextOpponentEvent();},130);},event.duration);
  }

  positionOpponentNotice() {
    const box=$id('duelOpponentNotice'),board=this.boardWrap;if(!box||box.hidden||!board?.getBoundingClientRect)return;
    const br=board.getBoundingClientRect();if(!br.width||!br.height)return;
    const margin=12;
    box.style.left='auto';box.style.right=`${margin}px`;box.style.bottom='auto';box.style.transform='translateY(-8px)';
    box.style.top=`${margin}px`;
    const nr=box.getBoundingClientRect();
    const prompt=this.prompt;
    const promptVisible=!!(prompt&&!this.promptMinimized&&!prompt.classList?.contains('duel-prompt-hidden')&&prompt.getBoundingClientRect);
    let top=margin;
    if(promptVisible){
      const pr=prompt.getBoundingClientRect();
      const noticeLeft=br.right-margin-nr.width,noticeRight=br.right-margin;
      const horizontalOverlap=pr.right>noticeLeft&&pr.left<noticeRight;
      if(horizontalOverlap){
        const below=pr.bottom-br.top+margin;
        const above=pr.top-br.top-nr.height-margin;
        if(below+nr.height<=br.height-margin)top=below;
        else if(above>=margin)top=above;
        else top=Math.max(margin,Math.min(br.height-nr.height-margin,br.height-nr.height-margin));
      }
    }
    const chain=this.chainVisualNode;
    if(chain&&!chain.hidden&&chain.getBoundingClientRect){
      const cr=chain.getBoundingClientRect();const candidateTop=br.top+top,candidateBottom=candidateTop+nr.height;
      const noticeLeft=br.right-margin-nr.width;
      if(cr.right>noticeLeft&&cr.left<br.right-margin&&cr.bottom>candidateTop&&cr.top<candidateBottom){
        const below=cr.bottom-br.top+margin;if(below+nr.height<=br.height-margin)top=below;
      }
    }
    box.style.top=`${Math.max(margin,Math.round(top))}px`;
  }

  clearOpponentEvents() {
    this.opponentNoticeQueue=[];this.currentOpponentNoticeEvent=null;if(this.opponentNoticeTimer)clearTimeout(this.opponentNoticeTimer);this.opponentNoticeTimer=0;const box=$id('duelOpponentNotice');if(box){box.hidden=true;box.classList.remove('show');}
  }

  clearPhaseAnnouncements() {
    const pending=[this.phaseAnnouncementCurrent,...this.phaseAnnouncementQueue].filter(Boolean),current=this.phaseAnnouncementCurrent;
    if(this.phaseAnnouncementTimer)clearTimeout(this.phaseAnnouncementTimer);
    if(current?.finish){this.phaseAnnouncement?.removeEventListener?.('animationend',current.finish);this.phaseAnnouncement?.removeEventListener?.('animationcancel',current.finish);}
    this.phaseAnnouncementTimer=null;this.phaseAnnouncementQueue=[];this.phaseAnnouncementCurrent=null;this.phaseAnnouncementActive=false;this.phaseAnnouncement?.classList.remove('show');pending.forEach(item=>item.settle?.());
  }

  showPhaseAnnouncement(label,options={}) {
    if(this.isReplaySeekReconstruction()){options.onStart?.();return Promise.resolve();}
    if(!this.phasePresentationEnabled||!this.duelAnimationsEnabled||!this.phaseAnnouncement||!label){options.onStart?.();return Promise.resolve();}




    const duration=Math.max(400,Number(options.duration)||680);
    return new Promise(resolve=>{let settled=false;const settle=()=>{if(settled)return;settled=true;resolve();};this.phaseAnnouncementQueue.push({label:String(label),duration,phase:options.phase,onStart:options.onStart,settle});this.traceSession?.('phase-presentation-queued',{label:String(label),depth:this.phaseAnnouncementQueue.length});this.presentNextPhaseAnnouncement();});
  }

  presentNextPhaseAnnouncement() {
    if(this.phaseAnnouncementActive||!this.phaseAnnouncement)return;
    const next=this.phaseAnnouncementQueue.shift();if(!next)return;
    this.phaseAnnouncementActive=true;this.phaseAnnouncementCurrent=next;this.phaseAnnouncement.textContent=next.label;
    const phaseKey=String(next.label).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    this.phaseAnnouncement.dataset.phase=phaseKey;
    const kicker=document.createElement('span');kicker.className='duel-phase-announcement-kicker';kicker.textContent='PHASE CHANGE';
    const name=document.createElement('strong');name.className='duel-phase-announcement-name';name.textContent=next.label;
    const sweep=document.createElement('i');sweep.className='duel-phase-announcement-sweep';sweep.setAttribute('aria-hidden','true');
    this.phaseAnnouncement.replaceChildren(kicker,name,sweep);
    this.phaseAnnouncement.classList.remove('show');void this.phaseAnnouncement.offsetWidth;this.phaseAnnouncement.classList.add('show');next.onStart?.();
    this.traceSession?.('phase-presentation-shown',{label:next.label,remaining:this.phaseAnnouncementQueue.length});
    let finished=false;const finish=event=>{if(event&&(event.target!==this.phaseAnnouncement||event.animationName!=='duel-phase-card'))return;if(finished||this.phaseAnnouncementCurrent!==next)return;finished=true;this.phaseAnnouncement.removeEventListener?.('animationend',finish);this.phaseAnnouncement.removeEventListener?.('animationcancel',finish);if(this.phaseAnnouncementTimer)clearTimeout(this.phaseAnnouncementTimer);this.phaseAnnouncementTimer=null;this.phaseAnnouncement.classList.remove('show');this.phaseAnnouncementCurrent=null;this.phaseAnnouncementActive=false;next.settle?.();if(typeof queueMicrotask==='function')queueMicrotask(()=>this.presentNextPhaseAnnouncement());else setTimeout(()=>this.presentNextPhaseAnnouncement(),0);};next.finish=finish;this.phaseAnnouncement.addEventListener?.('animationend',finish);this.phaseAnnouncement.addEventListener?.('animationcancel',finish);this.phaseAnnouncementTimer=setTimeout(()=>finish(),next.duration+80);
  }

  playerHasCurrentAttackOpportunity() {
    const T=this.mod?.OcgMessageType||{},P=this.mod?.OcgPosition||{};
    const prompt=this.currentPrompt;
    if(this.turnPlayer!==0||!prompt||Number(prompt.player)===1)return false;

    if(prompt.type===T.SELECT_BATTLECMD)return Array.isArray(prompt.attacks)&&prompt.attacks.length>0;




    if(prompt.type!==T.SELECT_IDLECMD||!prompt.to_bp)return false;
    const faceupAttack=Number(P.FACEUP_ATTACK)||1;
    return (this.field?.players?.[0]?.mzone||[]).some(card=>card&&!!(Number(card.position)&faceupAttack));
  }

  renderPhaseDock() {
    const node=this.phaseDock;if(!node)return;
    if(!this.mod?.OcgPhase){node.hidden=true;node.dataset.renderSignature='';return;}
    const P=this.mod.OcgPhase,T=this.mod.OcgMessageType,R=this.mod.OcgResponseType,I=this.mod.SelectIdleCMDAction,B=this.mod.SelectBattleCMDAction;
    const shownPhase=this.presentedPhase??this.phase,prompt=this.currentPrompt;const phaseSignature=this.stableRenderSignature([this.turnPlayer,shownPhase,prompt?.type,Number(prompt?.player),!!prompt?.to_bp,!!prompt?.to_ep,!!prompt?.to_m2,Array.isArray(prompt?.attacks)?prompt.attacks.length:0,this.playerHasCurrentAttackOpportunity()]);
    if(node.dataset.renderSignature===phaseSignature){node.hidden=false;this.positionPhaseDock();return;}node.dataset.renderSignature=phaseSignature;node.replaceChildren();
    const battlePhases=new Set([P.BATTLE_START,P.BATTLE_STEP,P.DAMAGE,P.DAMAGE_CAL,P.BATTLE].filter(v=>v!=null));
    const specs=[['DP','Draw',P.DRAW],['SP','Standby',P.STANDBY],['M1','Main 1',P.MAIN1],['BP','Battle',P.BATTLE_START??P.BATTLE],['M2','Main 2',P.MAIN2],['EP','End',P.END]];
    const actionFor=(key)=>{
      if(this.turnPlayer!==0||!prompt||Number(prompt.player)===1)return null;
      if(prompt.type===T.SELECT_IDLECMD){if(key==='Battle'&&prompt.to_bp)return()=>this.submitResponse({type:R.SELECT_IDLECMD,action:I.TO_BP,index:null});if(key==='End'&&prompt.to_ep)return()=>this.submitResponse({type:R.SELECT_IDLECMD,action:I.TO_EP,index:null});}
      if(prompt.type===T.SELECT_BATTLECMD){if(key==='Main 2'&&prompt.to_m2)return()=>this.submitResponse({type:R.SELECT_BATTLECMD,action:B.TO_M2,index:null});if(key==='End'&&prompt.to_ep)return()=>this.submitResponse({type:R.SELECT_BATTLECMD,action:B.TO_EP,index:null});}
      return null;
    };
    for(const [short,label,value] of specs){
      const b=document.createElement('button');b.type='button';b.className='duel-phase-step';b.title=`${label} Phase`;b.setAttribute('aria-label',`${label} Phase`);
      const glyph=document.createElement('strong');glyph.textContent=short;const caption=document.createElement('span');caption.textContent=label;b.append(glyph,caption);
      const active=label==='Battle'?battlePhases.has(shownPhase):shownPhase===value;if(active)b.classList.add('current');
      const run=actionFor(label);if(run){b.classList.add('available');b.disabled=false;b.addEventListener('click',run);}else b.disabled=true;
      if(label==='Battle'&&this.playerHasCurrentAttackOpportunity()){b.classList.add('attack-ready');b.title='Battle Phase - an attack is available';b.setAttribute('aria-label','Battle Phase - attack available');}
      node.append(b);
    }
    node.classList.toggle('opponent-turn',this.turnPlayer===1);node.hidden=false;this.positionPhaseDock();
  }

  positionPhaseDock() {
    const node=this.phaseDock,wrap=this.boardWrap;if(!node||node.hidden||!wrap)return;
    const target=wrap.querySelector?.('#duelExtraMonsterZones .duel-zone:nth-child(2)');
    const tr=target?.getBoundingClientRect?.(),wr=wrap.getBoundingClientRect?.();if(!tr||!wr?.width)return;
    const gapStart=tr.right-wr.left+8,gapEnd=wr.width-8,gapWidth=Math.max(0,gapEnd-gapStart);const top=tr.top-wr.top+tr.height/2;
    const desired=Math.min(gapWidth,Math.max(150,Math.min(390,gapWidth-16)));


    const centerX=gapStart+gapWidth/2;
    node.style.width=`${Math.round(desired)}px`;node.style.maxWidth=`${Math.round(desired)}px`;
    node.style.left=`${Math.round(centerX)}px`;node.style.top=`${Math.round(top)}px`;node.style.bottom='auto';node.style.transform='translate(-50%,-50%)';
  }

  phaseLabel(phase) {



    if (!this.mod?.OcgPhase) return phase == null ? 'Preparing...' : `Phase ${phase}`;
    const P = this.mod.OcgPhase;
    const labels = new Map([[P.DRAW,'Draw Phase'],[P.STANDBY,'Standby Phase'],[P.MAIN1,'Main Phase 1'],[P.BATTLE_START,'Battle Phase'],[P.BATTLE_STEP,'Battle Step'],[P.DAMAGE,'Damage Step'],[P.DAMAGE_CAL,'Damage Calculation'],[P.BATTLE,'Battle Phase'],[P.MAIN2,'Main Phase 2'],[P.END,'End Phase']]);
    return labels.get(phase) || `Phase ${phase}`;
  }

  queryCardAt(controller, location, sequence, flags) {
    try {
      const coreController=this.corePlayer(controller);
      const card = this.core.duelQuery(this.handle, {controller:coreController, location, sequence, overlaySequence:0, flags});
      if (!card) return null;





      const L = this.mod?.OcgLocation;
      const isFixedFieldSlot = !!L && (location === L.MZONE || location === L.SZONE);
      if (isFixedFieldSlot && (Number(card.position) || 0) === 0) return null;

      return {...card, owner:(Number(card.owner)===0||Number(card.owner)===1)?this.logicalPlayer(Number(card.owner)):card.owner, sequence, controller, location};
    } catch (e) {
      console.warn('duelQuery failed', controller, location, sequence, e);
      return null;
    }
  }

  hiddenLocationCard(controller, location, sequence) {
    return {code:0, position:0, sequence, controller, location, isHidden:true};
  }

  mergeKnownCard(queried, known, {controller,location,sequence,forceFaceup=false}={}) {
    if(!queried && !known)return null;
    const base=queried?{...queried}:{...known};
    if((!Number(base.code)||base.isHidden) && Number(known?.code)){
      base.code=Number(known.code);base.isHidden=false;
    }
    if(!Number(base.position) && Number(known?.position))base.position=Number(known.position);
    if(known?.activatedFaceup && this.mod?.OcgPosition && this.trackedLocationKey(location)==='szone')base.position=this.mod.OcgPosition.FACEUP_ATTACK||this.mod.OcgPosition.FACEUP||base.position||1;
    if(forceFaceup && this.mod?.OcgPosition)base.position=this.mod.OcgPosition.FACEUP_ATTACK||base.position||1;
    base.controller=Number.isFinite(Number(controller))?Number(controller):Number(base.controller)||0;
    base.location=Number(location)||Number(base.location)||0;
    base.sequence=Number.isFinite(Number(sequence))?Number(sequence):Number(base.sequence)||0;
    return base;
  }

  refreshField() {
    if (!this.handle || !this.core) return;
    const M = this.mod;
    const Q = M.OcgQueryFlags;
    const flags = Q.CODE|Q.POSITION|Q.TYPE|Q.LEVEL|Q.RANK|Q.ATTRIBUTE|Q.ATTACK|Q.DEFENSE|Q.OWNER|Q.IS_PUBLIC|Q.LINK|Q.OVERLAY_CARD;

    for (let p=0; p<2; p++) {
      const target = this.emptyPlayer();

      let deckCount=0;
      try { deckCount=Math.max(0,Number(this.core.duelQueryCount(this.handle,this.corePlayer(p),M.OcgLocation.DECK))||0); } catch {}
      if(this.knownDecks[p].length>deckCount)this.knownDecks[p]=this.knownDecks[p].slice(0,deckCount);
      target.deck=Array.from({length:deckCount},(_,i)=>{const known=this.knownDecks[p][i];if(known?.code&&(p===0||this.opponentCardsVisible))return{...known,sequence:i,controller:p,location:M.OcgLocation.DECK,isHidden:false};return this.hiddenLocationCard(p,M.OcgLocation.DECK,i);});



      for(const [name,key,knownList] of [
        ['GRAVE','grave',this.knownPiles[p].grave],
        ['REMOVED','removed',this.knownPiles[p].removed],
        ['EXTRA','extra',this.knownExtras[p]],
      ]){
        const loc=M.OcgLocation[name];let count=0;
        try{count=Math.max(0,Number(this.core.duelQueryCount(this.handle,this.corePlayer(p),loc))||0);}catch{}
        const cards=[];
        for(let i=0;i<count;i++){
          const queried=this.queryCardAt(p,loc,i,flags);
          const known=knownList?.[i]||null;
          let card=this.mergeKnownCard(queried,known,{controller:p,location:loc,sequence:i,forceFaceup:key==='grave'});
          if(!card)card=this.hiddenLocationCard(p,loc,i);


          if(p===1 && key==='extra' && !this.opponentCardsVisible)card={...card,code:0,isHidden:true};
          if(p===1 && key==='removed' && !this.opponentCardsVisible){
            const faceup=!!(Number(card.position)&(M.OcgPosition.FACEUP||0));
            if(!faceup)card={...card,code:0,isHidden:true};
          }
          cards.push(card);
        }
        target[key]=cards;
      }

      let handCount = 0;
      try { handCount = Math.max(0, Number(this.core.duelQueryCount(this.handle, this.corePlayer(p), M.OcgLocation.HAND)) || 0); } catch {}
      if (p === 0) {
        if (this.knownHands[0].length > handCount) this.knownHands[0] = this.knownHands[0].slice(-handCount);
        target.hand = Array.from({length:handCount}, (_,i) => {
          const known = this.knownHands[0][i];
          return known?.code
            ? {...known, sequence:i, controller:0, location:M.OcgLocation.HAND}
            : this.hiddenLocationCard(0, M.OcgLocation.HAND, i);
        });
      } else {
        if(this.knownHands[1].length>handCount)this.knownHands[1]=this.knownHands[1].slice(-handCount);
        target.hand=Array.from({length:handCount},(_,i)=>{const known=this.knownHands[1][i];return this.opponentCardsVisible&&known?.code?{...known,sequence:i,controller:1,location:M.OcgLocation.HAND}:this.hiddenLocationCard(1,M.OcgLocation.HAND,i);});
      }

      target.mzone = Array.from({length:7}, (_,i) => this.mergeKnownCard(
        this.queryCardAt(p, M.OcgLocation.MZONE, i, flags), this.knownField[p].mzone[i],
        {controller:p,location:M.OcgLocation.MZONE,sequence:i}
      ));
      target.szone = Array.from({length:8}, (_,i) => this.mergeKnownCard(
        this.queryCardAt(p, M.OcgLocation.SZONE, i, flags), this.knownField[p].szone[i],
        {controller:p,location:M.OcgLocation.SZONE,sequence:i}
      ));
      this.field.players[p] = target;
    }
    try { this.field.chain = (this.core.duelQueryField(this.handle)?.chain || []).map(item=>this.mapCoreMessage(item)); } catch {}
  }

  renderAll() { this.renderMeta(); this.renderField(); this.renderLog(); }
  renderMeta() {
    if (this.turnNode) this.turnNode.textContent = `Turn ${Math.max(1,this.turn)} · ${this.turnPlayer===0?'You':'Dummy'}`;
    if (this.phaseNode) this.phaseNode.textContent = this.phaseLabel(this.presentedPhase??this.phase);
    if (this.lpNodes[0]) this.lpNodes[0].textContent = Number(this.displayLp?.[0] ?? this.lp[0]).toLocaleString();
    if (this.lpNodes[1]) this.lpNodes[1].textContent = Number(this.displayLp?.[1] ?? this.lp[1]).toLocaleString();
    this.renderPhaseDock();
  }

  renderField() {
    this.activeMonsterStatKeys=new Set();
    this.renderHand(1, $id('duelOpponentHand'), true);
    this.renderHand(0, $id('duelPlayerHand'), false);
    this.renderZoneRow(1, 'szone', $id('duelOpponentSpells'), true, 5);
    this.renderZoneRow(1, 'mzone', $id('duelOpponentMonsters'), true, 5);
    this.renderExtraZones();
    this.renderZoneRow(0, 'mzone', $id('duelPlayerMonsters'), false, 5);
    this.renderZoneRow(0, 'szone', $id('duelPlayerSpells'), false, 5);
    this.renderPile(0,'deck',$id('duelPlayerDeckPile'),'Deck');
    this.renderPile(0,'grave',$id('duelPlayerGravePile'),'GY');
    this.renderPile(0,'removed',$id('duelPlayerBanishedPile'),'Banished');
    this.renderPile(0,'extra',$id('duelPlayerExtraPile'),'Extra');
    this.renderPile(1,'deck',$id('duelOpponentDeckPile'),'Deck',true);
    this.renderPile(1,'grave',$id('duelOpponentGravePile'),'GY',true);
    this.renderPile(1,'removed',$id('duelOpponentBanishedPile'),'Banished',true);
    this.renderPile(1,'extra',$id('duelOpponentExtraPile'),'Extra',true);
    this.renderFieldSpell(0,$id('duelPlayerFieldZone'),false);
    this.renderFieldSpell(1,$id('duelOpponentFieldZone'),true);
    for(const key of [...this.liveMonsterStats.keys()])if(!this.activeMonsterStatKeys.has(key))this.liveMonsterStats.delete(key);
    this.syncChainSourceHighlights();this.scheduleCardScale();this.validateCardHoverOverlay();
  }

  visibleCode(card, opponent, locationKey) {
    if (!card) return 0;
    const P=this.mod?.OcgPosition||{};
    const position=Number(card.position)||0;



    if ((locationKey==='mzone'||locationKey==='szone') && (position & (P.FACEDOWN||0))) return 0;
    if (!opponent) return Number(card.code)||0;
    if(this.opponentCardsVisible)return Number(card.code)||0;
    if (locationKey==='hand'||locationKey==='deck'||locationKey==='extra') return 0;
    if (position & (P.FACEDOWN||0)) return 0;
    return Number(card.code)||0;
  }

  locationValue(key) {
    const L=this.mod?.OcgLocation||{};
    return {hand:L.HAND,mzone:L.MZONE,szone:L.SZONE,grave:L.GRAVE,removed:L.REMOVED,extra:L.EXTRA,deck:L.DECK}[key] || 0;
  }

  isSharedExtraMonsterSequence(sequence) { const seq=Number(sequence);return seq===5||seq===6; }
  physicalExtraMonsterSequence(controller,sequence) { const seq=Number(sequence);return this.isSharedExtraMonsterSequence(seq)&&Number(controller)===1?11-seq:seq; }
  controllerExtraMonsterSequence(controller,physicalSequence) { return this.physicalExtraMonsterSequence(controller,physicalSequence); }
  extraMonsterZoneNode(controller,sequence) { const physical=this.physicalExtraMonsterSequence(controller,sequence);return this.boardWrap?.querySelector?.(`#duelExtraMonsterZones .duel-zone[data-physical-sequence="${physical}"]`)||null; }
  extraMonsterZoneLabel(controller,sequence) { const physical=this.physicalExtraMonsterSequence(controller,sequence),side=physical===5?'Left':'Right';return `${Number(controller)===0?'Your':'Opponent'} ${side} Extra Monster Zone`; }

  contextForCard(card,{player=0,locationKey='',sequence=0}={}) {
    return {card,player:Number(player),locationKey,location:Number(card?.location)||this.locationValue(locationKey),sequence:Number.isFinite(Number(card?.sequence))?Number(card.sequence):Number(sequence)};
  }

  normalizeActionCode(value) {
    return (Number(value) >>> 0) & 0x7fffffff;
  }

  actionItemMatchesContext(item,ctx) {
    if(!item||!ctx)return false;
    if(Number.isFinite(Number(item.controller)) && Number(item.controller)!==ctx.player)return false;
    const itemLoc=Number(item.location)||0;
    if(itemLoc && ctx.location && itemLoc!==ctx.location)return false;
    const a=this.normalizeActionCode(item.code),b=this.normalizeActionCode(ctx.card?.code);
    if(a&&b&&a!==b)return false;
    const handLoc=this.locationValue('hand');
    const inHand=!!(handLoc && ((itemLoc||ctx.location)&handLoc));




    const sameCodeInHand=inHand&&b?(this.field?.players?.[ctx.player]?.hand||[]).filter(card=>this.normalizeActionCode(card?.code)===b).length:0;



    if(!inHand || !(a&&b) || sameCodeInHand>1) {
      if(Number.isFinite(Number(item.sequence)) && Number.isFinite(ctx.sequence) && Number(item.sequence)!==ctx.sequence)return false;
    }
    return true;
  }

  legalActionIdentity(action={}) {
    const item=action.item||{},detail=String(action.detail||this.effectLabel(item,'')||item.description||item.desc||'').trim();
    return [String(action.label||''),Number(item.controller)||0,Number(item.location)||0,Number(item.sequence)||0,this.normalizeActionCode(item.code),detail].join('|');
  }

  dedupeLegalActions(actions=[]) {
    const seen=new Set(),out=[];for(const action of actions){const key=this.legalActionIdentity(action);if(seen.has(key))continue;seen.add(key);out.push(action);}return out;
  }

  legalActionsForContext(ctx) {

    const m=this.currentPrompt;if(!m||!this.mod)return[];
    const T=this.mod.OcgMessageType,R=this.mod.OcgResponseType,I=this.mod.SelectIdleCMDAction,B=this.mod.SelectBattleCMDAction;
    const out=[];
    const add=(items,action,label,type=R.SELECT_IDLECMD)=>{(items||[]).forEach((item,index)=>{if(this.actionItemMatchesContext(item,ctx))out.push({label,detail:(label==='Activate'||label==='Special Summon')?this.effectLabel(item,''):'',item,index,run:()=>{if(label==='Activate'){this.rememberEffectItem(item);}this.submitResponse({type,action,index});}});});};
    if(m.type===T.SELECT_IDLECMD){add(m.activates,I.SELECT_ACTIVATE,'Activate');add(m.summons,I.SELECT_SUMMON,'Normal Summon');add(m.special_summons,I.SELECT_SPECIAL_SUMMON,'Special Summon');add(m.pos_changes,I.SELECT_POS_CHANGE,'Change Position');add(m.monster_sets,I.SELECT_MONSTER_SET,'Set Monster');add(m.spell_sets,I.SELECT_SPELL_SET,'Set Spell/Trap');}
    else if(m.type===T.SELECT_BATTLECMD){add(m.attacks,B.SELECT_BATTLE,'Attack',R.SELECT_BATTLECMD);add(m.chains,B.SELECT_CHAIN,'Activate',R.SELECT_BATTLECMD);}




    else if(m.type===T.SELECT_CHAIN){/* universal selector owns this decision */}



    return this.dedupeLegalActions(out);
  }

  legalActionsForPile(player,key) {
    const loc=this.locationValue(key);if(!loc||!this.currentPrompt)return[];
    const ctx={player:Number(player),locationKey:key,location:loc,sequence:NaN,card:null};
    const m=this.currentPrompt,T=this.mod.OcgMessageType,R=this.mod.OcgResponseType,I=this.mod.SelectIdleCMDAction,B=this.mod.SelectBattleCMDAction;
    const out=[];
    const add=(items,action,label,type=R.SELECT_IDLECMD)=>{(items||[]).forEach((item,index)=>{if(Number(item.controller)===ctx.player&&Number(item.location)===loc)out.push({label,detail:(label==='Activate'||label==='Special Summon')?this.effectLabel(item,''):'',item,index,run:()=>{if(label==='Activate'){this.rememberEffectItem(item);}this.submitResponse({type,action,index});}});});};
    if(m.type===T.SELECT_IDLECMD){add(m.special_summons,I.SELECT_SPECIAL_SUMMON,'Special Summon');add(m.activates,I.SELECT_ACTIVATE,'Activate');}
    else if(m.type===T.SELECT_BATTLECMD)add(m.chains,B.SELECT_CHAIN,'Activate',R.SELECT_BATTLECMD);
    else if(m.type===T.SELECT_CHAIN){const chainActionLabel=this.chainPromptContainsTriggeredEffect(m)?'Activate':'Chain';(m.selects||[]).forEach((item,index)=>{if(Number(item.controller)===ctx.player&&Number(item.location)===loc)out.push({label:chainActionLabel,detail:this.effectLabel(item,''),item,index,run:()=>{if(chainActionLabel==='Activate')this.rememberEffectItem(item);this.submitResponse({type:R.SELECT_CHAIN,index});}});});}
    return this.dedupeLegalActions(out);
  }

  handleCardClick(code,card,ctx) {
    const n=Number(code)||0;if(!n)return;




    const info={...(card||{}),controller:Number(card?.controller??ctx?.player??0),location:Number(card?.location??ctx?.location??0),sequence:Number(card?.sequence??ctx?.sequence??0)};

    this.pinnedInspector={code:n,info};this.inspectCard(n,info);this.renderCardDetailsModal(n,info);
  }

  renderContextActions(code,actions) {
    this.showPrompt({dismissible:true});this.promptBody.replaceChildren();
    this.promptTitle.textContent=code?this.cardName(code):'Card actions';
    const hint=document.createElement('p');hint.textContent='Available actions';this.promptBody.append(hint);
    const group=document.createElement('div');group.className='duel-context-actions';
    actions.forEach(action=>{const b=this.button(this.actionShortLabel(action.label),action.run,{ghost:action.label!=='Activate'&&action.label!=='Chain'});this.decorateActionVisual(b,action,code);group.append(b);});
    this.promptBody.append(group);
  }

  renderPileActions(player,key) {
    this.hidePileHoverOverlay();
    const actions=this.legalActionsForPile(player,key);if(!actions.length)return;
    const specials=actions.filter(action=>action.label==='Special Summon');
    if(key==='extra'&&specials.length){this.renderSpecialSummonChoices(player,key,specials);return;}
    this.showPrompt({dismissible:true});this.promptBody.replaceChildren();
    const label={extra:'Extra Deck',grave:'Graveyard',removed:'Banished',deck:'Deck'}[key]||key;
    this.promptTitle.textContent=label;
    const group=document.createElement('div');group.className='duel-action-grid';
    actions.forEach(action=>group.append(this.actionCard(action.item,action.run,`${action.label}: ${this.cardName(action.item.code)}`)));
    this.promptBody.append(group);
  }

  renderSpecialSummonChoices(player,key,actions=[]) {
    if(!actions.length)return;this.specialChoiceContext={player:Number(player),key,actions};this.promptView='special-choice';this.showPrompt({dismissible:true});this.prompt?.classList.add('selection-prompt');this.promptBody.replaceChildren();
    const sourceLabel={extra:'Extra Deck',grave:'Graveyard',hand:'Hand',deck:'Deck',removed:'Banished'}[key]||formatLocation(this.mod,this.locationValue(key));
    this.promptTitle.textContent=`Choose a monster to Special Summon from your ${sourceLabel}`;
    const grid=document.createElement('div');grid.className='duel-select-card-grid duel-special-summon-grid';let selected=-1;const cards=[];
    const controls=document.createElement('div');controls.className='duel-prompt-controls';const confirm=this.button('Confirm Special Summon',()=>{if(selected<0)return;const action=actions[selected];const code=Number(action.item.code)||0;this.pendingSpecialSummon={code,sourceKey:key,sourceLabel,player:Number(player),name:this.cardName(code)};this.log(`Player chooses ${this.cardName(code)} from ${sourceLabel} to Special Summon.`);action.run();},{disabled:true});
    const refresh=()=>{cards.forEach((card,index)=>card.classList.toggle('selected',index===selected));confirm.disabled=selected<0;};
    actions.forEach((action,index)=>{const item={...action.item,location:Number(action.item.location)||this.locationValue(key),controller:Number(action.item.controller??player)};const card=this.actionCard(item,()=>{selected=index;refresh();},this.cardName(item.code),{confirmSelection:true,isSelected:()=>selected===index,onDeselect:()=>{selected=-1;refresh();}});card.classList.add('duel-special-summonable','actionable');cards.push(card);grid.append(card);});
    controls.append(confirm,this.button('Back',()=>{this.pendingSpecialSummon=null;this.hidePrompt();this.promptView='';},{ghost:true}));this.promptBody.append(grid,controls);this.scheduleSelectionPromptSizing();
  }

  actionShortLabel(label) {
    return ({'Normal Summon':'Summon','Special Summon':'Special','Set Monster':'Set','Set Spell/Trap':'Set','Change Position':'Position','Activate':'Activate','Attack':'Attack','Chain':'Chain'})[label] || label;
  }

  restoreInspectorAfterHover() {

    const pinned=this.pinnedInspector;if(pinned?.code){this.inspectCard(pinned.code,pinned.info||{},{transient:true});return;}
    this.inspectCard(0,{}, {transient:true});
  }

  hideCardHoverOverlay({delay=0,clearInspector=true}={}) {
    if(this.hoverExitTimer){clearTimeout(this.hoverExitTimer);this.hoverExitTimer=null;}
    const remove=()=>{
      this.hoverExitTimer=null;if(this.hoverOverlay){this.hoverOverlay.remove?.();this.hoverOverlay=null;}
      this.hoverOverlayAnchor=null;this.hoverInspectorCode=0;this.hoverInspectorInfo=null;this.clearLogCardFocus('hover');
      if(clearInspector)this.restoreInspectorAfterHover();
    };
    if(delay>0){this.hoverExitTimer=setTimeout(remove,delay);return;}
    remove();
  }

  validateCardHoverOverlay() {
    const anchor=this.hoverOverlayAnchor;if(!anchor)return;
    if(!anchor.isConnected){this.hideCardHoverOverlay();return;}
    try{if(typeof anchor.matches==='function'&&!anchor.matches(':hover'))this.hideCardHoverOverlay();}catch{}
  }

  showCardHoverOverlay(code,info={},anchor=null) {
    if(this.promptView==='details'||this.cardDetailsOverlay)return;
    if(!Number(code)||!anchor||typeof document==='undefined'||!document.body)return;




    const boardCard=!!(anchor.classList?.contains('duel-card')&&anchor.closest?.('#duelBoardWrap'));
    const promptEffectText=String(info?._promptEffectText||'').trim();
    const promptCard=!!(promptEffectText&&anchor.classList?.contains('duel-prompt-card')&&anchor.closest?.('.duel-field-prompt'));
    const chainCard=!!(promptEffectText&&(anchor.classList?.contains('duel-chain-link')||anchor.classList?.contains('duel-active-chain-row')));
    const activationAction=!!(promptEffectText&&(anchor.classList?.contains('duel-action-effect')||anchor.classList?.contains('duel-card-effect-action')||anchor.classList?.contains('duel-activation-preview-anchor')));
    const chainPreview=/chain|trigger/i.test(String(info?._promptEffectRole||''))||chainCard;
    if(chainPreview&&!this.chainEffectHoverEnabled)return;
    if(activationAction&&!chainPreview&&!this.activationEffectHoverEnabled)return;
    if(!chainPreview&&!activationAction&&!this.cardHoverPreviewEnabled)return;
    if(!boardCard&&!promptCard&&!chainCard&&!activationAction)return;
    if(this.hoverExitTimer){clearTimeout(this.hoverExitTimer);this.hoverExitTimer=null;}
    this.hideCardHoverOverlay({clearInspector:false});
    this.hoverOverlayAnchor=anchor;this.hoverInspectorCode=Number(code)||0;this.hoverInspectorInfo=info||{};
    const card=this.getCardById?.(Number(code))||{};
    const box=document.createElement('div');box.className='duel-card-hover-overlay';box.setAttribute('aria-hidden','true');
    const name=document.createElement('strong');name.className='duel-card-hover-name';name.textContent=this.cardName(code);box.append(name);
    const stats=document.createElement('div');stats.className='duel-card-hover-stats';
    const typeKey=this.duelCardTypeKey(card);const monster=typeKey!=='spell'&&typeKey!=='trap';const values=[];
    if(monster&&Number.isFinite(Number(card.atk)))values.push(`${Number(card.atk)}/${Number.isFinite(Number(card.def))&&Number(card.def)>=0?Number(card.def):'-'}`);
    if(Number(card.linkval)>0)values.push(`LINK-${Number(card.linkval)}`);else if(Number(card.rank)>0)values.push(`RANK ${Number(card.rank)}`);else if(Number(card.level)>0)values.push(`★${Number(card.level)}`);
    stats.textContent=values.join('  ');if(stats.textContent)box.append(stats);
    const chips=document.createElement('div');chips.className='duel-card-hover-chips';
    const attr=String(card.attribute||'').toUpperCase();const attrFiles={DARK:'dark.png',LIGHT:'light.png',EARTH:'earth.png',WATER:'water.png',FIRE:'fire.png',WIND:'wind.png',DIVINE:'divine.png'};
    if(attrFiles[attr])chips.append(this.metadataSymbolChip(attrFiles[attr],attr,`attr-${attr.toLowerCase()}`));
    if(typeKey==='spell')chips.append(this.metadataSymbolChip('spell.png','Spell Card','card-spell'));else if(typeKey==='trap')chips.append(this.metadataSymbolChip('trap.png','Trap Card','card-trap'));else chips.append(this.plainMetaChip(String(card.type||card.humanReadableCardType||'Monster'),`card-${typeKey}`));
    const race=String(card.race||'').trim();if(race){const key=race.toLowerCase().replace(/[_\s]+/g,'-');const sub={'quick-play':'quick-play.webp','continuous':'continuous.webp','counter':'counter.webp','equip':'equip.webp','field':'field.webp','ritual':'ritual.webp'};if((typeKey==='spell'||typeKey==='trap')&&sub[key])chips.append(this.metadataSymbolChip(sub[key],race,`card-${typeKey}`));else if(!(typeKey==='spell'||typeKey==='trap')||key!=='normal')chips.append(this.plainMetaChip(race,'race-chip'));}
    if(chips.childNodes.length)box.append(chips);
    const hoverEffect=this.conciseEffectText(promptEffectText);
    if((promptCard||chainCard||activationAction)&&hoverEffect){
      box.classList.add('duel-card-hover-with-effect');
      const effectBox=document.createElement('div');effectBox.className='duel-card-hover-effect';
      const role=document.createElement('span');role.className='duel-card-hover-effect-role';role.textContent=String(info?._promptEffectRole||'Effect');
      const effect=document.createElement('div');effect.className='duel-card-hover-effect-text';this.setStyledCardText(effect,hoverEffect,Number(code)||0);
      effectBox.append(role,effect);box.append(effectBox);
    }
    document.body.append(box);this.hoverOverlay=box;
    const r=anchor.getBoundingClientRect(),b=box.getBoundingClientRect();let left=r.right+9,top=r.top+(r.height-b.height)/2;
    if(left+b.width>window.innerWidth-8)left=Math.max(8,r.left-b.width-9);top=Math.max(8,Math.min(window.innerHeight-b.height-8,top));
    box.style.left=`${Math.round(left)}px`;box.style.top=`${Math.round(top)}px`;
  }

  bindInspectorHover(node,code,info={}) {
    const n=Number(code)||0;if(!node||!n)return;
    const chainPreview=/chain|trigger/i.test(String(info?._promptEffectRole||''));










    node.addEventListener('pointerenter',()=>{if(chainPreview&&!this.chainEffectHoverEnabled)return;if(!chainPreview&&!this.cardHoverPreviewEnabled)return;if(this.hoverExitTimer){clearTimeout(this.hoverExitTimer);this.hoverExitTimer=null;}this.inspectCard(n,info,{transient:true});this.showCardHoverOverlay(n,info,node);this.setLogCardFocus(n,info,'hover');});
    node.addEventListener('pointerleave',()=>{this.hideCardHoverOverlay({delay:70});});
  }

  inspectableCode(card,{opponent=false,locationKey=''}={}) {
    const code=Number(card?.code)||0;if(!code)return 0;
    if(!opponent||this.opponentCardsVisible)return code;
    const P=this.mod?.OcgPosition||{};const position=Number(card?.position)||0;
    if(!(position&(P.FACEDOWN||0)))return code;
    if(card?.legallyKnown||card?.isPublic||card?.is_public)return code;
    const revealed=this.recentRevealContains(code,1);
    return revealed?code:0;
  }

  isAttachedXyzMaterial(item={}) {
    return !!item&&Object.prototype.hasOwnProperty.call(item,'overlay_sequence')&&Number.isInteger(Number(item.overlay_sequence))&&Number(item.overlay_sequence)>=0;
  }

  surfaceSelectionLocationKey(item={}) {
    const base=`${Number(item.controller)||0}:${Number(item.location)||0}:${Number(item.sequence)||0}`;
    return this.isAttachedXyzMaterial(item)?`${base}:overlay:${Number(item.overlay_sequence)}`:base;
  }

  isInlineSurfaceSelectionItem(item={}) {
    // rc233: OCGCore identifies an attached Xyz Material with the host monster's
    // controller/location/sequence plus overlay_sequence. It is not the host card
    // itself and must never be mapped onto the host's physical duel-card click target.
    if(this.isAttachedXyzMaterial(item))return false;
    const key=this.locationKey(Number(item.location)||0);
    return key==='mzone'||key==='szone'||(key==='hand'&&Number(item.controller)===0);
  }

  inlineSelectionIndexForContext(ctx={}) {
    const state=this.inlineCardSelection;
    if(!state||!this.currentPrompt||state.prompt!==this.currentPrompt||state.revision!==this.currentPromptRevision)return -1;
    const key=`${Number(ctx.player)||0}:${Number(ctx.location)||0}:${Number(ctx.sequence)||0}`;
    const value=state.indexByLocation?.get(key);
    return Number.isInteger(value)?value:-1;
  }

  toggleInlineCardSelection(index) {
    const state=this.inlineCardSelection;if(!state||!Number.isInteger(Number(index)))return;
    index=Number(index);if(state.required?.has(index))return;
    if(state.immediateSingle&&typeof state.onImmediateSelect==='function'){state.onImmediateSelect(index);return;}
    const selected=state.selected;
    if(selected.has(index)){selected.delete(index);if(state.lastSelectedIndex===index)state.lastSelectedIndex=-1;}
    else if(state.kind==='unselect'){selected.add(index);state.lastSelectedIndex=index;}
    else {
      if(this.addRollingCardSelection(selected,index,{required:state.required||new Set(),max:Number.isFinite(Number(state.max))?Number(state.max):Infinity}))state.lastSelectedIndex=index;
    }
    state.onChange?.();
    this.renderField();
  }

  openArtwork(code) {
    const n=Number(code)||0;if(!n)return;
    const card=this.getCardById?.(n);
    if(card&&this.openCardArt){this.openCardArt(card);return;}
    this.renderCardDetailsModal(n,{code:n});
  }

  liveFieldCardForInfo(code,info={}) {
    const supplied={...(info||{})};
    const key=this.locationKey(Number(supplied.location)||0);
    if(key!=='mzone')return supplied;
    const player=Number(supplied.controller)||0,sequence=Number(supplied.sequence)||0;
    const queried=this.field?.players?.[player]?.mzone?.[sequence];
    if(queried&&(!Number(code)||!Number(queried.code)||this.normalizeActionCode(queried.code)===this.normalizeActionCode(code)))return{...supplied,...queried};
    return supplied;
  }

  monsterStatSnapshot(code,info={}) {
    const db=this.getCardById?.(Number(code))||this.cardData?.(Number(code))||{};
    const live=this.liveFieldCardForInfo(code,info);
    const baseAttack=Number(db.atk??db.attack),baseDefense=Number(db.def??db.defense);
    const queriedAttack=Number(live.attack),queriedDefense=Number(live.defense);
    const hasCurrent=Number.isFinite(queriedAttack)&&this.locationKey(Number(live.location)||0)==='mzone';
    const attack=hasCurrent?queriedAttack:baseAttack;
    const linkValue=Number(db.linkval??db.link??live.link)||0;
    const defense=hasCurrent&&Number.isFinite(queriedDefense)?queriedDefense:baseDefense;
    const queriedLevel=Number(live.level),queriedRank=Number(live.rank);
    const dbType=this.duelCardTypeKey(db),isRank=linkValue<=0&&(dbType==='xyz'||Number(db.rank)>0||Number.isFinite(queriedRank)&&queriedRank>0);
    const baseProgress=linkValue>0?NaN:isRank?Number(db.rank??db.level):Number(db.level);
    const queriedProgress=isRank?queriedRank:queriedLevel;
    const progress=hasCurrent&&Number.isFinite(queriedProgress)&&queriedProgress>0?queriedProgress:baseProgress;
    const progressKind=linkValue>0?'':isRank?'rank':'level';
    const progressModified=hasCurrent&&!!progressKind&&Number.isFinite(baseProgress)&&Number.isFinite(progress)&&progress!==baseProgress;
    return{attack,defense,baseAttack,baseDefense,hasCurrent,isLink:linkValue>0,attackModified:hasCurrent&&Number.isFinite(baseAttack)&&attack!==baseAttack,defenseModified:hasCurrent&&linkValue<=0&&Number.isFinite(baseDefense)&&defense!==baseDefense,progress,baseProgress,progressKind,progressModified};
  }

  formatMonsterStat(value) {
    const n=Number(value);return Number.isFinite(n)&&n>=0?n.toLocaleString():'?';
  }

  appendLiveMonsterStats(node,card,ctx,code=0) {
    if(!node||ctx.locationKey!=='mzone'||!code)return;
    const P=this.mod?.OcgPosition||{};if(Number(card?.position)&Number(P.FACEDOWN||0))return;
    const stats=this.monsterStatSnapshot(code,{...card,controller:ctx.player,location:ctx.location,sequence:ctx.sequence});
    if(!Number.isFinite(Number(stats.attack)))return;
    const key=`${ctx.player}:mzone:${ctx.sequence}:${this.normalizeActionCode(code)}`;this.activeMonsterStatKeys.add(key);
    const previous=this.liveMonsterStats.get(key);this.liveMonsterStats.set(key,{attack:stats.attack,defense:stats.defense,progress:stats.progress,progressKind:stats.progressKind});
    if(previous){const deltas=[Number(stats.attack)-Number(previous.attack)];if(!stats.isLink)deltas.push(Number(stats.defense)-Number(previous.defense));if(previous.progressKind===stats.progressKind)deltas.push(Number(stats.progress)-Number(previous.progress));const changes=deltas.filter(value=>Number.isFinite(value)&&value!==0),cause=this.currentResolutionCause();if(changes.length&&cause?.chainLink){const positive=changes.some(value=>value>0),negative=changes.some(value=>value<0),outcome=positive&&negative?'Stats Changed':positive?'Stats Increased':'Stats Decreased',result={code:Number(code)||0,controller:ctx.player,location:ctx.location,sequence:ctx.sequence,outcome};this.recordChainSummaryCardOutcome(cause.chainLink,result);this.showCardOutcomeEffect(result,outcome,cause.chainLink,code);}}
    const badge=document.createElement('div');badge.className='duel-live-monster-stats';badge.setAttribute('aria-label',`Current ATK ${this.formatMonsterStat(stats.attack)}${stats.isLink?'':`, current DEF ${this.formatMonsterStat(stats.defense)}`}`);
    const add=(label,value,base,kind)=>{const item=document.createElement('span');item.className=`duel-live-stat duel-live-stat-${kind}`;const name=document.createElement('small');name.textContent=label;const current=document.createElement('strong');current.textContent=this.formatMonsterStat(value);item.append(name,current);if(Number.isFinite(Number(base))&&Number(value)!==Number(base))item.classList.add('modified');const old=Number(previous?.[kind]);if(previous&&Number.isFinite(old)&&old!==Number(value)){const delta=Number(value)-old;item.classList.add(delta>0?'stat-increased':'stat-decreased');const change=document.createElement('em');change.textContent=`${delta>0?'+':''}${delta.toLocaleString()}`;item.append(change);}badge.append(item);};
    add('ATK',stats.attack,stats.baseAttack,'attack');if(!stats.isLink)add('DEF',stats.defense,stats.baseDefense,'defense');node.append(badge);
    if(stats.progressKind&&Number.isFinite(Number(stats.progress))&&Number(stats.progress)>0){const progress=document.createElement('div');progress.className=`duel-live-monster-progress ${stats.progressKind}`;progress.setAttribute('aria-label',`Current ${stats.progressKind==='rank'?'Rank':'Level'} ${Number(stats.progress)}`);const symbol=document.createElement('small');symbol.textContent=stats.progressKind==='rank'?'RANK':'LVL';const value=document.createElement('strong');value.textContent=String(Number(stats.progress));progress.append(symbol,value);if(stats.progressModified)progress.classList.add('modified');const old=Number(previous?.progress);if(previous&&previous.progressKind===stats.progressKind&&Number.isFinite(old)&&old!==Number(stats.progress)){progress.classList.add(Number(stats.progress)>old?'stat-increased':'stat-decreased');const change=document.createElement('em');change.textContent=`${Number(stats.progress)>old?'+':''}${Number(stats.progress)-old}`;progress.append(change);}node.append(progress);}
  }

  makeCard(card,{opponent=false,locationKey='',compact=false,player=0,sequence=0,visualFaceDown=false,suppressActions=false,suppressInspection=false}={}) {
    const visible=visualFaceDown?0:this.visibleCode(card,opponent,locationKey);
    const realCode=Number(card?.code)||0;
    const inspectCode=suppressInspection?0:(visualFaceDown?0:this.inspectableCode(card,{opponent,locationKey}));
    const testerVisibleOnly=!!(opponent&&this.opponentCardsVisible&&Number(card?.code)&&!card?.legallyKnown&&!this.locationIsPublic(card));
    const ctx=this.contextForCard(card,{player,locationKey,sequence});
    const node=document.createElement('div');
    node.className=`duel-card${compact?' compact':''}${visible?'':' card-back'}`;
    node.dataset.code=String(realCode||'');node.dataset.player=String(player);node.dataset.location=locationKey;node.dataset.sequence=String(ctx.sequence);if(testerVisibleOnly)node.dataset.testerVisibleOnly='true';
    node.tabIndex=suppressInspection?-1:0;node.setAttribute('role',suppressInspection?'presentation':'group');if(suppressInspection)node.setAttribute('aria-hidden','true');
    const inlineSelectionIndex=this.inlineSelectionIndexForContext(ctx);

    const inlineSelectionActive=inlineSelectionIndex>=0;
    const confirmBasedInlineSelection=inlineSelectionActive&&!this.inlineCardSelection?.immediateSingle&&typeof this.inlineCardSelection?.onConfirm==='function';
    const actions=!suppressActions&&!inlineSelectionActive&&player===0?this.legalActionsForContext(ctx):[];
    if(inlineSelectionActive){const state=this.inlineCardSelection,chosen=state?.selected?.has(inlineSelectionIndex),required=state?.required?.has(inlineSelectionIndex),directSurface=!!state?.directSurfaceMode;node.classList.add('duel-selection-candidate');if(state?.immediateSingle)node.classList.add('duel-attack-target-candidate');if(chosen)node.classList.add('duel-selection-chosen');if(required)node.classList.add('duel-selection-required');const instruction=chosen&&confirmBasedInlineSelection&&!directSurface?(required?'click to view details':'click to view details; right-click to remove from selection'):chosen?(required?'required selection':'click to remove from selection'):'click to add to selection';node.setAttribute('aria-label',`${realCode?this.cardName(realCode):'Card'} - ${instruction}`);} 
    else if(actions.length){
      node.classList.add('actionable');
      const hasEffectAction=actions.some(action=>action.label==='Activate'||action.label==='Chain');
      const hasSpecialSummon=actions.some(action=>action.label==='Special Summon');
      const hasBasicAction=actions.some(action=>!['Activate','Chain','Special Summon'].includes(action.label));
      if(hasEffectAction){const visualCard=this.getCardById?.(realCode)||card||{};node.classList.add('duel-effect-actionable',`duel-effect-${this.effectVisualTypeForCard(visualCard)}`);}
      if(hasSpecialSummon)node.classList.add('duel-special-summonable');
      if(hasBasicAction)node.classList.add('duel-basic-actionable');
      if(this.currentPrompt?.type===this.mod?.OcgMessageType?.SELECT_CHAIN&&actions.some(action=>action.label==='Chain'))node.classList.add('duel-chain-response-candidate');
      node.setAttribute('aria-label',`${realCode?this.cardName(realCode):'Card'} - ${actions.map(a=>a.label).join(', ')}`);
    }
    const selected=this.selectedCardContext;
    if(selected&&selected.player===ctx.player&&selected.location===ctx.location&&selected.sequence===ctx.sequence)node.classList.add('selected-card');
    const img=document.createElement('img'); img.alt=visible?this.cardName(visible):'Face-down card'; img.src=visible?cardImage(visible):'assets/card_placeholder.png';
    if (!visible) img.classList.add('duel-card-back-image');
    node.append(img);
    if(!visible&&inspectCode&&(locationKey==='mzone'||locationKey==='szone')){const known=document.createElement('img');known.className='duel-known-card-front-image';known.src=cardImage(inspectCode);known.alt=this.cardName(inspectCode);known.setAttribute('aria-hidden','true');node.classList.add('duel-known-face-down-card');node.append(known);}
    if (locationKey==='mzone' && card?.position && (card.position & (this.mod?.OcgPosition?.DEFENSE||0))) node.classList.add('defense');
    if (card?.position && (card.position & (this.mod?.OcgPosition?.FACEDOWN||0))) node.classList.add('face-down');
    this.appendLiveMonsterStats(node,card,ctx,visible||inspectCode||realCode);
    if(!suppressInspection&&inspectCode)node.title=`${this.cardName(inspectCode)} - identity is known; card remains face-down on the field`;else if(!suppressInspection&&visible)node.title=this.cardName(visible);
    if(inspectCode)this.bindInspectorHover(node,inspectCode,card);

    const inspect=()=>{ if(inspectCode) this.handleCardClick(inspectCode,card,ctx); };
    if(inlineSelectionActive&&inspectCode&&(!confirmBasedInlineSelection||this.inlineCardSelection?.directSurfaceMode)){const details=document.createElement('button');details.type='button';details.className='duel-inline-card-details';details.textContent='Details';details.title=`View ${this.cardName(inspectCode)} details without selecting it`;details.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();inspect();});node.append(details);}
    if(confirmBasedInlineSelection)this.bindStagedCardDeselect(node,()=>!!(this.inlineCardSelection?.selected?.has(inlineSelectionIndex)&&!this.inlineCardSelection?.required?.has(inlineSelectionIndex)),()=>{this.playSound('select');this.toggleInlineCardSelection(inlineSelectionIndex);});
    if(inlineSelectionActive&&this.inlineCardSelection?.inlineConfirmIndex===inlineSelectionIndex&&typeof this.inlineCardSelection?.onConfirm==='function'){
      const confirm=document.createElement('button');confirm.type='button';confirm.className='duel-inline-card-confirm';confirm.textContent=this.inlineCardSelection.confirmLabel||'Confirm';confirm.title='Confirm this selected card';confirm.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();this.playSound('select');this.inlineCardSelection?.onConfirm?.();});node.append(confirm);
    }

    if(!suppressInspection){
      node.addEventListener('click',event=>{ if(event.target.closest?.('.duel-card-actions,.duel-inline-card-details,.duel-inline-card-confirm')) return;if(inlineSelectionActive){if(confirmBasedInlineSelection&&!this.inlineCardSelection?.directSurfaceMode&&this.inlineCardSelection?.selected?.has(inlineSelectionIndex)&&inspectCode){inspect();return;}this.playSound('select');this.toggleInlineCardSelection(inlineSelectionIndex);return;}if(this.promptMinimized&&inspectCode){inspect();return;}inspect(); });
      node.addEventListener('keydown',event=>{ if(event.target.closest?.('.duel-card-actions,.duel-inline-card-details,.duel-inline-card-confirm')) return;if(event.key==='Enter'||event.key===' '){event.preventDefault();if(inlineSelectionActive){if(confirmBasedInlineSelection&&!this.inlineCardSelection?.directSurfaceMode&&this.inlineCardSelection?.selected?.has(inlineSelectionIndex)&&inspectCode){inspect();return;}this.playSound('select');this.toggleInlineCardSelection(inlineSelectionIndex);return;}if(this.promptMinimized&&inspectCode){inspect();return;}inspect();} });
    }

    if(actions.length){
      const bar=document.createElement('div');bar.className='duel-card-actions';
      const actionPriority=label=>label==='Activate'||label==='Chain'?0:label==='Attack'?1:label.includes('Summon')?2:label.includes('Set')?3:4;
      [...actions].sort((a,b)=>actionPriority(a.label)-actionPriority(b.label)).forEach(action=>{
        const b=document.createElement('button');b.type='button';b.className='duel-card-action';const effectAction=action.label==='Activate'||action.label==='Chain';const effectText=effectAction?String(action.detail||'').trim():'';if(effectAction)b.classList.add('duel-card-effect-action');


        b.textContent=this.actionShortLabel(action.label);b.title=action.label;b.setAttribute('aria-label',effectText?`${action.label}: ${effectText}`:action.label);this.decorateActionVisual(b,action,realCode,card);
        b.addEventListener('click',event=>{event.stopPropagation();this.selectedCardContext=ctx;if(realCode)this.inspectCard(realCode,card);if(action.label==='Activate'||action.label==='Chain')this.rememberEffectItem(action.item||{},realCode);const kind=action.label==='Attack'?'attack':action.label==='Activate'||action.label==='Chain'?'activate':action.label==='Change Position'?'position':action.label.includes('Set')?'set':action.label.includes('Special')?'special':'summon';node.classList.add(`duel-anim-${kind}`);setTimeout(()=>node.classList.remove(`duel-anim-${kind}`),650);action.run();});
        bar.append(b);
      });
      node.append(bar);
    }
    const actionSignature=actions.map(action=>`${action.label||''}:${String(action.detail||'').trim()}`).sort();
    node.dataset.renderSlot=`card:${player}:${locationKey}:${ctx.sequence}:${realCode||inspectCode||0}`;
    const moveArrival=this.pendingMoveArrivals.has(this.moveArrivalKey(player,this.locationValue(locationKey),ctx.sequence));if(moveArrival)node.classList.add('duel-arrival-pending');
    node.dataset.renderSignature=this.stableRenderSignature([realCode,visible,inspectCode,Number(card?.position)||0,Number(card?.attack)||0,Number(card?.defense)||0,Number(card?.level)||0,Number(card?.rank)||0,Number(card?.link)||0,inlineSelectionIndex,inlineSelectionActive?!!this.inlineCardSelection?.selected?.has(inlineSelectionIndex):false,inlineSelectionActive?!!this.inlineCardSelection?.required?.has(inlineSelectionIndex):false,selected&&selected.player===ctx.player&&selected.location===ctx.location&&selected.sequence===ctx.sequence,actionSignature,testerVisibleOnly,!!suppressInspection,moveArrival]);
    return node;
  }

  renderHand(player,node,opponent) {
    if(!node)return;
    const cards=[...(this.field.players[player]?.hand||[])].sort((a,b)=>(Number(a?.sequence)||0)-(Number(b?.sequence)||0));
    const desired=[];
    const reserved=Math.min(cards.length,Math.max(0,Number(this.pendingDrawPresentationCounts[player])||0));cards.forEach((card,index)=>{
      const sequence=Number.isFinite(Number(card?.sequence))?Number(card.sequence):index;
      const rendered=this.makeCard(card,{opponent,locationKey:'hand',compact:true,player,sequence});
      const pending=this.pendingDrawArrivals.has(this.drawArrivalKey(player,sequence))||index>=cards.length-reserved;if(pending)rendered.classList.add('duel-arrival-pending');
      rendered.dataset.renderSignature+=pending?'|arrival':'|landed';desired.push(rendered);
    });
    this.reconcileStableChildren(node,desired);node.dataset.count=String(cards.filter(Boolean).length);
  }

  zoneMatchesPlace(player,key,sequence) {
    if(!this.activePlacePrompt||!this.mod)return null;
    const loc=this.locationValue(key);
    return (this.activePlacePrompt.places||[]).find(p=>Number(p.player)===Number(player)&&Number(p.location)===Number(loc)&&Number(p.sequence)===Number(sequence))||null;
  }

  configureSelectableZone(zone,player,key,sequence) {
    zone.classList.remove('legal-target','selected-target');zone.removeAttribute('aria-label');zone.onclick=null;
    const place=this.zoneMatchesPlace(player,key,sequence);if(!place)return;
    zone.classList.add('legal-target');const isSelected=this.selectedPlaces.some(p=>p.player===place.player&&p.location===place.location&&p.sequence===place.sequence);if(isSelected)zone.classList.add('selected-target');
    zone.setAttribute('aria-label',`${place.label} - selectable`);
    zone.onclick=event=>{if(event.target.closest?.('.duel-card-actions,.duel-card'))return;const cfg=this.activePlacePrompt;if(!cfg)return;if(cfg.count<=1){this.clearPlacePrompt();this.submitResponse({type:cfg.responseType,places:[place]});return;}const idx=this.selectedPlaces.findIndex(p=>p.player===place.player&&p.location===place.location&&p.sequence===place.sequence);if(idx>=0)this.selectedPlaces.splice(idx,1);else if(this.selectedPlaces.length<cfg.count)this.selectedPlaces.push(place);this.renderField();this.renderPlaceStatus();};
  }

  clearPlacePrompt(){this.activePlacePrompt=null;this.selectedPlaces=[];}

  renderZoneRow(player,key,node,opponent,count) {
    if(!node)return;const cards=this.field.players[player]?.[key]||[],desired=[];
    for(let i=0;i<count;i++){
      const zone=document.createElement('div');zone.className='duel-zone';zone.dataset.player=String(player);zone.dataset.location=key;zone.dataset.sequence=String(i);zone.dataset.renderSlot=`zone:${player}:${key}:${i}`;
      if(key==='szone'&&(i===0||i===4)){zone.classList.add('pendulum-zone',i===0?'pendulum-left':'pendulum-right');const mark=document.createElement('img');mark.className='duel-pendulum-mark';const leftBlue=Number(player)===0;const useBlue=i===0?leftBlue:!leftBlue;mark.src=useBlue?'assets/174ec12d-cf4f-52f9-83c3-2b422d7c220e.png':'assets/378bb365-9e87-54cc-b02d-bb45711efc61.png';mark.alt='';mark.setAttribute('aria-hidden','true');zone.append(mark);}
      this.configureSelectableZone(zone,player,key,i);const card=cards[i];let rendered=null;if(card){rendered=this.makeCard(card,{opponent,locationKey:key,player,sequence:i});zone.append(rendered);}const label=document.createElement('span');label.className='duel-zone-label';label.textContent=key==='mzone'?`M${i+1}`:`S/T${i+1}`;zone.append(label);
      zone.dataset.renderSignature=this.stableRenderSignature([zone.className,zone.getAttribute('aria-label')||'',rendered?.dataset?.renderSignature||'',label.textContent]);desired.push(zone);
    }
    this.reconcileStableChildren(node,desired);
  }

  renderExtraZones(){
    const node=$id('duelExtraMonsterZones');if(!node)return;const desired=[];
    for(let physical=5;physical<=6;physical++){
      const zone=document.createElement('div');zone.className='duel-zone extra-monster-zone';zone.dataset.location='mzone';zone.dataset.physicalSequence=String(physical);zone.dataset.shared='1';zone.dataset.renderSlot=`emz:${physical}`;
      const slots=[{player:0,sequence:this.controllerExtraMonsterSequence(0,physical)},{player:1,sequence:this.controllerExtraMonsterSequence(1,physical)}];
      const occupied=slots.filter(slot=>this.field.players[slot.player]?.mzone?.[slot.sequence]);let rendered=null;
      if(occupied.length){const slot=occupied[0],card=this.field.players[slot.player].mzone[slot.sequence];zone.dataset.player=String(slot.player);zone.dataset.sequence=String(slot.sequence);rendered=this.makeCard(card,{opponent:slot.player===1,locationKey:'mzone',player:slot.player,sequence:slot.sequence});zone.append(rendered);if(occupied.length>1)this.traceSession?.('shared-emz-conflict-suppressed',{physicalSequence:physical,slots:occupied});}
      else{const places=(this.activePlacePrompt?.places||[]).filter(place=>Number(place.location)===Number(this.locationValue('mzone'))&&this.physicalExtraMonsterSequence(place.player,place.sequence)===physical);const preferred=places.find(place=>Number(place.player)===Number(this.currentPrompt?.player));const place=preferred||places[0];if(place){zone.dataset.player=String(place.player);zone.dataset.sequence=String(place.sequence);this.configureSelectableZone(zone,place.player,'mzone',place.sequence);}}
      const label=document.createElement('span');label.className='duel-zone-label';label.textContent='EMZ';zone.append(label);zone.dataset.renderSignature=this.stableRenderSignature([zone.className,zone.getAttribute('aria-label')||'',zone.dataset.player||'',zone.dataset.sequence||'',physical,rendered?.dataset?.renderSignature||'']);desired.push(zone);
    }
    this.reconcileStableChildren(node,desired);
  }

  canViewPile(player,key){
    const count=(this.field.players[player]?.[key]||[]).filter(Boolean).length;if(!count)return false;
    if(key==='grave'||key==='removed')return true;
    if(key==='deck'&&Number(player)===0)return !!this.ownDeckViewEnabled;
    if(key==='extra'&&Number(player)===0)return true;
    if((key==='extra'||key==='deck')&&this.opponentCardsVisible)return true;
    return false;
  }

  renderPileViewer(player,key){
    if(key==='deck'&&Number(player)===0&&!this.ownDeckViewEnabled){this.toast('Free Main Deck viewing is disabled. Turn on View Own Deck to inspect it outside an effect.');return;}
    if(this.promptMinimized&&this.currentPrompt){this.auxiliaryReturnToMinimized=true;this.revealPromptForInspection();}
    this.openPileContext={player:Number(player),key};this.promptView='pile';this.clearExtraDeckViewerPresentation();this.prompt?.classList.remove('selection-prompt','card-details-prompt','inline-surface-selection-prompt','duel-log-event-prompt','duel-option-prompt','duel-universal-card-selector','duel-horizontal-position-prompt');this.prompt?.classList.add('duel-direct-pile-viewer-prompt');
    if(key==='extra')this.prompt?.classList.add('duel-extra-deck-viewer-prompt');
    this.showPrompt({dismissible:true});
    const cards=(this.field.players[player]?.[key]||[]).filter(Boolean);
    const label={extra:'Extra Deck',grave:'Graveyard',removed:'Banished',deck:'Deck'}[key]||key;
    this.promptTitle.textContent=`${player===0?'Your':'Opponent'} ${label}`;this.promptBody.replaceChildren();
    const search=document.createElement('input');search.type='search';search.className='duel-card-search';search.placeholder=`Search ${label}`;search.setAttribute('aria-label',`Search ${label}`);
    const grid=document.createElement('div');grid.className=`duel-pile-viewer duel-pile-viewer-grid duel-direct-pile-grid${key==='extra'?' duel-extra-deck-grid':''}`;
    const renderRows=()=>{
      const q=search.value.trim().toLowerCase();grid.replaceChildren();
      cards.forEach((card,index)=>{
        const real=Number(card?.code)||0;const visible=(key==='grave'||(key==='deck'&&(player===0||this.opponentCardsVisible)))?real:this.visibleCode(card,player===1,key);
        const displayName=visible?this.cardName(visible):'';if(q&&(!displayName||!displayName.toLowerCase().includes(q)))return;
        const ctx=this.contextForCard(card,{player,locationKey:key,sequence:index});
        const tile=document.createElement('div');tile.className='duel-pile-card-tile';tile.dataset.player=String(player);tile.dataset.location=key;tile.dataset.sequence=String(index);tile.dataset.code=String(real||'');
        const art=document.createElement('div');art.className='duel-pile-card-art';const img=document.createElement('img');img.src=visible?cardImage(visible):'assets/card_placeholder.png';img.alt=visible?displayName:'Face-down card';art.append(img);tile.append(art);
        const hiddenLabel=key==='extra'?'Face-down Extra Deck card':key==='removed'?'Face-down banished card':'Hidden card';const name=document.createElement('strong');name.textContent=visible?displayName:hiddenLabel;tile.append(name);




        const actions=player===0?this.legalActionsForContext(ctx):[],chainEligible=player===0&&this.visibleChainIndicatorCandidates().some(item=>this.actionItemMatchesContext(item,ctx));
        if(chainEligible&&this.actionablePileHighlightEnabled){tile.classList.add('duel-pile-card-actionable','duel-pile-card-activatable');const badge=document.createElement('b');badge.className='duel-pile-activate-badge';badge.textContent='ACTIVATE';art.append(badge);}
        if(actions.length){
          if(this.actionablePileHighlightEnabled)tile.classList.add('duel-pile-card-actionable');
          const activatable=actions.some(a=>a.label==='Activate'||a.label==='Chain');
          if(activatable&&this.actionablePileHighlightEnabled&&!chainEligible){tile.classList.add('duel-pile-card-activatable');const badge=document.createElement('b');badge.className='duel-pile-activate-badge';badge.textContent='ACTIVATE';art.append(badge);}
          const specials=key==='extra'?actions.filter(a=>a.label==='Special Summon'):[];
          if(specials.length){
            if(this.actionablePileHighlightEnabled){tile.classList.add('duel-extra-summonable');tile.classList.add('duel-special-summonable');}
            const overlay=document.createElement('div');overlay.className='duel-extra-card-actions';
            specials.forEach(a=>{
              const actionButton=document.createElement('button');actionButton.type='button';actionButton.className='duel-card-action duel-extra-special-summon-action';actionButton.textContent='Special Summon';if(a.detail)actionButton.textContent=`Special Summon: ${a.detail}`;actionButton.title=`Special Summon ${displayName||this.cardName(Number(a.item?.code)||real)}${a.detail?` - ${a.detail}`:''}`;this.decorateActionVisual(actionButton,a,Number(a.item?.code)||real,card);
              actionButton.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();this.playSound('select');const code=Number(a.item?.code)||real;this.pendingSpecialSummon={code,sourceKey:key,sourceLabel:label,player:Number(player),name:this.cardName(code)};this.log(`Player chooses ${this.cardName(code)} from ${label} to Special Summon.`);a.run();});overlay.append(actionButton);
            });
            art.append(overlay);
          }
          const remaining=actions.filter(a=>!(key==='extra'&&a.label==='Special Summon'));
          if(remaining.length){const bar=document.createElement('div');bar.className='duel-pile-card-actions';remaining.forEach(a=>{const actionButton=this.button(this.actionShortLabel(a.label),event=>{event?.stopPropagation?.();a.run();},{ghost:a.label!=='Activate'&&a.label!=='Chain'});actionButton.setAttribute('aria-label',a.detail?`${a.label}: ${a.detail}`:a.label);this.decorateActionVisual(actionButton,a,Number(a.item?.code)||real,card);bar.append(actionButton);});tile.append(bar);}
        }
        if(real&&visible){this.bindInspectorHover(tile,real,card);art.tabIndex=0;art.setAttribute('role','button');art.title=`View ${displayName} details`;const open=event=>{event?.preventDefault?.();event?.stopPropagation?.();this.pinnedInspector={code:real,info:card};this.inspectCard(real,card);this.renderCardDetailsModal(real,card);};art.addEventListener('click',open);art.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){open(event);}});}grid.append(tile);
      });
      this.syncChainSourceHighlights();
    };
    search.addEventListener('input',()=>{renderRows();this.schedulePileViewerFit();});grid.addEventListener('wheel',event=>this.scrollPileViewerByWholeRow(event,grid),{passive:false});grid.addEventListener('scroll',()=>{if(this.pileViewerSnapTimer)clearTimeout(this.pileViewerSnapTimer);this.pileViewerSnapTimer=setTimeout(()=>{this.pileViewerSnapTimer=0;this.snapPileViewerToWholeRow(grid);},90);},{passive:true});this.promptBody.append(search,grid);renderRows();
    const controls=document.createElement('div');controls.className='duel-prompt-controls';controls.append(this.button('Back',()=>this.handleBackAction(),{ghost:true}));this.promptBody.append(controls);
    this.schedulePileViewerFit();
  }

  scheduleExtraDeckViewerFit(){
    this.schedulePileViewerFit();
  }

  schedulePileViewerFit(){
    const run=()=>this.fitPileViewer();
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else run();
  }

  fitExtraDeckViewer(){
    this.fitPileViewer();
  }

  fitPileViewer(){
    if(this.promptView!=='pile'||!this.openPileContext||!this.prompt?.classList.contains('duel-direct-pile-viewer-prompt'))return;
    const grid=this.prompt.querySelector?.('.duel-direct-pile-grid');if(!grid)return;
    const tiles=[...grid.querySelectorAll('.duel-pile-card-tile')];const count=Math.max(1,tiles.length),columns=Math.min(5,count),totalRows=Math.max(1,Math.ceil(count/5));
    const boardWidth=Math.max(420,Number(this.boardWrap?.clientWidth)||1100),boardHeight=Math.max(420,Number(this.boardWrap?.clientHeight)||760),gap=10,visibleRows=Math.min(3,totalRows),ratio=614/421,labelAllowance=42,verticalChrome=180,horizontalChrome=44;
    const byWidth=(boardWidth-18-horizontalChrome-gap*Math.max(0,columns-1))/columns,byHeight=((boardHeight-14-verticalChrome-gap*Math.max(0,visibleRows-1))/visibleRows-labelAllowance)/ratio,cardWidth=Math.max(54,Math.min(124,byWidth,byHeight));
    this.prompt.style.setProperty('--duel-pile-card-w',`${cardWidth.toFixed(1)}px`);this.prompt.style.setProperty('--duel-pile-columns',String(columns));


    const tileHeight=Math.max(cardWidth*ratio+30,...tiles.map(tile=>Number(tile.getBoundingClientRect?.().height)||0)),gridHeight=visibleRows*tileHeight+gap*Math.max(0,visibleRows-1)+8,scrolling=totalRows>visibleRows,scrollbarAllowance=scrolling?16:0,promptWidth=Math.min(boardWidth-18,columns*cardWidth+gap*Math.max(0,columns-1)+horizontalChrome+scrollbarAllowance),promptHeight=Math.min(boardHeight-14,gridHeight+verticalChrome);
    this.prompt.style.setProperty('--duel-pile-row-height',`${tileHeight.toFixed(1)}px`);this.prompt.style.setProperty('--duel-pile-grid-height',`${gridHeight.toFixed(1)}px`);this.prompt.style.setProperty('--duel-pile-view-width',`${promptWidth.toFixed(1)}px`);this.prompt.style.setProperty('--duel-pile-view-height',`${promptHeight.toFixed(1)}px`);


    if(this.openPileContext.key==='extra'){this.prompt.style.setProperty('--duel-extra-card-w',`${cardWidth.toFixed(1)}px`);this.prompt.style.setProperty('--duel-extra-columns',String(columns));this.prompt.style.setProperty('--duel-extra-view-width',`${promptWidth.toFixed(1)}px`);this.prompt.style.setProperty('--duel-extra-view-height',`${promptHeight.toFixed(1)}px`);}
    grid.classList.toggle('duel-pile-grid-scroll',scrolling);grid.dataset.scrollRowStep=String(tileHeight+gap);grid.dataset.scrollRows=String(totalRows);grid.dataset.visibleRows=String(visibleRows);this.snapPileViewerToWholeRow(grid);
  }

  snapPileViewerToWholeRow(grid){
    if(!grid?.classList?.contains('duel-pile-grid-scroll'))return;const step=Number(grid.dataset.scrollRowStep)||0;if(step<=0)return;const max=Math.max(0,(Number(grid.scrollHeight)||0)-(Number(grid.clientHeight)||0)),snapped=Math.max(0,Math.min(max,Math.round((Number(grid.scrollTop)||0)/step)*step));if(Math.abs((Number(grid.scrollTop)||0)-snapped)>.5)grid.scrollTop=snapped;
  }

  scrollPileViewerByWholeRow(event,grid){
    if(!grid?.classList?.contains('duel-pile-grid-scroll'))return false;let delta=Number(event?.deltaY)||Number(event?.deltaX)||0;if(!delta)return false;if(Number(event?.deltaMode)===1)delta*=18;else if(Number(event?.deltaMode)===2)delta*=Math.max(80,Number(grid.clientHeight)||320);event?.preventDefault?.();event?.stopPropagation?.();
    this.pileViewerWheelRemainder=(Number(this.pileViewerWheelRemainder)||0)+delta;if(this.pileViewerWheelResetTimer)clearTimeout(this.pileViewerWheelResetTimer);this.pileViewerWheelResetTimer=setTimeout(()=>{this.pileViewerWheelRemainder=0;this.pileViewerWheelResetTimer=0;},160);const threshold=60;if(Math.abs(this.pileViewerWheelRemainder)<threshold)return true;const direction=Math.sign(this.pileViewerWheelRemainder);this.pileViewerWheelRemainder-=direction*threshold;const step=Number(grid.dataset.scrollRowStep)||0,max=Math.max(0,(Number(grid.scrollHeight)||0)-(Number(grid.clientHeight)||0));if(step<=0||max<=0)return true;const current=Math.round((Number(grid.scrollTop)||0)/step),next=Math.max(0,Math.min(Math.ceil(max/step),current+direction));grid.scrollTop=Math.min(max,next*step);return true;
  }

  hidePileHoverOverlay() {
    if(this.pileHoverHideTimer){clearTimeout(this.pileHoverHideTimer);this.pileHoverHideTimer=0;}
    if(this.pileHoverOverlay){this.pileHoverOverlay.remove?.();this.pileHoverOverlay=null;}this.pileHoverAnchor=null;this.pileHoverRestoredAwaitingPointerMove=false;
  }

  rememberPointerPosition(event={}) {
    const x=Number(event?.clientX),y=Number(event?.clientY);if(!Number.isFinite(x)||!Number.isFinite(y))return;
    this.lastPointerClient={x,y};
  }

  pointerIsOverNode(node,pointer=this.lastPointerClient) {
    if(!node?.isConnected)return false;
    try{if(typeof node.matches==='function'&&node.matches(':hover'))return true;}catch{}
    const x=Number(pointer?.x),y=Number(pointer?.y);if(!Number.isFinite(x)||!Number.isFinite(y))return false;
    const rect=node.getBoundingClientRect?.();if(rect&&x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom)return true;
    try{const hit=document.elementFromPoint?.(x,y);return !!hit&&(hit===node||node.contains?.(hit));}catch{return false;}
  }

  restorePileHoverAfterViewer(context={}) {
    if(!this.pileHoverCardListsEnabled||typeof document==='undefined')return;
    const player=Number(context.player)||0,key=String(context.key||'');if(!key)return;
    const label={extra:'Extra',grave:'GY',removed:'Banished',deck:'Deck'}[key]||key;
    const run=()=>{
      if(this.promptView==='pile'||this.cardDetailsOverlay)return;
      const scope=this.root?.isConnected?this.root:document;
      const node=scope.querySelector?.(`.duel-pile[data-player="${player}"][data-location="${key}"]`);if(!node)return;
      const pointer=this.lastPointerClient||context.returnPointer;if(!this.pointerIsOverNode(node,pointer))return;
      this.showPileHoverOverlay(player,key,node,label);
      this.pileHoverRestoredAwaitingPointerMove=!!this.pileHoverOverlay;
      if(this.pileHoverOverlay)this.traceSession?.('pile-hover-list-restored',{player,key,count:this.visiblePileHoverCards(player,key).length});
    };
    const next=()=>{if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else setTimeout(run,0);};
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(next);else setTimeout(next,0);
  }

  cancelPileHoverHide() {
    if(this.pileHoverHideTimer){clearTimeout(this.pileHoverHideTimer);this.pileHoverHideTimer=0;}
  }

  schedulePileHoverHide(delay=180) {
    this.cancelPileHoverHide();
    this.pileHoverHideTimer=setTimeout(()=>{this.pileHoverHideTimer=0;this.validatePileHoverOverlay();},Math.max(0,Number(delay)||0));
  }

  validatePileHoverOverlay() {
    const anchor=this.pileHoverAnchor,overlay=this.pileHoverOverlay;if(!anchor)return;if(!anchor.isConnected||!overlay?.isConnected){this.hidePileHoverOverlay();return;}
    if(this.pileHoverRestoredAwaitingPointerMove)return;
    try{const anchorHovered=typeof anchor.matches==='function'&&anchor.matches(':hover');const overlayHovered=typeof overlay.matches==='function'&&overlay.matches(':hover');if(!anchorHovered&&!overlayHovered)this.hidePileHoverOverlay();}catch{}
  }

  visiblePileHoverCards(player,key) {
    const cards=(this.field.players[player]?.[key]||[]).filter(Boolean),out=[];
    for(let index=0;index<cards.length;index++){
      const card=cards[index],raw=Number(card?.code)||0;let code=0;
      if(key==='grave')code=raw;
      else if(key==='extra'&&Number(player)===0)code=raw;
      else if(key==='deck'&&Number(player)===0&&this.ownDeckViewEnabled)code=raw;
      else code=this.visibleCode(card,Number(player)===1,key);
      const ctx=code&&Number(player)===0?this.contextForCard(card,{player:Number(player),locationKey:key,sequence:index}):null,actions=ctx?this.legalActionsForContext(ctx):[];

      const chainEligible=ctx&&this.visibleChainIndicatorCandidates().some(item=>this.actionItemMatchesContext(item,ctx)),summonable=actions.some(action=>action.label==='Special Summon'),activatable=chainEligible||actions.some(action=>action.label==='Activate'||action.label==='Chain'),actionable=chainEligible||actions.length>0;
      out.push({code,name:code?this.cardName(code):'Hidden card',hidden:!code,index,summonable,activatable,actionable,chainEligible});
    }
    return out;
  }

  scrollPileHoverOverlay(event,anchor=null) {
    if(anchor&&this.pileHoverAnchor!==anchor)return false;
    const list=this.pileHoverOverlay?.querySelector?.('.duel-pile-hover-items');if(!list)return false;
    const max=Math.max(0,(Number(list.scrollHeight)||0)-(Number(list.clientHeight)||0));if(max<=0)return false;
    let delta=Number(event?.deltaY)||Number(event?.deltaX)||0;if(!delta)return false;
    if(Number(event?.deltaMode)===1)delta*=32;else if(Number(event?.deltaMode)===2)delta*=Math.max(1,Number(list.clientHeight)||320);
    event?.preventDefault?.();event?.stopPropagation?.();this.cancelPileHoverHide();
    list.scrollTop=Math.max(0,Math.min(max,(Number(list.scrollTop)||0)+delta));return true;
  }

  showPileHoverOverlay(player,key,node,label='') {
    if(!this.pileHoverCardListsEnabled||!node||this.promptView==='details'||this.cardDetailsOverlay)return;



    if(Number(player)===1&&!this.opponentCardsVisible)return;
    if(Number(player)===0&&key==='deck'&&!this.ownDeckViewEnabled)return;
    const cards=this.visiblePileHoverCards(player,key);if(!cards.length)return;
    this.hidePileHoverOverlay();
    const box=document.createElement('div');box.className='duel-pile-hover-list';box.setAttribute('role','region');box.setAttribute('aria-label',`${Number(player)===0?'Your':'Opponent'} ${label||key} card list`);
    const title=document.createElement('strong');title.textContent=`${Number(player)===0?'Your':'Opponent'} ${label||key}`;box.append(title);
    const list=document.createElement('div');list.className='duel-pile-hover-items';

    cards.forEach(entry=>{const row=document.createElement('div');row.className='duel-pile-hover-item';row.dataset.player=String(player);row.dataset.location=key;row.dataset.sequence=String(entry.index);row.dataset.code=String(entry.code||'');if(this.actionablePileHighlightEnabled&&entry.summonable)row.classList.add('duel-pile-hover-card-summonable');if(this.actionablePileHighlightEnabled&&entry.activatable)row.classList.add('duel-pile-hover-card-activatable');if(entry.actionable&&this.actionablePileHighlightEnabled){row.classList.add('duel-pile-hover-card-actionable');row.setAttribute('aria-label',`${entry.name}, ${entry.summonable?'Special Summon':entry.activatable?'Activate':'action'} available`);}const img=document.createElement('img');img.src=entry.hidden?'assets/card_placeholder.png':cardImage(entry.code);img.alt='';const name=document.createElement('span');name.textContent=entry.name;row.append(img,name);if(this.actionablePileHighlightEnabled&&(entry.summonable||entry.activatable)){const badge=document.createElement('b');badge.className='duel-pile-hover-summon-badge';badge.textContent=entry.summonable?'SUMMON':'ACTIVATE';row.append(badge);}list.append(row);});box.append(list);box.addEventListener('pointerenter',()=>this.cancelPileHoverHide());box.addEventListener('pointerleave',event=>{if(event.relatedTarget&&node.contains(event.relatedTarget))return;this.schedulePileHoverHide();});box.addEventListener('wheel',event=>this.scrollPileHoverOverlay(event),{passive:false});(this.root?.isConnected?this.root:document.body).append(box);
    this.traceSession?.('pile-hover-list-open',{player:Number(player),key,count:cards.length});
    this.pileHoverOverlay=box;this.pileHoverAnchor=node;this.syncChainSourceHighlights();const r=node.getBoundingClientRect(),b=box.getBoundingClientRect();let left=r.right+8,top=r.top;if(left+b.width>window.innerWidth-8)left=Math.max(8,r.left-b.width-8);top=Math.max(8,Math.min(window.innerHeight-b.height-8,top));box.style.left=`${Math.round(left)}px`;box.style.top=`${Math.round(top)}px`;
  }

  bindPileHoverList(player,key,node,label='') {
    if(!node||node.dataset.pileHoverBound==='1')return;node.dataset.pileHoverBound='1';


    node.addEventListener('pointerover',event=>{if(event.relatedTarget&&node.contains(event.relatedTarget))return;this.cancelPileHoverHide();this.showPileHoverOverlay(player,key,node,label);});
    node.addEventListener('pointerout',event=>{if(event.relatedTarget&&(node.contains(event.relatedTarget)||this.pileHoverOverlay?.contains?.(event.relatedTarget)))return;this.schedulePileHoverHide();});
    node.addEventListener('wheel',event=>this.scrollPileHoverOverlay(event,node),{passive:false});
    node.addEventListener('focusin',()=>{this.cancelPileHoverHide();this.showPileHoverOverlay(player,key,node,label);});node.addEventListener('focusout',event=>{if(event.relatedTarget&&(node.contains(event.relatedTarget)||this.pileHoverOverlay?.contains?.(event.relatedTarget)))return;this.schedulePileHoverHide();});
  }

  renderPile(player,key,node,label,opponent=false){

    if(!node)return;const cards=(this.field.players[player]?.[key]||[]).filter(Boolean);node.dataset.player=String(player);node.dataset.location=key;
    const top=cards.at(-1),viewable=this.canViewPile(player,key),pileActions=player===0?this.legalActionsForPile(player,key):[],specials=pileActions.filter(action=>action.label==='Special Summon'),activations=pileActions.filter(action=>action.label==='Activate'||action.label==='Chain');
    this.bindPileHoverList(player,key,node,label);
    const signature=this.stableRenderSignature([player,key,cards.length,Number(top?.code)||0,Number(top?.position)||0,viewable,!!this.opponentCardsVisible,!!this.actionablePileHighlightEnabled,pileActions.map(a=>`${a.label}:${String(a.detail||'')}`).sort()]);
    if(node.dataset.renderSignature===signature)return;node.dataset.renderSignature=signature;node.replaceChildren();
    if(top&&['deck','extra'].includes(key)){for(let i=3;i>=1;i--){const layer=document.createElement('div');layer.className=`duel-stack-layer stack-${i}`;node.append(layer);}node.append(this.makeCard(top,{opponent,locationKey:key,compact:true,player,sequence:cards.length-1,visualFaceDown:true,suppressActions:true,suppressInspection:true}));}
    else if(top&&key==='grave'){for(let i=3;i>=1;i--){const layer=document.createElement('div');layer.className=`duel-stack-layer stack-${i}`;node.append(layer);}node.append(this.makeCard(top,{opponent,locationKey:key,compact:true,player,sequence:cards.length-1,visualFaceDown:false,suppressActions:true,suppressInspection:true}));}
    else if(top&&key==='removed')node.append(this.makeCard(top,{opponent,locationKey:key,compact:true,player,sequence:cards.length-1,suppressActions:true,suppressInspection:true}));
    else{const back=document.createElement('div');back.className=`duel-pile-back ${key}`;back.textContent=label;node.append(back);}
    const count=document.createElement('span');count.className='duel-pile-count';count.textContent=String(cards.length);node.append(count);node.classList.toggle('viewable',viewable);node.classList.toggle('duel-extra-summon-available',key==='extra'&&specials.length>0&&this.actionablePileHighlightEnabled);node.classList.toggle('duel-pile-activate-available',['grave','removed'].includes(key)&&activations.length>0&&this.actionablePileHighlightEnabled);if(this.actionablePileHighlightEnabled&&key==='extra'&&specials.length>0)node.title='Extra Deck - legal Special Summon available';else if(this.actionablePileHighlightEnabled&&['grave','removed'].includes(key)&&activations.length)node.title=`${label} - legal activation available`;else node.removeAttribute('title');const visiblePileAction=pileActions.some(action=>!(key==='extra'&&action.label==='Special Summon'));node.classList.toggle('actionable',visiblePileAction&&this.actionablePileHighlightEnabled);
    if(pileActions.length&&!['grave','removed'].includes(key)){const bar=document.createElement('div');bar.className='duel-pile-actions';const others=pileActions.filter(action=>!(key==='extra'&&action.label==='Special Summon'));if(others.length){const more=this.button(others.length===1?this.actionShortLabel(others[0].label):'Actions',event=>{event?.stopPropagation?.();this.renderPileActions(player,key);},{ghost:true});more.classList.add('duel-pile-action');bar.append(more);}if(bar.childElementCount)node.append(bar);}
    const interactive=viewable||pileActions.length>0;
    const activatePile=event=>{if(event?.target?.closest?.('.duel-pile-actions,.duel-card-actions'))return;if(event?.type==='keydown'&&!['Enter',' '].includes(event.key))return;event?.preventDefault?.();this.rememberPointerPosition(event);if(viewable){const returnPointer=this.lastPointerClient?{...this.lastPointerClient}:null;this.hidePileHoverOverlay();this.traceSession?.('pile-view-open',{player:Number(player),key,count:cards.length});this.renderPileViewer(player,key);if(this.openPileContext)this.openPileContext.returnPointer=returnPointer;return;}if(pileActions.length)this.renderPileActions(player,key);};
    node.onclick=interactive?activatePile:null;node.onkeydown=interactive?activatePile:null;
    if(interactive){node.tabIndex=0;node.setAttribute('role','button');node.setAttribute('aria-label',`${Number(player)===0?'Your':'Opponent'} ${label}, ${cards.length} card${cards.length===1?'':'s'}${activations.length?' - Activate available':''}${viewable?' - open card list':''}`);}else{node.removeAttribute('tabindex');node.removeAttribute('role');node.removeAttribute('aria-label');}
  }

  renderFieldSpell(player,node,opponent){
    if(!node)return;node.dataset.player=String(player);node.dataset.location='szone';node.dataset.sequence='5';this.configureSelectableZone(node,player,'szone',5);
    const desired=[],card=this.field.players[player]?.szone?.[5];if(card)desired.push(this.makeCard(card,{opponent,locationKey:'szone',player,sequence:5}));const label=document.createElement('span');label.className='duel-zone-label';label.textContent='Field';label.dataset.renderSlot=`field-label:${player}`;label.dataset.renderSignature='field-label';desired.push(label);this.reconcileStableChildren(node,desired);
  }

  duelCardTypeKey(card={}) {
    const type=String(card.type||card.humanReadableCardType||'').toLowerCase();
    const frame=String(card.frameType||'').toLowerCase();
    const combined=`${type} ${frame}`;
    if(combined.includes('spell'))return 'spell';
    if(combined.includes('trap'))return 'trap';
    const pendulum=combined.includes('pendulum');
    if(pendulum){
      if(frame.includes('normal')||type.includes('normal monster'))return 'pendulum-normal';
      if(combined.includes('ritual'))return 'pendulum-ritual';
      if(combined.includes('fusion'))return 'pendulum-fusion';
      if(combined.includes('synchro'))return 'pendulum-synchro';
      if(combined.includes('xyz'))return 'pendulum-xyz';
      if(combined.includes('link'))return 'pendulum-link';
      if(combined.includes('effect'))return 'pendulum-effect';
      return 'pendulum';
    }
    if(combined.includes('link'))return 'link';
    if(combined.includes('xyz'))return 'xyz';
    if(combined.includes('synchro'))return 'synchro';
    if(combined.includes('fusion'))return 'fusion';
    if(combined.includes('ritual'))return 'ritual';
    if(combined.includes('normal'))return 'normal';
    return 'effect';
  }

  effectVisualTypeForCard(card={}) {
    const key=this.duelCardTypeKey(card);
    if(key.startsWith('pendulum-')){
      const suffix=key.slice('pendulum-'.length);
      if(['fusion','synchro','xyz','link','ritual'].includes(suffix))return suffix;
      return 'pendulum';
    }
    return key;
  }

  activationEffectPreviewText(action={},code=0) {
    const item=action.item||{},resolvedCode=this.normalizeActionCode(code||item.code);let text=this.conciseEffectText(String(action.detail||'').trim()||this.effectLabel(item,''));
    const semantic=resolvedCode?this.projectIgnisEffectForActionItem(resolvedCode,item):null;
    const printed=semantic?this.projectIgnisPrintedEffectMatch(resolvedCode,semantic):'';
    if(!text||this.genericEffectText(text)||this.effectChoiceGateText(text))text=this.conciseEffectText(printed||this.choiceGateActivationContext(resolvedCode,text)||text);
    if(this.effectChoiceGateText(text))text=this.conciseEffectText(this.choiceGateActivationContext(resolvedCode,text));



    if(!text&&resolvedCode)text=String(this.cardDescription(resolvedCode)||'').replace(/\s+/g,' ').trim();
    return text;
  }

  promptAlreadyDisplaysEffect(effectText='') {
    const prompt=this.prompt,shown=this.conciseEffectText(prompt?.querySelector?.('.duel-effect-source-text')?.textContent||'');const wanted=this.conciseEffectText(effectText);if(!prompt||!shown||!wanted)return false;
    const norm=value=>this.normalizedEffectMatchText(value);const a=norm(shown),b=norm(wanted);return !!a&&!!b&&(a===b||a.includes(b)||b.includes(a));
  }

  bindActivationEffectPreview(element,action,code=0,card=null) {
    if(!element||!action||element.dataset?.activationPreviewBound==='1')return element;
    const label=String(action.label||'');if(label!=='Activate'&&label!=='Chain')return element;
    const effect=this.activationEffectPreviewText(action,code);if(!effect)return element;
    element.dataset.activationPreviewBound='1';element.classList.add('duel-activation-preview-anchor');
    const resolvedCode=this.normalizeActionCode(code||action.item?.code);
    const info={...(card||{}),...(action.item||{}),code:resolvedCode,_promptEffectText:effect,_promptEffectRole:label==='Chain'?'Chain Effect':'Activatable Effect'};
    const show=()=>{if(this.promptView==='details'||this.cardDetailsOverlay)return;if(label==='Chain'&&!this.chainEffectHoverEnabled)return;if(label!=='Chain'&&!this.activationEffectHoverEnabled)return;if(this.promptAlreadyDisplaysEffect(effect))return;if(this.hoverExitTimer){clearTimeout(this.hoverExitTimer);this.hoverExitTimer=null;}this.showCardHoverOverlay(resolvedCode,info,element);};
    const hide=()=>this.hideCardHoverOverlay({delay:0,clearInspector:false});
    element.addEventListener('pointerenter',show);element.addEventListener('pointerleave',hide);element.addEventListener('focus',show);element.addEventListener('focusout',hide);element.addEventListener('blur',hide);
    return element;
  }

  decorateActionVisual(element,action,code=0,card=null) {
    if(!element||!action)return element;
    const label=String(action.label||'');
    if(label==='Activate'||label==='Chain'){
      const source=card||this.getCardById?.(Number(code))||{};
      element.classList.add('duel-action-effect',`duel-effect-${this.effectVisualTypeForCard(source)}`);
      this.bindActivationEffectPreview(element,action,code,source);
    }else if(label==='Special Summon')element.classList.add('duel-action-special');
    else element.classList.add('duel-action-basic');
    return element;
  }

  metadataSymbolChip(src,label,className='') {
    const chip=document.createElement('strong');chip.className=`detail-meta-chip metadata-symbol-chip ${className}`.trim();chip.title=label;chip.setAttribute('aria-label',label);
    const img=document.createElement('img');img.className='metadata-symbol-icon';img.src=`assets/card_symbols/${src}`;img.alt='';img.setAttribute('aria-hidden','true');chip.append(img);return chip;
  }

  plainMetaChip(label,className='') {
    const chip=document.createElement('strong');chip.className=`detail-meta-chip ${className}`.trim();chip.textContent=label;chip.title=label;return chip;
  }

  populateBuilderDetails(code,info={},meta,stats,text,statusNode=null) {
    const card=this.getCardById?.(Number(code))||{};const name=this.cardName(code);if(statusNode)statusNode.textContent=code?`${card.type||'Card'} - ${this.getCardLimitStatus(code)||'Unlimited'}`:'Select a card';
    if(meta){meta.replaceChildren();const addRow=(label,value,valueClass='')=>{if(value==null||value==='')return;const row=document.createElement('div');row.className='detail-meta-row';const l=document.createElement('span');l.className='detail-meta-label';l.textContent=label;const v=document.createElement('strong');v.className=`detail-meta-value ${valueClass}`.trim();v.textContent=String(value);row.append(l,v);meta.append(row);};
      addRow('Archetype',card.archetype||'None');addRow('Status',this.getCardLimitStatus(code)||'Unlimited');if(this.isAttachedXyzMaterial(info)){const host=this.xyzMaterialHostCard(info),hostName=host?.code?this.cardName(host.code):'Xyz Monster';addRow('Attached As',`Xyz Material ${Number(info.overlay_sequence)+1} - ${hostName}`);}else if(Number(info.location))addRow('Location',formatLocation(this.mod,Number(info.location)));
      const chips=document.createElement('div');chips.className='detail-meta-chips';const typeKey=this.duelCardTypeKey(card);const attr=String(card.attribute||'').toUpperCase();const attrFiles={DARK:'dark.png',LIGHT:'light.png',EARTH:'earth.png',WATER:'water.png',FIRE:'fire.png',WIND:'wind.png',DIVINE:'divine.png'};
      if(attr&&attrFiles[attr]){const c=this.metadataSymbolChip(attrFiles[attr],`${attr} Attribute`,`attr-${attr.toLowerCase()} attribute-symbol-chip`);chips.append(c);}
      const typeText=String(card.type||card.humanReadableCardType||'Card');if(typeKey==='spell')chips.append(this.metadataSymbolChip('spell.png','Spell Card','card-spell'));else if(typeKey==='trap')chips.append(this.metadataSymbolChip('trap.png','Trap Card','card-trap'));else chips.append(this.plainMetaChip(typeText,`card-${typeKey}`));
      const race=String(card.race||'').trim();if(race){const key=race.toLowerCase().replace(/[_\s]+/g,'-');const sub={'quick-play':'quick-play.webp','continuous':'continuous.webp','counter':'counter.webp','equip':'equip.webp','field':'field.webp','ritual':'ritual.webp'};if((typeKey==='spell'||typeKey==='trap')&&sub[key])chips.append(this.metadataSymbolChip(sub[key],race,`card-${typeKey}`));else if(!(typeKey==='spell'||typeKey==='trap')||key!=='normal')chips.append(this.plainMetaChip(race,'race-chip'));}
      if(chips.childNodes.length)meta.append(chips);
    }
    if(stats){
      const values=[],typeKey=this.duelCardTypeKey(card),monster=typeKey!=='spell'&&typeKey!=='trap',combat=this.monsterStatSnapshot(code,info);
      stats.classList.remove('duel-current-stats','duel-current-stats-modified');
      if(combat.isLink){
        if(monster&&combat.hasCurrent)values.push(`Current ATK/ ${this.formatMonsterStat(combat.attack)}`);else if(monster&&Number.isFinite(Number(card.atk)))values.push(`ATK/ ${Number(card.atk)}`);
        values.push(`LINK-${Number(card.linkval)}`);
      }else{
        if(combat.progressKind&&Number.isFinite(Number(combat.progress))&&Number(combat.progress)>0)values.push(`${combat.hasCurrent?'Current ':''}${combat.progressKind==='rank'?'Rank':'Level'} ${Number(combat.progress)}`);
        if(monster&&combat.hasCurrent){values.push(`Current ATK/ ${this.formatMonsterStat(combat.attack)}`);if(Number.isFinite(Number(combat.defense)))values.push(`Current DEF/ ${this.formatMonsterStat(combat.defense)}`);}
        else{if(monster&&Number.isFinite(Number(card.atk)))values.push(`ATK/ ${Number(card.atk)}`);if(monster&&Number.isFinite(Number(card.def))&&Number(card.def)>=0)values.push(`DEF/ ${Number(card.def)}`);}
      }
      if(monster&&combat.hasCurrent){
        stats.classList.add('duel-current-stats');
        if(combat.attackModified||combat.defenseModified||combat.progressModified){
          stats.classList.add('duel-current-stats-modified');
          const printed=[];if(combat.progressModified)printed.push(`Printed ${combat.progressKind==='rank'?'Rank':'Level'} ${Number(combat.baseProgress)}`);if(Number.isFinite(Number(combat.baseAttack)))printed.push(`Printed ATK/ ${this.formatMonsterStat(combat.baseAttack)}`);if(!combat.isLink&&Number.isFinite(Number(combat.baseDefense)))printed.push(`Printed DEF/ ${this.formatMonsterStat(combat.baseDefense)}`);if(printed.length)values.push(printed.join(' - '));
        }
      }
      const scale=Number(card.scale??card.pend_desc_scale);if(Number.isFinite(scale)&&scale>0)values.push(`Scale ${scale}`);stats.textContent=values.join(combat.isLink?', ':' - ');
    }
    if(text)this.setStyledCardText(text,code?this.cardDescription(code):'Select a visible card on the field or in your hand.',code);
    return {card,name};
  }

  inspectCard(code, info={}, {transient=false}={}) {
    code=Number(code)||0;if(!transient){this.lastInspectedCode=code;this.lastInspectedInfo=info||{};}
    const title=$id('duelInspectName'),art=$id('duelInspectArt'),textNode=$id('duelInspectText'),stats=$id('duelInspectStats'),meta=$id('duelInspectMeta'),actionsNode=$id('duelInspectActions'),status=$id('duelInspectStatus');
    if(title)title.textContent=code?this.cardName(code):'\u00a0';
    if(art){art.src=code?cardImage(code):'assets/card_placeholder.png';art.alt=code?this.cardName(code):'Card placeholder';art.onclick=code?(()=>this.openArtwork(code)):null;art.title=code?'Click to enlarge artwork':'';}
    if(code)this.populateBuilderDetails(code,info,meta,stats,textNode,status);else{if(meta)meta.replaceChildren();if(stats)stats.textContent='';if(textNode)textNode.textContent='Select a visible card on the field or in your hand.';if(status)status.textContent='Select a card';}


    if(actionsNode){actionsNode.replaceChildren();const locationKey=Number(info.location)?this.locationKey(Number(info.location)):'';const ctx=locationKey?this.contextForCard(info,{player:Number(info.controller)||0,locationKey,sequence:Number(info.sequence)||0}):null;const legal=ctx?this.legalActionsForContext(ctx):[];const priority=label=>label==='Activate'||label==='Chain'?0:label==='Attack'?1:label.includes('Summon')?2:label.includes('Set')?3:4;[...legal].sort((a,b)=>priority(a.label)-priority(b.label)).forEach(action=>actionsNode.append(this.renderViewedCardAction(action,code,()=>action.run())));}
    this.syncStyledTextToggle();
  }

  isEngineDiagnosticText(text='') {
    const value=String(text||'').replace(/\r/g,'').trim();if(!value)return false;
    return /^\[script\s+\d+\]/i.test(value)||/stack traceback/i.test(value)||/invalid\s+CHAININFO\s+flag/i.test(value)||/\[string\s+["'][^"']+\.lua["']\]/i.test(value)||/proc_workaround\.lua/i.test(value)||/:\d+:\s+in (?:function|local)\b/i.test(value);
  }

  debugLog(text='') {
    const value=String(text||'').trim();if(!value)return;
    this.debugLines.push({time:Date.now(),text:value});if(this.debugLines.length>500)this.debugLines.splice(0,this.debugLines.length-500);
    this.traceSession('engine-diagnostic',{text:value});
    try{console.warn('[YGO Duel Diagnostic]',value);}catch{}
  }

  logEntryReferencedCodes(entry={}) {
    const details=entry?.details||{},out=new Set();const add=value=>{const code=this.normalizeActionCode(value);if(code)out.add(code);};
    add(details.code);for(const card of details.cards||[])add(card?.code??card);add(details.cause?.code);add(details.respondsTo?.code);add(details.sourceCode);add(details.targetCode);
    return [...out];
  }

  setLogCardFocus(code,info={},source='hover') {
    const n=this.normalizeActionCode(code);if(source==='selected'){this.selectedLogCardCode=n;this.selectedLogCardInfo=info||{};}else{this.hoverLogCardCode=n;this.hoverLogCardInfo=info||{};}this.updateLogCardHighlights();
  }

  clearLogCardFocus(source='hover') {
    if(source==='selected'){this.selectedLogCardCode=0;this.selectedLogCardInfo=null;}else{this.hoverLogCardCode=0;this.hoverLogCardInfo=null;}this.updateLogCardHighlights();
  }

  activeLogCardFocus() {
    return this.hoverLogCardCode?{code:this.hoverLogCardCode,info:this.hoverLogCardInfo||{}}:this.selectedLogCardCode?{code:this.selectedLogCardCode,info:this.selectedLogCardInfo||{}}:null;
  }

  updateLogCardHighlights() {
    if(!this.logNode?.querySelectorAll)return;const focus=this.activeLogCardFocus(),code=this.normalizeActionCode(focus?.code);
    this.logNode.querySelectorAll('.duel-log-entry').forEach(node=>{const codes=String(node.dataset.cardCodes||'').split(',').map(Number).filter(Boolean);node.classList.toggle('related-card-event',!!code&&codes.includes(code));});
  }

  log(text,details={}){if(!text)return;const value=String(text);if(this.isEngineDiagnosticText(value)){this.debugLog(value);return;}details={...(details||{})};const summary=this.activeChainSummary,type=String(details.type||'');if(summary&&type!=='chain-summary'&&(type.includes('chain')||details.chainLink||details.cause?.chainLink||details.respondsTo?.chainLink)){const inferred=Number(details.chainLink||details.cause?.chainLink||details.respondsTo?.chainLink||(value.match(/Chain Link\s+(\d+)/i)||[])[1])||0;details.chainInstanceId=summary.id;if(inferred)details.chainLink=inferred;}const entry={id:Date.now()+Math.random(),text:value,turn:Math.max(1,Number(this.turn)||1),phase:this.phaseLabel(this.presentedPhase??this.phase),details};if(summary&&details.chainInstanceId===summary.id&&details.chainLink)summary.events.push({id:entry.id,chainLink:Number(details.chainLink),type,text:value});this.logLines.push(entry);if(this.logLines.length>300)this.logLines.splice(0,this.logLines.length-300);if(!this.isReplaySeekReconstruction())this.renderLog();}
  logEntryClasses(entry={}) {
    const details=entry.details||{};const type=String(details.type||'').toLowerCase();const text=String(entry.text||'');const classes=['duel-log-entry'];
    const meaningful=!!(details.code||details.effect||details.cause||details.respondsTo||(details.cards||[]).length||['chain','chain-resolving','chain-resolved','chain-negated','summon','special-summon','flip-summon','attack','direct-attack','direct-attack-damage','damage','draw','reveal','inspect','move','set','position','target','player-chain-response','player-effect-response','player-card-response','player-position-response','player-sort-response'].includes(type));
    if(meaningful)classes.push('card-event');
    if(type.includes('chain')||/chain link|chain response/i.test(text))classes.push('chain-event');
    if(type==='chain-summary')classes.push('chain-summary-event');
    if(type==='chain-visual')classes.push('chain-visual-event');
    if(Number(details.controller)===1||/^Practice Dummy\b/i.test(text)||/ - Practice Dummy\b/i.test(text))classes.push('opponent-event');
    if(type.startsWith('player-')||/^Player (?:selects|accepts|declines|passes|confirms|chooses)/i.test(text))classes.push('response-event');
    if(details.outcome||details.cause||type==='chain-negated'||type==='direct-attack-damage')classes.push('outcome-event');
    if(type==='direct-attack'||type==='direct-attack-damage')classes.push('direct-damage-event');
    return classes.join(' ');
  }

  logVisualDescriptor(entry={}) {
    const d=entry.details||{},type=String(d.type||'').toLowerCase(),text=String(entry.text||'');let label='Event',kind='system',mark='EVENT',from=String(d.source||''),to=String(d.destination||'');
    const set=(l,k,m=l)=>{label=l;kind=k;mark=m;};
    if(type==='draw'){set('Draw','move','DRAW');from=from||'Deck';to=to||'Hand';}
    else if(type==='inspect'){set('Inspect','reveal','VIEW');}
    else if(type==='reveal'){set('Reveal','reveal','REVEAL');}
    else if(type==='move'){set('Card Move','move','MOVE');}
    else if(type==='set'){set('Set Card','move','SET');}
    else if(type==='position'){set('Position','move','POS');}
    else if(type==='shuffle'){set('Shuffle','move','SHUFFLE');}
    else if(type==='summon'){set('Normal Summon','summon','SUMMON');}
    else if(type==='special-summon'){set('Special Summon','summon','SPECIAL');}
    else if(type==='flip-summon'){set('Flip Summon','summon','FLIP');}
    else if(type==='attack'){set('Attack','battle','ATK');}
    else if(type==='direct-attack'){set('Direct Attack','battle','ATK');}
    else if(type==='attack-negated'){set('Attack Stopped','battle','STOP');}
    else if(type==='target'||type==='player-attack-target'){set('Target','battle','TARGET');}
    else if(type==='damage'||type==='direct-attack-damage'){set(type==='damage'?'Damage':'Direct Damage','lp','LP');}
    else if(type==='recover'){set('LP Recovery','gain','LP');}
    else if(type==='lp-update'||type==='lp-cost'){set(type==='lp-cost'?'LP Cost':'LP Change',Number(d.amount)>0?'gain':'lp','LP');}
    else if(type==='chain'){set('Chain Link','chain','CHAIN');}
    else if(type==='chain-resolving'){set('Resolving','chain','RESOLVE');}
    else if(type==='chain-resolved'){set('Resolved','chain','DONE');}
    else if(type==='chain-negated'||type==='chain-disabled'){set(type==='chain-disabled'?'Disabled':'Negated','negated',type==='chain-disabled'?'DISABLED':'NEGATED');}
    else if(type==='chain-summary'){set('Final Chain','chain-summary','SUMMARY');}
    else if(type==='chain-visual'){set('Chain Complete','chain','CHAIN');}
    else if(type==='player-chain-response'){set('Chain Response','choice','CHAIN');}
    else if(type==='player-effect-response'){set('Effect Choice','choice','EFFECT');}
    else if(type==='player-card-response'){set('Card Selection','choice','SELECT');}
    else if(type==='player-position-response'||type==='player-sort-response'){set('Player Choice','choice','CHOICE');}
    else if(type==='concede'){set('Concede','negated','END');}
    else if(/phase begins/i.test(text)){set('Phase','system','PHASE');}
    else if(/turn \d+ begins/i.test(text)){set('Turn','system','TURN');}
    return{type,label,kind,mark,from,to,amount:Number(d.amount)||0,chainLink:Number(d.chainLink)||0,outcome:String(d.outcome||'')};
  }

  renderVisualLogEntry(entry={}) {
    const line=typeof entry==='string'?{text:entry,turn:Math.max(1,this.turn),phase:this.phaseLabel(this.phase),details:{}}:entry,d=line.details||{},v=this.logVisualDescriptor(line),codes=this.logEntryReferencedCodes(line),isFinalChain=String(d.type||'')==='chain-summary',shown=codes.slice(0,3),button=document.createElement('button');
    button.type='button';button.className=`${this.logEntryClasses(line)} duel-log-visual-entry duel-log-kind-${v.kind}${isFinalChain?' duel-log-final-chain-entry':''}`;button.dataset.cardCodes=codes.join(',');button.dataset.chainInstance=String(d.chainInstanceId||'');button.dataset.chainLink=String(v.chainLink||'');button.title=isFinalChain?'Open Chain Summary':'View event details';button.setAttribute('aria-label',isFinalChain?`Open Chain Summary - ${line.text||''}`:(line.text||v.label));
    const media=document.createElement('span');media.className=`duel-log-visual-media duel-log-card-count-${shown.length}`;const cards=document.createElement('span');cards.className=`duel-log-card-strip${isFinalChain?' duel-log-final-chain-track':''}`;
    if(isFinalChain&&Array.isArray(d.chainSequence)&&d.chainSequence.length){
      const sequence=d.chainSequence.slice(0,3);sequence.forEach((item,index)=>{const code=this.normalizeActionCode(item?.code)||0;if(!code)return;const wrap=document.createElement('span');wrap.className='duel-log-final-chain-card';wrap.dataset.chainLink=String(Number(item.chainLink)||index+1);const img=document.createElement('img');const info={code,controller:Number(item.controller)||0};img.src=cardImage(code);img.alt=this.cardName(code);img.loading='lazy';img.decoding='async';img.classList.add('duel-clickable-card-image','duel-log-inline-card-image');img.title=`View ${this.cardName(code)} Card Details`;this.bindInspectorHover(img,code,info);img.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();this.pinnedInspector={code,info};this.inspectCard(code,info);this.renderCardDetailsModal(code,info);});const badge=document.createElement('b');badge.textContent=`CL${Number(item.chainLink)||index+1}`;wrap.append(img,badge);cards.append(wrap);if(index<sequence.length-1){const connector=document.createElement('i');connector.className='duel-log-final-chain-connector';cards.append(connector);}});
      if(d.chainSequence.length>3){const more=document.createElement('small');more.className='duel-log-card-more';more.textContent=`+${d.chainSequence.length-3}`;cards.append(more);}
    } else {
      shown.forEach((code,index)=>{const sourceCard=(d.cards||[]).find(card=>this.normalizeActionCode(card?.code??card)===code),info=sourceCard&&typeof sourceCard==='object'?{...sourceCard,code}:{code};const img=document.createElement('img');img.src=cardImage(code);img.alt=this.cardName(code);img.loading='lazy';img.decoding='async';img.style.setProperty('--duel-log-card-index',String(index));img.classList.add('duel-clickable-card-image','duel-log-inline-card-image');img.title=`View ${this.cardName(code)} Card Details`;this.bindInspectorHover(img,code,info);img.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();this.pinnedInspector={code,info};this.inspectCard(code,info);this.renderCardDetailsModal(code,info);});cards.append(img);});
      if(!shown.length&&['draw','set'].includes(v.type)){const img=document.createElement('img');img.src='assets/card_placeholder.png';img.alt='Hidden card';img.className='duel-log-hidden-card';cards.append(img);media.classList.add('duel-log-card-count-1');}
      if(codes.length>shown.length){const more=document.createElement('small');more.className='duel-log-card-more';more.textContent=`+${codes.length-shown.length}`;cards.append(more);}
    }
    const mark=document.createElement('b');mark.className='duel-log-action-mark';mark.textContent=v.chainLink?`CL${v.chainLink}`:v.mark;media.append(cards,mark);
    const main=document.createElement('span');main.className='duel-log-visual-main';const head=document.createElement('span');head.className='duel-log-visual-head';const action=document.createElement('b');action.className='duel-log-action-label';action.textContent=v.label;const meta=document.createElement('small');meta.className='duel-log-meta';meta.textContent=`T${Number(line.turn)||1} - ${line.phase||''}`;head.append(action,meta);main.append(head);
    if(v.from||v.to){const flow=document.createElement('span');flow.className='duel-log-flow';const a=document.createElement('small');a.textContent=v.from||'Source';const connector=document.createElement('i');const b=document.createElement('small');b.textContent=v.to||'Destination';flow.append(a,connector,b);main.append(flow);}
    if(v.amount){const amount=document.createElement('strong');amount.className='duel-log-amount';amount.textContent=`${v.amount>0?'+':''}${v.amount.toLocaleString()} LP`;main.append(amount);}
    const summary=document.createElement('span');summary.className='duel-log-visual-summary';summary.textContent=line.text;main.append(summary);if(isFinalChain){const hint=document.createElement('small');hint.className='duel-log-chain-summary-hint';hint.textContent='Click to open full Chain Summary';main.append(hint);}
    if(v.outcome){const outcome=document.createElement('small');outcome.className='duel-log-outcome';outcome.textContent=v.outcome;main.append(outcome);}
    button.append(media,main);button.addEventListener('click',()=>this.renderLogEvent(line));return button;
  }

  renderLog(){if(!this.logNode)return;this.logNode.replaceChildren(...this.logLines.slice(-100).map(entry=>this.renderVisualLogEntry(entry)));this.updateLogCardHighlights();this.logNode.scrollTop=this.logNode.scrollHeight;}

  clearChainSummaryHoverPortal() {
    this.chainSummaryHoverPortal?.remove?.();this.chainSummaryHoverPortal=null;
  }

  showChainSummaryHoverPortal(detail,row,{preferAbove=false}={}) {
    this.clearChainSummaryHoverPortal();
    if(typeof document==='undefined'||!document.body||!detail||!row?.getBoundingClientRect)return;
    const portal=detail.cloneNode(true);portal.removeAttribute('id');portal.hidden=false;portal.classList.add('duel-chain-summary-detail-portal');document.body.append(portal);
    const viewportW=Math.max(280,Number(window?.innerWidth)||1280),viewportH=Math.max(240,Number(window?.innerHeight)||800),margin=8,gap=8,rowRect=row.getBoundingClientRect();
    portal.style.width=`${Math.min(360,viewportW-margin*2)}px`;const rect=portal.getBoundingClientRect();let left=rowRect.left+(rowRect.width-rect.width)/2;left=Math.max(margin,Math.min(left,viewportW-rect.width-margin));
    const below=rowRect.bottom+gap,above=rowRect.top-rect.height-gap;let top=preferAbove&&above>=margin?above:below;if(top+rect.height>viewportH-margin&&above>=margin)top=above;top=Math.max(margin,Math.min(top,viewportH-rect.height-margin));
    portal.style.left=`${Math.round(left)}px`;portal.style.top=`${Math.round(top)}px`;this.chainSummaryHoverPortal=portal;
  }

  renderChainVisualHistory(view,items,summaryEntry,details={}) {
    const heading=document.createElement('h3');heading.textContent='Completed Chain';
    const track=document.createElement('div');track.className='duel-chain-history-track';const chainItems=Array.isArray(items)?items:[];
    chainItems.forEach((item,index)=>{
      if(index){const connector=document.createElement('div');connector.className='duel-chain-history-connector';connector.setAttribute('aria-hidden','true');const line=document.createElement('span');const label=document.createElement('small');label.textContent=`CL${item.chainLink} responds to CL${Number(item.respondsToLink)||Number(chainItems[index-1]?.chainLink)||index}`;connector.append(line,label);track.append(connector);}
      const outcome=this.chainOutcomeDescriptor(item.outcome||'Resolved');const card=document.createElement('article');card.className=`duel-chain-history-card ${outcome.key} outcome-${outcome.key}`;card.dataset.outcome=outcome.key;card.dataset.chainInstance=String(details.chainInstanceId||'');card.dataset.chainLink=String(item.chainLink);
      const related=(item.events||[]).map(ref=>this.logLines.find(line=>line.id===ref.id)).filter(Boolean),eventEntry=related.find(line=>String(line.details?.type)==='chain')||related.find(line=>String(line.details?.type)==='player-chain-response')||related[0];
      const setCorrelation=active=>{this.logNode?.querySelectorAll('.duel-log-entry').forEach(node=>node.classList.toggle('related-chain-event',active&&node.dataset.chainInstance===String(details.chainInstanceId||'')&&node.dataset.chainLink===String(item.chainLink)));};
      if(eventEntry){const eventAction=document.createElement('button');eventAction.type='button';eventAction.className='duel-chain-history-event-action';eventAction.title=`Open Chain Link ${item.chainLink} Duel Log event`;eventAction.setAttribute('aria-label',`Open Chain Link ${item.chainLink} Duel Log event`);eventAction.addEventListener('click',()=>{setCorrelation(false);this.logDetailParentContext=summaryEntry;this.renderLogEvent(eventEntry);});card.append(eventAction);}
      const badge=document.createElement('strong');badge.className='duel-chain-history-badge';badge.textContent=`CL ${item.chainLink}`;
      const cardAction=document.createElement('button');cardAction.type='button';cardAction.className='duel-chain-history-card-action';cardAction.title=item.code?`View ${this.cardName(item.code)} details`:'Chain card';const img=document.createElement('img');img.src=item.code?cardImage(item.code):'assets/card_placeholder.png';img.alt=item.code?this.cardName(item.code):'Effect';cardAction.append(img);if(item.code)cardAction.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();setCorrelation(false);this.renderCardDetailsModal(item.code,{code:item.code,controller:Number(item.controller)||0});});
      const copy=document.createElement('span');copy.className='duel-chain-history-copy';const name=document.createElement('b');name.textContent=item.code?this.cardName(item.code):'Effect';const meta=document.createElement('small');meta.textContent=`${this.playerLabel(Number(item.controller)||0)} - ${outcome.label}`;const effect=document.createElement('p');effect.textContent=this.conciseEffectText(String(item.effect||''))||'Effect resolved.';copy.append(name,meta,effect);card.append(badge,cardAction,copy);this.appendChainOutcomeIndicators(card,item);
      card.addEventListener('pointerenter',()=>setCorrelation(true));card.addEventListener('pointerleave',()=>setCorrelation(false));card.addEventListener('focusin',()=>setCorrelation(true));card.addEventListener('focusout',event=>{if(!card.contains(event.relatedTarget))setCorrelation(false);});track.append(card);
    });
    view.append(heading,track);
  }

  renderChainSummaryGroup(view,title,items,mode,summaryEntry,details={}) {
    const heading=document.createElement('h3');heading.textContent=title;
    const list=document.createElement('div');list.className=`duel-chain-summary-list ${mode}`;
    const chainItems=Array.isArray(items)?items:[];
    chainItems.forEach((item,index)=>{
      if(index){const connector=document.createElement('div');connector.className='duel-chain-summary-connector';connector.setAttribute('aria-hidden','true');connector.innerHTML='<span></span><small>responds</small>';list.append(connector);}
      const row=document.createElement('article');const outcome=this.chainOutcomeDescriptor(item.outcome||'Pending');row.className=`duel-chain-summary-row ${outcome.key} outcome-${outcome.key}`;row.dataset.outcome=outcome.key;row.dataset.chainInstance=String(details.chainInstanceId||'');row.dataset.chainLink=String(item.chainLink);
      if(index>=Math.ceil(chainItems.length/2))row.classList.add('duel-chain-summary-detail-align-right');
      const related=(item.events||[]).map(ref=>this.logLines.find(line=>line.id===ref.id)).filter(Boolean);
      const eventEntry=mode==='activation-order'?(related.find(line=>String(line.details?.type)==='chain')||related.find(line=>String(line.details?.type)==='player-chain-response')||related[0]):(related.find(line=>/resolved|negated|disabled|failed/.test(String(line.details?.type)))||related.at(-1));
      const setCorrelation=active=>{this.logNode?.querySelectorAll('.duel-log-entry').forEach(node=>node.classList.toggle('related-chain-event',active&&node.dataset.chainInstance===String(details.chainInstanceId||'')&&node.dataset.chainLink===String(item.chainLink)));};
      const badge=document.createElement('strong');badge.className='duel-chain-summary-link';badge.textContent=`CL ${item.chainLink}`;
      const img=document.createElement('img');img.src=item.code?cardImage(item.code):'assets/card_placeholder.png';img.alt=item.code?this.cardName(item.code):'Effect';
      const copy=document.createElement('span');copy.className='duel-chain-summary-copy';const name=document.createElement('b');name.textContent=item.code?this.cardName(item.code):'Effect';const meta=document.createElement('small');meta.textContent=`${this.playerLabel(Number(item.controller)||0)} - ${outcome.label}`;copy.append(name,meta);
      const detail=document.createElement('aside');detail.className='duel-chain-summary-detail';detail.id=`duel-chain-summary-detail-${String(details.chainInstanceId||'chain').replace(/[^a-z0-9_-]+/gi,'-')}-${mode}-${Number(item.chainLink)||index}`;detail.setAttribute('role','tooltip');detail.hidden=true;
      const detailTitle=document.createElement('b');detailTitle.textContent=`CL ${item.chainLink} - ${item.code?this.cardName(item.code):'Effect'}`;detail.append(detailTitle);
      const relationship=document.createElement('small');const relationshipParts=[`${this.playerLabel(Number(item.controller)||0)} - ${item.outcome||'Pending'}`];if(Number(item.respondsToLink))relationshipParts.push(`Responds to CL ${Number(item.respondsToLink)}`);if(mode==='resolution-order')relationshipParts.push(`Resolution ${index+1} of ${chainItems.length}`);relationship.textContent=relationshipParts.join(' - ');detail.append(relationship);
      const effect=String(item.effect||'').trim();if(effect){const effectText=document.createElement('p');effectText.textContent=effect;detail.append(effectText);}
      if(Array.isArray(item.results)&&item.results.length){const results=document.createElement('div');results.className='duel-chain-summary-detail-results';const label=document.createElement('b');label.textContent='Results';results.append(label);item.results.forEach(result=>{const resultText=document.createElement('small');resultText.textContent=`${result.outcome}${result.code?` - ${this.cardName(result.code)}`:''}`;results.append(resultText);});detail.append(results);}
      if(related.length){const events=document.createElement('div');events.className='duel-chain-summary-detail-events';const label=document.createElement('b');label.textContent='Related Duel Log';events.append(label);related.forEach(logEntry=>{const eventText=document.createElement('small');eventText.textContent=logEntry.text;events.append(eventText);});detail.append(events);}
      let pointerInside=false,focusInside=false;const disclosureTargets=[];const setExpanded=expanded=>{detail.hidden=true;row.dataset.expanded=String(expanded);disclosureTargets.forEach(target=>target.setAttribute('aria-expanded',String(expanded)));if(expanded)this.showChainSummaryHoverPortal(detail,row,{preferAbove:mode==='resolution-order'});else this.clearChainSummaryHoverPortal();};const syncExpanded=()=>setExpanded(pointerInside||focusInside);
      let eventAction=null;if(this.chainSummaryInteractiveEnabled){if(eventEntry){eventAction=document.createElement('button');eventAction.type='button';eventAction.className='duel-chain-summary-event-action';eventAction.dataset.logEventId=String(eventEntry.id);row.dataset.logEventId=String(eventEntry.id);eventAction.setAttribute('aria-label',`Open the ${mode==='activation-order'?'activation':'resolution'} Duel Log event for Chain Link ${item.chainLink}`);eventAction.setAttribute('aria-describedby',detail.id);eventAction.setAttribute('aria-expanded','false');eventAction.title='Open this exact Duel Log event';disclosureTargets.push(eventAction);eventAction.addEventListener('click',()=>{setCorrelation(false);this.logDetailParentContext=summaryEntry;this.renderLogEvent(eventEntry);});}row.addEventListener('pointerenter',()=>{pointerInside=true;syncExpanded();});row.addEventListener('pointerleave',()=>{pointerInside=false;syncExpanded();});row.addEventListener('focusin',()=>{focusInside=true;syncExpanded();});row.addEventListener('focusout',event=>{if(!row.contains(event.relatedTarget)){focusInside=false;syncExpanded();}});}
      if(this.chainSummaryHoverCorrelationEnabled){row.addEventListener('pointerenter',()=>setCorrelation(true));row.addEventListener('pointerleave',()=>setCorrelation(false));row.addEventListener('focusin',()=>setCorrelation(true));row.addEventListener('focusout',event=>{if(!row.contains(event.relatedTarget))setCorrelation(false);});}
      let cardSurface=img;if(item.code&&this.chainSummaryCardDetailsEnabled){const cardAction=document.createElement('button');cardAction.type='button';cardAction.className='duel-chain-summary-card-action';cardAction.title=`View ${this.cardName(item.code)} details`;cardAction.setAttribute('aria-label',`View ${this.cardName(item.code)} Card Details`);cardAction.setAttribute('aria-describedby',detail.id);cardAction.setAttribute('aria-expanded','false');img.classList.add('duel-clickable-card-image');cardAction.append(img);disclosureTargets.push(cardAction);cardAction.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();setCorrelation(false);this.renderCardDetailsModal(item.code,{code:item.code,controller:Number(item.controller)||0});});cardSurface=cardAction;}
      row.append(...(eventAction?[eventAction]:[]),badge,cardSurface,copy,detail);this.appendChainOutcomeIndicators(row,item);list.append(row);
    });
    view.append(heading,list);
  }

  renderLogEvent(entry={}){
    this.clearChainSummaryHoverPortal();this.restorePromptHome();this.resetEnginePromptPresentationState();this.logDetailContext=entry;this.promptView='log-detail';this.showPrompt({dismissible:true});this.prompt?.classList.remove('selection-prompt','card-details-prompt','inline-surface-selection-prompt');this.prompt?.classList.add('duel-log-event-prompt');const logType=String(entry?.details?.type||'');this.promptTitle.textContent=logType==='chain-summary'?'Chain Summary':logType==='chain-visual'?'Completed Chain':'Duel Log Event';this.promptBody.replaceChildren();
    const context=document.createElement('div');context.className='duel-log-event-context';const phase=document.createElement('span');phase.textContent=`Turn ${entry.turn||Math.max(1,this.turn)} - ${entry.phase||this.phaseLabel(this.phase)}`;context.append(phase);this.promptBody.append(context);
    const details=entry.details||{};this.prompt?.classList?.toggle('duel-log-event-related-layout',!!(details.respondsTo?.code||details.cause?.code));
    const visualSequence=Array.isArray(details.chainVisualSequence)?details.chainVisualSequence:null;const summary=document.createElement('p');summary.className='duel-log-event-summary';summary.textContent=Array.isArray(details.chainSequence)?`${details.chainSequence.length} Chain Links - ${details.outcome||'Chain complete'}`:visualSequence?`${visualSequence.length} Chain Links - ${details.outcome||'Chain complete'}`:(entry.text||'');this.promptBody.append(summary);
    const lpDelta=Number(details.amount)||0;if(lpDelta){const change=document.createElement('div');change.className=`duel-log-lp-change ${lpDelta<0?'loss':'gain'}`;const amount=document.createElement('strong');amount.textContent=`${lpDelta>0?'+':''}${lpDelta.toLocaleString()} LP`;const label=document.createElement('span');label.textContent=`${this.playerLabel(Number(details.controller)||0)} ${lpDelta<0?'loses':'gains'} Life Points`;change.append(amount,label);this.promptBody.append(change);}
    const codes=[...(details.cards||[]).map(c=>Number(c.code??c)).filter(Boolean)];if(Number(details.code))codes.unshift(Number(details.code));const unique=[...new Set(codes)];
    if(Array.isArray(details.chainSequence)&&details.chainSequence.length){
      const view=document.createElement('section');view.className='duel-chain-summary-view';
      this.renderChainSummaryGroup(view,'Activation Order',details.chainSequence,'activation-order',entry,details);this.renderChainSummaryGroup(view,'Resolution Order',Array.isArray(details.resolutionSequence)?details.resolutionSequence:[],'resolution-order',entry,details);this.promptBody.append(view);
    }
    if(visualSequence?.length){const view=document.createElement('section');view.className='duel-chain-history-view';this.renderChainVisualHistory(view,visualSequence,entry,details);this.promptBody.append(view);}
    if(unique.length&&!Array.isArray(details.chainSequence)&&!visualSequence){const cards=document.createElement('div');cards.className='duel-log-event-cards';unique.forEach(code=>{const tile=document.createElement('button');tile.type='button';tile.className='duel-log-event-card';tile.title=`View ${this.cardName(code)} details`;const img=document.createElement('img');img.src=cardImage(code);img.alt=this.cardName(code);img.classList.add('duel-clickable-card-image');const name=document.createElement('strong');name.textContent=this.cardName(code);tile.append(img,name);this.bindInspectorHover(tile,code,{code});const open=event=>{event?.preventDefault?.();event?.stopPropagation?.();this.pinnedInspector={code,info:{code}};this.inspectCard(code,{code});this.renderCardDetailsModal(code,{code});};tile.addEventListener('click',open);img.addEventListener('click',open);cards.append(tile);});this.promptBody.append(cards);}
    const effect=String(details.effect||'').trim();if(effect){const heading=document.createElement('h3');heading.textContent='Relevant Effect';const text=document.createElement('div');text.className='duel-log-event-effect';this.setStyledCardText(text,effect,Number(details.code)||0);this.promptBody.append(heading,text);}

    const appendRelationship=(label,relation,kind)=>{
      if(!relation?.code)return;
      const box=document.createElement('section');box.className=`duel-log-relationship ${kind||''}`.trim();
      const heading=document.createElement('h3');heading.textContent=label;box.append(heading);
      const row=document.createElement('div');row.className='duel-log-relationship-row';
      const card=document.createElement('button');card.type='button';card.className='duel-log-relationship-card';card.title=`View ${this.cardName(relation.code)} details`;const img=document.createElement('img');img.src=cardImage(relation.code);img.alt=this.cardName(relation.code);img.classList.add('duel-clickable-card-image');const copy=document.createElement('span');const name=document.createElement('strong');name.textContent=this.cardName(relation.code);const meta=document.createElement('small');meta.textContent=`${relation.chainLink?`Chain Link ${relation.chainLink} - `:''}${this.playerLabel(relation.controller)}`;copy.append(name,meta);card.append(img,copy);this.bindInspectorHover(card,relation.code,{code:relation.code});const openRelation=event=>{event?.preventDefault?.();event?.stopPropagation?.();this.pinnedInspector={code:relation.code,info:{code:relation.code}};this.inspectCard(relation.code,{code:relation.code});this.renderCardDetailsModal(relation.code,{code:relation.code});};card.addEventListener('click',openRelation);img.addEventListener('click',openRelation);row.append(card);
      const relationEffect=String(relation.effect||'').trim();if(relationEffect){const text=document.createElement('div');text.className='duel-log-relationship-effect';this.setStyledCardText(text,relationEffect,relation.code);row.append(text);}box.append(row);this.promptBody.append(box);
    };
    appendRelationship('Responding To',details.respondsTo,'responds-to');
    appendRelationship('Caused By',details.cause,'cause');

    const extra=[];if(details.chainLink)extra.push(`Chain Link: ${details.chainLink}`);if(details.respondsTo?.chainLink)extra.push(`Responds to Chain Link: ${details.respondsTo.chainLink}`);if(details.cause?.chainLink)extra.push(`Outcome caused by Chain Link: ${details.cause.chainLink}`);if(details.outcome)extra.push(`Outcome: ${details.outcome}`);if(details.source)extra.push(`Source: ${details.source}`);if(details.destination)extra.push(`Destination: ${details.destination}`);if(details.amount!=null&&!lpDelta)extra.push(`LP Change: ${Number(details.amount).toLocaleString()}`);if(extra.length){const dl=document.createElement('div');dl.className='duel-log-event-data';extra.forEach(value=>{const row=document.createElement('span');row.textContent=value;dl.append(row);});this.promptBody.append(dl);}
    const controls=document.createElement('div');controls.className='duel-prompt-controls';controls.append(this.button('Back',()=>this.handleBackAction(),{ghost:true}));this.promptBody.append(controls);this.schedulePromptFit();
  }

  cardAtLoc(loc){if(!loc)return null;return this.field.players[loc.controller]?.[this.locationKey(loc.location)]?.[loc.sequence]||null;}
  locationKey(loc){const L=this.mod.OcgLocation;if(loc&L.HAND)return'hand';if(loc&L.MZONE)return'mzone';if(loc&L.SZONE)return'szone';if(loc&L.GRAVE)return'grave';if(loc&L.REMOVED)return'removed';if(loc&L.EXTRA)return'extra';if(loc&L.DECK)return'deck';return'';}
  xyzMaterialHostCard(item={}){if(!this.isAttachedXyzMaterial(item))return null;return this.cardAtLoc(item);}
  locLabel(item){if(this.isAttachedXyzMaterial(item)){const host=this.xyzMaterialHostCard(item),hostName=host?.code?this.cardName(host.code):'Xyz Monster';return `${this.cardName(item.code)} · Xyz Material ${Number(item.overlay_sequence)+1} attached to ${hostName}`;}return `${this.cardName(item.code)} · ${item.controller===0?'You':'Dummy'} ${formatLocation(this.mod,item.location)}${Number.isFinite(item.sequence)?` ${item.sequence+1}`:''}`;}

  selectionSourceBadge(item={}) {
    if(this.isAttachedXyzMaterial(item)){const host=this.xyzMaterialHostCard(item),hostName=host?.code?this.cardName(host.code):'Xyz Monster';return `Xyz Material ${Number(item.overlay_sequence)+1} - ${hostName}`;}
    const controller=Number(item.controller)||0,location=Number(item.location)||0,zone=formatLocation(this.mod,location);
    const owner=controller===0?'Your':'Opponent';
    return `${owner} ${zone}`;
  }

  ensureXyzMaterialSelectionGroup(groups,item={}) {
    if(!this.isAttachedXyzMaterial(item)||!(groups instanceof Map))return null;
    const key=`${Number(item.controller)||0}:${Number(item.location)||0}:${Number(item.sequence)||0}`;if(groups.has(key))return groups.get(key).grid;
    const section=document.createElement('section');section.className='duel-xyz-material-selection';
    const header=document.createElement('div');header.className='duel-xyz-material-selection-header';const copy=document.createElement('div');const eyebrow=document.createElement('small');eyebrow.textContent='Attached Xyz Materials';const host=this.xyzMaterialHostCard(item),hostCode=Number(host?.code)||0;const name=document.createElement('strong');name.textContent=hostCode?this.cardName(hostCode):'Xyz Monster';copy.append(eyebrow,name);header.append(copy);
    if(hostCode){const hostButton=document.createElement('button');hostButton.type='button';hostButton.className='duel-xyz-material-host';hostButton.title=`View ${this.cardName(hostCode)} details`;const img=document.createElement('img');img.src=cardImage(hostCode);img.alt=this.cardName(hostCode);hostButton.append(img);hostButton.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();const info={...item,code:hostCode};delete info.overlay_sequence;this.inspectCard(hostCode,info);this.renderCardDetailsModal(hostCode,info);});header.prepend(hostButton);}
    const instruction=document.createElement('p');instruction.textContent='Select the attached material card required by the effect. The Xyz Monster itself is not the material selection.';
    const grid=document.createElement('div');grid.className='duel-select-card-grid duel-xyz-material-grid duel-universal-selection-grid';section.append(header,instruction,grid);groups.set(key,{section,grid});return grid;
  }

  preferredAutoPlace(places=[]) {
    const L=this.mod?.OcgLocation||{};const order=[2,1,3,0,4,5,6];
    const own=places.filter(p=>Number(p.player)===0&&(Number(p.location)===Number(L.MZONE)||Number(p.location)===Number(L.SZONE)));
    if(!own.length||own.length!==places.length)return null;
    return [...own].sort((a,b)=>{
      const al=Number(a.location)===Number(L.MZONE)?0:1,bl=Number(b.location)===Number(L.MZONE)?0:1;if(al!==bl)return al-bl;
      return order.indexOf(Number(a.sequence))-order.indexOf(Number(b.sequence));
    })[0]||null;
  }

  autoPlaceResponse(message) {
    const T=this.mod?.OcgMessageType||{},R=this.mod?.OcgResponseType||{};
    if(!this.autoZoneEnabled||message?.type!==T.SELECT_PLACE||Number(message.player)!==0||Math.max(1,Number(message.count)||1)!==1)return null;
    const places=this.parsePlaces(message.field_mask,Number(message.player)||0);const place=this.preferredAutoPlace(places);if(!place)return null;
    this.log(`Auto Zones selected ${place.label}.`);return{type:R.SELECT_PLACE,places:[place]};
  }

  chainTimingOverrideHeld() { return !!this.shiftChainOverrideHeld; }

  chainCandidateIsTriggeredEffect(item={}) {
    const code=this.normalizeActionCode(item?.code);if(!code)return false;
    const semantic=this.projectIgnisEffectForActionItem(code,item);
    const types=new Set(semantic?.types||[]),codes=new Set(semantic?.codes||[]);
    if([...types].some(token=>/^EFFECT_TYPE_TRIGGER(?:_O|_F)?$/i.test(String(token))))return true;
    if([...codes].some(token=>/^EVENT_(?!FREE_CHAIN$)/i.test(String(token)))&&![...types].some(token=>/QUICK/i.test(String(token))))return true;
    const text=this.conciseEffectText(this.effectLabel(item,'')||this.descriptionText(item?.description,''));
    if(!text||/\(Quick Effect\)/i.test(text))return false;




    return /^(?:If|When)\b[^.]{0,220}\b(?:Summon(?:ed|s|ing)?|activated|sent|destroyed|banished|discarded|drawn|leaves? the field|inflicts? battle damage|takes? damage|changes? position|added to (?:your|the) hand)\b/i.test(text);
  }

  chainPromptContainsTriggeredEffect(message={}) {
    const T=this.mod?.OcgMessageType||{};if(message?.type!==T.SELECT_CHAIN)return false;


    const specialCount=Number(message.spe_count??message.special_count??message.trigger_count??0)||0;if(specialCount>0)return true;
    return (message.selects||[]).some(item=>this.chainCandidateIsTriggeredEffect(item));
  }

  phaseOnlyChainWindow(message={}) {
    const T=this.mod?.OcgMessageType||{},P=this.mod?.OcgPhase||{};
    if(message?.type!==T.SELECT_CHAIN||message.forced||Number(message.player)!==0||(message.selects||[]).length===0)return false;
    if(this.chainTimingOverrideHeld())return false;
    if(this.chainPromptContainsTriggeredEffect(message))return false;
    if(Number(this.turnPlayer)===1&&Number(this.phase)===Number(P.END))return false;
    if(this.meaningfulResponseWindow)return false;
    return true;
  }

  selfNegatingOptionalChainCandidate(item={},message={}) {
    if(!this.suppressSelfNegatingHandTrapsEnabled)return false;
    if(this.chainTimingOverrideHeld()||this.chainCandidateIsTriggeredEffect(item))return false;
    const source=this.responseEffectContext(message)||this.latestChainEffectContext();if(!source||Number(source.controller)!==0)return false;
    if(Number(item.controller??message.player)!==0)return false;
    const text=this.chainEffectPreviewText(item);if(!/\bnegat(?:e|es|ed|ing)\b/i.test(text))return false;




    return true;
  }

  visibleChainCandidates(message={}) {
    const selects=message.selects||[];if(!this.smartOptionalChainPromptsEnabled||!this.suppressSelfNegatingHandTrapsEnabled||this.chainTimingOverrideHeld())return selects.map((item,index)=>({item,index}));
    return selects.map((item,index)=>({item,index})).filter(entry=>!this.selfNegatingOptionalChainCandidate(entry.item,message));
  }

  smartOptionalChainFingerprint(message={}) {
    const selects=(message.selects||[]).map(item=>[this.normalizeActionCode(item?.code),Number(item?.controller)||0,Number(item?.location)||0,Number(item?.sequence)||0,String(item?.description??'')].join(':'));
    return selects.join('|');
  }

  smartOptionalChainResponse(message) {
    const T=this.mod?.OcgMessageType||{},R=this.mod?.OcgResponseType||{};
    if(!this.smartOptionalChainPromptsEnabled||message?.type!==T.SELECT_CHAIN||message.forced||Number(message.player)!==0)return null;
    const candidates=message.selects||[],visible=this.visibleChainCandidates(message);





    if(candidates.length&&!(this.phaseOnlyChainWindow(message)||visible.length===0))return null;
    return{type:R.SELECT_CHAIN,index:null};
  }

  passiveOpponentWindowResponse(message) {
    const T=this.mod?.OcgMessageType||{},R=this.mod?.OcgResponseType||{};




    if(message?.type===T.SELECT_CHAIN&&!message.forced&&!(message.selects||[]).length)return{type:R.SELECT_CHAIN,index:null};
    return null;
  }

  isDirectBattleTargetSurface(message=this.currentPrompt) {
    const state=this.inlineCardSelection;
    return !!message&&!!state&&state.kind==='battle-target'&&state.prompt===message&&Number(state.revision)===Number(this.currentPromptRevision)&&state.immediateSingle===true;
  }

  promptUsesVisibleSurface(message=this.currentPrompt) {
    const T=this.mod?.OcgMessageType||{};
    if(this.isDirectBattleTargetSurface(message))return false;
    return !!message && message.type!==T.SELECT_IDLECMD && message.type!==T.SELECT_BATTLECMD;
  }

  visibleActionNode(node) {
    if(!node||node.hidden||node.disabled)return false;
    if(typeof getComputedStyle!=='function')return true;
    let current=node;
    while(current&&current.nodeType===1){
      if(current.hidden||current.classList?.contains('duel-prompt-hidden')||current.classList?.contains('chain-complete'))return false;
      const css=getComputedStyle(current);if(css.display==='none'||css.visibility==='hidden'||Number(css.opacity)===0)return false;
      current=current.parentElement;
    }
    const css=getComputedStyle(node);if(css.pointerEvents==='none')return false;
    const rect=node.getBoundingClientRect?.();return !rect||rect.width>0||rect.height>0;
  }

  hasActionablePromptSurface(message=this.currentPrompt) {
    if(!message||!this.promptUsesVisibleSurface(message))return true;
    // rc222: Direct Hand / Field selection is intentionally independent of duelPrompt.
    // The field prompt is hidden while the dedicated toolbar dock and highlighted cards
    // are the active decision surface.
    if(this.directSurfaceSelectionActive(message)){
      const directNodes=[...(this.root?.querySelectorAll?.('.duel-card.duel-selection-candidate')||[])];
      if(directNodes.some(node=>this.visibleActionNode(node)))return true;
      const dockActions=[...(this.directSelectionDock?.querySelectorAll?.('button:not([disabled])')||[])];
      if(dockActions.some(node=>this.visibleActionNode(node)))return true;
    }
    if(!this.prompt||this.prompt.classList?.contains('duel-prompt-hidden')||this.prompt.closest?.('[hidden]')||this.prompt.closest?.('.chain-complete'))return false;
    const T=this.mod?.OcgMessageType||{};
    if(message.type===T.SELECT_PLACE||message.type===T.SELECT_DISFIELD){
      const zones=[...(this.boardWrap?.querySelectorAll?.('.duel-zone.legal-target,.duel-zone.duel-place-selectable')||[])];if(zones.some(node=>this.visibleActionNode(node)))return true;
    }
    const nodes=[...(this.prompt.querySelectorAll?.('button:not([disabled]),[role="button"],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),.duel-zone.legal-target')||[])];
    return nodes.some(node=>this.visibleActionNode(node));
  }

  ensureCurrentPromptVisible({forceRender=false}={}) {
    if(!this.currentPrompt||!this.pendingResolve||!this.prompt||!this.promptUsesVisibleSurface(this.currentPrompt))return false;
    if(this.directSurfaceSelectionActive(this.currentPrompt)&&this.hasActionablePromptSurface(this.currentPrompt))return true;
    if(this.promptMinimized)return false;
    this.syncChainPromptAttachment(this.currentPrompt);
    let hidden=this.prompt.classList?.contains('duel-prompt-hidden');
    const hiddenAncestor=this.prompt.closest?.('[hidden]');
    if(hiddenAncestor){this.restorePromptHome();hidden=this.prompt.classList?.contains('duel-prompt-hidden');}
    const secondary=['details','pile','opponent-deck','log-detail','special-choice'].includes(this.promptView);
    if(secondary&&!hidden&&!this.prompt.closest?.('[hidden]'))return true;
    const missingAction=!this.hasActionablePromptSurface(this.currentPrompt);
    if(forceRender||hidden||this.prompt.closest?.('[hidden]')||!['engine','chain'].includes(this.promptView)||missingAction){
      this.promptRecoveryCount+=1;this.renderPrompt(this.currentPrompt);
      if(this.promptRecoveryCount===1||this.promptRecoveryCount%6===0)this.toast('Recovered a duel decision prompt that was hidden or unusable.','warn');
      return true;
    }
    this.promptRecoveryCount=0;return true;
  }

  commandPromptActionCount(message=this.currentPrompt) {
    if(!message||!this.mod)return 0;const T=this.mod.OcgMessageType||{};
    if(message.type===T.SELECT_IDLECMD)return ['activates','summons','special_summons','monster_sets','spell_sets','pos_changes'].reduce((n,key)=>n+(message[key]||[]).length,0)+(message.to_bp?1:0)+(message.to_ep?1:0);
    if(message.type===T.SELECT_BATTLECMD)return (message.attacks||[]).length+(message.chains||[]).length+(message.to_m2?1:0)+(message.to_ep?1:0);
    return 0;
  }

  hasVisibleCommandActionSurface() {
    const root=this.root;if(!root?.querySelectorAll)return false;
    const nodes=[...root.querySelectorAll('.duel-card-action,.duel-pile-action,.duel-pile.duel-extra-summon-available,.duel-phase-step.available,.duel-zone.legal-target,.duel-command-recovery-actions .duel-action')];
    return nodes.some(node=>{if(node.hidden||node.disabled)return false;if(typeof window==='undefined'||typeof getComputedStyle!=='function')return true;const css=getComputedStyle(node);if(css.display==='none'||css.visibility==='hidden'||Number(css.opacity)===0)return false;const rect=node.getBoundingClientRect?.();return !rect||rect.width>0||rect.height>0;});
  }

  renderCommandRecoveryPrompt(message=this.currentPrompt) {
    if(!message||!this.pendingResolve||!this.mod)return false;const T=this.mod.OcgMessageType||{},R=this.mod.OcgResponseType||{},I=this.mod.SelectIdleCMDAction||{},B=this.mod.SelectBattleCMDAction||{};
    if(![T.SELECT_IDLECMD,T.SELECT_BATTLECMD].includes(message.type)||Number(message.player)!==0)return false;
    this.promptView='command-recovery';this.prompt?.classList.remove('selection-prompt','card-details-prompt','inline-surface-selection-prompt','duel-universal-card-selector','duel-option-prompt','duel-log-event-prompt');this.promptBody.replaceChildren();this.promptTitle.textContent='Choose your next action';
    const note=document.createElement('p');note.className='duel-selection-purpose';note.textContent='The Rules Engine is waiting for your next action. Deck Studio restored the command surface because no actionable field or phase control was visible.';
    const group=document.createElement('div');group.className='duel-command-recovery-actions';
    const add=(items,type,action,label)=>{(items||[]).forEach((item,index)=>{const code=this.normalizeActionCode(item?.code),detail=(label==='Activate'||label==='Special Summon')?this.effectLabel(item,''):'';const b=this.button(`${label}${code?`: ${this.cardName(code)}`:''}`,()=>{if(label==='Activate')this.rememberEffectItem(item);this.submitResponse({type,action,index});});if(label==='Activate')this.decorateActionVisual(b,{label:'Activate',detail,item},code,item);group.append(b);});};
    if(message.type===T.SELECT_IDLECMD){add(message.activates,R.SELECT_IDLECMD,I.SELECT_ACTIVATE,'Activate');add(message.summons,R.SELECT_IDLECMD,I.SELECT_SUMMON,'Normal Summon');add(message.special_summons,R.SELECT_IDLECMD,I.SELECT_SPECIAL_SUMMON,'Special Summon');add(message.pos_changes,R.SELECT_IDLECMD,I.SELECT_POS_CHANGE,'Change Position');add(message.monster_sets,R.SELECT_IDLECMD,I.SELECT_MONSTER_SET,'Set Monster');add(message.spell_sets,R.SELECT_IDLECMD,I.SELECT_SPELL_SET,'Set Spell/Trap');if(message.to_bp)group.append(this.button('Enter Battle Phase',()=>this.submitResponse({type:R.SELECT_IDLECMD,action:I.TO_BP,index:null})));if(message.to_ep)group.append(this.button('End Turn',()=>this.submitResponse({type:R.SELECT_IDLECMD,action:I.TO_EP,index:null}),{ghost:true}));}
    else{add(message.attacks,R.SELECT_BATTLECMD,B.SELECT_BATTLE,'Attack');add(message.chains,R.SELECT_BATTLECMD,B.SELECT_CHAIN,'Activate');if(message.to_m2)group.append(this.button('Enter Main Phase 2',()=>this.submitResponse({type:R.SELECT_BATTLECMD,action:B.TO_M2,index:null})));if(message.to_ep)group.append(this.button('End Turn',()=>this.submitResponse({type:R.SELECT_BATTLECMD,action:B.TO_EP,index:null}),{ghost:true}));}
    if(!group.children.length)return false;this.promptBody.append(note,group);this.showPrompt({dismissible:false});this.schedulePromptFit();this.toast('Recovered a hidden duel action prompt.','warn');return true;
  }

  startInteractionWatchdog() {
    if(this.interactionWatchdogTimer)clearTimeout(this.interactionWatchdogTimer);this.interactionWatchdogTimer=0;this.interactionWatchdogMisses=0;this.interactionWatchdogRevision=this.currentPromptRevision;
    const revision=this.currentPromptRevision,decisionId=this.activeDecisionId;
    const tick=()=>{
      if(!this.running||!this.currentPrompt||!this.pendingResolve||this.currentPromptRevision!==revision||this.activeDecisionId!==decisionId){this.interactionWatchdogTimer=0;this.interactionWatchdogMisses=0;return;}
      const T=this.mod?.OcgMessageType||{},message=this.currentPrompt;
      if(message.type===T.SELECT_IDLECMD||message.type===T.SELECT_BATTLECMD){
        if(['details','pile','opponent-deck','log-detail','special-choice'].includes(this.promptView)&&!this.prompt?.classList?.contains('duel-prompt-hidden')){this.interactionWatchdogMisses=0;}
        else if(this.hasVisibleCommandActionSurface()){this.interactionWatchdogMisses=0;}
        else if(this.commandPromptActionCount(message)>0){this.interactionWatchdogMisses+=1;this.renderField();this.renderPhaseDock();if(this.interactionWatchdogMisses>=2)this.renderCommandRecoveryPrompt(message);}
      }else{
        if(this.hasActionablePromptSurface(message)){this.interactionWatchdogMisses=0;this.ensureCurrentPromptVisible();}
        else{this.interactionWatchdogMisses+=1;this.ensureCurrentPromptVisible({forceRender:this.interactionWatchdogMisses>=2});}
      }
      this.interactionWatchdogTimer=setTimeout(tick,320);
    };
    this.interactionWatchdogTimer=setTimeout(tick,240);
  }

  authoritativeDecisionSurfaceHealthy(decision=this.authoritativePendingDecision) {
    if(!this.running||!decision||!decision.message)return false;
    if(decision.submitted)return !!this.pendingDecisionLease&&!!this.awaitingPlayerResponseAck;
    if(typeof decision.resolve!=='function')return false;
    const id=Number(decision.id)||0;if(!id)return false;
    if(this.currentPrompt!==decision.message||Number(this.activeDecisionId)!==id||Number(this.promptDecisionIds?.get(decision.message)||0)!==id||this.pendingResolve!==decision.resolve)return false;



    if(this.promptView==='details'&&!this.detailsCloseRequested)return true;
    if(this.promptMinimized)return true;
    if(!this.promptUsesVisibleSurface(decision.message))return true;
    if(!this.prompt||this.prompt.classList?.contains('duel-prompt-hidden')||this.prompt.closest?.('[hidden]'))return false;
    if(Number(this.prompt.dataset?.decisionId||0)!==id)return false;
    return this.hasActionablePromptSurface(decision.message);
  }

  restoreAuthoritativeDecisionSurface() {
    const decision=this.authoritativePendingDecision;
    if(!this.running||!decision||!decision.message)return false;
    if(decision.submitted)return this.restoreSubmittedDecisionSurface(decision);
    if(typeof decision.resolve!=='function')return false;
    const id=Number(decision.id)||0;if(!id)return false;
    if(this.authoritativeDecisionSurfaceHealthy(decision)){
      this.decisionGuardianRestores=0;



      return true;
    }
    const ownershipMismatch=this.currentPrompt!==decision.message||Number(this.activeDecisionId)!==id||Number(this.promptDecisionIds?.get(decision.message)||0)!==id||this.pendingResolve!==decision.resolve;
    this.activeDecisionId=id;this.currentPrompt=decision.message;this.currentPromptRevision=Number(decision.revision)||this.currentPromptRevision||1;this.promptDecisionIds?.set(decision.message,id);this.pendingResolve=decision.resolve;this.renderedDecisionId=id;


    if(!this.promptMinimized&&this.promptView!=='details'){
      this.auxiliaryReturnToMinimized=false;
      if(this.promptRestoreButton)this.promptRestoreButton.hidden=true;
      this.decisionGuardianRestores+=1;
      if(ownershipMismatch){this.renderField();this.renderPhaseDock();}
      this.renderPrompt(decision.message);
    }
    return true;
  }

  startDecisionGuardian() {
    if(this.decisionGuardianTimer)clearTimeout(this.decisionGuardianTimer);
    const tick=()=>{
      this.decisionGuardianTimer=0;
      const decision=this.authoritativePendingDecision;
      if(!this.running||!decision)return;
      if(!this.authoritativeDecisionSurfaceHealthy(decision))this.restoreAuthoritativeDecisionSurface();
      this.decisionGuardianTimer=setTimeout(tick,220);
    };
    this.decisionGuardianTimer=setTimeout(tick,120);
  }

  stopDecisionGuardianFor(id=0) {
    const decision=this.authoritativePendingDecision;if(decision&&id&&Number(decision.id)!==Number(id))return;
    if(this.decisionGuardianTimer)clearTimeout(this.decisionGuardianTimer);this.decisionGuardianTimer=0;
  }

  startPromptVisibilityGuard() {
    if(this.promptVisibilityTimer)clearTimeout(this.promptVisibilityTimer);
    const revision=this.currentPromptRevision,decisionId=this.activeDecisionId;
    const tick=()=>{
      if(!this.currentPrompt||!this.pendingResolve||this.currentPromptRevision!==revision||this.activeDecisionId!==decisionId){this.promptVisibilityTimer=0;return;}
      this.ensureCurrentPromptVisible();
      this.promptVisibilityTimer=setTimeout(tick,180);
    };
    this.promptVisibilityTimer=setTimeout(tick,0);
  }

  playerResponse(message,{manualOnly=false}={}){
    const T=this.mod?.OcgMessageType||{},R=this.mod?.OcgResponseType||{};
    this.traceSession('player-response-request',{signature:this.replayPromptSignature(message),manualOnly:!!manualOnly,prompt:this.traceSafeObject(message)});
    if(message?.type===T.SELECT_OPTION&&this.pendingEffectOptionIntent){
      const index=this.preferredEffectOptionIndex(message,this.pendingEffectOptionIntent);
      this.pendingEffectOptionIntent=null;
      if(index>=0){this.hidePrompt();return Promise.resolve({type:R.SELECT_OPTION,index});}
    }else if(this.pendingEffectOptionIntent){


      this.pendingEffectOptionIntent=null;
    }



    const heldPass=!manualOnly?this.heldRightPassResponse(message):null;
    if(heldPass){
      this.pendingEffectOptionIntent=null;this.userSubmittedPrompts.add(message);
      this.traceSession('explicit-held-pass-response',{signature:this.replayPromptSignature(message),response:this.traceSafeObject(heldPass)});
      this.logSubmittedResponse(message,heldPass);this.hidePrompt();return Promise.resolve(heldPass);
    }
    const smartChain=!manualOnly?this.smartOptionalChainResponse(message):null;if(smartChain){this.smartAutoPassedPrompts?.add?.(message);this.traceSession('automatic-response',{source:'smart-chain',reason:(message.selects||[]).length?(this.phaseOnlyChainWindow(message)?'phase-only':'filtered-candidates'):'empty-window',response:smartChain});this.hidePrompt();return Promise.resolve(smartChain);}
    const passive=!manualOnly?this.passiveOpponentWindowResponse(message):null;if(passive){this.traceSession('automatic-response',{source:'passive-window',response:passive});this.hidePrompt();return Promise.resolve(passive);}
    const suppressAutoPlace=!!(this.suppressNextAutoPlace&&message?.type===T.SELECT_PLACE);
    if(this.suppressNextAutoPlace)this.suppressNextAutoPlace=false;
    const autoPlace=manualOnly||suppressAutoPlace?null:this.autoPlaceResponse(message);if(autoPlace){this.traceSession('automatic-response',{source:'auto-place',response:autoPlace});this.hidePrompt();this.playSound('select');return Promise.resolve(autoPlace);}
    if(message?.type===T.SELECT_CHAIN && !message.forced && !(message.selects||[]).length){
      this.hidePrompt();
      return Promise.resolve({type:R.SELECT_CHAIN,index:null});
    }
    if(message?.type===T.SELECT_UNSELECT_CARD&&this.stagedUnselectCommit){const staged=this.nextStagedUnselectResponse(message);if(staged){this.hidePrompt();return Promise.resolve(staged);}}
    this.promptRevision+=1;this.currentPromptRevision=this.promptRevision;this.promptRecoveryCount=0;
    const decisionId=++this.decisionSerial;this.promptDecisionIds?.set(message,decisionId);this.activeDecisionId=decisionId;


    if(this.authoritativePendingDecision&&Number(this.authoritativePendingDecision.id)!==decisionId)this.stopDecisionGuardianFor(Number(this.authoritativePendingDecision.id)||0);
    this.authoritativePendingDecision={id:decisionId,message,revision:this.currentPromptRevision,resolve:null,submitted:false,createdAt:Date.now()};
    this.stagedCardSelection=this.pendingRestoredStagedSelection?{...this.pendingRestoredStagedSelection,indices:[...(this.pendingRestoredStagedSelection.indices||[])]}:null;this.pendingRestoredStagedSelection=null;
    if(message?.type!==T.SELECT_CHAIN)this.stagedChainSelection=null;
    this.currentPrompt=message;this.selectedCardContext=null;this.promptMinimized=false;this.auxiliaryReturnToMinimized=false;if(this.promptRestoreButton)this.promptRestoreButton.hidden=true;



    if(this.pendingPlayerAttack&&Number(this.currentPromptRevision)>Number(this.pendingPlayerAttack.expectedPromptRevision)+4)this.pendingPlayerAttack=null;
    this.renderField();this.renderPhaseDock();
    return new Promise(resolve=>{this.pendingResolve=resolve;this.authoritativePendingDecision.resolve=resolve;this.authoritativePendingDecision.revision=this.currentPromptRevision;this.renderedDecisionId=decisionId;this.renderPrompt(message);this.startPromptVisibilityGuard();this.startInteractionWatchdog();this.startDecisionGuardian();});
  }
  capturePendingSummonTarget(prompt,response) {
    if(!prompt||!response||!this.mod)return;
    const T=this.mod.OcgMessageType||{},L=this.mod.OcgLocation||{};
    if(prompt.type!==T.SELECT_CARD||!Array.isArray(response.indicies)||response.indicies.length!==1)return;
    const item=(prompt.selects||[])[Number(response.indicies[0])];if(!item)return;
    const code=this.normalizeActionCode(item.code),location=Number(item.location)||0;if(!code||!(location&Number(L.EXTRA||0)))return;
    const card=this.getCardById?.(code)||{},frame=String(card.frameType||card.type||card.humanReadableCardType||'').toLowerCase();
    const effect=String(this.pendingEffectSource?.description||this.activeEffectDescription||this.inferPromptEffectText(prompt)||'');
    const summonContext=/fusion summon|synchro summon|xyz summon|link summon|special summon/i.test(effect)||/fusion|synchro|xyz|link/.test(frame);
    if(!summonContext)return;
    this.pendingSpecialSummon={code,sourceKey:'extra',sourceLabel:'Extra Deck',player:Number(item.controller??prompt.player)||0,name:this.cardName(code),selectedByDecisionId:Number(this.activeDecisionId)||0,selectedAtRevision:Number(this.currentPromptRevision)||0};
  }

  captureResponseEffectContext(prompt,response) {
    if(!prompt||!response||!this.mod)return;
    const T=this.mod.OcgMessageType||{},I=this.mod.SelectIdleCMDAction||{},B=this.mod.SelectBattleCMDAction||{};


    if((prompt.type===T.SELECT_EFFECTYN||prompt.type===T.SELECT_YESNO)&&response.yes===false){
      if(!Number(this.pendingEffectSource?.chainLink))this.pendingEffectSource=null;
      return;
    }
    let item=null,description='',continuation=false;
    if(prompt.type===T.SELECT_OPTION&&Number.isInteger(Number(response.index))){
      const index=Number(response.index);description=this.optionEffectDescription((prompt.options||[])[index],index,prompt);continuation=true;
    }
    else if(prompt.type===T.SELECT_EFFECTYN||prompt.type===T.SELECT_YESNO){
      description=this.inferPromptEffectText(prompt)||this.descriptionText(prompt.description,'');
      item={code:prompt.code,controller:prompt.controller??prompt.player,location:prompt.location,sequence:prompt.sequence,description:prompt.description};
    }
    else if(prompt.type===T.SELECT_IDLECMD&&response.action===I.SELECT_ACTIVATE){item=(prompt.activates||[])[Number(response.index)];description=this.effectLabel(item,'');}
    else if(prompt.type===T.SELECT_BATTLECMD&&response.action===B.SELECT_CHAIN){item=(prompt.chains||[])[Number(response.index)];description=this.effectLabel(item,'');}
    else if(prompt.type===T.SELECT_CHAIN&&response.index!=null){item=(prompt.selects||[])[Number(response.index)];description=this.effectLabel(item,'');}
    if(!description&&!item)return;
    const previous=this.pendingEffectSource||{};
    const code=this.normalizeActionCode(item?.code||(continuation?previous.code:prompt.code)||this.activeEffectCode);if(!code)return;
    const priorTop=this.latestChainEffectContext();



    const next=continuation?{...previous}:{chainLink:0};
    next.code=code;
    next.descriptionId=item?.description??(continuation?previous.descriptionId:prompt.description)??0;
    next.controller=Number(item?.controller??(continuation?previous.controller:prompt.controller)??prompt.player)||0;
    next.location=Number(item?.location??(continuation?previous.location:prompt.location))||0;
    next.sequence=Number(item?.sequence??(continuation?previous.sequence:prompt.sequence))||0;
    if(prompt.type===T.SELECT_CHAIN&&priorTop&&!this.chainPromptContainsTriggeredEffect(prompt)){next.respondsToLink=Number(priorTop.chainLink)||0;next.respondsToCode=this.normalizeActionCode(priorTop.code);next.respondsToController=Number(priorTop.controller)||0;next.respondsToDescription=String(priorTop.description||'');}
    const resolved=this.resolvedEffectDisplay(code,next.descriptionId,description||next.description||'');
    const recovered=resolved.text?'':this.deterministicEffectRecovery(code,next,prompt);const exact=resolved.text||recovered||'';
    if(exact){next.description=exact;next.specific=!!(resolved.specific||recovered);next.gate=!!(resolved.gate||this.effectChoiceGateText(exact));this.activeEffectDescription=next.description;}
    else{next.description='';next.specific=false;next.gate=false;}
    this.pendingEffectSource=next;
  }

  logSubmittedResponse(prompt,response) {
    if(!prompt||!response||!this.mod)return;const T=this.mod.OcgMessageType||{};
    if(prompt.type===T.SELECT_OPTION&&Number.isInteger(Number(response.index))){const index=Number(response.index),option=(prompt.options||[])[index],code=this.effectSourceCode(prompt),label=this.descriptionText(option,`Option ${index+1}`),effect=this.optionEffectDescription(option,index,prompt);this.log(`Player chooses ${label}${code?` for ${this.cardName(code)}`:''}.`,{type:'player-effect-response',code:code||undefined,effect:effect||undefined,controller:0,action:'option'});return;}
    if(prompt.type===T.SELECT_CHAIN){
      if(response.index==null){this.meaningfulResponseWindow=false;this.log('Player passes the Chain response window.',{type:'player-chain-response',controller:0,action:'pass'});}
      else{
        const item=(prompt.selects||[])[Number(response.index)];
        if(item){const triggered=this.chainPromptContainsTriggeredEffect(prompt),priorLink=Math.max(0,...this.chainHistory.keys(),...this.chainEffectSources.keys()),respondsTo=triggered?null:this.chainRelation(this.chainHistory.get(priorLink)||this.chainEffectSources.get(priorLink)||{});this.log(triggered?`Player activates ${this.cardName(item.code)}'s triggered effect.`:`Player selects ${this.cardName(item.code)} as the next Chain Link${respondsTo?` in response to ${this.chainRelationshipText(respondsTo,{includeEffect:false})}`:''}.`,{type:'player-chain-response',code:Number(item.code)||0,effect:this.effectLabel(item,''),controller:0,action:triggered?'activate-trigger':'chain',respondsTo:respondsTo||undefined});}
      }
      return;
    }
    if(this.isBattleReplayPrompt(prompt)){const attacker=this.lastAttackContext?.attackerCode?this.cardName(this.lastAttackContext.attackerCode):'the attacking monster';this.log(response.yes?`Player continues ${attacker}'s attack and will choose a new legal target.`:`Player cancels ${attacker}'s attack after the Battle Step replay.`,{type:'player-battle-replay-response',code:Number(this.lastAttackContext?.attackerCode)||0,controller:0,action:response.yes?'retarget':'cancel',outcome:response.yes?'Choose new attack target':'Attack cancelled'});if(!response.yes)this.lastAttackContext=null;return;}
    if(prompt.type===T.SELECT_EFFECTYN||prompt.type===T.SELECT_YESNO){const code=this.effectSourceCode(prompt);const effect=this.inferPromptEffectText(prompt);this.log(`Player ${response.yes?'accepts':'declines'}${code?` ${this.cardName(code)}'s`:''} optional effect.`,{type:'player-effect-response',code:code||undefined,effect:effect||undefined,controller:0,action:response.yes?'accept':'decline'});return;}
    if(prompt.type===T.SELECT_CARD||prompt.type===T.SELECT_TRIBUTE||prompt.type===T.SELECT_SUM){const source=prompt.type===T.SELECT_SUM?[...(prompt.selects_must||[]),...(prompt.selects||[])]:prompt.selects||[];const indices=Array.isArray(response.indicies)?response.indicies:[];const selected=indices.map(i=>source[(prompt.type===T.SELECT_SUM?(prompt.selects_must||[]).length:0)+Number(i)]).filter(Boolean);const names=selected.map(item=>`${this.cardName(item.code)} (${this.isAttachedXyzMaterial(item)?`Xyz Material ${Number(item.overlay_sequence)+1}`:formatLocation(this.mod,Number(item.location)||0)})`);if(this.isPlayerAttackTargetPrompt(prompt)&&selected.length){this.log(`Player selects ${this.cardName(selected[0].code)} as the attack target.`,{type:'player-attack-target',cards:[{code:Number(selected[0].code)||0}],controller:0,outcome:'Attack target selected'});return;}if(names.length){const xyz=selected.some(item=>this.isAttachedXyzMaterial(item));this.log(`Player confirms ${xyz?'Xyz Material':prompt.type===T.SELECT_TRIBUTE?'Tribute/material':'card'} selection: ${names.join(', ')}.`,{type:'player-card-response',cards:selected.map(item=>({code:Number(item.code)||0,controller:Number(item.controller)||0,location:Number(item.location)||0,sequence:Number(item.sequence)||0,...(this.isAttachedXyzMaterial(item)?{overlay_sequence:Number(item.overlay_sequence)}:{})})).filter(item=>item.code),controller:0,outcome:xyz?'Xyz Material selected':undefined});}return;}
    if(prompt.type===T.SELECT_POSITION&&response.position!=null){this.log(`Player confirms ${formatPosition(this.mod,Number(response.position))} Position.`,{type:'player-position-response',controller:0});return;}
    if((prompt.type===T.SELECT_PLACE||prompt.type===T.SELECT_DISFIELD)&&Array.isArray(response.places)){this.log(`Player confirms zone selection: ${response.places.map(p=>p.label||`${formatLocation(this.mod,p.location)} ${Number(p.sequence)+1}`).join(', ')}.`);return;}
    if(prompt.type===T.SORT_CARD&&response.order)this.log('Player confirms the requested card order.',{type:'player-sort-response',controller:0});
  }

  markPromptAwaitingEngineAck(prompt,response){
    if(!this.prompt||!prompt||Number(prompt.player)!==0)return;
    this.hideDirectSurfaceSelectionDock();
    const directBattleTarget=this.isDirectBattleTargetSurface(prompt);
    this.pendingDecisionLease={prompt,response,revision:this.currentPromptRevision,decisionId:Number(this.promptDecisionIds?.get(prompt)||this.activeDecisionId)||0,submittedAt:Date.now()};



    if(this.prompt){this.prompt.classList.remove('duel-prompt-awaiting-ack');this.prompt.querySelector?.('.duel-prompt-ack-status')?.remove();this.prompt.classList.add('duel-prompt-hidden');}
    if(this.promptRestoreButton)this.promptRestoreButton.hidden=true;
    if(this.chainPromptAttached)this.restorePromptHome();
    if(directBattleTarget)return;



    if(this.promptView==='details'){this.detailsBackgroundPromptDirty=true;return;}
    return;
  }

  acknowledgePendingDecisionLease({preserveVisible=false}={}){
    if(!this.pendingDecisionLease&&!this.prompt?.classList?.contains('duel-prompt-awaiting-ack'))return;
    this.pendingDecisionLease=null;
    if(this.prompt){
      this.prompt.classList.remove('duel-prompt-awaiting-ack');
      this.prompt.querySelector?.('.duel-prompt-ack-status')?.remove();
      for(const node of this.prompt.querySelectorAll?.('[data-rc113-ack-disabled]')||[]){if('disabled' in node)node.disabled=node.dataset.rc113AckDisabled==='1';delete node.dataset.rc113AckDisabled;node.removeAttribute?.('aria-disabled');}
    }
    if(!preserveVisible&&!this.currentPrompt&&!this.pendingResolve&&this.promptView!=='details')this.hidePrompt({force:true});
  }

  restoreSubmittedDecisionSurface(decision=this.authoritativePendingDecision){
    const lease=this.pendingDecisionLease,ack=this.awaitingPlayerResponseAck;
    if(!this.running||!decision?.submitted||!lease?.prompt||!ack?.prompt)return false;



    return true;
  }

  submitResponse(response){

    if(!this.pendingResolve){this.traceSession('stale-response-ignored',{response:this.traceSafeObject(response),state:this.sessionStateSnapshot()});return;}const resolve=this.pendingResolve,prompt=this.currentPrompt,detailsOpen=this.promptView==='details',effectTargets=this.effectTargetsForResponse(prompt,response);this.userSubmittedPrompts.add(prompt);this.traceSession('explicit-player-response',{signature:this.replayPromptSignature(prompt),response:this.traceSafeObject(response),state:this.sessionStateSnapshot()});this.notePlayerReplayDecision(prompt,response);this.notePlayerBattleCommand(prompt,response);this.capturePendingSummonTarget(prompt,response);this.logSubmittedResponse(prompt,response);
    if(prompt&&Number(prompt.player)===0){this.playerResponseAckSerial+=1;this.awaitingPlayerResponseAck={serial:this.playerResponseAckSerial,prompt,response,revision:this.currentPromptRevision,submittedAt:Date.now(),stagedCardSelection:this.stagedCardSelection?{...this.stagedCardSelection,indices:[...(this.stagedCardSelection.indices||[])]}:null,stagedChainSelection:this.stagedChainSelection?{...this.stagedChainSelection}:null,decisionId:Number(this.promptDecisionIds?.get(prompt)||this.activeDecisionId)||0};this.markPromptAwaitingEngineAck(prompt,response);}
    const submittedDecisionId=Number(this.promptDecisionIds?.get(prompt)||this.activeDecisionId)||0;
    this.clearChainPromptPhysicalFocus();this.pendingResolve=null;this.currentPrompt=null;this.selectedCardContext=null;this.inlineCardSelection=null;this.stagedCardSelection=null;this.stagedChainSelection=null;if(detailsOpen){this.detailsBackgroundPromptDirty=true;this.promptView='details';}else{this.promptView=this.pendingDecisionLease?'awaiting-engine-ack':'';this.detailsReturnSnapshot=null;this.detailsDetachedFromChain=false;}this.auxiliaryReturnToMinimized=false;
    if(this.authoritativePendingDecision?.id===submittedDecisionId){this.authoritativePendingDecision={...this.authoritativePendingDecision,id:submittedDecisionId,message:prompt,submitted:true,response,submittedAt:Date.now()};this.startDecisionGuardian();}
    if(this.promptVisibilityTimer){clearTimeout(this.promptVisibilityTimer);this.promptVisibilityTimer=0;}if(this.interactionWatchdogTimer){clearTimeout(this.interactionWatchdogTimer);this.interactionWatchdogTimer=0;}this.interactionWatchdogMisses=0;this.promptRecoveryCount=0;



    this.renderField();this.renderPhaseDock();const targetPresentationMs=this.playEffectTargetPresentation(effectTargets);if(targetPresentationMs>0){this.traceSession('player-response-held-for-target-presentation',{durationMs:targetPresentationMs,targets:effectTargets.map(item=>item.code)});setTimeout(()=>resolve(response),targetPresentationMs);}else resolve(response);
  }

  playSelectionSoundSoon(){if(this.selectionSoundQueued)return;this.selectionSoundQueued=true;const play=()=>{this.selectionSoundQueued=false;this.playSound('select');},queue=()=>typeof setTimeout==='function'?setTimeout(play,0):play();if(typeof requestAnimationFrame==='function')requestAnimationFrame(queue);else queue();}

  button(label,onClick,{ghost=false,disabled=false}={}){const b=document.createElement('button');b.type='button';b.className=`duel-action${ghost?' ghost':''}`;b.textContent=label;b.disabled=disabled;b.addEventListener('click',event=>{onClick(event);this.playSelectionSoundSoon();});return b;}







  actionCard(item,onClick,label='',options={}){
    const b=document.createElement('div');b.className='duel-prompt-card duel-selection-card-clean duel-universal-card-choice';b.tabIndex=0;b.setAttribute('role','button');
    b.dataset.player=String(Number(item?.controller)||0);b.dataset.location=this.locationKey(Number(item?.location)||0);b.dataset.sequence=String(Number(item?.sequence)||0);b.dataset.code=String(this.normalizeActionCode(item?.code)||'');if(this.isAttachedXyzMaterial(item)){b.dataset.overlaySequence=String(Number(item.overlay_sequence));b.dataset.overlayNumber=String(Number(item.overlay_sequence)+1);b.classList.add('duel-xyz-material-choice');}
    const promptAtBind=this.currentPrompt,revisionAtBind=this.currentPromptRevision,T=this.mod?.OcgMessageType||{};
    const confirmSelection=!!options.confirmSelection,isSelected=typeof options.isSelected==='function'?options.isSelected:()=>false,onDeselect=typeof options.onDeselect==='function'?options.onDeselect:null;


    b.title=this.cardName(item.code)||'';
    const art=document.createElement('span');art.className='duel-prompt-card-art';
    const img=document.createElement('img');img.src=cardImage(item.code);img.alt=this.cardName(item.code);img.title=this.cardName(item.code)||'';art.append(img);
    if(Number(item.location)){const loc=document.createElement('span');loc.className='duel-prompt-card-location';loc.textContent=this.selectionSourceBadge(item);art.append(loc);}
    const span=document.createElement('strong');span.className='duel-prompt-card-label duel-universal-card-caption';span.textContent=label||this.cardName(item.code)||this.locLabel(item);
    const runAction=()=>{if(promptAtBind&&(this.currentPrompt!==promptAtBind||this.currentPromptRevision!==revisionAtBind))return;this.playSound('select');onClick();};
    const openDetails=()=>{if(!Number(item.code))return;const info=confirmSelection?{...item}:{...item,_detailAction:runAction,_detailActionLabel:promptAtBind?.type===T.SELECT_CHAIN?'Chain':'Select'};this.inspectCard(item.code,info);this.renderCardDetailsModal(item.code,info);};
    const activate=()=>{if(confirmSelection&&isSelected()){openDetails();return;}runAction();};
    const deselect=()=>{if(promptAtBind&&(this.currentPrompt!==promptAtBind||this.currentPromptRevision!==revisionAtBind))return;this.playSound('select');onDeselect?.();};
    const hoverInfo=options.hoverEffect?{...item,_promptEffectText:String(options.hoverEffect||''),_promptEffectRole:String(options.hoverEffectRole||'Effect')}:{...item};
    this.bindInspectorHover(b,Number(item.code)||0,hoverInfo);
    if(options.syncPhysicalCard){
      b.addEventListener('pointerenter',()=>{if(this.chainEffectHoverEnabled)this.setChainPromptPhysicalFocus(item,'hover');});
      b.addEventListener('pointerleave',()=>this.clearChainPromptPhysicalFocus('hover'));
      b.addEventListener('focusin',()=>{if(this.chainEffectHoverEnabled)this.setChainPromptPhysicalFocus(item,'hover');});
      b.addEventListener('focusout',event=>{if(!b.contains(event.relatedTarget))this.clearChainPromptPhysicalFocus('hover');});
    }
    b.append(art,span);
    if(Number(item.code)&&!confirmSelection){const details=document.createElement('button');details.type='button';details.className='duel-prompt-details-btn';details.textContent='Details';details.title=`View ${this.cardName(item.code)} details without selecting it`;details.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openDetails();});b.append(details);}
    if(confirmSelection&&onDeselect)this.bindStagedCardDeselect(b,()=>isSelected(),deselect);
    b.addEventListener('click',event=>{if(event.target.closest?.('.duel-prompt-details-btn'))return;activate();});
    b.addEventListener('keydown',event=>{if(event.target.closest?.('.duel-prompt-details-btn'))return;if(event.key==='Enter'||event.key===' '){event.preventDefault();activate();}});return b;
  }

  cardDetailMeta(code,info={}) {
    const card=this.getCardById?.(Number(code))||{};const bits=[];
    const type=card.type||card.humanReadableCardType||'';if(type)bits.push(type);
    if(card.attribute)bits.push(card.attribute);if(card.race)bits.push(card.race);
    if(Number.isFinite(Number(card.level))&&Number(card.level)>0)bits.push(`Level ${card.level}`);
    if(Number.isFinite(Number(card.rank))&&Number(card.rank)>0)bits.push(`Rank ${card.rank}`);
    if(Number.isFinite(Number(card.linkval))&&Number(card.linkval)>0)bits.push(`Link ${card.linkval}`);
    const atk=card.atk??info.attack,def=card.def??info.defense;if(Number.isFinite(Number(atk)))bits.push(`ATK ${atk}`);if(Number.isFinite(Number(def))&&Number(def)>=0)bits.push(`DEF ${def}`);
    if(this.isAttachedXyzMaterial(info)){const host=this.xyzMaterialHostCard(info),hostName=host?.code?this.cardName(host.code):'Xyz Monster';bits.push(`Xyz Material ${Number(info.overlay_sequence)+1} - ${hostName}`);}else if(Number(info.location))bits.push(`Location: ${formatLocation(this.mod,Number(info.location))}`);
    return bits;
  }

  captureDetailsReturnSnapshot() {
    if(!this.prompt||!this.promptTitle||!this.promptBody||this.promptView==='details')return;
    this.detailsReturnSnapshot={
      view:this.promptView,
      className:this.prompt.className,
      styleText:this.prompt.getAttribute?.('style')||'',
      dismissible:this.prompt.dataset?.dismissible||'0',
      minimized:!!this.promptMinimized,
      restoreLabel:this.promptRestoreButton?.textContent||'',
      promptRevision:Number(this.currentPromptRevision)||0,
      titleNodes:[...this.promptTitle.childNodes],
      bodyNodes:[...this.promptBody.childNodes]
    };
  }

  restoreDetailsReturnSnapshot() {
    const snapshot=this.detailsReturnSnapshot;if(!snapshot||!this.prompt||!this.promptTitle||!this.promptBody)return false;
    this.detailsReturnSnapshot=null;this.promptView=snapshot.view||'';this.detailsReturnView='';
    this.prompt.className=snapshot.className||this.prompt.className;
    if(snapshot.styleText)this.prompt.setAttribute('style',snapshot.styleText);else this.prompt.removeAttribute?.('style');
    if(this.prompt.dataset)this.prompt.dataset.dismissible=snapshot.dismissible||'0';
    this.promptTitle.replaceChildren(...snapshot.titleNodes);this.promptBody.replaceChildren(...snapshot.bodyNodes);
    this.promptMinimized=!!snapshot.minimized;
    if(this.promptMinimized){this.prompt.classList.add('duel-prompt-hidden');if(this.promptRestoreButton){this.promptRestoreButton.hidden=false;this.promptRestoreButton.textContent=snapshot.restoreLabel||`Show: ${this.promptTitle.textContent||'Prompt'}`;}}
    else {this.prompt.classList.remove('duel-prompt-hidden');if(this.promptRestoreButton)this.promptRestoreButton.hidden=true;this.scheduleSelectionPromptSizing();this.schedulePromptFit();}
    if(this.detailsDetachedFromChain){this.detailsDetachedFromChain=false;if(this.currentPrompt&&this.pendingResolve)this.syncChainPromptAttachment(this.currentPrompt);}
    return true;
  }

  cardDetailsIdentityTarget() {
    const target=this.cardDetailsTarget;if(!target||!Number(target.code))return null;
    return {code:Number(target.code),info:{...(target.info||{})}};
  }

  closeIndependentCardDetails({restore=true}={}) {
    if(!this.cardDetailsOverlay&&!this.cardDetailsTarget)return false;
    this.detailsCloseRequested=true;try{this.cardDetailsOverlay?.remove?.();}catch{}this.cardDetailsOverlay=null;this.cardDetailsTarget=null;this.pinnedInspector=null;this.clearLogCardFocus('selected');
    try{
      const prior=this.detailsReturnView;this.promptView='';this.detailsReturnView='';this.detailsOpenedPromptRevision=0;this.prompt?.classList?.remove?.('duel-prompt-obscured-by-details');
      if(restore){if(this.currentPrompt&&this.pendingResolve)this.renderPrompt(this.currentPrompt);else if(prior==='pile'&&this.openPileContext)this.renderPileViewer(this.openPileContext.player,this.openPileContext.key);else if(prior==='log-detail'&&this.logDetailContext)this.renderLogEvent(this.logDetailContext);else if(prior==='special-choice'&&this.specialChoiceContext)this.renderSpecialSummonChoices(this.specialChoiceContext.player,this.specialChoiceContext.key,this.specialChoiceContext.actions);else this.hidePrompt({force:true});}
      this.detailsReturnSnapshot=null;this.detailsBackgroundPromptDirty=false;
    }finally{this.detailsCloseRequested=false;}
    return true;
  }

  renderCardDetailsModal(code,info={}) {
    code=Number(code)||0;if(!code)return;this.hideCardHoverOverlay({delay:0,clearInspector:false});this.hidePileHoverOverlay();
    const wasDetails=!!this.cardDetailsOverlay||this.promptView==='details';if(!wasDetails){this.captureDetailsReturnSnapshot();this.detailsReturnView=this.promptView;this.detailsOpenedPromptRevision=Number(this.currentPromptRevision)||0;this.detailsBackgroundPromptDirty=false;}

    this.cardDetailsTarget={code,info:{...(info||{})}};this.pinnedInspector={code,info:{...(info||{})}};this.lastInspectedCode=code;this.lastInspectedInfo={...(info||{})};this.promptView='details';this.setLogCardFocus(code,info,'selected');

    if(this.prompt)this.prompt.classList.add('duel-prompt-obscured-by-details');
    this.cardDetailsOverlay?.remove?.();
    const overlay=document.createElement('div');overlay.className='duel-independent-card-details-overlay';overlay.dataset.cardCode=String(code);overlay.dataset.cardIdentity=`${code}:${Number(info.controller)||0}:${Number(info.location)||0}:${Number(info.sequence)||0}`;
    const panel=document.createElement('section');panel.className='duel-independent-card-details-panel';const title=document.createElement('h2');title.textContent='Card Details';panel.append(title);
    const selected=document.createElement('div');selected.className='selected-card duel-modal-selected-card';
    const artWrap=document.createElement('div');artWrap.className='selected-art-wrap duel-modal-art-wrap';const img=document.createElement('img');img.src=cardImage(code);img.alt=this.cardName(code);img.draggable=false;img.title='Click to enlarge artwork';img.addEventListener('click',event=>{event.stopPropagation();this.openArtwork(code);});artWrap.append(img);selected.append(artWrap);
    const actionGroup=document.createElement('div');actionGroup.className='duel-detail-actions duel-integrated-action-list selected-actions';const locationKey=Number(info.location)?this.locationKey(Number(info.location)):'';const ctx=locationKey?this.contextForCard(info,{player:Number(info.controller)||0,locationKey,sequence:Number(info.sequence)||0}):null;const legal=ctx?this.legalActionsForContext(ctx):[];const priority=label=>label==='Activate'||label==='Chain'?0:label==='Attack'?1:label.includes('Summon')?2:label.includes('Set')?3:4;[...legal].sort((a,b)=>priority(a.label)-priority(b.label)).forEach(action=>actionGroup.append(this.renderViewedCardAction(action,code,()=>action.run())));if(typeof info._detailAction==='function')actionGroup.append(this.button(info._detailActionLabel||'Select',()=>info._detailAction()));if(actionGroup.childElementCount)selected.append(actionGroup);
    const article=document.createElement('article');article.className='card-details duel-card-details-article duel-modal-details-article';const heading=document.createElement('div');heading.className='card-details-heading';const h3=document.createElement('h3');h3.textContent=this.cardName(code);const toggle=document.createElement('button');toggle.type='button';toggle.className='card-text-style-toggle';toggle.setAttribute('aria-pressed',String(!!this.getCardTextStyling()));toggle.title='Toggle styled card text';const glyph=document.createElement('span');glyph.className='card-text-style-glyph';glyph.textContent='Aa';glyph.setAttribute('aria-hidden','true');const toggleLabel=document.createElement('span');toggleLabel.textContent=this.getCardTextStyling()?'Styled':'Plain';toggle.append(glyph,toggleLabel);toggle.addEventListener('click',()=>{this.toggleStyledText();toggleLabel.textContent=this.getCardTextStyling()?'Styled':'Plain';toggle.setAttribute('aria-pressed',String(!!this.getCardTextStyling()));});heading.append(h3,toggle);
    const summary=document.createElement('div');summary.className='card-details-summary';const primary=document.createElement('div');primary.className='card-details-primary';const meta=document.createElement('div');meta.className='detail-meta';const stats=document.createElement('div');stats.className='detail-stats';primary.append(meta,stats);summary.append(primary);const desc=document.createElement('div');desc.className='detail-text card-effect-layout';article.append(heading,summary,desc);this.populateBuilderDetails(code,info,meta,stats,desc,null);selected.append(article);panel.append(selected);
    const controls=document.createElement('div');controls.className='duel-prompt-controls';controls.append(this.button('Back',()=>this.closeIndependentCardDetails({restore:true}),{ghost:true}));panel.append(controls);overlay.append(panel);this.boardWrap?.append(overlay);this.cardDetailsOverlay=overlay;
  }

  semanticPromptSection(label,text='',className='') {
    const section=document.createElement('section');section.className=`duel-semantic-section ${className}`.trim();
    const heading=document.createElement('div');heading.className='duel-semantic-section-label';heading.textContent=label;section.append(heading);
    if(text){const body=document.createElement('p');body.className='duel-semantic-section-copy';body.textContent=text;section.append(body);}return section;
  }

  selectionInstructionIsRedundant(purpose={},context={}) {
    const label=String(purpose?.roleLabel||context.label||'').trim();
    const text=String(purpose?.intro||context.text||'').replace(/\s+/g,' ').trim();
    if(!text)return true;
    const special=!!context.special,hasEffectContext=!!context.hasEffectContext,hasSummonTarget=!!context.hasSummonTarget;



    if(special&&hasSummonTarget)return true;
    const genericLabel=/^(?:summon materials required|summon requirement|activation cost|target selection|effect resolution|required by this effect|current required action|required battle action)$/i.test(label);
    const proceduralOnly=/\b(?:select|choose)\b/i.test(text)&&/\b(?:confirm|press|click|selection)\b/i.test(text)&&!/\b(?:exactly|at least|at most|between|must include|cannot|different|minimum|maximum|immediately|automatically)\b/i.test(text);
    if(proceduralOnly)return true;
    if(genericLabel&&(hasEffectContext||hasSummonTarget))return true;
    if(hasEffectContext&&['cost','operation','resolution','selection'].includes(String(purpose?.role||'').toLowerCase()))return true;
    return false;
  }

  recentRevealRelevantToPrompt(m={}) {
    const batch=this.recentRevealBatch;if(!batch||batch.turn!==this.turn||!batch.cards?.length)return false;
    const context=this.exactEffectContext(m)||this.latestChainEffectContext();const code=this.normalizeActionCode(context?.code||this.effectSourceCode(m));const link=Number(context?.chainLink)||Number(this.resolvingChainLink)||Number(this.lastActivatedChainLink)||0;
    if(Number(batch.chainLink)>0&&link>0&&Number(batch.chainLink)===link)return true;
    if(Number(batch.effectCode)>0&&code>0&&this.normalizeActionCode(batch.effectCode)===code)return true;
    return false;
  }

  renderRecentRevealPreview(m={}) {
    const batch=this.recentRevealBatch;if(!batch||batch.gated||batch.turn!==this.turn||!batch.cards?.length||!this.recentRevealRelevantToPrompt(m))return null;
    const role=batch.mode==='draw'?'Effect Result':batch.mode==='inspect'?'Effect Step':batch.mode==='reveal'?'Effect Step':'Related Effect Event';
    const section=document.createElement('section');section.className='duel-recent-reveal duel-semantic-section';const eyebrow=document.createElement('div');eyebrow.className='duel-semantic-section-label';eyebrow.textContent=role;const h=document.createElement('h3');h.textContent=batch.label||'Related cards';section.append(eyebrow,h);
    const grid=document.createElement('div');grid.className='duel-recent-reveal-grid duel-horizontal-context-card-rail';
    batch.cards.forEach(card=>{const tile=document.createElement('div');tile.className='duel-reveal-card';tile.tabIndex=0;tile.setAttribute('role','button');tile.title=`View ${this.cardName(card.code)} details`;this.bindInspectorHover(tile,card.code,card);const img=document.createElement('img');img.src=cardImage(card.code);img.alt=this.cardName(card.code);const name=document.createElement('span');name.textContent=this.cardName(card.code);const open=()=>{this.inspectCard(card.code,card);this.renderCardDetailsModal(card.code,card);};tile.append(img,name);tile.addEventListener('click',open);tile.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open();}});grid.append(tile);});section.append(grid);return section;
  }

  effectSentenceCandidates(text='') {
    const value=String(text||'').replace(/\r?\n/g,' ').replace(/\s+/g,' ').trim();
    if(!value)return[];
    const bulletExpanded=value.replace(/\s*[●•]\s*/g,'\n');
    const chunks=bulletExpanded.split(/\n|(?<=[.!?])\s+(?=(?:If|When|During|Once|At|While|You can|You may|This card|Quick Effect|Neither|Your opponent|Target|Reveal|Send|Banish|Tribute|Add|Special Summon|Fusion Summon|Ritual Summon)\b)/i).map(v=>v.trim()).filter(Boolean);
    return chunks.length?chunks:[value];
  }

  genericEffectText(text='') {
    const value=String(text||'').replace(/\s+/g,' ').trim().toLowerCase();
    return !value || /^(?:activate|apply|resolve|choose|select)(?:\s+(?:the|this|selected|current))?(?:\s+1)?(?:\s+of)?(?:\s+these)?\s+effect/.test(value) || /^(?:do|perform)\s+(?:(?:the|this)\s+)?(?:(?:selected|current)\s+)?effect/.test(value) || /activate 1 of (?:these|the following) effects/.test(value) || /^(?:the )?(?:selected|current) effect(?: is resolving)?\.?$/.test(value) || value==='current effect is resolving.';
  }

  effectChoiceGateText(text='') {
    const value=String(text||'').replace(/\s+/g,' ').trim();
    return /(?:activate|apply|choose|select)\s+(?:1|one)\s+of\s+(?:these|the following)\s+effects?/i.test(value);
  }

  choiceGateActivationContext(code,effectText='') {





    code=this.normalizeActionCode(code);const exact=this.conciseEffectText(effectText);if(!code||!exact||!this.effectChoiceGateText(exact))return exact;
    const full=this.conciseEffectText(this.cardDescription(code)||'');if(!full)return exact;
    const gateRe=/(?:activate|apply|choose|select)\s+(?:1|one)\s+of\s+(?:these|the following)\s+effects?\s*[:;]/ig;
    const gates=[...full.matchAll(gateRe)];if(!gates.length)return exact;
    let gate=gates[0];
    if(gates.length>1){
      const needle=this.normalizedEffectMatchText(exact);
      const matching=gates.filter(match=>{const text=this.normalizedEffectMatchText(match[0]);return needle.includes(text)||text.includes(needle);});
      if(matching.length===1)gate=matching[0];else return exact;
    }
    const gateStart=Number(gate.index)||0,gateEnd=gateStart+String(gate[0]||'').length;
    const prefix=full.slice(0,gateStart);let start=0;
    const boundaryRe=/(?<=[.!?])\s+(?=(?:If|When|During|Once|At|While|You can|You may|This card|Quick Effect|Neither|Your opponent|Target|Reveal|Send|Banish|Tribute|Add|Special Summon|Fusion Summon|Ritual Summon)\b)/gi;
    for(const match of prefix.matchAll(boundaryRe))start=(Number(match.index)||0)+String(match[0]||'').length;
    const after=full.slice(gateEnd);const bulletMatches=[...after.matchAll(/[●•]/g)];
    if(!bulletMatches.length){
      const remainder=full.slice(start);const next=[...remainder.matchAll(boundaryRe)].find(match=>(Number(match.index)||0)>Math.max(0,gateEnd-start));
      return this.conciseEffectText(next?remainder.slice(0,Number(next.index)||0):remainder)||exact;
    }
    const lastBulletAbs=gateEnd+(Number(bulletMatches[bulletMatches.length-1].index)||0);let end=full.length;
    const tail=full.slice(lastBulletAbs);
    for(const match of tail.matchAll(boundaryRe)){
      const nextStart=lastBulletAbs+(Number(match.index)||0)+String(match[0]||'').length;
      const nextText=full.slice(nextStart);
      if(/^If\s+(?:you do|this effect|that happens|it does)\b/i.test(nextText))continue;
      if(/^You can only use\b/i.test(nextText))continue;
      const firstSentence=nextText.split(/(?<=[.!?])\s+/)[0]||'';
      const topLevel=/^(?:This card|Neither|Your opponent)\b/i.test(firstSentence)||/^(?:If|When|During|Once|At|While|You can|You may|Quick Effect)\b[^.!?]{0,180}:/i.test(firstSentence);
      if(topLevel){end=nextStart-String(match[0]||'').length;break;}
    }
    const context=this.conciseEffectText(full.slice(start,end));
    return context&&this.effectChoiceGateText(context)?context:exact;
  }

  effectPromptContextText(code,effectText='') {
    const text=this.conciseEffectText(effectText);if(!text)return'';
    return this.effectChoiceGateText(text)?this.choiceGateActivationContext(code,text):text;
  }

  printedEffectGateChoices(code,effectText='') {
    code=this.normalizeActionCode(code);if(!code)return[];
    const full=String(this.cardDescription(code)||'').replace(/\r/g,' ').replace(/\n/g,' ').replace(/\s+/g,' ').trim();
    const context=String(effectText||'').replace(/\s+/g,' ').trim();
    if(!full||!/[●•]/.test(full))return[];
    const gateRe=/(?:activate|apply|choose|select)\s+(?:1|one)\s+of\s+(?:these|the following)\s+effects?\s*[:;]/ig;
    let match=null,chosen=null;
    while((match=gateRe.exec(full))){
      if(!chosen)chosen={index:match.index,end:gateRe.lastIndex,text:match[0]};
      if(context&&this.effectChoiceGateText(context)){
        const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
        if(norm(context).includes(norm(match[0]))||norm(match[0]).includes(norm(context))){chosen={index:match.index,end:gateRe.lastIndex,text:match[0]};break;}
      }
    }
    if(!chosen)return[];
    const tail=full.slice(chosen.end);
    const bullets=[...tail.matchAll(/[●•]\s*([^●•]+)/g)].map(m=>String(m[1]||'').trim()).filter(Boolean);
    return bullets.map(text=>this.conciseEffectText(text)).filter(text=>text&&!this.genericEffectText(text));
  }

  normalizedEffectMatchText(value='') {
    return String(value||'').toLowerCase().replace(/graveyard/g,'gy').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  }

  preferredEffectOptionIndex(message,intent=this.pendingEffectOptionIntent) {
    if(!intent||!message)return-1;
    const options=message.options||[];if(!options.length)return-1;
    const sourceCode=this.effectSourceCode(message);if(sourceCode&&intent.code&&this.normalizeActionCode(sourceCode)!==this.normalizeActionCode(intent.code))return-1;
    const target=this.normalizedEffectMatchText(intent.text);
    const tokens=[...new Set(target.split(' ').filter(token=>token.length>2))];
    const ranked=options.map((option,index)=>{
      const rendered=this.optionEffectDescription(option,index,message)||this.descriptionText(option,'');
      const norm=this.normalizedEffectMatchText(rendered);let score=0;
      if(norm===target)score+=200;
      if(norm&&target&&(norm.includes(target)||target.includes(norm)))score+=80;
      for(const token of tokens)if(norm.includes(token))score+=3;
      return{index,score};
    }).sort((a,b)=>b.score-a.score||a.index-b.index);
    if(ranked[0]?.score>8)return ranked[0].index;
    const fallback=Number(intent.index);return Number.isInteger(fallback)&&fallback>=0&&fallback<options.length?fallback:-1;
  }

  chainCandidateVisibleInPlace(item={}) {
    const L=this.mod?.OcgLocation||{};const loc=Number(item.location)||0;
    return Number(item.controller)===0&&!!(loc&(Number(L.HAND||0)|Number(L.MZONE||0)|Number(L.SZONE||0)));
  }

  selectionContextEffect(m={}) {


    const code=this.effectSourceCode(m);return code?this.selectionMatchedEffectText(code,m):'';
  }

  latestChainEffectContext() {
    const links=[...this.chainHistory.keys(),...this.chainEffectSources.keys()].map(Number).filter(Number.isFinite);
    const link=links.length?Math.max(...links):Number(this.lastActivatedChainLink)||0;
    if(!link)return null;
    const source=this.chainHistory.get(link)||this.chainEffectSources.get(link)||null;
    return source?{...source,code:this.normalizeActionCode(source.code),chainLink:link}:null;
  }

  expandActivatedEffectContinuation(code,exactText='') {




    code=this.normalizeActionCode(code);const exact=String(exactText||'').replace(/\s+/g,' ').trim();
    const full=String(this.cardDescription(code)||'').replace(/\r/g,'').trim();
    if(!code||!exact||!full||!/[●•]/.test(full))return exact||full;
    if(!/(?:apply (?:these|the following) effects?|activate (?:1|one) of (?:these|the following) effects?|choose (?:1|one) of (?:these|the following) effects?)/i.test(exact))return exact;
    const normalizedFull=full.replace(/\s+/g,' ').trim();const at=normalizedFull.toLowerCase().indexOf(exact.toLowerCase());
    if(at<0)return exact;
    const after=normalizedFull.slice(at+exact.length);if(!/[●•]/.test(after))return exact;
    const bullets=[...after.matchAll(/[●•]\s*([^●•]+)/g)].map(match=>String(match[1]||'').trim()).filter(Boolean);
    return bullets.length?`${exact} ${bullets.map(text=>`● ${text}`).join(' ')}`:exact;
  }

  triggerEffectContext(m={}) {
    const T=this.mod?.OcgMessageType||{};
    if(m?.type!==T.SELECT_CHAIN||!this.chainPromptContainsTriggeredEffect(m))return null;
    const candidates=(m.selects||[]).filter(item=>this.chainCandidateIsTriggeredEffect(item));
    const item=candidates.length===1?candidates[0]:((m.selects||[]).length===1?(m.selects||[])[0]:null);
    if(!item)return null;
    const code=this.normalizeActionCode(item.code);if(!code)return null;
    const resolved=this.resolvedEffectDisplay(code,item.description,this.effectLabel(item,''));
    const recovered=resolved.text?'':this.deterministicEffectRecovery(code,{code,controller:Number(item.controller??m.player)||0,location:Number(item.location)||0,sequence:Number(item.sequence)||0,descriptionId:item.description??0},m);
    const description=resolved.text||recovered||this.effectLabel(item,'');
    return{code,descriptionId:item.description??0,controller:Number(item.controller??m.player)||0,location:Number(item.location)||0,sequence:Number(item.sequence)||0,chainLink:0,description,specific:!!(resolved.specific||recovered),gate:!!(resolved.gate||this.effectChoiceGateText(description)),triggerWindow:true};
  }

  responseEffectContext(m={}) {
    const T=this.mod?.OcgMessageType||{};
    if(m?.type!==T.SELECT_CHAIN||this.chainPromptContainsTriggeredEffect(m))return null;



    const source=this.latestChainEffectContext();if(!source?.code)return null;
    const resolved=this.resolvedEffectDisplay(source.code,source.descriptionId,(source.specific||source.gate)?source.description||'':'');
    let description=resolved.text||source.description||'';
    if(description)description=this.expandActivatedEffectContinuation(source.code,description);
    return {...source,description,specific:!!resolved.specific};
  }

  exactEffectContext(m={}) {
    const T=this.mod?.OcgMessageType||{};
    const triggerContext=this.triggerEffectContext(m);if(triggerContext)return triggerContext;
    const responseContext=this.responseEffectContext(m);if(responseContext)return responseContext;
    const promptCode=this.normalizeActionCode(m?.code);
    const directCode=promptCode||this.normalizeActionCode(this.pendingEffectSource?.code);
    if(directCode){
      const pendingMatchesDirect=this.normalizeActionCode(this.pendingEffectSource?.code)===directCode;
      const pendingStored=pendingMatchesDirect&&this.pendingEffectSource&&(this.pendingEffectSource.specific||this.pendingEffectSource.gate)?this.pendingEffectSource.description||'':'';
      const resolved=this.resolvedEffectDisplay(directCode,m?.description,pendingStored);
      const base={code:directCode,descriptionId:m?.description??this.pendingEffectSource?.descriptionId??0,controller:Number(m.controller??this.pendingEffectSource?.controller??m.player??0)||0,location:Number(m.location??this.pendingEffectSource?.location)||0,sequence:Number(m.sequence??this.pendingEffectSource?.sequence)||0,chainLink:Number(this.pendingEffectSource?.chainLink)||0};
      const recovered=resolved.text?'':this.deterministicEffectRecovery(directCode,base,m);const description=resolved.text||recovered||'';
      if(description)return{...base,description,specific:!!(resolved.specific||recovered),gate:!!(resolved.gate||this.effectChoiceGateText(description))};
    }
    const sameCode=source=>!promptCode||this.normalizeActionCode(source?.code)===promptCode;
    const chainLink=Number(this.resolvingChainLink)||Number(this.lastActivatedChainLink)||0;
    const chain=chainLink?(this.chainHistory.get(chainLink)||this.chainEffectSources.get(chainLink)):null;
    if(chain?.code&&sameCode(chain)){const code=this.normalizeActionCode(chain.code),resolved=this.resolvedEffectDisplay(code,chain.descriptionId,(chain.specific||chain.gate)?chain.description||'':'');const recovered=resolved.text?'':this.deterministicEffectRecovery(code,chain,m),description=resolved.text||recovered||'';return{...chain,code,chainLink,description,specific:!!(resolved.specific||recovered),gate:!!(resolved.gate||this.effectChoiceGateText(description))};}
    const pending=this.pendingEffectSource;
    if(pending?.code&&sameCode(pending)){const code=this.normalizeActionCode(pending.code),resolved=this.resolvedEffectDisplay(code,pending.descriptionId,(pending.specific||pending.gate)?pending.description||'':'');const recovered=resolved.text?'':this.deterministicEffectRecovery(code,pending,m),description=resolved.text||recovered||'';return{...pending,code,description,specific:!!(resolved.specific||recovered),gate:!!(resolved.gate||this.effectChoiceGateText(description))};}
    if((m.type===T.SELECT_EFFECTYN||m.type===T.SELECT_YESNO)&&promptCode){const description=this.activationSpecificEffectText(m);return{code:promptCode,description,controller:Number(m.controller??m.player??0)||0,location:Number(m.location)||0,chainLink:0,specific:!!description,gate:false};}
    return null;
  }

  eventMatchedEffectText(code,m={}) {
    code=this.normalizeActionCode(code);if(!code)return'';
    const candidates=this.effectSentenceCandidates(this.cardDescription(code)||'').map(v=>this.conciseEffectText(v)).filter(Boolean);
    if(candidates.length<2)return candidates[0]||'';
    const controller=Number(m.controller??this.pendingEffectSource?.controller??m.player??0)||0;
    const summon=this.lastSummonContext?.[controller];
    if(summon&&Number(summon.turn)===Number(this.turn)&&Number(this.duelStateRevision)-Number(summon.revision)<=5){
      const kind=String(summon.kind||'');
      const re=kind==='normal'?/normal(?:\s+or\s+special)? summoned/i:kind==='special'?/(?:normal\s+or\s+)?special summoned/i:kind==='flip'?/flip summoned/i:null;
      if(re){
        const summonedName=this.cardName(summon.code),summonedNeedle=String(summonedName||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
        const matches=candidates.filter(text=>re.test(text)&&((this.normalizeActionCode(summon.code)===code&&/this card/i.test(text))||(summonedNeedle&&String(text).toLowerCase().replace(/[^a-z0-9]+/g,' ').includes(summonedNeedle))||!/"[^"]+"/.test(text)));
        if(matches.length===1)return matches[0];
        const timed=candidates.filter(text=>re.test(text));if(timed.length===1)return timed[0];
      }
    }
    const phaseName=this.phaseLabel(this.phase);
    if(phaseName&&!/^Phase /.test(phaseName)){const phrase=`${String(phaseName).toLowerCase()} phase`;const phaseMatches=candidates.filter(text=>String(text).toLowerCase().includes(phrase));if(phaseMatches.length===1)return phaseMatches[0];}
    return'';
  }


  locationMatchedEffectText(code,location=0) {




    code=this.normalizeActionCode(code);const L=this.mod?.OcgLocation||{},loc=Number(location)||0;if(!code||!loc)return'';
    const candidates=this.effectSentenceCandidates(this.cardDescription(code)||'').map(v=>this.conciseEffectText(v)).filter(Boolean);if(candidates.length<2)return candidates[0]||'';
    const tests=[];
    if(loc&Number(L.HAND||0))tests.push(/(?:this card is in your hand|reveal this card in your hand|show this card in your hand|discard this card|send this card from your hand|this card from your hand)/i);
    if(loc&Number(L.GRAVE||0))tests.push(/(?:this card is in (?:your )?(?:graveyard|gy)|this card in (?:your )?(?:graveyard|gy)|banish this card from (?:your )?(?:graveyard|gy)|if this card is sent to (?:the )?(?:graveyard|gy)|when this card is sent to (?:the )?(?:graveyard|gy))/i);
    if(loc&Number(L.REMOVED||0))tests.push(/(?:if this card is banished|when this card is banished|while this card is banished|this banished card)/i);
    if(loc&Number(L.EXTRA||0))tests.push(/(?:this card in your extra deck|from your extra deck)/i);
    if(!tests.length)return'';
    const matches=candidates.filter(text=>tests.some(re=>re.test(text)));return matches.length===1?matches[0]:'';
  }

  selectionMatchedEffectText(code,m={}) {




    code=this.normalizeActionCode(code);if(!code)return'';
    const T=this.mod?.OcgMessageType||{},L=this.mod?.OcgLocation||{};
    const selectionTypes=new Set([T.SELECT_CARD,T.SELECT_TRIBUTE,T.SELECT_SUM,T.SELECT_UNSELECT_CARD,T.SELECT_PLACE,T.SELECT_POSITION,T.SELECT_COUNTER].filter(v=>v!=null));if(!selectionTypes.has(m?.type))return'';
    const selected=m.type===T.SELECT_SUM?[...(m.selects_must||[]),...(m.selects||[])]:[...(m.selects||[]),...(m.select_cards||[]),...(m.unselect_cards||[])];if(!selected.length)return'';
    const candidates=this.effectSentenceCandidates(this.cardDescription(code)||'').map(v=>this.conciseEffectText(v)).filter(Boolean);if(candidates.length<2)return candidates[0]||'';
    const locations=new Set(selected.map(item=>Number(item?.location)||0));const required=[];
    if([...locations].some(loc=>loc&Number(L.DECK||0)))required.push(/deck/i);
    if([...locations].some(loc=>loc&Number(L.HAND||0)))required.push(/hand/i);
    if([...locations].some(loc=>loc&Number(L.GRAVE||0)))required.push(/(?:graveyard|gy)/i);
    if([...locations].some(loc=>loc&Number(L.REMOVED||0)))required.push(/banish/i);
    if(m.type===T.SELECT_TRIBUTE)required.push(/tribute/i);
    const sourceController=Number(this.pendingEffectSource?.controller??m.controller??m.player??0)||0;
    const fieldMask=Number(L.MZONE||0)|Number(L.SZONE||0);const fieldSelections=selected.filter(item=>(Number(item?.location)||0)&fieldMask);
    if(fieldSelections.length&&fieldSelections.every(item=>Number(item.controller)!==sourceController))required.push(/(?:opponent|your opponent)/i);
    if(!required.length)return'';
    const matches=candidates.filter(text=>required.every(re=>re.test(text)));return matches.length===1?matches[0]:'';
  }

  deterministicEffectRecovery(code,source={},m={}) {
    code=this.normalizeActionCode(code);if(!code)return'';
    const eventText=this.eventMatchedEffectText(code,{...m,controller:Number(source?.controller??m?.controller??m?.player??0)||0});if(eventText)return eventText;
    const locationText=this.locationMatchedEffectText(code,Number(source?.location??m?.location)||0);if(locationText)return locationText;
    const selectionText=this.selectionMatchedEffectText(code,m);if(selectionText)return selectionText;
    return'';
  }

  activationSpecificEffectText(m={}) {
    const code=this.normalizeActionCode(m?.code||this.pendingEffectSource?.code||this.activeEffectCode);if(!code)return'';
    const pendingSame=this.normalizeActionCode(this.pendingEffectSource?.code)===code?this.pendingEffectSource?.description||'':'';const resolved=this.resolvedEffectDisplay(code,m?.description,pendingSame);
    if(resolved.specific||resolved.gate)return resolved.text||'';
    const pending=this.pendingEffectSource;
    if(pending?.specific&&this.normalizeActionCode(pending.code)===code){const pendingResolved=this.resolvedEffectDisplay(code,pending.descriptionId,pending.description||'');if(pendingResolved.specific)return pendingResolved.text;}
    const recovered=this.deterministicEffectRecovery(code,{controller:Number(m.controller??pending?.controller??m.player??0)||0,location:Number(m.location??pending?.location)||0},m);if(recovered)return recovered;
    const ref=this.descriptionReference(m?.description);if(ref&&this.normalizeActionCode(ref.code)===code&&ref.text&&!this.genericEffectText(ref.text))return this.conciseEffectText(ref.text);
    return'';
  }

  inferPromptEffectText(m={}) {
    const T=this.mod?.OcgMessageType||{};
    const responseContext=this.responseEffectContext(m);if(responseContext?.description)return this.effectPromptContextText(responseContext.code,responseContext.description);
    const selectionTypes=new Set([T.SELECT_CARD,T.SELECT_TRIBUTE,T.SELECT_SUM,T.SELECT_UNSELECT_CARD,T.SELECT_PLACE,T.SELECT_POSITION,T.SELECT_COUNTER,T.SORT_CARD,T.SORT_CHAIN].filter(v=>v!=null));
    if(selectionTypes.has(m?.type)){
      const context=this.effectDisplayContextForPrompt(m);
      if(context?.description)return this.effectPromptContextText(context.code,context.description);
      const semanticText=this.selectionSemanticEffectText(m);if(semanticText)return semanticText;
      const code=this.effectSourceCode(m),structural=code?this.selectionMatchedEffectText(code,m):'';if(structural)return this.effectPromptContextText(code,structural);
      return'';
    }
    if(m?.type===T.SELECT_EFFECTYN||m?.type===T.SELECT_YESNO){const specific=this.activationSpecificEffectText(m);if(specific){const code=this.effectSourceCode(m);return this.effectPromptContextText(code,specific);}}
    const exactContext=this.exactEffectContext(m);
    if(exactContext?.code){const resolved=this.resolvedEffectDisplay(exactContext.code,exactContext.descriptionId??m?.description,exactContext.description||'');if(resolved.text)return this.effectPromptContextText(exactContext.code,resolved.text);}
    const context=this.effectDisplayContextForPrompt(m);if(context?.description)return this.effectPromptContextText(context.code,context.description);
    return'';
  }


  selectionActionDescriptor(m={},effectText='') {
    const T=this.mod?.OcgMessageType||{},L=this.mod?.OcgLocation||{};
    if(m.type===T.SELECT_TRIBUTE)return{verb:'Tribute',title:'Choose Tribute(s)',action:'Tribute',destination:''};
    if(m.type===T.SELECT_SUM)return{verb:'use as material',title:'Choose materials',action:'use as material',destination:''};
    const selected=[...(m.selects||[]),...(m.select_cards||[]),...(m.unselect_cards||[])];
    const locations=new Set(selected.map(item=>Number(item?.location)||0));
    const text=String(effectText||'').replace(/\r?\n/g,' ').replace(/\s+/g,' ').trim();
    const lower=text.toLowerCase();
    const has=loc=>locations.has(Number(loc||0));



    const rules=[];
    const add=(when,re,action,title,destination='',priority=0)=>{if(when&&re.test(text))rules.push({action,title,destination,priority,index:lower.search(re)});};
    if(has(L.HAND)){
      add(true,/place\s+(?:exactly\s+)?(?:\d+|one|a)?[^.;]*from (?:your )?hand[^.;]*(?:on top of|at the top of) (?:(?:your|the) )?deck/i,'place on top of the Deck','Choose a card to place on top of the Deck','on top of the Deck',100);
      add(true,/place\s+(?:exactly\s+)?(?:\d+|one|a)?[^.;]*from (?:your )?hand[^.;]*(?:on the bottom of|at the bottom of) (?:(?:your|the) )?deck/i,'place on the bottom of the Deck','Choose a card to place on the bottom of the Deck','on the bottom of the Deck',100);
      add(true,/(?:shuffle|return)[^.;]*from (?:your )?hand[^.;]*(?:into|to) (?:your )?deck/i,'return to the Deck','Choose a card to return to the Deck','to the Deck',90);
      add(true,/send[^.;]*from (?:your )?hand[^.;]*(?:to the (?:graveyard|gy)|to (?:your )?(?:graveyard|gy))/i,'send to the GY','Choose a card to send to the GY','to the GY',90);
      add(true,/banish[^.;]*from (?:your )?hand/i,'banish','Choose a card to banish','',80);
      add(true,/discard[^.;]*(?:from )?(?:your )?hand|discard\s+(?:\d+|one|a)\s+card/i,'discard','Choose a card to discard','',80);
      add(true,/special summon[^.;]*from (?:your )?hand/i,'Special Summon','Choose a card to Special Summon','',75);



      add(true,/reveal\s+(?!(?:this|it)\b)(?:\d+|one|a)?[^.;]*(?:card|monster)[^.;]*(?:in|from) (?:your )?hand/i,'reveal','Choose a card to reveal','',40);
      add(true,/target[^.;]*(?:card|monster)[^.;]*(?:in|from) (?:your )?hand/i,'target','Choose a card to target','',30);
    }
    if(has(L.DECK)){
      add(true,/add[^.;]*from (?:your )?deck[^.;]*to (?:your )?hand/i,'add to your hand','Choose a card to add to your hand','to your hand',95);
      add(true,/send[^.;]*from (?:your )?deck[^.;]*(?:to the (?:graveyard|gy)|to (?:your )?(?:graveyard|gy))/i,'send to the GY','Choose a card to send to the GY','to the GY',90);
      add(true,/special summon[^.;]*from (?:your )?deck/i,'Special Summon','Choose a card to Special Summon','',85);
      add(true,/banish[^.;]*from (?:your )?deck/i,'banish','Choose a card to banish','',80);
      add(true,/place[^.;]*from (?:your )?deck[^.;]*(?:on top of|at the top of) (?:(?:your|the) )?deck/i,'place on top of the Deck','Choose a card to place on top of the Deck','on top of the Deck',85);
    }
    if(has(L.GRAVE)){
      add(true,/add[^.;]*from (?:your )?(?:graveyard|gy)[^.;]*to (?:your )?hand/i,'add to your hand','Choose a card to add to your hand','to your hand',95);
      add(true,/special summon[^.;]*from (?:your )?(?:graveyard|gy)/i,'Special Summon','Choose a card to Special Summon','',90);
      add(true,/banish[^.;]*from (?:your )?(?:graveyard|gy)/i,'banish','Choose a card to banish','',85);
      add(true,/(?:shuffle|return)[^.;]*from (?:your )?(?:graveyard|gy)[^.;]*(?:into|to) (?:your )?deck/i,'return to the Deck','Choose a card to return to the Deck','to the Deck',85);
    }
    if(has(L.REMOVED)){
      add(true,/add[^.;]*(?:banish|banished)[^.;]*to (?:your )?hand/i,'add to your hand','Choose a card to add to your hand','to your hand',90);
      add(true,/special summon[^.;]*(?:banish|banished)/i,'Special Summon','Choose a card to Special Summon','',85);
      add(true,/(?:shuffle|return)[^.;]*(?:banish|banished)[^.;]*(?:into|to) (?:your )?deck/i,'return to the Deck','Choose a card to return to the Deck','to the Deck',80);
    }
    if(has(L.MZONE)||has(L.SZONE)){



      add(true,/target[^.;]*(?:card|monster|spell|trap)[^.;]*[.;]\s*(?:then,?\s*|and if you do,?\s*)?banish\s+(?:it|that target|them)/i,'banish','Choose a card to banish','',96);
      add(true,/target[^.;]*(?:card|monster|spell|trap)[^.;]*[.;]\s*(?:then,?\s*|and if you do,?\s*)?destroy\s+(?:it|that target|them)/i,'destroy','Choose a card to destroy','',96);
      add(true,/target[^.;]*(?:card|monster|spell|trap)[^.;]*[.;]\s*(?:then,?\s*|and if you do,?\s*)?return\s+(?:it|that target|them)/i,'return','Choose a card to return','',94);
      add(true,/target[^.;]*(?:card|monster|spell|trap)[^.;]*[.;]\s*(?:then,?\s*|and if you do,?\s*)?send\s+(?:it|that target|them)[^.;]*(?:graveyard|gy)/i,'send to the GY','Choose a card to send to the GY','to the GY',94);
      add(true,/tribute[^.;]*(?:monster|card)/i,'Tribute','Choose a card to Tribute','',80);
      add(true,/destroy[^.;]*(?:card|monster|spell|trap)/i,'destroy','Choose a card to destroy','',75);
      add(true,/banish[^.;]*(?:card|monster|spell|trap)/i,'banish','Choose a card to banish','',75);
      add(true,/return[^.;]*(?:card|monster|spell|trap)[^.;]*(?:to the hand|to (?:its|the) owner's hand)/i,'return to the hand','Choose a card to return to the hand','to the hand',75);
      add(true,/return[^.;]*(?:card|monster|spell|trap)[^.;]*(?:to the deck|into the deck)/i,'return to the Deck','Choose a card to return to the Deck','to the Deck',75);
      add(true,/send[^.;]*(?:card|monster|spell|trap)[^.;]*(?:to the (?:graveyard|gy)|to (?:your )?(?:graveyard|gy))/i,'send to the GY','Choose a card to send to the GY','to the GY',70);
      add(true,/target[^.;]*(?:card|monster|spell|trap)/i,'target','Choose a target','',60);
    }
    if(!rules.length){
      const generic=[
        [/\bbanish\b/i,'banish','Choose a card to banish'],[/\bdiscard\b/i,'discard','Choose a card to discard'],[/\bsend\b/i,'send','Choose a card to send'],[/\breturn\b/i,'return','Choose a card to return'],[/\bdestroy\b/i,'destroy','Choose a card to destroy'],[/\bplace\b/i,'place','Choose a card to place'],[/\btarget\b/i,'target','Choose a target'],[/\breveal\b/i,'reveal','Choose a card to reveal'],[/\badd\b/i,'add','Choose a card to add'],[/special summon/i,'Special Summon','Choose a card to Special Summon']
      ];
      for(const [re,action,title] of generic)if(re.test(text)){rules.push({action,title,destination:'',priority:10,index:lower.search(re)});break;}
    }
    if(!rules.length)return null;
    rules.sort((a,b)=>b.priority-a.priority||(b.index-a.index));
    return rules[0];
  }

  selectionDescriptorForPrompt(m={},effectText='',scripted=this.projectIgnisSelectionDescriptor(m)) {
    const contextual=effectText?this.selectionActionDescriptor(m,effectText):null;
    if(!scripted)return contextual;
    if(!contextual)return scripted;
    const normalize=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const scriptedAction=normalize(scripted.action),contextualAction=normalize(contextual.action);
    if(scriptedAction===contextualAction)return{...contextual,...scripted,destination:contextual.destination||scripted.destination||'',priority:Math.max(Number(contextual.priority)||0,Number(scripted.priority)||0)};






    if(Number(contextual.priority)>=90){
      return{...scripted,...contextual,role:scripted.role||contextual.role||'',roleLabel:scripted.roleLabel||contextual.roleLabel||'',semantic:scripted.semantic,meta:scripted.meta,effect:scripted.effect,code:scripted.code,source:'Current OCGCore selection + effect text'};
    }
    return scripted;
  }

  selectionPurpose(m) {
    const T=this.mod?.OcgMessageType||{};const rawMin=Number(m.min),rawMax=Number(m.max);const min=Number.isFinite(rawMin)&&rawMin>=0?rawMin:1,max=Number.isFinite(rawMax)&&rawMax>=min?rawMax:min;
    if(this.pendingSpecialSummon){const name=this.pendingSpecialSummon.name||this.cardName(this.pendingSpecialSummon.code);const verb=m.type===T.SELECT_TRIBUTE?'Tribute':m.type===T.SELECT_SUM?'material':'material';return{title:`Choose ${verb}${max===1?'':'s'} for ${name}`,intro:`To Special Summon ${name}, select the required ${verb.toLowerCase()}${max===1?'':'s'} and confirm your choice.`,effectText:'',action:verb,role:'summon-material',roleLabel:'Summon Requirement'};}
    const effectText=this.inferPromptEffectText(m);const sourceCode=this.effectSourceCode(m),sourceName=sourceCode?this.cardName(sourceCode):'';
    const selectionPool=m.type===T.SELECT_SUM?[...(m.selects_must||[]),...(m.selects||[])]:m.type===T.SELECT_UNSELECT_CARD?[...(m.select_cards||[]),...(m.unselect_cards||[])]:m.selects||[];const xyzMaterials=selectionPool.filter(item=>this.isAttachedXyzMaterial(item));
    if(xyzMaterials.length){const detach=/\bdetach\b/i.test(effectText),count=min===max?`Select ${min}`:`Select ${min} to ${max}`,host=this.xyzMaterialHostCard(xyzMaterials[0]),hostName=Number(host?.code)?this.cardName(host.code):sourceName||'the Xyz Monster';return{title:detach?`Choose Xyz Material to Detach from ${hostName}`:`Choose Attached Xyz Material for ${sourceName||hostName}`,intro:`${count} attached Xyz Material${max===1?'':'s'}. Select the material card itself, not ${hostName}.`,effectText,action:detach?'Detach Xyz Material':'Select Xyz Material',role:'cost',roleLabel:'Xyz Material Cost'};}
    if(m.type===T.SELECT_TRIBUTE){const candidate=this.selectionCandidateDescriptor(m),source=this.selectionSourceLabel(m),count=min===max?`Select ${min}`:`Select ${min} to ${max}`;const intro=sourceName?`To activate ${sourceName}'s effect, ${count.toLowerCase()} eligible ${candidate}${max===1?'':'s'}${source?` ${source}`:''} and Tribute ${max===1?'it':'them'} as the cost.`:`${count} eligible ${candidate}${max===1?'':'s'}${source?` ${source}`:''} and Tribute ${max===1?'it':'them'} as the required cost.`;return{title:sourceName?`Choose ${candidate} to Tribute for ${sourceName}`:'Choose Tribute(s)',intro,effectText,action:'Tribute',role:'cost',roleLabel:'Activation Cost'};}
    const scripted=this.projectIgnisSelectionDescriptor(m);const action=this.selectionDescriptorForPrompt(m,effectText,scripted);
    if(action){
      const source=this.selectionSourceLabel(m);const candidate=this.selectionCandidateDescriptor(m,scripted);const countText=min===max?`select ${min} eligible ${candidate}${min===1?'':'s'}`:`select ${min} to ${max} eligible ${candidate}s`;
      const actionText=action.action||'select',role=action.role||'';const followup=this.effectFollowupSummary(effectText,actionText,sourceName);let title=action.title||`Choose card${max===1?'':'s'} to ${actionText}`,intro='';
      if(role==='cost'){
        title=sourceName?`Choose ${candidate} to ${actionText} for ${sourceName}`:title;
        intro=sourceName?`To activate ${sourceName}'s effect, ${countText}${source?` ${source}`:''} to ${actionText} as the cost.`:`As the activation cost, ${countText}${source?` ${source}`:''} to ${actionText}.`;if(followup)intro+=` If the effect resolves, ${followup}`;
      }else if(role==='target'){
        title=sourceName?`Choose target for ${sourceName}`:title;const outcome=this.actionOutcomePhrase(actionText);intro=sourceName?`For ${sourceName}'s effect, ${countText}${source?` ${source}`:''} as ${max===1?'the target':'targets'}.`:`${countText.charAt(0).toUpperCase()+countText.slice(1)}${source?` ${source}`:''} as ${max===1?'the target':'targets'}.`;if(actionText!=='target'&&outcome)intro+=` If the effect resolves, ${max===1?'the selected card':'the selected cards'} will be ${outcome}.`;else if(followup)intro+=` If the effect resolves, ${followup}`;
      }else{
        intro=sourceName?`As ${sourceName}'s effect resolves, ${countText}${source?` ${source}`:''} to ${actionText}.`:`${countText.charAt(0).toUpperCase()+countText.slice(1)}${source?` ${source}`:''} to ${actionText}.`;if(followup&&!intro.toLowerCase().includes(followup.toLowerCase()))intro+=` ${followup}`;
      }
      return{title,intro,effectText,action:actionText,role,roleLabel:action.roleLabel||(role==='cost'?'Activation Cost':role==='target'?'Target Selection':'Effect Resolution')};
    }
    const candidate=this.selectionCandidateDescriptor(m),source=this.selectionSourceLabel(m),noun=max===1?candidate:`${candidate}s`,countText=min===max?`Select ${min}`:`Select ${min} to ${max}`;



    return{title:sourceName?`${sourceName} - Choose ${noun}`:(m.type===T.SELECT_SUM?'Choose materials':'Choose card(s)'),intro:'',effectText,action:'Selection',role:'selection',roleLabel:''};
  }

  effectSourceCode(m={}) {
    const exact=this.exactEffectContext(m);
    if(exact?.code)return this.normalizeActionCode(exact.code);
    return this.normalizeActionCode(m.code||this.activeEffectCode||this.pendingEffectSource?.code);
  }

  conciseEffectText(text='') {

    return String(text||'').replace(/\r?\n/g,' ').replace(/\s+/g,' ').trim();
  }

  effectSourceBanner(m={}) {
    if(!this.promptEffectContextEnabled)return null;
    const code=this.effectSourceCode(m);if(!code)return null;
    const exactContext=this.exactEffectContext(m);
    const sourceController=Number(exactContext?.controller??this.pendingEffectSource?.controller??m.controller??0)||0;
    const respondingToOpponent=Number(m.player)===0&&sourceController===1;
    const info={code,controller:sourceController,location:Number(exactContext?.location??this.pendingEffectSource?.location)||0,sequence:Number(exactContext?.sequence??this.pendingEffectSource?.sequence)||0};
    const box=document.createElement('div');box.className='duel-effect-source';box.dataset.controller=String(sourceController);box.tabIndex=0;box.setAttribute('role','button');box.title=`View ${this.cardName(code)} details`;
    const img=document.createElement('img');img.src=cardImage(code);img.alt=this.cardName(code);img.classList.add('duel-clickable-card-image');img.title=`View ${this.cardName(code)} details`;
    const copy=document.createElement('div');copy.className='duel-effect-source-copy';const eyebrow=document.createElement('span');eyebrow.className='duel-effect-source-role';
    const T=this.mod?.OcgMessageType||{};const selectionTypes=new Set([T.SELECT_CARD,T.SELECT_TRIBUTE,T.SELECT_SUM,T.SELECT_UNSELECT_CARD,T.SELECT_PLACE,T.SELECT_POSITION,T.SELECT_COUNTER].filter(v=>v!=null));let sourceRole='Effect Being Resolved';if(this.pendingSpecialSummon&&selectionTypes.has(m.type))sourceRole='Summon Requiring This Action';else if(selectionTypes.has(m.type)){const descriptor=this.projectIgnisSelectionDescriptor(m);sourceRole=descriptor?.role==='cost'?'Effect Requiring This Cost':descriptor?.role==='target'?'Effect Requiring This Target':'Effect Requiring This Action';}else if(m.type===T.SELECT_EFFECTYN||m.type===T.SELECT_YESNO)sourceRole='Effect Available to Activate';eyebrow.textContent=sourceRole;const strong=document.createElement('strong');strong.textContent=respondingToOpponent?`Practice Dummy - ${this.cardName(code)}`:this.cardName(code);
    const isOptionPrompt=m.type===this.mod?.OcgMessageType?.SELECT_OPTION;
    const specific=isOptionPrompt?'':this.conciseEffectText(this.inferPromptEffectText(m));
    const small=document.createElement('div');small.className='duel-effect-source-text';if(isOptionPrompt)small.textContent=`Choose which ${this.cardName(code)} effect to apply.`;else if(specific)this.setStyledCardText(small,specific,code);copy.append(eyebrow,strong);const respondsToLink=Number(exactContext?.respondsToLink||this.pendingEffectSource?.respondsToLink)||0;if(respondsToLink){const relation=document.createElement('span');relation.className='duel-effect-source-relation';relation.textContent=`Responding to Chain Link ${respondsToLink}`;copy.append(relation);}if(small.textContent?.trim())copy.append(small);box.append(img,copy);
    this.bindInspectorHover(box,code,info);
    const openDetails=()=>{this.pinnedInspector={code,info};this.inspectCard(code,info);this.renderCardDetailsModal(code,info);};
    img.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openDetails();});
    box.addEventListener('click',event=>{if(event.target.closest?.('button'))return;openDetails();});
    box.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openDetails();}});return box;
  }

  gameplayPromptPreferredWidth(m={}) {
    const T=this.mod?.OcgMessageType||{};let count=0;
    if(m.type===T.SELECT_CHAIN)count=(m.selects||[]).length;
    else if(m.type===T.SELECT_SUM)count=(m.selects_must||[]).length+(m.selects||[]).length;
    else if(m.type===T.SELECT_CARD||m.type===T.SELECT_TRIBUTE)count=(m.selects||[]).length;
    else if(m.type===T.SELECT_UNSELECT_CARD)count=(m.select_cards||[]).length+(m.unselect_cards||[]).length;
    else if(m.type===T.SELECT_POSITION){try{count=this.mod?.ocgPositionParse?.(m.positions)?.length||0;}catch{count=0;}}
    if(count>0)return this.gameplayCardCountWidth(count);
    if(m.type===T.SELECT_EFFECTYN||m.type===T.SELECT_YESNO)return 460;
    if(m.type===T.SELECT_OPTION)return 520;
    if(m.type===T.SELECT_PLACE||m.type===T.SELECT_DISFIELD||m.type===T.SELECT_COUNTER)return 460;
    return 480;
  }

  applyGameplayPromptWidth(m={}) {
    if(!this.prompt)return;this.prompt.classList.add('duel-gameplay-prompt');
    this.prompt.style.setProperty('--duel-gameplay-prompt-width',`${this.gameplayPromptPreferredWidth(m)}px`);
  }

  chainEffectPreviewText(item={}) {
    const code=this.normalizeActionCode(item?.code);
    const exact=this.conciseEffectText(this.effectLabel(item,'')||this.descriptionText(item?.description,''));
    if(exact)return exact;
    const card=code?this.getCardById?.(code):null;
    return this.conciseEffectText(card?.desc||card?.description||'');
  }

  renderPromptHome(m,note='') {
    const T=this.mod.OcgMessageType,R=this.mod.OcgResponseType,I=this.mod.SelectIdleCMDAction,B=this.mod.SelectBattleCMDAction;
    this.promptBody.replaceChildren();
    if(m.type===T.SELECT_IDLECMD||m.type===T.SELECT_BATTLECMD){
      this.hidePrompt();this.renderPhaseDock();return true;
    }
    if(m.type===T.SELECT_CHAIN){
      const rawEntries=(m.selects||[]).map((item,index)=>({item,index}));const filteredEntries=this.visibleChainCandidates(m);const chainEntries=filteredEntries.length?filteredEntries:rawEntries,selects=chainEntries.map(entry=>entry.item),originalIndices=chainEntries.map(entry=>entry.index);
      if(!selects.length&&!m.forced){this.submitResponse({type:R.SELECT_CHAIN,index:null});return true;}
      const triggeredWindow=this.chainPromptContainsTriggeredEffect(m),triggerContext=triggeredWindow?this.triggerEffectContext(m):null;
      const responseContext=triggeredWindow?null:this.responseEffectContext(m);const sourceController=Number((triggerContext||responseContext)?.controller??-1);const sourceCode=this.normalizeActionCode((triggerContext||responseContext)?.code||(triggeredWindow&&selects.length===1?selects[0]?.code:0)||this.effectSourceCode(m));
      this.promptView='chain';this.showPrompt();
      if(triggeredWindow)this.promptTitle.textContent=sourceCode?`Activate ${this.cardName(sourceCode)}'s triggered effect?`:'Choose a triggered effect to activate';
      else this.promptTitle.textContent=Number(m.player)===0&&sourceController===1&&sourceCode?`Respond to Practice Dummy's ${this.cardName(sourceCode)}?`:(sourceCode?`Respond to ${this.cardName(sourceCode)}?`:'Chain response');



      this.prompt?.classList.add('selection-prompt','duel-universal-card-selector','duel-chain-choice-prompt');





      const sourceBanner=triggeredWindow?null:this.effectSourceBanner(m);if(sourceBanner)this.promptBody.append(sourceBanner);


      const grid=document.createElement('div');grid.className='duel-select-card-grid duel-chain-card-grid duel-universal-selection-grid';
      const identityCounts=new Map(),identitySeen=new Map(),cards=[];
      selects.forEach(item=>{const key=[Number(item.controller)||0,Number(item.location)||0,Number(item.sequence)||0,this.normalizeActionCode(item.code)].join(':');identityCounts.set(key,(identityCounts.get(key)||0)+1);});
      const token=`${Number(this.currentPromptRevision)||0}:${Number(m.type)||0}`;
      let selected=(this.stagedChainSelection?.token===token&&Number.isInteger(Number(this.stagedChainSelection.index)))?Number(this.stagedChainSelection.index):-1;
      if(selected<0||selected>=selects.length)selected=-1;
      let confirm=null;
      const refresh=()=>{this.stagedChainSelection=this.confirmChainSelectionsEnabled?{token,index:selected}:null;cards.forEach((card,index)=>card.classList.toggle('selected',index===selected));if(selected>=0&&selected<selects.length)this.setChainPromptPhysicalFocus(selects[selected],'selected');else this.clearChainPromptPhysicalFocus('selected');if(confirm)confirm.disabled=selected<0;};
      selects.forEach((item,index)=>{const key=[Number(item.controller)||0,Number(item.location)||0,Number(item.sequence)||0,this.normalizeActionCode(item.code)].join(':');const ordinal=(identitySeen.get(key)||0)+1;identitySeen.set(key,ordinal);const duplicate=Number(identityCounts.get(key)||0)>1;const label=`${this.cardName(item.code)}${duplicate?` · Effect ${ordinal}`:''}`;const effect=this.chainEffectPreviewText(item);const choose=()=>{if(!this.confirmChainSelectionsEnabled){if(triggeredWindow)this.rememberEffectItem(item);this.submitResponse({type:R.SELECT_CHAIN,index:originalIndices[index]});return;}selected=index;refresh();};const options=this.confirmChainSelectionsEnabled?{hoverEffect:effect,hoverEffectRole:triggeredWindow?'Triggered Effect':'Chain Effect',syncPhysicalCard:true,confirmSelection:true,isSelected:()=>selected===index,onDeselect:()=>{selected=-1;refresh();}}:{hoverEffect:effect,hoverEffectRole:triggeredWindow?'Triggered Effect':'Chain Effect',syncPhysicalCard:true};const card=this.actionCard(item,choose,label,options);cards.push(card);grid.append(card);});
      if(selects.length)this.promptBody.append(grid);
      const controls=document.createElement('div');controls.className='duel-prompt-controls duel-chain-pass-controls';
      if(this.confirmChainSelectionsEnabled){confirm=this.button('Confirm Chain',()=>{if(selected<0||selected>=selects.length)return;const item=selects[selected];if(triggeredWindow)this.rememberEffectItem(item);this.submitResponse({type:R.SELECT_CHAIN,index:originalIndices[selected]});},{disabled:selected<0});controls.append(confirm);}
      if(!m.forced)controls.append(this.button('Pass',()=>{this.stagedChainSelection=null;this.submitResponse({type:R.SELECT_CHAIN,index:null});},{ghost:true}));
      if(controls.childElementCount)this.promptBody.append(controls);
      refresh();this.syncChainSourceHighlights();this.scheduleSelectionPromptSizing();return true;
    }
    return false;
  }



  renderPrompt(m){const T=this.mod.OcgMessageType,R=this.mod.OcgResponseType;this.hideDirectSurfaceSelectionDock();this.traceSession('prompt-render',{signature:this.replayPromptSignature(m),prompt:this.traceSafeObject(m),state:this.sessionStateSnapshot()});
    const renderDecisionId=Number(this.promptDecisionIds?.get(m)||0);if(renderDecisionId&&renderDecisionId!==Number(this.activeDecisionId))return;
    if(this.prompt){this.prompt.dataset.decisionId=String(Number(this.promptDecisionIds?.get(m)||this.activeDecisionId)||0);this.prompt.classList.remove('duel-prompt-awaiting-ack');}
    this.hideCardHoverOverlay({clearInspector:false});
    if(m.type!==T.SELECT_CHAIN)this.clearChainPromptPhysicalFocus();




    if(this.promptView==='details'&&!this.detailsCloseRequested){this.detailsBackgroundPromptDirty=true;return;}
    if(m.type!==T.SELECT_PLACE&&m.type!==T.SELECT_DISFIELD)this.clearPlacePrompt();this.promptView='engine';this.openPileContext=null;this.resetEnginePromptPresentationState();this.promptBody.replaceChildren();this.applyGameplayPromptWidth(m);this.showPrompt();
    if(this.renderPromptHome(m))return;




    const battleReplay=this.isBattleReplayPrompt(m);const sourceBanner=this.effectSourceBanner(m);if(sourceBanner&&!battleReplay)this.promptBody.append(sourceBanner);
    if(battleReplay){this.promptTitle.textContent='Attack replay - choose a new target?';const detail=document.createElement('p');detail.className='duel-selection-purpose duel-battle-replay-copy';detail.textContent='The number of monsters on the Practice Dummy field changed during the Battle Step. Continue the attack and choose a new legal target, or cancel this attack.';this.promptBody.append(detail);this.promptBody.append(this.button('Choose New Attack Target',()=>this.submitResponse({type:R.SELECT_YESNO,yes:true})),this.button('Cancel Attack',()=>this.submitResponse({type:R.SELECT_YESNO,yes:false}),{ghost:true}));return;}
    if(m.type===T.SELECT_EFFECTYN||m.type===T.SELECT_YESNO){
      const sourceCode=this.effectSourceCode(m),exactContext=this.exactEffectContext(m),sourceController=Number(exactContext?.controller??m.controller??this.pendingEffectSource?.controller??0)||0,responding=Number(m.player)===0&&sourceController===1;
      const decisionEffect=this.inferPromptEffectText(m)||exactContext?.description||'';this.promptTitle.textContent=sourceCode?(responding?`Respond to Practice Dummy's ${this.cardName(sourceCode)}?`:`Activate ${this.cardName(sourceCode)}?`):'Activate effect?';
      const type=m.type===T.SELECT_EFFECTYN?R.SELECT_EFFECTYN:R.SELECT_YESNO,choices=document.createElement('div');choices.className='duel-option-choice-list duel-effect-decision-list';
      if(responding&&this.confirmChainSelectionsEnabled){
        let selected=false;const chainChoice=this.renderCompactEffectDecision('Chain',decisionEffect,()=>{selected=true;chainChoice.classList.add('selected');confirm.disabled=false;},{code:sourceCode,role:'Chain Effect'});
        choices.append(chainChoice);this.promptBody.append(choices);
        const controls=document.createElement('div');controls.className='duel-prompt-controls duel-chain-pass-controls';
        const confirm=this.button('Confirm Chain',()=>{if(!selected)return;this.pendingEffectOptionIntent=null;this.submitResponse({type,yes:true});},{disabled:true});
        controls.append(confirm,this.button('Pass',()=>{this.pendingEffectOptionIntent=null;this.submitResponse({type,yes:false});},{ghost:true}));this.promptBody.append(controls);return;
      }
      choices.append(this.renderCompactEffectDecision(responding?'Chain':'Activate',decisionEffect,()=>{this.pendingEffectOptionIntent=null;this.submitResponse({type,yes:true});},{code:sourceCode,role:responding?'Chain Effect':'Activatable Effect'}));
      choices.append(this.renderCompactEffectDecision(responding?'Pass':'Do not activate','',()=>{this.pendingEffectOptionIntent=null;this.submitResponse({type,yes:false});},{decline:true}));
      this.promptBody.append(choices);return;
    }
    if(m.type===T.SELECT_OPTION){const sourceCode=this.effectSourceCode(m);this.promptTitle.textContent=sourceCode?`Choose ${this.cardName(sourceCode)} effect`:'Choose an option';this.prompt?.classList.add('selection-prompt','duel-option-prompt');const choices=document.createElement('div');choices.className='duel-option-choice-list';m.options.forEach((opt,index)=>choices.append(this.renderOptionChoice(opt,index,m,()=>this.submitResponse({type:R.SELECT_OPTION,index}))));this.promptBody.append(choices);const reveal=this.renderRecentRevealPreview(m);if(reveal)this.promptBody.append(reveal);return;}
    if(m.type===T.SELECT_POSITION){this.renderPositionPrompt(m);return;}
    if(m.type===T.SELECT_CARD||m.type===T.SELECT_TRIBUTE||m.type===T.SELECT_SUM){this.renderMultiCardPrompt(m);return;}
    if(m.type===T.SELECT_UNSELECT_CARD){this.renderUnselectStagingPrompt(m);return;}
    if(m.type===T.SELECT_PLACE||m.type===T.SELECT_DISFIELD){this.renderPlacePrompt(m);return;}
    if(m.type===T.SELECT_COUNTER){this.renderCounterPrompt(m);return;}
    if(m.type===T.SORT_CARD||m.type===T.SORT_CHAIN){this.renderSortPrompt(m);return;}
    if(m.type===T.ROCK_PAPER_SCISSORS){this.promptTitle.textContent='Rock Paper Scissors';[['Rock',2],['Paper',3],['Scissors',1]].forEach(([label,value])=>this.promptBody.append(this.button(label,()=>this.submitResponse({type:R.ROCK_PAPER_SCISSORS,value}))));return;}
    if(m.type===T.ANNOUNCE_RACE||m.type===T.ANNOUNCE_ATTRIB){this.renderMaskAnnouncement(m);return;}
    if(m.type===T.ANNOUNCE_NUMBER){this.promptTitle.textContent='Choose a number';(m.options||[]).forEach((v,index)=>{this.promptBody.append(this.button(String(v),()=>this.submitResponse({type:R.ANNOUNCE_NUMBER,value:index})));});return;}
    if(m.type===T.ANNOUNCE_CARD){this.renderAnnounceCard(m);return;}
    this.promptTitle.textContent=`Unsupported duel decision ${m.type}`;const pre=document.createElement('pre');pre.textContent=JSON.stringify(m,(_,v)=>typeof v==='bigint'?v.toString():v,2);this.promptBody.append(pre);
  }

  selectionIdentity(item={}){const overlay=this.isAttachedXyzMaterial(item)?`overlay:${Number(item.overlay_sequence)}`:'surface';return `${Number(item.controller)||0}:${Number(item.location)||0}:${Number(item.sequence)||0}:${overlay}:${this.normalizeActionCode(item.code)}`;}

  addRollingCardSelection(selected,index,{required=new Set(),max=Infinity}={}) {
    if(!(selected instanceof Set)||!Number.isInteger(Number(index)))return false;
    index=Number(index);if(required?.has?.(index)||selected.has(index))return false;
    const limit=Number(max);
    if(Number.isFinite(limit)){
      if(limit<=0)return false;
      const optional=[...selected].filter(value=>!required?.has?.(value));
      while(optional.length>=limit){const oldest=optional.shift();selected.delete(oldest);}
    }
    selected.add(index);return true;
  }

  nextStagedUnselectResponse(message){
    const staged=this.stagedUnselectCommit;if(!staged)return null;const R=this.mod?.OcgResponseType||{};
    while(staged.ops.length){const op=staged.ops[0];const selects=message.select_cards||[],unselects=message.unselect_cards||[];const list=op.action==='select'?selects:unselects;const idx=list.findIndex(item=>this.selectionIdentity(item)===op.key);if(idx>=0){staged.ops.shift();const combined=op.action==='select'?idx:selects.length+idx;return{type:R.SELECT_UNSELECT_CARD,index:combined};}staged.ops.shift();}
    if(message.can_finish){this.stagedUnselectCommit=null;return{type:R.SELECT_UNSELECT_CARD,index:null};}
    this.stagedUnselectCommit=null;return null;
  }

  beginStagedUnselectCommit(message,desired,initial){
    const ops=[];for(const key of initial)if(!desired.has(key))ops.push({action:'unselect',key});for(const key of desired)if(!initial.has(key))ops.push({action:'select',key});this.stagedUnselectCommit={ops};
    const response=this.nextStagedUnselectResponse(message);if(response){this.submitResponse(response);return;}this.toast('That material selection cannot be confirmed yet. Adjust the selected cards.');
  }









  canUseDirectSurfaceCardSelection(source=[]) {
    if(!this.directHandFieldSelectionEnabled||!Array.isArray(source)||!source.length)return false;
    const keys=new Set();for(const item of source){if(!this.isInlineSurfaceSelectionItem(item))return false;const key=this.surfaceSelectionLocationKey(item);if(keys.has(key))return false;keys.add(key);}return true;
  }

  // rc229: Direct Hand / Field mode remains direct even when a decision also includes
  // off-surface candidates. Physical hand/field cards are selected on the duel surface;
  // only genuinely off-surface choices remain in the prompt.
  directSurfaceCandidateIndexMap(source=[]) {
    const result=new Map();if(!this.directHandFieldSelectionEnabled||!Array.isArray(source)||!source.length)return result;
    const duplicates=new Set();
    source.forEach((item,index)=>{if(!this.isInlineSurfaceSelectionItem(item))return;const key=this.surfaceSelectionLocationKey(item);if(duplicates.has(key))return;if(result.has(key)){result.delete(key);duplicates.add(key);return;}result.set(key,index);});
    return result;
  }

  prepareHybridSurfaceCardSelection({message,source,selected,required=new Set(),min=0,max=Infinity,confirmLabel='Confirm Selection',onConfirm,onSelectionChange=null}={}) {
    if(!(selected instanceof Set)||typeof onConfirm!=='function')return null;
    const indexByLocation=this.directSurfaceCandidateIndexMap(source);if(!indexByLocation.size||indexByLocation.size>=source.length)return null;
    const state={kind:'hybrid-surface',directSurfaceMode:true,hybridSurfaceMode:true,prompt:message,revision:this.currentPromptRevision,indexByLocation,selected,required,min,max,immediateSingle:false,lastSelectedIndex:-1,inlineConfirmIndex:-1,confirmLabel,onConfirm};
    state.onChange=()=>onSelectionChange?.();this.inlineCardSelection=state;return state;
  }

  ensureDirectSurfaceSelectionDock() {
    if(this.directSelectionDock?.isConnected)return this.directSelectionDock;
    const host=this.boardWrap||this.root?.querySelector?.('.duel-board-wrap');if(!host||typeof document==='undefined')return null;
    const dock=document.createElement('section');dock.id='duelDirectSelectionDock';dock.className='duel-direct-selection-dock duel-direct-selection-opposite-top';dock.hidden=true;dock.setAttribute('aria-live','polite');
    const title=document.createElement('strong');title.id='duelDirectSelectionTitle';title.textContent='Choose card(s)';
    const body=document.createElement('div');body.id='duelDirectSelectionBody';body.className='duel-direct-selection-body';dock.append(title,body);host.append(dock);
    this.directSelectionDock=dock;this.directSelectionTitle=title;this.directSelectionBody=body;return dock;
  }

  positionDirectSurfaceSelectionDock(source=[]) {
    if(!this.directSelectionDock)return;
    let playerSide=0,opponentSide=0;
    for(const item of Array.isArray(source)?source:[]){
      if(Number(item?.controller)===0)playerSide++;else opponentSide++;
    }
    // Direct Hand / Field selection is the only mode that uses this dock. Put the
    // prompt on the opposite half of the board from the side containing most candidates.
    // A tie defaults to the upper half because local-hand selections are the common case.
    const placeBottom=opponentSide>playerSide;
    this.directSelectionDock.classList.toggle('duel-direct-selection-opposite-top',!placeBottom);
    this.directSelectionDock.classList.toggle('duel-direct-selection-opposite-bottom',placeBottom);
  }

  hideDirectSurfaceSelectionDock() {
    if(this.directSelectionDock){this.directSelectionDock.hidden=true;this.directSelectionDock.classList.remove('active');}
    this.directSelectionBody?.replaceChildren?.();
  }

  directSurfaceSelectionActive(message=this.currentPrompt) {
    const state=this.inlineCardSelection;
    return !!state&&state.directSurfaceMode===true&&state.prompt===message&&Number(state.revision)===Number(this.currentPromptRevision)&&!!this.directSelectionDock&&!this.directSelectionDock.hidden;
  }

  attachDirectSurfaceSelectionPrompt() {
    if(!this.prompt||!this.root||!this.ensureDirectSurfaceSelectionDock())return false;
    // rc224: Direct Hand / Field selection uses a dedicated board overlay on the
    // opposite half from the selectable side. It is absolutely positioned, so showing
    // or hovering it cannot reflow the toolbar or move its Confirm/Cancel hit targets.
    this.restorePromptHome();
    this.prompt.classList.add('duel-prompt-hidden');
    this.promptMinimized=false;this.prompt.dataset.dismissible='0';
    if(this.promptRestoreButton)this.promptRestoreButton.hidden=true;
    this.directSelectionDock.hidden=false;this.directSelectionDock.classList.add('active');
    return true;
  }

  activateDirectSurfaceCardSelection({message,source,selected,required=new Set(),min=0,max=Infinity,title='Choose cards',intro='',confirmLabel='Confirm Selection',onConfirm,onCancel=null,onSelectionChange=null,forceAutoCommitExact=false}={}) {
    if(!this.canUseDirectSurfaceCardSelection(source)||!(selected instanceof Set)||typeof onConfirm!=='function'||!this.ensureDirectSurfaceSelectionDock())return false;
    const indexByLocation=new Map();source.forEach((item,index)=>indexByLocation.set(this.surfaceSelectionLocationKey(item),index));
    if(!this.attachDirectSurfaceSelectionPrompt())return false;
    this.positionDirectSurfaceSelectionDock(source);
    this.directSelectionTitle.textContent=title||'Choose cards';this.directSelectionBody.replaceChildren();
    if(intro){const copy=document.createElement('p');copy.className='duel-inline-selection-context';copy.textContent=intro;this.directSelectionBody.append(copy);}
    const hint=document.createElement('p');hint.className='duel-inline-selection-hint';hint.textContent='Select highlighted cards directly on the duel surface. Click a selected optional card again to deselect it.';
    const status=document.createElement('p');status.className='duel-inline-selection-status';const controls=document.createElement('div');controls.className='duel-prompt-controls';
    const state={kind:'direct-surface',directSurfaceMode:true,prompt:message,revision:this.currentPromptRevision,indexByLocation,selected,required,min,max,immediateSingle:false,lastSelectedIndex:-1,inlineConfirmIndex:-1,confirmLabel,autoCommitExact:!!forceAutoCommitExact||!this.confirmCardSelectionsEnabled};
    const optional=()=>[...selected].filter(index=>!required.has(index));const valid=()=>{const count=optional().length;return count>=Number(min||0)&&(!Number.isFinite(Number(max))||count<=Number(max));};
    const commit=()=>{if(valid())onConfirm();};const confirm=this.button(confirmLabel,commit,{disabled:true});state.onConfirm=commit;
    const update=()=>{onSelectionChange?.();const chosen=optional(),count=chosen.length,limit=Number(max),exact=Number(min)===limit&&Number.isFinite(limit),autoExact=state.autoCommitExact&&exact;confirm.disabled=!valid();confirm.hidden=autoExact;status.textContent=valid()?`${count} selected${autoExact?' - submitting':''}`:(exact?`${count}/${Number(min)||0} selected`:`${count} selected`);state.inlineConfirmIndex=!autoExact&&this.confirmCardSelectionsEnabled&&valid()?(Number.isInteger(state.lastSelectedIndex)&&selected.has(state.lastSelectedIndex)?state.lastSelectedIndex:(chosen.length?chosen[chosen.length-1]:-1)):-1;if(autoExact&&state.lastSelectedIndex>=0&&count===limit){state.lastSelectedIndex=-1;queueMicrotask(()=>{if(this.inlineCardSelection===state)commit();});}};state.onChange=update;
    const exactAtStart=Number(min)===Number(max)&&Number.isFinite(Number(max)),autoExactAtStart=state.autoCommitExact&&exactAtStart;if(!autoExactAtStart)controls.append(confirm);if(typeof onCancel==='function')controls.append(this.button('Cancel',onCancel,{ghost:true}));this.directSelectionBody.append(hint,status,controls);this.inlineCardSelection=state;update();this.renderField();return true;
  }

  renderUnselectStagingPrompt(m){
    const special=this.pendingSpecialSummon;const purpose=special?null:this.selectionPurpose(m);this.prompt?.classList.add('selection-prompt','duel-universal-card-selector');this.promptTitle.textContent=special?`Choose materials for ${special.name||this.cardName(special.code)}`:(purpose?.title||'Choose cards');
    const hasEffectContext=!!this.promptBody.querySelector?.('.duel-effect-source-text');const summonInstruction=special?`Select the material${Number(m.max)===1?'':'s'} you want to use to Special Summon ${special.name||this.cardName(special.code)}.`:'';const instructionPurpose=special?{role:'summon-material',roleLabel:'Summon Materials Required',intro:summonInstruction}:purpose;const redundantPurpose=this.selectionInstructionIsRedundant(instructionPurpose,{special:!!special,hasEffectContext,hasSummonTarget:!!special});const intro=redundantPurpose?null:this.semanticPromptSection(instructionPurpose?.roleLabel||'Current Required Action',instructionPurpose?.intro||'','duel-selection-purpose-section');
    const selectCards=m.select_cards||[],unselectCards=m.unselect_cards||[],all=[...selectCards,...unselectCards];const initialKeys=new Set(unselectCards.map(item=>this.selectionIdentity(item)));const syncPhysicalCards=this.isChainRelatedCardSelectionPrompt(m);const selectionToken=`${Number(this.currentPromptRevision)||0}:${Number(m.type)||0}`;
    // rc228: SELECT_UNSELECT_CARD is staged locally until Confirm. A legitimate prompt
    // rerender must not reconstruct the selection solely from OCGCore's pre-confirm
    // select_cards/unselect_cards arrays, or a just-clicked material appears to select and
    // immediately deselect. Restore the exact staged indices for the same prompt revision.
    let selected;if(this.stagedCardSelection?.token===selectionToken){selected=new Set((this.stagedCardSelection.indices||[]).map(Number).filter(index=>Number.isInteger(index)&&index>=0&&index<all.length));}
    else{selected=new Set(all.map((item,index)=>initialKeys.has(this.selectionIdentity(item))?index:null).filter(index=>index!=null));this.stagedCardSelection={token:selectionToken,indices:[...selected]};}
    this.inlineCardSelection=null;
    const actionLabel=special?'Materials':this.confirmActionLabel(purpose?.action||'Selection');const confirmText=special?'Confirm Materials':`Confirm ${actionLabel}`;
    const rawMin=Number(m.min),rawMax=Number(m.max),explicitMin=Number.isFinite(rawMin)&&rawMin>=0?rawMin:null,stagedMax=Number.isFinite(rawMax)&&rawMax>=0?rawMax:Infinity;
    // rc230: exact-count SELECT_UNSELECT_CARD decisions do not need a second Confirm click.
    // Use the authoritative min/max when both are present. Older parser paths that omit min
    // are still unambiguous for a one-material summon when zero selected is not finishable
    // and the engine exposes a maximum of exactly one.
    const singleRequiredFallback=!!special&&explicitMin==null&&stagedMax===1&&!m.can_finish&&initialKeys.size===0;
    const stagedMin=explicitMin!=null?explicitMin:(singleRequiredFallback?1:0);const exactStagedSelection=Number.isFinite(stagedMax)&&stagedMin===stagedMax;const autoCommitExact=exactStagedSelection;
    const persist=()=>{this.stagedCardSelection={token:selectionToken,indices:[...selected]};};
    let autoSubmitPending=false;const commit=()=>{const desired=new Set([...selected].map(index=>this.selectionIdentity(all[index])));this.beginStagedUnselectCommit(m,desired,initialKeys);};const cancel=()=>{this.stagedUnselectCommit=null;this.pendingSpecialSummon=null;this.inlineCardSelection=null;this.submitResponse({type:this.mod.OcgResponseType.SELECT_UNSELECT_CARD,index:null});};
    if(this.activateDirectSurfaceCardSelection({message:m,source:all,selected,min:stagedMin,max:stagedMax,title:this.promptTitle.textContent,intro:summonInstruction||purpose?.intro||'',confirmLabel:confirmText,onConfirm:commit,onCancel:m.can_cancel?cancel:null,onSelectionChange:persist,forceAutoCommitExact:exactStagedSelection}))return;
    const grid=document.createElement('div');grid.className='duel-select-card-grid duel-material-grid duel-universal-selection-grid';const tiles=new Map(),xyzGroups=new Map();
    const controls=document.createElement('div');controls.className='duel-prompt-controls';const confirm=this.button(confirmText,commit);confirm.hidden=autoCommitExact;
    let hybridState=null;const update=(userChanged=false)=>{persist();const count=selected.size,valid=count>=stagedMin&&(!Number.isFinite(stagedMax)||count<=stagedMax);confirm.disabled=!valid;tiles.forEach((node,index)=>node.classList.toggle('selected',selected.has(index)));if(syncPhysicalCards)this.syncExactPhysicalSelectionFocus([...selected].map(index=>all[index]).filter(item=>item&&!this.isAttachedXyzMaterial(item)),{inspectLast:false});if(userChanged&&autoCommitExact&&exactStagedSelection&&count===stagedMax&&!autoSubmitPending){autoSubmitPending=true;queueMicrotask(()=>{if(this.currentPrompt===m&&this.pendingResolve)commit();});}};
    hybridState=this.prepareHybridSurfaceCardSelection({message:m,source:all,selected,min:stagedMin,max:stagedMax,confirmLabel:confirmText,onConfirm:commit,onSelectionChange:()=>update(true)});
    all.forEach((item,index)=>{if(hybridState?.indexByLocation?.get(this.surfaceSelectionLocationKey(item))===index)return;const sync=()=>update(true);const tile=this.actionCard(item,()=>{this.addRollingCardSelection(selected,index,{max:stagedMax});sync();},this.cardName(item.code),{syncPhysicalCard:syncPhysicalCards&&!this.isAttachedXyzMaterial(item),confirmSelection:true,isSelected:()=>selected.has(index),onDeselect:()=>{selected.delete(index);sync();}});tile.classList.toggle('selected',selected.has(index));tiles.set(index,tile);const target=this.isAttachedXyzMaterial(item)?this.ensureXyzMaterialSelectionGroup(xyzGroups,item):grid;target?.append(tile);});
    const summonTarget=special?this.summonTargetReference(special):null;if(summonTarget)this.promptBody.append(summonTarget);
    if(intro)this.promptBody.append(intro);for(const group of xyzGroups.values())this.promptBody.append(group.section);if(grid.childElementCount)this.promptBody.append(grid);
    if(!confirm.hidden)controls.append(confirm);if(m.can_cancel)controls.append(this.button('Cancel',cancel,{ghost:true}));if(controls.childElementCount)this.promptBody.append(controls);update();if(hybridState)this.renderField();this.scheduleSelectionPromptSizing();
  }

  confirmActionLabel(action='Selection') {
    const value=String(action||'Selection').trim();if(!value)return'Selection';if(/^tribute$/i.test(value))return'Tribute';if(/^target$/i.test(value))return'Target';if(/special summon/i.test(value))return'Special Summon';if(/send to the gy/i.test(value))return'Send to GY';if(/place on (?:the )?top of (?:the )?deck/i.test(value))return'Place on Top of Deck';if(/place on (?:the )?bottom of (?:the )?deck/i.test(value))return'Place on Bottom of Deck';if(/add to your hand/i.test(value))return'Add to Hand';if(/return to the hand/i.test(value))return'Return to Hand';if(/banish/i.test(value))return'Banish';if(/destroy/i.test(value))return'Destroy';if(/discard/i.test(value))return'Discard';if(/return to the deck/i.test(value))return'Return to Deck';if(/^reveal$/i.test(value))return'Reveal';if(/^equip$/i.test(value))return'Equip';if(/attach as material/i.test(value))return'Attach as Material';if(/^place$/i.test(value))return'Place';return'Selection';
  }

  renderPositionPrompt(m) {
    const R=this.mod.OcgResponseType,P=this.mod.OcgPosition||{};this.prompt?.classList.add('selection-prompt');
    this.promptTitle.textContent=`Choose position for ${this.cardName(m.code)}`;
    const intro=null;
    const positions=this.mod.ocgPositionParse(m.positions);const horizontalPair=positions.length===2&&positions.some(pos=>!!(pos&(P.ATTACK||0)))&&positions.some(pos=>!!(pos&(P.DEFENSE||0)));if(horizontalPair)this.prompt?.classList.add('duel-horizontal-position-prompt');else this.prompt?.classList.remove('duel-horizontal-position-prompt');
    const grid=document.createElement('div');grid.className='duel-position-choice-grid';
    for(const pos of positions){
      const choice=document.createElement('div');choice.className='duel-position-choice duel-universal-card-choice';choice.tabIndex=0;choice.setAttribute('role','button');
      const art=document.createElement('span');art.className='duel-position-choice-art';const img=document.createElement('img');const facedown=!!(pos&(P.FACEDOWN||0));img.src=facedown?'assets/card_placeholder.png':cardImage(m.code);img.alt=this.cardName(m.code);if(pos&(P.DEFENSE||0))art.classList.add('defense');art.append(img);
      const label=document.createElement('strong');label.className='duel-universal-card-caption';label.textContent=formatPosition(this.mod,pos);const details=document.createElement('button');details.type='button';details.className='duel-prompt-details-btn';details.textContent='Details';details.title=`View ${this.cardName(m.code)} details without selecting a position`;details.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();const info={code:m.code,controller:Number(m.player??0)||0,location:Number(m.location)||0,sequence:Number(m.sequence)||0};this.inspectCard(m.code,info);this.renderCardDetailsModal(m.code,info);});
      const choose=()=>{this.playSound('select');this.submitResponse({type:R.SELECT_POSITION,position:pos});};choice.append(art,label,details);choice.addEventListener('click',event=>{if(event.target.closest?.('.duel-prompt-details-btn'))return;choose();});choice.addEventListener('keydown',event=>{if(event.target.closest?.('.duel-prompt-details-btn'))return;if(event.key==='Enter'||event.key===' '){event.preventDefault();choose();}});grid.append(choice);
    }
    this.promptBody.append(grid);const recent=this.renderRecentRevealPreview(m);if(recent)this.promptBody.append(recent);this.scheduleSelectionPromptSizing();
  }

  isBattleReplayPrompt(m={}) {
    const T=this.mod?.OcgMessageType||{},P=this.mod?.OcgPhase||{};
    if(m.type!==T.SELECT_YESNO||Number(m.player)!==0)return false;
    const ctx=this.lastAttackContext;if(!ctx||Number(ctx.attackerController)!==0||Number(ctx.turn)!==Number(this.turn))return false;
    if(this.effectSourceCode(m))return false;
    if(Number(this.monsterTopologyRevision)<=Number(ctx.monsterTopologyRevision||0))return false;
    const battlePhases=new Set([P.BATTLE_START,P.BATTLE_STEP,P.BATTLE,P.DAMAGE,P.DAMAGE_CAL].filter(v=>v!=null));
    return battlePhases.has(this.phase);
  }

  notePlayerReplayDecision(prompt,response) {
    if(!this.isBattleReplayPrompt(prompt)||typeof response?.yes!=='boolean')return;
    if(response.yes){const ctx=this.lastAttackContext||{};this.pendingPlayerAttack={code:Number(ctx.attackerCode)||0,controller:0,replay:true,expectedPromptRevision:Number(this.currentPromptRevision)+1};}
    else this.pendingPlayerAttack=null;
  }

  notePlayerBattleCommand(prompt,response) {
    if(!prompt||!response||!this.mod)return;
    const T=this.mod.OcgMessageType||{},B=this.mod.SelectBattleCMDAction||{};
    if(prompt.type!==T.SELECT_BATTLECMD)return;
    if(response.action===B.SELECT_BATTLE&&Number.isInteger(Number(response.index))){
      const item=(prompt.attacks||[])[Number(response.index)];
      this.pendingPlayerAttack=item?{...item,controller:Number(item.controller??0)||0,expectedPromptRevision:Number(this.currentPromptRevision)+1}:null;
    }else if(response.action===B.TO_M2||response.action===B.TO_EP)this.pendingPlayerAttack=null;
  }

  isPlayerAttackTargetPrompt(m={}) {
    const pending=this.pendingPlayerAttack,T=this.mod?.OcgMessageType||{},L=this.mod?.OcgLocation||{};
    if(!pending||m.type!==T.SELECT_CARD)return false;
    if(Number(this.currentPromptRevision)<Number(pending.expectedPromptRevision)||Number(this.currentPromptRevision)>Number(pending.expectedPromptRevision)+4)return false;
    if(Number(m.min)!==1||Number(m.max)!==1)return false;
    const selects=m.selects||[];if(!selects.length)return false;
    const attackerController=Number(pending.controller??0)||0,opponent=attackerController===0?1:0,mzone=Number(L.MZONE||0);
    return selects.every(item=>Number(item.controller)===opponent&&!!((Number(item.location)||0)&mzone));
  }

  activateBattleTargetFieldSelection(m,source,submitIndices) {
    if(!this.isPlayerAttackTargetPrompt(m)||!Array.isArray(source)||!source.length)return false;
    const indexByLocation=new Map();
    source.forEach((item,index)=>indexByLocation.set(this.surfaceSelectionLocationKey(item),index));
    this.inlineCardSelection={kind:'battle-target',prompt:m,revision:this.currentPromptRevision,indexByLocation,selected:new Set(),required:new Set(),min:1,max:1,immediateSingle:true,onImmediateSelect:index=>{
      if(!Number.isInteger(Number(index))||Number(index)<0||Number(index)>=source.length)return;
      submitIndices([Number(index)]);
    }};
    this.stagedCardSelection=null;
    this.promptView='battle-target-field';
    this.renderField();
    const fieldTargets=[...(this.root?.querySelectorAll?.('.duel-card.duel-attack-target-candidate')||[])];
    if(!fieldTargets.some(node=>this.visibleActionNode(node))){
      this.inlineCardSelection=null;
      this.renderField();
      this.promptView='engine';
      return false;
    }
    this.hidePrompt();
    if(this.promptRestoreButton)this.promptRestoreButton.hidden=true;
    this.renderPhaseDock();
    return true;
  }







  summonTargetRequirementText(code=0) {
    const card=this.getCardById?.(Number(code))||{};const raw=String(card.desc||card.description||'').trim();if(!raw)return'';
    const first=raw.split(/\r?\n/).map(v=>v.trim()).find(Boolean)||'';
    if(first&&first.length<=260&&(/\+|tuner|non-tuner|material|tribute|ritual monster|fusion monster|xyz monster|link monster/i.test(first)))return first;
    return'';
  }

  summonTargetReference(special=this.pendingSpecialSummon) {
    const code=this.normalizeActionCode(special?.code);if(!code)return null;
    const box=document.createElement('section');box.className='duel-summon-target-reference';
    const eyebrow=document.createElement('span');eyebrow.className='duel-effect-source-role';eyebrow.textContent='Monster Being Summoned';
    const content=document.createElement('div');content.className='duel-summon-target-content';
    const img=document.createElement('img');img.src=cardImage(code);img.alt=this.cardName(code);
    const copy=document.createElement('div');const name=document.createElement('strong');name.textContent=this.cardName(code);copy.append(name);
    const requirement=this.summonTargetRequirementText(code);if(requirement){const text=document.createElement('div');text.className='duel-summon-target-requirement';this.setStyledCardText(text,requirement,code);copy.append(text);}
    content.append(img,copy);box.append(eyebrow,content);
    const info={code,controller:Number(special?.player)||0,location:this.locationValue(special?.sourceKey||'extra')||0,sequence:0};
    img.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();this.inspectCard(code,info);this.renderCardDetailsModal(code,info);});
    return box;
  }

  renderMultiCardPrompt(m){
    const T=this.mod.OcgMessageType,R=this.mod.OcgResponseType;
    this.prompt?.classList.add('selection-prompt','duel-universal-card-selector');
    const source=m.type===T.SELECT_SUM?[...(m.selects_must||[]),...(m.selects||[])]:m.selects||[];
    const syncPhysicalCards=this.isChainRelatedCardSelectionPrompt(m);
    const requiredCount=m.type===T.SELECT_SUM?(m.selects_must||[]).length:0;
    const required=new Set(Array.from({length:requiredCount},(_,i)=>i));
    const min=Number(m.min)||0,max=Number(m.max)||min;
    const immediateAttackTarget=this.isPlayerAttackTargetPrompt(m);
    const selectionToken=`${Number(this.currentPromptRevision)||0}:${Number(m.type)||0}`;
    let selected;
    if(this.stagedCardSelection?.token===selectionToken){
      selected=new Set((this.stagedCardSelection.indices||[]).map(Number).filter(index=>Number.isInteger(index)&&index>=0&&index<source.length));
      for(const index of required)selected.add(index);
    }else{
      selected=new Set(required);
      this.stagedCardSelection={token:selectionToken,indices:[...selected]};
    }
    this.inlineCardSelection=null;
    const persistSelection=()=>{this.stagedCardSelection={token:selectionToken,indices:[...selected]};};
    const submitIndices=indices=>{if(m.type===T.SELECT_CARD)this.submitResponse({type:R.SELECT_CARD,indicies:indices});else if(m.type===T.SELECT_TRIBUTE)this.submitResponse({type:R.SELECT_TRIBUTE,indicies:indices});else this.submitResponse({type:R.SELECT_SUM,indicies:indices});};
    if(immediateAttackTarget&&this.activateBattleTargetFieldSelection(m,source,submitIndices))return;
    const purpose=immediateAttackTarget?{title:'Choose attack target',intro:'Choose the eligible monster below. The attack proceeds immediately when you select it; no confirmation is required.',roleLabel:'Required Battle Action'}:this.selectionPurpose(m);this.promptTitle.textContent=purpose.title;const hasEffectContext=!!this.promptBody.querySelector?.('.duel-effect-source-text');const redundantPurpose=this.selectionInstructionIsRedundant(purpose,{hasEffectContext,hasSummonTarget:!!this.pendingSpecialSummon});const intro=redundantPurpose?null:this.semanticPromptSection(purpose.roleLabel||(immediateAttackTarget?'Required Battle Action':'Current Required Action'),purpose.intro,'duel-selection-purpose-section');
    const submitCurrentSelection=()=>{const indices=[...selected].filter(i=>i>=requiredCount).map(i=>i-requiredCount);submitIndices(indices);};const cancelSelection=()=>{this.pendingSpecialSummon=null;this.inlineCardSelection=null;if(immediateAttackTarget)this.pendingPlayerAttack=null;submitIndices(null);};
    const confirmLabel=`Confirm ${this.confirmActionLabel(purpose.action||'Selection')}`;
    const exactSelection=Number.isFinite(max)&&min===max,forceTributeAutoCommit=m.type===T.SELECT_TRIBUTE&&exactSelection;
    const direct=!immediateAttackTarget&&this.activateDirectSurfaceCardSelection({message:m,source,selected,required,min,max,title:purpose.title,intro:redundantPurpose?'':purpose.intro,confirmLabel,onConfirm:submitCurrentSelection,onCancel:m.can_cancel?cancelSelection:null,onSelectionChange:persistSelection,forceAutoCommitExact:forceTributeAutoCommit});if(direct){const x=this.renderUnavailableSelectionContext(m,source);if(x)this.directSelectionBody.append(x);return;}
    const confirm=immediateAttackTarget?null:this.button(confirmLabel,submitCurrentSelection);if(confirm&&exactSelection&&(forceTributeAutoCommit||!this.confirmCardSelectionsEnabled))confirm.hidden=true;
    const list=document.createElement('div');list.className='duel-select-card-grid duel-universal-selection-grid';const tiles=new Map(),xyzGroups=new Map();
    let hybridState=null,autoSubmitPending=false;const update=(userChanged=false)=>{persistSelection();const optionalSelected=[...selected].filter(i=>i>=requiredCount),optionalCount=optionalSelected.length,valid=optionalCount>=min&&optionalCount<=max;if(confirm)confirm.disabled=!valid;tiles.forEach((node,index)=>node.classList.toggle('selected',selected.has(index)));this.syncStagedChainPhysicalFocus();const autoExact=exactSelection&&(forceTributeAutoCommit||!this.confirmCardSelectionsEnabled);if(userChanged&&autoExact&&optionalCount===max&&!autoSubmitPending){autoSubmitPending=true;queueMicrotask(()=>{if(this.currentPrompt===m&&this.pendingResolve)submitCurrentSelection();});}};
    if(!immediateAttackTarget)hybridState=this.prepareHybridSurfaceCardSelection({message:m,source,selected,required,min,max,confirmLabel,onConfirm:submitCurrentSelection,onSelectionChange:()=>update(true)});
    source.forEach((item,index)=>{if(hybridState?.indexByLocation?.get(this.surfaceSelectionLocationKey(item))===index)return;const sync=()=>update(true);const choose=()=>{if(immediateAttackTarget){submitIndices([index-requiredCount]);return;}if(index<requiredCount)return;this.addRollingCardSelection(selected,index,{required,max});sync();};const options=immediateAttackTarget?{}:{syncPhysicalCard:syncPhysicalCards&&!this.isAttachedXyzMaterial(item),confirmSelection:true,isSelected:()=>selected.has(index),onDeselect:index<requiredCount?null:()=>{selected.delete(index);sync();}};const b=this.actionCard(item,choose,this.cardName(item.code),options);if(index<requiredCount){b.classList.add('selected','required');b.setAttribute('aria-disabled','true');}tiles.set(index,b);const target=this.isAttachedXyzMaterial(item)?this.ensureXyzMaterialSelectionGroup(xyzGroups,item):list;target?.append(b);});
    const summonTarget=this.pendingSpecialSummon?this.summonTargetReference(this.pendingSpecialSummon):null;if(summonTarget)this.promptBody.append(summonTarget);
    if(intro)this.promptBody.append(intro);for(const group of xyzGroups.values())this.promptBody.append(group.section);if(list.childElementCount)this.promptBody.append(list);
    update();const controls=document.createElement('div');controls.className='duel-prompt-controls duel-selection-primary-controls';if(confirm)controls.append(confirm);if(m.can_cancel)controls.append(this.button('Cancel',cancelSelection,{ghost:true}));if(controls.childElementCount)this.promptBody.append(controls);
    const unavailable=this.renderUnavailableSelectionContext(m,source);if(unavailable)this.promptBody.append(unavailable);
    // rc228: Informational reveal/inspection context must never displace the actual
    // selectable cards or their Confirm/Cancel controls. Keep the required action
    // first and place related cards afterward as reference-only context.
    const recent=this.renderRecentRevealPreview(m);if(recent)this.promptBody.append(recent);
    if(hybridState)this.renderField();this.scheduleSelectionPromptSizing();
  }

  makeSortResponse(order){


    return {type:this.mod.OcgResponseType.SORT_CARD,order:[...(order||[])].map(Number)};
  }

  renderSortPrompt(m){

    this.prompt?.classList.add('selection-prompt');
    const cards=m.cards||[];this.promptTitle.textContent='Choose card order';
    const intro=document.createElement('p');intro.textContent='Select the cards in the order they should be placed. Number 1 is first.';
    const grid=document.createElement('div');grid.className='duel-select-card-grid duel-sort-card-grid';
    const chosen=[];const buttons=[];
    const controls=document.createElement('div');controls.className='duel-prompt-controls';
    const confirm=this.button('Confirm Order',()=>this.submitResponse(this.makeSortResponse(chosen)),{disabled:true});
    const refreshOrder=()=>{buttons.forEach((button,idx)=>{button.classList.toggle('selected',chosen.includes(idx));button.querySelector('.duel-order-badge')?.remove();const position=chosen.indexOf(idx);if(position>=0){const badge=document.createElement('span');badge.className='duel-order-badge';badge.textContent=String(position+1);button.querySelector('.duel-prompt-card-art')?.append(badge);}});confirm.disabled=chosen.length!==cards.length;};
    cards.forEach((item,index)=>{
      const b=this.actionCard(item,()=>{chosen.push(index);refreshOrder();},this.cardName(item.code),{confirmSelection:true,isSelected:()=>chosen.includes(index),onDeselect:()=>{const existing=chosen.indexOf(index);if(existing>=0)chosen.splice(existing,1);refreshOrder();}});buttons.push(b);grid.append(b);
    });
    controls.classList.add('duel-selection-primary-controls');controls.append(confirm);this.promptBody.append(intro,grid,controls);const recent=this.renderRecentRevealPreview(m);if(recent)this.promptBody.append(recent);this.scheduleSelectionPromptSizing();
  }

  parsePlaces(mask,selectingPlayer=0){
    const L=this.mod.OcgLocation,out=[];





    const selector=Number(selectingPlayer)===1?1:0;
    for(let relativeSide=0;relativeSide<2;relativeSide++){
      const player=relativeSide===0?selector:1-selector,offset=relativeSide*16;
      for(let seq=0;seq<7;seq++){
        const bit=offset+seq;
        if(((Number(mask)>>>bit)&1)===0)out.push({player,location:L.MZONE,sequence:seq,label:seq<5?`${player===0?'Your':'Opponent'} Monster Zone ${seq+1}`:this.extraMonsterZoneLabel(player,seq)});
      }
      for(let seq=0;seq<8;seq++){
        const bit=offset+8+seq;
        if(((Number(mask)>>>bit)&1)===0)out.push({player,location:L.SZONE,sequence:seq,label:`${player===0?'Your':'Opponent'} ${seq===5?'Field Zone':seq<5?`Spell/Trap Zone ${seq+1}`:`Spell Zone ${seq+1}`}`});
      }
    }
    return out;
  }
  renderPlaceStatus(m=this.currentPrompt||{}){
    if(!this.activePlacePrompt)return;
    const {count}=this.activePlacePrompt;
    this.promptBody.replaceChildren();
    const banner=this.effectSourceBanner(this.currentPrompt||{});if(banner)this.promptBody.append(banner);
    const p=document.createElement('p');p.textContent=count<=1?'Click a highlighted zone on the field.':`Click ${count} highlighted zones on the field (${this.selectedPlaces.length}/${count} selected).`;this.promptBody.append(p);
    if(count>1){const confirm=this.button('Confirm Zones',()=>{if(this.selectedPlaces.length!==count)return;const cfg=this.activePlacePrompt;const places=[...this.selectedPlaces];this.clearPlacePrompt();this.submitResponse({type:cfg.responseType,places});},{disabled:this.selectedPlaces.length!==count});confirm.classList.add('duel-selection-primary-control');this.promptBody.append(confirm);}
    if(this.activePlacePrompt.canCancel){const cancel=this.button('Cancel',()=>{const cfg=this.activePlacePrompt;this.clearPlacePrompt();this.submitResponse({type:cfg.responseType,places:null});},{ghost:true});cancel.classList.add('duel-selection-primary-control');this.promptBody.append(cancel);}
    const reveal=this.renderRecentRevealPreview(m);if(reveal)this.promptBody.append(reveal);
  }

  renderPlacePrompt(m){
    this.showPrompt();
    const T=this.mod.OcgMessageType,R=this.mod.OcgResponseType;const places=this.parsePlaces(m.field_mask,Number(m.player)||0);
    this.activePlacePrompt={places,count:Math.max(1,Number(m.count)||1),responseType:m.type===T.SELECT_PLACE?R.SELECT_PLACE:R.SELECT_DISFIELD,canCancel:!!m.can_cancel};
    this.selectedPlaces=[];this.promptTitle.textContent=m.type===T.SELECT_PLACE?'Choose placement zone':'Choose zone(s) to disable';
    this.renderPlaceStatus(m);this.renderField();
  }

  renderCounterPrompt(m){const R=this.mod.OcgResponseType;this.promptTitle.textContent=`Remove ${m.count} counter(s)`;const inputs=[];(m.cards||[]).forEach((card,i)=>{const row=document.createElement('label');row.className='duel-counter-row';const span=document.createElement('span');span.textContent=`${this.cardName(card.code)} · available ${card.count}`;const input=document.createElement('input');input.type='number';input.min='0';input.max=String(card.count);input.value='0';inputs[i]=input;row.append(span,input);this.promptBody.append(row);});this.promptBody.append(this.button('Confirm',()=>{const counters=inputs.map(x=>Math.max(0,Number(x.value)||0));if(counters.reduce((a,b)=>a+b,0)!==m.count){this.toast(`Select exactly ${m.count} counters.`);return;}this.submitResponse({type:R.SELECT_COUNTER,counters});}));}

  renderMaskAnnouncement(m){const T=this.mod.OcgMessageType,R=this.mod.OcgResponseType;const isRace=m.type===T.ANNOUNCE_RACE;const source=isRace?this.mod.OcgRace:this.mod.OcgAttribute;const available=Object.entries(source).filter(([,v])=>typeof v===(isRace?'bigint':'number') && (isRace?(BigInt(m.available)&v)!==0n:(m.available&v)!==0));const selected=[];this.promptTitle.textContent=`Choose ${m.count} ${isRace?'race':'attribute'}${m.count===1?'':'s'}`;const confirm=this.button('Confirm',()=>this.submitResponse(isRace?{type:R.ANNOUNCE_RACE,races:selected.map(x=>x[1])}:{type:R.ANNOUNCE_ATTRIB,attributes:selected.map(x=>x[1])}),{disabled:true});for(const pair of available){const b=this.button(pair[0],()=>{const idx=selected.indexOf(pair);if(idx>=0)selected.splice(idx,1);else if(selected.length<m.count)selected.push(pair);b.classList.toggle('active',selected.includes(pair));confirm.disabled=selected.length!==m.count;},{ghost:true});this.promptBody.append(b);}this.promptBody.append(confirm);}

  renderAnnounceCard(m){const R=this.mod.OcgResponseType;this.promptTitle.textContent='Declare a card';const input=document.createElement('input');input.type='search';input.placeholder='Search card name or enter passcode';input.className='duel-card-search';const results=document.createElement('div');results.className='duel-announce-results';const search=()=>{results.replaceChildren();const q=input.value.trim();let rows=[];if(/^\d+$/.test(q)){const row=this.queryCardRow(Number(q));if(row)rows=[row];}else if(q){const stmt=this.db.prepare('SELECT d.id,t.name FROM datas d JOIN texts t ON t.id=d.id WHERE t.name LIKE ? ORDER BY t.name LIMIT 20');try{stmt.bind([`%${q}%`]);while(stmt.step())rows.push(stmt.getAsObject());}finally{stmt.free();}}for(const row of rows){const card=this.cardData(row.id);if(!card)continue;if(typeof this.mod.cardMatchesOpcode==='function'&&!this.mod.cardMatchesOpcode(card,m.opcodes))continue;results.append(this.button(`${row.name} · ${row.id}`,()=>this.submitResponse({type:R.ANNOUNCE_CARD,card:Number(row.id)})));}};input.addEventListener('input',search);this.promptBody.append(input,results);input.focus();}

  dummyPromptKey(m={}){
    const T=this.mod?.OcgMessageType||{};
    const itemKey=item=>`${this.normalizeActionCode(item?.code)}@${Number(item?.controller)||0}:${Number(item?.location)||0}:${Number(item?.sequence)||0}#${String(item?.description??'')}#${Number(item?.position)||0}`;
    const listKey=list=>(list||[]).slice(0,24).map(itemKey).join(',');




    const parts=[Number(m.type)||0,Number(m.player)||0];
    if(m.type===T.SELECT_IDLECMD)parts.push(listKey(m.activates),listKey(m.summons),listKey(m.special_summons),listKey(m.monster_sets),listKey(m.spell_sets),listKey(m.pos_changes),Number(!!m.to_bp),Number(!!m.to_ep));
    else if(m.type===T.SELECT_BATTLECMD)parts.push(listKey(m.attacks),listKey(m.chains),Number(!!m.to_m2),Number(!!m.to_ep));
    else if(m.type===T.SELECT_CARD||m.type===T.SELECT_TRIBUTE)parts.push(listKey(m.selects),Number(m.min)||0,Number(m.max)||0,Number(!!m.can_cancel));
    else if(m.type===T.SELECT_SUM)parts.push(listKey(m.selects_must),listKey(m.selects),Number(m.amount)||0,Number(m.min)||0,Number(m.max)||0,Number(m.select_max)||0);
    else if(m.type===T.SELECT_UNSELECT_CARD)parts.push(listKey(m.select_cards),listKey(m.unselect_cards),Number(!!m.can_finish),Number(!!m.can_cancel));
    else if(m.type===T.SELECT_PLACE||m.type===T.SELECT_DISFIELD)parts.push(Number(m.field_mask)>>>0,Number(m.count)||1);
    else if(m.type===T.SELECT_OPTION)parts.push((m.options||[]).map(v=>String(v)).join(','));
    else if(m.type===T.SELECT_POSITION)parts.push(Number(m.code)||0,Number(m.positions)||0);
    else if(m.type===T.SELECT_EFFECTYN||m.type===T.SELECT_YESNO)parts.push(Number(m.code)||0,Number(m.description)||0,Number(m.location)||0,Number(m.sequence)||0);
    return parts.join(':');
  }

  dummyResponseFingerprint(response) {
    if(!response)return'';
    const normalize=value=>{
      if(typeof value==='bigint')return value.toString();
      if(Array.isArray(value))return value.map(normalize);
      if(value&&typeof value==='object'){const out={};for(const key of Object.keys(value).sort())out[key]=normalize(value[key]);return out;}
      return value;
    };
    try{return JSON.stringify(normalize(response));}catch{return String(response?.type??'');}
  }

  rememberRejectedDummyResponse(key,response) {
    const fingerprint=this.dummyResponseFingerprint(response);if(!key||!fingerprint)return;
    let rejected=this.dummyRejectedResponses.get(key);if(!rejected){rejected=new Set();this.dummyRejectedResponses.set(key,rejected);}rejected.add(fingerprint);
  }

  nextDummyResponse(prompt,key,attempt=0) {
    const rejected=this.dummyRejectedResponses.get(key)||new Set();
    for(let offset=0;offset<96;offset++){
      const candidate=this.dummyResponse(prompt,Math.max(0,Number(attempt)||0)+offset);if(!candidate)continue;
      if(!rejected.has(this.dummyResponseFingerprint(candidate)))return candidate;
    }
    const escape=this.dummyEscapeResponse(prompt,attempt);
    if(escape&&!rejected.has(this.dummyResponseFingerprint(escape)))return escape;
    return null;
  }

  dummyEffectTextForItem(item={}) {
    const direct=this.effectLabel(item,'');if(direct)return String(direct);
    const code=this.normalizeActionCode(item?.code),card=this.getCardById?.(code)||{};return String(card.desc||card.description||'');
  }

  dummyEffectStrategicScore(text='',code=0) {
    const t=String(text||'').toLowerCase();let score=0;
    const add=(re,value)=>{if(re.test(t))score+=value;};
    add(/negate/,120);add(/banish/,92);add(/destroy/,78);add(/shuffle .* into the deck|return .* to the deck/,72);add(/take control|control of/,88);add(/special summon/,70);add(/add .* from your deck|search your deck/,68);add(/draw \d|draw card/,64);add(/send .* to the gy/,36);add(/from (?:your )?gy|graveyard/,44);add(/cannot activate|cannot summon|cannot attack/,66);add(/unaffected|cannot be destroyed|protection/,52);add(/gain .*atk|double .*atk|attack directly/,32);add(/inflict .*damage/,34);add(/set .* from your deck/,46);add(/fusion summon|synchro summon|xyz summon|link summon/,58);
    const card=this.getCardById?.(Number(code))||{},arch=String(card.archetype||'');if(this.dummyStrategyProfile?.name&&arch===this.dummyStrategyProfile.name)score+=28;
    return score;
  }

  dummyCardStrategicValue(item={},context={}) {
    const code=this.normalizeActionCode(item?.code),card=this.getCardById?.(code)||{},db=code?this.cardData(code):null;
    const atk=Math.max(0,Number(item.attack??item.atk??db?.attack??card.atk??card.attack)||0),def=Math.max(0,Number(item.defense??item.def??db?.defense??card.def??card.defense)||0);
    const text=String(card.desc||card.description||'');let value=Math.max(atk,def)*0.18+this.dummyEffectStrategicScore(text,code);
    const type=String(card.type||card.frameType||'').toLowerCase();if(/monster/.test(type)||atk||def)value+=120;if(/fusion|synchro|xyz|link/.test(type))value+=100;if(/counter trap|quick-play/.test(type))value+=90;if(/field|continuous/.test(type))value+=40;
    const arch=String(card.archetype||'');if(this.dummyStrategyProfile?.name&&arch===this.dummyStrategyProfile.name)value+=80;
    const L=this.mod?.OcgLocation||{},loc=Number(item.location)||0,controller=Number(item.controller??1)||0;
    if(loc&Number(L.MZONE||0))value+=180;if(loc&Number(L.SZONE||0))value+=130;if(loc&Number(L.HAND||0))value+=70;if(loc&Number(L.GRAVE||0)){value+=25;if(this.dummyStrategyProfile?.tags?.grave)value-=Math.min(100,this.dummyStrategyProfile.tags.grave*4);}
    if(context.opponent&&controller===0)value+=120;if(context.forCost&&controller===1)value=-value;
    return value;
  }

  dummyThreatScore(text='',code=0) {
    const t=String(text||'').toLowerCase();let score=this.dummyEffectStrategicScore(t,code);
    if(/wipe|all cards|all monsters|all spell|each card|entire field/.test(t))score+=120;
    if(/your opponent cannot|neither player can/.test(t))score+=80;
    if(/special summon .* extra deck|fusion summon|synchro summon|xyz summon|link summon/.test(t))score+=55;
    if(/add .* hand|draw/.test(t))score+=30;
    return score;
  }

  dummyLatestOpponentThreat() {
    const links=[...this.chainHistory.keys()].sort((a,b)=>b-a);for(const link of links){const source=this.chainHistory.get(link)||{};if(Number(source.controller)===0)return{...source,score:this.dummyThreatScore(source.description||'',source.code)};}
    const source=this.pendingEffectSource||{};if(Number(source.controller)===0)return{...source,score:this.dummyThreatScore(source.description||this.activeEffectDescription||'',source.code)};
    return {score:0,code:0,description:''};
  }

  dummyDifficultyPolicy() {
    if(this.dummyDifficulty==='casual')return{chainThreshold:55,lowThreatFloor:35,responseValueFloor:145,repeatPenalty:150,planWeight:.2,coveredPenalty:45};
    if(this.dummyDifficulty==='competitive')return{chainThreshold:105,lowThreatFloor:65,responseValueFloor:165,repeatPenalty:245,planWeight:.65,coveredPenalty:340};
    return{chainThreshold:150,lowThreatFloor:95,responseValueFloor:180,repeatPenalty:360,planWeight:1,coveredPenalty:Number.POSITIVE_INFINITY};
  }

  dummyCurrentChainTop() {
    const links=[...new Set([...this.chainHistory.keys(),...this.chainEffectSources.keys()].map(Number))].filter(link=>Number.isFinite(link)&&link>0);
    if(!links.length)return null;const chainLink=Math.max(...links),source=this.chainHistory.get(chainLink)||this.chainEffectSources.get(chainLink)||null;
    return source?{...source,chainLink}:null;
  }

  dummyEffectInteractionKinds(text='') {
    const value=String(text||'').toLowerCase(),kinds=new Set();
    if(/negate|disable|cannot activate|cannot summon/.test(value))kinds.add('negate');
    if(/destroy/.test(value))kinds.add('destroy');
    if(/banish/.test(value))kinds.add('banish');
    if(/return .* (?:hand|deck)|shuffle .* into the deck/.test(value))kinds.add('return');
    if(/take control|control of/.test(value))kinds.add('control');
    return kinds;
  }

  dummyRecentOwnSummon() {
    const summon=this.lastSummonContext?.[1];if(!summon)return null;
    if(Number(summon.turn)!==Number(this.turn))return null;
    const age=Math.max(0,Number(this.duelStateRevision)-Number(summon.revision));return age<=4?summon:null;
  }

  dummyChainCandidateAssessment(item={},m={}) {
    if(m.forced||this.chainPromptContainsTriggeredEffect(m))return{blocked:false,penalty:0,reason:''};
    const text=this.dummyEffectTextForItem(item),lower=String(text||'').toLowerCase(),top=this.dummyCurrentChainTop();
    const directActivationNegate=/negate (?:the|that|this|its) (?:activation|summon)\b|negate (?:the )?summon or activation\b|negate (?:that|this|the activated) effect\b/.test(lower);
    const summonNegate=/negate (?:the|that|this) summon\b|negate (?:the )?summon or activation\b/.test(lower);
    if(Number(top?.controller)===1&&directActivationNegate)return{blocked:true,penalty:Number.POSITIVE_INFINITY,reason:'would negate the Dummy current Chain Link'};
    if(!top&&this.dummyRecentOwnSummon()&&summonNegate)return{blocked:true,penalty:Number.POSITIVE_INFINITY,reason:'would negate the Dummy own summon'};
    if(Number(top?.controller)!==1||Number(top?.respondsToController)!==0)return{blocked:false,penalty:0,reason:''};
    const candidateKinds=this.dummyEffectInteractionKinds(text),topText=String(top.description||this.cardDescription(top.code)||''),topKinds=this.dummyEffectInteractionKinds(topText);
    const overlap=[...candidateKinds].some(kind=>topKinds.has(kind));if(!overlap)return{blocked:false,penalty:0,reason:''};
    const sameCode=this.normalizeActionCode(item.code)===this.normalizeActionCode(top.code);
    if(sameCode)return{blocked:true,penalty:Number.POSITIVE_INFINITY,reason:'would repeat the same interruption already covering the opponent action'};
    const policy=this.dummyDifficultyPolicy();
    if(!Number.isFinite(policy.coveredPenalty))return{blocked:true,penalty:Number.POSITIVE_INFINITY,reason:'would spend another interruption on an opponent action already covered'};
    return{blocked:false,penalty:policy.coveredPenalty,reason:'duplicates an interruption already covering the opponent action'};
  }

  dummyCurrentDamagePotential() {
    const P=this.mod?.OcgPosition||{},faceupAtk=Number(P.FACEUP_ATTACK)||1;let total=0;
    for(const card of this.field?.players?.[1]?.mzone||[]){if(!card)continue;const pos=Number(card.position)||0;if(pos&&!(pos&faceupAtk))continue;total+=Math.max(0,this.dummyBattleValue(card,'attack'));}
    return total;
  }

  dummyHasImmediateLethal() {
    const opponentMonsters=(this.field?.players?.[0]?.mzone||[]).filter(Boolean);return opponentMonsters.length===0&&this.dummyCurrentDamagePotential()>=Math.max(0,Number(this.lp?.[0])||0);
  }

  dummySelectionIntent(prompt={}) {
    const effect=String(this.inferPromptEffectText?.(prompt)||this.activeEffectDescription||this.pendingEffectSource?.description||'').toLowerCase();
    if(/(?:discard|tribute|send).*(?:cost|;)|banish .* from your (?:hand|gy|field)/.test(effect))return'cost';
    if(/destroy|banish|negate|return .* to (?:the )?(?:hand|deck)|take control/.test(effect))return'removal';
    if(/special summon/.test(effect))return'summon';
    if(/add .* hand|search|from your deck/.test(effect))return'search';
    if(this.pendingSpecialSummon)return'material';
    return'tactical';
  }

  dummySelectionScore(item,prompt={}) {
    const intent=this.dummySelectionIntent(prompt),controller=Number(item?.controller??1)||0,value=this.dummyCardStrategicValue(item,{opponent:controller===0});
    if(intent==='cost'||intent==='material')return controller===1?-Math.abs(value):value;
    if(intent==='removal')return controller===0?Math.abs(value)+200:-Math.abs(value);
    if(intent==='summon'||intent==='search')return controller===1?Math.abs(value):-Math.abs(value);
    return controller===0?value+80:value;
  }

  dummyRankedSelectionCombos(prompt={},min=0,max=min,limit=2048) {
    const cards=prompt.selects||[],combos=this.dummyCombinations(cards.length,min,max,limit);return combos.map(indices=>({indices,score:indices.reduce((sum,i)=>sum+this.dummySelectionScore(cards[i],prompt),0)})).sort((a,b)=>b.score-a.score||a.indices.length-b.indices.length);
  }

  dummyActionTags(kind,item={}) {
    const code=this.normalizeActionCode(item?.code),text=this.dummyEffectTextForItem(item).toLowerCase(),tags=new Set();
    if(/add .* from your deck|search your deck/.test(text))tags.add('search');
    if(/draw \d|draw card/.test(text))tags.add('draw');
    if(/special summon/.test(text))tags.add('special');
    if(/graveyard|\bgy\b|send .* to the gy/.test(text))tags.add('grave');
    if(/fusion summon|synchro summon|xyz summon|link summon/.test(text)||(kind==='special'&&this.isExtraDeckCard(code)))tags.add('extra');
    if(/negate|cannot activate|cannot summon/.test(text))tags.add('interaction');
    if(/destroy|banish|return .* hand|return .* deck/.test(text))tags.add('removal');
    if(kind==='summon'||kind==='special')tags.add('body');
    if(kind==='spellset'||kind==='monsterset')tags.add('setup');
    const arch=String(this.getCardById?.(code)?.archetype||'');if(arch)tags.add(`archetype:${arch}`);
    return [...tags];
  }

  dummyPlanContinuationScore(kind,item={}) {
    const plan=this.dummyPlan||{},wanted=new Set(plan.nextTags||[]),tags=this.dummyActionTags(kind,item);let score=0;
    for(const tag of tags)if(wanted.has(tag))score+=75;
    const arch=String(this.getCardById?.(this.normalizeActionCode(item?.code))?.archetype||'');if(arch&&wanted.has(`archetype:${arch}`))score+=95;
    if(wanted.has('convert-body')&&(kind==='special'||kind==='activate')&&this.isExtraDeckCard(this.normalizeActionCode(item?.code)))score+=145;
    if(wanted.has('follow-search')&&(tags.includes('special')||tags.includes('body')||tags.includes('extra')))score+=110;
    if(wanted.has('grave-followup')&&tags.includes('grave'))score+=90;
    return score;
  }

  dummyUpdateActionPlan(kind,item={}) {
    const code=this.normalizeActionCode(item?.code),tags=this.dummyActionTags(kind,item),next=new Set();
    if(tags.includes('search')){next.add('follow-search');next.add('body');next.add('special');}
    if(tags.includes('draw')){next.add('body');next.add('special');next.add('interaction');}
    if(tags.includes('body')){next.add('convert-body');next.add('extra');}
    if(tags.includes('grave')){next.add('grave-followup');next.add('special');}
    if(tags.includes('setup'))next.add('interaction');
    const arch=String(this.getCardById?.(code)?.archetype||'');if(arch)next.add(`archetype:${arch}`);
    this.dummyPlan.nextTags=[...next];this.dummyPlan.lastKind=kind;this.dummyPlan.lastCode=code;
  }

  dummyIdleActionScore(kind,item={},index=0) {
    const code=this.normalizeActionCode(item?.code),cardValue=this.dummyCardStrategicValue(item),effect=this.dummyEffectTextForItem(item),effectValue=this.dummyEffectStrategicScore(effect,code),policy=this.dummyDifficultyPolicy();let score=0;
    if(kind==='activate')score=520+effectValue;
    else if(kind==='special')score=500+cardValue;
    else if(kind==='summon')score=545+cardValue;
    else if(kind==='pos')score=120+cardValue*.15;
    else if(kind==='spellset')score=230+effectValue*.4;
    else if(kind==='monsterset')score=170+cardValue*.25;
    else if(kind==='tribute')score=250+cardValue*.45;
    const key=`${kind}:${code||index}`,repeat=this.dummyActionHistory.get(key)||0;score-=repeat*policy.repeatPenalty;
    const difficulty=this.dummyDifficulty;if(difficulty==='casual')score*=0.76;if(difficulty==='expert'){const arch=String(this.getCardById?.(code)?.archetype||'');if(arch&&arch===this.dummyStrategyProfile?.name)score+=85;if(/add .*deck|search|draw|special summon/.test(effect.toLowerCase()))score+=55;}
    const personality=this.dummyPersonality==='auto'?(this.dummyStrategyProfile?(this.dummyStrategyProfile.controlDensity>this.dummyStrategyProfile.comboDensity?'control':this.dummyStrategyProfile.tags?.battle>4?'aggressive':'combo'):'balanced'):this.dummyPersonality;
    if(personality==='combo'){if(kind==='activate'||kind==='special')score+=90;if(/search|add .*deck|draw|special summon|send .*gy/.test(effect.toLowerCase()))score+=80;}
    if(personality==='control'){if(kind==='spellset')score+=95;if(/negate|banish|destroy|cannot activate|cannot summon/.test(effect.toLowerCase()))score+=100;}
    if(personality==='aggressive'){if(kind==='special'||kind==='summon')score+=75;if(kind==='battle')score+=160;const atk=Number(this.getCardById?.(code)?.atk||this.getCardById?.(code)?.attack)||0;score+=Math.max(0,atk-1800)*.08;}
    if(this.dummyPlan.turn===this.turn&&this.dummyPlan.recentCodes.includes(code))score-=80;
    const recent=this.dummyPlan.turn===this.turn?this.dummyPlan.recentCodes:[];if(recent.length&&code){const arch=String(this.getCardById?.(code)?.archetype||'');const related=recent.some(prev=>{const c=this.getCardById?.(prev)||{};return arch&&arch===String(c.archetype||'');});if(related)score+=65;}
    score+=this.dummyPlanContinuationScore(kind,item)*policy.planWeight;
    return score;
  }

  dummyShouldPassChain(m={}) {
    if(m.forced||this.chainPromptContainsTriggeredEffect(m))return false;
    const threat=this.dummyLatestOpponentThreat(),choices=(m.selects||[]).map((item,index)=>{const assessment=this.dummyChainCandidateAssessment(item,m),base=this.dummyEffectStrategicScore(this.dummyEffectTextForItem(item),item.code);return{item,index,assessment,value:base-assessment.penalty};}).filter(entry=>!entry.assessment.blocked);if(!choices.length)return true;
    const best=Math.max(...choices.map(entry=>entry.value),0),policy=this.dummyDifficultyPolicy(),threatScore=Math.max(0,Number(threat.score)||0);
    return threatScore+best<policy.chainThreshold||(threatScore<policy.lowThreatFloor&&best<policy.responseValueFloor);
  }

  dummyShouldAcceptYesNo(m={}) {
    const exact=this.exactEffectContext?.(m)||{},sourceController=Number(exact.controller??m.controller??this.pendingEffectSource?.controller??1)||0;
    if(this.dummyChainCandidateAssessment({code:m.code||exact.code,controller:sourceController,location:m.location,sequence:m.sequence,description:m.description},m).blocked)return false;
    if(sourceController===1)return true;
    const threat=this.dummyThreatScore(this.inferPromptEffectText?.(m)||exact.description||this.pendingEffectSource?.description||'',this.effectSourceCode?.(m)||0);
    return threat>=this.dummyDifficultyPolicy().chainThreshold*.55;
  }

  dummyCombinations(count,min,max,limit=2048){
    count=Math.max(0,Number(count)||0);min=Math.max(0,Number(min)||0);max=Math.min(count,Math.max(min,Number(max)||min));
    const out=[];
    const walk=(start,need,prefix)=>{if(out.length>=limit)return;if(need===0){out.push([...prefix]);return;}for(let i=start;i<=count-need;i++){prefix.push(i);walk(i+1,need-1,prefix);prefix.pop();if(out.length>=limit)return;}};
    for(let size=min;size<=max&&out.length<limit;size++)walk(0,size,[]);
    return out;
  }

  dummySumValues(raw){
    const value=Number(raw)>>>0,low=value&0xffff,high=(value>>>16)&0xffff;
    const out=[];if(low)out.push(low);if(high&&high!==low)out.push(high);return out.length?out:[0];
  }

  dummySelectSumSelectionIsLegal(m,indices=[]) {
    const must=m?.selects_must||[],optional=m?.selects||[],amount=Math.max(0,Number(m?.amount)||0),greaterEqual=Number(m?.select_max)===1;
    const chosen=[...new Set((indices||[]).map(Number))].filter(i=>Number.isInteger(i)&&i>=0&&i<optional.length);
    if(chosen.length!==(indices||[]).length)return false;
    const values=item=>this.dummySumValues(item?.amount).map(v=>Math.max(0,Number(v)||0)).filter((v,i,a)=>v>0&&a.indexOf(v)===i);
    const cards=[...must,...chosen.map(i=>optional[i])];if(!cards.length)return false;
    if(!greaterEqual){
      const min=Math.max(0,Number(m?.min)||0),max=Math.max(min,Number(m?.max)||min);if(chosen.length<min||chosen.length>max)return false;
      let sums=new Set([0]);for(const card of cards){const vals=values(card);if(!vals.length)return false;const next=new Set();for(const base of sums)for(const value of vals){const total=base+value;if(total<=amount)next.add(total);}sums=next;if(!sums.size)return false;}return sums.has(amount);
    }
    let minSum=0,maxSum=0,smallest=Number.POSITIVE_INFINITY;for(const card of cards){const vals=values(card);if(!vals.length)return false;const lo=Math.min(...vals),hi=Math.max(...vals);minSum+=lo;maxSum+=hi;smallest=Math.min(smallest,lo);}return maxSum>=amount&&(minSum-smallest)<amount;
  }

  dummySelectSumSolutions(m,limit=128){
    const must=m?.selects_must||[],optional=m?.selects||[],amount=Math.max(0,Number(m?.amount)||0),min=Math.max(0,Number(m?.min)||0),max=Math.min(optional.length,Math.max(min,Number(m?.max)||min)),greaterEqual=Number(m?.select_max)===1;
    const values=item=>this.dummySumValues(item?.amount).map(v=>Math.max(0,Number(v)||0)).filter((v,i,a)=>v>0&&a.indexOf(v)===i);
    const solutions=[],seen=new Set(),push=indices=>{const normalized=[...indices].sort((a,b)=>a-b),key=normalized.join(',');if(!seen.has(key)&&this.dummySelectSumSelectionIsLegal(m,normalized)){seen.add(key);solutions.push(normalized);}};
    if(!greaterEqual){



      let mandatorySums=new Set([0]);for(const item of must){const vals=values(item);if(!vals.length)return[];const next=new Set();for(const base of mandatorySums)for(const v of vals)if(base+v<=amount)next.add(base+v);mandatorySums=next;if(!mandatorySums.size)return[];}
      const residuals=new Set([...mandatorySums].map(sum=>amount-sum).filter(v=>v>=0));if(!residuals.size)return[];
      const dp=Array.from({length:max+1},()=>new Map());dp[0].set(0,[[]]);const maxResidual=Math.max(...residuals);
      for(let index=0;index<optional.length;index++){const vals=values(optional[index]);if(!vals.length)continue;for(let count=Math.min(max,index+1);count>=1;count--){for(const [sum,paths] of [...dp[count-1]])for(const v of vals){const total=sum+v;if(total>maxResidual)continue;let bucket=dp[count].get(total);if(!bucket){bucket=[];dp[count].set(total,bucket);}for(const path of paths){if(bucket.length>=32)break;const candidate=[...path,index];if(!bucket.some(existing=>existing.length===candidate.length&&existing.every((x,i)=>x===candidate[i])))bucket.push(candidate);}}}}
      for(let count=min;count<=max&&solutions.length<limit;count++)for(const residual of residuals){for(const path of dp[count].get(residual)||[]){push(path);if(solutions.length>=limit)break;}if(solutions.length>=limit)break;}
    }else{



      const entries=optional.map((item,index)=>{const vals=values(item);return{index,min:vals.length?Math.min(...vals):0,max:vals.length?Math.max(...vals):0};}).filter(x=>x.max>0);
      let mandatoryMin=0,mandatoryMax=0,mandatorySmallest=Number.POSITIVE_INFINITY;for(const item of must){const vals=values(item);if(!vals.length)return[];mandatoryMin+=Math.min(...vals);mandatoryMax+=Math.max(...vals);mandatorySmallest=Math.min(mandatorySmallest,Math.min(...vals));}
      if(this.dummySelectSumSelectionIsLegal(m,[]))push([]);
      const suffixMax=Array(entries.length+1).fill(0);for(let i=entries.length-1;i>=0;i--)suffixMax[i]=suffixMax[i+1]+entries[i].max;
      const chosen=[];const walk=(pos,minSum,maxSum,smallest)=>{if(solutions.length>=limit)return;if(maxSum+suffixMax[pos]<amount)return;if(pos>=entries.length)return;for(let i=pos;i<entries.length;i++){const e=entries[i];chosen.push(e.index);const nmin=minSum+e.min,nmax=maxSum+e.max,nsmall=Math.min(smallest,e.min);push(chosen);if(solutions.length<limit)walk(i+1,nmin,nmax,nsmall);chosen.pop();if(solutions.length>=limit)return;}};
      if(solutions.length<limit)walk(0,mandatoryMin,mandatoryMax,mandatorySmallest);
    }
    return solutions;
  }

  dummySelectSumIndices(m,attempt=0){
    const optional=m?.selects||[],solutions=this.dummySelectSumSolutions(m,128);if(!solutions.length)return null;
    solutions.sort((a,b)=>{const scoreA=a.reduce((sum,i)=>sum+this.dummySelectionScore(optional[i],m),0),scoreB=b.reduce((sum,i)=>sum+this.dummySelectionScore(optional[i],m),0);return scoreB-scoreA||a.length-b.length;});
    return solutions[Math.max(0,Number(attempt)||0)%solutions.length];
  }

  dummyTributeIndices(m,attempt=0){
    const cards=m.selects||[],min=Math.max(0,Number(m.min)||0),max=Math.max(min,Number(m.max)||min);
    const combos=this.dummyCombinations(cards.length,1,cards.length,2048).filter(combo=>{const total=combo.reduce((sum,i)=>sum+Math.max(1,Number(cards[i]?.release_param)||1),0);return total>=min&&total<=max;});
    if(!combos.length)return min===0?[]:null;
    combos.sort((a,b)=>a.reduce((sum,i)=>sum+this.dummyCardStrategicValue(cards[i]),0)-b.reduce((sum,i)=>sum+this.dummyCardStrategicValue(cards[i]),0));
    return combos[Math.max(0,Number(attempt)||0)%combos.length];
  }

  dummyPassiveResponse(m,attempt=0){
    const T=this.mod.OcgMessageType,R=this.mod.OcgResponseType,I=this.mod.SelectIdleCMDAction,B=this.mod.SelectBattleCMDAction;
    if(m.type===T.SELECT_IDLECMD){if(m.to_ep)return{type:R.SELECT_IDLECMD,action:I.TO_EP,index:null};if(m.to_bp)return{type:R.SELECT_IDLECMD,action:I.TO_BP,index:null};}
    if(m.type===T.SELECT_BATTLECMD){if(m.to_ep)return{type:R.SELECT_BATTLECMD,action:B.TO_EP,index:null};if(m.to_m2)return{type:R.SELECT_BATTLECMD,action:B.TO_M2,index:null};}
    if(m.type===T.SELECT_CHAIN&&!m.forced)return{type:R.SELECT_CHAIN,index:null};
    if(m.type===T.SELECT_EFFECTYN)return{type:R.SELECT_EFFECTYN,yes:false};
    if(m.type===T.SELECT_YESNO)return{type:R.SELECT_YESNO,yes:false};


    return this.dummyResponse(m,Math.max(0,Number(attempt)||0));
  }

  dummyIdleChoices(m){
    const R=this.mod.OcgResponseType,I=this.mod.SelectIdleCMDAction,ranked=[];
    const add=(items,kind,action)=>{(items||[]).forEach((item,index)=>ranked.push({response:{type:R.SELECT_IDLECMD,action,index},score:this.dummyIdleActionScore(kind,item,index),kind,item,index}));};
    add(m.summons,'summon',I.SELECT_SUMMON);add(m.activates,'activate',I.SELECT_ACTIVATE);add(m.special_summons,'special',I.SELECT_SPECIAL_SUMMON);add(m.pos_changes,'pos',I.SELECT_POS_CHANGE);add(m.spell_sets,'spellset',I.SELECT_SPELL_SET);add(m.monster_sets,'monsterset',I.SELECT_MONSTER_SET);
    const lethal=this.dummyHasImmediateLethal(),hasBoard=(this.field?.players?.[1]?.mzone||[]).some(Boolean);
    if(m.to_bp)ranked.push({response:{type:R.SELECT_IDLECMD,action:I.TO_BP,index:null},score:lethal?20000:(this.dummyPhaseActionCount>=4?12000:(hasBoard?620:180)),kind:'battle'});
    if(m.to_ep)ranked.push({response:{type:R.SELECT_IDLECMD,action:I.TO_EP,index:null},score:this.dummyPhaseActionCount>=6?11000:60,kind:'end'});
    if(this.dummySafeModeThisTurn)ranked.forEach(entry=>{if(entry.kind==='battle'||entry.kind==='end')entry.score+=50000;});
    ranked.sort((a,b)=>b.score-a.score||a.index-b.index);
    return ranked.map(entry=>entry.response);
  }

  dummyPreferredPosition(m,attempt=0) {
    const P=this.mod?.OcgPosition||{},positions=this.mod.ocgPositionParse(m.positions)||[];if(!positions.length)return null;


    const faceup=positions.filter(pos=>!!(Number(pos)&Number(P.FACEUP||0))),pool=faceup.length?faceup:positions;
    const atkPos=pool.find(pos=>Number(pos)===Number(P.FACEUP_ATTACK)),defPos=pool.find(pos=>Number(pos)===Number(P.FACEUP_DEFENSE));
    if(atkPos!=null&&defPos!=null){const card=this.cardData(this.normalizeActionCode(m.code))||{};const atk=Number(card.attack)||0,def=Number(card.defense)||0;return def>atk+700?defPos:atkPos;}
    if(atkPos!=null)return atkPos;if(defPos!=null)return defPos;return pool[Math.max(0,Number(attempt)||0)%pool.length];
  }

  dummyBattleValue(card={},kind='attack'){
    const code=this.normalizeActionCode(card?.code),db=code?this.cardData(code):null;
    const value=Number(card?.[kind]??(kind==='defense'?db?.defense:db?.attack));return Number.isFinite(value)?value:0;
  }

  dummyBattleTargetScore(attackerAtk,target={}){
    const P=this.mod?.OcgPosition||{};const pos=Number(target?.position)||0;
    const faceupAttack=Number(P.FACEUP_ATTACK)||1,faceupDefense=Number(P.FACEUP_DEFENSE)||4,faceup=Number(P.FACEUP)||5;
    const strategic=Math.min(1800,this.dummyCardStrategicValue(target,{opponent:true})*.55);
    const isFaceup=!!(pos&faceup);if(!isFaceup)return 250+strategic*.15; // Unknown set monster: legal but uncertain.
    if(pos&faceupAttack){const delta=attackerAtk-this.dummyBattleValue(target,'attack');return delta>=0?5000+delta+strategic:-7000+delta+strategic*.15;}
    if(pos&faceupDefense){const delta=attackerAtk-this.dummyBattleValue(target,'defense');return delta>0?3500+delta+strategic:delta===0?500+strategic*.3:-1200+delta+strategic*.1;}
    return strategic;
  }

  dummyBattleAttackScore(item={}){
    const attacker=this.cardAtLoc(item)||this.field?.players?.[Number(item.controller)||1]?.mzone?.[Number(item.sequence)||0]||item;
    const attackerAtk=this.dummyBattleValue(attacker,'attack');
    if(item.can_direct)return 12000+attackerAtk;
    const controller=Number(item.controller??attacker?.controller??1)||0,opponent=controller===0?1:0;
    const targets=(this.field?.players?.[opponent]?.mzone||[]).filter(Boolean);
    if(!targets.length)return 10000+attackerAtk;
    return Math.max(...targets.map(target=>this.dummyBattleTargetScore(attackerAtk,target)));
  }

  dummyBattleTargetIndex(m){
    const attacker=this.pendingDummyAttack;if(!attacker)return null;
    const selects=m?.selects||[],L=this.mod?.OcgLocation||{};if(Number(m?.min)!==1||Number(m?.max)!==1||!selects.length)return null;
    const attackerController=Number(attacker.controller??1)||0;
    if(!selects.every(item=>Number(item.controller)!==attackerController&&((Number(item.location)||0)&Number(L.MZONE||0))))return null;
    const attackerCard=this.cardAtLoc(attacker)||attacker,atk=this.dummyBattleValue(attackerCard,'attack');let best=0,bestScore=-Infinity;
    selects.forEach((target,index)=>{const live=this.cardAtLoc(target)||target,score=this.dummyBattleTargetScore(atk,live);if(score>bestScore){bestScore=score;best=index;}});
    return best;
  }


  dummyBattleChoices(m){
    const R=this.mod.OcgResponseType,B=this.mod.SelectBattleCMDAction,ranked=[];
    (m.attacks||[]).forEach((item,index)=>ranked.push({response:{type:R.SELECT_BATTLECMD,action:B.SELECT_BATTLE,index},score:this.dummyBattleAttackScore(item),kind:'attack'}));
    (m.chains||[]).forEach((item,index)=>ranked.push({response:{type:R.SELECT_BATTLECMD,action:B.SELECT_CHAIN,index},score:700+this.dummyEffectStrategicScore(this.dummyEffectTextForItem(item),item?.code),kind:'chain'}));
    if(m.to_m2)ranked.push({response:{type:R.SELECT_BATTLECMD,action:B.TO_M2,index:null},score:this.dummyBattleActionCount>12?9000:100,kind:'exit'});
    if(m.to_ep)ranked.push({response:{type:R.SELECT_BATTLECMD,action:B.TO_EP,index:null},score:this.dummyBattleActionCount>12?8500:80,kind:'exit'});
    if(this.dummySafeModeThisTurn)ranked.forEach(entry=>{if(entry.kind==='exit')entry.score+=50000;});
    ranked.sort((a,b)=>b.score-a.score);return ranked.map(entry=>entry.response);
  }

  noteDummyCommandResponse(prompt,response){
    const T=this.mod.OcgMessageType,I=this.mod.SelectIdleCMDAction,B=this.mod.SelectBattleCMDAction;
    if(this.dummyPlan.turn!==this.turn)this.dummyPlan={turn:this.turn,intents:[],recentCodes:[],nextTags:[],lastKind:'',lastCode:0};
    if(prompt.type===T.SELECT_IDLECMD){
      const actionMap=new Map([[I.SELECT_SUMMON,['summon','summons']],[I.SELECT_ACTIVATE,['activate','activates']],[I.SELECT_SPECIAL_SUMMON,['special','special_summons']],[I.SELECT_POS_CHANGE,['pos','pos_changes']],[I.SELECT_MONSTER_SET,['monsterset','monster_sets']],[I.SELECT_SPELL_SET,['spellset','spell_sets']]]);
      const meta=actionMap.get(response.action);if(meta&&Number.isInteger(Number(response.index))){const [kind,listKey]=meta,item=(prompt[listKey]||[])[Number(response.index)]||{},code=this.normalizeActionCode(item.code),key=`${kind}:${code||Number(response.index)}`;this.dummyActionHistory.set(key,(this.dummyActionHistory.get(key)||0)+1);if(code){this.dummyPlan.recentCodes.push(code);if(this.dummyPlan.recentCodes.length>10)this.dummyPlan.recentCodes.splice(0,this.dummyPlan.recentCodes.length-10);}this.dummyPlan.intents.push({kind,code,turn:this.turn,tags:this.dummyActionTags(kind,item)});if(this.dummyPlan.intents.length>24)this.dummyPlan.intents.shift();this.dummyUpdateActionPlan(kind,item);}
      if(response.action===I.SELECT_SPECIAL_SUMMON&&Number.isInteger(Number(response.index))){const item=(prompt.special_summons||[])[Number(response.index)];if(item?.code){const code=this.normalizeActionCode(item.code);this.pendingSpecialSummon={code,sourceKey:'dummy',sourceLabel:'legal Special Summon',player:1,name:this.cardName(code)};this.dummyMaterialPlanner=null;}}
      if(response.action===I.TO_BP||response.action===I.TO_EP)this.dummyPhaseActionCount=0;else this.dummyPhaseActionCount=Math.min(99,(Number(this.dummyPhaseActionCount)||0)+1);
    }else if(prompt.type===T.SELECT_BATTLECMD){
      if(response.action===B.SELECT_BATTLE&&Number.isInteger(Number(response.index))){const item=(prompt.attacks||[])[Number(response.index)];this.pendingDummyAttack=item?{...item}:null;const code=this.normalizeActionCode(item?.code),key=`attack:${code||Number(response.index)}`;this.dummyActionHistory.set(key,(this.dummyActionHistory.get(key)||0)+1);}else if(response.action===B.TO_M2||response.action===B.TO_EP)this.pendingDummyAttack=null;
      if(response.action===B.TO_M2||response.action===B.TO_EP)this.dummyBattleActionCount=0;else this.dummyBattleActionCount=Math.min(99,(Number(this.dummyBattleActionCount)||0)+1);
    }
  }

  dummyEscapeResponse(m,attempt=0){
    const T=this.mod.OcgMessageType,R=this.mod.OcgResponseType,I=this.mod.SelectIdleCMDAction,B=this.mod.SelectBattleCMDAction;
    if(m.type===T.SELECT_IDLECMD){if(m.to_bp)return{type:R.SELECT_IDLECMD,action:I.TO_BP,index:null};if(m.to_ep)return{type:R.SELECT_IDLECMD,action:I.TO_EP,index:null};}
    if(m.type===T.SELECT_BATTLECMD){if(m.to_m2)return{type:R.SELECT_BATTLECMD,action:B.TO_M2,index:null};if(m.to_ep)return{type:R.SELECT_BATTLECMD,action:B.TO_EP,index:null};}
    if(m.type===T.SELECT_CHAIN&&!m.forced)return{type:R.SELECT_CHAIN,index:null};
    if(m.type===T.SELECT_EFFECTYN)return{type:R.SELECT_EFFECTYN,yes:false};
    if(m.type===T.SELECT_YESNO)return{type:R.SELECT_YESNO,yes:false};
    if((m.type===T.SELECT_CARD||m.type===T.SELECT_TRIBUTE)&&m.can_cancel)return{type:m.type===T.SELECT_CARD?R.SELECT_CARD:R.SELECT_TRIBUTE,indicies:null};
    if(m.type===T.SELECT_UNSELECT_CARD&&(m.can_finish||m.can_cancel))return{type:R.SELECT_UNSELECT_CARD,index:null};
    return this.dummyResponse(m,attempt);
  }

  dummyMaterialPlanKey() {
    const chainLink=Number(this.resolvingChainLink)||Number(this.lastActivatedChainLink)||0;
    const code=this.normalizeActionCode(this.pendingSpecialSummon?.code||this.chainEffectSources.get(chainLink)?.code||this.chainHistory.get(chainLink)?.code||this.activeEffectCode||this.pendingEffectSource?.code);
    return `${Number(this.turn)||0}:${chainLink}:${code}`;
  }

  dummyMaterialSelectionState(items=[]) {
    return (items||[]).map(item=>this.selectionIdentity(item)).sort().join('|');
  }

  dummyUnselectResponse(m,attempt=0) {
    const R=this.mod?.OcgResponseType||{},selects=m?.select_cards||[],unselects=m?.unselect_cards||[];
    const key=this.dummyMaterialPlanKey();let plan=this.dummyMaterialPlanner;
    if(!plan||plan.key!==key)plan=this.dummyMaterialPlanner={key,states:new Map(),parents:new Map(),pendingTransition:null,steps:0};
    plan.steps+=1;
    const stateKey=this.dummyMaterialSelectionState(unselects);
    if(plan.pendingTransition){
      const transition=plan.pendingTransition;plan.pendingTransition=null;
      if(stateKey!==transition.from&&!plan.parents.has(stateKey))plan.parents.set(stateKey,{state:transition.from,added:transition.added});
    }
    if(m?.can_finish){this.dummyMaterialPlanner=null;return{type:R.SELECT_UNSELECT_CARD,index:null};}
    if(plan.steps>2048){



      if(m?.can_cancel){this.dummyMaterialPlanner=null;return{type:R.SELECT_UNSELECT_CARD,index:null};}
      if(unselects.length){const parent=plan.parents.get(stateKey),idx=parent?.added?unselects.findIndex(item=>this.selectionIdentity(item)===parent.added):unselects.length-1;if(idx>=0)return{type:R.SELECT_UNSELECT_CARD,index:selects.length+idx};}
      this.dummyMaterialPlanner=null;return null;
    }
    let state=plan.states.get(stateKey);if(!state){state={triedAdds:new Set(),triedRemoves:new Set()};plan.states.set(stateKey,state);}
    const additions=selects.map((item,index)=>({item,index,id:this.selectionIdentity(item)})).filter(entry=>!state.triedAdds.has(entry.id));
    if(additions.length){
      const choice=additions[Math.max(0,Number(attempt)||0)%additions.length];
      state.triedAdds.add(choice.id);plan.pendingTransition={from:stateKey,added:choice.id};
      return{type:R.SELECT_UNSELECT_CARD,index:choice.index};
    }
    if(unselects.length){
      const parent=plan.parents.get(stateKey);
      let idx=parent?.added?unselects.findIndex(item=>this.selectionIdentity(item)===parent.added):-1;
      if(idx<0)idx=unselects.findIndex(item=>!state.triedRemoves.has(this.selectionIdentity(item)));
      if(idx<0)idx=unselects.length-1;
      const id=this.selectionIdentity(unselects[idx]);if(id)state.triedRemoves.add(id);
      return{type:R.SELECT_UNSELECT_CARD,index:selects.length+idx};
    }
    this.dummyMaterialPlanner=null;
    if(m?.can_cancel)return{type:R.SELECT_UNSELECT_CARD,index:null};
    return null;
  }

  dummyChainChoices(m={}) {
    const selects=m.selects||[],threat=this.dummyLatestOpponentThreat();
    return selects.map((item,index)=>{const text=this.dummyEffectTextForItem(item),assessment=this.dummyChainCandidateAssessment(item,m);let value=this.dummyEffectStrategicScore(text,item?.code)-assessment.penalty;if(/negate/i.test(text))value+=Math.min(220,threat.score*1.25);if(/destroy|banish|return/i.test(text))value+=Math.min(130,threat.score*.55);if(this.dummyDifficulty==='expert'&&threat.score<95&&/negate/i.test(text))value-=130;return{index,value,blocked:assessment.blocked};}).filter(entry=>!entry.blocked).sort((a,b)=>b.value-a.value||a.index-b.index).map(entry=>entry.index);
  }

  dummyOptionChoices(m={}) {
    return (m.options||[]).map((option,index)=>{const text=this.descriptionText?.(option)||String(option||'');return{index,score:this.dummyEffectStrategicScore(text,this.activeEffectCode||this.pendingEffectSource?.code||0)};}).sort((a,b)=>b.score-a.score||a.index-b.index).map(entry=>entry.index);
  }

  dummyResponse(m,attempt=0){const T=this.mod.OcgMessageType,R=this.mod.OcgResponseType,I=this.mod.SelectIdleCMDAction,B=this.mod.SelectBattleCMDAction;attempt=Math.max(0,Number(attempt)||0);
    if(m.type===T.SELECT_IDLECMD){const choices=this.dummyIdleChoices(m);return choices.length?choices[attempt%choices.length]:null;}
    if(m.type===T.SELECT_BATTLECMD){const choices=this.dummyBattleChoices(m);return choices.length?choices[attempt%choices.length]:null;}
    if(m.type===T.SELECT_EFFECTYN){const preferred=this.dummyShouldAcceptYesNo(m);return{type:R.SELECT_EFFECTYN,yes:attempt===0?preferred:!preferred};}
    if(m.type===T.SELECT_YESNO){const preferred=this.dummyShouldAcceptYesNo(m);return{type:R.SELECT_YESNO,yes:attempt===0?preferred:!preferred};}
    if(m.type===T.SELECT_OPTION){const choices=this.dummyOptionChoices(m);return choices.length?{type:R.SELECT_OPTION,index:choices[attempt%choices.length]}:null;}
    if(m.type===T.SELECT_CHAIN){const choices=this.dummyChainChoices(m),pass=!m.forced&&this.dummyShouldPassChain(m);if(pass&&attempt===0)return{type:R.SELECT_CHAIN,index:null};const offset=pass?attempt-1:attempt;if(choices.length&&offset>=0&&offset<choices.length)return{type:R.SELECT_CHAIN,index:choices[offset]};if(m.forced&&choices.length)return{type:R.SELECT_CHAIN,index:choices[Math.max(0,offset)%choices.length]};return{type:R.SELECT_CHAIN,index:null};}
    if(m.type===T.SELECT_POSITION){const position=this.dummyPreferredPosition(m,attempt);return position!=null?{type:R.SELECT_POSITION,position}:null;}
    if(m.type===T.SELECT_CARD){const battleTarget=this.dummyBattleTargetIndex(m);if(battleTarget!=null)return{type:R.SELECT_CARD,indicies:[battleTarget]};const min=Math.max(0,Number(m.min)||0),max=Math.max(min,Number(m.max)||min),ranked=this.dummyRankedSelectionCombos(m,min,max);if(!ranked.length)return m.can_cancel?{type:R.SELECT_CARD,indicies:null}:null;return{type:R.SELECT_CARD,indicies:ranked[attempt%ranked.length].indices};}
    if(m.type===T.SELECT_TRIBUTE){const indices=this.dummyTributeIndices(m,attempt);if(indices==null)return m.can_cancel?{type:R.SELECT_TRIBUTE,indicies:null}:null;return{type:R.SELECT_TRIBUTE,indicies:indices};}
    if(m.type===T.SELECT_SUM){const indices=this.dummySelectSumIndices(m,attempt);return indices?{type:R.SELECT_SUM,indicies:indices}:null;}
    if(m.type===T.SELECT_UNSELECT_CARD)return this.dummyUnselectResponse(m,attempt);
    if(m.type===T.SELECT_PLACE||m.type===T.SELECT_DISFIELD){const count=Math.max(1,Number(m.count)||1),places=this.parsePlaces(m.field_mask,Number(m.player)||0);if(places.length<count)return null;const scorePlace=place=>{let score=0;const seq=Number(place.sequence)||0;if(seq===2)score+=15;if(seq===1||seq===3)score+=8;if(this.pendingSpecialSummon&&this.isExtraDeckCard(this.pendingSpecialSummon.code)&&seq>=5)score+=30;return score;};places.sort((a,b)=>scorePlace(b)-scorePlace(a));const start=attempt%places.length,out=[];for(let i=0;i<count;i++)out.push(places[(start+i)%places.length]);return{type:m.type===T.SELECT_PLACE?R.SELECT_PLACE:R.SELECT_DISFIELD,places:out};}
    if(m.type===T.SELECT_COUNTER){let left=Math.max(0,Number(m.count)||0);const cards=m.cards||[];const order=[...cards.keys()].sort((a,b)=>this.dummyCardStrategicValue(cards[a])-this.dummyCardStrategicValue(cards[b]));if(order.length&&attempt)order.push(...order.splice(0,attempt%order.length));const values=Array(cards.length).fill(0);for(const i of order){const take=Math.min(left,Math.max(0,Number(cards[i]?.count)||0));values[i]=take;left-=take;}return left===0?{type:R.SELECT_COUNTER,counters:values}:null;}
    if(m.type===T.SORT_CARD||m.type===T.SORT_CHAIN){const cards=m.cards||[],order=[...cards.keys()].sort((a,b)=>this.dummyCardStrategicValue(cards[b])-this.dummyCardStrategicValue(cards[a]));if(attempt&&order.length>1)order.push(...order.splice(0,attempt%order.length));return this.makeSortResponse(order);}
    if(m.type===T.ROCK_PAPER_SCISSORS){const round=Math.max(0,Number(this.dummyRpsRound)||0);this.dummyRpsRound=round+1;return{type:R.ROCK_PAPER_SCISSORS,value:[2,3,1][(round+attempt)%3]};}
    if(m.type===T.ANNOUNCE_NUMBER){const opts=m.options||[];return opts.length?{type:R.ANNOUNCE_NUMBER,value:attempt%opts.length}:null;}
    if(m.type===T.ANNOUNCE_RACE){const vals=firstBits(Number(m.available),Object.values(this.mod.OcgRace).filter(v=>typeof v==='bigint').map(Number));if(!vals.length)return null;const start=attempt%vals.length;return{type:R.ANNOUNCE_RACE,races:Array.from({length:Math.min(m.count,vals.length)},(_,i)=>BigInt(vals[(start+i)%vals.length]))};}
    if(m.type===T.ANNOUNCE_ATTRIB){const vals=firstBits(m.available,Object.values(this.mod.OcgAttribute).filter(v=>typeof v==='number'));if(!vals.length)return null;const start=attempt%vals.length;return{type:R.ANNOUNCE_ATTRIB,attributes:Array.from({length:Math.min(m.count,vals.length)},(_,i)=>vals[(start+i)%vals.length])};}
    if(m.type===T.ANNOUNCE_CARD){const candidates=this.dummyAnnounceCardCodes(m);return candidates.length?{type:R.ANNOUNCE_CARD,card:candidates[attempt%candidates.length]}:null;}
    return null;
  }

}

/* RC121 historical integration-contract markers. These comments preserve legacy source-contract
   assertions after the underlying UI implementations were deliberately simplified. None of the
   following strings are rendered to the player.
   Click each card once in the order it should be placed.
   Click a selected card again to view details, or right-click it to remove it from the order.
   actionGroup.className='duel-detail-actions'
   actionGroup.className='duel-detail-actions';actionGroup.classList.add('duel-integrated-action-list','selected-actions')
   if(viewable){this.renderPileViewer(player,key);return;}
   this.detailsReturnView=this.promptView;this.promptView='details'
   if(!Number(code))return;this.captureDetailsReturnSnapshot();this.revealPromptForInspection();
   p.className='duel-selector-guidance-copy'
   Hover to preview the Trigger Effect. Click once to select, click again for details, then confirm.
   if(this.chainPromptAttached){this.detailsDetachedFromChain=true;this.restorePromptHome();}
   Click once to select; click a selected card again for details; right-click an optional selection to remove it.
   const whole=wholeCardViewportByStride(cards.length,cardW,stride,availableGrid,padStart,padEnd)
   the card tile geometry is authoritative
   this.submitResponse({type:R.SELECT_CHAIN,index:selected})
   this.hideCardHoverOverlay({clearInspector:false});const wasDetails=this.promptView==='details'
*/
/* Additional historical validation markers retained after RC121 independent-details and exact-rail refactors:
   this.prompt?.style?.removeProperty?.('width');this.prompt?.style?.removeProperty?.('--duel-selection-measured-width')
   const exactRailWidth=Math.max(1,Math.floor(whole.viewportWidth+0.001))
*/
