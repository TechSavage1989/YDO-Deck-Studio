import {
  SECTION_MAIN, SECTION_EXTRA, SECTION_SIDE, SECTION_ORDER, SECTION_LABELS, SECTION_LIMITS,
  EFFECT_FILTER_LABELS, normalizeName, normalizeCard, buildCardIndexes, preferredImage, belongsInExtra,
  cardLimitStatus, allowedCopies, canAddCard, canMoveCard, newDeck, deckIds,
  parseYDK, sectionsToYDK, encodeYDKE, decodeYDKE, sectionsToHuman, humanToSections, humanLineCard,
  cardMatchesEffectFilters, cardEffectTags, cardSearchScore, cardTypeBucket, displayCardType, cardHasActualEffect, isTrapMonsterCard, isMaximumMonsterCard, validateDeck,
  copyGroup, sortDeckEntries, sortDeckEntriesSelective, deckInsertionIndex, applyStoredDeckOrder, canonicalizeSections, computeDeckLayoutGeometry,
} from './core.js?v=3.0.0-alpha.221';
import { allocateSearchListTracks } from './search-list-layout.js?v=3.0.0-alpha.221';
import { IntegratedDuelController } from './duel-core.js?v=3.0.0-alpha.221-duelcore.1-rc239';
const APP_VERSION = '3.0.0-alpha.221';
const TOOLTIP_HIDE_MS = 1400;
const TOOLTIP_MOVE_PX = 4;
const DECK_PREVIEW_DWELL_MS = 28;
const STORAGE_KEY = 'ygo-deck-studio-3-state-v1';
const PANEL_KEY = 'ygo-deck-studio-3-panels-v1';
const RECENT_DECKS_KEY = 'ygo-deck-studio-3-recent-decks-v1';
const RECENT_DECKS_LIMIT = 8;
const DECK_LIBRARY_DB_NAME = 'ygo-deck-studio-3-deck-library-v1';
const DECK_LIBRARY_STORE = 'directories';
const DECK_LIBRARY_EXTENSIONS = new Set(['.ydk','.ydke','.txt','.md','.list','.deck','.csv','.tsv']);
const DECK_LIBRARY_MAX_FILES = 2500;
const DECK_LIBRARY_MAX_DEPTH = 12;
const DECK_LIBRARY_MAX_FILE_BYTES = 4 * 1024 * 1024;
const SELECTED_PLACEHOLDER_SRC = 'assets/card_placeholder.png';
const PENDULUM_MONSTER_FILTER = '__pendulum_monster_all__';
const MONSTER_SEARCH_CATEGORIES = Object.freeze(['Normal','Effect','Non Effect','Ritual','Fusion','Synchro','Xyz','Pendulum','Link','Trap Monster','Maximum']);
const PENDULUM_SEARCH_SUBTYPES = Object.freeze(['Normal','Effect','Ritual','Fusion','Synchro','Xyz','Link']);
const MONSTER_SEARCH_ABILITIES = Object.freeze(['Tuner','Gemini','Flip','Toon','Union','Spirit','Special Summon']);
const SPELL_SEARCH_TYPE_ORDER = Object.freeze(['Normal','Quick-Play','Field','Continuous','Ritual','Equip']);
const TRAP_SEARCH_TYPE_ORDER = Object.freeze(['Normal','Continuous','Counter','Trap Monster']);
const POPOVER_AUTO_CLOSE_DISTANCE_PX = 80;
const OPTION_DRAWER_LIMITS = Object.freeze({
  search: Object.freeze({min:360, max:520, fallback:380, contentFloor:250}),
  deck: Object.freeze({min:380, max:520, fallback:400, contentFloor:260}),
});
let searchOptionsPinned = false;
let deckSortPinned = false;
let optionDrawerResizeActiveKind = null;
let searchPinGeometryRaf = 0;
let deckLibraryDbPromise = null;
let deckLibraryReadyPromise = null;
let deckLibraryRefreshPromise = null;
let deckLibraryRecords = [];
let deckLibraryDecks = [];
let deckLibraryStatus = '';
let deckLibraryReady = false;
const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];
const el = (tag, className = '', text = '') => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== '') node.textContent = text;
  return node;
};
const dom = {
  workspace: $('#workspace'),
  searchPanel: $('#searchPanel'),
  rightPanel: $('#rightPanel'),
  searchResults: $('#searchResults'),
  searchInput: $('#searchInput'), searchScopeQueryFilter: $('#searchScopeQueryFilter'),
  dbStatus: $('#dbStatus'),
  resultCount: $('#resultCount'),
  deckName: $('#deckName'),
  saveState: $('#saveState'),
  deckSortFilterBtn: $('#deckSortFilterBtn'), deckSortSummary: $('#deckSortSummary'), deckSortPopover: $('#deckSortPopover'), deckSortModeOptions: $('#deckSortModeOptions'), deckStoredOrderOptions: $('#deckStoredOrderOptions'), deckSortDescriptionTitle: $('#deckSortDescriptionTitle'), deckSortDescriptionBody: $('#deckSortDescriptionBody'), deckSortDeckOptions: $('#deckSortDeckOptions'), deckSortFamilyOptions: $('#deckSortFamilyOptions'), deckSortTypeOptions: $('#deckSortTypeOptions'), deckSortTypeDropdownSummary: $('#deckSortTypeDropdownSummary'), deckSortBanlist: $('#deckSortBanlistSelect'), deckSortCardPool: $('#deckSortCardPoolSelect'), deckSortGroupCategories: $('#deckSortGroupCategories'), savedDeckOrderStatus: $('#savedDeckOrderStatus'),
  mainDeck: $('#mainDeck'), extraDeck: $('#extraDeck'), sideDeck: $('#sideDeck'),
  mainCount: $('#mainCount'), extraCount: $('#extraCount'), sideCount: $('#sideCount'),
  mainBreakdown: $('#mainBreakdown'), extraBreakdown: $('#extraBreakdown'), sideBreakdown: $('#sideBreakdown'),
  visualDeckView: $('#visualDeckView'), listDeckView: $('#listDeckView'), textDeckView: $('#textDeckView'),
  deckTextArea: $('#deckTextArea'), textViewTitle: $('#textViewTitle'), parseIssues: $('#parseIssues'), textLineHover: $('#textLineHover'), textLineSelection: $('#textLineSelection'), textLineAnnotations: $('#textLineAnnotations'), textEditorWrap: $('#textEditorWrap'),
  selectedEmpty: $('#selectedEmpty'), selectedCard: $('#selectedCard'), selectedStatus: $('#selectedStatus'),
  selectedArt: $('#selectedArt'), selectedLimitBadge: $('#selectedLimitBadge'), artworkDropdown: $('#artworkDropdown'), artworkDropdownBtn: $('#artworkDropdownBtn'), artworkMenu: $('#artworkMenu'), artworkPrevBtn: $('#artworkPrevBtn'), artworkNextBtn: $('#artworkNextBtn'),
  detailName: $('#detailName'), detailMeta: $('#detailMeta'), detailStats: $('#detailStats'), detailLinkIndicator: $('#detailLinkIndicator'), detailText: $('#detailText'), cardTextStylingInline: $('#cardTextStylingInline'),
  addPrimaryBtn: $('#addPrimaryBtn'), addSideBtn: $('#addSideBtn'), openArtBtn: $('#openArtBtn'),
  validationView: $('#validationView'), statisticsView: $('#statisticsView'),
  fileInput: $('#fileInput'), searchCardPoolFilter: $('#searchCardPoolFilter'), searchFilterBtn: $('#searchFilterBtn'), searchFilterPopover: $('#searchFilterPopover'), searchFilterSummary: $('#searchFilterSummary'), searchOptionsDescriptionTitle: $('#searchOptionsDescriptionTitle'), searchOptionsDescriptionBody: $('#searchOptionsDescriptionBody'), searchSortModeOptions: $('#searchSortModeOptions'), searchStatSummary: $('#searchStatSummary'), effectTextFilter: $('#effectTextFilter'), abilityFilter: $('#abilityFilter'), linkArrowFilterGrid: $('#linkArrowFilterGrid'), linkFilterSummary: $('#linkFilterSummary'), linkCriteriaSummary: $('#linkCriteriaSummary'), linkRatingMinFilter: $('#linkRatingMinFilter'), linkRatingMaxFilter: $('#linkRatingMaxFilter'), linkMaterialMinFilter: $('#linkMaterialMinFilter'), linkMaterialMaxFilter: $('#linkMaterialMaxFilter'), linkMaterialQualifierOptions: $('#linkMaterialQualifierOptions'), linkMaterialRaceFilter: $('#linkMaterialRaceFilter'), linkMaterialAttributeFilter: $('#linkMaterialAttributeFilter'), linkMaterialPatternFilter: $('#linkMaterialPatternFilter'), linkArrowGridOverlayToggle: $('#linkArrowGridOverlayToggle'), linkArrowDetailsOverlayToggle: $('#linkArrowDetailsOverlayToggle'),
  linkArrowScalePopover: $('#linkArrowScalePopover'), linkArrowScaleLinked: $('#linkArrowScaleLinked'), linkArrowGridScale: $('#linkArrowGridScale'), linkArrowGridScaleValue: $('#linkArrowGridScaleValue'), linkArrowDetailsScale: $('#linkArrowDetailsScale'), linkArrowDetailsScaleValue: $('#linkArrowDetailsScaleValue'), linkArrowOffsetLinked: $('#linkArrowOffsetLinked'), linkArrowGridOffset: $('#linkArrowGridOffset'), linkArrowGridOffsetValue: $('#linkArrowGridOffsetValue'), linkArrowGridOffsetX: $('#linkArrowGridOffsetX'), linkArrowGridOffsetXValue: $('#linkArrowGridOffsetXValue'), linkArrowDetailsOffset: $('#linkArrowDetailsOffset'), linkArrowDetailsOffsetValue: $('#linkArrowDetailsOffsetValue'), linkArrowDetailsOffsetX: $('#linkArrowDetailsOffsetX'), linkArrowDetailsOffsetXValue: $('#linkArrowDetailsOffsetXValue'), detailsPanelLinkIndicatorToggle: $('#detailsPanelLinkIndicatorToggle'), detailsPanelLinkIndicatorScale: $('#detailsPanelLinkIndicatorScale'), detailsPanelLinkIndicatorScaleValue: $('#detailsPanelLinkIndicatorScaleValue'), detailsPanelLinkIndicatorOffsetX: $('#detailsPanelLinkIndicatorOffsetX'), detailsPanelLinkIndicatorOffsetXValue: $('#detailsPanelLinkIndicatorOffsetXValue'), detailsPanelLinkIndicatorOffsetY: $('#detailsPanelLinkIndicatorOffsetY'), detailsPanelLinkIndicatorOffsetYValue: $('#detailsPanelLinkIndicatorOffsetYValue'),
  attributeIconScalePopover: $('#attributeIconScalePopover'), attributeIconScaleLinked: $('#attributeIconScaleLinked'), attributeIconGridScale: $('#attributeIconGridScale'), attributeIconGridScaleValue: $('#attributeIconGridScaleValue'), attributeIconDetailsScale: $('#attributeIconDetailsScale'), attributeIconDetailsScaleValue: $('#attributeIconDetailsScaleValue'), attributeIconListScale: $('#attributeIconListScale'), attributeIconListScaleValue: $('#attributeIconListScaleValue'), attributeIconOffsetLinked: $('#attributeIconOffsetLinked'), attributeIconOffsetContext: $('#attributeIconOffsetContext'), attributeIconOffsetX: $('#attributeIconOffsetX'), attributeIconOffsetXValue: $('#attributeIconOffsetXValue'), attributeIconOffsetY: $('#attributeIconOffsetY'), attributeIconOffsetYValue: $('#attributeIconOffsetYValue'),
  restrictionBadgeToolsPopover: $('#restrictionBadgeToolsPopover'), restrictionBadgeToolsLinked: $('#restrictionBadgeToolsLinked'), restrictionBadgeContext: $('#restrictionBadgeContext'), restrictionBadgeScale: $('#restrictionBadgeScale'), restrictionBadgeScaleValue: $('#restrictionBadgeScaleValue'), restrictionBadgeOffsetX: $('#restrictionBadgeOffsetX'), restrictionBadgeOffsetXValue: $('#restrictionBadgeOffsetXValue'), restrictionBadgeOffsetY: $('#restrictionBadgeOffsetY'), restrictionBadgeOffsetYValue: $('#restrictionBadgeOffsetYValue'),
  linkMaterialSearch: $('#linkMaterialSearch'), linkMaterialOptions: $('#linkMaterialOptions'), linkMaterialSummary: $('#linkMaterialSummary'), xyzFilterSummary: $('#xyzFilterSummary'), xyzMaterialSummary: $('#xyzMaterialSummary'), xyzMaterialMinFilter: $('#xyzMaterialMinFilter'), xyzMaterialMaxFilter: $('#xyzMaterialMaxFilter'), xyzMaterialLevelMinFilter: $('#xyzMaterialLevelMinFilter'), xyzMaterialLevelMaxFilter: $('#xyzMaterialLevelMaxFilter'), xyzMaterialQualifierOptions: $('#xyzMaterialQualifierOptions'), xyzMaterialRaceFilter: $('#xyzMaterialRaceFilter'), xyzMaterialAttributeFilter: $('#xyzMaterialAttributeFilter'), xyzMaterialPatternFilter: $('#xyzMaterialPatternFilter'), xyzMaterialSearch: $('#xyzMaterialSearch'), xyzMaterialOptions: $('#xyzMaterialOptions'), effectOptions: $('#effectOptions'), effectSummary: $('#effectSummary'), effectTextSummary: $('#effectTextSummary'),
  artDialog: $('#artDialog'), modalArt: $('#modalArt'), modalArtName: $('#modalArtName'),
  handDialog: $('#handDialog'), handCards: $('#handCards'), confirmDialog: $('#confirmDialog'), confirmMessage: $('#confirmMessage'), confirmAcceptBtn: $('#confirmAcceptBtn'), confirmCancelBtn: $('#confirmCancelBtn'), confirmDismissBtn: $('#confirmDismissBtn'), contextMenu: $('#contextMenu'), toastStack: $('#toastStack'),
  removeDrop: $('#removeDrop'),
  undoBtn: $('#undoBtn'), redoBtn: $('#redoBtn'), swapPanelsBtn: $('#swapPanelsBtn'),
  recentDeckMenu: $('#recentDeckMenu'), recentDeckBtn: $('#recentDeckBtn'), recentDeckPanel: $('#recentDeckPanel'), recentDeckList: $('#recentDeckList'),
  saveDeckBtn: $('#saveDeckBtn'),
};
const state = {
  cards: [],
  indexes: {byId:new Map(), byName:new Map(), byLooseName:new Map()},
  deck: newDeck(),
  nextUid: 1,
  selectedCardId: null,
  selectedEntryUid: null,
  selectedEntryUids: new Set(),
  selectedArtworkId: null,
  selectionAnchorUid: null,
  banlist: 'TCG',
  cardPool: 'TCG',
  searchView: 'grid',
  deckView: 'grid',
  analysisView: 'validation',
  statisticsSections: new Set(SECTION_ORDER),
  statisticsGraphFilter: 'summary',
  statisticsChartType: 'bars',
  cardTextStyling: true,
  linkArrowOverlays: {grid:true, details:true},
  linkArrowScales: {grid:125, details:120},
  linkArrowScalesLinked: false,
  linkArrowOffsets: {grid:-1, details:0},
  linkArrowOffsetsX: {grid:0, details:0},
  linkArrowOffsetsLinked: false,
  detailsPanelLinkIndicator: true,
  detailsPanelLinkIndicatorScale: 100,
  detailsPanelLinkIndicatorOffset: {x:0,y:0},
  attributeIconScales: {grid:75, details:70, list:90},
  attributeIconScalesLinked: false,
  attributeIconOffsets: {grid:{x:0,y:0}, details:{x:0,y:0}, list:{x:0,y:0}},
  attributeIconOffsetsLinked: false,
  attributeIconTuningContext: 'grid',
  restrictionBadgeScales: {searchGrid:100, searchDetails:100, searchList:100, deckGrid:100, deckList:100, selectedCard:100},
  restrictionBadgeOffsets: {searchGrid:{x:0,y:0}, searchDetails:{x:0,y:0}, searchList:{x:0,y:0}, deckGrid:{x:0,y:0}, deckList:{x:0,y:0}, selectedCard:{x:0,y:0}},
  restrictionBadgeSettingsLinked: false,
  restrictionBadgeTuningContext: 'searchGrid',
  deckName: 'Untitled Deck',
  creator: 'YGO Deck Studio 3',
  theme: 'dark',
  filters: {
    query:'', category:'', type:'', monsterSubtype:'', ability:'', attribute:'', race:'', archetype:'', effectText:'', cardPool:'TCG', banlist:'TCG', restriction:'',
    sort:'relevance', direction:'asc', maxResults:500,
    levelMin:'', levelMax:'', scaleMin:'', scaleMax:'', atkMin:'', atkMax:'', defMin:'', defMax:'',
    linkRatingMin:'', linkRatingMax:'', linkMarkers:new Set(), linkMarkerMode:'All', linkMaterialMin:'', linkMaterialMax:'', linkMaterialQualifiers:new Set(), linkMaterialQualifierMode:'Any', linkMaterialRace:'', linkMaterialAttribute:'', linkMaterialPattern:'', linkMaterials:new Set(),
    xyzMaterialMin:'', xyzMaterialMax:'', xyzMaterialLevelMin:'', xyzMaterialLevelMax:'', xyzMaterialQualifiers:new Set(), xyzMaterialQualifierMode:'Any', xyzMaterialRace:'', xyzMaterialAttribute:'', xyzMaterialPattern:'', xyzMaterials:new Set(), effects:new Set(), effectMode:'Any',
  },
  dragged: null,
  lastDropHandled: false,
  dirty: false,
  searchTimer: null,
  searchMatchesCache: null,
  searchResultApplicableKeys: new Set(),
  searchResultCards: [],
  searchListColumnWidths: {},
  deckListColumnWidths: {},
  databaseLoaded: false,
  hoverPreview: null,
  previewRaf: 0,
  previewTimer: 0,
  previewRestoreRaf: 0,
  renderedHoverKey: null,
  selectedArtLoadToken: 0,
  cardTextHtmlCache: new Map(),
  deckSort: 'name',
  deckSortScope: 'all',
  deckSortDirection: 'asc',
  deckSortGroupCategories: true,
  deckSortSections: new Set(SECTION_ORDER),
  deckSortFamilies: new Set(['monster','spell','trap','other']),
  deckSortTypes: new Set(),
  deckSortTypeMode: 'Any',
  loadedDeckOrder: null,
  savedDeckOrder: null,
  artZoom: 1,
  archetypeNames: [],
  raceNames: [],
  archetypeTypeProfiles: new Map(),
  textHoverLine: null,
  textSelectedLine: null,
  textLineMap: [],
  pendingSearchViewContext: null,
  panelRatios: {left:null, right:null},
  sidePanelsSwapped: false,
  readableRecognitionTimer: null,
  lastWorkspaceWidth: 0,
  responsivePaneOverride: {left:false, right:false},
  responsiveTier: 'wide',
  optionDrawers: {
    search: {docked:true, pinned:false, returnPinned:false, x:null, y:null, width:380, pinRestoreLeftWidth:null, pinRestoreLeftRatio:null, pinRestoreResultsWidth:null, pinnedPaneWidth:null, pinnedPaneManual:false},
    deck: {docked:true, pinned:false, returnPinned:false, x:null, y:null, width:400},
  },
  deckZoneCollapsed: {main:false, extra:false, side:false},
  undoStack: [],
  redoStack: [],
  currentDeckFileHandle: null,
  currentDeckFileName: '',
  currentDeckFilePath: '',
  currentDeckBackingDeckName: '',
  allowUnloadOnce: false,
};
const HISTORY_LIMIT = 100;
const DECK_SORT_MODE_OPTIONS = [
  ['name','Name'], ['detail','Detailed Type'], ['race','Subtype'], ['archetype','Archetype'],
  ['attribute','Attribute'], ['level','Level / Rank'], ['atk','ATK'], ['def','DEF'], ['scale','Scale'],
  ['link-rating','Link Rating'], ['link-arrows','Link Arrows'], ['link-material','Link Materials'], ['limit','Banlist Status'],
];
const DECK_RESTORE_ORDER_OPTIONS = [
  ['loaded','Loaded File Order'], ['saved','Last Manual Order'],
];
const DECK_SORT_MODE_DESCRIPTIONS = {
  detail: 'Sorts by actual subtype. With family grouping on, each Monster / Spell / Trap block uses its own subtype order. With grouping off, a fixed semantic hierarchy is used instead of alphabetically comparing subtype labels. Equal subtypes keep their current order.',
  name: 'Sorts alphabetically by card name. Equal names keep their current order.',
  race: 'Sorts alphabetically by the card subtype or race shown in Deck List. Missing values go last and equal values keep their current order.',
  archetype: 'Sorts alphabetically by archetype. Cards with no archetype form a stable No Archetype group at the end; cards sharing an archetype keep their current order.',
  attribute: 'Sorts Monsters alphabetically by Attribute. Unknown Attributes go last and equal Attributes keep their current order. Non-Monsters automatically fall back to their broad family blocks.',
  level: 'Sorts Monsters numerically by Level, Xyz Rank, or Link Rating. Missing values go last and equal values keep their current order.',
  atk: 'Sorts Monsters numerically by ATK. Unknown ATK is treated as 0; equal ATK values keep their current order.',
  def: 'Sorts Monsters numerically by DEF. Link Monsters and unknown DEF use 0; equal DEF values keep their current order.',
  scale: 'Sorts Pendulum Monsters numerically by Scale. Cards without a Scale remain outside the sortable Scale slots; equal Scale values keep their current order.',
  'link-rating': 'Sorts Link Monsters numerically by Link Rating. Non-Link cards remain outside the sortable Link slots.',
  'link-arrows': 'Sorts Link Monsters by arrow count and then arrow pattern. Non-Link cards remain outside the sortable Link slots.',
  'link-material': 'Sorts Link Monsters alphabetically by their Link Material requirement. Cards without Link Material text remain outside the sortable slots.',
  limit: 'Sorts by restriction severity: Forbidden → Limited → Semi-Limited → Unlimited. Cards with the same status keep their current order.',
};
const DECK_SORT_MODE_TOOLTIPS = {
  detail: 'Sort by detailed subtype',
  name: 'Alphabetical by card name',
  race: 'Sort by subtype / race',
  archetype: 'Sort by archetype',
  attribute: 'Sort Monsters by Attribute',
  level: 'Sort by Level / Rank / Link Rating',
  atk: 'Sort Monsters by ATK',
  def: 'Sort Monsters by DEF',
  scale: 'Sort Pendulum Monsters by Scale',
  'link-rating': 'Sort Link Monsters by Link Rating',
  'link-arrows': 'Sort Link Monsters by Link Arrows',
  'link-material': 'Sort Link Monsters by Link Materials',
  limit: 'Forbidden → Limited → Semi-Limited → Unlimited',
};
const DECK_SORT_AUTO_GROUP_MODES = new Set(['attribute','level','atk','def','scale','link-rating','link-arrows','link-material']);
function deckSortModeDescription(value) {
  return DECK_SORT_MODE_DESCRIPTIONS[value] || `Sorts the deck using ${deckSortModeLabel(value)}.`;
}
function deckSortModeTooltip(value) {
  return DECK_SORT_MODE_TOOLTIPS[value] || deckSortModeLabel(value);
}
function deckSortContextDescription(mode=state.deckSort) {
  const familyScope=deckSortFamiliesLabel();
  const partialFamilyScope=state.deckSortFamilies.size>0 && state.deckSortFamilies.size<DECK_SORT_FAMILY_OPTIONS.length;
  const scopeText=familyScope==='All Families'
    ? 'All card families are selected.'
    : `Selected families: ${familyScope}. Deselected families keep their internal order and automatically return to their normal broad-family positions.`;
  if(mode==='detail') {
    if(partialFamilyScope) return `${scopeText} ${deckSortModeDescription(mode)} Because one or more families are deselected, broad family positions are restored automatically and selected families sort by detailed subtype inside their own blocks.`;
    return state.deckSortGroupCategories
      ? `${scopeText} ${deckSortModeDescription(mode)} Grouping is on, so Monster, Spell, and Trap remain separate broad groups and their detailed subtypes are sorted inside those groups.`
      : `${scopeText} ${deckSortModeDescription(mode)} Grouping is off, so a fixed semantic subtype hierarchy is applied across the full deck section and related subtype concepts may mix broad card families.`;
  }
  if(DECK_SORT_AUTO_GROUP_MODES.has(mode)) {
    return state.deckSortGroupCategories || partialFamilyScope
      ? `${scopeText} ${deckSortModeDescription(mode)} Broad Monster, Spell, and Trap groups are retained.`
      : `${scopeText} ${deckSortModeDescription(mode)} Because this property does not apply to every broad card type, Monster, Spell, and Trap grouping is applied automatically even though Group Categories is off.`;
  }
  if(partialFamilyScope) return `${scopeText} ${deckSortModeDescription(mode)} Broad family positions are restored automatically because one or more families are deselected; the selected families are sorted inside their own blocks.`;
  return state.deckSortGroupCategories
    ? `${scopeText} ${deckSortModeDescription(mode)} Broad Monster, Spell, and Trap groups are retained, then this sort is applied within each group.`
    : `${scopeText} ${deckSortModeDescription(mode)} Grouping is off, so applicable values can sort across broad card families.`;
}
function updateDeckSortDescription() {
  const direction=state.deckSortDirection==='desc'?'Descending':'Ascending';
  if(dom.deckSortDescriptionTitle) dom.deckSortDescriptionTitle.textContent=`${deckSortModeLabel()} · ${direction}`;
  if(dom.deckSortDescriptionBody) dom.deckSortDescriptionBody.textContent=deckSortContextDescription();
}
const SEARCH_SORT_MODE_OPTIONS = [
  ['relevance','Relevance'], ['name','Name'], ['type','Type / Subtype'], ['level','Level / Rank'], ['atk','ATK'], ['def','DEF'], ['scale','Scale'],
];
const DECK_SORT_FAMILY_OPTIONS = [['monster','Monster'],['spell','Spell'],['trap','Trap'],['other','Other']];
const DECK_SORT_TYPE_OPTIONS = [
  ['normal-monster','Normal Monster'], ['effect-monster','Effect Monster'],
  ['ritual-monster','Ritual Monster'], ['fusion-monster','Fusion Monster'], ['synchro-monster','Synchro Monster'],
  ['xyz-monster','Xyz Monster'], ['link-monster','Link Monster'], ['pendulum-monster','Pendulum Monster'],
  ['tuner-monster','Tuner Monster'], ['flip-monster','Flip Monster'], ['toon-monster','Toon Monster'],
  ['spirit-monster','Spirit Monster'], ['union-monster','Union Monster'], ['gemini-monster','Gemini Monster'],
  ['normal-spell','Normal Spell'], ['quick-play-spell','Quick-Play Spell'],
  ['continuous-spell','Continuous Spell'], ['equip-spell','Equip Spell'], ['field-spell','Field Spell'], ['ritual-spell','Ritual Spell'],
  ['normal-trap','Normal Trap'], ['continuous-trap','Continuous Trap'], ['counter-trap','Counter Trap'],
];
const CARD_SYMBOL_ROOT = 'assets/card_symbols/';
const ATTRIBUTE_SYMBOLS = {
  DARK:['dark.png','DARK'], LIGHT:['light.png','LIGHT'], EARTH:['earth.png','EARTH'],
  WATER:['water.png','WATER'], FIRE:['fire.png','FIRE'], WIND:['wind.png','WIND'], DIVINE:['divine.png','DIVINE'],
};
const SPELL_TRAP_KIND_SYMBOLS = {
  Spell:['spell.png','Spell Card'], Trap:['trap.png','Trap Card'],
};
const SPELL_TRAP_SUBTYPE_SYMBOLS = {
  continuous:['continuous.webp','Continuous'], counter:['counter.webp','Counter'], equip:['equip.webp','Equip'],
  field:['field.webp','Field'], 'quick-play':['quick-play.webp','Quick-Play'], ritual:['ritual.webp','Ritual'],
};
function toast(message, type = '') {
  const node = el('div', `toast ${type}`.trim(), message);
  dom.toastStack.append(node);
  setTimeout(() => node.remove(), 3400);
}
function appConfirm(message, {acceptLabel='OK', cancelLabel='Cancel'} = {}) {
  const dialog=dom.confirmDialog;
  if(!dialog) return Promise.resolve(false);
  dom.confirmMessage.textContent=String(message || '');
  dom.confirmAcceptBtn.textContent=acceptLabel;
  dom.confirmCancelBtn.textContent=cancelLabel;
  dom.confirmAcceptBtn.value='confirm';
  dom.confirmCancelBtn.value='cancel';
  dom.confirmDismissBtn?.classList.add('hidden');
  dialog.returnValue='cancel';
  return new Promise(resolve=>{
    const onBackdrop=ev=>{ if(ev.target===dialog) dialog.close('cancel'); };
    const finish=()=>{
      dialog.removeEventListener('click',onBackdrop);
      resolve(dialog.returnValue==='confirm');
    };
    dialog.addEventListener('click',onBackdrop);
    dialog.addEventListener('close',finish,{once:true});
    dialog.showModal();
    requestAnimationFrame(()=>dom.confirmAcceptBtn?.focus());
  });
}
function setDirty(dirty = true) {
  state.dirty = dirty;
  dom.saveState.textContent = dirty ? 'Changes saved locally' : 'Saved locally';
  persistState();
}
function persistState() {
  try {
    const payload = {
      creator: state.creator,
      banlist: state.banlist,
      cardPool: state.cardPool,
      searchView: state.searchView,
      deckView: state.deckView,
      analysisView: state.analysisView,
      statisticsSections: [...state.statisticsSections],
      statisticsGraphFilter: state.statisticsGraphFilter,
      statisticsChartType: state.statisticsChartType,
      cardTextStyling: state.cardTextStyling,
      linkArrowOverlays: {...state.linkArrowOverlays},
      linkArrowScales: {...state.linkArrowScales},
      linkArrowScalesLinked: state.linkArrowScalesLinked,
      linkArrowOffsets: {...state.linkArrowOffsets},
      linkArrowOffsetsX: {...state.linkArrowOffsetsX},
      linkArrowOffsetsLinked: state.linkArrowOffsetsLinked,
      detailsPanelLinkIndicator: state.detailsPanelLinkIndicator,
      detailsPanelLinkIndicatorScale: state.detailsPanelLinkIndicatorScale,
      detailsPanelLinkIndicatorOffset: {...state.detailsPanelLinkIndicatorOffset},
      attributeIconScales: {...state.attributeIconScales},
      attributeIconScalesLinked: state.attributeIconScalesLinked,
      attributeIconOffsets: structuredClone(state.attributeIconOffsets),
      attributeIconOffsetsLinked: state.attributeIconOffsetsLinked,
      restrictionBadgeScales: {...state.restrictionBadgeScales},
      restrictionBadgeOffsets: structuredClone(state.restrictionBadgeOffsets),
      restrictionBadgeSettingsLinked: state.restrictionBadgeSettingsLinked,
      theme: state.theme,
      deckSort: state.deckSort,
      deckSortScope: state.deckSortScope,
      deckSortDirection: state.deckSortDirection,
      deckSortGroupCategories: state.deckSortGroupCategories,
      deckSortSections: [...state.deckSortSections],
      deckSortFamilies: [...state.deckSortFamilies],
      deckSortTypes: [...state.deckSortTypes],
      deckSortTypeMode: state.deckSortTypeMode,
      optionDrawers: structuredClone(state.optionDrawers),
      searchListColumnWidths: {...state.searchListColumnWidths},
      deckListColumnWidths: {...state.deckListColumnWidths},
      filters: {...state.filters, effects:[...state.filters.effects], linkMarkers:[...state.filters.linkMarkers], linkMaterialQualifiers:[...state.filters.linkMaterialQualifiers], linkMaterials:[...state.filters.linkMaterials], xyzMaterialQualifiers:[...state.filters.xyzMaterialQualifiers], xyzMaterials:[...state.filters.xyzMaterials]},
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {}
}
function restoreSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (saved.creator) state.creator = saved.creator;
    if (saved.banlist) state.banlist = saved.banlist;
    if (saved.cardPool) state.cardPool = saved.cardPool;
    if (saved.searchView) state.searchView = saved.searchView;
    if (saved.deckView) state.deckView = saved.deckView;
    if (saved.analysisView) state.analysisView = saved.analysisView;
    if (Array.isArray(saved.statisticsSections)) {
      const valid = saved.statisticsSections.filter(section => SECTION_ORDER.includes(section));
      state.statisticsSections = new Set(valid);
    }
    if (['summary','types','monsters'].includes(saved.statisticsGraphFilter)) state.statisticsGraphFilter = saved.statisticsGraphFilter;
    if (['bars','pie'].includes(saved.statisticsChartType)) state.statisticsChartType = saved.statisticsChartType;
    if (typeof saved.cardTextStyling === 'boolean') state.cardTextStyling = saved.cardTextStyling;
    if (saved.linkArrowOverlays && typeof saved.linkArrowOverlays === 'object') {
      for(const view of ['grid','details']) if(typeof saved.linkArrowOverlays[view] === 'boolean') state.linkArrowOverlays[view]=saved.linkArrowOverlays[view];
    } else if (typeof saved.linkArrowOverlay === 'boolean') {
      state.linkArrowOverlays.grid=saved.linkArrowOverlay;
      state.linkArrowOverlays.details=saved.linkArrowOverlay;
    }
    if (saved.linkArrowScales && typeof saved.linkArrowScales === 'object') {
      const normalizeSavedScale=(view,value)=>{
        const number=Number(value);
        if(!Number.isFinite(number)) return 100;
        if(number < 50) {
          const legacyBase=view==='grid'?20:22;
          return Math.max(50,Math.min(200,Math.round((number/legacyBase)*100)));
        }
        return Math.max(50,Math.min(200,number));
      };
      state.linkArrowScales.grid=normalizeSavedScale('grid',saved.linkArrowScales.grid);
      state.linkArrowScales.details=normalizeSavedScale('details',saved.linkArrowScales.details);
    }
    if (typeof saved.linkArrowScalesLinked === 'boolean') state.linkArrowScalesLinked=saved.linkArrowScalesLinked;
    if (saved.linkArrowOffsets && typeof saved.linkArrowOffsets === 'object') {
      for(const view of ['grid','details']) {
        const number=Number(saved.linkArrowOffsets[view]);
        if(Number.isFinite(number)) state.linkArrowOffsets[view]=Math.max(-20,Math.min(20,Math.round(number)));
      }
    }
    if (saved.linkArrowOffsetsX && typeof saved.linkArrowOffsetsX === 'object') {
      for(const view of ['grid','details']) {
        const number=Number(saved.linkArrowOffsetsX[view]);
        if(Number.isFinite(number)) state.linkArrowOffsetsX[view]=Math.max(-20,Math.min(20,Math.round(number)));
      }
    }
    if (typeof saved.linkArrowOffsetsLinked === 'boolean') state.linkArrowOffsetsLinked=saved.linkArrowOffsetsLinked;
    if (typeof saved.detailsPanelLinkIndicator === 'boolean') state.detailsPanelLinkIndicator=saved.detailsPanelLinkIndicator;
    if (Number.isFinite(Number(saved.detailsPanelLinkIndicatorScale))) state.detailsPanelLinkIndicatorScale=Math.max(50,Math.min(200,Number(saved.detailsPanelLinkIndicatorScale)));
    if (saved.detailsPanelLinkIndicatorOffset && typeof saved.detailsPanelLinkIndicatorOffset === 'object') {
      for(const axis of ['x','y']) { const value=Number(saved.detailsPanelLinkIndicatorOffset[axis]); if(Number.isFinite(value)) state.detailsPanelLinkIndicatorOffset[axis]=Math.max(-30,Math.min(30,Math.round(value))); }
    }
    if (saved.attributeIconScales && typeof saved.attributeIconScales === 'object') {
      for(const view of ['grid','details','list']) {
        const number=Number(saved.attributeIconScales[view]);
        if(Number.isFinite(number)) state.attributeIconScales[view]=Math.max(50,Math.min(200,number));
      }
    }
    if (typeof saved.attributeIconScalesLinked === 'boolean') state.attributeIconScalesLinked=saved.attributeIconScalesLinked;
    if (saved.attributeIconOffsets && typeof saved.attributeIconOffsets === 'object') {
      for(const view of ['grid','details','list']) {
        const pos=saved.attributeIconOffsets[view]; if(!pos || typeof pos!=='object') continue;
        for(const axis of ['x','y']) { const value=Number(pos[axis]); if(Number.isFinite(value)) state.attributeIconOffsets[view][axis]=Math.max(-20,Math.min(20,Math.round(value))); }
      }
    }
    if (typeof saved.attributeIconOffsetsLinked === 'boolean') state.attributeIconOffsetsLinked=saved.attributeIconOffsetsLinked;
    if (saved.restrictionBadgeScales && typeof saved.restrictionBadgeScales === 'object') {
      for(const context of Object.keys(state.restrictionBadgeScales)) { const value=Number(saved.restrictionBadgeScales[context]); if(Number.isFinite(value)) state.restrictionBadgeScales[context]=Math.max(50,Math.min(200,value)); }
    }
    if (saved.restrictionBadgeOffsets && typeof saved.restrictionBadgeOffsets === 'object') {
      for(const context of Object.keys(state.restrictionBadgeOffsets)) {
        const pos=saved.restrictionBadgeOffsets[context]; if(!pos || typeof pos!=='object') continue;
        for(const axis of ['x','y']) { const value=Number(pos[axis]); if(Number.isFinite(value)) state.restrictionBadgeOffsets[context][axis]=Math.max(-30,Math.min(30,Math.round(value))); }
      }
    }
    if (typeof saved.restrictionBadgeSettingsLinked === 'boolean') state.restrictionBadgeSettingsLinked=saved.restrictionBadgeSettingsLinked;
    if (saved.theme) state.theme = saved.theme;
    if (['detail','name','archetype','attribute','race','level','atk','def','scale','link-rating','link-arrows','link-material','limit'].includes(saved.deckSort)) state.deckSort = saved.deckSort;
    else if (saved.deckSort === 'type') state.deckSort = 'name';
    if (['all','main','extra','side','custom'].includes(saved.deckSortScope)) state.deckSortScope = saved.deckSortScope;
    if (['asc','desc'].includes(saved.deckSortDirection)) state.deckSortDirection = saved.deckSortDirection;
    if (typeof saved.deckSortGroupCategories === 'boolean') state.deckSortGroupCategories = saved.deckSortGroupCategories;
    if (Array.isArray(saved.deckSortSections)) {
      const validSections=saved.deckSortSections.filter(section=>SECTION_ORDER.includes(section));
      if(validSections.length) state.deckSortSections=new Set(validSections);
    } else if (saved.deckSortScope === 'all') state.deckSortSections=new Set(SECTION_ORDER);
    else if (SECTION_ORDER.includes(saved.deckSortScope)) state.deckSortSections=new Set([saved.deckSortScope]);
    if (Array.isArray(saved.deckSortFamilies)) { const families=saved.deckSortFamilies.filter(key=>DECK_SORT_FAMILY_OPTIONS.some(([value])=>value===key)); if(families.length) state.deckSortFamilies=new Set(families); }
    if (Array.isArray(saved.deckSortTypes)) state.deckSortTypes=new Set(saved.deckSortTypes.filter(key=>DECK_SORT_TYPE_OPTIONS.some(([value])=>value===key)));
    if (['Any','All'].includes(saved.deckSortTypeMode)) state.deckSortTypeMode=saved.deckSortTypeMode;
    if (saved.searchListColumnWidths && typeof saved.searchListColumnWidths === 'object') {
      for(const [key,value] of Object.entries(saved.searchListColumnWidths)) {
        const n=Number(value);
        if(Number.isFinite(n) && n>=22 && n<=720) state.searchListColumnWidths[key]=Math.round(n);
      }
    }
    delete state.searchListColumnWidths['type-race'];
    delete state.searchListColumnWidths.stats;
    if (saved.deckListColumnWidths && typeof saved.deckListColumnWidths === 'object') {
      for(const [key,value] of Object.entries(saved.deckListColumnWidths)) {
        const n=Number(value);
        if(Number.isFinite(n) && n>=28 && n<=720) state.deckListColumnWidths[key]=Math.round(n);
      }
    }
    if (saved.optionDrawers && typeof saved.optionDrawers === 'object') {
      for (const kind of ['search','deck']) {
        const incoming=saved.optionDrawers[kind];
        if(!incoming || typeof incoming!=='object') continue;
        if(typeof incoming.docked==='boolean') state.optionDrawers[kind].docked=incoming.docked;
        if(typeof incoming.pinned==='boolean') state.optionDrawers[kind].pinned=incoming.pinned;
        if(typeof incoming.returnPinned==='boolean') state.optionDrawers[kind].returnPinned=incoming.returnPinned;
        if(state.optionDrawers[kind].docked===false) {
          state.optionDrawers[kind].pinned=false;
          state.optionDrawers[kind].returnPinned=false;
        } else state.optionDrawers[kind].returnPinned=Boolean(state.optionDrawers[kind].pinned);
        for(const axis of ['x','y']) {
          const value=Number(incoming[axis]);
          if(Number.isFinite(value)) state.optionDrawers[kind][axis]=Math.round(value);
        }
        const width=Number(incoming.width);
        if(Number.isFinite(width)) {
          const limits=OPTION_DRAWER_LIMITS[kind];
          state.optionDrawers[kind].width=Math.round(clampNumber(width,limits.min,limits.max));
        }
        if(kind==='search') {
          for(const key of ['pinRestoreLeftWidth','pinRestoreLeftRatio','pinRestoreResultsWidth','pinnedPaneWidth']) {
            const value=Number(incoming[key]);
            if(Number.isFinite(value) && value>0) state.optionDrawers.search[key]=value;
          }
          state.optionDrawers.search.pinnedPaneManual=Boolean(incoming.pinnedPaneManual);
        }
      }
    }
    searchOptionsPinned=Boolean(state.optionDrawers.search.pinned);
    deckSortPinned=Boolean(state.optionDrawers.deck.pinned);
    syncDeckSortLegacyScope();
    if (saved.filters) {
      const legacyRating=saved.filters.linkRating;
      state.filters = {...state.filters, ...saved.filters,
        effects:new Set(saved.filters.effects || []),
        linkMarkers:new Set(saved.filters.linkMarkers || []),
        linkMaterialQualifiers:new Set(saved.filters.linkMaterialQualifiers || []),
        linkMaterials:new Set(saved.filters.linkMaterials || []),
        xyzMaterialQualifiers:new Set(saved.filters.xyzMaterialQualifiers || []),
        xyzMaterials:new Set(saved.filters.xyzMaterials || []),
      };
      if((state.filters.linkRatingMin==='' || state.filters.linkRatingMin==null) && legacyRating!=='' && legacyRating!=null) state.filters.linkRatingMin=String(legacyRating);
      if((state.filters.linkRatingMax==='' || state.filters.linkRatingMax==null) && legacyRating!=='' && legacyRating!=null) state.filters.linkRatingMax=String(legacyRating);
      if(!['Any','All'].includes(state.filters.linkMarkerMode)) state.filters.linkMarkerMode='All';
      if(!['Any','All'].includes(state.filters.linkMaterialQualifierMode)) state.filters.linkMaterialQualifierMode='Any';
      if(!['Any','All'].includes(state.filters.xyzMaterialQualifierMode)) state.filters.xyzMaterialQualifierMode='Any';
    }
  } catch {}
  try {
    const panels = JSON.parse(localStorage.getItem(PANEL_KEY) || '{}');
    if (panels.leftWidth) document.documentElement.style.setProperty('--left-width', `${panels.leftWidth}px`);
    if (panels.rightWidth) document.documentElement.style.setProperty('--right-width', `${panels.rightWidth}px`);
    state.panelRatios.left = Number.isFinite(Number(panels.leftRatio)) ? Number(panels.leftRatio) : null;
    state.panelRatios.right = Number.isFinite(Number(panels.rightRatio)) ? Number(panels.rightRatio) : null;
    state.lastWorkspaceWidth = Number(panels.workspaceWidth) || 0;
    if (panels.hideSearch) dom.workspace.classList.add('hide-search');
    if (panels.hideRight) dom.workspace.classList.add('hide-right');
    state.sidePanelsSwapped=Boolean(panels.sidePanelsSwapped);
    dom.workspace.classList.toggle('panels-swapped',state.sidePanelsSwapped);
    state._pendingPanelPrefs = panels;
  } catch {}
}
function savePanelPrefs() {
  const styles = getComputedStyle(document.documentElement);
  const collapsedSections = {};
  document.querySelectorAll('.collapsible-section [id$="PanelBody"], #searchPanelBody').forEach(body => { collapsedSections[body.id] = body.classList.contains('collapsed'); });
  const collapsedZones = {};
  for(const section of SECTION_ORDER) collapsedZones[section]=Boolean(state.deckZoneCollapsed?.[section]);
  const workspaceWidth = Math.max(1, dom.workspace?.clientWidth || window.innerWidth || 1);
  const leftWidth = parseFloat(styles.getPropertyValue('--left-width')) || 340;
  const rightWidth = parseFloat(styles.getPropertyValue('--right-width')) || 360;
  if (!state.panelRatios.left) state.panelRatios.left = leftWidth / workspaceWidth;
  if (!state.panelRatios.right) state.panelRatios.right = rightWidth / workspaceWidth;
  localStorage.setItem(PANEL_KEY, JSON.stringify({
    leftWidth: Math.round(leftWidth),
    rightWidth: Math.round(rightWidth),
    leftRatio: state.panelRatios.left,
    rightRatio: state.panelRatios.right,
    workspaceWidth,
    hideSearch: dom.workspace.classList.contains('hide-search'),
    hideRight: dom.workspace.classList.contains('hide-right'),
    collapsedSections,
    collapsedZones,
    sidePanelsSwapped: state.sidePanelsSwapped,
  }));
}
function deckFromIds(sections) {
  const result = newDeck();
  for (const section of SECTION_ORDER) {
    const limit=SECTION_LIMITS[section];
    for (const id of (sections?.[section] || []).slice(0,limit)) result[section].push({uid:state.nextUid++, id:Number(id)});
  }
  return result;
}
function loadSections(sections, {correctPlacement = true, recordHistory = false} = {}) {
  const before=recordHistory ? captureDeckSnapshot() : null;
  const previousCounts=deckZoneCountsSnapshot();
  const out = newDeck();
  const rejected=Object.fromEntries(SECTION_ORDER.map(section=>[section,0]));
  state.nextUid = 1;
  for (const section of SECTION_ORDER) {
    for (const rawId of sections?.[section] || []) {
      const id = Number(rawId);
      const card = state.indexes.byId.get(id);
      let target = section;
      if (correctPlacement && card && (section === SECTION_MAIN || section === SECTION_EXTRA)) target = belongsInExtra(card) ? SECTION_EXTRA : SECTION_MAIN;
      const limit=SECTION_LIMITS[target];
      if(out[target].length>=limit){rejected[target]+=1;continue;}
      out[target].push({uid:state.nextUid++, id});
    }
  }
  state.deck = out;
  captureLoadedDeckOrder();
  state.savedDeckOrder = null;
  state.selectedEntryUid = null;
  state.selectedEntryUids.clear();
  state.selectedCardId = null;
  state.selectedArtworkId = null;
  applyLoadedDeckZoneDefaults();
  if(recordHistory) reconcileDeckZoneOccupancy(previousCounts);
  renderDeck();
  updateAnalysis();
  syncTextView();
  setDirty();
  if(before) commitDeckHistory(before);
  return SECTION_ORDER.filter(section=>rejected[section]>0).map(section=>`${SECTION_LABELS[section]} is limited to ${SECTION_LIMITS[section]} cards. ${rejected[section]} excess ${rejected[section]===1?'card was':'cards were'} not imported.`);
}
function currentSections() { return deckIds(state.deck); }
function currentCanonicalSections() { return canonicalizeSections(currentSections(), state.indexes.byId); }
function captureDeckSnapshot() {
  return {
    deck:Object.fromEntries(SECTION_ORDER.map(section=>[section,(state.deck[section] || []).map(entry=>({uid:Number(entry.uid),id:Number(entry.id)}))])),
    nextUid:Number(state.nextUid) || 1,
    selectedCardId:state.selectedCardId == null ? null : Number(state.selectedCardId),
    selectedEntryUid:state.selectedEntryUid == null ? null : Number(state.selectedEntryUid),
    selectedEntryUids:[...state.selectedEntryUids].map(Number),
    selectedArtworkId:state.selectedArtworkId == null ? null : Number(state.selectedArtworkId),
    selectionAnchorUid:state.selectionAnchorUid == null ? null : Number(state.selectionAnchorUid),
  };
}
function deckSnapshotSignature(snapshot) {
  return SECTION_ORDER.map(section=>(snapshot?.deck?.[section] || []).map(entry=>`${Number(entry.uid)}:${Number(entry.id)}`).join(',')).join('|');
}
function updateHistoryControls() {
  const canUndo=state.undoStack.length>0;
  const canRedo=state.redoStack.length>0;
  if(dom.undoBtn) dom.undoBtn.disabled=!canUndo;
  if(dom.redoBtn) dom.redoBtn.disabled=!canRedo;
  $$('[data-menu-action="undo"]').forEach(button=>button.disabled=!canUndo);
  $$('[data-menu-action="redo"]').forEach(button=>button.disabled=!canRedo);
}
function commitDeckHistory(before) {
  if(!before || deckSnapshotSignature(before)===deckSnapshotSignature(captureDeckSnapshot())) { updateHistoryControls(); return false; }
  state.undoStack.push(before);
  if(state.undoStack.length>HISTORY_LIMIT) state.undoStack.splice(0,state.undoStack.length-HISTORY_LIMIT);
  state.redoStack.length=0;
  updateHistoryControls();
  return true;
}
function resetDeckHistory() {
  state.undoStack.length=0;
  state.redoStack.length=0;
  updateHistoryControls();
}
function restoreDeckSnapshot(snapshot) {
  if(!snapshot) return false;
  const previousCounts=deckZoneCountsSnapshot();
  state.deck=Object.fromEntries(SECTION_ORDER.map(section=>[section,(snapshot.deck?.[section] || []).map(entry=>({uid:Number(entry.uid),id:Number(entry.id)}))]));
  const maxUid=Math.max(0,...SECTION_ORDER.flatMap(section=>state.deck[section].map(entry=>Number(entry.uid) || 0)));
  state.nextUid=Math.max(Number(snapshot.nextUid) || 1,maxUid+1);
  const validUids=new Set(SECTION_ORDER.flatMap(section=>state.deck[section].map(entry=>Number(entry.uid))));
  state.selectedEntryUids=new Set((snapshot.selectedEntryUids || []).map(Number).filter(uid=>validUids.has(uid)));
  state.selectedEntryUid=snapshot.selectedEntryUid != null && validUids.has(Number(snapshot.selectedEntryUid)) ? Number(snapshot.selectedEntryUid) : null;
  state.selectionAnchorUid=snapshot.selectionAnchorUid != null && validUids.has(Number(snapshot.selectionAnchorUid)) ? Number(snapshot.selectionAnchorUid) : null;
  state.selectedCardId=snapshot.selectedCardId == null ? null : Number(snapshot.selectedCardId);
  state.selectedArtworkId=snapshot.selectedArtworkId == null ? null : Number(snapshot.selectedArtworkId);
  state.hoverPreview=null;
  if(state.selectedEntryUid != null){
    const found=entryByUid(state.selectedEntryUid);
    const card=found ? state.indexes.byId.get(Number(found.entry.id)) : null;
    if(card){state.selectedCardId=card.id;state.selectedArtworkId=Number(found.entry.id);}
  }
  reconcileDeckZoneOccupancy(previousCounts);
  renderDeck(); renderSelectedCard(); updateAnalysis(); syncTextView(); setDirty(); updateHistoryControls();
  return true;
}
function undoDeckAction() {
  if(!state.undoStack.length) return false;
  const current=captureDeckSnapshot();
  const previous=state.undoStack.pop();
  state.redoStack.push(current);
  if(state.redoStack.length>HISTORY_LIMIT) state.redoStack.splice(0,state.redoStack.length-HISTORY_LIMIT);
  restoreDeckSnapshot(previous);
  return true;
}
function redoDeckAction() {
  if(!state.redoStack.length) return false;
  const current=captureDeckSnapshot();
  const next=state.redoStack.pop();
  state.undoStack.push(current);
  if(state.undoStack.length>HISTORY_LIMIT) state.undoStack.splice(0,state.undoStack.length-HISTORY_LIMIT);
  restoreDeckSnapshot(next);
  return true;
}
function selectedCard() {
  return state.selectedCardId == null ? null : state.indexes.byId.get(Number(state.selectedCardId));
}
function previewCard() {
  return state.hoverPreview?.cardId == null ? null : state.indexes.byId.get(Number(state.hoverPreview.cardId));
}
function displayCardContext() {
  const card = previewCard() || selectedCard();
  const artworkId = state.hoverPreview?.artworkId ?? state.selectedArtworkId;
  return {card, artworkId, previewing: !!state.hoverPreview};
}
function hoverPreviewKey(preview=state.hoverPreview) {
  if(!preview) return '';
  return `${preview.entryUid ?? 'search'}:${preview.cardId}:${preview.artworkId ?? ''}`;
}
function cancelPreviewFrame() {
  if (!state.previewRaf) return;
  cancelAnimationFrame(state.previewRaf);
  state.previewRaf = 0;
}
function cancelPreviewRestoreFrame() {
  if (!state.previewRestoreRaf) return;
  cancelAnimationFrame(state.previewRestoreRaf);
  state.previewRestoreRaf = 0;
}
function queuePreviewRender() {
  if (state.previewRaf) return;
  state.previewRaf = requestAnimationFrame(() => {
    state.previewRaf = 0;
    renderSelectedCard({syncSearchSelection:false});
    state.renderedHoverKey = hoverPreviewKey();
  });
}
function setHoverPreview(card, entryUid = null, artworkId = null) {
  if (!card) return;
  clearTimeout(state.previewTimer);
  state.previewTimer=0;
  cancelPreviewRestoreFrame();
  cancelPreviewFrame();
  state.hoverPreview = {cardId:Number(card.id), entryUid, artworkId: artworkId ?? card.images?.[0]?.id ?? card.id};
  const key=hoverPreviewKey();
  if(entryUid != null){
    state.previewTimer=setTimeout(()=>{
      state.previewTimer=0;
      if(hoverPreviewKey()===key) queuePreviewRender();
    },DECK_PREVIEW_DWELL_MS);
  } else {
    queuePreviewRender();
  }
}
function clearHoverPreview(entryUid = undefined, cardId = undefined) {
  if (!state.hoverPreview) return;
  if (entryUid !== undefined && state.hoverPreview.entryUid !== entryUid) return;
  if (cardId !== undefined && Number(state.hoverPreview.cardId) !== Number(cardId)) return;
  clearTimeout(state.previewTimer);
  state.previewTimer=0;
  cancelPreviewFrame();
  state.hoverPreview = null;
  cancelPreviewRestoreFrame();
  state.previewRestoreRaf=requestAnimationFrame(()=>{
    state.previewRestoreRaf=0;
    if(!state.hoverPreview) {
      renderSelectedCard({syncSearchSelection:false});
      state.renderedHoverKey='';
    }
  });
}
function entryByUid(uid) {
  for (const section of SECTION_ORDER) {
    const index = state.deck[section].findIndex(e => e.uid === Number(uid));
    if (index >= 0) return {section, index, entry:state.deck[section][index]};
  }
  return null;
}
function selectedDeckUids() {
  const wanted = state.selectedEntryUids;
  if (!wanted?.size) return state.selectedEntryUid == null ? [] : [Number(state.selectedEntryUid)];
  const ordered = [];
  for (const section of SECTION_ORDER) {
    for (const entry of state.deck[section]) if (wanted.has(Number(entry.uid))) ordered.push(Number(entry.uid));
  }
  return ordered;
}
function deckDragPreviewImage(uid) {
  const selector=`[data-uid="${Number(uid)}"]`;
  return dom.visualDeckView?.querySelector(`.deck-card${selector} img`) || dom.listDeckView?.querySelector(`tr${selector} .mini-art`) || null;
}
function createDeckDragPreview(uids) {
  const ordered=(uids || []).map(Number).filter(Number.isFinite);
  if (!ordered.length) return null;
  const count=ordered.length;
  const cardW=78, cardH=Math.round(cardW * 614 / 421);
  const maxWidth=460;
  const stepX=count>1?Math.min(12,Math.max(4,(maxWidth-cardW)/(count-1))):0;
  const stepY=count>1?Math.min(4,Math.max(1,72/(count-1))):0;
  const width=Math.ceil(cardW+stepX*(count-1)+8);
  const height=Math.ceil(cardH+stepY*(count-1)+8);
  const canvas=document.createElement('canvas');
  canvas.className='deck-drag-image-source';
  canvas.width=width; canvas.height=height;
  canvas.style.width=`${width}px`; canvas.style.height=`${height}px`;
  const ctx=canvas.getContext('2d');
  if(!ctx) return null;
  ctx.clearRect(0,0,width,height);
  ordered.forEach((uid,index)=>{
    const x=4+stepX*index, y=4+stepY*index;
    ctx.save();
    ctx.shadowColor='rgba(0,0,0,.7)'; ctx.shadowBlur=5; ctx.shadowOffsetX=2; ctx.shadowOffsetY=2;
    ctx.fillStyle='#101722'; ctx.fillRect(x,y,cardW,cardH);
    const img=deckDragPreviewImage(uid);
    if(img?.complete && img.naturalWidth>0) {
      try { ctx.drawImage(img,x,y,cardW,cardH); } catch {}
    } else {
      const found=entryByUid(uid); const card=found?state.indexes.byId.get(Number(found.entry.id)):null;
      ctx.fillStyle='#dce7f5'; ctx.font='bold 9px sans-serif'; ctx.textAlign='center';
      const name=String(card?.name || 'Card');
      ctx.fillText(name.length>15?`${name.slice(0,14)}…`:name,x+cardW/2,y+cardH/2);
    }
    ctx.restore();
  });
  if(count>1){
    const label=`${count}`;
    ctx.font='bold 14px sans-serif';
    const labelW=Math.max(24,ctx.measureText(label).width+12);
    const x=width-labelW-3,y=3;
    ctx.fillStyle='rgba(9,14,22,.94)'; ctx.fillRect(x,y,labelW,23);
    ctx.strokeStyle='rgba(132,177,255,.95)'; ctx.strokeRect(x+.5,y+.5,labelW-1,22);
    ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(label,x+labelW/2,y+11.5);
  }
  return canvas;
}
function setDeckDragImage(event,uids) {
  const preview=createDeckDragPreview(uids);
  if(!preview || !event?.dataTransfer) return false;
  document.body.append(preview);
  try { event.dataTransfer.setDragImage(preview,Math.min(55,preview.width/2),Math.min(55,preview.height/2)); }
  catch { preview.remove(); return false; }
  setTimeout(()=>preview.remove(),0);
  return true;
}
function clearCardSelection({render = true} = {}) {
  state.hoverPreview = null;
  state.selectedCardId = null;
  state.selectedEntryUid = null;
  state.selectedEntryUids.clear();
  state.selectedArtworkId = null;
  state.selectionAnchorUid = null;
  if (render) { renderSelectedCard(); renderDeckSelection(); renderSearchSelection(); }
}
function setPrimarySelectionFromUid(uid) {
  const found = entryByUid(uid);
  if (!found) { clearCardSelection(); return false; }
  const card = state.indexes.byId.get(Number(found.entry.id));
  if (!card) { clearCardSelection(); return false; }
  state.selectedEntryUid = Number(found.entry.uid);
  state.selectedCardId = Number(card.id);
  state.selectedArtworkId = preferredImage(card, found.entry.id)?.id || card.images?.[0]?.id || card.id;
  return true;
}
function setSelectionAnchor(uid) {
  state.selectionAnchorUid = uid == null ? null : Number(uid);
}
function selectEntryRange(clickedUid, {additive = false} = {}) {
  const clicked = entryByUid(clickedUid);
  if (!clicked) return false;
  const anchorUid = state.selectionAnchorUid ?? state.selectedEntryUid ?? Number(clickedUid);
  const anchor = entryByUid(anchorUid);
  if (!anchor || anchor.section !== clicked.section) {
    const card = state.indexes.byId.get(Number(clicked.entry.id));
    if (!card) return false;
    selectCard(card, clicked.entry.uid, clicked.entry.id, {additive:false, toggle:false});
    setSelectionAnchor(clicked.entry.uid);
    return true;
  }
  const entries = state.deck[clicked.section] || [];
  const start = entries.findIndex(e => Number(e.uid) === Number(anchor.entry.uid));
  const end = entries.findIndex(e => Number(e.uid) === Number(clicked.entry.uid));
  if (start < 0 || end < 0) return false;
  const [lo, hi] = start <= end ? [start, end] : [end, start];
  const range = entries.slice(lo, hi + 1).map(e => Number(e.uid));
  state.selectedEntryUids = additive ? new Set([...selectedDeckUids(), ...range]) : new Set(range);
  if (!setPrimarySelectionFromUid(clicked.entry.uid)) return false;
  renderSelectedCard();
  renderDeckSelection();
  renderSearchSelection();
  return true;
}
function selectCard(card, entryUid = null, artworkId = null, {additive = false, toggle = false} = {}) {
  if (!card) return;
  state.hoverPreview = null;
  if (entryUid != null) {
    const uid = Number(entryUid);
    if (!additive) state.selectedEntryUids = new Set([uid]);
    else if (toggle && state.selectedEntryUids.has(uid)) {
      state.selectedEntryUids.delete(uid);
      if (!state.selectedEntryUids.size) { clearCardSelection(); return; }
      if (state.selectedEntryUid === uid) {
        const fallback = selectedDeckUids().at(-1);
        if (!setPrimarySelectionFromUid(fallback)) return;
      }
      renderSelectedCard(); renderDeckSelection(); renderSearchSelection();
      return;
    } else state.selectedEntryUids.add(uid);
  } else {
    state.selectedEntryUids.clear();
  }
  state.selectedCardId = card.id;
  state.selectedEntryUid = entryUid == null ? null : Number(entryUid);
  if (entryUid != null) setSelectionAnchor(entryUid);
  const requested = artworkId ?? (entryUid ? entryByUid(entryUid)?.entry?.id : null);
  state.selectedArtworkId = preferredImage(card, requested)?.id || card.images?.[0]?.id || card.id;
  renderSelectedCard();
  renderDeckSelection();
  renderSearchSelection();
}
function actionUids(clickedUid = null) {
  const uid = clickedUid == null ? null : Number(clickedUid);
  if (uid != null && state.selectedEntryUids.has(uid) && state.selectedEntryUids.size > 1) return selectedDeckUids();
  return uid == null ? selectedDeckUids() : [uid];
}
function sectionUsesLiveSort(section) {
  return state.deckSortSections.has(section);
}
function sortSectionWithCurrentRules(section) {
  if(!sectionUsesLiveSort(section)) return;
  const arr=state.deck[section];
  arr.splice(0,arr.length,...sortDeckEntriesSelective(arr,state.indexes.byId,state.deckSort,state.deckSortDirection,state.banlist,state.deckSortTypes,state.deckSortTypeMode,state.deckSortGroupCategories,state.deckSortFamilies));
}
function groupIncomingCopies(section, incomingUids) {
  const target=state.deck[section];
  const incoming=new Set((incomingUids || []).map(Number));
  for(const uid of [...incoming]) {
    const index=target.findIndex(entry=>Number(entry.uid)===uid);
    if(index<0) continue;
    const entry=target[index];
    const card=state.indexes.byId.get(Number(entry.id));
    if(!card) continue;
    const group=copyGroup(card);
    const hasOtherCopy=target.some(other=>Number(other.uid)!==uid && copyGroup(state.indexes.byId.get(Number(other.id)))===group);
    if(!hasOtherCopy) continue;
    target.splice(index,1);
    let lastCopy=-1;
    for(let i=0;i<target.length;i++) {
      const existing=state.indexes.byId.get(Number(target[i]?.id));
      if(existing && copyGroup(existing)===group) lastCopy=i;
    }
    target.splice(lastCopy>=0?lastCopy+1:target.length,0,entry);
  }
}
function addCard(card, section, {afterUid = null, artworkId = null, recordHistory = true} = {}) {
  const check = canAddCard(state.deck, section, card, state.indexes.byId, state.banlist);
  if (!check.ok) { toast(check.error, 'error'); return false; }
  const before=recordHistory ? captureDeckSnapshot() : null;
  const previousCounts=deckZoneCountsSnapshot();
  const requestedArtwork = artworkId ?? (state.selectedCardId === card.id ? state.selectedArtworkId : null);
  const ydkId = preferredImage(card, requestedArtwork)?.id || card.images?.[0]?.id || card.id;
  const entry = {uid:state.nextUid++, id:Number(ydkId)};
  const arr = state.deck[section];
  if (afterUid != null) {
    const index = arr.findIndex(e => e.uid === Number(afterUid));
    arr.splice(index >= 0 ? index + 1 : arr.length, 0, entry);
  } else {
    const index = deckInsertionIndex(arr, card, state.indexes.byId);
    arr.splice(index, 0, entry);
  }
  if(sectionUsesLiveSort(section)) sortSectionWithCurrentRules(section);
  state.selectedCardId = card.id;
  state.selectedEntryUid = entry.uid;
  state.selectedEntryUids = new Set([Number(entry.uid)]);
  state.selectedArtworkId = Number(ydkId);
  setSelectionAnchor(entry.uid);
  updateAfterDeckMutation(previousCounts);
  if(before) commitDeckHistory(before);
  return true;
}
function addSearchCard(card, section) {
  return addCard(card, section);
}
function duplicateEntry(uid) {
  const found = entryByUid(uid);
  if (!found) return;
  const card = state.indexes.byId.get(Number(found.entry.id));
  if (!card) return;
  addCard(card, found.section, {afterUid:uid, artworkId:found.entry.id});
}
function duplicateEntries(uids) {
  const originals = (uids || []).map(uid => entryByUid(uid)).filter(Boolean);
  if (!originals.length) return;
  const before=captureDeckSnapshot();
  let added=0;
  for (const found of originals) {
    const card = state.indexes.byId.get(Number(found.entry.id));
    if (card && addCard(card, found.section, {afterUid:found.entry.uid, artworkId:found.entry.id, recordHistory:false})) added += 1;
  }
  if(added) commitDeckHistory(before);
}
function syncDeckSortLegacyScope() {
  const sections=[...state.deckSortSections].filter(section=>SECTION_ORDER.includes(section));
  if(sections.length===SECTION_ORDER.length) state.deckSortScope='all';
  else if(sections.length===1) state.deckSortScope=sections[0];
  else state.deckSortScope='custom';
}
function deckSortModeLabel(value=state.deckSort) {
  return DECK_SORT_MODE_OPTIONS.find(([key])=>key===value)?.[1] || 'Name';
}
function deckSortSectionsLabel() {
  const sections=SECTION_ORDER.filter(section=>state.deckSortSections.has(section));
  if(sections.length===SECTION_ORDER.length) return 'All Decks';
  return sections.map(section=>SECTION_LABELS[section].replace(' Deck','')).join(' + ') || 'No Decks';
}
function deckSortFamiliesLabel(families=state.deckSortFamilies) {
  const selected=DECK_SORT_FAMILY_OPTIONS.filter(([key])=>families.has(key));
  if(selected.length===DECK_SORT_FAMILY_OPTIONS.length) return 'All Families';
  if(!selected.length) return 'No Families';
  return selected.map(([,label])=>label).join(' + ');
}
function deckSortTypesLabel() {
  if(!state.deckSortTypes.size) return 'All Subtypes';
  if(state.deckSortTypes.size===1) {
    const key=[...state.deckSortTypes][0];
    return DECK_SORT_TYPE_OPTIONS.find(([value])=>value===key)?.[1] || '1 Subtype';
  }
  return `${state.deckSortTypes.size} Subtypes`;
}
function updateDeckSortSummary() {
  syncDeckSortLegacyScope();
  const subtypeSuffix=state.deckSortTypes.size?` · ${deckSortTypesLabel()}`:'';
  const text=`${deckSortModeLabel()} · ${deckSortSectionsLabel()} · ${deckSortFamiliesLabel()}${subtypeSuffix}`;
  if(dom.deckSortSummary) dom.deckSortSummary.textContent=text;
  if(dom.deckSortFilterBtn) dom.deckSortFilterBtn.title=`Deck Sort: ${deckSortModeTooltip(state.deckSort)}`;
  updateDeckSortDescription();
}
function deckSortChoiceLabel(name,value,checked,type='checkbox') {
  const label=el('label','deck-sort-choice');
  const input=document.createElement('input');
  input.type=type;
  input.name=name;
  input.value=value;
  input.checked=checked;
  label.append(input,document.createTextNode(DECK_SORT_TYPE_OPTIONS.find(([key])=>key===value)?.[1] || SECTION_LABELS[value] || value));
  return label;
}
function deckSortDraftFamilies() {
  if(!dom.deckSortPopover) return state.deckSortFamilies;
  return new Set([...dom.deckSortPopover.querySelectorAll('input[name="deckSortFamilyModal"]:checked')].map(input=>input.value));
}
function deckSortDraftTypesLabel() {
  if(!dom.deckSortPopover) return deckSortTypesLabel();
  const checked=[...dom.deckSortPopover.querySelectorAll('input[name="deckSortTypeModal"]:checked')].map(input=>input.value);
  if(!checked.length) return 'All Subtypes';
  if(checked.length===1) return DECK_SORT_TYPE_OPTIONS.find(([value])=>value===checked[0])?.[1] || '1 Subtype';
  return `${checked.length} Subtypes`;
}
function updateDeckSortDraftTypeSummary() {
  if(dom.deckSortTypeDropdownSummary) dom.deckSortTypeDropdownSummary.textContent=deckSortDraftTypesLabel();
}
function storedDeckOrderForMode(mode=state.deckSort) {
  if(mode==='loaded') return state.loadedDeckOrder;
  if(mode==='saved') return state.savedDeckOrder;
  return null;
}
function captureDeckOrderSnapshot() {
  return Object.fromEntries(SECTION_ORDER.map(section=>[section,state.deck[section].map(entry=>Number(entry.uid))]));
}
function captureLoadedDeckOrder() {
  state.loadedDeckOrder=captureDeckOrderSnapshot();
}
function ensureManualDeckOrderSnapshot() {
  if(state.savedDeckOrder) return false;
  state.savedDeckOrder=captureDeckOrderSnapshot();
  renderSavedDeckOrderStatus();
  renderDeckSortModeOptions();
  return true;
}
function captureManualDeckOrder(sections = SECTION_ORDER) {
  const wanted=new Set((Array.isArray(sections)?sections:[sections]).filter(section=>SECTION_ORDER.includes(section)));
  if(!wanted.size) return;
  const snapshot=state.savedDeckOrder
    ? Object.fromEntries(SECTION_ORDER.map(section=>[section,[...(state.savedDeckOrder[section] || [])]]))
    : captureDeckOrderSnapshot();
  for(const section of wanted) snapshot[section]=state.deck[section].map(entry=>Number(entry.uid));
  state.savedDeckOrder=snapshot;
  renderSavedDeckOrderStatus();
  renderDeckSortModeOptions();
}
function renderDeckSortModeOptions() {
  const makeSortButton=([value,label])=>{
    const button=el('button','btn compact deck-sort-mode-btn',label);
    button.type='button';
    button.dataset.deckSortMode=value;
    const active=state.deckSort===value;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',active?'true':'false');
    if(active) button.dataset.direction=state.deckSortDirection;
    button.title=active?`${deckSortModeTooltip(value)} · click again to reverse`:deckSortModeTooltip(value);
    return button;
  };
  const makeRestoreButton=([value,label])=>{
    const snapshot=storedDeckOrderForMode(value);
    const button=el('button','btn compact deck-sort-mode-btn deck-restore-order-btn',label);
    button.type='button';
    button.dataset.deckRestoreOrder=value;
    button.disabled=!snapshot;
    button.setAttribute('aria-label',label);
    if(value==='loaded') button.title=snapshot?'Restore selected deck sections to their order when the current file was opened.':'No loaded file order is available.';
    else button.title=snapshot?'Restore selected deck sections to their most recently captured manual arrangement.':'No manual order has been captured yet.';
    return button;
  };
  dom.deckSortModeOptions?.replaceChildren(...DECK_SORT_MODE_OPTIONS.map(makeSortButton));
  dom.deckStoredOrderOptions?.replaceChildren(...DECK_RESTORE_ORDER_OPTIONS.map(makeRestoreButton));
}
function renderSavedDeckOrderStatus() {
  if(!dom.savedDeckOrderStatus) return;
  const loaded=Boolean(state.loadedDeckOrder);
  const saved=Boolean(state.savedDeckOrder);
  dom.savedDeckOrderStatus.textContent=`Loaded file ${loaded?'ready':'unavailable'} · Last manual order ${saved?'captured':'captures after a manual move'}`;
}
function flashRestoredOrderButton(mode) {
  const button=dom.deckStoredOrderOptions?.querySelector(`[data-deck-restore-order="${mode}"]`);
  if(!button) return;
  const label=DECK_RESTORE_ORDER_OPTIONS.find(([value])=>value===mode)?.[1] || 'Restore Order';
  button.classList.add('restored');
  button.textContent='Restored ✓';
  window.setTimeout(()=>{
    if(!button.isConnected) return;
    button.classList.remove('restored');
    button.textContent=label;
  },900);
}
function restoreStoredDeckOrder(mode,showToast=true) {
  const snapshot=storedDeckOrderForMode(mode);
  if(!snapshot) {
    if(showToast) toast(mode==='loaded'?'No loaded file order is available.':'Manually move cards first to capture a Last Manual Order.','warn');
    return false;
  }
  const sections=SECTION_ORDER.filter(section=>state.deckSortSections.has(section));
  if(!sections.length) {
    if(showToast) toast('Choose at least one deck section to restore.','warn');
    return false;
  }
  const before=captureDeckSnapshot();
  for(const section of sections) {
    const arr=state.deck[section];
    arr.splice(0,arr.length,...applyStoredDeckOrder(arr,snapshot[section] || [],state.indexes.byId));
  }
  renderDeck();
  syncTextView();
  setDirty();
  commitDeckHistory(before);
  persistState();
  flashRestoredOrderButton(mode);
  if(showToast) toast(mode==='loaded'?`Loaded file order restored for ${deckSortSectionsLabel()}.`:`Last manual order restored for ${deckSortSectionsLabel()}.`,'good');
  return true;
}
function renderDeckSortPopover() {
  if(!dom.deckSortPopover) return;
  if(dom.deckSortBanlist) dom.deckSortBanlist.value=state.banlist;
  if(dom.deckSortCardPool) dom.deckSortCardPool.value=state.cardPool;
  renderDeckSortModeOptions();
  if(dom.deckSortGroupCategories) dom.deckSortGroupCategories.checked=state.deckSortGroupCategories;
  dom.deckSortFamilyOptions?.replaceChildren(...DECK_SORT_FAMILY_OPTIONS.map(([value,label])=>{
    const node=deckSortChoiceLabel('deckSortFamilyModal',value,state.deckSortFamilies.has(value));
    node.lastChild.textContent=label;
    node.classList.add('deck-sort-family-choice');
    return node;
  }));
  dom.deckSortDeckOptions.replaceChildren(...SECTION_ORDER.map(section=>deckSortChoiceLabel('deckSortSectionModal',section,state.deckSortSections.has(section))));
  dom.deckSortTypeOptions.replaceChildren(...DECK_SORT_TYPE_OPTIONS.map(([value,label])=>{
    const node=deckSortChoiceLabel('deckSortTypeModal',value,state.deckSortTypes.has(value));
    node.lastChild.textContent=label;
    return node;
  }));
  const typeMode=dom.deckSortPopover.querySelector(`input[name="deckSortTypeMode"][value="${state.deckSortTypeMode}"]`);
  if(typeMode) typeMode.checked=true;
  updateDeckSortDraftTypeSummary();
  renderSavedDeckOrderStatus();
}
function optionDrawerParts(kind) {
  if(kind==='search') return {
    popover:dom.searchFilterPopover,
    live:$('#searchLiveArea'),
    stage:$('#searchResultsStage'),
    splitter:$('#searchOptionsSplitter'),
    button:$('#dockSearchFilterPopoverBtn'),
    overlayParent:dom.searchFilterBtn?.closest('.search-filter-menu-label') || dom.searchFilterBtn?.parentElement,
  };
  return {
    popover:dom.deckSortPopover,
    live:$('#deckLiveArea'),
    stage:$('#deckContentStage'),
    splitter:$('#deckSortOptionsSplitter'),
    button:$('#dockDeckSortPopoverBtn'),
    overlayParent:dom.deckSortFilterBtn?.closest('.deck-sort-filter-label') || dom.deckSortFilterBtn?.parentElement,
  };
}
function optionDrawerIsDocked(kind) { return state.optionDrawers?.[kind]?.docked !== false; }
function optionDrawerIsFloating(kind) { return !optionDrawerIsDocked(kind); }
function optionDrawerIsPinnedDocked(kind) { return optionDrawerIsDocked(kind) && Boolean(state.optionDrawers?.[kind]?.pinned); }
function optionDrawerIsOverlay(kind) { return optionDrawerIsDocked(kind) && !Boolean(state.optionDrawers?.[kind]?.pinned); }
function optionDrawerMayAutoDismiss(kind) {
  if(optionDrawerResizeActiveKind) return false;
  return optionDrawerIsOverlay(kind);
}
function syncOptionDrawerControls(kind) {
  const isSearch=kind==='search';
  const cfg=state.optionDrawers[kind];
  const pinButton=$(isSearch?'#pinSearchFilterPopoverBtn':'#pinDeckSortPopoverBtn');
  const dockButton=$(isSearch?'#dockSearchFilterPopoverBtn':'#dockDeckSortPopoverBtn');
  const floating=optionDrawerIsFloating(kind);
  const pinned=!floating && Boolean(cfg?.pinned);
  if(pinButton) {
    pinButton.setAttribute('aria-pressed',String(pinned));
    pinButton.classList.toggle('active',pinned);
    pinButton.textContent=pinned?'Pinned':'Pin';
    pinButton.disabled=false;
    pinButton.title=floating
      ? 'Dock and pin this window beside the content.'
      : (pinned?'Return this menu to overlay mode':'Pin this menu beside the content at its current saved width');
  }
  if(dockButton) {
    dockButton.setAttribute('aria-pressed',String(!floating));
    dockButton.classList.toggle('active',floating);
    if(floating) {
      dockButton.textContent='Dock';
      dockButton.title='Dock this window without pinning it.';
    } else {
      dockButton.textContent='Undock';
      dockButton.title='Undock into a movable window.';
    }
  }
}
function optionDrawerWidthLimits(kind) {
  const {live}=optionDrawerParts(kind);
  const total=Math.max(0,live?.getBoundingClientRect().width || 0);
  const limits=OPTION_DRAWER_LIMITS[kind];
  const hardMin=limits.min;
  const hardMax=limits.max;
  const contentFloor=limits.contentFloor;
  let availableMax=hardMax;
  if(kind==='search' && dom.workspace) {
    const ws=dom.workspace.getBoundingClientRect();
    const rightHidden=dom.workspace.classList.contains('hide-right') || dom.workspace.classList.contains('auto-hide-right');
    const right=rightHidden?0:(dom.rightPanel?.getBoundingClientRect().width || 0);
    const deckFloor=Math.min(430,Math.max(280,ws.width*0.30));
    availableMax=ws.width-right-deckFloor-contentFloor-(rightHidden?14:20);
  } else if(total>0) availableMax=total-contentFloor-10;
  const max=Math.max(hardMin,Math.min(hardMax,availableMax));
  return {min:hardMin,max,total,contentFloor};
}
function applyDockedDrawerWidth(kind) {
  const cfg=state.optionDrawers[kind];
  const {live}=optionDrawerParts(kind);
  if(!cfg || !live) return;
  const {min,max}=optionDrawerWidthLimits(kind);
  const fallback=OPTION_DRAWER_LIMITS[kind].fallback;
  cfg.width=Math.round(clampNumber(Number(cfg.width)||fallback,min,max));
  live.style.setProperty('--option-drawer-width',`${cfg.width}px`);
}
function setupDockedDrawerSplitter(kind) {
  const {splitter,live}=optionDrawerParts(kind);
  if(!splitter || !live || splitter.dataset.drawerResizeReady==='1') return;
  splitter.dataset.drawerResizeReady='1';
  let active=false,startX=0,startWidth=0,pointerId=null;
  splitter.addEventListener('pointerdown',ev=>{
    if(!optionDrawerIsPinnedDocked(kind) || !live.classList.contains('drawer-open') || ev.button!==0) return;
    active=true; pointerId=ev.pointerId; startX=ev.clientX; startWidth=Number(state.optionDrawers[kind].width)||splitter.previousElementSibling?.getBoundingClientRect().width||0;
    optionDrawerResizeActiveKind=kind;
    splitter.classList.add('dragging');
    document.documentElement.classList.add('option-drawer-resizing');
    splitter.setPointerCapture?.(ev.pointerId);
    ev.preventDefault(); ev.stopPropagation();
  });
  splitter.addEventListener('pointermove',ev=>{
    if(!active) return;
    const {min,max}=optionDrawerWidthLimits(kind);
    state.optionDrawers[kind].width=Math.round(clampNumber(startWidth+(ev.clientX-startX),min,max));
    applyDockedDrawerWidth(kind);
    if(kind==='search') { refreshPinnedSearchPaneForDrawer(); updateSearchDrawerWorkspaceReservation(); }
    scheduleDeckLayout();
    ev.preventDefault();
  });
  const stop=ev=>{
    if(!active) return;
    active=false;
    splitter.classList.remove('dragging');
    document.documentElement.classList.remove('option-drawer-resizing');
    optionDrawerResizeActiveKind=null;
    try{splitter.releasePointerCapture?.(pointerId ?? ev.pointerId);}catch{}
    applyDockedDrawerWidth(kind);
    if(kind==='search') { refreshPinnedSearchPaneForDrawer(); updateSearchDrawerWorkspaceReservation(); }
    persistState();
    scheduleDeckLayout();
    ev.preventDefault?.(); ev.stopPropagation?.();
  };
  splitter.addEventListener('pointerup',stop);
  splitter.addEventListener('pointercancel',stop);
  splitter.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();});
}
function clampFloatingDrawerPosition(kind) {
  const {popover}=optionDrawerParts(kind);
  if(!popover || !optionDrawerIsFloating(kind)) return;
  const rect=popover.getBoundingClientRect();
  const margin=8;
  const maxX=Math.max(margin,window.innerWidth-rect.width-margin);
  const maxY=Math.max(margin,window.innerHeight-rect.height-margin);
  const cfg=state.optionDrawers[kind];
  const minY=Math.max(margin,Math.round(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) || 64)+8);
  const x=Math.max(margin,Math.min(maxX,Number.isFinite(Number(cfg.x))?Number(cfg.x):margin));
  const y=Math.max(minY,Math.min(maxY,Number.isFinite(Number(cfg.y))?Number(cfg.y):minY));
  cfg.x=Math.round(x); cfg.y=Math.round(y);
  popover.style.left=`${cfg.x}px`;
  popover.style.top=`${cfg.y}px`;
}
function searchPinnedLayoutChrome() {
  return 22;
}
function captureSearchPinLayout() {
  const cfg=state.optionDrawers.search;
  if(!cfg || isPaneHidden('left')) return;
  const workspaceWidth=Math.max(1,dom.workspace?.getBoundingClientRect().width || window.innerWidth || 1);
  const current=currentPanelWidths();
  const leftWidth=Math.max(PANEL_LIMITS.leftMin,dom.searchPanel?.getBoundingClientRect().width || current.left);
  const resultsWidth=Math.max(1,$('#searchResultsStage')?.getBoundingClientRect().width || leftWidth);
  cfg.pinRestoreLeftWidth=leftWidth;
  cfg.pinRestoreLeftRatio=Number.isFinite(Number(state.panelRatios.left)) && Number(state.panelRatios.left)>0 ? Number(state.panelRatios.left) : leftWidth/workspaceWidth;
  cfg.pinRestoreResultsWidth=resultsWidth;
  cfg.pinnedPaneManual=false;
  cfg.pinnedPaneWidth=leftWidth+(Number(cfg.width)||OPTION_DRAWER_LIMITS.search.fallback)+searchPinnedLayoutChrome();
}
function restoreSearchPinLayout({clear=true}={}) {
  const cfg=state.optionDrawers.search;
  if(!cfg) return;
  const restoreWidth=Number(cfg.pinRestoreLeftWidth);
  const restoreRatio=Number(cfg.pinRestoreLeftRatio);
  if(Number.isFinite(restoreWidth) && restoreWidth>0) document.documentElement.style.setProperty('--left-width',`${restoreWidth}px`);
  if(Number.isFinite(restoreRatio) && restoreRatio>0) state.panelRatios.left=restoreRatio;
  else if(Number.isFinite(restoreWidth) && restoreWidth>0) state.panelRatios.left=restoreWidth/Math.max(1,dom.workspace?.clientWidth || window.innerWidth || 1);
  if(clear) {
    cfg.pinRestoreLeftWidth=null;
    cfg.pinRestoreLeftRatio=null;
    cfg.pinRestoreResultsWidth=null;
    cfg.pinnedPaneWidth=null;
    cfg.pinnedPaneManual=false;
  }
}
function refreshPinnedSearchPaneForDrawer() {
  const cfg=state.optionDrawers.search;
  if(!cfg || !optionDrawerIsPinnedDocked('search') || cfg.pinnedPaneManual) return;
  const restoreWidth=Number(cfg.pinRestoreLeftWidth);
  if(!Number.isFinite(restoreWidth) || restoreWidth<=0) return;
  cfg.pinnedPaneWidth=restoreWidth+(Number(cfg.width)||OPTION_DRAWER_LIMITS.search.fallback)+searchPinnedLayoutChrome();
}
function pinnedSearchWorkspaceMaximum() {
  if(!dom.workspace) return PANEL_LIMITS.leftMin;
  const ws=dom.workspace.getBoundingClientRect();
  const styles=getComputedStyle(document.documentElement);
  const rightHidden=dom.workspace.classList.contains('hide-right') || dom.workspace.classList.contains('auto-hide-right');
  const right=rightHidden?0:(dom.rightPanel?.getBoundingClientRect().width || parseFloat(styles.getPropertyValue('--right-width')) || 360);
  const splitterSpace=rightHidden?10:15;
  const workspaceCap=Math.max(PANEL_LIMITS.leftMin,ws.width-right-PANEL_LIMITS.deckMin-splitterSpace);
  return Math.min(workspaceCap,pinnedSearchPaneMaximumForDrawer());
}
function schedulePinnedSearchResultsWidthReconcile() {
  if(searchPinGeometryRaf) cancelAnimationFrame(searchPinGeometryRaf);
  searchPinGeometryRaf=requestAnimationFrame(()=>{
    searchPinGeometryRaf=0;
    const cfg=state.optionDrawers.search;
    const stage=$('#searchResultsStage');
    if(!cfg || !stage || cfg.pinnedPaneManual || !optionDrawerIsPinnedDocked('search') || dom.searchFilterPopover?.classList.contains('hidden')) return;
    const desired=Number(cfg.pinRestoreResultsWidth);
    const actual=stage.getBoundingClientRect().width;
    if(!Number.isFinite(desired) || desired<=0 || !Number.isFinite(actual) || actual<=0) return;
    const delta=desired-actual;
    if(Math.abs(delta)<0.5) return;
    const current=parseFloat(dom.workspace.style.getPropertyValue('--search-options-expanded-width')) || dom.searchPanel?.getBoundingClientRect().width || Number(cfg.pinnedPaneWidth) || 0;
    const corrected=clampNumber(current+delta,pinnedSearchPaneMinimum(),pinnedSearchWorkspaceMaximum());
    cfg.pinnedPaneWidth=corrected;
    dom.workspace.style.setProperty('--search-options-expanded-width',`${corrected}px`);
  });
}
function updateSearchDrawerWorkspaceReservation() {
  const cfg=state.optionDrawers.search;
  const open=Boolean(dom.searchFilterPopover && !dom.searchFilterPopover.classList.contains('hidden'));
  const active=open && optionDrawerIsPinnedDocked('search') && !dom.workspace.classList.contains('hide-search') && !dom.workspace.classList.contains('auto-hide-search');
  dom.workspace.classList.toggle('search-options-expanded',active);
  if(!active) {
    dom.workspace.style.removeProperty('--search-options-expanded-width');
    return;
  }
  applyDockedDrawerWidth('search');
  if(!Number.isFinite(Number(cfg.pinRestoreLeftWidth)) || Number(cfg.pinRestoreLeftWidth)<=0) captureSearchPinLayout();
  refreshPinnedSearchPaneForDrawer();
  const styles=getComputedStyle(document.documentElement);
  const base=Math.max(300,parseFloat(styles.getPropertyValue('--left-width')) || dom.searchPanel?.getBoundingClientRect().width || 340);
  const maxWidth=pinnedSearchWorkspaceMaximum();
  const requested=Number(cfg.pinnedPaneWidth);
  const initialPreserved=Number(cfg.pinRestoreLeftWidth)>0
    ? Number(cfg.pinRestoreLeftWidth)+(Number(cfg.width)||OPTION_DRAWER_LIMITS.search.fallback)+searchPinnedLayoutChrome()
    : pinnedSearchPaneMinimum();
  const preferred=Number.isFinite(requested)&&requested>0 ? requested : initialPreserved;
  const target=Math.min(maxWidth,Math.max(pinnedSearchPaneMinimum(),preferred,base));
  dom.workspace.style.setProperty('--search-options-expanded-width',`${target}px`);
  schedulePinnedSearchResultsWidthReconcile();
}
function syncOptionDrawerPresentation(kind) {
  const cfg=state.optionDrawers[kind];
  const {popover,live,stage,splitter,overlayParent}=optionDrawerParts(kind);
  if(!popover || !live || !stage) return;
  const open=!popover.classList.contains('hidden');
  popover.classList.remove('docked-drawer','floating-drawer','overlay-drawer');
  live.classList.remove('drawer-open');
  if(optionDrawerIsFloating(kind)) {
    popover.classList.add('floating-drawer');
    if(popover.parentElement!==document.body) document.body.append(popover);
    if(open) requestAnimationFrame(()=>clampFloatingDrawerPosition(kind));
  } else if(optionDrawerIsPinnedDocked(kind)) {
    popover.classList.add('docked-drawer');
    if(popover.parentElement!==live) live.insertBefore(popover,splitter || stage);
    if(open) live.classList.add('drawer-open');
    applyDockedDrawerWidth(kind);
  } else {
    popover.classList.add('overlay-drawer');
    if(overlayParent && popover.parentElement!==overlayParent) overlayParent.append(popover);
    popover.style.removeProperty('left');
    popover.style.removeProperty('top');
    popover.style.removeProperty('bottom');
    popover.style.removeProperty('right');
    popover.style.removeProperty('max-height');
  }
  syncOptionDrawerControls(kind);
  updateSearchDrawerWorkspaceReservation();
  scheduleDeckLayout();
}
function setOptionDrawerDocked(kind,docked,{persist=true}={}) {
  const cfg=state.optionDrawers[kind];
  const {popover}=optionDrawerParts(kind);
  if(!cfg || !popover) return;
  const wasAttached=optionDrawerIsDocked(kind);
  const wasPinnedDocked=optionDrawerIsPinnedDocked(kind);
  const rect=popover.getBoundingClientRect();
  const attaching=Boolean(docked);
  if(!attaching) {
    if(kind==='search' && wasPinnedDocked) restoreSearchPinLayout();
    cfg.docked=false;
    cfg.pinned=false;
    cfg.returnPinned=false;
    if(!Number.isFinite(Number(cfg.x)) || !Number.isFinite(Number(cfg.y))) {
      const topbarBottom=document.querySelector('.topbar')?.getBoundingClientRect().bottom || 64;
      cfg.x=Math.round(Math.max(8,rect.left));
      cfg.y=Math.round(Math.max(topbarBottom+8,rect.top));
    }
  } else {
    if(kind==='search' && wasPinnedDocked) restoreSearchPinLayout();
    cfg.docked=true;
    cfg.pinned=false;
    cfg.returnPinned=false;
  }
  if(kind==='search') searchOptionsPinned=false;
  else deckSortPinned=false;
  syncOptionDrawerPresentation(kind);
  if(!cfg.docked && !popover.classList.contains('hidden')) requestAnimationFrame(()=>{clampFloatingDrawerPosition(kind);popover.focus?.({preventScroll:true});});
  if(persist) persistState();
}
function setupFloatingDrawerDrag(kind) {
  const {popover}=optionDrawerParts(kind);
  if(!popover || popover.dataset.drawerDragReady==='1') return;
  const heading=popover.querySelector(kind==='search'?'.search-filter-popover-heading':'.deck-sort-popover-heading');
  if(!heading) return;
  popover.dataset.drawerDragReady='1';
  heading.classList.add('drawer-drag-handle');
  heading.addEventListener('pointerdown',ev=>{
    if(!optionDrawerIsFloating(kind) || ev.button!==0 || ev.target.closest('button,input,select,label,summary,a')) return;
    const rect=popover.getBoundingClientRect();
    const startX=ev.clientX, startY=ev.clientY, left=rect.left, top=rect.top;
    heading.setPointerCapture?.(ev.pointerId);
    popover.classList.add('drawer-dragging');
    const move=e=>{
      const cfg=state.optionDrawers[kind];
      cfg.x=Math.round(left+(e.clientX-startX));
      cfg.y=Math.round(top+(e.clientY-startY));
      clampFloatingDrawerPosition(kind);
    };
    const up=e=>{
      heading.removeEventListener('pointermove',move);
      heading.removeEventListener('pointerup',up);
      heading.removeEventListener('pointercancel',up);
      popover.classList.remove('drawer-dragging');
      heading.releasePointerCapture?.(e.pointerId);
      persistState();
    };
    heading.addEventListener('pointermove',move);
    heading.addEventListener('pointerup',up);
    heading.addEventListener('pointercancel',up);
    ev.preventDefault(); ev.stopPropagation();
  });
}
function setupDockedOptionDrawers() {
  const searchBody=$('#searchPanelBody');
  if(searchBody && dom.searchFilterPopover && !$('#searchLiveArea')) {
    const live=el('div','search-live-area'); live.id='searchLiveArea';
    const stage=el('div','search-results-stage'); stage.id='searchResultsStage';
    const resultsToolbar=searchBody.querySelector(':scope > .results-toolbar');
    const shortcut=searchBody.querySelector(':scope > .search-shortcut-strip');
    const insertBefore=$('#linkArrowScalePopover') || resultsToolbar || dom.searchResults;
    searchBody.insertBefore(live,insertBefore);
    const splitter=el('div','option-drawer-splitter'); splitter.id='searchOptionsSplitter'; splitter.title='Drag to resize pinned Search Options'; splitter.setAttribute('role','separator'); splitter.setAttribute('aria-orientation','vertical'); splitter.setAttribute('aria-label','Resize pinned Search Options');
    live.append(splitter,stage);
    if(resultsToolbar) stage.append(resultsToolbar);
    if(shortcut) stage.append(shortcut);
    if(dom.searchResults) stage.append(dom.searchResults);
  }
  const deckPanel=document.querySelector('.deck-panel');
  const deckToolbar=deckPanel?.querySelector(':scope > .deck-toolbar');
  if(deckPanel && deckToolbar && dom.deckSortPopover && !$('#deckLiveArea')) {
    const live=el('div','deck-live-area'); live.id='deckLiveArea';
    const stage=el('div','deck-content-stage'); stage.id='deckContentStage';
    const shortcut=deckPanel.querySelector(':scope > .shortcut-strip');
    deckToolbar.insertAdjacentElement('afterend',live);
    const splitter=el('div','option-drawer-splitter'); splitter.id='deckSortOptionsSplitter'; splitter.title='Drag to resize pinned Deck Sort'; splitter.setAttribute('role','separator'); splitter.setAttribute('aria-orientation','vertical'); splitter.setAttribute('aria-label','Resize pinned Deck Sort');
    live.append(splitter,stage);
    if(shortcut) stage.append(shortcut);
    if(dom.visualDeckView) stage.append(dom.visualDeckView);
    if(dom.listDeckView) stage.append(dom.listDeckView);
    if(dom.textDeckView) stage.append(dom.textDeckView);
  }
  for(const kind of ['search','deck']) {
    searchOptionsPinned=Boolean(state.optionDrawers.search.pinned);
    deckSortPinned=Boolean(state.optionDrawers.deck.pinned);
    setupFloatingDrawerDrag(kind);
    setupDockedDrawerSplitter(kind);
    syncOptionDrawerPresentation(kind);
  }
}
function setOptionDrawerPinned(kind,pinned) {
  const isSearch=kind==='search';
  const cfg=state.optionDrawers[kind];
  if(!cfg) return;
  const wantsPinned=Boolean(pinned);
  if(optionDrawerIsFloating(kind)) {
    if(wantsPinned) {
      if(isSearch) captureSearchPinLayout();
      setOptionDrawerDocked(kind,true,{persist:false});
      if(isSearch) searchOptionsPinned=true; else deckSortPinned=true;
      cfg.pinned=true;
      cfg.returnPinned=true;
      syncOptionDrawerPresentation(kind);
      persistState();
    }
    return;
  }
  const wasPinned=Boolean(cfg.pinned);
  if(isSearch && wantsPinned && !wasPinned) captureSearchPinLayout();
  if(isSearch) searchOptionsPinned=wantsPinned; else deckSortPinned=wantsPinned;
  cfg.pinned=wantsPinned;
  cfg.returnPinned=wantsPinned;
  if(isSearch && !wantsPinned && wasPinned) restoreSearchPinLayout();
  syncOptionDrawerPresentation(kind);
  if(isSearch && !wantsPinned) savePanelPrefs();
  persistState();
}
function openDeckSortPopover() {
  if(!dom.deckSortPopover) return;
  renderDeckSortPopover();
  dom.deckSortPopover.classList.remove('hidden');
  syncOptionDrawerPresentation('deck');
  if(optionDrawerIsOverlay('deck')) requestAnimationFrame(()=>fitFilterPopoverToViewport(dom.deckSortPopover,dom.deckSortFilterBtn));
  dom.deckSortFilterBtn?.setAttribute('aria-expanded','true');
  scheduleDeckLayout();
}
function closeDeckSortPopover() {
  dom.deckSortPopover?.classList.add('hidden');
  $('#deckLiveArea')?.classList.remove('drawer-open');
  dom.deckSortFilterBtn?.setAttribute('aria-expanded','false');
  updateSearchDrawerWorkspaceReservation();
  scheduleDeckLayout();
}
function toggleDeckSortPopover() {
  if(!dom.deckSortPopover) return;
  if(dom.deckSortPopover.classList.contains('hidden')) openDeckSortPopover(); else closeDeckSortPopover();
}
function resetDeckSortPopover() {
  if(!dom.deckSortPopover) return;
  state.deckSort='name';
  state.deckSortDirection='asc';
  state.deckSortGroupCategories=true;
  state.deckSortSections=new Set(SECTION_ORDER);
  state.deckSortFamilies=new Set(['monster','spell','trap','other']);
  state.deckSortTypes=new Set();
  state.deckSortTypeMode='Any';
  renderDeckSortPopover();
  updateDeckSortSummary();
  applyDeckSort(false);
  persistState();
}
function readDeckSortPopover() {
  if(!dom.deckSortPopover) return;
  const typeMode=dom.deckSortPopover.querySelector('input[name="deckSortTypeMode"]:checked')?.value || 'Any';
  const sections=new Set([...dom.deckSortPopover.querySelectorAll('input[name="deckSortSectionModal"]:checked')].map(input=>input.value).filter(section=>SECTION_ORDER.includes(section)));
  if(!sections.size) sections.add(SECTION_MAIN);
  const families=new Set([...dom.deckSortPopover.querySelectorAll('input[name="deckSortFamilyModal"]:checked')].map(input=>input.value).filter(key=>DECK_SORT_FAMILY_OPTIONS.some(([value])=>value===key)));
  if(!families.size) families.add('monster');
  const types=new Set([...dom.deckSortPopover.querySelectorAll('input[name="deckSortTypeModal"]:checked')].map(input=>input.value).filter(key=>DECK_SORT_TYPE_OPTIONS.some(([value])=>value===key)));
  state.deckSortSections=sections;
  state.deckSortFamilies=families;
  state.deckSortTypes=types;
  state.deckSortTypeMode=typeMode;
  state.deckSortGroupCategories=dom.deckSortGroupCategories ? dom.deckSortGroupCategories.checked : true;
  syncDeckSortLegacyScope();
  updateDeckSortSummary();
}
function applyDeckSortPopoverRealtime() {
  readDeckSortPopover();
  applyDeckSort(false);
  persistState();
}
function chooseDeckSortMode(mode) {
  if(!DECK_SORT_MODE_OPTIONS.some(([value])=>value===mode)) return;
  if(state.deckSort===mode) state.deckSortDirection=state.deckSortDirection==='desc'?'asc':'desc';
  else state.deckSort=mode;
  updateDeckSortSummary();
  renderDeckSortModeOptions();
  applyDeckSort(false);
  persistState();
}
function applyDeckSort(showToast = false) {
  const sections=SECTION_ORDER.filter(section=>state.deckSortSections.has(section));
  if(!sections.length) { if(showToast) toast('Choose at least one deck section to sort.','warn'); return; }
  const before=captureDeckSnapshot();
  for (const section of sections) sortSectionWithCurrentRules(section);
  renderDeck(); syncTextView(); setDirty();
  commitDeckHistory(before);
  if (showToast) toast(`${deckSortSectionsLabel()} sorted by ${deckSortModeLabel()} for ${deckSortFamiliesLabel()}${state.deckSortTypes.size?` (${deckSortTypesLabel()})`:''}.`,'good');
}
function removeEntries(uids) {
  const wanted = new Set((uids || []).map(Number));
  if (!wanted.size) return;
  const exists=SECTION_ORDER.some(section=>state.deck[section].some(entry=>wanted.has(Number(entry.uid))));
  if(!exists) return;
  const before=captureDeckSnapshot();
  const previousCounts=deckZoneCountsSnapshot();
  for (const section of SECTION_ORDER) state.deck[section] = state.deck[section].filter(entry => !wanted.has(Number(entry.uid)));
  for (const uid of wanted) state.selectedEntryUids.delete(uid);
  if (state.selectedEntryUid != null && wanted.has(Number(state.selectedEntryUid))) {
    const fallback = selectedDeckUids().at(-1);
    if (fallback != null) setPrimarySelectionFromUid(fallback);
    else {
      state.selectedEntryUid = null; state.selectedCardId = null; state.selectedArtworkId = null; state.hoverPreview = null; state.selectionAnchorUid = null;
    }
  }
  updateAfterDeckMutation(previousCounts);
  renderSelectedCard();
  commitDeckHistory(before);
}
function removeEntry(uid) { removeEntries([uid]); }
function moveEntries(uids, targetSection, targetUid = null, after = false) {
  const ordered = (uids || []).map(Number).filter((uid, index, arr) => arr.indexOf(uid) === index).filter(uid => entryByUid(uid));
  if (!ordered.length) return false;
  const moving = new Set(ordered);
  if (targetUid != null && moving.has(Number(targetUid))) return false;
  const details = ordered.map(uid => {
    const found = entryByUid(uid);
    return {...found, card:state.indexes.byId.get(Number(found.entry.id))};
  }).filter(item => item.card);
  if (!details.length) return false;
  const previousCounts=deckZoneCountsSnapshot();
  const remainingTargetCount = state.deck[targetSection].filter(entry => !moving.has(Number(entry.uid))).length;
  const incomingCount = details.length;
  if (remainingTargetCount + incomingCount > SECTION_LIMITS[targetSection]) {
    toast(`${SECTION_LABELS[targetSection]} is limited to ${SECTION_LIMITS[targetSection]} cards. Remove a card before adding more.`, 'error'); return false;
  }
  for (const item of details) {
    const check = canMoveCard(state.deck, item.section, targetSection, item.entry, item.card);
    if (!check.ok && item.section !== targetSection) { toast(check.error, 'error'); return false; }
  }
  const crossedSection=details.some(item=>item.section!==targetSection);
  if(crossedSection) ensureManualDeckOrderSnapshot();
  const before=captureDeckSnapshot();
  for (const section of SECTION_ORDER) state.deck[section] = state.deck[section].filter(entry => !moving.has(Number(entry.uid)));
  const target = state.deck[targetSection];
  let index = targetUid == null ? target.length : target.findIndex(entry => Number(entry.uid) === Number(targetUid));
  if (index < 0) index = target.length;
  if (after && index < target.length) index += 1;
  target.splice(index, 0, ...details.map(item => item.entry));
  if(crossedSection) {
    groupIncomingCopies(targetSection,ordered);
    sortSectionWithCurrentRules(targetSection);
  }
  state.selectedEntryUids = new Set(ordered);
  setSelectionAnchor(ordered.at(-1));
  if (!state.selectedEntryUids.has(Number(state.selectedEntryUid))) setPrimarySelectionFromUid(ordered.at(-1));
  updateAfterDeckMutation(previousCounts);
  if(!crossedSection) captureManualDeckOrder([targetSection]);
  commitDeckHistory(before);
  return true;
}
function moveEntry(uid, targetSection, targetUid = null, after = false) {
  return moveEntries([uid], targetSection, targetUid, after);
}
function toggleEntriesSide(uids) {
  const ordered = (uids || []).map(Number).filter(uid => entryByUid(uid));
  if (!ordered.length) return false;
  const previousCounts=deckZoneCountsSnapshot();
  const moving = new Set(ordered);
  const details = ordered.map(uid => {
    const found = entryByUid(uid);
    const card = state.indexes.byId.get(Number(found.entry.id));
    return {...found, card, target:found.section === SECTION_SIDE ? autoSection(card) : SECTION_SIDE};
  }).filter(item => item.card);
  const before=captureDeckSnapshot();
  const next = Object.fromEntries(SECTION_ORDER.map(section => [section, state.deck[section].filter(entry => !moving.has(Number(entry.uid)))]));
  for (const item of details) {
    if (item.target === SECTION_MAIN && belongsInExtra(item.card)) { toast(`${item.card.name} belongs in the Extra Deck.`, 'error'); return false; }
    if (item.target === SECTION_EXTRA && !belongsInExtra(item.card)) { toast(`${item.card.name} is not an Extra Deck monster.`, 'error'); return false; }
    if (next[item.target].length >= SECTION_LIMITS[item.target]) { toast(`${SECTION_LABELS[item.target]} is limited to ${SECTION_LIMITS[item.target]} cards. Remove a card before adding more.`, 'error'); return false; }
    next[item.target].push(item.entry);
  }
  ensureManualDeckOrderSnapshot();
  state.deck = next;
  const targets=new Set(details.map(item=>item.target));
  for(const section of targets) {
    const incoming=details.filter(item=>item.target===section).map(item=>Number(item.entry.uid));
    groupIncomingCopies(section,incoming);
    sortSectionWithCurrentRules(section);
  }
  state.selectedEntryUids = new Set(ordered);
  setSelectionAnchor(ordered.at(-1));
  if (!state.selectedEntryUids.has(Number(state.selectedEntryUid))) setPrimarySelectionFromUid(ordered.at(-1));
  updateAfterDeckMutation(previousCounts);
  commitDeckHistory(before);
  return true;
}
function updateAfterDeckMutation(previousCounts = null) {
  reconcileDeckZoneOccupancy(previousCounts);
  renderDeck();
  updateAnalysis();
  syncTextView();
  setDirty();
}
function autoSection(card) { return belongsInExtra(card) ? SECTION_EXTRA : SECTION_MAIN; }
function imageUrlFor(card, ydkId = null, small = false) {
  const info = preferredImage(card, ydkId);
  if (!info) return '';
  return small ? (info.imageUrlSmall || info.imageUrl) : (info.imageUrl || info.imageUrlSmall);
}
function limitBadge(status) {
  if (status === 'Forbidden') return {src:'assets/restriction_badges/forbidden.png', cls:'limit-forbidden', label:'Forbidden'};
  if (status === 'Limited') return {src:'assets/restriction_badges/limited.png', cls:'limit-limited', label:'Limited to 1'};
  if (status === 'Semi-Limited') return {src:'assets/restriction_badges/semi-limited.png', cls:'limit-semi', label:'Semi-Limited to 2'};
  return null;
}
function createLimitBadge(status) {
  const info = limitBadge(status);
  if (!info) return null;
  const node = new Image();
  node.className = `limit-badge ${info.cls}`;
  node.src = info.src;
  node.alt = info.label;
  node.title = info.label;
  node.draggable = false;
  node.setAttribute('aria-label', info.label);
  return node;
}
function createSearchMetadataChips(card, compact = false) {
  const row=el('div',`search-meta-chips${compact?' compact':''}`);
  const priorities=activeSearchVisualPriorities();
  const attributeChip=createMetadataAttributeChip(card);
  const typeChip=createMetadataTypeChip(card);
  const raceChip=createMetadataRaceChip(card);
  if(attributeChip) { attributeChip.classList.add('search-attribute-chip'); if(priorities.has('attribute')) attributeChip.classList.add('search-priority-chip'); row.append(attributeChip); }
  if(typeChip) { typeChip.classList.add('search-type-chip'); if(priorities.has('type')) typeChip.classList.add('search-priority-chip'); row.append(typeChip); }
  if(raceChip) { raceChip.classList.add('search-race-chip'); if(priorities.has('race')) raceChip.classList.add('search-priority-chip'); row.append(raceChip); }
  return row;
}
function activeSearchVisualPriorities() {
  const f=state.filters || {};
  const ctx=searchFilterContext(f);
  const active=new Set();
  if(String(f.query||'').trim()) active.add('query');
  if(ctx.monster && (ctx.type || f.ability || ctx.subtype)) active.add('type');
  if((ctx.spell || ctx.trap) && ctx.type) active.add('race');
  if(ctx.monster && f.attribute) active.add('attribute');
  if(ctx.monster && f.race) active.add('race');
  if(active.has('type') || active.has('attribute') || active.has('race')) active.add('identity');
  if(ctx.specific && f.archetype) active.add('archetype');
  if(f.restriction) active.add('restriction');
  if(ctx.monster && !ctx.link && ((f.levelMin!=='' && f.levelMin!=null) || (f.levelMax!=='' && f.levelMax!=null))) { active.add('stats'); active.add('level'); }
  if(ctx.pendulum && ((f.scaleMin!=='' && f.scaleMin!=null) || (f.scaleMax!=='' && f.scaleMax!=null))) { active.add('stats'); active.add('scale'); }
  const atkFilterActive=ctx.monster && ((f.atkMin!=='' && f.atkMin!=null) || (f.atkMax!=='' && f.atkMax!=null));
  const defFilterActive=ctx.monster && !ctx.link && ((f.defMin!=='' && f.defMin!=null) || (f.defMax!=='' && f.defMax!=null));
  if(atkFilterActive || defFilterActive) active.add('stats');
  if(atkFilterActive) active.add('atk');
  if(defFilterActive && !ctx.link) active.add('def');
  if(ctx.link && ((f.linkRatingMin!=='' && f.linkRatingMin!=null) || (f.linkRatingMax!=='' && f.linkRatingMax!=null))) { active.add('stats'); active.add('link-rating'); active.add('link'); }
  if(ctx.link && f.linkMarkers?.size) { active.add('link'); active.add('link-arrows'); }
  if(ctx.link && (linkMaterialCriteriaActive(f) || f.linkMaterials?.size)) { active.add('link'); active.add('link-material'); }
  if(f.effects?.size) active.add('effects');
  const mechanic=ctx.pendulum ? ctx.subtype : ctx.type;
  if(ctx.link) { active.add('stats'); active.add('link'); active.add('link-rating'); active.add('link-arrows'); }
  if(ctx.pendulum) { active.add('stats'); active.add('scale'); }
  if(ctx.xyz || mechanic==='Synchro' || mechanic==='Ritual' || mechanic==='Fusion') { active.add('stats'); active.add('level'); }
  if(f.sort==='type') { active.add('type'); active.add('race'); }
  else if(f.sort==='level') { active.add('stats'); active.add('level'); }
  else if(f.sort==='atk') { active.add('stats'); active.add('atk'); }
  else if(f.sort==='def') { active.add('stats'); active.add('def'); }
  else if(f.sort==='scale') { active.add('stats'); active.add('scale'); }
  return active;
}
function updateSearchResultPriorityClasses() {
  if(!dom.searchResults) return;
  dom.searchResults.classList.remove('priority-layout-v2','priority-layout-v3');
  dom.searchResults.classList.add('priority-layout-v4');
  const active=activeSearchVisualPriorities();
  const known=['query','identity','type','attribute','race','archetype','restriction','stats','level','scale','atk','def','link-rating','link','link-arrows','link-material','effects'];
  for(const key of known) dom.searchResults.classList.toggle(`priority-${key}`,active.has(key));
  dom.searchResults.classList.toggle('has-priority-filters',active.size>0);
  dom.searchResults.classList.toggle('has-details-link-indicator',Boolean(state.detailsPanelLinkIndicator));
}
const SEARCH_RESULT_SEMANTIC_ORDER = Object.freeze([
  'attribute','level','type','race','atk','def','link-rating','link-arrows','scale','link-material','archetype',
]);
function searchSemanticOrderForCard(card) {
  const order=[];
  const push=key=>{ if(!order.includes(key)) order.push(key); };
  for(const key of ['attribute','level','type','race','atk','def','link-rating','link-arrows','scale','link-material','archetype']) push(key);
  return order;
}
function semanticKeyAppliesToCard(key,card) {
  if(!card) return false;
  if(key==='type') return Boolean(displayCardType(card) || cardTypeBucket(card));
  if(key==='race') return Boolean(String(card.race || '').trim());
  if(key==='attribute') return Boolean(String(card.attribute || '').trim());
  if(key==='level') return Boolean(searchListLevelRankText(card));
  if(key==='scale') return cardScaleValue(card) != null;
  if(key==='atk') return cardTypeBucket(card)==='Monster';
  if(key==='def') return cardTypeBucket(card)==='Monster' && monsterHasDefense(card);
  if(key==='archetype') return Boolean(String(card.archetype || '').trim());
  if(key==='link-rating') return card?.linkval !== null && card?.linkval !== undefined && card?.linkval !== '' && Number.isFinite(Number(card.linkval));
  if(key==='link-arrows') return Boolean(Array.isArray(card.linkmarkers) && card.linkmarkers.length);
  if(key==='link-material') return Boolean(linkMaterialRequirement(card));
  return false;
}
function semanticKeysPresentInCards(cards) {
  const present=new Set();
  const remaining=new Set(SEARCH_RESULT_SEMANTIC_ORDER);
  for(const card of cards || []) {
    for(const key of [...remaining]) {
      if(semanticKeyAppliesToCard(key,card)) { present.add(key); remaining.delete(key); }
    }
    if(!remaining.size) break;
  }
  return present;
}
function searchApplicableSemanticKeys() {
  return state.searchResultApplicableKeys instanceof Set ? state.searchResultApplicableKeys : new Set();
}
function primarySearchSemanticKeys() {
  const f=state.filters || {};
  const ctx=searchFilterContext(f);
  const primary=new Set();
  const mechanic=ctx.pendulum ? ctx.subtype : ctx.type;
  if(ctx.link) { primary.add('link-rating'); primary.add('link-arrows'); }
  if(ctx.pendulum) primary.add('scale');
  if(ctx.xyz || mechanic==='Synchro' || mechanic==='Ritual' || mechanic==='Fusion') primary.add('level');
  if((ctx.spell || ctx.trap) && ctx.type) primary.add('race');
  if(ctx.monster && f.ability) primary.add('type');
  return primary;
}
function activeSearchSemanticKeys() {
  const f=state.filters || {};
  const ctx=searchFilterContext(f);
  const active=new Set();
  if(ctx.monster && (ctx.type || f.ability || ctx.subtype)) active.add('type');
  if((ctx.spell || ctx.trap) && ctx.type) active.add('race');
  if(ctx.monster && f.race) active.add('race');
  if(ctx.monster && f.attribute) active.add('attribute');
  if(f.sort==='type') { active.add('type'); active.add('race'); }
  if((ctx.monster && !ctx.link && ((f.levelMin!=='' && f.levelMin!=null) || (f.levelMax!=='' && f.levelMax!=null))) || f.sort==='level') active.add('level');
  if((ctx.pendulum && ((f.scaleMin!=='' && f.scaleMin!=null) || (f.scaleMax!=='' && f.scaleMax!=null))) || f.sort==='scale') active.add('scale');
  const atkActive=(ctx.monster && ((f.atkMin!=='' && f.atkMin!=null) || (f.atkMax!=='' && f.atkMax!=null))) || f.sort==='atk';
  const defActive=(ctx.monster && !ctx.link && ((f.defMin!=='' && f.defMin!=null) || (f.defMax!=='' && f.defMax!=null))) || f.sort==='def';
  if(atkActive) active.add('atk');
  if(defActive) active.add('def');
  if(ctx.specific && f.archetype) active.add('archetype');
  if(ctx.link && ((f.linkRatingMin!=='' && f.linkRatingMin!=null) || (f.linkRatingMax!=='' && f.linkRatingMax!=null))) active.add('link-rating');
  if(ctx.link && f.linkMarkers?.size) active.add('link-arrows');
  if(ctx.link && (linkMaterialCriteriaActive(f) || f.linkMaterials?.size)) active.add('link-material');
  for(const key of primarySearchSemanticKeys()) active.add(key);
  return active;
}
function activeSearchListPriorityColumns() {
  return activeSearchSemanticKeys();
}
function searchEffectSummary(card) {
  const selected=state.filters.effects || new Set();
  if(selected.size) {
    const tags=[...cardEffectTags(card)].filter(tag=>selected.has(tag));
    if(tags.length) return tags.slice(0,2).join(', ')+(tags.length>2?' +':'');
  }
  const text=String(card?.desc || '').replace(/\s+/g,' ').trim();
  if(!text) return '';
  return text.length>72 ? `${text.slice(0,69)}...` : text;
}
function searchSemanticValue(key,card,{labelStats=false}={}) {
  if(key==='level') return searchListLevelRankText(card);
  if(key==='scale') { const scale=cardScaleValue(card); return scale == null ? '' : `Scale ${scale}`; }
  if(key==='atk') {
    if(cardTypeBucket(card)!=='Monster') return '';
    const value=monsterAtkText(card,{unavailable:'?'});
    return labelStats ? `ATK ${value}` : value;
  }
  if(key==='def') {
    if(cardTypeBucket(card)!=='Monster' || !monsterHasDefense(card)) return '';
    const value=monsterDefText(card,{unavailable:'?'});
    return labelStats ? `DEF ${value}` : value;
  }
  if(key==='type') return displayCardType(card) || cardTypeBucket(card) || '';
  if(key==='race') return card?.race || '';
  if(key==='attribute') return card?.attribute || '';
  if(key==='archetype') return card?.archetype || '';
  if(key==='link-rating') return card?.linkval != null ? `LINK-${card.linkval}` : '';
  if(key==='link-material') return linkMaterialRequirement(card) || '';
  if(key==='effects') return searchEffectSummary(card);
  return '';
}
const SEARCH_LIST_COLUMN_DEFS = Object.freeze([
  {key:'art', label:'', min:22, dense:20, flex:0},
  {key:'card', label:'Card', min:92, dense:64, flex:4.4},
  {key:'attribute', label:'Attribute', shortLabel:'Attr.', min:26, dense:23, flex:.38},
  {key:'level', label:'Level / Rank', shortLabel:'Lvl/Rk', min:40, dense:38, flex:.42},
  {key:'type', label:'Type', min:36, dense:29, flex:.70},
  {key:'race', label:'Subtype', shortLabel:'Subtype', min:36, dense:29, flex:.68},
  {key:'atk', label:'ATK', min:32, dense:29, flex:.42},
  {key:'def', label:'DEF', min:32, dense:29, flex:.42},
  {key:'link', label:'Link', title:'Link Rating / Arrows', min:42, dense:42, flex:.42},
  {key:'scale', label:'Scale', min:32, dense:30, flex:.36},
  {key:'link-material', label:'Materials', shortLabel:'Mat.', min:52, dense:42, flex:.90},
  {key:'archetype', label:'Archetype', shortLabel:'Arch.', min:50, dense:40, flex:.80},
]);
const SEARCH_LIST_COLUMN_BY_KEY = new Map(SEARCH_LIST_COLUMN_DEFS.map(def=>[def.key,def]));
const SEARCH_LIST_GROUP_SEMANTICS = Object.freeze({
  attribute:Object.freeze(['attribute']),
  level:Object.freeze(['level']),
  type:Object.freeze(['type']),
  race:Object.freeze(['race']),
  atk:Object.freeze(['atk']),
  def:Object.freeze(['def']),
  link:Object.freeze(['link-rating','link-arrows']),
  scale:Object.freeze(['scale']),
  'link-material':Object.freeze(['link-material']),
  archetype:Object.freeze(['archetype']),
});
const SEARCH_LIST_BASE_GROUP_ORDER = Object.freeze([
  'attribute','level','type','race','atk','def','link','scale','link-material','archetype',
]);
function searchListGroupSemantics(key) {
  return SEARCH_LIST_GROUP_SEMANTICS[key] || Object.freeze([]);
}
function searchListGroupApplies(key) {
  if(key==='archetype') return activeSearchListPriorityColumns().has('archetype');
  if(key==='link-material') return activeSearchListPriorityColumns().has('link-material');
  const applicable=searchApplicableSemanticKeys();
  return searchListGroupSemantics(key).some(semantic=>applicable.has(semantic));
}
function searchListGroupIsPriority(key) {
  const active=activeSearchListPriorityColumns();
  return searchListGroupSemantics(key).some(semantic=>active.has(semantic));
}
function searchListMechanicPrimaryGroups(filters=state.filters) {
  const ctx=searchFilterContext(filters);
  const mechanic=ctx.pendulum ? ctx.subtype : ctx.type;
  const groups=new Set();
  if(ctx.link) groups.add('link');
  if(ctx.pendulum) groups.add('scale');
  if(ctx.xyz || ['Synchro','Ritual','Fusion'].includes(mechanic)) groups.add('level');
  return groups;
}
function searchListGroupIsPrimary(key) {
  if(searchListMechanicPrimaryGroups().has(key)) return true;
  const primary=primarySearchSemanticKeys();
  return searchListGroupSemantics(key).some(semantic=>primary.has(semantic));
}
function searchListMetadataRenderOrder() {
  const forcedPrimary=searchListMechanicPrimaryGroups();
  return SEARCH_LIST_BASE_GROUP_ORDER.filter(key=>
    searchListGroupApplies(key) || searchListGroupIsPriority(key) || forcedPrimary.has(key)
  );
}
function searchListColumnRenderOrder() {
  return ['art','card',...searchListMetadataRenderOrder()];
}
function manualSearchListColumnWidth(_key) {
  return null;
}
function searchListContentWidth(key,{tight=false}={}) {
  const def=SEARCH_LIST_COLUMN_BY_KEY.get(key);
  const floor=Number(tight ? (def?.dense ?? def?.min ?? 34) : (def?.min ?? 44)) || 34;
  if(key==='art') return Math.max(floor,tight?22:26);
  const cards=Array.isArray(state.searchResultCards) ? state.searchResultCards : [];
  const label=String(def?.shortLabel || def?.label || '');
  const ppc=tight?4.75:5.15;
  let best=approximateReadableTextWidth(label,{floor,ceiling:520,pixelsPerChar:ppc});
  const sample=cards.slice(0,750);
  for(const card of sample) {
    let textValue='';
    if(key==='card') textValue=String(card?.name || '');
    else if(key==='level') textValue=searchListLevelRankText(card);
    else if(key==='type') textValue=displayCardType(card) || cardTypeBucket(card) || '';
    else if(key==='race') textValue=String(card?.race || '');
    else if(key==='attribute') textValue=String(card?.attribute || '');
    else if(key==='atk') textValue=searchSemanticValue('atk',card);
    else if(key==='def') textValue=searchSemanticValue('def',card);
    else if(key==='link') textValue=Number.isFinite(Number(card?.linkval)) ? `Link-${Number(card.linkval)}` : '';
    else if(key==='scale') { const scale=cardScaleValue(card); textValue=scale==null?'':String(scale); }
    else if(key==='link-material') textValue=linkMaterialRequirement(card) || '';
    else if(key==='archetype') textValue=String(card?.archetype || '');
    if(!textValue) continue;
    const px=approximateReadableTextWidth(textValue,{
      floor,
      ceiling:key==='card'?520:key==='link-material'?300:240,
      pixelsPerChar:key==='card'?(tight?5.05:5.45):ppc,
    });
    best=Math.max(best,px);
  }
  if(key==='link') best=Math.max(best,40);
  if(key==='attribute') best=Math.max(best,36);
  if(key==='atk' || key==='def') best=Math.max(best,tight?42:48);
  return Math.ceil(best+4);
}
function searchListColumnCap(key,{tight=false,primary=false,priority=false}={}) {
  const caps={
    attribute:tight?40:44,
    level:tight?44:50,
    type:primary?(tight?92:108):priority?(tight?78:92):(tight?58:68),
    race:primary?(tight?88:104):priority?(tight?74:88):(tight?56:66),
    atk:tight?42:48,
    def:tight?42:48,
    link:44,
    scale:tight?32:36,
    'link-material':primary?(tight?118:150):priority?(tight?104:132):(tight?72:92),
    archetype:primary?(tight?110:140):priority?(tight?96:124):(tight?70:90),
  };
  return Number(caps[key] || (tight?54:64));
}
function searchListColumnFloor(key,{tight=false}={}) {
  const def=SEARCH_LIST_COLUMN_BY_KEY.get(key);
  if(!def) return tight?28:32;
  if(key==='art') return tight?22:26;
  if(key==='card') return tight?64:92;
  const base=Number(tight ? (def.dense ?? def.min) : def.min) || 28;
  if(key==='link') return Math.max(base,42);
  return base;
}
function searchListColumnPreferredWidth(key,{tight=false}={}) {
  const manual=manualSearchListColumnWidth(key);
  const primary=searchListGroupIsPrimary(key);
  const priority=searchListGroupIsPriority(key);
  const floor=searchListColumnFloor(key,{tight});
  if(key==='art') return floor;
  if(key==='card') return manual ?? Math.max(floor,Number(state.searchListPreferredNameWidth)||floor);
  const natural=searchListContentWidth(key,{tight});
  const cap=searchListColumnCap(key,{tight,primary,priority});
  const bounded=Math.max(floor,Math.min(natural,cap));
  return manual==null ? bounded : Math.max(floor,Math.min(manual,520));
}
function searchListProtectedWidth(key,{tight=false}={}) {
  if(!searchListGroupIsPriority(key) && !searchListGroupIsPrimary(key)) return null;
  return searchListColumnPreferredWidth(key,{tight});
}
function searchListColumnMinimum(key,{tight=false}={}) {
  return searchListColumnFloor(key,{tight});
}
function searchListFixedCost(keys,{tight=false,gap=2,widths=null}={}) {
  return keys.reduce((sum,key)=>{
    if(key==='card') return sum;
    const value=widths?.get?.(key);
    return sum+(Number.isFinite(value)?value:searchListColumnMinimum(key,{tight}));
  },0)+Math.max(0,keys.length-1)*gap;
}
function searchListRemainingCardWidth(width,keys,{tight=false,gap=2,widths=null}={}) {
  return Math.max(0,width-searchListFixedCost(keys,{tight,gap,widths}));
}
function buildSearchListColumnLayout(width,{tight=false}={}) {
  const available=Math.max(96,Math.floor(Number(width)||0));
  const forcedPrimary=searchListMechanicPrimaryGroups();
  const all=searchListMetadataRenderOrder();
  const priority=new Set(all.filter(key=>searchListGroupIsPriority(key)));
  const primary=new Set(all.filter(key=>searchListGroupIsPrimary(key)));
  for(const key of forcedPrimary) {
    if(!all.includes(key)) all.push(key);
    primary.add(key);
    priority.add(key);
  }
  const floors=Object.fromEntries(all.map(key=>[key,searchListColumnFloor(key,{tight})]));
  const preferred=Object.fromEntries(all.map(key=>[key,searchListColumnPreferredWidth(key,{tight})]));
  const result=allocateSearchListTracks({
    width:available,
    tight,
    groups:all,
    priority:[...priority],
    primary:[...primary],
    floors,
    preferred,
    artWidth:searchListColumnFloor('art',{tight}),
    preferredNameWidth:Number(state.searchListPreferredNameWidth)||0,
  });
  const widths=new Map([['art',result.artWidth],...Object.entries(result.widths)]);
  return {
    visible:['art','card',...result.visibleMeta],
    priority,
    primary,
    tight,
    gap:result.gap,
    width:available,
    widths,
    cardFloor:result.cardWidth,
    cardPreferred:result.cardPreferred,
  };
}
function chooseSearchListColumns(availableWidth) {
  const width=Math.max(100,Math.floor(Number(availableWidth)||0));
  return buildSearchListColumnLayout(width,{tight:width<600});
}
function searchListColumnTemplate(key,{tight=false,cardFloor=88,widths=null}={}) {
  if(key==='card') return `minmax(${Math.max(42,Math.round(cardFloor))}px,1fr)`;
  const explicit=widths?.get?.(key);
  if(Number.isFinite(explicit)) return `${Math.max(1,Math.round(explicit))}px`;
  return `${Math.max(1,Math.round(searchListColumnFloor(key,{tight})))}px`;
}
const SEARCH_SEMANTIC_APPROX_WIDTH = Object.freeze({
  type:78, race:70, attribute:52, level:48, scale:54, atk:64, def:64,
  archetype:96, 'link-rating':52, 'link-arrows':36, 'link-material':132,
});
function approximateReadableTextWidth(text,{floor=0,ceiling=420,pixelsPerChar=5.9}={}) {
  const normalized=String(text || '').trim();
  if(!normalized) return floor;
  return Math.max(floor,Math.min(ceiling,Math.ceil(normalized.length*pixelsPerChar+14)));
}
function preferredSearchListNameWidth(cards) {
  const widths=(cards || []).slice(0,500)
    .map(card=>approximateReadableTextWidth(card?.name,{floor:150,ceiling:420,pixelsPerChar:6.05}));
  if(!widths.length) return 190;
  const singleLineTarget=Math.ceil(Math.max(...widths)*0.48)+12;
  return Math.max(128,Math.min(210,singleLineTarget));
}
function preferredDeckListNameWidth() {
  let preferred=235;
  for(const card of currentDeckCards()) {
    preferred=Math.max(preferred,approximateReadableTextWidth(card?.name,{floor:235,ceiling:390,pixelsPerChar:6.05}));
    if(preferred>=390) break;
  }
  return preferred;
}
function detailsCardMinimumWidth(cards) {
  let hasLongIdentity=false;
  for(const card of (cards || []).slice(0,400)) {
    const type=String(displayCardType(card)||'');
    const race=String(card?.race||'');
    if(type.length>20 || race.length>18){ hasLongIdentity=true; break; }
  }
  return hasLongIdentity ? 224 : 208;
}
function activeSearchCriteriaCardMinimum(cards,{details=false}={}) {
  const primary=primarySearchSemanticKeys();
  const active=activeSearchSemanticKeys();
  if(details) {
    if(primary.has('link-rating') || primary.has('scale') || primary.has('level')) return 224;
    return active.size ? 216 : 208;
  }
  return active.size ? 158 : 150;
}
function applySearchResultIntrinsicSizing(cards) {
  if(!dom.searchResults) return;
  state.searchListPreferredNameWidth=preferredSearchListNameWidth(cards);
  const criteriaDetails=activeSearchCriteriaCardMinimum(cards,{details:true});
  const criteriaGrid=activeSearchCriteriaCardMinimum(cards,{details:false});
  dom.searchResults.style.setProperty('--details-card-min-width',`${Math.min(228,Math.max(detailsCardMinimumWidth(cards),criteriaDetails))}px`);
  dom.searchResults.style.setProperty('--grid-card-min-width',`${Math.min(170,Math.max(150,criteriaGrid))}px`);
}
function chooseSearchSemanticKeys(view,width) {
  const active=activeSearchSemanticKeys();
  const visible=[];
  const w=Math.max(80,Number(width)||0);
  let budget=w*(view==='grid'?1.75:2.15);
  for(const key of SEARCH_RESULT_SEMANTIC_ORDER) {
    if(!active.has(key)) continue;
    visible.push(key);
    budget-=SEARCH_SEMANTIC_APPROX_WIDTH[key] || 60;
  }
  for(const key of SEARCH_RESULT_SEMANTIC_ORDER) {
    if(active.has(key)) continue;
    const cost=SEARCH_SEMANTIC_APPROX_WIDTH[key] || 60;
    if(budget-cost<0) continue;
    visible.push(key);
    budget-=cost;
  }
  return {visible,priority:active};
}
let lastSearchSemanticLayoutSignature='';
let lastSearchListLayoutSignature='';
let searchLayoutResizeRaf=0;
function searchLayoutClassToken(key) { return String(key||'').replaceAll('-','_'); }
function updateSearchDetailsTrackLayout() {
  if(!dom.searchResults || state.searchView!=='details') return;
  const stage=$('#searchResultsStage');
  const stageWidth=Math.floor(stage?.getBoundingClientRect?.().width || stage?.clientWidth || 0);
  const resultsWidth=Math.floor(dom.searchResults.getBoundingClientRect?.().width || dom.searchResults.clientWidth || 0);
  const width=Math.max(stageWidth,resultsWidth);
  if(width<=0) return;
  let columns=1;
  if(width>=400) columns=2;
  if(width>=640) columns=3;
  if(width>=900) columns=4;
  dom.searchResults.style.setProperty('--search-details-column-count',String(columns));
  dom.searchResults.dataset.detailsColumns=String(columns);
}
function updateSearchSemanticFactVisibility() {
  if(!dom.searchResults || state.searchView==='list') return;
  if(state.searchView==='details') updateSearchDetailsTrackLayout();
  dom.searchResults.classList.add('semantic-auto-pack');
  const applicable=searchApplicableSemanticKeys();
  for(const key of SEARCH_RESULT_SEMANTIC_ORDER) dom.searchResults.classList.toggle(`show-semantic-${searchLayoutClassToken(key)}`,applicable.has(key));
}
let lastAdaptiveSearchSizingSignature='';
let lastObservedSearchStageWidth=-1;
function clampAdaptiveNumber(value,min,max) {
  const n=Number(value);
  return Math.max(min,Math.min(max,Number.isFinite(n)?n:min));
}
function interpolateAdaptive(min,max,t) {
  return min+(max-min)*clampAdaptiveNumber(t,0,1);
}
function adaptiveSearchReferenceWidth(view,paneWidth) {
  const width=Math.max(1,Number(paneWidth)||1);
  if(view==='list') return width;
  if(view==='details') {
    const columns=Math.max(1,Number(dom.searchResults?.dataset?.detailsColumns)||1);
    const gap=5;
    return Math.max(1,(width-gap*(columns-1))/columns);
  }
  const style=getComputedStyle(dom.searchResults);
  const minTrack=clampAdaptiveNumber(parseFloat(style.getPropertyValue('--grid-card-min-width'))||154,120,220);
  const gap=5;
  const columns=Math.max(1,Math.floor((width+gap)/(minTrack+gap)));
  return Math.max(1,(width-gap*(columns-1))/columns);
}
function updateAdaptiveSearchSizing({force=false}={}) {
  if(!dom.searchResults) return false;
  const stage=$('#searchResultsStage');
  const paneWidth=Math.floor(stage?.clientWidth || dom.searchResults.clientWidth || 0);
  if(paneWidth<=0) return false;
  const view=state.searchView || 'grid';
  const reference=adaptiveSearchReferenceWidth(view,paneWidth);
  const t=view==='list'
    ? clampAdaptiveNumber((reference-280)/(900-280),0,1)
    : clampAdaptiveNumber((reference-132)/(235-132),0,1);
  const signature=`${view}|${paneWidth}|${Math.round(reference)}|${Math.round(t*1000)}`;
  if(!force && signature===lastAdaptiveSearchSizingSignature) return false;
  lastAdaptiveSearchSizingSignature=signature;
  const px=(value)=>`${Math.round(value*100)/100}px`;
  const vars={
    '--search-adaptive-list-header-font':px(interpolateAdaptive(8.75,10.25,t)),
    '--search-adaptive-list-header-pad-x':px(interpolateAdaptive(2,4,t)),
    '--search-adaptive-list-name-font':px(interpolateAdaptive(10.75,13,t)),
    '--search-adaptive-list-letter-spacing':px(interpolateAdaptive(0,.12,t)),
    '--search-adaptive-list-meta-font':px(interpolateAdaptive(9,10.75,t)),
    '--search-adaptive-list-cell-pad-x':px(interpolateAdaptive(1,3,t)),
    '--search-adaptive-list-chip-font':px(interpolateAdaptive(8.75,10,t)),
    '--search-adaptive-list-chip-pad-y':px(interpolateAdaptive(1,2,t)),
    '--search-adaptive-list-chip-pad-x':px(interpolateAdaptive(2,4,t)),
    '--search-adaptive-list-chip-radius':px(interpolateAdaptive(3,5,t)),
    '--search-adaptive-list-row-height':px(interpolateAdaptive(52,64,t)),
    '--search-adaptive-list-row-gap':px(interpolateAdaptive(0,2,t)),
    '--search-adaptive-card-name-font':px(interpolateAdaptive(10.75,13.5,t)),
    '--search-adaptive-card-letter-spacing':px(interpolateAdaptive(0,.15,t)),
    '--search-adaptive-card-meta-font':px(interpolateAdaptive(9.1,11,t)),
    '--search-adaptive-card-chip-pad-y':px(interpolateAdaptive(1,2,t)),
    '--search-adaptive-card-chip-pad-x':px(interpolateAdaptive(3,5,t)),
    '--search-adaptive-card-chip-radius':px(interpolateAdaptive(4,6,t)),
    '--search-adaptive-card-copy-gap':px(interpolateAdaptive(1,3,t)),
    '--search-adaptive-card-copy-pad-y':px(interpolateAdaptive(3,5,t)),
    '--search-adaptive-card-copy-pad-x':px(interpolateAdaptive(3,6,t)),
    '--search-adaptive-card-line-gap':px(interpolateAdaptive(2,4,t)),
    '--search-adaptive-details-art-width':px(interpolateAdaptive(44,60,t)),
    '--search-adaptive-details-row-height':px(interpolateAdaptive(62,82,t)),
    '--search-adaptive-grid-radius':px(interpolateAdaptive(6,9,t)),
  };
  for(const [key,value] of Object.entries(vars)) dom.searchResults.style.setProperty(key,value);
  dom.searchResults.dataset.adaptiveSizing=`${view}:${Math.round(t*100)}`;
  return true;
}
function updateCompactSearchColumnLayout() {
  if(!dom.searchResults || state.searchView!=='list') return false;
  const stage=$('#searchResultsStage');
  const stageWidth=Math.floor(stage?.clientWidth || stage?.getBoundingClientRect?.().width || 0);
  const resultsWidth=Math.floor(dom.searchResults.clientWidth || dom.searchResults.getBoundingClientRect?.().width || 0);
  const viewportWidth=resultsWidth>0 ? resultsWidth : stageWidth;
  const style=getComputedStyle(dom.searchResults);
  const inlinePadding=(parseFloat(style.paddingLeft)||0)+(parseFloat(style.paddingRight)||0);
  const width=Math.max(0,Math.floor(viewportWidth-inlinePadding-2));
  if(width<=0) return false;
  dom.searchResults.classList.add('search-list-v5');
  dom.searchResults.dataset.listViewportWidth=String(width);
  const layout=chooseSearchListColumns(width);
  const widthSig=layout.visible.map(key=>`${key}:${key==='card'?layout.cardFloor:(layout.widths.get(key)??'')}`).join(';');
  const signature=`v5|${width}|${layout.tight?'1':'0'}|${layout.visible.join(',')}|${[...layout.priority].sort().join(',')}|${[...layout.primary].sort().join(',')}|${widthSig}`;
  const visibleSet=new Set(layout.visible);
  lastSearchListLayoutSignature=signature;
  dom.searchResults.style.setProperty('--search-list-v5-template',layout.visible.map(key=>searchListColumnTemplate(key,layout)).join(' '));
  dom.searchResults.style.setProperty('--search-list-v5-gap',`${layout.gap}px`);
  dom.searchResults.dataset.listColumns=layout.visible.join(',');
  dom.searchResults.classList.toggle('search-list-v5-tight',layout.tight);
  dom.searchResults.classList.toggle('compact-list-tight',layout.tight);
  for(const def of SEARCH_LIST_COLUMN_DEFS) {
    const token=searchLayoutClassToken(def.key);
    dom.searchResults.classList.toggle(`show-v5-${token}`,visibleSet.has(def.key));
  }
  return true;
}
let searchListLayoutRefreshRaf=0;
function scheduleSearchListLayoutRefresh() {
  if(state.searchView!=='list' || !dom.searchResults) return;
  if(searchListLayoutRefreshRaf) cancelAnimationFrame(searchListLayoutRefreshRaf);
  let attempts=0;
  const refresh=()=>{
    searchListLayoutRefreshRaf=0;
    const applied=updateCompactSearchColumnLayout();
    attempts+=1;
    if(attempts<4 && (!applied || attempts<3)) searchListLayoutRefreshRaf=requestAnimationFrame(refresh);
  };
  searchListLayoutRefreshRaf=requestAnimationFrame(refresh);
}
let searchListColumnResizeObserver=null;
function setupSearchListColumnResizeObserver() {
  if(searchListColumnResizeObserver || !('ResizeObserver' in window)) return;
  const target=$('#searchResultsStage') || dom.searchResults;
  if(!target) return;
  searchListColumnResizeObserver=new ResizeObserver(()=>{
    const width=Math.floor(target.clientWidth || target.getBoundingClientRect?.().width || 0);
    if(width>0 && width===lastObservedSearchStageWidth) return;
    lastObservedSearchStageWidth=width;
    if(searchLayoutResizeRaf) cancelAnimationFrame(searchLayoutResizeRaf);
    searchLayoutResizeRaf=requestAnimationFrame(()=>{
      searchLayoutResizeRaf=0;
      if(state.searchView==='list') scheduleSearchListLayoutRefresh();
      else updateSearchSemanticFactVisibility();
      updateAdaptiveSearchSizing();
    });
  });
  searchListColumnResizeObserver.observe(target);
}
function banStatusClass(status) {
  if(status==='Forbidden') return 'ban-status-forbidden';
  if(status==='Limited' || status==='Semi-Limited') return 'ban-status-limited';
  if(status==='Unlimited') return 'ban-status-unlimited';
  return '';
}
function createSearchBanStatus(status, compact = false) {
  return null;
}
function monsterLevelText(card) {
  if(card?.linkval != null) return `LINK-${card.linkval}`;
  if(card?.level != null && Number.isFinite(Number(card.level)) && Number(card.level) >= 0) return `★${card.level}`;
  return '';
}
function displayMonsterStat(value,{unavailable='-'}={}) {
  if(value == null || value === '') return unavailable;
  const numeric=Number(value);
  if(!Number.isFinite(numeric) || numeric < 0) return '?';
  return String(value);
}
function monsterAtkText(card,{unavailable='?'}={}) {
  return displayMonsterStat(card?.atk,{unavailable});
}
function monsterHasDefense(card) {
  return Boolean(card) && cardVisualType(card).key !== 'link' && card?.linkval == null;
}
function monsterDefText(card,{unavailable='?'}={}) {
  if(!monsterHasDefense(card)) return '';
  return displayMonsterStat(card?.def,{unavailable});
}
const LINK_MARKER_LAYOUT = Object.freeze([
  ['top-left','Top-Left',-45],
  ['top','Top',0],
  ['top-right','Top-Right',45],
  ['left','Left',-90],
  ['center','Center',0],
  ['right','Right',90],
  ['bottom-left','Bottom-Left',-135],
  ['bottom','Bottom',180],
  ['bottom-right','Bottom-Right',135],
]);
const LINK_ARROW_SELECTED_ASSET = 'assets/link_arrow_compact.png';
const LINK_ARROW_SEARCH_ASSET = 'assets/link_arrow_micro.png';
const LINK_ARROW_CARD_OVERLAY_ASSET = 'assets/link_arrow_compact.png';
const LINK_ARROW_GROUP_BASE_ASSET = 'assets/link_arrows_group_white.png';
const LINK_ARROW_ACTIVE_UP_ASSET = 'assets/link_arrow_up_red.png';
const LINK_ARROW_ACTIVE_CORNER_ASSET = 'assets/link_arrow_corner_red.png';
const LINK_ARROW_INACTIVE_UP_ASSET = 'assets/link_arrow_up_white.png';
const LINK_ARROW_INACTIVE_CORNER_ASSET = 'assets/link_arrow_corner_white.png';
function normalizeLinkMarker(marker) {
  const key=String(marker||'').trim().toLocaleLowerCase().replace(/[\s_]+/g,'-').replace(/-{2,}/g,'-');
  const aliases={
    'topleft':'top-left','top-left':'top-left','top':'top','topright':'top-right','top-right':'top-right',
    'left':'left','right':'right',
    'bottomleft':'bottom-left','bottom-left':'bottom-left','bottom':'bottom','bottomright':'bottom-right','bottom-right':'bottom-right',
  };
  return aliases[key] || aliases[key.replace(/-/g,'')] || '';
}
function linkMaterialRequirement(card) {
  if(card?.linkval == null || cardVisualType(card).key !== 'link') return '';
  const line=String(card?.desc || '').split(/\r?\n/).map(value=>value.trim()).find(Boolean) || '';
  return line.replace(/\s+/g,' ').trim();
}
const LINK_MATERIAL_QUALIFIER_OPTIONS = Object.freeze([
  ['effect','Effect'], ['normal','Normal'], ['token','Token'], ['non-token','Non-Token'],
  ['tuner','Tuner'], ['non-tuner','Non-Tuner'], ['fusion','Fusion'], ['synchro','Synchro'],
  ['xyz','Xyz'], ['link','Link'], ['pendulum','Pendulum'],
]);
const LINK_MATERIAL_ATTRIBUTES = Object.freeze(['DARK','DIVINE','EARTH','FIRE','LIGHT','WATER','WIND']);
let linkMaterialRaceCacheCards=null;
let linkMaterialRaceCache=[];
function linkMaterialKnownRaces() {
  if(linkMaterialRaceCacheCards===state.cards) return linkMaterialRaceCache;
  linkMaterialRaceCacheCards=state.cards;
  linkMaterialRaceCache=[...new Set((state.cards || []).map(card=>String(card?.race || '').trim()).filter(Boolean))].sort((a,b)=>b.length-a.length);
  return linkMaterialRaceCache;
}
function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
}
function linkMaterialRequirementInfo(card) {
  const requirement=linkMaterialRequirement(card);
  if(!requirement) return null;
  const text=requirement.toLocaleLowerCase();
  const countMatch=requirement.match(/^(\d+)\s*(\+)?(?:\s|$)/);
  const minCount=countMatch?Number(countMatch[1]):null;
  const hasPlus=Boolean(countMatch?.[2]);
  const rating=Number(card?.linkval);
  const maxCount=Number.isFinite(minCount) ? (hasPlus && Number.isFinite(rating) ? Math.max(minCount,rating) : minCount) : null;
  const qualifiers=new Set();
  if(/\beffect monsters?\b/.test(text)) qualifiers.add('effect');
  if(/\bnormal monsters?\b/.test(text)) qualifiers.add('normal');
  if(/\bnon[- ]?tokens?\b|\bexcept tokens?\b|\bother than tokens?\b/.test(text)) qualifiers.add('non-token');
  else if(/\btokens?\b/.test(text)) qualifiers.add('token');
  if(/\bnon[- ]?tuners?\b/.test(text)) qualifiers.add('non-tuner');
  else if(/\btuners?\b/.test(text)) qualifiers.add('tuner');
  for(const key of ['fusion','synchro','xyz','link','pendulum']) if(new RegExp(`\\b${key} monsters?\\b`,'i').test(requirement)) qualifiers.add(key);
  const attributes=LINK_MATERIAL_ATTRIBUTES.filter(value=>new RegExp(`\\b${value}\\b`,'i').test(requirement));
  const races=[];
  for(const race of linkMaterialKnownRaces()) if(new RegExp(`\\b${escapeRegex(race)}\\b`,'i').test(requirement)) races.push(race);
  const patterns=new Set();
  if(/\bsame (?:monster )?type\b/.test(text)) patterns.add('same-type');
  if(/\bsame attribute\b/.test(text)) patterns.add('same-attribute');
  if(/\bdifferent names?\b|\bwith different names?\b/.test(text)) patterns.add('different-names');
  if(races.length) patterns.add('specific-type');
  if(attributes.length) patterns.add('specific-attribute');
  if(/\bincluding\b|\bexcept\b|\bother than\b|\bmust\b|\bcannot\b|\bwith different\b|\bsame\b|\bfrom (?:your|the)\b/.test(text)) patterns.add('special');
  return {requirement,minCount,maxCount,hasPlus,qualifiers,attributes,races,patterns};
}
function linkMaterialCountMatches(value,selected) {
  if(selected==='' || selected==null) return true;
  if(String(selected)==='4+') return value===Number.POSITIVE_INFINITY || (Number.isFinite(value) && value>=4);
  if(!Number.isFinite(value)) return false;
  return value===Number(selected);
}
function linkMaterialCriteriaActive(filters=state.filters) {
  return Boolean(
    (filters.linkMaterialMin!=='' && filters.linkMaterialMin!=null) ||
    (filters.linkMaterialMax!=='' && filters.linkMaterialMax!=null) ||
    filters.linkMaterialQualifiers?.size || filters.linkMaterialRace || filters.linkMaterialAttribute ||
    filters.linkMaterialPattern || filters.linkMaterials?.size
  );
}
function cardMatchesLinkMaterialCriteria(card,filters=state.filters) {
  if(!linkMaterialCriteriaActive(filters)) return true;
  const info=linkMaterialRequirementInfo(card);
  if(!info) return false;
  if(!linkMaterialCountMatches(info.minCount,filters.linkMaterialMin)) return false;
  if(!linkMaterialCountMatches(info.maxCount,filters.linkMaterialMax)) return false;
  if(filters.linkMaterialQualifiers?.size) {
    const tests=[...filters.linkMaterialQualifiers].map(value=>info.qualifiers.has(value));
    if(filters.linkMaterialQualifierMode==='All' ? tests.some(value=>!value) : !tests.some(Boolean)) return false;
  }
  if(filters.linkMaterialRace && !info.races.includes(filters.linkMaterialRace)) return false;
  if(filters.linkMaterialAttribute && !info.attributes.includes(filters.linkMaterialAttribute)) return false;
  if(filters.linkMaterialPattern && !info.patterns.has(filters.linkMaterialPattern)) return false;
  if(filters.linkMaterials?.size && !filters.linkMaterials.has(info.requirement)) return false;
  return true;
}
function linkMaterialGroupLabel(requirement) {
  const match=String(requirement || '').match(/^(\d+)\s*(\+)?(?:\s|$)/);
  if(!match) return 'Other';
  return `${match[1]}${match[2] ? '+' : ''} material${match[1] === '1' && !match[2] ? '' : 's'}`;
}
function availableLinkMaterialRequirements() {
  const values=new Set();
  for(const card of state.cards) {
    const value=linkMaterialRequirement(card);
    if(value) values.add(value);
  }
  return [...values].sort((a,b)=>{
    const am=a.match(/^(\d+)\s*(\+)?/);
    const bm=b.match(/^(\d+)\s*(\+)?/);
    const an=am?Number(am[1]):99, bn=bm?Number(bm[1]):99;
    if(an!==bn) return an-bn;
    const ap=am?.[2]?1:0, bp=bm?.[2]?1:0;
    if(ap!==bp) return ap-bp;
    return a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'});
  });
}
function availableLinkMaterialRaces() {
  const races=new Set();
  for(const card of state.cards || []) {
    const info=linkMaterialRequirementInfo(card);
    for(const race of info?.races || []) races.add(race);
  }
  return [...races].sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base'}));
}
function linkMaterialPatternLabel(value) {
  return ({
    'same-type':'Same Type', 'same-attribute':'Same Attribute', 'different-names':'Different names',
    'specific-type':'Specific Monster Type', 'specific-attribute':'Specific Attribute', 'special':'Additional / special requirement',
  })[value] || '';
}
const XYZ_MATERIAL_QUALIFIER_OPTIONS = LINK_MATERIAL_QUALIFIER_OPTIONS;
function isXyzMonsterCard(card) {
  if(cardTypeBucket(card)!=='Monster') return false;
  const text=`${card?.type || ''} ${card?.frameType || ''} ${displayCardType(card) || ''}`.toLocaleLowerCase();
  return text.includes('xyz');
}
function xyzMaterialRequirement(card) {
  if(!isXyzMonsterCard(card)) return '';
  const lines=String(card?.desc || '').split(/\r?\n/).map(value=>value.replace(/\s+/g,' ').trim()).filter(Boolean);
  const materialLine=lines.find(line=>/^\d+\s*\+?\s+.*\bmonsters?\b/i.test(line));
  return materialLine || '';
}
function xyzMaterialRequirementInfo(card) {
  const requirement=xyzMaterialRequirement(card);
  if(!requirement) return null;
  const text=requirement.toLocaleLowerCase();
  const countMatch=requirement.match(/^(\d+)\s*(\+)?(?:\s|$)/);
  const minCount=countMatch?Number(countMatch[1]):null;
  const hasPlus=Boolean(countMatch?.[2]);
  const maxCount=Number.isFinite(minCount) ? (hasPlus ? Number.POSITIVE_INFINITY : minCount) : null;
  const levels=[...requirement.matchAll(/\bLevel\s+(\d+)\b/gi)].map(match=>Number(match[1])).filter(Number.isFinite);
  const levelMin=levels.length?Math.min(...levels):null;
  const levelMax=levels.length?Math.max(...levels):null;
  const qualifiers=new Set();
  if(/\beffect monsters?\b/.test(text)) qualifiers.add('effect');
  if(/\bnormal monsters?\b/.test(text)) qualifiers.add('normal');
  if(/\bnon[- ]?tokens?\b|\bexcept tokens?\b|\bother than tokens?\b/.test(text)) qualifiers.add('non-token');
  else if(/\btokens?\b/.test(text)) qualifiers.add('token');
  if(/\bnon[- ]?tuners?\b/.test(text)) qualifiers.add('non-tuner');
  else if(/\btuners?\b/.test(text)) qualifiers.add('tuner');
  for(const key of ['fusion','synchro','xyz','link','pendulum']) if(new RegExp(`\\b${key} monsters?\\b`,'i').test(requirement)) qualifiers.add(key);
  const attributes=LINK_MATERIAL_ATTRIBUTES.filter(value=>new RegExp(`\\b${value}\\b`,'i').test(requirement));
  const races=[];
  for(const race of linkMaterialKnownRaces()) if(new RegExp(`\\b${escapeRegex(race)}\\b`,'i').test(requirement)) races.push(race);
  const patterns=new Set();
  if(/\bsame level\b/.test(text)) patterns.add('same-level');
  if(/\bsame rank\b/.test(text)) patterns.add('same-rank');
  if(/\bsame (?:monster )?type\b/.test(text)) patterns.add('same-type');
  if(/\bsame attribute\b/.test(text)) patterns.add('same-attribute');
  if(/\bdifferent names?\b|\bwith different names?\b/.test(text)) patterns.add('different-names');
  if(races.length) patterns.add('specific-type');
  if(attributes.length) patterns.add('specific-attribute');
  if(/\bincluding\b|\bexcept\b|\bother than\b|\bmust\b|\bcannot\b|\bwith different\b|\bsame\b|\bfrom (?:your|the)\b/.test(text)) patterns.add('special');
  return {requirement,minCount,maxCount,hasPlus,levels,levelMin,levelMax,qualifiers,attributes,races,patterns};
}
function xyzMaterialCriteriaActive(filters=state.filters) {
  return Boolean(
    (filters.xyzMaterialMin!=='' && filters.xyzMaterialMin!=null) ||
    (filters.xyzMaterialMax!=='' && filters.xyzMaterialMax!=null) ||
    (filters.xyzMaterialLevelMin!=='' && filters.xyzMaterialLevelMin!=null) ||
    (filters.xyzMaterialLevelMax!=='' && filters.xyzMaterialLevelMax!=null) ||
    filters.xyzMaterialQualifiers?.size || filters.xyzMaterialRace || filters.xyzMaterialAttribute ||
    filters.xyzMaterialPattern || filters.xyzMaterials?.size
  );
}
function cardMatchesXyzMaterialCriteria(card,filters=state.filters) {
  if(!xyzMaterialCriteriaActive(filters)) return true;
  const info=xyzMaterialRequirementInfo(card);
  if(!info) return false;
  if(!linkMaterialCountMatches(info.minCount,filters.xyzMaterialMin)) return false;
  if(!linkMaterialCountMatches(info.maxCount,filters.xyzMaterialMax)) return false;
  const levelMin=filters.xyzMaterialLevelMin==='' || filters.xyzMaterialLevelMin==null ? null : Number(filters.xyzMaterialLevelMin);
  const levelMax=filters.xyzMaterialLevelMax==='' || filters.xyzMaterialLevelMax==null ? null : Number(filters.xyzMaterialLevelMax);
  if(levelMin!=null && (!Number.isFinite(levelMin) || info.levelMin==null || info.levelMin<levelMin)) return false;
  if(levelMax!=null && (!Number.isFinite(levelMax) || info.levelMax==null || info.levelMax>levelMax)) return false;
  if(filters.xyzMaterialQualifiers?.size) {
    const tests=[...filters.xyzMaterialQualifiers].map(value=>info.qualifiers.has(value));
    if(filters.xyzMaterialQualifierMode==='All' ? tests.some(value=>!value) : !tests.some(Boolean)) return false;
  }
  if(filters.xyzMaterialRace && !info.races.includes(filters.xyzMaterialRace)) return false;
  if(filters.xyzMaterialAttribute && !info.attributes.includes(filters.xyzMaterialAttribute)) return false;
  if(filters.xyzMaterialPattern && !info.patterns.has(filters.xyzMaterialPattern)) return false;
  if(filters.xyzMaterials?.size && !filters.xyzMaterials.has(info.requirement)) return false;
  return true;
}
function xyzMaterialPatternLabel(value) {
  return ({
    'same-level':'Same Level', 'same-rank':'Same Rank', 'same-type':'Same Type', 'same-attribute':'Same Attribute',
    'different-names':'Different names', 'specific-type':'Specific Monster Type', 'specific-attribute':'Specific Attribute',
    'special':'Additional / special requirement',
  })[value] || '';
}
function xyzMaterialGroupLabel(requirement) {
  const match=String(requirement || '').match(/^(\d+)\s*(\+)?(?:\s|$)/);
  if(!match) return 'Other';
  return `${match[1]}${match[2] ? '+' : ''} material${match[1] === '1' && !match[2] ? '' : 's'}`;
}
function availableXyzMaterialRequirements() {
  const values=new Set();
  for(const card of state.cards || []) {
    const value=xyzMaterialRequirement(card);
    if(value) values.add(value);
  }
  return [...values].sort((a,b)=>{
    const am=a.match(/^(\d+)\s*(\+)?/), bm=b.match(/^(\d+)\s*(\+)?/);
    const an=am?Number(am[1]):99, bn=bm?Number(bm[1]):99;
    if(an!==bn) return an-bn;
    const ap=am?.[2]?1:0, bp=bm?.[2]?1:0;
    if(ap!==bp) return ap-bp;
    return a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'});
  });
}
function availableXyzMaterialRaces() {
  const races=new Set();
  for(const card of state.cards || []) {
    const info=xyzMaterialRequirementInfo(card);
    for(const race of info?.races || []) races.add(race);
  }
  return [...races].sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base'}));
}
function linkArrowText(card) {
  if(card?.linkval == null || !Array.isArray(card?.linkmarkers) || !card.linkmarkers.length) return '';
  const active=new Set(card.linkmarkers.map(normalizeLinkMarker).filter(Boolean));
  return LINK_MARKER_LAYOUT.filter(([key])=>key!=='center' && active.has(key)).map(([,label])=>label).join(', ');
}
const LINK_ARROW_COMPOSITE_ROTATIONS = Object.freeze({
  'top-left':-90,
  'top':0,
  'top-right':0,
  'left':-90,
  'right':90,
  'bottom-left':180,
  'bottom':180,
  'bottom-right':90,
});
function createLinkMarkerGrid(card,{compact=false,centerText=''}={}) {
  const text=linkArrowText(card);
  if(!text) return null;
  const active=new Set(card.linkmarkers.map(normalizeLinkMarker).filter(Boolean));
  const diagram=el('div',compact?'search-link-markers':'link-arrow-diagram');
  diagram.classList.add('link-arrow-composite-diagram');
  diagram.setAttribute('role','img');
  diagram.setAttribute('aria-label',`Link arrows: ${text}`);
  diagram.title=`Link arrows: ${text}`;
  const base=new Image();
  base.className='link-arrow-group-base';
  base.src=LINK_ARROW_GROUP_BASE_ASSET;
  base.alt='';
  base.draggable=false;
  base.setAttribute('aria-hidden','true');
  diagram.append(base);
  for(const [key,label] of LINK_MARKER_LAYOUT) {
    if(key==='center' || !active.has(key)) continue;
    const isCorner=/left|right/.test(key) && key.includes('-');
    const image=new Image();
    image.className=`link-arrow-active ${isCorner?'link-arrow-active-corner':'link-arrow-active-up'} link-arrow-active-${key}`;
    image.src=isCorner ? LINK_ARROW_ACTIVE_CORNER_ASSET : LINK_ARROW_ACTIVE_UP_ASSET;
    image.alt='';
    image.draggable=false;
    image.setAttribute('aria-hidden','true');
    image.title=label;
    image.style.setProperty('--link-arrow-angle',`${LINK_ARROW_COMPOSITE_ROTATIONS[key] || 0}deg`);
    diagram.append(image);
  }
  const normalizedCenter=String(centerText ?? '').trim();
  if(normalizedCenter) {
    const center=el('span','link-arrow-rating-center',normalizedCenter);
    center.setAttribute('aria-hidden','true');
    diagram.append(center);
  }
  return diagram;
}
function createLinkArrowDiagram(card) { return createLinkMarkerGrid(card); }
function createCompactLinkArrowDiagram(card) { return createLinkMarkerGrid(card,{compact:true}); }
const LINK_CARD_OVERLAY_KEYS = Object.freeze(['top-left','top','top-right','left','right','bottom-left','bottom','bottom-right']);
const LINK_CARD_OVERLAY_CACHE = new Map();
const LINK_CARD_OVERLAY_TARGETS = Object.freeze({
  'top-left':[0.124,0.180],
  'top':[0.500,0.173],
  'top-right':[0.878,0.180],
  'left':[0.089,0.444],
  'right':[0.913,0.444],
  'bottom-left':[0.122,0.707],
  'bottom':[0.500,0.722],
  'bottom-right':[0.878,0.707],
});
const LINK_CARD_ASPECT_WIDTH_OVER_HEIGHT = 421/614;
function linkCardOverlayMask(card) {
  const active=new Set((card?.linkmarkers || []).map(normalizeLinkMarker).filter(Boolean));
  return LINK_CARD_OVERLAY_KEYS.reduce((mask,key,index)=>active.has(key) ? (mask | (1<<index)) : mask,0);
}
function linkCardOverlayBackground(mask) {
  if(LINK_CARD_OVERLAY_CACHE.has(mask)) return LINK_CARD_OVERLAY_CACHE.get(mask);
  const layers=LINK_CARD_OVERLAY_KEYS.map((key,index)=>{
    const color=(mask & (1<<index)) ? 'red' : 'white';
    return `url("assets/link_overlay_${color}_${key}.png")`;
  });
  const value=layers.join(',');
  LINK_CARD_OVERLAY_CACHE.set(mask,value);
  return value;
}
function overlayBackgroundPosition(target,sizeFraction) {
  const [tx,ty]=target;
  const sx=Math.max(0.001,Math.min(0.95,sizeFraction));
  const sy=sx*LINK_CARD_ASPECT_WIDTH_OVER_HEIGHT;
  const px=((tx-(sx/2))/(1-sx))*100;
  const py=((ty-(sy/2))/(1-sy))*100;
  return `${px.toFixed(4)}% ${py.toFixed(4)}%`;
}
const LINK_DETAILS_OVERLAY_Y_OFFSET = 0.010;
function applyCardOverlayGeometry(view,edgePercent,cornerPercent) {
  if(!dom.searchResults) return;
  const prefix=`--link-overlay-${view}`;
  dom.searchResults.style.setProperty(`${prefix}-edge-size`,`${edgePercent}%`);
  dom.searchResults.style.setProperty(`${prefix}-corner-size`,`${cornerPercent}%`);
  for(const key of LINK_CARD_OVERLAY_KEYS) {
    const size=(key.includes('-') ? cornerPercent : edgePercent)/100;
    const [x,y]=LINK_CARD_OVERLAY_TARGETS[key];
    const target=view==='details' ? [x,Math.min(0.98,y+LINK_DETAILS_OVERLAY_Y_OFFSET)] : [x,y];
    dom.searchResults.style.setProperty(`${prefix}-pos-${key}`,overlayBackgroundPosition(target,size));
  }
}
function createCardLinkArrowOverlay(card,{compact=false,view=state.searchView}={}) {
  if(!['grid','details'].includes(view) || !state.linkArrowOverlays?.[view]) return null;
  const text=linkArrowText(card);
  if(!text) return null;
  const mask=linkCardOverlayMask(card);
  const overlay=el('div',`card-link-arrow-overlay card-link-arrow-composite-bg${compact?' compact':''}`);
  overlay.setAttribute('role','img');
  overlay.setAttribute('aria-label',`Link arrows: ${text}`);
  overlay.title=`Link arrows: ${text}`;
  overlay.dataset.linkArrowMask=String(mask);
  overlay.style.backgroundImage=linkCardOverlayBackground(mask);
  return overlay;
}
function compactMonsterStats(card) {
  const parts=[];
  const monsterLike=card && !/spell|trap/i.test(String(card.type||''));
  if(card?.linkval != null && cardVisualType(card).key==='link') {
    if(monsterLike) parts.push(`ATK/ ${monsterAtkText(card,{unavailable:'?'})}`);
    parts.push(`LINK-${card.linkval}`);
    return parts.join(' · ');
  }
  const level=monsterLevelText(card); if(level) parts.push(level);
  if(monsterLike) parts.push(`ATK/ ${monsterAtkText(card,{unavailable:'?'})}`);
  if(monsterLike && monsterHasDefense(card)) parts.push(`DEF/ ${monsterDefText(card,{unavailable:'?'})}`);
  return parts.join(' · ');
}
function searchSupportingMeta(card) {
  const lines=[];
  const identity=[];
  if(card?.archetype) identity.push(`Archetype: ${card.archetype}`);
  if(identity.length) lines.push(identity.join(' · '));
  const stats=[];
  const monsterLike=card && !/spell|trap/i.test(String(card.type||''));
  if(card?.linkval != null && cardVisualType(card).key==='link') {
    if(monsterLike) stats.push(`ATK/ ${monsterAtkText(card,{unavailable:'?'})}`);
    stats.push(`LINK-${card.linkval}`);
  } else {
    const level=monsterLevelText(card); if(level) stats.push(level);
    if(monsterLike) stats.push(`ATK/ ${monsterAtkText(card,{unavailable:'?'})}`);
    if(monsterLike && monsterHasDefense(card)) stats.push(`DEF/ ${monsterDefText(card,{unavailable:'?'})}`);
  }
  { const scale=cardScaleValue(card); if(scale != null) stats.push(`Scale ${scale}`); }
  if(stats.length) lines.push(stats.join(' · '));
  return lines.join('\n');
}
function appendSearchStatParts(container,card,{compact=false}={}) {
  const monsterLike=card && !/spell|trap/i.test(String(card?.type||''));
  const add=(cls,text)=>{ if(!text) return; const span=el('span',`search-stat-part ${cls}`,text); container.append(span); };
  if(card?.linkval != null && cardVisualType(card).key==='link') {
    if(monsterLike) add('search-stat-atk',`ATK/ ${monsterAtkText(card,{unavailable:'?'})}`);
    add('search-stat-link-rating',`LINK-${card.linkval}`);
  } else {
    const level=monsterLevelText(card); if(level) add('search-stat-level',level);
    if(monsterLike) add('search-stat-atk',`ATK/ ${monsterAtkText(card,{unavailable:'?'})}`);
    if(monsterLike && monsterHasDefense(card)) add('search-stat-def',`DEF/ ${monsterDefText(card,{unavailable:'?'})}`);
  }
  if(!compact) { const scale=cardScaleValue(card); if(scale != null) add('search-stat-scale',`Scale ${scale}`); }
}
function appendActiveSearchStatParts(container,card,priorities=activeSearchVisualPriorities()) {
  const add=(cls,text)=>{ if(text) container.append(el('span',`search-stat-part ${cls}`,text)); };
  if(priorities.has('level')) add('search-stat-level',monsterLevelText(card));
  if(priorities.has('scale')) { const scale=cardScaleValue(card); if(scale != null) add('search-stat-scale',`Scale ${scale}`); }
  if(priorities.has('atk') && cardTypeBucket(card)==='Monster') add('search-stat-atk',`ATK/ ${monsterAtkText(card,{unavailable:'?'})}`);
  if(priorities.has('def') && cardTypeBucket(card)==='Monster' && monsterHasDefense(card)) add('search-stat-def',`DEF/ ${monsterDefText(card,{unavailable:'?'})}`);
  if(priorities.has('link-rating') && card?.linkval != null) add('search-stat-link-rating',`LINK-${card.linkval}`);
}
function createSearchSupportingMetaNode(card) {
  const meta=el('div','search-meta');
  const identity=el('div','search-meta-line search-meta-secondary');
  if(card?.archetype) identity.append(el('span','search-meta-archetype',`Archetype: ${card.archetype}`));
  if(identity.childNodes.length) meta.append(identity);
  const stats=el('div','search-meta-line search-meta-stats');
  appendSearchStatParts(stats,card);
  if(stats.childNodes.length) meta.append(stats);
  return meta;
}
function createSearchPriorityFacts(card,{compact=false}={}) {
  const priorities=activeSearchVisualPriorities();
  if(!priorities.size) return null;
  const row=el('div',`search-priority-facts${compact?' compact-search-priority-facts':''}`);
  const add=(key,text)=>{ if(text) row.append(el('span',`search-priority-fact priority-${key}`,text)); };
  if(priorities.has('type')) add('type',displayCardType(card) || cardTypeBucket(card));
  if(priorities.has('attribute')) add('attribute',card?.attribute);
  if(priorities.has('race')) add('race',card?.race);
  if(priorities.has('archetype')) add('archetype',card?.archetype);
  if(priorities.has('restriction')) add('restriction',cardLimitStatus(card,state.filters.banlist));
  if(priorities.has('stats')) {
    const stats=el('span','search-priority-fact priority-stats');
    appendActiveSearchStatParts(stats,card,priorities);
    if(stats.childNodes.length) row.append(stats);
  }
  if(priorities.has('link-material')) {
    const req=linkMaterialRequirement(card);
    if(req) add('link-material',`Materials: ${req}`);
  }
  if(priorities.has('link-arrows') && linkArrowText(card)) {
    row.dataset.hasLinkArrows='1';
    if(!state.detailsPanelLinkIndicator || compact) add('link-arrows',`Arrows: ${linkArrowText(card)}`);
  }
  if(priorities.has('effects') && state.filters.effects?.size) add('effects',`Effects: ${[...state.filters.effects].join(', ')}`);
  return row.childNodes.length ? row : null;
}
function createSearchListTypeChip(card) {
  const chip=createMetadataTypeChip(card);
  if(!chip) return null;
  chip.classList.add('search-list-type-chip');
  const full=String(displayCardType(card) || cardVisualType(card).label || '').trim();
  if(full) annotateMetadataChipTooltip(chip,full);
  return chip;
}
function createSearchCombatFact(card) {
  const atk=searchSemanticValue('atk',card,{labelStats:true});
  const def=searchSemanticValue('def',card,{labelStats:true});
  if(!atk && !def) return null;
  const fact=el('span','search-semantic-fact search-semantic-combat');
  fact.dataset.searchSemanticKey='combat';
  if(atk) fact.append(el('span','search-semantic-atk',atk));
  if(def) fact.append(el('span','search-semantic-def',def));
  return fact;
}
function createSearchSemanticFact(key,card) {
  const fact=el('span',`search-semantic-fact search-semantic-${key.replaceAll('-','_')}`);
  fact.dataset.searchSemanticKey=key;
  if(key==='type') {
    const chip=createMetadataTypeChip(card);
    if(!chip) return null;
    if(chip.classList.contains('metadata-symbol-chip')) fact.classList.add('search-semantic-icon-fact');
    fact.append(chip);
  } else if(key==='race') {
    const chip=createMetadataRaceChip(card);
    if(!chip) return null;
    if(chip.classList.contains('metadata-symbol-chip')) fact.classList.add('search-semantic-icon-fact');
    fact.append(chip);
  } else if(key==='attribute') {
    const chip=createMetadataAttributeChip(card);
    if(!chip) return null;
    if(chip.classList.contains('metadata-symbol-chip')) fact.classList.add('search-semantic-icon-fact');
    fact.append(chip);
  } else if(key==='link-rating' && state.searchView==='details' && state.detailsPanelLinkIndicator) {
    const indicator=createDetailsPanelLinkArrowIndicator(card);
    if(!indicator) return null;
    fact.classList.add('search-semantic-details-link');
    fact.append(indicator);
  } else if(key==='link-arrows') {
    const indicator=createSearchListLinkArrowIndicator(card);
    if(!indicator) return null;
    fact.append(indicator);
  } else {
    const value=searchSemanticValue(key,card,{labelStats:true});
    if(!value) return null;
    fact.textContent=value;
    fact.title=value;
  }
  return fact;
}
function createSearchIdentityLine(card) {
  const active=activeSearchSemanticKeys();
  const primary=primarySearchSemanticKeys();
  const line=el('div','search-identity-line');
  if(['attribute','type','race'].some(key=>active.has(key))) line.classList.add('has-search-priority');
  for(const key of ['attribute','type','race']) {
    const fact=createSearchSemanticFact(key,card);
    if(!fact) continue;
    if(active.has(key)) fact.classList.add('search-semantic-priority');
    if(primary.has(key)) fact.classList.add('search-semantic-primary');
    line.append(fact);
  }
  return line.childNodes.length ? line : null;
}
function createSearchStatsLine(card) {
  const active=activeSearchSemanticKeys();
  const primary=primarySearchSemanticKeys();
  const line=el('div','search-stats-line');
  if(['level','atk','def','link-rating','scale'].some(key=>active.has(key))) line.classList.add('has-search-priority');
  const visual=cardVisualType(card).key;
  const ordered=['level','atk','def','link-rating','scale'];
  for(const key of ordered) {
    if(key==='level' && (cardTypeBucket(card)!=='Monster' || visual==='link')) continue;
    if(key==='def' && !monsterHasDefense(card)) continue;
    let fact=null;
    if(key==='link-rating') {
      if(!Number.isFinite(Number(card?.linkval))) continue;
      if(state.searchView==='details' && state.detailsPanelLinkIndicator) {
        fact=createSearchSemanticFact('link-rating',card);
        if(fact) fact.classList.add('search-stat-link-indicator');
      } else {
        fact=createSearchSemanticFact('link-rating',card);
        if(fact) fact.classList.add('search-stat-link-text');
      }
    } else {
      fact=createSearchSemanticFact(key,card);
    }
    if(!fact) continue;
    fact.classList.add('search-stat-item');
    if(active.has(key) || (key==='atk' && active.has('atk')) || (key==='def' && active.has('def'))) fact.classList.add('search-semantic-priority');
    if(primary.has(key)) fact.classList.add('search-semantic-primary');
    line.append(fact);
  }
  return line.childNodes.length ? line : null;
}
function createSearchSemanticFacts(card) {
  const wrap=el('div','search-semantic-facts');
  const identity=createSearchIdentityLine(card);
  const stats=createSearchStatsLine(card);
  if(identity) wrap.append(identity);
  if(stats) wrap.append(stats);
  const active=activeSearchSemanticKeys();
  if(active.has('archetype')) {
    const archetype=createSearchSemanticFact('archetype',card);
    if(archetype) { archetype.classList.add('search-semantic-priority','search-archetype-line'); wrap.append(archetype); }
  }
  return wrap.childNodes.length ? wrap : null;
}
function createSearchCard(card, index = 0) {
  const node = el('article', 'search-card');
  node.dataset.cardId = card.id;
  const resultBucket=String(cardTypeBucket(card) || 'Other').toLocaleLowerCase();
  const resultVisual=String(cardVisualType(card).key || 'other').toLocaleLowerCase();
  node.classList.add(`search-card-${resultBucket}`,`search-mechanic-${resultVisual}`);
  if(cardScaleValue(card) != null) node.classList.add('search-mechanic-pendulum');
  if(isMaximumMonsterCard(card)) node.classList.add('search-mechanic-maximum');
  if(state.searchView==='details' && Number.isFinite(Number(card?.linkval))) {
    node.classList.add('details-link-card');
    const activeLink=activeSearchSemanticKeys();
    if(activeLink.has('link-rating') || activeLink.has('link-arrows')) node.classList.add('details-link-priority');
    else if(activeLink.size) node.classList.add('details-link-low-priority');
  }
  node.title = `${card.name} - click to select, click again to enlarge, right-click to add`;
  node.draggable = true;
  if (state.selectedCardId === card.id && state.selectedEntryUid == null) node.classList.add('selected');
  const imageWrap = el('div', 'image-wrap');
  const img = new Image();
  const detailsMode=state.searchView==='details';
  const eagerLimit=detailsMode?8:12;
  img.loading = index < eagerLimit ? 'eager' : 'lazy';
  if (index >= eagerLimit) img.fetchPriority = 'low';
  img.decoding = 'async'; img.alt = card.name; img.draggable = false;
  img.width = 421; img.height = 614;
  const smallSrc = imageUrlFor(card, null, true);
  const fullSrc = imageUrlFor(card, null, false);
  const primarySrc=detailsMode?(smallSrc || fullSrc):(fullSrc || smallSrc);
  const fallbackSrc=detailsMode?fullSrc:smallSrc;
  img.src = primarySrc;
  const fallback = el('div','search-art-fallback','Artwork unavailable');
  img.addEventListener('load', () => { imageWrap.classList.add('loaded'); fallback.remove(); }, {once:true});
  img.addEventListener('error', () => {
    if (img.dataset.fallbackTried !== '1' && fallbackSrc && img.src !== fallbackSrc) { img.dataset.fallbackTried='1'; img.src=fallbackSrc; return; }
    imageWrap.classList.add('art-error');
  });
  imageWrap.append(img, fallback);
  const cardLinkArrowOverlay=createCardLinkArrowOverlay(card,{view:state.searchView});
  if(cardLinkArrowOverlay) imageWrap.append(cardLinkArrowOverlay);
  const status = cardLimitStatus(card, state.filters.banlist);
  const badge = createLimitBadge(status);
  if (badge) { badge.classList.add('search-art-limit-badge'); imageWrap.append(badge); }
  const copy = el('div', 'search-copy');
  copy.append(el('div', 'search-name', card.name));
  const facts=createSearchSemanticFacts(card);
  if(facts) copy.append(facts);
  node.append(imageWrap, copy);
  node.addEventListener('pointerenter', () => setHoverPreview(card, null, card.images?.[0]?.id || card.id));
  node.addEventListener('pointerleave', () => clearHoverPreview(null, card.id));
  node.addEventListener('click', ev => {
    ev.preventDefault(); ev.stopPropagation();
    if (state.selectedEntryUid == null && Number(state.selectedCardId) === Number(card.id)) openArt(card,state.selectedArtworkId);
    else selectCard(card, null);
  });
  node.addEventListener('contextmenu', ev => {
    ev.preventDefault();
    if (ev.ctrlKey) addSearchCard(card, SECTION_SIDE);
    else addSearchCard(card, autoSection(card));
  });
  node.addEventListener('dragstart', ev => {
    state.dragged = {source:'search', cardId:card.id};
    state.lastDropHandled = false;
    ev.dataTransfer.effectAllowed = 'copy';
    ev.dataTransfer.setData('application/x-ygo-card', JSON.stringify(state.dragged));
    if (img.complete) ev.dataTransfer.setDragImage(img, img.clientWidth / 2, img.clientHeight / 2);
    $('.deck-panel').classList.add('drag-active');
  });
  node.addEventListener('dragend', () => finishDrag());
  return node;
}
function compactSearchMeta(card) {
  const parts=[];
  if(card?.archetype) parts.push(card.archetype);
  return parts.join(' · ');
}
function searchLinkIndicatorTooltip(card) {
  const rating=Number(card?.linkval);
  const arrows=linkArrowText(card);
  const parts=[];
  if(Number.isFinite(rating)) parts.push(`Link-${rating}`);
  if(arrows) parts.push(`Arrows: ${arrows}`);
  return parts.join(' - ') || 'Link Monster';
}
function createSearchListLinkArrowIndicator(card) {
  const rating=Number(card?.linkval);
  const diagram=createLinkMarkerGrid(card,{centerText:Number.isFinite(rating)?String(rating):''});
  if(!diagram) return null;
  diagram.classList.add('search-list-link-diagram');
  const wrap=el('div','search-list-link-indicator');
  const tooltip=searchLinkIndicatorTooltip(card);
  wrap.setAttribute('aria-label',tooltip);
  wrap.title=tooltip;
  diagram.title=tooltip;
  wrap.append(diagram);
  return wrap;
}
function createDetailsPanelLinkArrowIndicator(card) {
  if(!state.detailsPanelLinkIndicator) return null;
  const rating=Number(card?.linkval);
  const diagram=createLinkMarkerGrid(card,{centerText:Number.isFinite(rating)?String(rating):''});
  if(!diagram) return null;
  diagram.classList.add('details-panel-link-diagram');
  const wrap=el('div','details-panel-link-indicator');
  const tooltip=searchLinkIndicatorTooltip(card);
  wrap.setAttribute('aria-label',tooltip);
  wrap.title=tooltip;
  diagram.title=tooltip;
  wrap.append(diagram);
  return wrap;
}
function searchListLevelRankText(card) {
  if(cardTypeBucket(card)!=='Monster' || cardVisualType(card).key==='link') return '';
  const raw=card?.level;
  if(raw === null || raw === undefined || raw === '') return '';
  const level=Number(raw);
  return Number.isFinite(level) && level>=0 ? `★${level}` : '';
}
function searchListCellValue(key,card) {
  return searchSemanticValue(key,card);
}
function createSearchListCell(key,card,{index=0}={}) {
  if(key==='art') {
    const artWrap=el('div','search-list-v5-cell search-list-v5-art');
    artWrap.dataset.searchListV5Col=key;
    const img=new Image();
    img.loading=index < 24 ? 'eager' : 'lazy';
    if(index >= 24) img.fetchPriority='low';
    img.decoding='async'; img.alt=''; img.draggable=false; img.width=421; img.height=614;
    img.src=imageUrlFor(card,null,true) || imageUrlFor(card,null,false);
    artWrap.append(img);
    const badge=createLimitBadge(cardLimitStatus(card,state.filters.banlist));
    if(badge){ badge.classList.add('compact-search-limit-badge'); artWrap.append(badge); }
    return artWrap;
  }
  if(key==='card') {
    const copy=el('div','search-list-v5-cell search-list-v5-card');
    copy.dataset.searchListV5Col=key;
    copy.append(el('div','search-list-v5-name',card.name));
    return copy;
  }
  const cell=el('div',`search-list-v5-cell search-list-v5-col-${key.replaceAll('-','_')}`);
  cell.dataset.searchListV5Col=key;
  if(searchListGroupIsPriority(key)) cell.classList.add('search-list-v5-priority');
  if(searchListGroupIsPrimary(key)) cell.classList.add('search-list-v5-primary');
  if(key==='link') {
    const indicator=createSearchListLinkArrowIndicator(card);
    if(indicator) cell.append(indicator);
    return cell;
  }
  if(key==='type') {
    const typeChip=createSearchListTypeChip(card);
    if(typeChip) cell.append(typeChip);
    return cell;
  }
  if(key==='race') {
    const raceChip=createMetadataRaceChip(card);
    if(raceChip) cell.append(raceChip);
    return cell;
  }
  if(key==='atk' || key==='def') {
    const value=searchSemanticValue(key,card);
    cell.classList.add('search-list-v5-numeric');
    cell.textContent=value;
    cell.title=value!=='' ? `${key.toUpperCase()} ${value}` : '';
    return cell;
  }
  if(key==='attribute') {
    const chip=createMetadataAttributeChip(card);
    if(chip) cell.append(chip);
    return cell;
  }
  if(key==='scale') {
    const scale=cardScaleValue(card);
    cell.textContent=scale == null ? '' : String(scale);
    cell.title=cell.textContent ? `Scale ${cell.textContent}` : '';
    return cell;
  }
  cell.textContent=searchListCellValue(key,card);
  cell.title=cell.textContent;
  return cell;
}
function createCompactSearchRow(card, index = 0) {
  const node=el('article','search-card search-list-v5-row');
  node.dataset.cardId=card.id;
  node.title=`${card.name} - click to select, click again to enlarge, right-click to add`;
  node.draggable=true;
  if (state.selectedCardId === card.id && state.selectedEntryUid == null) node.classList.add('selected');
  for(const key of searchListColumnRenderOrder()) node.append(createSearchListCell(key,card,{index}));
  node.addEventListener('pointerenter',()=>setHoverPreview(card,null,card.images?.[0]?.id || card.id));
  node.addEventListener('pointerleave',()=>clearHoverPreview(null,card.id));
  node.addEventListener('click',ev=>{
    ev.preventDefault(); ev.stopPropagation();
    if (state.selectedEntryUid == null && Number(state.selectedCardId) === Number(card.id)) openArt(card,state.selectedArtworkId);
    else selectCard(card,null);
  });
  node.addEventListener('contextmenu',ev=>{
    ev.preventDefault();
    if (ev.ctrlKey) addSearchCard(card,SECTION_SIDE);
    else addSearchCard(card,autoSection(card));
  });
  node.addEventListener('dragstart',ev=>{
    state.dragged={source:'search',cardId:card.id};
    state.lastDropHandled=false;
    ev.dataTransfer.effectAllowed='copy';
    ev.dataTransfer.setData('application/x-ygo-card',JSON.stringify(state.dragged));
    const img=node.querySelector('.search-list-v5-art img');
    if (img?.complete) ev.dataTransfer.setDragImage(img,Math.max(1,img.clientWidth/2),Math.max(1,img.clientHeight/2));
    $('.deck-panel').classList.add('drag-active');
  });
  node.addEventListener('dragend',()=>finishDrag());
  return node;
}
function searchListMeasureText(textValue,node) {
  const value=String(textValue || '');
  if(!value) return 0;
  const canvas=searchListMeasureText.canvas || (searchListMeasureText.canvas=document.createElement('canvas'));
  const ctx=canvas.getContext('2d');
  const style=node ? getComputedStyle(node) : null;
  if(style) ctx.font=`${style.fontStyle || 'normal'} ${style.fontWeight || '700'} ${style.fontSize || '9px'} ${style.fontFamily || 'sans-serif'}`;
  else ctx.font='700 9px sans-serif';
  const letterSpacing=style ? parseFloat(style.letterSpacing) || 0 : 0;
  return ctx.measureText(value).width+Math.max(0,value.length-1)*letterSpacing;
}
function searchListAutoFitContentWidth(def) {
  if(!def || !dom.searchResults) return null;
  const key=def.key;
  if(key==='art') return 30;
  const header=dom.searchResults.querySelector(`.search-list-v5-header-cell[data-search-list-v5-col="${key}"]`);
  let best=searchListMeasureText(def.shortLabel || def.label || '',header)+18;
  const cards=Array.isArray(state.searchResultCards) ? state.searchResultCards : [];
  if(key==='card') {
    for(const card of cards.slice(0,1000)) best=Math.max(best,searchListMeasureText(card?.name || '',header)+18);
  } else {
    best=Math.max(best,searchListContentWidth(key,{tight:dom.searchResults.classList.contains('compact-list-tight')}));
  }
  return Math.ceil(best);
}
function searchListResizeFloor(def) {
  if(!def) return 28;
  if(def.key==='art') return 22;
  if(def.key==='card') return 82;
  if(searchListGroupIsPriority(def.key)) return Math.max(28,searchListContentWidth(def.key,{tight:dom.searchResults?.classList.contains('compact-list-tight')}));
  return Math.max(28,Number(def.dense || def.min || 28));
}
function autoFitSearchListColumn(def) {
  if(!def || !dom.searchResults) return;
  const measured=searchListAutoFitContentWidth(def);
  if(!Number.isFinite(measured)) return;
  const floor=searchListResizeFloor(def);
  const maximum=def.key==='art'?120:def.key==='card'?560:520;
  state.searchListColumnWidths[def.key]=Math.max(floor,Math.min(maximum,Math.round(measured)));
  lastSearchListLayoutSignature='';
  updateCompactSearchColumnLayout();
  persistState();
}
function attachSearchListColumnResizer(cell,def) {
  if(!cell || !def) return;
  cell.classList.add('search-list-resizable-header');
  const handle=el('span','search-list-column-resize-handle');
  handle.title='Drag to resize this Search List column. Double-click to auto-fit it to its contents.';
  handle.setAttribute('aria-hidden','true');
  handle.addEventListener('pointerdown',event=>{
    if(event.button!==0) return;
    event.preventDefault(); event.stopPropagation();
    const startX=event.clientX;
    const floor=searchListResizeFloor(def);
    const startWidth=Math.max(floor,cell.getBoundingClientRect().width);
    handle.setPointerCapture?.(event.pointerId);
    document.body.classList.add('search-list-column-resizing');
    const onMove=move=>{
      const maximum=def.key==='art'?120:720;
      const next=Math.max(floor,Math.min(maximum,Math.round(startWidth+(move.clientX-startX))));
      state.searchListColumnWidths[def.key]=next;
      lastSearchListLayoutSignature='';
      updateCompactSearchColumnLayout();
    };
    const finish=()=>{
      handle.removeEventListener('pointermove',onMove);
      handle.removeEventListener('pointerup',finish);
      handle.removeEventListener('pointercancel',finish);
      document.body.classList.remove('search-list-column-resizing');
      persistState();
    };
    handle.addEventListener('pointermove',onMove);
    handle.addEventListener('pointerup',finish,{once:true});
    handle.addEventListener('pointercancel',finish,{once:true});
  });
  handle.addEventListener('dblclick',event=>{
    event.preventDefault(); event.stopPropagation();
    autoFitSearchListColumn(def);
  });
  cell.append(handle);
}
function createCompactSearchHeader() {
  const header=el('div','search-list-v5-header');
  header.setAttribute('role','row');
  for(const key of searchListColumnRenderOrder()) {
    const def=SEARCH_LIST_COLUMN_BY_KEY.get(key);
    const cell=el('span',`search-list-v5-header-cell search-list-v5-header-${key.replaceAll('-','_')}`,def?.shortLabel || def?.label || '');
    cell.dataset.searchListV5Col=key;
    cell.setAttribute('role','columnheader');
    if(def?.label) cell.title=def.title || def.label;
    if(searchListGroupIsPriority(key)) cell.classList.add('search-list-v5-priority');
    if(searchListGroupIsPrimary(key)) cell.classList.add('search-list-v5-primary');
    header.append(cell);
  }
  return header;
}
function cardScaleValue(card) {
  const raw=card?.scale;
  if(raw === null || raw === undefined || raw === '') return null;
  const value=Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}
function isPendulumMonsterCard(card) {
  if (cardTypeBucket(card) !== 'Monster') return false;
  const type=String(card?.type || '').toLocaleLowerCase();
  const frame=String(card?.frameType || '').toLocaleLowerCase();
  const display=String(displayCardType(card) || '').toLocaleLowerCase();
  return type.includes('pendulum') || frame.includes('pendulum') || display.includes('pendulum');
}
function monsterNumericStat(card,key) {
  if(cardTypeBucket(card)!=='Monster') return null;
  if(key==='def' && cardVisualType(card).key==='link') return 0;
  const value=Number(card?.[key]);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}
function searchFilterContext(filters=state.filters) {
  const family=String(filters?.category || '');
  const monster=family==='Monster';
  const spell=family==='Spell';
  const trap=family==='Trap';
  const specific=Boolean(family);
  const type=effectiveSearchTypeValue(filters);
  const pendulum=monster && type==='Pendulum';
  const subtype=pendulum ? effectiveMonsterSubtypeValue(filters) : '';
  return {
    family, specific, monster, spell, trap, type, subtype, pendulum,
    trapMonster:monster && type==='Trap Monster',
    link:monster && (type==='Link' || (pendulum && subtype==='Link')),
    xyz:monster && (type==='Xyz' || (pendulum && subtype==='Xyz')),
  };
}
function orderedSearchSubtypeValues(family) {
  const cards=(state.cards || []).filter(card=>cardTypeBucket(card)===family);
  const discovered=new Set(cards.map(card=>String(card?.race || '').trim()).filter(Boolean));
  const preferred=family==='Spell' ? SPELL_SEARCH_TYPE_ORDER : family==='Trap' ? TRAP_SEARCH_TYPE_ORDER : [];
  return [...preferred.filter(value=>discovered.has(value) || value==='Normal' || (family==='Trap' && value==='Trap Monster')), ...[...discovered].filter(value=>!preferred.includes(value)).sort((a,b)=>a.localeCompare(b))];
}
function effectiveSearchTypeValue(filters=state.filters) {
  const family=String(filters?.category || '');
  const value=String(filters?.type || '').trim();
  if(!value) return '';
  if(family==='Monster') {
    if(value===PENDULUM_MONSTER_FILTER) return 'Pendulum';
    if(MONSTER_SEARCH_CATEGORIES.includes(value)) return value;
    const lower=value.toLocaleLowerCase();
    for(const option of MONSTER_SEARCH_CATEGORIES) {
      if(option==='Non Effect') continue;
      const needle=option.toLocaleLowerCase().replace(' monster','');
      if(lower.includes(needle)) return option;
    }
    return '';
  }
  if(family==='Spell' || family==='Trap') {
    return orderedSearchSubtypeValues(family).includes(value) ? value : '';
  }
  return '';
}
function effectiveMonsterSubtypeValue(filters=state.filters) {
  const family=String(filters?.category || '');
  const type=effectiveSearchTypeValue(filters);
  const value=String(filters?.monsterSubtype || '').trim();
  if(family!=='Monster' || type!=='Pendulum' || !value) return '';
  return PENDULUM_SEARCH_SUBTYPES.includes(value) ? value : '';
}
function pendulumMonsterSubtype(card) {
  if(!isPendulumMonsterCard(card)) return '';
  const text=`${card?.type || ''} ${card?.frameType || ''} ${displayCardType(card) || ''}`.toLocaleLowerCase();
  if(text.includes('fusion')) return 'Fusion';
  if(text.includes('synchro')) return 'Synchro';
  if(text.includes('xyz')) return 'Xyz';
  if(text.includes('ritual')) return 'Ritual';
  if(text.includes('link') || card?.linkval != null) return 'Link';
  if(text.includes('normal')) return 'Normal';
  return 'Effect';
}
function cardMatchesMonsterSubtype(card,subtype) {
  if(!subtype) return true;
  return pendulumMonsterSubtype(card)===subtype;
}
function cardMatchesSearchFamily(card,family) {
  if(!family) return true;
  const bucket=cardTypeBucket(card);
  if(bucket===family) return true;
  return family==='Monster' && isTrapMonsterCard(card);
}
function cardMatchesMonsterSearchCategory(card,category) {
  if(!category) return true;
  if(category==='Trap Monster') return isTrapMonsterCard(card);
  if(cardTypeBucket(card)!=='Monster') return false;
  const text=`${card?.type || ''} ${card?.frameType || ''} ${displayCardType(card) || ''}`.toLocaleLowerCase();
  const checks={
    Normal:()=>text.includes('normal'),
    Effect:()=>text.includes('effect'),
    'Non Effect':()=>!cardHasActualEffect(card),
    Ritual:()=>text.includes('ritual'),
    Fusion:()=>text.includes('fusion'),
    Synchro:()=>text.includes('synchro'),
    Xyz:()=>text.includes('xyz'),
    Pendulum:()=>text.includes('pendulum'),
    Link:()=>text.includes('link') || card?.linkval != null,
    Maximum:()=>isMaximumMonsterCard(card),
  };
  return Boolean(checks[category]?.());
}
function cardMatchesMonsterSearchAbility(card,ability) {
  if(!ability) return true;
  if(cardTypeBucket(card)!=='Monster') return false;
  const text=`${card?.type || ''} ${displayCardType(card) || ''}`.toLocaleLowerCase();
  return text.includes(String(ability).toLocaleLowerCase());
}
function searchContextualTypeMatches(card,filters=state.filters) {
  const ctx=searchFilterContext(filters);
  if(!ctx.type) return true;
  if(ctx.monster) return cardMatchesMonsterSearchCategory(card,ctx.type) && cardMatchesMonsterSubtype(card,ctx.subtype);
  if(ctx.trap && ctx.type==='Trap Monster') return isTrapMonsterCard(card);
  if(ctx.spell || ctx.trap) return String(card?.race || '')===ctx.type;
  return true;
}
function searchEffectTextMatches(card,filters=state.filters) {
  const needle=String(filters?.effectText || '').trim().toLocaleLowerCase();
  if(!needle) return true;
  const haystack=String(card?.desc || '').replace(/\s+/g,' ').toLocaleLowerCase();
  return haystack.includes(needle);
}
function filteredCards() {
  const f = state.filters;
  const ctx=searchFilterContext(f);
  const selectedEffects = f.effects;
  const results = [];
  const pool = String(f.cardPool || '').toLocaleLowerCase();
  const poolAliases = {tcg:['tcg'], ocg:['ocg','ocg goat'], goat:['goat','ocg goat'], 'master duel':['master duel'], 'speed duel':['speed duel'], 'rush duel':['rush duel'], 'duel links':['duel links']};
  const bound = value => value === '' || value == null ? null : Number(value);
  const levelMin=ctx.monster && !ctx.trapMonster && !ctx.link ? bound(f.levelMin) : null;
  const levelMax=ctx.monster && !ctx.trapMonster && !ctx.link ? bound(f.levelMax) : null;
  const scaleMin=ctx.pendulum ? bound(f.scaleMin) : null;
  const scaleMax=ctx.pendulum ? bound(f.scaleMax) : null;
  const atkMin=ctx.monster && !ctx.trapMonster ? bound(f.atkMin) : null;
  const atkMax=ctx.monster && !ctx.trapMonster ? bound(f.atkMax) : null;
  const defMin=ctx.monster && !ctx.trapMonster && !ctx.link ? bound(f.defMin) : null;
  const defMax=ctx.monster && !ctx.trapMonster && !ctx.link ? bound(f.defMax) : null;
  const linkRatingMin=ctx.link ? bound(f.linkRatingMin) : null;
  const linkRatingMax=ctx.link ? bound(f.linkRatingMax) : null;
  for (let sourceIndex=0; sourceIndex<state.cards.length; sourceIndex++) {
    const card=state.cards[sourceIndex];
    const score = cardSearchScore(card, f.query);
    if (f.query && score == null) continue;
    if (ctx.specific && !cardMatchesSearchFamily(card,ctx.family)) continue;
    if (!searchContextualTypeMatches(card,f)) continue;
    if (ctx.monster && !ctx.trapMonster && f.ability && !cardMatchesMonsterSearchAbility(card,f.ability)) continue;
    if (ctx.monster && !ctx.trapMonster && f.attribute && card.attribute !== f.attribute) continue;
    if (ctx.monster && !ctx.trapMonster && f.race && card.race !== f.race) continue;
    if (ctx.specific && f.archetype && card.archetype !== f.archetype) continue;
    if (ctx.link && (linkRatingMin != null || linkRatingMax != null)) {
      const rating=Number(card?.linkval);
      if(!Number.isFinite(rating)) continue;
      if(linkRatingMin!=null && (!Number.isFinite(linkRatingMin) || rating<linkRatingMin)) continue;
      if(linkRatingMax!=null && (!Number.isFinite(linkRatingMax) || rating>linkRatingMax)) continue;
    }
    if (ctx.link && !cardMatchesLinkMaterialCriteria(card,f)) continue;
    if (ctx.xyz && !cardMatchesXyzMaterialCriteria(card,f)) continue;
    if (ctx.link && f.linkMarkers?.size) {
      if(card?.linkval == null || !Array.isArray(card?.linkmarkers)) continue;
      const cardMarkers=new Set(card.linkmarkers.map(normalizeLinkMarker).filter(Boolean));
      const markerMatches=[...f.linkMarkers].map(marker=>cardMarkers.has(marker));
      if(f.linkMarkerMode==='Any' ? !markerMatches.some(Boolean) : markerMatches.some(value=>!value)) continue;
    }
    if (pool && pool !== 'all') {
      const formats=(card.formats || []).map(v=>String(v).toLocaleLowerCase());
      const accepted=poolAliases[pool] || [pool];
      if (formats.length && !formats.some(fmt=>accepted.includes(fmt))) continue;
    }
    const levelValue = Number(card.level);
    if (levelMin != null && (!Number.isFinite(levelValue) || levelValue < levelMin)) continue;
    if (levelMax != null && (!Number.isFinite(levelValue) || levelValue > levelMax)) continue;
    const scaleValue=cardScaleValue(card);
    if (scaleMin != null && (scaleValue == null || scaleValue < scaleMin)) continue;
    if (scaleMax != null && (scaleValue == null || scaleValue > scaleMax)) continue;
    const atkValue=monsterNumericStat(card,'atk');
    const defValue=monsterNumericStat(card,'def');
    if (atkMin != null && (atkValue == null || atkValue < atkMin)) continue;
    if (atkMax != null && (atkValue == null || atkValue > atkMax)) continue;
    if (defMin != null && (defValue == null || defValue < defMin)) continue;
    if (defMax != null && (defValue == null || defValue > defMax)) continue;
    const status = cardLimitStatus(card, f.banlist);
    if (f.restriction && status !== f.restriction) continue;
    if (!cardMatchesEffectFilters(card, selectedEffects, f.effectMode)) continue;
    if (!searchEffectTextMatches(card,f)) continue;
    results.push({card, score:score ?? 0, sourceIndex});
  }
  const dir = f.direction === 'desc' ? -1 : 1;
  results.sort((a,b) => {
    if (f.sort === 'relevance') {
      if (a.score !== b.score) return (a.score - b.score) * dir;
      if (a.sourceIndex !== b.sourceIndex) return (a.sourceIndex - b.sourceIndex) * dir;
      return a.card.name.localeCompare(b.card.name) * dir;
    }
    const groupOrder = {Monster:0, Spell:1, Trap:2, Other:3};
    const groupDelta = (groupOrder[cardTypeBucket(a.card)] ?? 9) - (groupOrder[cardTypeBucket(b.card)] ?? 9);
    if (groupDelta) return groupDelta;
    let av, bv;
    if (f.sort === 'name') return a.card.name.localeCompare(b.card.name) * dir;
    if (f.sort === 'type') {
      const aType=String(displayCardType(a.card) || cardVisualType(a.card).label || cardTypeBucket(a.card) || '').trim();
      const bType=String(displayCardType(b.card) || cardVisualType(b.card).label || cardTypeBucket(b.card) || '').trim();
      const typeDelta=aType.localeCompare(bType);
      if(typeDelta) return typeDelta * dir;
      const aSubtype=String(a.card?.race || '').trim();
      const bSubtype=String(b.card?.race || '').trim();
      const subtypeDelta=aSubtype.localeCompare(bSubtype);
      if(subtypeDelta) return subtypeDelta * dir;
      return a.card.name.localeCompare(b.card.name) * dir;
    }
    if (f.sort === 'level') { av = a.card.linkval ?? a.card.level ?? -1; bv = b.card.linkval ?? b.card.level ?? -1; }
    else if (f.sort === 'atk') { av = monsterNumericStat(a.card,'atk') ?? 0; bv = monsterNumericStat(b.card,'atk') ?? 0; }
    else if (f.sort === 'def') { av = monsterNumericStat(a.card,'def') ?? 0; bv = monsterNumericStat(b.card,'def') ?? 0; }
    else if (f.sort === 'scale') {
      const aScale=cardScaleValue(a.card), bScale=cardScaleValue(b.card);
      if(aScale==null && bScale!=null) return 1;
      if(aScale!=null && bScale==null) return -1;
      av=aScale ?? 0; bv=bScale ?? 0;
    }
    else { av = 0; bv = 0; }
    if (av !== bv) return (av - bv) * dir;
    return a.card.name.localeCompare(b.card.name) * dir;
  });
  return results;
}
const SEARCH_DETAILS_BATCH_SIZE = 64;
let searchDetailsObserver = null;
let searchDetailsRenderToken = 0;
function stopSearchDetailsBatching() {
  searchDetailsObserver?.disconnect();
  searchDetailsObserver = null;
  searchDetailsRenderToken += 1;
}
function renderSearchRowsIncrementally(cards,view) {
  const token=++searchDetailsRenderToken;
  let rendered=0;
  const selectedIndex=state.selectedCardId==null ? -1 : cards.findIndex(card=>Number(card.id)===Number(state.selectedCardId));
  const firstBatchSize=selectedIndex>=0 ? Math.max(SEARCH_DETAILS_BATCH_SIZE,selectedIndex+1) : SEARCH_DETAILS_BATCH_SIZE;
  if(view==='list') dom.searchResults.append(createCompactSearchHeader());
  const sentinel=el('div','search-details-sentinel search-results-sentinel');
  sentinel.setAttribute('aria-hidden','true');
  dom.searchResults.append(sentinel);
  const appendBatch=()=>{
    if(token!==searchDetailsRenderToken || state.searchView!==view || !sentinel.isConnected) return;
    const end=Math.min(cards.length,rendered+(rendered===0?firstBatchSize:SEARCH_DETAILS_BATCH_SIZE));
    const frag=document.createDocumentFragment();
    for(;rendered<end;rendered++) {
      frag.append(view==='list' ? createCompactSearchRow(cards[rendered],rendered) : createSearchCard(cards[rendered],rendered));
    }
    sentinel.before(frag);
    if(view==='list') { updateCompactSearchColumnLayout(); scheduleSearchListLayoutRefresh(); } else updateSearchSemanticFactVisibility();
    if(rendered>=cards.length) {
      searchDetailsObserver?.disconnect();
      searchDetailsObserver=null;
      sentinel.remove();
    }
  };
  appendBatch();
  if(rendered>=cards.length) return;
  if('IntersectionObserver' in window) {
    searchDetailsObserver=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)) requestAnimationFrame(appendBatch);
    },{root:dom.searchResults,rootMargin:'900px 0px'});
    searchDetailsObserver.observe(sentinel);
  } else {
    while(rendered<cards.length) appendBatch();
  }
}
function renderSearchDetailsIncrementally(cards) {
  renderSearchRowsIncrementally(cards,'details');
}
function captureSearchViewContext() {
  if(!dom.searchResults) return null;
  const max=Math.max(0,dom.searchResults.scrollHeight-dom.searchResults.clientHeight);
  const selected=state.selectedCardId==null ? null : dom.searchResults.querySelector(`[data-card-id="${state.selectedCardId}"]`);
  const hostRect=dom.searchResults.getBoundingClientRect();
  const selectedOffset=selected ? selected.getBoundingClientRect().top-hostRect.top : null;
  return {selectedCardId:state.selectedCardId,selectedOffset,ratio:max>0?dom.searchResults.scrollTop/max:0};
}
function restoreSearchViewContext(context) {
  if(!context || !dom.searchResults) return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(!dom.searchResults) return;
    const node=context.selectedCardId==null ? null : dom.searchResults.querySelector(`[data-card-id="${context.selectedCardId}"]`);
    if(node) {
      node.classList.add('selected');
      const hostRect=dom.searchResults.getBoundingClientRect();
      if(Number.isFinite(context.selectedOffset)) {
        const delta=(node.getBoundingClientRect().top-hostRect.top)-context.selectedOffset;
        dom.searchResults.scrollTop+=delta;
      } else node.scrollIntoView({block:'nearest'});
    } else {
      const max=Math.max(0,dom.searchResults.scrollHeight-dom.searchResults.clientHeight);
      dom.searchResults.scrollTop=Math.round(max*Math.max(0,Math.min(1,Number(context.ratio)||0)));
    }
  }));
}
function renderSearch() {
  if (!state.databaseLoaded) return;
  const matches = state.searchMatchesCache || filteredCards();
  state.searchMatchesCache = matches;
  const limit = Math.max(1, Math.min(2000, Number(state.filters.maxResults) || 500));
  dom.resultCount.textContent = matches.length > limit
    ? `${matches.length.toLocaleString()} matching cards - limited to ${limit.toLocaleString()}`
    : `${matches.length.toLocaleString()} matching card${matches.length === 1 ? '' : 's'}`;
  stopSearchDetailsBatching();
  dom.searchResults.classList.toggle('grid-view', state.searchView === 'grid');
  dom.searchResults.classList.toggle('list-view', state.searchView === 'details');
  dom.searchResults.classList.add('adaptive-search-sizing');
  dom.searchResults.classList.toggle('compact-list-view', state.searchView === 'list');
  dom.searchResults.classList.toggle('search-list-v5', state.searchView === 'list');
  updateSearchResultPriorityClasses();
  lastSearchSemanticLayoutSignature='';
  lastSearchListLayoutSignature='';
  dom.searchResults.replaceChildren();
  const cards=matches.slice(0,limit).map(({card})=>card);
  state.searchResultCards=cards;
  state.searchResultApplicableKeys=semanticKeysPresentInCards(cards);
  applySearchResultIntrinsicSizing(cards);
  if(state.searchView==='details') updateSearchDetailsTrackLayout();
  if(state.searchView==='list') { updateCompactSearchColumnLayout(); scheduleSearchListLayoutRefresh(); }
  updateAdaptiveSearchSizing({force:true});
  renderSearchRowsIncrementally(cards,state.searchView);
  if(state.searchView==='list') { updateCompactSearchColumnLayout(); scheduleSearchListLayoutRefresh(); }
  if(state.pendingSearchViewContext) {
    const context=state.pendingSearchViewContext;
    state.pendingSearchViewContext=null;
    restoreSearchViewContext(context);
  }
}
function renderSearchSelection() {
  $$('.search-card.selected').forEach(n => n.classList.remove('selected'));
  if (state.selectedEntryUid == null && state.selectedCardId != null) {
    const node = dom.searchResults.querySelector(`[data-card-id="${state.selectedCardId}"]`);
    node?.classList.add('selected');
  }
}
function setDeckDraggingGhosts(uids) {
  const wanted=new Set((uids || []).map(Number));
  $$('[data-uid]').forEach(node=>node.classList.toggle('dragging',wanted.has(Number(node.dataset.uid))));
}
function setDeckArtworkSource(img,card,ydkId,order=0){
  const info=preferredImage(card,ydkId),id=Number(info?.id||ydkId||card?.id),urls=[];
  const add=u=>{u=String(u||'').trim();if(u&&!urls.includes(u))urls.push(u);};
  add(info?.imageUrl||imageUrlFor(card,ydkId,false));
  if(Number.isFinite(id)){const u=`https://images.ygoprodeck.com/images/cards/${id}.jpg`;add(u);add(`${u}?full=1`);}
  img.loading='eager';img.fetchPriority=order<24?'high':'auto';img.decoding='async';
  let i=0,done=false;
  const next=()=>{if(i<urls.length){img.src=urls[i++];return;}done=true;img.dataset.artworkQuality='unavailable';img.src='assets/card_placeholder.png';};
  img.addEventListener('load',()=>{if(done)return;if(img.naturalWidth<300||img.naturalHeight<430){img.dataset.artworkQuality='undersized';next();return;}done=true;img.dataset.artworkQuality='full';img.classList.add('deck-art-ready');});
  img.addEventListener('error',()=>{if(!done)next();});
  next();
}
function createDeckCard(section, entry, order=0) {
  const card = state.indexes.byId.get(Number(entry.id));
  const node = el('div', 'deck-card');
  node.dataset.uid = entry.uid;
  node.dataset.section = section;
  node.draggable = true;
  node.title = card ? `${card.name} - click to select, click again to enlarge, right-click to remove, drag to move` : `Unknown Card ${entry.id}`;
  if (state.selectedEntryUids.has(Number(entry.uid)) || state.selectedEntryUid === entry.uid) node.classList.add('selected');
  const img = new Image();
  img.alt = card?.name || String(entry.id); img.draggable = false; img.width=421; img.height=614;
  if (card) setDeckArtworkSource(img,card,entry.id,order);
  node.append(img);
  if (card) { const badge = createLimitBadge(cardLimitStatus(card, state.banlist)); if (badge) node.append(badge); }
  node.addEventListener('pointerenter', () => { if (card) setHoverPreview(card, entry.uid, entry.id); });
  node.addEventListener('pointerleave', () => clearHoverPreview(entry.uid));
  node.addEventListener('click', ev => {
    ev.preventDefault(); ev.stopPropagation();
    if (!card) return;
    if (ev.altKey) { duplicateEntries(actionUids(entry.uid)); return; }
    if (ev.shiftKey) { selectEntryRange(entry.uid, {additive: ev.ctrlKey || ev.metaKey}); return; }
    if (ev.ctrlKey) { selectCard(card, entry.uid, entry.id, {additive:true, toggle:true}); return; }
    if (ev.metaKey) { selectCard(card, entry.uid, entry.id, {additive:true, toggle:true}); return; }
    if (state.selectedEntryUids.size <= 1 && state.selectedEntryUid === entry.uid) openArt(card, entry.id);
    else selectCard(card, entry.uid);
  });
  node.addEventListener('contextmenu', ev => {
    ev.preventDefault(); ev.stopPropagation();
    const uids = actionUids(entry.uid);
    if (ev.ctrlKey) toggleEntriesSide(uids);
    else removeEntries(uids);
  });
  node.addEventListener('dragstart', ev => {
    if (!state.selectedEntryUids.has(Number(entry.uid))) selectCard(card, entry.uid);
    const uids = actionUids(entry.uid);
    state.dragged = {source:'deck', uid:entry.uid, uids, section};
    state.lastDropHandled = false;
    setDeckDraggingGhosts(uids);
    $('.deck-panel').classList.add('drag-active');
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('application/x-ygo-card', JSON.stringify(state.dragged));
    if (!setDeckDragImage(ev,uids) && img.complete) ev.dataTransfer.setDragImage(img, img.clientWidth / 2, img.clientHeight / 2);
  });
  node.addEventListener('dragover', ev => {
    if (!state.dragged) return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.dataTransfer.dropEffect = state.dragged.source === 'search' ? 'copy' : 'move';
  });
  node.addEventListener('drop', ev => {
    ev.preventDefault(); ev.stopPropagation();
    const rect = node.getBoundingClientRect();
    const after = ev.clientX > rect.left + rect.width / 2;
    handleDrop(section, entry.uid, after);
  });
  node.addEventListener('dragend', finishDrag);
  return node;
}
function renderDeckGrid(section, container) {
  container.replaceChildren();
  container.classList.toggle('main-grid', section === SECTION_MAIN);
  container.classList.toggle('fan-grid', section === SECTION_EXTRA || section === SECTION_SIDE);
  const frag = document.createDocumentFragment();
  state.deck[section].forEach((entry,index) => {
    const node=createDeckCard(section, entry, index);
    node.style.setProperty('--fan-index', String(index));
    frag.append(node);
  });
  container.append(frag);
}
let deckLayoutRaf = 0;
function scheduleDeckLayout() {
  cancelAnimationFrame(deckLayoutRaf);
  deckLayoutRaf=requestAnimationFrame(layoutDeckZones);
}
function gridInnerWidth(container) {
  const style=getComputedStyle(container);
  return Math.max(1,container.clientWidth-(parseFloat(style.paddingLeft)||0)-(parseFloat(style.paddingRight)||0));
}
function layoutDeckZones() {
  if (!dom.visualDeckView || state.deckView !== 'grid' || dom.visualDeckView.classList.contains('hidden')) return;
  const ratio = 614 / 421;
  const zoneMap = {main:dom.mainDeck, extra:dom.extraDeck, side:dom.sideDeck};
  const counts = {
    main: state.deck[SECTION_MAIN].length,
    extra: state.deck[SECTION_EXTRA].length,
    side: state.deck[SECTION_SIDE].length,
  };
  const expanded = {};
  for (const section of SECTION_ORDER) {
    const zone = zoneMap[section].closest('.deck-zone');
    expanded[section] = !zone.classList.contains('zone-collapsed');
  }
  const absoluteCardFloor = 0.5;
  const maxCardWidth = 156;
  function zoneContentWidth(container) {
    const zone = container.closest('.deck-zone');
    const rect = zone.getBoundingClientRect();
    const cs = getComputedStyle(zone);
    return Math.max(1,
      rect.width -
      (parseFloat(cs.borderLeftWidth) || 0) -
      (parseFloat(cs.borderRightWidth) || 0) -
      (parseFloat(cs.paddingLeft) || 0) -
      (parseFloat(cs.paddingRight) || 0)
    );
  }
  function measuredDeckWidth() {
    const widths = [];
    for (const section of SECTION_ORDER) {
      if (!expanded[section]) continue;
      widths.push(zoneContentWidth(zoneMap[section]));
    }
    return Math.max(1, widths.length ? Math.min(...widths) : dom.visualDeckView.getBoundingClientRect().width);
  }
  function measuredOverhead() {
    const viewStyle = getComputedStyle(dom.visualDeckView);
    let overhead = (parseFloat(viewStyle.paddingTop) || 0) + (parseFloat(viewStyle.paddingBottom) || 0);
    let visibleZones = 0;
    for (const section of SECTION_ORDER) {
      const container = zoneMap[section];
      const zone = container.closest('.deck-zone');
      const heading = zone.querySelector('.zone-heading');
      const cs = getComputedStyle(zone);
      const hs = heading ? getComputedStyle(heading) : null;
      overhead +=
        (heading?.getBoundingClientRect().height || 0) +
        (parseFloat(hs?.marginTop) || 0) +
        (parseFloat(hs?.marginBottom) || 0) +
        (parseFloat(cs.paddingTop) || 0) +
        (parseFloat(cs.paddingBottom) || 0) +
        (parseFloat(cs.borderTopWidth) || 0) +
        (parseFloat(cs.borderBottomWidth) || 0);
      if (expanded[section] && counts[section] === 0) overhead += 8;
      visibleZones++;
    }
    overhead += Math.max(0, visibleZones - 1) * (parseFloat(viewStyle.rowGap) || 0);
    return overhead;
  }
  function solveDimensions(minCardWidth = absoluteCardFloor, {ignoreHeight=false, safeInsetOverride=null}={}) {
    const layoutWidth = measuredDeckWidth();
    const safeInset = safeInsetOverride == null
      ? Math.min(8, Math.max(1, layoutWidth * 0.012))
      : Math.max(0, Number(safeInsetOverride) || 0);
    const usableWidth = Math.max(1, layoutWidth - safeInset * 2);
    const viewHeight = Math.max(1, dom.visualDeckView.getBoundingClientRect().height);
    const overhead = measuredOverhead();
    const availableCardHeight = ignoreHeight ? 1e9 : Math.max(0, viewHeight - overhead);
    const geometry = computeDeckLayoutGeometry({
      usableWidth,
      availableCardHeight,
      mainCount: counts.main,
      extraCount: counts.extra,
      sideCount: counts.side,
      expandedMain: expanded.main,
      expandedExtra: expanded.extra,
      expandedSide: expanded.side,
      maxCardWidth,
      minCardWidth,
      ratio,
    });
    return {layoutWidth, safeInset, usableWidth, viewHeight, overhead, availableCardHeight, ...geometry};
  }
  let dims = null;
  for (let pass = 0; pass < 3; pass++) {
    dims = solveDimensions();
    const compact = dims.cardWidth < 66;
    const ultra = dims.cardWidth < 46;
    const changed =
      dom.visualDeckView.classList.contains('compact-layout') !== compact ||
      dom.visualDeckView.classList.contains('ultra-compact-layout') !== ultra;
    dom.visualDeckView.classList.toggle('compact-layout', compact);
    dom.visualDeckView.classList.toggle('ultra-compact-layout', ultra);
    if (!changed) break;
    void dom.visualDeckView.offsetHeight;
  }
  const widthOnly = computeDeckLayoutGeometry({
    usableWidth: dims.usableWidth,
    availableCardHeight: 1e9,
    mainCount: counts.main,
    extraCount: counts.extra,
    sideCount: counts.side,
    expandedMain: expanded.main,
    expandedExtra: expanded.extra,
    expandedSide: expanded.side,
    maxCardWidth,
    minCardWidth: absoluteCardFloor,
    ratio,
  });
  const scrollCardFloor = Math.min(
    widthOnly.cardWidth,
    Math.max(30, widthOnly.cardWidth * 0.68)
  );
  const shouldScroll = Boolean(
    dims.totalRows &&
    widthOnly.cardWidth > absoluteCardFloor &&
    dims.cardWidth + 0.25 < scrollCardFloor
  );
  dom.visualDeckView.classList.toggle('allow-deck-scroll', shouldScroll);
  void dom.visualDeckView.offsetWidth;
  dims = shouldScroll
    ? solveDimensions(absoluteCardFloor, {ignoreHeight:true, safeInsetOverride:0})
    : solveDimensions(absoluteCardFloor);
  const dpr=window.devicePixelRatio||1,snap=v=>Math.round(v*dpr)/dpr;
  for(const k of ['cardWidth','cardHeight','gap','mainStep','fanStep']) dims[k]=snap(dims[k]);
  const {
    cardWidth, cardHeight, gap, baselineWidth, mainStep, fanStep,
    mainGridHeight, cols, mainRows, usableWidth,
  } = dims;
  const hw=snap(cardWidth*1.045),hh=snap(cardHeight*1.045),setHover=(n,x,y)=>{n.style.setProperty('--deck-hover-left',`${snap((cardWidth-hw)*x)}px`);n.style.setProperty('--deck-hover-top',`${snap((cardHeight-hh)*y)}px`);n.style.setProperty('--deck-hover-width',`${hw}px`);n.style.setProperty('--deck-hover-height',`${hh}px`);};
  dom.visualDeckView.style.setProperty('--layout-card-width', `${cardWidth}px`);
  dom.visualDeckView.style.setProperty('--layout-card-height', `${cardHeight}px`);
  dom.visualDeckView.style.setProperty('--layout-card-gap', `${gap}px`);
  dom.visualDeckView.style.setProperty('--main-cols', String(cols));
  dom.visualDeckView.style.setProperty('--main-step', `${mainStep}px`);
  dom.visualDeckView.style.setProperty('--main-grid-width', `${baselineWidth}px`);
  dom.visualDeckView.style.setProperty('--fan-step', `${fanStep}px`);
  dom.visualDeckView.style.setProperty('--deck-scroll-width', `${dims.layoutWidth}px`);
  const badgeSize = Math.min(19, Math.max(3, cardWidth * 0.27));
  const badgeFont = Math.max(2.5, badgeSize * 0.57);
  const badgeBorder = Math.max(0.45, badgeSize * 0.10);
  dom.visualDeckView.style.setProperty('--deck-badge-size', `${badgeSize}px`);
  dom.visualDeckView.style.setProperty('--deck-badge-font', `${badgeFont}px`);
  dom.visualDeckView.style.setProperty('--deck-badge-border', `${badgeBorder}px`);
  const compact = cardWidth < 66;
  const ultra = cardWidth < 46;
  dom.visualDeckView.classList.toggle('compact-layout', compact);
  dom.visualDeckView.classList.toggle('ultra-compact-layout', ultra);
  const sharedWidth = Math.min(usableWidth, baselineWidth);
  if (expanded.main && counts.main) {
    dom.mainDeck.style.setProperty('width', `${sharedWidth}px`, 'important');
    dom.mainDeck.style.setProperty('height', `${mainGridHeight}px`, 'important');
    dom.mainDeck.style.setProperty('margin-left', 'auto', 'important');
    dom.mainDeck.style.setProperty('margin-right', 'auto', 'important');
    dom.mainDeck.style.setProperty('grid-template-columns',
      `${cols > 1 ? `repeat(${cols - 1}, ${mainStep}px) ` : ''}${cardWidth}px`, 'important');
    dom.mainDeck.style.setProperty('grid-auto-rows', `${cardHeight}px`, 'important');
    dom.mainDeck.style.setProperty('column-gap', '0px', 'important');
    dom.mainDeck.style.setProperty('row-gap', `${gap}px`, 'important');
  } else {
    dom.mainDeck.style.setProperty('width', '0px', 'important');
    dom.mainDeck.style.setProperty('height', '0px', 'important');
  }
  dom.mainDeck.dataset.overlap = String(counts.main > 40 && mainStep < cardWidth + gap - 0.5);
  const mainNodes = [...dom.mainDeck.querySelectorAll('.deck-card')];
  mainNodes.forEach((node, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    node.style.setProperty('margin', '0', 'important');
    node.style.zIndex = String(row * 100 + col + 1);
    const xOrigin = col === 0 ? 'left' : (col === cols - 1 ? 'right' : 'center');
    const yOrigin = row === 0 ? 'top' : (row === mainRows - 1 ? 'bottom' : 'center');
    node.style.transformOrigin = `${xOrigin} ${yOrigin}`;
    setHover(node,xOrigin==='left'?0:xOrigin==='right'?1:.5,yOrigin==='top'?0:yOrigin==='bottom'?1:.5);
  });
  for (const [section, container] of [[SECTION_EXTRA, dom.extraDeck], [SECTION_SIDE, dom.sideDeck]]) {
    const count = counts[section];
    if (!expanded[section]) {
      container.style.setProperty('width', '0px', 'important');
      container.style.setProperty('height', '0px', 'important');
      continue;
    }
    container.style.setProperty('width', count ? `${sharedWidth}px` : '0px', 'important');
    container.style.setProperty('height', count ? `${cardHeight}px` : '0px', 'important');
    container.style.setProperty('margin-left', 'auto', 'important');
    container.style.setProperty('margin-right', 'auto', 'important');
    container.style.setProperty('--fan-step', `${fanStep}px`);
    container.dataset.overlap = String(count > 1 && fanStep < cardWidth + gap - 0.5);
    [...container.querySelectorAll('.deck-card')].forEach((node, index) => {
      node.style.setProperty('margin-top', '0', 'important');
      node.style.setProperty('margin-right', '0', 'important');
      node.style.setProperty('margin-bottom', '0', 'important');
      node.style.setProperty('margin-left', index === 0 ? '0px' : `${fanStep - cardWidth}px`, 'important');
      node.style.zIndex = String(index + 1);
      const xOrigin = index === 0 ? 'left' : (index === 14 ? 'right' : 'center');
      node.style.transformOrigin = `${xOrigin} center`;
      setHover(node,xOrigin==='left'?0:xOrigin==='right'?1:.5,.5);
    });
  }
}
function renderDeck() {
  renderDeckGrid(SECTION_MAIN, dom.mainDeck);
  renderDeckGrid(SECTION_EXTRA, dom.extraDeck);
  renderDeckGrid(SECTION_SIDE, dom.sideDeck);
  updateCounts();
  if (state.deckView === 'list') renderDeckList();
  renderDeckSelection();
  scheduleDeckLayout();
}
function cardVisualType(card) {
  const bucket = cardTypeBucket(card);
  const frame = String(card?.frameType || '').toLocaleLowerCase();
  const type = String(card?.type || '').toLocaleLowerCase();
  if (bucket === 'Spell') return {key:'spell', label:`${card.race || 'Normal'} Spell`};
  if (bucket === 'Trap') return {key:'trap', label:`${card.race || 'Normal'} Trap`};
  const isPendulum = bucket === 'Monster' && (frame.includes('pendulum') || type.includes('pendulum'));
  if (isPendulum) {
    if (frame.includes('fusion') || type.includes('fusion')) return {key:'fusion-pendulum', label:'Pendulum Fusion Monster'};
    if (frame.includes('synchro') || type.includes('synchro')) return {key:'synchro-pendulum', label:'Pendulum Synchro Monster'};
    if (frame.includes('xyz') || type.includes('xyz')) return {key:'xyz-pendulum', label:'Pendulum Xyz Monster'};
    if (frame.includes('link') || type.includes('link')) return {key:'link-pendulum', label:'Pendulum Link Monster'};
    if (frame.includes('ritual') || type.includes('ritual')) return {key:'ritual-pendulum', label:'Pendulum Ritual Monster'};
    if (frame.includes('normal') || type.includes('normal monster')) return {key:'normal-pendulum', label:'Pendulum Normal Monster'};
    return {key:'effect-pendulum', label:'Pendulum Effect Monster'};
  }
  if (frame.includes('fusion') || type.includes('fusion')) return {key:'fusion', label:'Fusion Monster'};
  if (frame.includes('synchro') || type.includes('synchro')) return {key:'synchro', label:'Synchro Monster'};
  if (frame.includes('xyz') || type.includes('xyz')) return {key:'xyz', label:'Xyz Monster'};
  if (frame.includes('link') || type.includes('link')) return {key:'link', label:'Link Monster'};
  if (frame.includes('ritual') || type.includes('ritual')) return {key:'ritual', label:'Ritual Monster'};
  if (frame.includes('normal') || type.includes('normal monster')) return {key:'normal', label:'Normal Monster'};
  if (bucket === 'Monster') return {key:'effect', label:'Effect Monster'};
  return {key:'other', label:'Other'};
}
function renderZoneBreakdown(section) {
  const node = ({main:dom.mainBreakdown, extra:dom.extraBreakdown, side:dom.sideBreakdown})[section];
  if (!node) return;
  const order=[
    'normal','normal-pendulum','effect','effect-pendulum','ritual','ritual-pendulum',
    'fusion','fusion-pendulum','synchro','synchro-pendulum','xyz','xyz-pendulum',
    'link','link-pendulum','spell','trap','other',
  ];
  const counts=new Map(), labels=new Map();
  for (const entry of state.deck[section]) {
    const card=state.indexes.byId.get(Number(entry.id));
    const info=cardVisualType(card);
    counts.set(info.key,(counts.get(info.key)||0)+1); labels.set(info.key,info.label);
  }
  node.replaceChildren();
  for (const key of order) {
    const count=counts.get(key)||0; if(!count) continue;
    const item=el('span','breakdown-item'); item.title=labels.get(key)||key;
    item.append(el('i',`type-swatch swatch-${key}`));
    item.append(el('b','',`[${count}]`)); node.append(item);
  }
}
function mainDeckEfficiencyTone(count) {
  const n = Number(count) || 0;
  if (n < 40 || n > 60) return 'bad';
  if (n === 40) return 'optimal';
  if (n <= 42) return 'good';
  if (n <= 50) return 'warn';
  return 'bad';
}
function auxiliaryDeckTone(count) {
  const n = Number(count) || 0;
  if (n === 15) return 'optimal';
  if (n > 0) return 'warn';
  return 'neutral';
}
function sectionCountTone(section, count) {
  return section === SECTION_MAIN ? mainDeckEfficiencyTone(count) : auxiliaryDeckTone(count);
}
function updateCounts() {
  const toneClasses = ['tone-optimal','tone-good','tone-warn','tone-bad','tone-neutral'];
  const zoneToneClasses = ['zone-tone-optimal','zone-tone-good','zone-tone-warn','zone-tone-bad','zone-tone-neutral'];
  for (const section of SECTION_ORDER) {
    const count = state.deck[section].length;
    const node = ({main:dom.mainCount, extra:dom.extraCount, side:dom.sideCount})[section];
    const tone = sectionCountTone(section, count);
    node.textContent = `${count} / ${SECTION_LIMITS[section]}`;
    node.classList.remove('full', ...toneClasses);
    node.classList.add(`tone-${tone}`);
    const zone = node.closest('.deck-zone');
    if (zone) {
      zone.classList.remove(...zoneToneClasses);
      zone.classList.add(`zone-tone-${tone}`);
    }
    renderZoneBreakdown(section);
  }
}
function renderDeckSelection() {
  $$('.deck-card.selected, .deck-table tr.selected').forEach(n => {
    n.classList.remove('selected');
  });
  const uids = state.selectedEntryUids.size ? [...state.selectedEntryUids] : (state.selectedEntryUid == null ? [] : [state.selectedEntryUid]);
  for (const uid of uids) document.querySelectorAll(`[data-uid="${uid}"]`).forEach(n => {
    n.classList.add('selected');
  });
}
function setDeckListSort(section,key) {
  const same=state.deckSort===key && state.deckSortSections.size===1 && state.deckSortSections.has(section);
  state.deckSort=key;
  state.deckSortSections=new Set([section]);
  state.deckSortTypes=new Set();
  state.deckSortTypeMode='Any';
  state.deckSortDirection=same && state.deckSortDirection==='asc' ? 'desc' : 'asc';
  syncDeckSortLegacyScope();
  updateDeckSortSummary();
  applyDeckSort(false);
  persistState();
}
function createDeckListSortHeader(label,key,section) {
  const th=el('th');
  const active=state.deckSort===key && state.deckSortSections.size===1 && state.deckSortSections.has(section);
  if(active) th.setAttribute('aria-sort',state.deckSortDirection==='asc'?'ascending':'descending');
  const btn=el('button',`deck-list-sort-btn${active?' active':''}`);
  btn.type='button';
  btn.dataset.deckListSort=key;
  btn.title=`${deckSortModeTooltip(key)} · ${SECTION_LABELS[section]} only`;
  btn.append(document.createTextNode(label));
  if(active) btn.append(el('span','deck-list-sort-indicator',state.deckSortDirection==='asc'?'v':'^'));
  btn.addEventListener('click',ev=>{ev.stopPropagation();setDeckListSort(section,key);});
  th.append(btn);
  return th;
}
function createDeckListTypeChips(card) {
  const wrap=el('div','deck-list-chip-group');
  const typeChip=createMetadataTypeChip(card);
  const raceChip=createMetadataRaceChip(card);
  if(typeChip) wrap.append(typeChip);
  if(raceChip) wrap.append(raceChip);
  return wrap;
}
function createDeckListAttributeChip(card) {
  return createMetadataAttributeChip(card) || document.createDocumentFragment();
}
function createDeckListLinkArrowIndicator(card) {
  const diagram=createLinkArrowDiagram(card);
  if(!diagram) return null;
  diagram.classList.add('deck-list-link-diagram');
  const wrap=el('div','deck-list-link-indicator');
  wrap.append(diagram);
  return wrap;
}
const DECK_LIST_COLUMN_DEFS = Object.freeze([
  {key:'index', label:'#', min:24, dense:22, width:26},
  {key:'art', label:'', min:26, dense:22, width:28},
  {key:'card', label:'Card', min:130, dense:108, width:null, sort:'name'},
  {key:'level', label:'Level / Rank', shortLabel:'Lvl / Rank', min:44, dense:36, width:48, sort:'level'},
  {key:'attribute', label:'Attribute', shortLabel:'Attr.', min:44, dense:36, width:50, sort:'attribute'},
  {key:'type', label:'Type', min:62, dense:48, width:72, sort:'detail'},
  {key:'race', label:'Subtype', min:62, dense:48, width:72, sort:'race'},
  {key:'atk', label:'ATK', min:40, dense:34, width:44, sort:'atk'},
  {key:'def', label:'DEF', min:40, dense:34, width:44, sort:'def'},
  {key:'scale', label:'Scale', min:40, dense:34, width:44, sort:'scale'},
  {key:'archetype', label:'Archetype', shortLabel:'Arch.', min:66, dense:50, width:78, sort:'archetype'},
  {key:'link-rating', label:'Link', title:'Link Rating', min:38, dense:30, width:42, sort:'link-rating'},
  {key:'link-arrows', label:'Arrows', title:'Link Arrows', min:40, dense:32, width:44, sort:'link-arrows'},
  {key:'link-material', label:'Materials', shortLabel:'Mat.', min:72, dense:52, width:84, sort:'link-material'},
]);
const DECK_LIST_COLUMN_BY_KEY = new Map(DECK_LIST_COLUMN_DEFS.map(def=>[def.key,def]));
const DECK_LIST_SEMANTIC_ORDER = Object.freeze(['level','attribute','type','race','atk','def','scale','link-rating','link-arrows','link-material','archetype']);
function activeDeckListPriorityColumns() {
  const active=new Set();
  if(state.deckSort==='detail') active.add('type');
  else if(state.deckSort==='race') active.add('race');
  else if(state.deckSort==='attribute') active.add('attribute');
  else if(state.deckSort==='level') active.add('level');
  else if(state.deckSort==='atk') active.add('atk');
  else if(state.deckSort==='def') active.add('def');
  else if(state.deckSort==='scale') active.add('scale');
  else if(state.deckSort==='archetype') active.add('archetype');
  else if(state.deckSort==='link-rating') active.add('link-rating');
  else if(state.deckSort==='link-arrows') active.add('link-arrows');
  else if(state.deckSort==='link-material') active.add('link-material');
  return active;
}
function currentDeckCards() {
  const cards=[];
  for(const section of SECTION_ORDER) for(const entry of state.deck[section] || []) {
    const card=state.indexes.byId.get(Number(entry.id));
    if(card) cards.push(card);
  }
  return cards;
}
function deckListApplicableSemanticKeys() {
  return semanticKeysPresentInCards(currentDeckCards());
}
function deckListColumnRenderOrder() {
  const applicable=deckListApplicableSemanticKeys();
  return ['index','art','card',...DECK_LIST_SEMANTIC_ORDER.filter(key=>applicable.has(key))];
}
function manualDeckListColumnWidth(key) {
  const value=Number(state.deckListColumnWidths?.[key]);
  return Number.isFinite(value) ? Math.max(28,Math.min(720,Math.round(value))) : null;
}
function deckListColumnMinimum(key,{tight=false}={}) {
  const manual=manualDeckListColumnWidth(key);
  if(manual!=null && key!=='card') return manual;
  const def=DECK_LIST_COLUMN_BY_KEY.get(key);
  return Number(tight ? (def?.dense ?? def?.min ?? 34) : (def?.min ?? 44));
}
function deckListFixedCost(keys,{tight=false,gap=4}={}) {
  return keys.reduce((sum,key)=>sum+(key==='card'?0:deckListColumnMinimum(key,{tight})),0)+Math.max(0,keys.length-1)*gap;
}
function buildDeckListColumnLayout(width,{tight=false}={}) {
  const gap=tight?3:4;
  const manualCard=manualDeckListColumnWidth('card');
  const cardPreferred=manualCard ?? Math.max(tight?185:235,preferredDeckListNameWidth());
  const priority=activeDeckListPriorityColumns();
  const applicable=deckListApplicableSemanticKeys();
  const selected=new Set(['index','art',...DECK_LIST_SEMANTIC_ORDER.filter(key=>applicable.has(key) && priority.has(key))]);
  const order=deckListColumnRenderOrder();
  const visible=()=>order.filter(key=>key==='card' || selected.has(key));
  for(const key of DECK_LIST_SEMANTIC_ORDER) {
    if(!applicable.has(key) || selected.has(key)) continue;
    selected.add(key);
    const remaining=Math.max(0,width-deckListFixedCost(visible(),{tight,gap}));
    if(remaining<cardPreferred) selected.delete(key);
  }
  return {visible:visible(),priority,tight,gap};
}
function chooseDeckListColumns(availableWidth) {
  const width=Math.max(180,Math.floor(Number(availableWidth)||0));
  return buildDeckListColumnLayout(width,{tight:width<620});
}
function deckListColumnTemplate(key,{tight=false}={}) {
  const manual=manualDeckListColumnWidth(key);
  if(key==='card') {
    if(manual!=null) return `${manual}px`;
    const floor=tight?108:130;
    return `minmax(${floor}px,1fr)`;
  }
  if(manual!=null) return `${manual}px`;
  const def=DECK_LIST_COLUMN_BY_KEY.get(key);
  const width=tight ? (def?.dense ?? def?.min ?? 34) : (def?.width ?? def?.min ?? 44);
  return `${width}px`;
}
let lastDeckListLayoutSignature='';
let deckListResizeObserver=null;
let deckListResizeRaf=0;
function updateDeckListColumnLayout() {
  if(!dom.listDeckView || state.deckView!=='list') return;
  const width=Math.max(0,dom.listDeckView.clientWidth-18);
  if(width<=0) return;
  const layout=chooseDeckListColumns(width);
  const manualSig=layout.visible.map(key=>`${key}:${manualDeckListColumnWidth(key)??''}`).join(';');
  const signature=`${layout.tight?'1':'0'}|${layout.visible.join(',')}|${[...layout.priority].sort().join(',')}|${manualSig}`;
  if(signature===lastDeckListLayoutSignature) return;
  lastDeckListLayoutSignature=signature;
  dom.listDeckView.classList.add('deck-list-responsive');
  dom.listDeckView.classList.toggle('deck-list-tight',layout.tight);
  dom.listDeckView.style.setProperty('--deck-list-template',layout.visible.map(key=>deckListColumnTemplate(key,layout)).join(' '));
  dom.listDeckView.style.setProperty('--deck-list-gap',`${layout.gap}px`);
  const visible=new Set(layout.visible);
  for(const def of DECK_LIST_COLUMN_DEFS) dom.listDeckView.classList.toggle(`show-deck-col-${searchLayoutClassToken(def.key)}`,visible.has(def.key));
}
function setupDeckListColumnResizeObserver() {
  if(deckListResizeObserver || !('ResizeObserver' in window) || !dom.listDeckView) return;
  deckListResizeObserver=new ResizeObserver(()=>{
    if(deckListResizeRaf) cancelAnimationFrame(deckListResizeRaf);
    deckListResizeRaf=requestAnimationFrame(()=>{deckListResizeRaf=0;updateDeckListColumnLayout();});
  });
  deckListResizeObserver.observe(dom.listDeckView);
}
function deckListMeasureText(textValue,node) {
  const value=String(textValue || '');
  if(!value) return 0;
  const canvas=deckListMeasureText.canvas || (deckListMeasureText.canvas=document.createElement('canvas'));
  const ctx=canvas.getContext('2d');
  const style=node ? getComputedStyle(node) : null;
  if(style) ctx.font=`${style.fontStyle || 'normal'} ${style.fontWeight || '400'} ${style.fontSize || '10px'} ${style.fontFamily || 'sans-serif'}`;
  else ctx.font='700 10px sans-serif';
  const letterSpacing=style ? parseFloat(style.letterSpacing) || 0 : 0;
  return ctx.measureText(value).width+Math.max(0,value.length-1)*letterSpacing;
}
function deckListAutoFitContentWidth(def) {
  const key=def?.key;
  if(!key || !dom.listDeckView) return null;
  if(key==='index') return 30;
  if(key==='art') return 32;
  if(key==='attribute') return 42;
  if(key==='link-arrows') return 38;
  const header=dom.listDeckView.querySelector(`th[data-deck-list-col="${key}"]`);
  const headerText=def.shortLabel || def.label || '';
  let best=deckListMeasureText(headerText,header?.querySelector('.deck-list-sort-btn') || header)+18;
  const cells=[...dom.listDeckView.querySelectorAll(`td[data-deck-list-col="${key}"]`)];
  for(const cell of cells) {
    let value='';
    let sample=cell;
    if(key==='card') { sample=cell.querySelector('.deck-list-card-name') || cell; value=sample.textContent || ''; }
    else if(key==='type') { sample=cell.querySelector('.detail-meta-chip') || cell; value=sample.getAttribute?.('aria-label') || sample.dataset?.tooltip || sample.title || sample.textContent || ''; }
    else if(key==='race') { sample=cell.querySelector('.detail-meta-chip') || cell; value=sample.getAttribute?.('aria-label') || sample.dataset?.tooltip || sample.title || sample.textContent || ''; }
    else value=cell.title || cell.textContent || '';
    best=Math.max(best,deckListMeasureText(value,sample)+14);
    const symbol=cell.querySelector?.('.metadata-symbol-icon');
    if(symbol) best=Math.max(best,34);
  }
  return Math.ceil(best);
}
function autoFitDeckListColumn(def) {
  if(!def || !dom.listDeckView) return;
  const key=def.key;
  const floor=key==='index'?22:key==='art'?24:key==='card'?90:28;
  const measured=deckListAutoFitContentWidth(def);
  if(!Number.isFinite(measured)) return;
  const maximum=key==='index'?72:key==='art'?120:key==='card'?560:520;
  state.deckListColumnWidths[key]=Math.max(floor,Math.min(maximum,Math.round(measured)));
  lastDeckListLayoutSignature='';
  updateDeckListColumnLayout();
  persistState();
}
function attachDeckListColumnResizer(th,def) {
  if(!th || !def) return;
  th.classList.add('deck-list-resizable-header');
  const handle=el('span','deck-list-column-resize-handle');
  handle.title='Drag to resize this Deck List column. Double-click to auto-fit it to its contents.';
  handle.setAttribute('aria-hidden','true');
  handle.addEventListener('pointerdown',event=>{
    if(event.button!==0) return;
    event.preventDefault(); event.stopPropagation();
    const startX=event.clientX;
    const hardFloor=def.key==='index'?22:def.key==='art'?24:def.key==='card'?90:28;
    const startWidth=Math.max(hardFloor,th.getBoundingClientRect().width);
    handle.setPointerCapture?.(event.pointerId);
    document.body.classList.add('deck-list-column-resizing');
    const onMove=move=>{
      const minimum=def.key==='index'?22:def.key==='art'?24:def.key==='card'?90:Math.max(28,Number(def.dense||def.min||28));
      const maximum=def.key==='index'?72:def.key==='art'?120:720;
      const next=Math.max(minimum,Math.min(maximum,Math.round(startWidth+(move.clientX-startX))));
      state.deckListColumnWidths[def.key]=next;
      lastDeckListLayoutSignature='';
      updateDeckListColumnLayout();
    };
    const finish=()=>{
      handle.removeEventListener('pointermove',onMove);
      handle.removeEventListener('pointerup',finish);
      handle.removeEventListener('pointercancel',finish);
      document.body.classList.remove('deck-list-column-resizing');
      persistState();
    };
    handle.addEventListener('pointermove',onMove);
    handle.addEventListener('pointerup',finish,{once:true});
    handle.addEventListener('pointercancel',finish,{once:true});
  });
  handle.addEventListener('dblclick',event=>{
    event.preventDefault(); event.stopPropagation();
    autoFitDeckListColumn(def);
  });
  th.append(handle);
}
function createDeckListHeaderCell(def,section) {
  let th;
  if(def.sort) th=createDeckListSortHeader(def.shortLabel || def.label,def.sort,section);
  else th=el('th','',def.shortLabel || def.label || '');
  th.dataset.deckListCol=def.key;
  if(def.title || def.label) th.title=def.title || def.label;
  if(activeDeckListPriorityColumns().has(def.key)) th.classList.add('deck-list-priority-column');
  attachDeckListColumnResizer(th,def);
  return th;
}
function createDeckListCell(key,card,entry,index) {
  const td=el('td',`deck-list-col-${key.replaceAll('-','_')}`);
  td.dataset.deckListCol=key;
  if(key==='index') { td.classList.add('deck-list-index'); td.textContent=String(index+1); return td; }
  if(key==='art') {
    td.classList.add('deck-list-art-cell');
    const artWrap=el('span','deck-list-art-wrap');
    if(card) {
      const img=new Image();
      img.className='mini-art'; img.src=imageUrlFor(card,entry.id,true); img.alt=''; img.draggable=false;
      artWrap.append(img);
      const badge=createLimitBadge(cardLimitStatus(card,state.banlist));
      if(badge){badge.classList.add('deck-list-limit-badge');artWrap.append(badge);}
    }
    td.append(artWrap); return td;
  }
  if(key==='card') {
    td.classList.add('deck-list-card-cell');
    td.append(el('span','deck-list-card-name',card?.name || `Unknown ${entry.id}`));
    return td;
  }
  if(!card) return td;
  if(key==='type') { const chip=createMetadataTypeChip(card); if(chip) td.append(chip); return td; }
  if(key==='race') { const chip=createMetadataRaceChip(card); if(chip) td.append(chip); return td; }
  if(key==='attribute') { const chip=createMetadataAttributeChip(card); if(chip) td.append(chip); return td; }
  if(key==='link-arrows') { const indicator=createDeckListLinkArrowIndicator(card); if(indicator) td.append(indicator); return td; }
  if(key==='scale') { const scale=cardScaleValue(card); if(scale!=null){ td.textContent=String(scale); td.title=`Scale ${scale}`; } return td; }
  const value=searchSemanticValue(key,card);
  if(value) { td.textContent=value; td.title=value; }
  return td;
}
function renderDeckList() {
  dom.listDeckView.replaceChildren();
  lastDeckListLayoutSignature='';
  const columnOrder=deckListColumnRenderOrder();
  for (const section of SECTION_ORDER) {
    const collapsed=deckZoneIsCollapsed(section);
    const wrap = el('section', `deck-list-section${collapsed?' list-zone-collapsed':''}`);
    wrap.dataset.section=section;
    const heading=el('div','deck-list-heading');
    const collapseBtn=el('button','icon-btn list-zone-collapse-btn',collapsed?'v':'^');
    collapseBtn.type='button'; collapseBtn.dataset.listZoneToggle=section; collapseBtn.setAttribute('aria-expanded',String(!collapsed));
    collapseBtn.title=`${collapsed?'Expand':'Collapse'} ${SECTION_LABELS[section]}`;
    collapseBtn.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();setDeckZoneCollapsed(section,!wrap.classList.contains('list-zone-collapsed'));});
    heading.append(collapseBtn,el('h3','',`${SECTION_LABELS[section]} · ${state.deck[section].length}`));
    wrap.append(heading);
    wrap.addEventListener('dragover',ev=>{
      if(ev.target.closest?.('tr[data-uid]') || (!state.dragged && !ev.dataTransfer?.types?.includes('Files'))) return;
      ev.preventDefault();ev.stopPropagation();wrap.classList.add('drag-over');
      ev.dataTransfer.dropEffect=ev.dataTransfer?.types?.includes('Files')?'copy':(state.dragged?.source==='search'?'copy':'move');
    });
    wrap.addEventListener('dragleave',ev=>{if(!wrap.contains(ev.relatedTarget))wrap.classList.remove('drag-over');});
    wrap.addEventListener('drop',async ev=>{
      if(ev.target.closest?.('tr[data-uid]')) return;
      const hasFile=Boolean(ev.dataTransfer?.files?.length || ev.dataTransfer?.types?.includes('Files'));
      if(hasFile){ev.preventDefault();ev.stopPropagation();wrap.classList.remove('drag-over');await readDroppedDeck(ev.dataTransfer);finishDrag();return;}
      if(!state.dragged) return;
      ev.preventDefault();ev.stopPropagation();wrap.classList.remove('drag-over');handleDrop(section,null,false);
    });
    const table = el('table', 'deck-table');
    table.hidden=collapsed;
    table.setAttribute('aria-hidden',String(collapsed));
    const thead=el('thead');
    const headRow=el('tr');
    for(const key of columnOrder) headRow.append(createDeckListHeaderCell(DECK_LIST_COLUMN_BY_KEY.get(key),section));
    thead.append(headRow); table.append(thead);
    const tbody = el('tbody');
    state.deck[section].forEach((entry,index) => {
      const card = state.indexes.byId.get(Number(entry.id));
      const row = el('tr'); row.dataset.uid = entry.uid; row.dataset.section = section; row.draggable = true;
      if (state.selectedEntryUids.has(Number(entry.uid)) || state.selectedEntryUid === entry.uid) row.classList.add('selected');
      if (card) {
        row.addEventListener('pointerenter', () => setHoverPreview(card, entry.uid, entry.id));
        row.addEventListener('pointerleave', () => clearHoverPreview(entry.uid));
      }
      for(const key of columnOrder) row.append(createDeckListCell(key,card,entry,index));
      row.addEventListener('click', ev => {
        ev.stopPropagation();
        if (!card) return;
        if (ev.altKey) duplicateEntries(actionUids(entry.uid));
        else if (ev.shiftKey) selectEntryRange(entry.uid, {additive: ev.ctrlKey || ev.metaKey});
        else if (ev.ctrlKey) selectCard(card, entry.uid, entry.id, {additive:true, toggle:true});
        else if (ev.metaKey) selectCard(card, entry.uid, entry.id, {additive:true, toggle:true});
        else if (state.selectedEntryUids.size <= 1 && state.selectedEntryUid === entry.uid) openArt(card, entry.id);
        else selectCard(card, entry.uid);
      });
      row.addEventListener('contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); const uids=actionUids(entry.uid); if (ev.ctrlKey) toggleEntriesSide(uids); else removeEntries(uids); });
      row.addEventListener('dragstart', ev => { if(!state.selectedEntryUids.has(Number(entry.uid)))selectCard(card,entry.uid); const uids=actionUids(entry.uid); state.dragged={source:'deck',uid:entry.uid,uids,section}; state.lastDropHandled=false; setDeckDraggingGhosts(uids); $('.deck-panel').classList.add('drag-active'); ev.dataTransfer.effectAllowed='move'; ev.dataTransfer.setData('application/x-ygo-card',JSON.stringify(state.dragged)); setDeckDragImage(ev,uids); });
      row.addEventListener('dragover', ev => { ev.preventDefault(); });
      row.addEventListener('drop', async ev => {
        ev.preventDefault();
        const hasFile=Boolean(ev.dataTransfer?.files?.length || ev.dataTransfer?.types?.includes('Files'));
        if(hasFile){ev.stopPropagation();await readDroppedDeck(ev.dataTransfer);finishDrag();return;}
        handleDrop(section, entry.uid, ev.clientY > row.getBoundingClientRect().top + row.getBoundingClientRect().height/2);
      });
      row.addEventListener('dragend', finishDrag);
      tbody.append(row);
    });
    table.append(tbody); wrap.append(table); dom.listDeckView.append(wrap);
  }
  updateDeckListColumnLayout();
}
function handleDrop(section, targetUid = null, after = false) {
  if (!state.dragged) return;
  state.lastDropHandled = true;
  if (state.dragged.source === 'search') {
    const card = state.indexes.byId.get(Number(state.dragged.cardId));
    if (card) {
      const ok = addCard(card, section);
      if (ok && targetUid != null) moveEntry(state.selectedEntryUid, section, targetUid, after);
    }
  } else if (state.dragged.source === 'deck') moveEntries(state.dragged.uids?.length ? state.dragged.uids : [state.dragged.uid], section, targetUid, after);
  finishDrag();
}
function finishDrag() {
  $$('.dragging').forEach(n => n.classList.remove('dragging'));
  $$('.drag-over').forEach(n => n.classList.remove('drag-over'));
  $('.deck-panel')?.classList.remove('drag-active');
  document.body.classList.remove('deck-drag-remove');
  state.dragged = null;
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function metadataCardTypeKey(card) {
  const type=String(card?.type || '').toLocaleLowerCase();
  const frame=String(card?.frameType || '').toLocaleLowerCase();
  const pendulum=type.includes('pendulum') || frame.includes('pendulum');
  if (!pendulum) return cardVisualType(card).key;
  if (frame.includes('normal') || displayCardType(card).toLocaleLowerCase().includes('normal monster')) return 'pendulum-normal';
  if (type.includes('ritual') || frame.includes('ritual')) return 'pendulum-ritual';
  if (type.includes('fusion') || frame.includes('fusion')) return 'pendulum-fusion';
  if (type.includes('synchro') || frame.includes('synchro')) return 'pendulum-synchro';
  if (type.includes('xyz') || frame.includes('xyz')) return 'pendulum-xyz';
  if (type.includes('link') || frame.includes('link')) return 'pendulum-link';
  if (type.includes('effect') || frame.includes('effect')) return 'pendulum-effect';
  return 'pendulum';
}
function metadataChipClass(value, card, index) {
  if (index === 2) return `detail-meta-chip attr-${String(value).toLocaleLowerCase().replace(/[^a-z0-9]+/g,'-')}`;
  if (index === 0) return `detail-meta-chip card-${metadataCardTypeKey(card)}`;
  return 'detail-meta-chip race-chip';
}
function createMetadataSymbolChip(src, label, className = 'detail-meta-chip') {
  const chip=el('span',`${className} metadata-symbol-chip`.trim());
  chip.title=label;
  const image=new Image();
  image.className='metadata-symbol-icon';
  image.src=`${CARD_SYMBOL_ROOT}${src}`;
  image.alt=label;
  image.draggable=false;
  chip.append(image);
  return chip;
}
function annotateMetadataChipTooltip(chip,label) {
  if(!chip) return null;
  const full=String(label || '').trim();
  if(full) {
    chip.title=full;
    chip.setAttribute('aria-label',full);
  }
  return chip;
}
function createMetadataTypeChip(card) {
  const typeValue=displayCardType(card) || cardVisualType(card).label;
  if(!typeValue) return null;
  const bucket=cardTypeBucket(card);
  const symbol=SPELL_TRAP_KIND_SYMBOLS[bucket];
  const chip=symbol
    ? createMetadataSymbolChip(symbol[0],symbol[1],metadataChipClass(typeValue,card,0))
    : el('strong',metadataChipClass(typeValue,card,0),typeValue);
  return annotateMetadataChipTooltip(chip,typeValue);
}
function createMetadataRaceChip(card) {
  if(!card?.race) return null;
  const bucket=cardTypeBucket(card);
  if(bucket==='Spell' || bucket==='Trap') {
    const key=String(card.race).trim().toLocaleLowerCase().replace(/[_\s]+/g,'-');
    const symbol=SPELL_TRAP_SUBTYPE_SYMBOLS[key];
    if(symbol) return annotateMetadataChipTooltip(createMetadataSymbolChip(symbol[0],`${symbol[1]} ${bucket}`,metadataChipClass(card.race,card,1)),card.race);
    if(key==='normal') return null;
  }
  return annotateMetadataChipTooltip(el('strong',metadataChipClass(card.race,card,1),card.race),card.race);
}
function createMetadataAttributeChip(card) {
  if(!card?.attribute) return null;
  const symbol=ATTRIBUTE_SYMBOLS[String(card.attribute).trim().toLocaleUpperCase()];
  const chip=symbol ? createMetadataSymbolChip(symbol[0],`${symbol[1]} Attribute`,metadataChipClass(card.attribute,card,2)) : el('strong',metadataChipClass(card.attribute,card,2),card.attribute);
  chip.classList.add('attribute-symbol-chip');
  return chip;
}
function restoreCommittedArtworkPreview() {
  const card = previewCard() || selectedCard();
  if (!card) return;
  const artworkId = state.hoverPreview?.artworkId ?? state.selectedArtworkId;
  const image = preferredImage(card,artworkId) || preferredImage(card);
  dom.selectedArt.src = image?.imageUrl || image?.imageUrlSmall || '';
}
function closeArtworkMenu(restore = true) {
  dom.artworkMenu.classList.add('hidden');
  dom.artworkDropdownBtn.setAttribute('aria-expanded','false');
  if (restore) restoreCommittedArtworkPreview();
}
function renderArtworkMenu(card, artworkId, previewing) {
  const images=card.images || [];
  const currentIndex=Math.max(0,images.findIndex(img=>Number(img.id)===Number(artworkId)));
  dom.artworkDropdownBtn.textContent=images.length ? `Artwork ${currentIndex+1}` : 'Default artwork';
  if(previewing){
    dom.artworkMenu.classList.add('hidden');
    dom.artworkDropdownBtn.setAttribute('aria-expanded','false');
    dom.artworkDropdownBtn.disabled=true;
    dom.artworkPrevBtn.disabled=true;
    dom.artworkNextBtn.disabled=true;
    return;
  }
  dom.artworkMenu.replaceChildren();
  images.forEach((img,index)=>{
    const option=el('button','artwork-option'); option.type='button'; option.setAttribute('role','option'); option.dataset.imageId=img.id;
    option.setAttribute('aria-selected',Number(img.id)===Number(artworkId)?'true':'false');
    const thumb=new Image(); thumb.loading='lazy'; thumb.decoding='async'; thumb.src=img.imageUrlSmall || img.imageUrl || ''; thumb.alt=''; thumb.draggable=false;
    option.append(thumb,el('span','',`Artwork ${index+1}`));
    option.addEventListener('pointerenter',()=>{ const preview=preferredImage(card,img.id); if(preview) setSelectedArtSource(preview.imageUrl || preview.imageUrlSmall || '',card.name); });
    option.addEventListener('click',ev=>{ ev.stopPropagation(); applySelectedArtwork(Number(img.id)); closeArtworkMenu(false); });
    dom.artworkMenu.append(option);
  });
  const multiple=images.length>1;
  dom.artworkDropdownBtn.disabled=!multiple; dom.artworkPrevBtn.disabled=!multiple; dom.artworkNextBtn.disabled=!multiple;
}
function setSelectedArtSource(src, alt='') {
  const next=String(src || '');
  const token=++state.selectedArtLoadToken;
  dom.selectedArt.alt=alt;
  if(!next){
    dom.selectedArt.removeAttribute('src');
    dom.selectedArt.dataset.loadedSrc='';
    return;
  }
  if(dom.selectedArt.dataset.loadedSrc===next){
    return;
  }
  const probe=new Image();
  probe.decoding='async';
  const commit=()=>{
    if(token!==state.selectedArtLoadToken) return;
    dom.selectedArt.src=next;
    dom.selectedArt.dataset.loadedSrc=next;
    dom.selectedArt.alt=alt;
  };
  probe.src=next;
  if(probe.complete && probe.naturalWidth>0){ commit(); return; }
  if(typeof probe.decode==='function'){
    probe.decode().then(commit).catch(()=>{
      if(probe.complete && probe.naturalWidth>0) commit();
      else probe.addEventListener('load',commit,{once:true});
    });
  } else probe.addEventListener('load',commit,{once:true});
}
function renderSelectedCard({syncSearchSelection=true}={}) {
  const {card, artworkId, previewing} = displayCardContext();
  if(!previewing) state.renderedHoverKey=null;
  dom.selectedEmpty.classList.add('hidden');
  dom.selectedCard.classList.remove('hidden');
  dom.selectedArt.draggable = false;
  dom.selectedLimitBadge.className = 'limit-badge selected-limit-badge hidden';
  dom.selectedLimitBadge.removeAttribute('src');
  dom.selectedLimitBadge.alt = '';
  dom.selectedLimitBadge.removeAttribute('title');
  dom.selectedLimitBadge.removeAttribute('aria-label');
  if (!card) {
    dom.selectedCard.classList.add('placeholder-state');
    dom.selectedStatus.textContent='No card selected';
    setSelectedArtSource(SELECTED_PLACEHOLDER_SRC,'Card back placeholder');
    dom.artworkMenu.replaceChildren();
    dom.artworkDropdownBtn.textContent = 'Placeholder';
    dom.artworkDropdownBtn.disabled = true;
    dom.artworkDropdownBtn.setAttribute('aria-expanded','false');
    dom.artworkMenu.classList.add('hidden');
    dom.artworkPrevBtn.disabled = true;
    dom.artworkNextBtn.disabled = true;
    dom.detailName.textContent = ' ';
    dom.detailMeta.replaceChildren();
    dom.detailStats.textContent = '';
    dom.detailLinkIndicator?.replaceChildren();
    dom.detailLinkIndicator?.classList.add('hidden');
    dom.detailText.innerHTML = '<span class="card-placeholder-copy">Select a card from Search or from a deck zone.</span>';
    dom.addPrimaryBtn.textContent = 'Add to Main';
    dom.addPrimaryBtn.dataset.section = SECTION_MAIN;
    dom.addPrimaryBtn.disabled = true;
    dom.addSideBtn.disabled = true;
    dom.openArtBtn.disabled = true;
    if(syncSearchSelection) renderSearchSelection();
    return;
  }
  dom.selectedCard.classList.remove('placeholder-state');
  const status = cardLimitStatus(card,state.banlist);
  dom.selectedStatus.textContent = `${previewing ? 'Hover Preview - ' : ''}${displayCardType(card) || 'Card'} - ${status}`;
  const image = preferredImage(card,artworkId) || preferredImage(card);
  setSelectedArtSource(image?.imageUrl || image?.imageUrlSmall || '',card.name);
  if (status !== 'Unlimited') {
    const badge=limitBadge(status);
    dom.selectedLimitBadge.className = 'limit-badge selected-limit-badge';
    dom.selectedLimitBadge.classList.add(badge?.cls || '');
    dom.selectedLimitBadge.src = badge?.src || '';
    dom.selectedLimitBadge.alt = badge?.label || status;
    dom.selectedLimitBadge.title = badge?.label || status;
    dom.selectedLimitBadge.setAttribute('aria-label',badge?.label || status);
  }
  renderArtworkMenu(card, artworkId, previewing);
  dom.detailName.textContent = card.name;
  dom.detailMeta.replaceChildren();
  const addMetaRow = (label,value,valueClass='') => { if (!value && value !== 0) return; const row=el('div','detail-meta-row'); const valueNode=el('strong',`detail-meta-value ${valueClass}`.trim(),String(value)); row.append(el('span','detail-meta-label',label),valueNode); dom.detailMeta.append(row); };
  const statusClass = banStatusClass(status);
  addMetaRow('Archetype',card.archetype || 'None'); addMetaRow('Status',status,statusClass);
  const chips=el('div','detail-meta-chips');
  const selectedAttributeChip=createMetadataAttributeChip(card);
  const selectedTypeChip=createMetadataTypeChip(card);
  const selectedRaceChip=createMetadataRaceChip(card);
  if(selectedAttributeChip) chips.append(selectedAttributeChip);
  if(selectedTypeChip) chips.append(selectedTypeChip);
  if(selectedRaceChip) chips.append(selectedRaceChip);
  if(chips.childNodes.length) dom.detailMeta.append(chips);
  dom.detailLinkIndicator?.replaceChildren();
  const arrowDiagram=createLinkArrowDiagram(card);
  if(arrowDiagram && dom.detailLinkIndicator) {
    dom.detailLinkIndicator.append(el('span','detail-link-indicator-label','Link Arrows'),arrowDiagram);
    dom.detailLinkIndicator.classList.remove('hidden');
  } else dom.detailLinkIndicator?.classList.add('hidden');
  const stats = [];
  const monsterLike=!/spell|trap/i.test(String(card.type||''));
  if (card.linkval != null && cardVisualType(card).key==='link') {
    if(monsterLike) stats.push(`ATK/ ${monsterAtkText(card,{unavailable:'?'})}`);
    stats.push(`LINK-${card.linkval}`);
  } else {
    if (card.level != null && Number.isFinite(Number(card.level)) && Number(card.level)>=0) stats.push(`★${card.level}`);
    if (monsterLike) stats.push(`ATK/ ${monsterAtkText(card,{unavailable:'?'})}`);
    if (monsterLike && monsterHasDefense(card)) stats.push(`DEF/ ${monsterDefText(card,{unavailable:'?'})}`);
  }
  { const scale=cardScaleValue(card); if(scale != null) stats.push(`Scale ${scale}`); }
  dom.detailStats.textContent = stats.join(card?.linkval != null && cardVisualType(card).key==='link' ? ', ' : ' - ');
  if (state.cardTextStyling) dom.detailText.innerHTML = cachedHighlightedCardText(card);
  else dom.detailText.textContent = normalizeCardEffectLayout(card.desc);
  dom.detailText.classList.toggle('plain-card-text', !state.cardTextStyling);
  const primary = autoSection(card);
  dom.addPrimaryBtn.textContent = `Add to ${primary === SECTION_EXTRA ? 'Extra' : 'Main'}`; dom.addPrimaryBtn.dataset.section = primary;
  dom.addPrimaryBtn.disabled=previewing; dom.addSideBtn.disabled=previewing; dom.openArtBtn.disabled=previewing;
  if(syncSearchSelection) renderSearchSelection();
}
function cardReferenceClass(card) {
  return `card-ref card-ref-${cardVisualType(card).key}`;
}
function inferredCardReferenceKey(value) {
  const text=String(value || '').toLocaleLowerCase();
  if (/\bspell\s*\/\s*trap(?: card)?s?\b/.test(text) || /\bspell and trap(?: card)?s?\b/.test(text)) return 'spell-trap';
  if (/\bspell(?: card)?s?\b/.test(text)) return 'spell';
  if (/\btrap(?: card)?s?\b/.test(text)) return 'trap';
  if (/\bfusion\b/.test(text)) return 'fusion';
  if (/\bsynchro\b/.test(text)) return 'synchro';
  if (/\bxyz\b/.test(text)) return 'xyz';
  if (/\blink\b/.test(text)) return 'link';
  if (/\britual\b/.test(text)) return 'ritual';
  if (/\bpendulum\b/.test(text)) return 'pendulum';
  if (/\bnormal monster\b/.test(text)) return 'normal';
  if (/\beffect monster\b/.test(text)) return 'effect';
  return '';
}
const ARCHETYPE_MONSTER_KEYS=['normal','effect','ritual','fusion','synchro','xyz','link','pendulum'];
function buildArchetypeTypeProfiles(cards) {
  const profiles=new Map();
  for (const card of cards || []) {
    const archetype=String(card?.archetype || '').trim();
    if (!archetype) continue;
    const normalized=normalizeName(archetype);
    if (!profiles.has(normalized)) profiles.set(normalized,{name:archetype,total:0,counts:{}});
    const profile=profiles.get(normalized);
    const key=statisticsTypeKey(card);
    profile.total += 1;
    profile.counts[key]=(profile.counts[key] || 0)+1;
  }
  return profiles;
}
function dominantArchetypeKey(profile,monsterOnly=false) {
  if (!profile) return '';
  const allowed=monsterOnly ? ARCHETYPE_MONSTER_KEYS : [...ARCHETYPE_MONSTER_KEYS,'spell','trap','other'];
  const ranked=allowed.map(key=>[key,Number(profile.counts?.[key] || 0)]).filter(([,count])=>count>0).sort((a,b)=>b[1]-a[1]);
  if (!ranked.length) return '';
  return ranked[0][0];
}
function archetypeReferenceKey(raw,start,end,archetype,card=null) {
  const after=raw.slice(end,Math.min(raw.length,end+52));
  const before=raw.slice(Math.max(0,start-34),start);
  const close=`${before.slice(-18)} ${after.slice(0,34)}`;
  const explicit=inferredCardReferenceKey(close);
  if (explicit) return explicit;
  const profile=state.archetypeTypeProfiles.get(normalizeName(archetype));
  if (/^\s*["”']?\s*(?:cards?\s+or\s+)?monsters?\b/i.test(after)) {
    return dominantArchetypeKey(profile,true) || 'effect';
  }
  if (/\bmonsters?\s+["“']?$/i.test(before)) return dominantArchetypeKey(profile,true) || 'effect';
  return '';
}
const ARCHETYPE_REFERENCE_STOP_WORDS = new Set([
  'a','an','and','are','as','at','be','been','being','but','by','for','from','had','has','have','he','her','hers','him','his',
  'if','in','into','is','it','its','of','on','or','our','ours','she','that','the','their','theirs','them','then','there','these',
  'they','this','those','to','was','we','were','when','where','while','who','with','you','your','yours'
]);
function isMeaningfulArchetypeReference(value) {
  const needle=String(value || '').trim();
  if (needle.length<2) return false;
  const normalized=normalizeName(needle);
  if (!normalized || ARCHETYPE_REFERENCE_STOP_WORDS.has(normalized)) return false;
  return true;
}
function markArchetypeReferences(raw,mark) {
  const hay=raw.toLocaleLowerCase();
  for (const archetype of state.archetypeNames || []) {
    const needle=String(archetype || '').trim();
    if (!isMeaningfulArchetypeReference(needle)) continue;
    const low=needle.toLocaleLowerCase();
    let pos=0;
    while ((pos=hay.indexOf(low,pos))>=0) {
      const end=pos+needle.length;
      const before=pos>0?raw[pos-1]:'';
      const after=end<raw.length?raw[end]:'';
      const startsWord=/[\p{L}\p{N}]/u.test(needle[0] || '');
      const endsWord=/[\p{L}\p{N}]/u.test(needle[needle.length-1] || '');
      const leftOK=!startsWord || !/[\p{L}\p{N}_]/u.test(before);
      const rightOK=!endsWord || !/[\p{L}\p{N}_]/u.test(after);
      if (leftOK && rightOK) {
        const key=archetypeReferenceKey(raw,pos,end,needle);
        if (key) mark(pos,end,`card-ref archetype-ref card-ref-${key}`,112);
        else mark(pos,end,'archetype-ref-generic',95);
      }
      pos=end;
    }
  }
}
function markRaceMonsterReferences(raw,mark) {
  const hay=raw.toLocaleLowerCase();
  for (const race of state.raceNames || []) {
    const needle=String(race || '').trim();
    if (needle.length<2) continue;
    const low=needle.toLocaleLowerCase();
    let pos=0;
    while ((pos=hay.indexOf(low,pos))>=0) {
      const end=pos+needle.length;
      const before=pos>0?raw[pos-1]:'';
      const leftOK=!/[\p{L}\p{N}_]/u.test(before);
      const suffix=raw.slice(end).match(/^\s+monsters?\b/i);
      if (leftOK && suffix) mark(pos,end+suffix[0].length,'card-ref race-monster-ref card-ref-effect',96);
      pos=end;
    }
  }
}
function normalizeCardEffectLayout(text) {
  const source=String(text || '').replace(/\r\n?/g,'\n');
  if(!source) return '';
  let formatted=source.replace(/[ \t]*\n[ \t]*/g,'\n');
  formatted=formatted.replace(/(?:[ \t]*\n[ \t]*)*[ \t]+(?=[●•▪◾]\s*)/g,'\n\n');
  formatted=formatted.replace(/\n{1,}(?=[●•▪◾]\s*)/g,'\n\n');
  formatted=formatted.replace(/([^\n])(?=[●•▪◾]\s*)/g,'$1\n\n');
  formatted=formatted.replace(/([●•▪◾][^\n]*?)(?:[ \t]+)(?=[●•▪◾]\s*)/g,'$1\n\n');
  return formatted.replace(/^\n+/, '').replace(/\n+$/, '');
}
function highlightCardText(text, card = null) {
  const raw=normalizeCardEffectLayout(text); if(!raw) return '';
  const marks=Array(raw.length).fill(null);
  const mark=(start,end,cls,priority=100)=>{
    for(let i=Math.max(0,start);i<Math.min(raw.length,end);i++) {
      if(!marks[i] || priority>marks[i].priority) marks[i]={cls,priority};
    }
  };
  const markLiteral=(value,cls,priority=110)=>{
    const needle=String(value||'').trim(); if(needle.length<3) return;
    const hay=raw.toLocaleLowerCase(), low=needle.toLocaleLowerCase(); let pos=0;
    while((pos=hay.indexOf(low,pos))>=0){ mark(pos,pos+needle.length,cls,priority); pos+=needle.length; }
  };
  const addClassMark=(start,end,cls)=>{
    for(let i=Math.max(0,start);i<Math.min(raw.length,end);i++) {
      if(!marks[i]) { marks[i]={cls,priority:1}; continue; }
      const classes=new Set(String(marks[i].cls||'').split(/\s+/).filter(Boolean));
      classes.add(cls);
      marks[i]={...marks[i],cls:[...classes].join(' ')};
    }
  };
  for (const match of raw.matchAll(/["“]([^"”\n]{2,100})["”]/g)) {
    const value=match[1].trim();
    const exact=state.indexes.byName.get(normalizeName(value));
    const key=exact ? cardVisualType(exact).key : inferredCardReferenceKey(value);
    const offset=match[0].indexOf(match[1]);
    if (key) mark(match.index+offset, match.index+offset+match[1].length, `card-ref card-ref-${key}`, 120);
    else mark(match.index+offset, match.index+offset+match[1].length, 'quoted-ref-generic', 101);
  }
  markArchetypeReferences(raw,mark);
  markRaceMonsterReferences(raw,mark);
  for (const match of raw.matchAll(/\b(?:Spell\/Trap Card(?:s)?|Spell\s*\/\s*Trap(?:\s+Cards?)?)\b/gi)) {
    const local=match[0];
    const spellOffset=local.search(/Spell/i);
    const trapOffset=local.search(/Trap/i);
    if (spellOffset>=0) mark(match.index+spellOffset,match.index+spellOffset+5,'card-ref card-ref-spell',108);
    if (trapOffset>=0) mark(match.index+trapOffset,match.index+trapOffset+4,'card-ref card-ref-trap',108);
  }
  const typePatterns=[
    ['spell',/\bSpell Card(?:s)?\b/gi,106], ['trap',/\bTrap Card(?:s)?\b/gi,106],
    ['fusion',/\bFusion Monster(?:s)?\b/gi,106], ['synchro',/\bSynchro Monster(?:s)?\b/gi,106],
    ['xyz',/\bXyz Monster(?:s)?\b/gi,106], ['link',/\bLink Monster(?:s)?\b/gi,106],
    ['ritual',/\bRitual Monster(?:s)?\b/gi,106], ['pendulum',/\bPendulum Monster(?:s)?\b/gi,106],
    ['normal',/\bNormal Monster(?:s)?\b/gi,106], ['effect',/\bEffect Monster(?:s)?\b/gi,106],
    ['fusion',/\bFusion(?=\s+Materials?\b)/gi,109],
    ['synchro',/\bSynchro(?=\s+Materials?\b)/gi,109],
    ['xyz',/\bXyz(?=\s+Materials?\b)/gi,109],
    ['link',/\bLink(?=\s+Materials?\b)/gi,109],
    ['spell',/\bSpells?\b/gi,92], ['trap',/\bTraps?\b/gi,92],
    ['fusion',/\bFusion\b/gi,93], ['synchro',/\bSynchro\b/gi,93],
    ['xyz',/\bXyz\b/gi,93], ['link',/\bLink\b/gi,93],
    ['ritual',/\bRitual\b/gi,93], ['pendulum',/\bPendulum\b/gi,93],
    ['effect',/\bMonsters?\b/gi,90],
  ];
  for (const [key,regex,priority] of typePatterns) for (const match of raw.matchAll(regex)) mark(match.index,match.index+match[0].length,`card-ref card-ref-${key}`,priority);
  const genericSummonPatterns=[
    /\b(?:Normal|Special)(?:\s+or\s+(?:Normal|Special))?\s+Summon(?:ed|ing)?\b/gi,
    /\b(?:Flip|Tribute)\s+Summon(?:ed|ing)?\b/gi,
  ];
  for (const regex of genericSummonPatterns) for (const match of raw.matchAll(regex)) addClassMark(match.index,match.index+match[0].length,'summon-mechanism');
  const typedSummons=[
    ['ritual',/\bRitual\s+Summon(?:ed|ing)?\b/gi], ['fusion',/\bFusion\s+Summon(?:ed|ing)?\b/gi],
    ['synchro',/\bSynchro\s+Summon(?:ed|ing)?\b/gi], ['xyz',/\bXyz\s+Summon(?:ed|ing)?\b/gi],
    ['link',/\bLink\s+Summon(?:ed|ing)?\b/gi], ['pendulum',/\bPendulum\s+Summon(?:ed|ing)?\b/gi],
  ];
  for (const [key,regex] of typedSummons) for (const match of raw.matchAll(regex)) {
    mark(match.index,match.index+match[0].length,`card-ref card-ref-${key} summon-mechanism`,111);
  }
  if(card?.name) markLiteral(card.name,cardReferenceClass(card),125);
  for (const match of raw.matchAll(/\bnon-(?=[\p{L}\p{N}])/giu)) addClassMark(match.index,match.index+match[0].length,'negation-prefix');
  for (const match of raw.matchAll(/\(Quick Effect\)/gi)) addClassMark(match.index,match.index+match[0].length,'quick-effect');
  for (const match of raw.matchAll(/\bFLIP:/gi)) addClassMark(match.index,match.index+match[0].length,'flip-label');
  for (const match of raw.matchAll(/(?:^|\n|[.!?]\s+)((?:When|If|During|At the start of|At the end of|Once per turn(?:,\s*if)?|Each time)\b[^:\n]{0,180}:)/gi)) {
    const offset=match[0].length-match[1].length;
    addClassMark(match.index+offset,match.index+offset+match[1].length,'effect-trigger');
  }
  for (const match of raw.matchAll(/(?:^|\n)([●•]\s*[^\n]*)/g)) {
    const offset=match[0].length-match[1].length;
    addClassMark(match.index+offset,match.index+offset+match[1].length,'effect-option');
  }
  const lpAmountPhrase = String.raw`(?:\d[\d,]*|half|all)(?:\s+(?:of\s+)?your)?\s+(?:LP|Life Points)`;
  for (const match of raw.matchAll(new RegExp(String.raw`\b(?:Pay|Lose)\s+${lpAmountPhrase}\b`,'gi'))) {
    addClassMark(match.index,match.index+match[0].length,'lp-negative');
  }
  for (const match of raw.matchAll(new RegExp(String.raw`\b(?:Gain|Recover)\s+${lpAmountPhrase}\b`,'gi'))) {
    addClassMark(match.index,match.index+match[0].length,'lp-positive');
  }
  for (const match of raw.matchAll(/\b(?:Gain|Recover)\s+(?:LP|Life Points)\b/gi)) {
    addClassMark(match.index,match.index+match[0].length,'lp-positive');
  }
  let html='',start=0,active=marks[0]?.cls||'';
  for(let i=1;i<=raw.length;i++){
    const next=i<raw.length?(marks[i]?.cls||''):null;
    if(next!==active){
      const part=escapeHtml(raw.slice(start,i));
      html+=active?`<span class="${active}">${part}</span>`:part;
      start=i; active=next;
    }
  }
  return html;
}
function cachedHighlightedCardText(card) {
  if(!card) return '';
  const id=Number(card.id);
  const raw=String(card.desc || '');
  const cached=state.cardTextHtmlCache.get(id);
  if(cached && cached.raw===raw) return cached.html;
  const html=highlightCardText(raw,card);
  state.cardTextHtmlCache.set(id,{raw,html});
  return html;
}
function applySelectedArtwork(imageId) {
  const card=selectedCard(); if(!card) return;
  const image=preferredImage(card,Number(imageId)); if(!image) return;
  state.selectedArtworkId=Number(image.id);
  if(state.selectedEntryUid != null && !state.hoverPreview){
    const found=entryByUid(state.selectedEntryUid);
    const foundCard=found ? state.indexes.byId.get(Number(found.entry.id)) : null;
    if(found && foundCard?.id===card.id && Number(found.entry.id)!==Number(image.id)){ const before=captureDeckSnapshot(); found.entry.id=Number(image.id); renderDeck(); syncTextView(); setDirty(); commitDeckHistory(before); }
  }
  renderSelectedCard();
}
function stepArtwork(delta) {
  const card=selectedCard(); const images=card?.images || []; if(images.length<2) return;
  let index=images.findIndex(img=>Number(img.id)===Number(state.selectedArtworkId)); if(index<0) index=0;
  index=(index+delta+images.length)%images.length; applySelectedArtwork(images[index].id);
}
function applyArtZoom() {
  if(!dom.modalArt) return;
  dom.modalArt.style.width=`${Math.round(520*state.artZoom)}px`;
  dom.modalArtName.dataset.zoom=`${Math.round(state.artZoom*100)}%`;
}
function openArt(card, ydkId = null) {
  const image = preferredImage(card, ydkId ?? state.selectedArtworkId) || preferredImage(card); if (!image) return;
  state.artZoom=1; dom.modalArt.src=image.imageUrl || image.imageUrlSmall; dom.modalArtName.textContent=card.name; dom.modalArt.draggable=false; applyArtZoom();
  if(!dom.artDialog.open) dom.artDialog.showModal();
}
function updateAnalysis() {
  const sections = currentSections();
  const result = validateDeck(sections,state.indexes.byId,state.banlist,state.cardPool);
  dom.validationView.replaceChildren();
  if (!result.errors.length && !result.warnings.length) dom.validationView.append(el('div','analysis-empty','No validation issues detected.'));
  else {
    const list = el('div','issue-list');
    result.errors.forEach(msg => list.append(el('div','issue error',msg)));
    result.warnings.forEach(msg => list.append(el('div','issue warning',msg)));
    dom.validationView.append(list);
  }
  renderStatistics();
}
function setStatisticsSection(section) {
  if (section === 'all') {
    const allSelected=SECTION_ORDER.every(item=>state.statisticsSections.has(item));
    state.statisticsSections = allSelected ? new Set() : new Set(SECTION_ORDER);
  } else if (SECTION_ORDER.includes(section)) {
    const next=new Set(state.statisticsSections);
    if (next.has(section)) next.delete(section);
    else next.add(section);
    state.statisticsSections=next;
  }
  persistState();
  renderStatistics();
}
const STAT_TYPE_ORDER=['normal','effect','ritual','fusion','synchro','xyz','link','pendulum','spell','trap','other'];
const STAT_MONSTER_TYPES=['normal','effect','ritual','fusion','synchro','xyz','link','pendulum'];
const STAT_PENDULUM_TYPES=['pendulum-normal','pendulum-effect','pendulum-ritual','pendulum-fusion','pendulum-synchro','pendulum-xyz','pendulum-link','pendulum'];
const STAT_VISUAL_MONSTER_TYPES=['normal','effect','ritual','fusion','synchro','xyz','link',...STAT_PENDULUM_TYPES];
const STAT_VISUAL_TYPE_ORDER=[...STAT_VISUAL_MONSTER_TYPES,'spell','trap','other'];
const STAT_TYPE_META={
  normal:{label:'Normal',color:'#d8bf80'},
  effect:{label:'Effect',color:'#e39a61'},
  ritual:{label:'Ritual',color:'#79b0cf'},
  fusion:{label:'Fusion',color:'#b28bd1'},
  synchro:{label:'Synchro',color:'#f1f3f5'},
  xyz:{label:'Xyz',color:'#505660'},
  link:{label:'Link',color:'#5e9dde'},
  pendulum:{label:'Pendulum',color:'linear-gradient(180deg,#c47b43 0 48%,#68ac98 52% 100%)',pieColors:['#c47b43','#68ac98']},
  'pendulum-normal':{label:'Normal Pendulum',color:'linear-gradient(180deg,#c7ab65 0 48%,#68ac98 52% 100%)',pieColors:['#c7ab65','#68ac98']},
  'pendulum-effect':{label:'Effect Pendulum',color:'linear-gradient(180deg,#c47b43 0 48%,#68ac98 52% 100%)',pieColors:['#c47b43','#68ac98']},
  'pendulum-ritual':{label:'Ritual Pendulum',color:'linear-gradient(180deg,#668ea8 0 48%,#68ac98 52% 100%)',pieColors:['#668ea8','#68ac98']},
  'pendulum-fusion':{label:'Fusion Pendulum',color:'linear-gradient(180deg,#8060a0 0 48%,#68ac98 52% 100%)',pieColors:['#8060a0','#68ac98']},
  'pendulum-synchro':{label:'Synchro Pendulum',color:'linear-gradient(180deg,#e1e3e5 0 48%,#68ac98 52% 100%)',pieColors:['#e1e3e5','#68ac98']},
  'pendulum-xyz':{label:'Xyz Pendulum',color:'linear-gradient(180deg,#30343b 0 48%,#68ac98 52% 100%)',pieColors:['#30343b','#68ac98']},
  'pendulum-link':{label:'Link Pendulum',color:'linear-gradient(180deg,#3979ad 0 48%,#68ac98 52% 100%)',pieColors:['#3979ad','#68ac98']},
  spell:{label:'Spell',color:'#65bda8'},
  trap:{label:'Trap',color:'#dc70ae'},
  other:{label:'Other',color:'#8d98a8'},
};
function statisticsTypeKey(card) {
  const bucket=cardTypeBucket(card);
  if (bucket==='Spell') return 'spell';
  if (bucket==='Trap') return 'trap';
  if (bucket!=='Monster') return 'other';
  return cardVisualType(card).key || 'effect';
}
function statisticsVisualTypeKey(card) {
  const bucket=cardTypeBucket(card);
  if (bucket!=='Monster') return statisticsTypeKey(card);
  const hybrid=metadataCardTypeKey(card);
  if (STAT_PENDULUM_TYPES.includes(hybrid)) return hybrid;
  return statisticsTypeKey(card);
}
function statisticTypeCounts(ids) {
  const counts=Object.fromEntries(STAT_TYPE_ORDER.map(key=>[key,0]));
  for (const id of ids) {
    const card=state.indexes.byId.get(Number(id));
    if (!card) continue;
    const key=statisticsTypeKey(card);
    if (!(key in counts)) counts.other += 1;
    else counts[key] += 1;
  }
  return counts;
}
function statisticVisualTypeCounts(ids) {
  const counts=Object.fromEntries(STAT_VISUAL_TYPE_ORDER.map(key=>[key,0]));
  for (const id of ids) {
    const card=state.indexes.byId.get(Number(id));
    if (!card) continue;
    const key=statisticsVisualTypeKey(card);
    if (!(key in counts)) counts.other += 1;
    else counts[key] += 1;
  }
  return counts;
}
function statSegmentMarkup(keys,typeCounts,total) {
  const denominator=Math.max(1,total);
  return keys.filter(key=>typeCounts[key]>0).map(key=>{
    const meta=STAT_TYPE_META[key];
    const width=typeCounts[key]/denominator*100;
    const count=typeCounts[key];
    return `<i class="stat-segment stat-segment-${key}" style="width:${width}%;background:${meta.color}" data-stat-label="${escapeHtml(meta.label)}" data-stat-count="${count}" aria-label="${escapeHtml(meta.label)}: ${count} ${count===1?'card':'cards'}"></i>`;
  }).join('');
}
function statSingleSegmentMarkup(key,count,width) {
  const meta=STAT_TYPE_META[key];
  const safeWidth=Math.max(0,Math.min(100,Number(width)||0));
  return `<span class="stat-stack" style="width:${safeWidth}%"><i class="stat-segment stat-segment-${key}" style="width:100%;background:${meta.color}" data-stat-label="${escapeHtml(meta.label)}" data-stat-count="${count}" aria-label="${escapeHtml(meta.label)}: ${count} ${count===1?'card':'cards'}"></i></span>`;
}
let statTooltip=null;
let statTooltipHideTimer=0;
function ensureStatTooltip() {
  if (statTooltip?.isConnected) return statTooltip;
  statTooltip=el('div','stat-tooltip');
  statTooltip.setAttribute('role','tooltip');
  document.body.append(statTooltip);
  return statTooltip;
}
function positionStatTooltip(clientX,clientY) {
  const tip=ensureStatTooltip();
  const gap=12, pad=8;
  const rect=tip.getBoundingClientRect();
  let left=clientX+gap, top=clientY+gap;
  if (left+rect.width+pad>window.innerWidth) left=clientX-rect.width-gap;
  if (top+rect.height+pad>window.innerHeight) top=clientY-rect.height-gap;
  tip.style.left=`${Math.max(pad,left)}px`;
  tip.style.top=`${Math.max(pad,top)}px`;
}
function showStatTooltip(label,count,event) {
  const tip=ensureStatTooltip();
  tip.textContent=`${label}: ${count} ${Number(count)===1?'card':'cards'}`;
  clearTimeout(statTooltipHideTimer);
  statTooltipHideTimer=0;
  tip.classList.add('visible');
  positionStatTooltip(event.clientX,event.clientY);
}
function moveStatTooltip(event) {
  if(statTooltip?.classList.contains('visible')) positionStatTooltip(event.clientX,event.clientY);
  return true;
}
function hideStatTooltip() {
  clearTimeout(statTooltipHideTimer);
  statTooltipHideTimer=0;
  statTooltip?.classList.remove('visible');
}
function wireStatSegmentTooltips(root) {
  for (const segment of root.querySelectorAll('.stat-segment[data-stat-label]')) {
    const label=segment.dataset.statLabel || 'Cards';
    const count=Number(segment.dataset.statCount || 0);
    segment.addEventListener('pointerenter',event=>showStatTooltip(label,count,event));
    segment.addEventListener('pointermove',event=>{showStatTooltip(label,count,event);moveStatTooltip(event);});
    segment.addEventListener('pointerleave',hideStatTooltip);
    segment.addEventListener('pointercancel',hideStatTooltip);
  }
}
function wirePieTooltip(pie,entries) {
  const active=entries.filter(item=>item.count>0);
  const total=active.reduce((sum,item)=>sum+item.count,0);
  if (!total) return;
  const ranges=[];
  let cursor=0;
  for (const item of active) {
    const start=cursor;
    cursor += item.count/total*360;
    ranges.push({...item,start,end:cursor});
  }
  const onMove=event=>{
    if(statTooltip?.classList.contains('visible')) moveStatTooltip(event);
    const rect=pie.getBoundingClientRect();
    const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
    const dx=event.clientX-cx, dy=event.clientY-cy;
    const radius=Math.hypot(dx,dy);
    const outer=Math.min(rect.width,rect.height)/2;
    const inner=outer*.46;
    if (radius<inner || radius>outer) { hideStatTooltip(); return; }
    const angle=(Math.atan2(dx,-dy)*180/Math.PI+360)%360;
    const item=ranges.find(range=>angle>=range.start && (angle<range.end || (range.end>=360 && angle===0)));
    if (!item) { hideStatTooltip(); return; }
    showStatTooltip(item.label,item.count,event);
  };
  pie.addEventListener('pointerenter',onMove);
  pie.addEventListener('pointermove',onMove);
  pie.addEventListener('pointerleave',hideStatTooltip);
  pie.addEventListener('pointercancel',hideStatTooltip);
}
function statPieGradient(entries) {
  const total=entries.reduce((sum,item)=>sum+item.count,0);
  if (!total) return 'conic-gradient(var(--surface-3) 0 100%)';
  let cursor=0;
  const stops=[];
  for (const item of entries) {
    if (!item.count) continue;
    const start=cursor;
    cursor += item.count/total*100;
    const colors=Array.isArray(item.pieColors)&&item.pieColors.length?item.pieColors:[item.color];
    const span=cursor-start;
    colors.forEach((color,index)=>{
      const partStart=start+span*index/colors.length;
      const partEnd=start+span*(index+1)/colors.length;
      stops.push(`${color} ${partStart.toFixed(3)}% ${partEnd.toFixed(3)}%`);
    });
  }
  return `conic-gradient(${stops.join(',')})`;
}
function renderStatistics() {
  hideStatTooltip();
  const sections=currentSections();
  const selectedSections=SECTION_ORDER.filter(section=>state.statisticsSections.has(section));
  const selectedIds=selectedSections.flatMap(section=>sections[section]);
  const all=SECTION_ORDER.flatMap(section=>sections[section]);
  const typeCounts=statisticTypeCounts(selectedIds);
  const visualTypeCounts=statisticVisualTypeCounts(selectedIds);
  const counts={
    Monster:STAT_MONSTER_TYPES.reduce((sum,key)=>sum+typeCounts[key],0),
    Spell:typeCounts.spell,
    Trap:typeCounts.trap,
    Other:typeCounts.other,
  };
  const grid=el('div','stat-grid');
  for (const section of SECTION_ORDER) {
    const count=sections[section].length;
    const tone=sectionCountTone(section,count);
    const active=state.statisticsSections.has(section);
    const box=el('button',`stat-card stat-filter ${tone} ${active?'selected':''}`.trim());
    box.type='button'; box.dataset.section=section; box.setAttribute('aria-pressed',String(active));
    box.title=`${active?'Exclude':'Include'} ${SECTION_LABELS[section]} from Statistics`;
    box.innerHTML=`<strong>${count}</strong><span>${SECTION_LABELS[section]}</span>`;
    box.addEventListener('click',()=>setStatisticsSection(section));
    grid.append(box);
  }
  const allSelected=SECTION_ORDER.every(section=>state.statisticsSections.has(section));
  const total=el('button',`stat-card stat-filter stat-total ${allSelected?'selected':''}`.trim());
  total.type='button'; total.dataset.section='all'; total.setAttribute('aria-pressed',String(allSelected));
  total.title=allSelected?'Deselect Main, Extra, and Side Deck statistics':'Select Main, Extra, and Side Deck statistics';
  total.innerHTML=`<strong>${all.length}</strong><span>Total Cards</span>`;
  total.addEventListener('click',()=>setStatisticsSection('all'));
  grid.append(total);
  const controls=el('div','stat-graph-controls');
  const filterLabel=el('label','stat-graph-filter');
  filterLabel.append(el('span','','Graph'));
  const filterSelect=document.createElement('select');
  filterSelect.title='Choose which card-type statistics are graphed';
  for (const [value,label] of [['summary','Summary'],['types','All Card Types'],['monsters','Monster Types']]) {
    const option=document.createElement('option'); option.value=value; option.textContent=label; option.selected=state.statisticsGraphFilter===value; filterSelect.append(option);
  }
  filterSelect.addEventListener('change',()=>{state.statisticsGraphFilter=filterSelect.value;persistState();renderStatistics();});
  filterLabel.append(filterSelect);
  const chartToggle=el('button',`btn stat-pie-toggle ${state.statisticsChartType==='pie'?'active':''}`.trim(),state.statisticsChartType==='pie'?'Bars':'Pie');
  chartToggle.type='button'; chartToggle.setAttribute('aria-pressed',String(state.statisticsChartType==='pie'));
  chartToggle.title=state.statisticsChartType==='pie'?'Switch to bar graph':'Switch to pie graph';
  chartToggle.addEventListener('click',()=>{state.statisticsChartType=state.statisticsChartType==='pie'?'bars':'pie';persistState();renderStatistics();});
  controls.append(filterLabel,chartToggle);
  const selectedCount=selectedIds.length;
  const capacities={main:60,extra:15,side:15};
  const selectedCapacity=selectedSections.reduce((sum,section)=>sum+capacities[section],0) || 1;
  let sizeLabel='Selected Size', sizeTone='neutral', marker='';
  if (selectedSections.length===1) {
    const only=selectedSections[0];
    sizeLabel=`${SECTION_LABELS[only].replace(' Deck','')} Size`;
    sizeTone=only===SECTION_MAIN ? mainDeckEfficiencyTone(sections[only].length) : sectionCountTone(only,sections[only].length);
    if (only===SECTION_MAIN) marker=`<em style="left:${40/60*100}%" title="40-card preference"></em>`;
  }
  const sizeRow=el('div','stat-row stat-size-row');
  sizeRow.innerHTML=`<span>${sizeLabel}</span><span class="stat-bar size-${sizeTone}"><i style="width:${Math.min(100,selectedCount/selectedCapacity*100)}%"></i>${marker}</span><b>${selectedCount}</b>`;
  const chart=el('div',`stat-chart stat-chart-${state.statisticsChartType}`);
  if (state.statisticsChartType==='bars') {
    const bars=el('div','stat-bars'); bars.append(sizeRow);
    const denominator=Math.max(1,selectedCount);
    if (state.statisticsGraphFilter==='summary') {
      for (const label of ['Monster','Spell','Trap','Other']) {
        const count=counts[label];
        const row=el('div','stat-row');
        if (label==='Monster') {
          const width=Math.min(100,count/denominator*100);
          row.innerHTML=`<span>${label}</span><span class="stat-bar stat-monster"><span class="stat-stack" style="width:${width}%">${statSegmentMarkup(STAT_VISUAL_MONSTER_TYPES,visualTypeCounts,count)}</span></span><b>${count}</b>`;
          wireStatSegmentTooltips(row);
        } else {
          const key=label.toLowerCase();
          const width=Math.min(100,count/denominator*100);
          row.innerHTML=`<span>${label}</span><span class="stat-bar">${statSingleSegmentMarkup(key,count,width)}</span><b>${count}</b>`;
          wireStatSegmentTooltips(row);
        }
        bars.append(row);
      }
    } else {
      const keys=state.statisticsGraphFilter==='monsters'?STAT_VISUAL_MONSTER_TYPES:STAT_VISUAL_TYPE_ORDER;
      const graphTotal=state.statisticsGraphFilter==='monsters'?Math.max(1,counts.Monster):denominator;
      for (const key of keys) {
        const count=visualTypeCounts[key]; const meta=STAT_TYPE_META[key];
        const row=el('div','stat-row');
        const width=Math.min(100,count/graphTotal*100);
        row.innerHTML=`<span>${meta.label}</span><span class="stat-bar">${statSingleSegmentMarkup(key,count,width)}</span><b>${count}</b>`;
        wireStatSegmentTooltips(row);
        bars.append(row);
      }
    }
    chart.append(bars);
  } else {
    const pieWrap=el('div','stat-pie-wrap');
    const pieKeys=state.statisticsGraphFilter==='monsters'?STAT_VISUAL_MONSTER_TYPES:STAT_VISUAL_TYPE_ORDER;
    const entries=pieKeys.map(key=>({...STAT_TYPE_META[key],key,count:visualTypeCounts[key]}));
    const pie=el('div','stat-pie'); pie.style.background=statPieGradient(entries); pie.setAttribute('role','img'); pie.setAttribute('aria-label','Selected card type distribution');
    const center=el('div','stat-pie-center'); center.innerHTML=`<strong>${entries.reduce((sum,item)=>sum+item.count,0)}</strong><span>Cards</span>`; pie.append(center);
    wirePieTooltip(pie,entries);
    const legend=el('div','stat-pie-legend');
    for (const item of entries) {
      if (!item.count) continue;
      const entry=el('div','stat-pie-legend-item');
      entry.innerHTML=`<i style="background:${item.color}"></i><span>${item.label}</span><b>${item.count}</b>`; legend.append(entry);
    }
    if (!legend.childNodes.length) legend.append(el('div','analysis-empty','No cards selected.'));
    pieWrap.append(pie,legend);
    const sizeWrap=el('div','stat-bars stat-size-only'); sizeWrap.append(sizeRow);
    chart.append(sizeWrap,pieWrap);
  }
  dom.statisticsView.replaceChildren(grid,controls,chart);
}
function buildYdkTextViewModel() {
  const lines=[`#Created by ${String(state.creator || 'YGO Deck Studio 3').trim()}`,'#main'];
  const map=[null,null];
  for(const entry of state.deck[SECTION_MAIN] || []) {
    const card=state.indexes.byId.get(Number(entry.id));
    lines.push(String(entry.id));
    map.push(card?{card,entryUid:Number(entry.uid),artworkId:Number(entry.id),annotation:card.name}:null);
  }
  lines.push('#extra'); map.push(null);
  for(const entry of state.deck[SECTION_EXTRA] || []) {
    const card=state.indexes.byId.get(Number(entry.id));
    lines.push(String(entry.id));
    map.push(card?{card,entryUid:Number(entry.uid),artworkId:Number(entry.id),annotation:card.name}:null);
  }
  if((state.deck[SECTION_SIDE] || []).length) {
    lines.push('!side'); map.push(null);
    for(const entry of state.deck[SECTION_SIDE] || []) {
      const card=state.indexes.byId.get(Number(entry.id));
      lines.push(String(entry.id));
      map.push(card?{card,entryUid:Number(entry.uid),artworkId:Number(entry.id),annotation:card.name}:null);
    }
  }
  return {text:lines.join('\n'),map};
}
function buildReadableTextViewModel() {
  const lines=[];
  const map=[];
  for(const section of SECTION_ORDER) {
    const entries=state.deck[section] || [];
    lines.push(`== ${SECTION_LABELS[section]} (${entries.length} card${entries.length===1?'':'s'}) ==`); map.push(null);
    const groups=new Map();
    const order=[];
    for(const entry of entries) {
      const card=state.indexes.byId.get(Number(entry.id));
      const name=card?.name || `Unknown Card ID ${entry.id}`;
      if(!groups.has(name)) { groups.set(name,[]); order.push(name); }
      groups.get(name).push({entry,card});
    }
    for(const name of order) {
      const group=groups.get(name);
      lines.push(`${group.length}x ${name}`);
      const first=group.find(item=>item.card) || group[0];
      const codes=[...new Set(group.map(item=>Number(item.entry.id)).filter(Number.isFinite))];
      map.push(first?.card?{card:first.card,entryUid:Number(first.entry.uid),artworkId:Number(first.entry.id),annotation:codes.join(' / ')}:null);
    }
    lines.push(''); map.push(null);
  }
  while(lines.length && lines.at(-1)==='') { lines.pop(); map.pop(); }
  return {text:lines.join('\n')+'\n',map};
}
function textLineGeometry(index) {
  if(index==null || !dom.deckTextArea) return null;
  const style=getComputedStyle(dom.deckTextArea);
  const fontSize=parseFloat(style.fontSize)||14;
  const lineHeight=parseFloat(style.lineHeight)||fontSize*1.45;
  const paddingTop=parseFloat(style.paddingTop)||0;
  return {lineHeight,paddingTop,top:paddingTop+index*lineHeight-dom.deckTextArea.scrollTop};
}
function renderTextLineAnnotations() {
  if(!dom.textLineAnnotations || !['readable','ydk'].includes(state.deckView)) return;
  const frag=document.createDocumentFragment();
  const map=state.textLineMap || [];
  for(let index=0;index<map.length;index++) {
    const info=map[index];
    if(!info?.annotation) continue;
    const geo=textLineGeometry(index);
    if(!geo || geo.top+geo.lineHeight<0 || geo.top>dom.deckTextArea.clientHeight) continue;
    const note=el('div','text-line-annotation',String(info.annotation));
    note.style.top=`${geo.top}px`;
    note.style.height=`${geo.lineHeight}px`;
    note.title=state.deckView==='ydk' ? `Card name: ${info.annotation}` : `YDK card code: ${info.annotation}`;
    frag.append(note);
  }
  dom.textLineAnnotations.replaceChildren(frag);
}
function findSelectedTextLine() {
  const map=state.textLineMap || [];
  if(state.selectedEntryUid!=null) {
    const exact=map.findIndex(info=>Number(info?.entryUid)===Number(state.selectedEntryUid));
    if(exact>=0) return exact;
  }
  if(state.selectedCardId!=null) {
    const byCard=map.findIndex(info=>Number(info?.card?.id)===Number(state.selectedCardId));
    if(byCard>=0) return byCard;
  }
  return null;
}
function scrollTextLineIntoView(index) {
  const geo=textLineGeometry(index);
  if(!geo) return;
  const viewport=dom.deckTextArea.clientHeight;
  if(geo.top<0 || geo.top+geo.lineHeight>viewport) {
    const desired=Math.max(0,index*geo.lineHeight-Math.max(0,(viewport-geo.lineHeight)/2));
    dom.deckTextArea.scrollTop=desired;
  }
}
function syncTextView() {
  if (state.deckView !== 'readable' && state.deckView !== 'ydk') return;
  state.textHoverLine=null;
  dom.textLineHover?.classList.add('hidden');
  const model=state.deckView==='ydk' ? buildYdkTextViewModel() : buildReadableTextViewModel();
  state.textLineMap=model.map;
  dom.deckTextArea.value=model.text;
  state.textSelectedLine=findSelectedTextLine();
  dom.parseIssues.textContent='';
  requestAnimationFrame(()=>{
    if(state.textSelectedLine!=null) {
      const lines=dom.deckTextArea.value.split(/\r?\n/);
      let start=0;
      for(let i=0;i<state.textSelectedLine;i++) start+=lines[i].length+1;
      dom.deckTextArea.setSelectionRange(start,start);
      scrollTextLineIntoView(state.textSelectedLine);
      positionTextLineSelection(state.textSelectedLine);
    } else dom.textLineSelection?.classList.add('hidden');
    renderTextLineAnnotations();
  });
}
function ensureSelectedDeckCardVisible() {
  if(state.selectedEntryUid==null && state.selectedCardId==null) return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    let node=state.selectedEntryUid==null ? null : document.querySelector(`[data-uid="${state.selectedEntryUid}"]`);
    if(!node && state.selectedCardId!=null) {
      for(const section of SECTION_ORDER) {
        const entry=(state.deck[section] || []).find(item=>Number(state.indexes.byId.get(Number(item.id))?.id)===Number(state.selectedCardId));
        if(entry) { node=document.querySelector(`[data-uid="${entry.uid}"]`); break; }
      }
    }
    node?.scrollIntoView({block:'nearest',inline:'nearest'});
  }));
}
function setDeckView(view) {
  state.deckView=view;
  $$('#deckViewSelector button').forEach(b=>b.classList.toggle('active',b.dataset.deckView===view));
  dom.visualDeckView.classList.toggle('hidden',view!=='grid');
  dom.listDeckView.classList.toggle('hidden',view!=='list');
  dom.textDeckView.classList.toggle('hidden',!['readable','ydk'].includes(view));
  if (view==='list') { renderDeckList(); renderDeckSelection(); requestAnimationFrame(updateDeckListColumnLayout); ensureSelectedDeckCardVisible(); }
  if (view==='grid') { renderDeckSelection(); ensureSelectedDeckCardVisible(); }
  if (view==='readable'||view==='ydk') { dom.textViewTitle.textContent=view==='ydk'?'YDK Deck':'Readable Deck'; syncTextView(); }
  persistState();
}
function applyTextToDeck() {
  const text=dom.deckTextArea.value;
  try {
    let parsed;
    if (state.deckView==='ydk') parsed=parseYDK(text);
    else parsed=humanToSections(text,state.indexes,{autoExtra:true});
    const limitIssues=loadSections(parsed.sections,{correctPlacement:true,recordHistory:true});
    const issues=[...(parsed.issues||[]),...limitIssues];
    dom.parseIssues.textContent=issues.join('\n');
    if (issues.length) toast(`Applied with ${issues.length} issue${issues.length===1?'':'s'}. ${limitIssues[0]||''}`.trim(),'warn'); else toast('Deck updated from text.','good');
  } catch(err) { dom.parseIssues.textContent=String(err.message||err); toast('Could not parse deck text.','error'); }
}
function canonicalCardPoolLabel(value) {
  const raw=String(value || '').trim();
  const key=raw.toLocaleLowerCase();
  const known={
    tcg:'TCG', ocg:'OCG', goat:'GOAT', 'ocg goat':'OCG GOAT',
    'master duel':'Master Duel', 'speed duel':'Speed Duel', 'rush duel':'Rush Duel',
    'duel links':'Duel Links', genesys:'Genesys', 'genesys ocg':'Genesys OCG',
    'common charity':'Common Charity',
  };
  return known[key] || raw;
}
function refreshCardPoolSelectors() {
  const discovered=new Set();
  for(const card of state.cards || []) for(const format of card.formats || []) {
    const label=canonicalCardPoolLabel(format);
    if(label) discovered.add(label);
  }
  const preferred=['TCG','OCG','GOAT','OCG GOAT','Master Duel','Speed Duel','Rush Duel','Duel Links','Genesys','Genesys OCG','Common Charity'];
  const ordered=[...preferred.filter(value=>discovered.has(value) || ['TCG','OCG','GOAT','Master Duel','Speed Duel','Rush Duel','Duel Links'].includes(value)),
    ...[...discovered].filter(value=>!preferred.includes(value)).sort((a,b)=>a.localeCompare(b))];
  for(const [node,current] of [[dom.searchCardPoolFilter,state.filters.cardPool],[dom.deckSortCardPool,state.cardPool]]) {
    if(!node) continue;
    const values=[...new Set([...ordered,current].filter(Boolean))];
    node.replaceChildren(...values.map(value=>new Option(value,value)),new Option('All','All'));
    node.value=current && [...node.options].some(option=>option.value===current) ? current : 'All';
  }
}
function replaceSearchSelectOptions(node,values,current='',{anyLabel='Any'}={}) {
  if(!node) return;
  const normalized=(values || []).map(value=>typeof value==='string'?{label:value,value}:{label:String(value?.label ?? value?.value ?? ''),value:String(value?.value ?? '')}).filter(item=>item.value);
  node.replaceChildren(new Option(anyLabel,''),...normalized.map(item=>new Option(item.label,item.value)));
  node.value=normalized.some(item=>item.value===current) ? current : '';
}
function contextualSearchTypeOptions() {
  const family=String(state.filters.category || '');
  if(family==='Monster') return MONSTER_SEARCH_CATEGORIES;
  if(family==='Spell' || family==='Trap') return orderedSearchSubtypeValues(family);
  return [];
}
function setSearchContextVisibility(node,visible) {
  if(!node) return;
  const active=Boolean(visible);
  node.hidden=!active;
  node.setAttribute('aria-hidden',String(!active));
  node.querySelectorAll?.('input,select,textarea,button').forEach(control=>{control.disabled=!active;});
}
function updateSearchFilterContextUI() {
  const f=state.filters;
  const ctx=searchFilterContext(f);
  const effectiveType=effectiveSearchTypeValue(f);
  const typeField=$('#searchDetailedTypeField');
  const typeLabel=$('#searchDetailedTypeLabel');
  const typeNode=$('#typeFilter');
  const typeVisible=ctx.monster || ctx.spell || ctx.trap;
  setSearchContextVisibility(typeField,typeVisible);
  if(typeLabel) typeLabel.textContent=ctx.monster?'Category':'Type';
  if(typeNode) replaceSearchSelectOptions(typeNode,contextualSearchTypeOptions(),effectiveType);
  const subtypeField=$('#searchMonsterSubtypeField');
  const subtypeNode=$('#monsterSubtypeFilter');
  setSearchContextVisibility(subtypeField,ctx.pendulum);
  if(subtypeNode) replaceSearchSelectOptions(subtypeNode,PENDULUM_SEARCH_SUBTYPES,ctx.subtype);
  const abilityField=$('#searchAbilityField');
  const attributeField=$('#searchAttributeField');
  const raceField=$('#searchRaceField');
  const structuredMonster=ctx.monster && !ctx.trapMonster;
  setSearchContextVisibility(abilityField,structuredMonster);
  setSearchContextVisibility(attributeField,structuredMonster);
  setSearchContextVisibility(raceField,structuredMonster);
  if(dom.abilityFilter) replaceSearchSelectOptions(dom.abilityFilter,MONSTER_SEARCH_ABILITIES,structuredMonster?String(f.ability||''):'');
  const additional=$('#searchAdditionalDropdown');
  const stats=$('#searchStatDropdown');
  const pendulumScale=$('#searchPendulumScaleFilters');
  const xyz=$('#searchXyzFilterDropdown');
  const link=$('#searchLinkFilterDropdown');
  setSearchContextVisibility(additional,ctx.specific);
  setSearchContextVisibility(stats,structuredMonster);
  setSearchContextVisibility(pendulumScale,ctx.pendulum);
  setSearchContextVisibility(xyz,ctx.xyz);
  setSearchContextVisibility(link,ctx.link);
  const levelVisible=structuredMonster && !ctx.link;
  setSearchContextVisibility($('#levelMinField'),levelVisible);
  setSearchContextVisibility($('#levelMaxField'),levelVisible);
  const defenseVisible=structuredMonster && !ctx.link;
  setSearchContextVisibility($('#defMinField'),defenseVisible);
  setSearchContextVisibility($('#defMaxField'),defenseVisible);
  setSearchContextVisibility($('#atkMinField'),structuredMonster);
  setSearchContextVisibility($('#atkMaxField'),structuredMonster);
  const hint=$('#searchCriteriaHint');
  if(hint) {
    if(!ctx.specific) hint.textContent='Any card type keeps the search simple: Effect Characteristics and Effect Text remain available below.';
    else if(ctx.monster && !ctx.type) hint.textContent='Monster-specific identity and stat filters are available. Choose a Category to reveal Pendulum or Link controls.';
    else if(ctx.link) hint.textContent='Link category selected. Link Rating, Arrow Directions, and Link Materials are positioned directly below Effect Text.';
    else if(ctx.pendulum && ctx.subtype) hint.textContent=`Pendulum ${ctx.subtype} subtype selected. Pendulum Scale stays directly below Effect Text, with Link-specific controls added there when applicable.`;
    else if(ctx.pendulum) hint.textContent='Pendulum category selected. Choose an optional Subtype such as Effect, Fusion, Ritual, Synchro, Xyz, Normal, or Link; Scale ranges stay directly below Effect Text.';
    else if(ctx.monster) hint.textContent=`${ctx.type || 'Monster'} criteria shown. Category-specific controls appear directly below Effect Text when applicable.`;
    else if(ctx.spell) hint.textContent='Spell Type, effect characteristics, and effect text are available. Monster-only controls are hidden.';
    else if(ctx.trap) hint.textContent='Trap Type, effect characteristics, and effect text are available. Monster-only controls are hidden.';
    else hint.textContent='Only filters that apply to this card family are shown.';
  }
  const statHelp=$('#searchStatHelp');
  if(statHelp) {
    if(ctx.link) statHelp.textContent='ATK applies to Link Monsters. Link-specific criteria are shown directly below Effect Text.';
    else if(ctx.pendulum) statHelp.textContent='Level / Rank, ATK, and DEF remain here; Pendulum Scale is shown directly below Effect Text.';
    else statHelp.textContent='Level / Rank and combat-stat ranges apply only to Monster Cards. Category-specific criteria appear directly below Effect Text.';
  }
  const additionalSummary=$('#searchAdditionalSummary');
  if(additionalSummary) {
    const count=(ctx.specific && f.archetype?1:0);
    additionalSummary.textContent=count?`${count} active`:'Any';
  }
  if(dom.effectTextFilter && dom.effectTextFilter.value!==String(f.effectText||'')) dom.effectTextFilter.value=String(f.effectText||'');
  updateEffectTextSummary();
  updateSearchStatSummary();
  updateLinkFilterSummary();
  updateXyzMaterialSummary();
  updateXyzFilterSummary();
  requestAnimationFrame(refitOpenFilterPopovers);
}
function populateFilters() {
  const addOptions=(selector,values,current='')=>{ const node=$(selector); if(!node) return; replaceSearchSelectOptions(node,[...values].filter(Boolean).sort((a,b)=>String(a).localeCompare(String(b))),current); };
  if(state.filters.category==='Monster' && effectiveSearchTypeValue(state.filters)==='Maximum') {
    const currentPool=String(state.filters.cardPool || '').trim().toLocaleLowerCase();
    if(currentPool!=='all' && currentPool!=='rush duel') state.filters.cardPool='Rush Duel';
  }
  const monsterCards=(state.cards || []).filter(card=>cardTypeBucket(card)==='Monster');
  const monsterAttributes=new Set(monsterCards.map(c=>c.attribute).filter(Boolean));
  const monsterRaces=new Set(monsterCards.map(c=>c.race).filter(Boolean));
  if(state.filters.category==='Monster') {
    if(state.filters.attribute && !monsterAttributes.has(state.filters.attribute)) state.filters.attribute='';
    if(state.filters.race && !monsterRaces.has(state.filters.race)) state.filters.race='';
    if(state.filters.ability && !MONSTER_SEARCH_ABILITIES.includes(state.filters.ability)) state.filters.ability='';
  }
  addOptions('#attributeFilter',monsterAttributes,state.filters.attribute || '');
  addOptions('#raceFilter',monsterRaces,state.filters.race || '');
  const family=String(state.filters.category || '');
  const archetypeCards=family ? (state.cards || []).filter(card=>cardMatchesSearchFamily(card,family)) : (state.cards || []);
  const familyArchetypes=new Set(archetypeCards.map(c=>c.archetype).filter(Boolean));
  if(family && state.filters.archetype && !familyArchetypes.has(state.filters.archetype)) state.filters.archetype='';
  addOptions('#archetypeFilter',familyArchetypes,state.filters.archetype || '');
  const values={categoryFilter:'category',monsterSubtypeFilter:'monsterSubtype',attributeFilter:'attribute',raceFilter:'race',archetypeFilter:'archetype',searchCardPoolFilter:'cardPool',searchBanlistFilter:'banlist',restrictionFilter:'restriction',maxResultsFilter:'maxResults',levelMinFilter:'levelMin',levelMaxFilter:'levelMax',scaleMinFilter:'scaleMin',scaleMaxFilter:'scaleMax',atkMinFilter:'atkMin',atkMaxFilter:'atkMax',defMinFilter:'defMin',defMaxFilter:'defMax',linkRatingMinFilter:'linkRatingMin',linkRatingMaxFilter:'linkRatingMax',xyzMaterialMinFilter:'xyzMaterialMin',xyzMaterialMaxFilter:'xyzMaterialMax',xyzMaterialLevelMinFilter:'xyzMaterialLevelMin',xyzMaterialLevelMaxFilter:'xyzMaterialLevelMax'};
  for(const [id,key] of Object.entries(values)){ const node=$(`#${id}`); if(node) node.value=state.filters[key] ?? ''; }
  if(dom.effectTextFilter) dom.effectTextFilter.value=String(state.filters.effectText || '');
  if(dom.searchScopeQueryFilter && dom.searchScopeQueryFilter.value!==String(state.filters.query || '')) dom.searchScopeQueryFilter.value=String(state.filters.query || '');
  updateSearchFilterContextUI();
  renderSearchSortModeOptions();
  renderLinkArrowFilterOptions();
  populateLinkMaterialSelectors();
  renderLinkMaterialOptions();
  populateXyzMaterialSelectors();
  renderXyzMaterialOptions();
  updateSearchFilterSummary();
  updateEffectTextSummary();
  updateSearchStatSummary();
}
function searchSortModeLabel(value=state.filters.sort) {
  return SEARCH_SORT_MODE_OPTIONS.find(([key])=>key===value)?.[1] || 'Relevance';
}
function activeSearchFilterCount() {
  const f=state.filters;
  const ctx=searchFilterContext(f);
  let count=ctx.specific?1:0;
  if(String(f.query||'').trim()) count+=1;
  if(ctx.type) count+=1;
  if(ctx.subtype) count+=1;
  if(ctx.monster && !ctx.trapMonster && f.ability) count+=1;
  if(ctx.monster && !ctx.trapMonster && f.attribute) count+=1;
  if(ctx.monster && !ctx.trapMonster && f.race) count+=1;
  if(ctx.specific && f.archetype) count+=1;
  if(f.restriction) count+=1;
  if(ctx.monster && !ctx.trapMonster && !ctx.link) for(const key of ['levelMin','levelMax','defMin','defMax']) if(f[key]!=='' && f[key]!=null) count+=1;
  if(ctx.monster && !ctx.trapMonster) for(const key of ['atkMin','atkMax']) if(f[key]!=='' && f[key]!=null) count+=1;
  if(ctx.pendulum) for(const key of ['scaleMin','scaleMax']) if(f[key]!=='' && f[key]!=null) count+=1;
  if(ctx.link) {
    for(const key of ['linkRatingMin','linkRatingMax','linkMaterialMin','linkMaterialMax','linkMaterialRace','linkMaterialAttribute','linkMaterialPattern']) if(f[key]!=='' && f[key]!=null) count+=1;
    if(f.linkMarkers?.size) count+=1;
    if(f.linkMaterialQualifiers?.size) count+=f.linkMaterialQualifiers.size;
    if(f.linkMaterials?.size) count+=f.linkMaterials.size;
  }
  if(ctx.xyz) {
    for(const key of ['xyzMaterialMin','xyzMaterialMax','xyzMaterialLevelMin','xyzMaterialLevelMax','xyzMaterialRace','xyzMaterialAttribute','xyzMaterialPattern']) if(f[key]!=='' && f[key]!=null) count+=1;
    if(f.xyzMaterialQualifiers?.size) count+=f.xyzMaterialQualifiers.size;
    if(f.xyzMaterials?.size) count+=f.xyzMaterials.size;
  }
  if(f.effects?.size) count+=f.effects.size;
  if(String(f.effectText||'').trim()) count+=1;
  return count;
}
function searchBanlistLabel() {
  const node=$('#searchBanlistFilter');
  const option=node?.querySelector(`option[value="${CSS.escape(String(state.filters.banlist || 'TCG'))}"]`);
  return option?.textContent?.trim() || String(state.filters.banlist || 'TCG');
}
function activeSearchFilterLabels() {
  const f=state.filters;
  const ctx=searchFilterContext(f);
  const labels=[];
  const query=String(f.query||'').trim();
  if(query) labels.push(`Text: ${query.length>28?`${query.slice(0,27)}…`:query}`);
  if(ctx.specific) labels.push(`${ctx.family} Cards`);
  if(ctx.type) labels.push(ctx.type);
  if(ctx.subtype) labels.push(`${ctx.subtype} subtype`);
  if(ctx.monster && !ctx.trapMonster && f.ability) labels.push(f.ability);
  if(ctx.monster && !ctx.trapMonster && f.attribute) labels.push(f.attribute);
  if(ctx.monster && !ctx.trapMonster && f.race) labels.push(f.race);
  if(ctx.specific && f.archetype) labels.push(f.archetype);
  if(f.restriction) labels.push(f.restriction);
  let statCount=0;
  if(ctx.monster && !ctx.trapMonster && !ctx.link) statCount+=['levelMin','levelMax','defMin','defMax'].filter(key=>f[key]!=='' && f[key]!=null).length;
  if(ctx.monster && !ctx.trapMonster) statCount+=['atkMin','atkMax'].filter(key=>f[key]!=='' && f[key]!=null).length;
  if(statCount) labels.push(`${statCount} stat ${statCount===1?'limit':'limits'}`);
  const scaleCount=ctx.pendulum ? ['scaleMin','scaleMax'].filter(key=>f[key]!=='' && f[key]!=null).length : 0;
  if(scaleCount) labels.push(`${scaleCount} Pendulum Scale ${scaleCount===1?'limit':'limits'}`);
  if(f.effects?.size) labels.push(`${f.effects.size} effect ${f.effects.size===1?'filter':'filters'}`);
  if(String(f.effectText||'').trim()) labels.push('Effect text');
  if(ctx.link) {
    const linkCount=(f.linkRatingMin!=='' && f.linkRatingMin!=null?1:0)+(f.linkRatingMax!=='' && f.linkRatingMax!=null?1:0)+(f.linkMarkers?.size?1:0)+(linkMaterialCriteriaActive(f)?1:0);
    if(linkCount) labels.push(`${linkCount} Link ${linkCount===1?'filter':'filters'}`);
  }
  if(ctx.xyz && xyzMaterialCriteriaActive(f)) labels.push('Xyz materials');
  return labels;
}
function updateSearchOptionsDescription() {
  const direction=state.filters.sort==='relevance' ? (state.filters.direction==='desc'?'Least relevant first':'Best match first') : (state.filters.direction==='desc'?'Descending':'Ascending');
  if(dom.searchOptionsDescriptionTitle) dom.searchOptionsDescriptionTitle.textContent=`${state.filters.cardPool || 'All'} · ${searchBanlistLabel()} · ${searchSortModeLabel()} (${direction})`;
  if(dom.searchOptionsDescriptionBody) {
    const labels=activeSearchFilterLabels();
    const filterText=labels.length?labels.join(' · '):'Any card type · Effect filters ready';
    dom.searchOptionsDescriptionBody.textContent=`${filterText} · ${Number(state.filters.maxResults)||500} results max`;
  }
}
function updateSearchFilterSummary() {
  if(!dom.searchFilterSummary) return;
  const filterCount=activeSearchFilterCount();
  const text=`${searchSortModeLabel()} · ${state.filters.cardPool || 'All'} · ${filterCount ? `${filterCount} Filter${filterCount===1?'':'s'}` : 'All Cards'}`;
  dom.searchFilterSummary.textContent=text;
  dom.searchFilterBtn?.setAttribute('title',`Search options: ${text}`);
  updateSearchOptionsDescription();
}
function updateSearchStatSummary() {
  if(!dom.searchStatSummary) return;
  const f=state.filters;
  const ctx=searchFilterContext(f);
  let statCount=0;
  if(ctx.monster && !ctx.trapMonster && !ctx.link) statCount+=['levelMin','levelMax','defMin','defMax'].filter(key=>f[key]!=='' && f[key]!=null).length;
  if(ctx.monster && !ctx.trapMonster) statCount+=['atkMin','atkMax'].filter(key=>f[key]!=='' && f[key]!=null).length;
  dom.searchStatSummary.textContent=statCount ? `${statCount} active` : 'Any Stats';
}
function renderSearchSortModeOptions() {
  if(!dom.searchSortModeOptions) return;
  dom.searchSortModeOptions.replaceChildren(...SEARCH_SORT_MODE_OPTIONS.map(([value,label])=>{
    const button=el('button','btn compact search-sort-mode-btn',label);
    button.type='button';
    button.dataset.searchSortMode=value;
    const active=state.filters.sort===value;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',active?'true':'false');
    if(active) button.dataset.direction=state.filters.direction;
    const activeHint=value==='relevance' ? (state.filters.direction==='desc'?'least relevant first; click again for best match first.':'best match first; click again for least relevant first.') : `click again to reverse.`;
    button.setAttribute('title',active?`${label}: ${activeHint}`:`Sort by ${label}.`);
    return button;
  }));
}
function syncSearchViewButtons() {
  for(const button of $$('[data-search-view]')) {
    const active=button.dataset.searchView===state.searchView;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',active?'true':'false');
    if(active) {
      button.dataset.direction=state.filters.direction;
      const directionLabel=state.filters.sort==='relevance' ? (state.filters.direction==='desc'?'least relevant first':'best match first') : (state.filters.direction==='desc'?'descending':'ascending');
      button.title=`${button.textContent.trim()}: ${searchSortModeLabel()} ${directionLabel}. Click again to reverse the current sort.`;
    } else {
      delete button.dataset.direction;
      button.title=`Switch to ${button.textContent.trim()} view.`;
    }
  }
}
function chooseSearchSortMode(mode) {
  if(!SEARCH_SORT_MODE_OPTIONS.some(([value])=>value===mode)) return;
  if(state.filters.sort===mode) state.filters.direction=state.filters.direction==='desc'?'asc':'desc';
  else {
    state.filters.sort=mode;
    state.filters.direction='asc';
  }
  renderSearchSortModeOptions();
  syncSearchViewButtons();
  updateSearchFilterSummary();
  scheduleSearch(true);
}
function fitFilterPopoverToViewport(popover, anchor) {
  if(!popover || !anchor || popover.classList.contains('hidden')) return;
  const margin=10;
  const gap=5;
  popover.style.top=`calc(100% + ${gap}px)`;
  popover.style.bottom='auto';
  popover.style.left='0px';
  popover.style.right='auto';
  popover.style.maxHeight='none';
  popover.style.overflowY='visible';
  popover.style.overflowX='hidden';
  const anchorRect=anchor.getBoundingClientRect();
  let rect=popover.getBoundingClientRect();
  let horizontalShift=0;
  if(rect.right>window.innerWidth-margin) horizontalShift-=rect.right-(window.innerWidth-margin);
  if(rect.left+horizontalShift<margin) horizontalShift+=margin-(rect.left+horizontalShift);
  if(horizontalShift) popover.style.left=`${Math.round(horizontalShift)}px`;
  rect=popover.getBoundingClientRect();
  const naturalHeight=rect.height;
  const below=Math.max(120,window.innerHeight-anchorRect.bottom-margin-gap);
  const above=Math.max(120,anchorRect.top-margin-gap);
  let available=below;
  if(naturalHeight>below && above>below) {
    popover.style.top='auto';
    popover.style.bottom=`calc(100% + ${gap}px)`;
    available=above;
  }
  if(naturalHeight>available) {
    popover.style.maxHeight=`${Math.floor(available)}px`;
    if(popover===dom.searchFilterPopover) {
      popover.style.overflowY='hidden';
      const fixed=popover.querySelector('.search-options-fixed-controls');
      const heading=popover.querySelector('.search-filter-popover-heading');
      const scroll=popover.querySelector('.search-options-scroll-body');
      if(scroll) {
        const used=(fixed?.getBoundingClientRect().height||0)+(heading?.getBoundingClientRect().height||0)+24;
        scroll.style.maxHeight=`${Math.max(120,Math.floor(available-used))}px`;
      }
    } else popover.style.overflowY='auto';
    popover.style.overscrollBehavior='contain';
  } else {
    if(popover===dom.searchFilterPopover) popover.querySelector('.search-options-scroll-body')?.style.removeProperty('max-height');
    popover.style.overscrollBehavior='auto';
  }
}
function refitOpenFilterPopovers() {
  if(dom.searchFilterPopover && !dom.searchFilterPopover.classList.contains('hidden') && optionDrawerIsOverlay('search')) fitFilterPopoverToViewport(dom.searchFilterPopover,dom.searchFilterBtn);
  if(dom.deckSortPopover && !dom.deckSortPopover.classList.contains('hidden') && optionDrawerIsOverlay('deck')) fitFilterPopoverToViewport(dom.deckSortPopover,dom.deckSortFilterBtn);
}
function openSearchFilterPopover() {
  if(!dom.searchFilterPopover) return;
  populateFilters();
  renderEffectOptions();
  const f=state.filters;
  const ctx=searchFilterContext(f);
  const statActive=(ctx.monster && !ctx.trapMonster && !ctx.link && ['levelMin','levelMax','defMin','defMax'].some(key=>f[key]!=='' && f[key]!=null)) ||
    (ctx.monster && !ctx.trapMonster && ['atkMin','atkMax'].some(key=>f[key]!=='' && f[key]!=null));
  const additionalActive=ctx.specific && Boolean(f.archetype);
  if(statActive) $('#searchStatDropdown')?.setAttribute('open','');
  if(additionalActive) $('#searchAdditionalDropdown')?.setAttribute('open','');
  if(String(f.effectText||'').trim()) $('#searchEffectTextDropdown')?.setAttribute('open','');
  if(f.effects?.size) $('#searchEffectTypeDropdown')?.setAttribute('open','');
  if(ctx.link && linkMaterialCriteriaActive(f)) $('#searchLinkMaterialsDropdown')?.setAttribute('open','');
  if(ctx.link && f.linkMaterials?.size) $('.link-material-exact-details')?.setAttribute('open','');
  if(ctx.xyz && xyzMaterialCriteriaActive(f)) $('#searchXyzMaterialsDropdown')?.setAttribute('open','');
  if(ctx.xyz && f.xyzMaterials?.size) $('.xyz-material-exact-details')?.setAttribute('open','');
  dom.searchFilterPopover.classList.remove('hidden');
  syncOptionDrawerPresentation('search');
  if(optionDrawerIsOverlay('search')) requestAnimationFrame(()=>fitFilterPopoverToViewport(dom.searchFilterPopover,dom.searchFilterBtn));
  dom.searchFilterBtn?.setAttribute('aria-expanded','true');
  updateSearchDrawerWorkspaceReservation();
  scheduleDeckLayout();
}
function closeSearchFilterPopover() {
  dom.searchFilterPopover?.classList.add('hidden');
  $('#searchLiveArea')?.classList.remove('drawer-open');
  dom.searchFilterBtn?.setAttribute('aria-expanded','false');
  updateSearchDrawerWorkspaceReservation();
  scheduleDeckLayout();
}
function toggleSearchFilterPopover() {
  if(!dom.searchFilterPopover) return;
  if(dom.searchFilterPopover.classList.contains('hidden')) openSearchFilterPopover(); else closeSearchFilterPopover();
}
function iconTuningPayload() {
  return {
    format: 5,
    app: 'YGO Deck Studio 3',
    linkArrowOverlaysEnabled: {...state.linkArrowOverlays},
    linkArrowScales: {...state.linkArrowScales},
    linkArrowScalesLinked: Boolean(state.linkArrowScalesLinked),
    linkArrowOffsets: {...state.linkArrowOffsets},
    linkArrowOffsetsX: {...state.linkArrowOffsetsX},
    linkArrowOffsetsLinked: Boolean(state.linkArrowOffsetsLinked),
    detailsPanelLinkIndicatorEnabled: Boolean(state.detailsPanelLinkIndicator),
    detailsPanelLinkIndicatorScale: state.detailsPanelLinkIndicatorScale,
    detailsPanelLinkIndicatorOffset: {...state.detailsPanelLinkIndicatorOffset},
    attributeIconScales: {...state.attributeIconScales},
    attributeIconScalesLinked: Boolean(state.attributeIconScalesLinked),
    attributeIconOffsets: structuredClone(state.attributeIconOffsets),
    attributeIconOffsetsLinked: Boolean(state.attributeIconOffsetsLinked),
    restrictionBadgeScales: {...state.restrictionBadgeScales},
    restrictionBadgeOffsets: structuredClone(state.restrictionBadgeOffsets),
    restrictionBadgeSettingsLinked: Boolean(state.restrictionBadgeSettingsLinked),
  };
}
async function saveIconTuningFile() {
  try {
    await fetch('/api/icon-tuning',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(iconTuningPayload())});
  } catch {}
}
async function restoreIconTuningFile() {
  try {
    const response=await fetch('/api/icon-tuning',{cache:'no-store'});
    if(!response.ok) return false;
    const saved=await response.json();
    if(saved.linkArrowOverlaysEnabled && typeof saved.linkArrowOverlaysEnabled==='object') {
      for(const view of ['grid','details']) if(typeof saved.linkArrowOverlaysEnabled[view]==='boolean') state.linkArrowOverlays[view]=saved.linkArrowOverlaysEnabled[view];
    } else if(typeof saved.linkArrowOverlayEnabled==='boolean') {
      state.linkArrowOverlays.grid=saved.linkArrowOverlayEnabled;
      state.linkArrowOverlays.details=saved.linkArrowOverlayEnabled;
    }
    if(saved.linkArrowScales && typeof saved.linkArrowScales==='object') for(const view of ['grid','details']) {
      const value=Number(saved.linkArrowScales[view]);
      if(Number.isFinite(value)) state.linkArrowScales[view]=Math.max(50,Math.min(200,value));
    }
    if(typeof saved.linkArrowScalesLinked==='boolean') state.linkArrowScalesLinked=saved.linkArrowScalesLinked;
    if(saved.linkArrowOffsets && typeof saved.linkArrowOffsets==='object') for(const view of ['grid','details']) {
      const value=Number(saved.linkArrowOffsets[view]);
      if(Number.isFinite(value)) state.linkArrowOffsets[view]=Math.max(-20,Math.min(20,Math.round(value)));
    }
    if(saved.linkArrowOffsetsX && typeof saved.linkArrowOffsetsX==='object') for(const view of ['grid','details']) {
      const value=Number(saved.linkArrowOffsetsX[view]);
      if(Number.isFinite(value)) state.linkArrowOffsetsX[view]=Math.max(-20,Math.min(20,Math.round(value)));
    }
    if(typeof saved.linkArrowOffsetsLinked==='boolean') state.linkArrowOffsetsLinked=saved.linkArrowOffsetsLinked;
    if(typeof saved.detailsPanelLinkIndicatorEnabled==='boolean') state.detailsPanelLinkIndicator=saved.detailsPanelLinkIndicatorEnabled;
    if(Number.isFinite(Number(saved.detailsPanelLinkIndicatorScale))) state.detailsPanelLinkIndicatorScale=Math.max(50,Math.min(200,Number(saved.detailsPanelLinkIndicatorScale)));
    if(saved.detailsPanelLinkIndicatorOffset && typeof saved.detailsPanelLinkIndicatorOffset==='object') for(const axis of ['x','y']) {
      const value=Number(saved.detailsPanelLinkIndicatorOffset[axis]); if(Number.isFinite(value)) state.detailsPanelLinkIndicatorOffset[axis]=Math.max(-30,Math.min(30,Math.round(value)));
    }
    if(saved.attributeIconScales && typeof saved.attributeIconScales==='object') for(const view of ['grid','details','list']) {
      const value=Number(saved.attributeIconScales[view]);
      if(Number.isFinite(value)) state.attributeIconScales[view]=Math.max(50,Math.min(200,value));
    }
    if(typeof saved.attributeIconScalesLinked==='boolean') state.attributeIconScalesLinked=saved.attributeIconScalesLinked;
    if(saved.attributeIconOffsets && typeof saved.attributeIconOffsets==='object') for(const view of ['grid','details','list']) {
      const pos=saved.attributeIconOffsets[view]; if(!pos || typeof pos!=='object') continue;
      for(const axis of ['x','y']) { const value=Number(pos[axis]); if(Number.isFinite(value)) state.attributeIconOffsets[view][axis]=Math.max(-20,Math.min(20,Math.round(value))); }
    }
    if(typeof saved.attributeIconOffsetsLinked==='boolean') state.attributeIconOffsetsLinked=saved.attributeIconOffsetsLinked;
    if(saved.restrictionBadgeScales && typeof saved.restrictionBadgeScales==='object') for(const context of Object.keys(state.restrictionBadgeScales)) {
      const value=Number(saved.restrictionBadgeScales[context]); if(Number.isFinite(value)) state.restrictionBadgeScales[context]=Math.max(50,Math.min(200,value));
    }
    if(saved.restrictionBadgeOffsets && typeof saved.restrictionBadgeOffsets==='object') for(const context of Object.keys(state.restrictionBadgeOffsets)) {
      const pos=saved.restrictionBadgeOffsets[context]; if(!pos || typeof pos!=='object') continue;
      for(const axis of ['x','y']) { const value=Number(pos[axis]); if(Number.isFinite(value)) state.restrictionBadgeOffsets[context][axis]=Math.max(-30,Math.min(30,Math.round(value))); }
    }
    if(typeof saved.restrictionBadgeSettingsLinked==='boolean') state.restrictionBadgeSettingsLinked=saved.restrictionBadgeSettingsLinked;
    return true;
  } catch { return false; }
}
function positionSearchScalePopover(popover) {
  if(!popover) return;
  const searchRect=dom.searchPanel?.getBoundingClientRect();
  popover.style.left='auto';
  popover.style.right='auto';
  if(searchRect && (searchRect.left + searchRect.width/2) > window.innerWidth/2) popover.style.left='16px';
  else popover.style.right='16px';
  popover.style.top=`${Math.max(74,Math.round(searchRect?.top || 74))}px`;
}
function openLinkArrowScalePopover() {
  if(!dom.linkArrowScalePopover) return;
  closeSearchFilterPopover();
  closeAttributeIconScalePopover();
  closeRestrictionBadgeToolsPopover();
  applyLinkArrowScaleStyles();
  applyLinkArrowOffsetStyles();
  applyDetailsPanelLinkIndicatorStyles();
  if(dom.linkArrowGridOverlayToggle) dom.linkArrowGridOverlayToggle.checked=Boolean(state.linkArrowOverlays.grid);
  if(dom.linkArrowDetailsOverlayToggle) dom.linkArrowDetailsOverlayToggle.checked=Boolean(state.linkArrowOverlays.details);
  positionSearchScalePopover(dom.linkArrowScalePopover);
  dom.linkArrowScalePopover.classList.remove('hidden');
}
function closeLinkArrowScalePopover() {
  dom.linkArrowScalePopover?.classList.add('hidden');
}
function toggleLinkArrowScalePopover() {
  if(!dom.linkArrowScalePopover) return;
  if(dom.linkArrowScalePopover.classList.contains('hidden')) openLinkArrowScalePopover();
  else closeLinkArrowScalePopover();
}
function applyLinkArrowOffsetStyles() {
  const gridY=Math.max(-20,Math.min(20,Math.round(Number(state.linkArrowOffsets?.grid) || 0)));
  const detailsY=Math.max(-20,Math.min(20,Math.round(Number(state.linkArrowOffsets?.details) || 0)));
  const gridX=Math.max(-20,Math.min(20,Math.round(Number(state.linkArrowOffsetsX?.grid) || 0)));
  const detailsX=Math.max(-20,Math.min(20,Math.round(Number(state.linkArrowOffsetsX?.details) || 0)));
  state.linkArrowOffsets={grid:gridY,details:detailsY};
  state.linkArrowOffsetsX={grid:gridX,details:detailsX};
  if(dom.searchResults) {
    dom.searchResults.style.setProperty('--link-arrow-grid-offset-x',`${gridX}px`);
    dom.searchResults.style.setProperty('--link-arrow-grid-offset-y',`${gridY}px`);
    dom.searchResults.style.setProperty('--link-arrow-details-offset-x',`${detailsX}px`);
    dom.searchResults.style.setProperty('--link-arrow-details-offset-y',`${detailsY}px`);
  }
  for(const [slider,valueNode,value] of [
    [dom.linkArrowGridOffset,dom.linkArrowGridOffsetValue,gridY],
    [dom.linkArrowDetailsOffset,dom.linkArrowDetailsOffsetValue,detailsY],
    [dom.linkArrowGridOffsetX,dom.linkArrowGridOffsetXValue,gridX],
    [dom.linkArrowDetailsOffsetX,dom.linkArrowDetailsOffsetXValue,detailsX],
  ]) {
    if(slider) slider.value=String(value);
    if(valueNode) valueNode.textContent=`${value > 0 ? '+' : ''}${value} px`;
  }
  if(dom.linkArrowOffsetLinked) dom.linkArrowOffsetLinked.checked=Boolean(state.linkArrowOffsetsLinked);
}
function updateLinkArrowOffset(view,axis,value,{persist=false}={}) {
  if(!['grid','details'].includes(view) || !['x','y'].includes(axis)) return;
  const number=Number(value);
  if(!Number.isFinite(number)) return;
  const normalized=Math.max(-20,Math.min(20,Math.round(number)));
  const target=axis==='x'?state.linkArrowOffsetsX:state.linkArrowOffsets;
  if(state.linkArrowOffsetsLinked) {
    target.grid=normalized;
    target.details=normalized;
  } else target[view]=normalized;
  applyLinkArrowOffsetStyles();
  if(persist) { persistState(); saveIconTuningFile(); }
}
function nudgeLinkArrowOffset(view,axis,delta) {
  const target=axis==='x'?state.linkArrowOffsetsX:state.linkArrowOffsets;
  const current=Number(target?.[view]) || 0;
  updateLinkArrowOffset(view,axis,current+delta,{persist:true});
}
function setLinkArrowOffsetsLinked(linked) {
  state.linkArrowOffsetsLinked=Boolean(linked);
  if(state.linkArrowOffsetsLinked) {
    const master=['grid','details'].includes(state.searchView)?state.searchView:'grid';
    const y=state.linkArrowOffsets[master] || 0;
    const x=state.linkArrowOffsetsX[master] || 0;
    state.linkArrowOffsets.grid=y;
    state.linkArrowOffsets.details=y;
    state.linkArrowOffsetsX.grid=x;
    state.linkArrowOffsetsX.details=x;
  }
  applyLinkArrowOffsetStyles();
  persistState(); saveIconTuningFile();
}
function applyDetailsPanelLinkIndicatorStyles() {
  const scale=Math.max(50,Math.min(200,Number(state.detailsPanelLinkIndicatorScale)||100));
  const offset=state.detailsPanelLinkIndicatorOffset || {x:0,y:0};
  offset.x=Math.max(-30,Math.min(30,Math.round(Number(offset.x)||0)));
  offset.y=Math.max(-30,Math.min(30,Math.round(Number(offset.y)||0)));
  state.detailsPanelLinkIndicatorScale=scale;
  state.detailsPanelLinkIndicatorOffset=offset;
  if(dom.searchResults) {
    dom.searchResults.style.setProperty('--details-panel-link-size',`${34*(scale/100)}px`);
    dom.searchResults.style.setProperty('--details-panel-link-offset-x',`${offset.x}px`);
    dom.searchResults.style.setProperty('--details-panel-link-offset-y',`${offset.y}px`);
  }
  if(dom.detailsPanelLinkIndicatorToggle) dom.detailsPanelLinkIndicatorToggle.checked=Boolean(state.detailsPanelLinkIndicator);
  if(dom.detailsPanelLinkIndicatorScale) dom.detailsPanelLinkIndicatorScale.value=String(scale);
  if(dom.detailsPanelLinkIndicatorScaleValue) dom.detailsPanelLinkIndicatorScaleValue.textContent=`${scale}%`;
  if(dom.detailsPanelLinkIndicatorOffsetX) dom.detailsPanelLinkIndicatorOffsetX.value=String(offset.x);
  if(dom.detailsPanelLinkIndicatorOffsetY) dom.detailsPanelLinkIndicatorOffsetY.value=String(offset.y);
  if(dom.detailsPanelLinkIndicatorOffsetXValue) dom.detailsPanelLinkIndicatorOffsetXValue.textContent=`${offset.x>0?'+':''}${offset.x} px`;
  if(dom.detailsPanelLinkIndicatorOffsetYValue) dom.detailsPanelLinkIndicatorOffsetYValue.textContent=`${offset.y>0?'+':''}${offset.y} px`;
}
function setDetailsPanelLinkIndicatorEnabled(enabled) {
  state.detailsPanelLinkIndicator=Boolean(enabled);
  applyDetailsPanelLinkIndicatorStyles();
  renderSearch();
  persistState(); saveIconTuningFile();
}
function updateDetailsPanelLinkIndicatorScale(value,{persist=false}={}) {
  const number=Number(value); if(!Number.isFinite(number)) return;
  state.detailsPanelLinkIndicatorScale=Math.max(50,Math.min(200,number));
  applyDetailsPanelLinkIndicatorStyles();
  if(persist){persistState();saveIconTuningFile();}
}
function updateDetailsPanelLinkIndicatorOffset(axis,value,{persist=false}={}) {
  if(!['x','y'].includes(axis)) return;
  const number=Number(value); if(!Number.isFinite(number)) return;
  state.detailsPanelLinkIndicatorOffset[axis]=Math.max(-30,Math.min(30,Math.round(number)));
  applyDetailsPanelLinkIndicatorStyles();
  if(persist){persistState();saveIconTuningFile();}
}
function nudgeDetailsPanelLinkIndicatorOffset(axis,delta) {
  const current=Number(state.detailsPanelLinkIndicatorOffset?.[axis])||0;
  updateDetailsPanelLinkIndicatorOffset(axis,current+delta,{persist:true});
}
function openLinkArrowOffsetPopover() { openLinkArrowScalePopover(); }
function closeLinkArrowOffsetPopover() { closeLinkArrowScalePopover(); }
function openAttributeIconScalePopover() {
  if(!dom.attributeIconScalePopover) return;
  closeSearchFilterPopover();
  closeLinkArrowScalePopover();
  closeRestrictionBadgeToolsPopover();
  applyAttributeIconScaleStyles();
  applyAttributeIconOffsetStyles();
  syncAttributeIconOffsetControls();
  positionSearchScalePopover(dom.attributeIconScalePopover);
  dom.attributeIconScalePopover.classList.remove('hidden');
}
function closeAttributeIconScalePopover() {
  dom.attributeIconScalePopover?.classList.add('hidden');
}
function toggleAttributeIconScalePopover() {
  if(!dom.attributeIconScalePopover) return;
  if(dom.attributeIconScalePopover.classList.contains('hidden')) openAttributeIconScalePopover();
  else closeAttributeIconScalePopover();
}
function pointDistanceFromRect(x,y,rect) {
  const dx=x<rect.left?rect.left-x:(x>rect.right?x-rect.right:0);
  const dy=y<rect.top?rect.top-y:(y>rect.bottom?y-rect.bottom:0);
  return Math.hypot(dx,dy);
}
function pointerFarFromPopover(event,popover,trigger) {
  if(!popover || popover.classList.contains('hidden')) return false;
  const rects=[popover.getBoundingClientRect(),trigger?.getBoundingClientRect()].filter(Boolean);
  if(!rects.length) return false;
  return Math.min(...rects.map(rect=>pointDistanceFromRect(event.clientX,event.clientY,rect)))>POPOVER_AUTO_CLOSE_DISTANCE_PX;
}
function autoCloseDetachedPopovers(event) {
  if(event.pointerType && event.pointerType!=='mouse') return;
  if(optionDrawerMayAutoDismiss('deck') && pointerFarFromPopover(event,dom.deckSortPopover,dom.deckSortFilterBtn)) closeDeckSortPopover();
  if(optionDrawerMayAutoDismiss('search') && pointerFarFromPopover(event,dom.searchFilterPopover,dom.searchFilterBtn)) closeSearchFilterPopover();
}
function updateLinkFilterSummary() {
  if(!dom.linkFilterSummary) return;
  const f=state.filters;
  const parts=[];
  const min=f.linkRatingMin, max=f.linkRatingMax;
  if(min!=='' && min!=null && max!=='' && max!=null && String(min)===String(max)) parts.push(`LINK-${min}`);
  else if((min!=='' && min!=null) || (max!=='' && max!=null)) parts.push(`LINK ${min||'1'}–${max||'8'}`);
  const arrows=f.linkMarkers?.size || 0;
  if(arrows) parts.push(`${arrows} arrow${arrows===1?'':'s'} (${f.linkMarkerMode==='Any'?'any':'all'})`);
  if(linkMaterialCriteriaActive(f)) parts.push('materials');
  dom.linkFilterSummary.textContent=parts.length ? parts.join(' · ') : 'Any Link';
}
function applyLinkArrowScaleStyles() {
  const grid=Math.max(50,Math.min(200,Number(state.linkArrowScales?.grid) || 100));
  const details=Math.max(50,Math.min(200,Number(state.linkArrowScales?.details) || 100));
  state.linkArrowScales={grid,details};
  const gridSize=20*(grid/100);
  const detailsSize=22*(details/100);
  if(dom.searchResults) {
    dom.searchResults.style.setProperty('--link-arrow-grid-size',`${gridSize}%`);
    dom.searchResults.style.setProperty('--link-arrow-details-size',`${detailsSize}%`);
    dom.searchResults.style.setProperty('--link-arrow-list-size','34px');
    const gridEdge=gridSize*0.68, gridCorner=gridEdge*0.78;
    const detailsEdge=detailsSize*0.68, detailsCorner=detailsEdge*0.78;
    applyCardOverlayGeometry('grid',gridEdge,gridCorner);
    applyCardOverlayGeometry('details',detailsEdge,detailsCorner);
  }
  if(dom.linkArrowGridScale) dom.linkArrowGridScale.value=String(grid);
  if(dom.linkArrowDetailsScale) dom.linkArrowDetailsScale.value=String(details);
  if(dom.linkArrowGridScaleValue) dom.linkArrowGridScaleValue.textContent=`${grid}%`;
  if(dom.linkArrowDetailsScaleValue) dom.linkArrowDetailsScaleValue.textContent=`${details}%`;
  if(dom.linkArrowScaleLinked) dom.linkArrowScaleLinked.checked=Boolean(state.linkArrowScalesLinked);
}
function updateLinkArrowScale(view,value,{persist=false}={}) {
  if(!['grid','details'].includes(view)) return;
  const number=Number(value);
  if(!Number.isFinite(number)) return;
  const normalized=Math.max(50,Math.min(200,number));
  if(state.linkArrowScalesLinked) {
    state.linkArrowScales.grid=normalized;
    state.linkArrowScales.details=normalized;
  } else state.linkArrowScales[view]=normalized;
  applyLinkArrowScaleStyles();
  if(persist) { persistState(); saveIconTuningFile(); }
}
function setLinkArrowScalesLinked(linked) {
  state.linkArrowScalesLinked=Boolean(linked);
  if(state.linkArrowScalesLinked) {
    const master=['grid','details'].includes(state.searchView)?state.searchView:'grid';
    const value=state.linkArrowScales[master] || 100;
    state.linkArrowScales.grid=value;
    state.linkArrowScales.details=value;
  }
  applyLinkArrowScaleStyles();
  persistState(); saveIconTuningFile();
}
function applyAttributeIconScaleStyles() {
  const grid=Math.max(50,Math.min(200,Number(state.attributeIconScales?.grid) || 100));
  const details=Math.max(50,Math.min(200,Number(state.attributeIconScales?.details) || 100));
  const list=Math.max(50,Math.min(200,Number(state.attributeIconScales?.list) || 100));
  state.attributeIconScales={grid,details,list};
  if(dom.searchResults) {
    dom.searchResults.style.setProperty('--attribute-icon-grid-size',`${20*(grid/100)}px`);
    dom.searchResults.style.setProperty('--attribute-icon-details-size',`${23*(details/100)}px`);
    dom.searchResults.style.setProperty('--attribute-icon-list-size',`${18*(list/100)}px`);
  }
  for(const [slider,valueNode,value] of [
    [dom.attributeIconGridScale,dom.attributeIconGridScaleValue,grid],
    [dom.attributeIconDetailsScale,dom.attributeIconDetailsScaleValue,details],
    [dom.attributeIconListScale,dom.attributeIconListScaleValue,list],
  ]) {
    if(slider) slider.value=String(value);
    if(valueNode) valueNode.textContent=`${value}%`;
  }
  if(dom.attributeIconScaleLinked) dom.attributeIconScaleLinked.checked=Boolean(state.attributeIconScalesLinked);
}
function updateAttributeIconScale(view,value,{persist=false}={}) {
  if(!['grid','details','list'].includes(view)) return;
  const number=Number(value);
  if(!Number.isFinite(number)) return;
  const normalized=Math.max(50,Math.min(200,number));
  if(state.attributeIconScalesLinked) {
    for(const target of ['grid','details','list']) state.attributeIconScales[target]=normalized;
  } else state.attributeIconScales[view]=normalized;
  applyAttributeIconScaleStyles();
  if(persist) { persistState(); saveIconTuningFile(); }
}
function setAttributeIconScalesLinked(linked) {
  state.attributeIconScalesLinked=Boolean(linked);
  if(state.attributeIconScalesLinked) {
    const master=['grid','details','list'].includes(state.searchView)?state.searchView:'grid';
    const value=state.attributeIconScales[master] || 100;
    for(const target of ['grid','details','list']) state.attributeIconScales[target]=value;
  }
  applyAttributeIconScaleStyles();
  persistState(); saveIconTuningFile();
}
function applyAttributeIconOffsetStyles() {
  for(const view of ['grid','details','list']) {
    const pos=state.attributeIconOffsets?.[view] || {x:0,y:0};
    pos.x=Math.max(-20,Math.min(20,Math.round(Number(pos.x)||0)));
    pos.y=Math.max(-20,Math.min(20,Math.round(Number(pos.y)||0)));
    state.attributeIconOffsets[view]=pos;
    dom.searchResults?.style.setProperty(`--attribute-icon-${view}-offset-x`,`${pos.x}px`);
    dom.searchResults?.style.setProperty(`--attribute-icon-${view}-offset-y`,`${pos.y}px`);
    dom.searchResults?.style.setProperty(`--attribute-icon-${view}-reserve-left`,`${Math.max(0,-pos.x)}px`);
    dom.searchResults?.style.setProperty(`--attribute-icon-${view}-reserve-right`,`${Math.max(0,pos.x)}px`);
    dom.searchResults?.style.setProperty(`--attribute-icon-${view}-reserve-top`,`${Math.max(0,-pos.y)}px`);
    dom.searchResults?.style.setProperty(`--attribute-icon-${view}-reserve-bottom`,`${Math.max(0,pos.y)}px`);
  }
  if(dom.attributeIconOffsetLinked) dom.attributeIconOffsetLinked.checked=Boolean(state.attributeIconOffsetsLinked);
}
function syncAttributeIconOffsetControls() {
  const context=['grid','details','list'].includes(dom.attributeIconOffsetContext?.value) ? dom.attributeIconOffsetContext.value : state.attributeIconTuningContext;
  state.attributeIconTuningContext=['grid','details','list'].includes(context)?context:'grid';
  if(dom.attributeIconOffsetContext) dom.attributeIconOffsetContext.value=state.attributeIconTuningContext;
  const pos=state.attributeIconOffsets[state.attributeIconTuningContext] || {x:0,y:0};
  if(dom.attributeIconOffsetX) dom.attributeIconOffsetX.value=String(pos.x||0);
  if(dom.attributeIconOffsetY) dom.attributeIconOffsetY.value=String(pos.y||0);
  if(dom.attributeIconOffsetXValue) dom.attributeIconOffsetXValue.textContent=`${pos.x>0?'+':''}${pos.x||0} px`;
  if(dom.attributeIconOffsetYValue) dom.attributeIconOffsetYValue.textContent=`${pos.y>0?'+':''}${pos.y||0} px`;
  if(dom.attributeIconOffsetLinked) dom.attributeIconOffsetLinked.checked=Boolean(state.attributeIconOffsetsLinked);
}
function updateAttributeIconOffset(axis,value,{persist=false}={}) {
  if(!['x','y'].includes(axis)) return;
  const number=Number(value); if(!Number.isFinite(number)) return;
  const normalized=Math.max(-20,Math.min(20,Math.round(number)));
  const context=state.attributeIconTuningContext || 'grid';
  if(state.attributeIconOffsetsLinked) {
    for(const view of ['grid','details','list']) state.attributeIconOffsets[view][axis]=normalized;
  } else state.attributeIconOffsets[context][axis]=normalized;
  applyAttributeIconOffsetStyles(); syncAttributeIconOffsetControls();
  if(persist){persistState();saveIconTuningFile();}
}
function nudgeAttributeIconOffset(axis,delta) {
  const context=state.attributeIconTuningContext || 'grid';
  const current=Number(state.attributeIconOffsets?.[context]?.[axis])||0;
  updateAttributeIconOffset(axis,current+delta,{persist:true});
}
function setAttributeIconOffsetsLinked(linked) {
  state.attributeIconOffsetsLinked=Boolean(linked);
  if(state.attributeIconOffsetsLinked) {
    const master=state.attributeIconTuningContext || 'grid';
    const pos={...state.attributeIconOffsets[master]};
    for(const view of ['grid','details','list']) state.attributeIconOffsets[view]={...pos};
  }
  applyAttributeIconOffsetStyles(); syncAttributeIconOffsetControls(); persistState(); saveIconTuningFile();
}
const RESTRICTION_BADGE_CONTEXTS=Object.freeze(['searchGrid','searchDetails','searchList','deckGrid','deckList','selectedCard']);
function applyRestrictionBadgeStyles() {
  const root=document.documentElement;
  for(const context of RESTRICTION_BADGE_CONTEXTS) {
    const scale=Math.max(50,Math.min(200,Number(state.restrictionBadgeScales?.[context])||100));
    const pos=state.restrictionBadgeOffsets?.[context] || {x:0,y:0};
    pos.x=Math.max(-30,Math.min(30,Math.round(Number(pos.x)||0)));
    pos.y=Math.max(-30,Math.min(30,Math.round(Number(pos.y)||0)));
    state.restrictionBadgeScales[context]=scale;
    state.restrictionBadgeOffsets[context]=pos;
    const css=context.replace(/[A-Z]/g,m=>`-${m.toLowerCase()}`);
    root.style.setProperty(`--restriction-${css}-scale`,String(scale/100));
    root.style.setProperty(`--restriction-${css}-offset-x`,`${pos.x}px`);
    root.style.setProperty(`--restriction-${css}-offset-y`,`${pos.y}px`);
  }
  if(dom.restrictionBadgeToolsLinked) dom.restrictionBadgeToolsLinked.checked=Boolean(state.restrictionBadgeSettingsLinked);
}
function syncRestrictionBadgeControls() {
  let context=dom.restrictionBadgeContext?.value || state.restrictionBadgeTuningContext;
  if(!RESTRICTION_BADGE_CONTEXTS.includes(context)) context='searchGrid';
  state.restrictionBadgeTuningContext=context;
  if(dom.restrictionBadgeContext) dom.restrictionBadgeContext.value=context;
  const scale=state.restrictionBadgeScales[context]||100;
  const pos=state.restrictionBadgeOffsets[context]||{x:0,y:0};
  if(dom.restrictionBadgeScale) dom.restrictionBadgeScale.value=String(scale);
  if(dom.restrictionBadgeScaleValue) dom.restrictionBadgeScaleValue.textContent=`${scale}%`;
  if(dom.restrictionBadgeOffsetX) dom.restrictionBadgeOffsetX.value=String(pos.x||0);
  if(dom.restrictionBadgeOffsetY) dom.restrictionBadgeOffsetY.value=String(pos.y||0);
  if(dom.restrictionBadgeOffsetXValue) dom.restrictionBadgeOffsetXValue.textContent=`${pos.x>0?'+':''}${pos.x||0} px`;
  if(dom.restrictionBadgeOffsetYValue) dom.restrictionBadgeOffsetYValue.textContent=`${pos.y>0?'+':''}${pos.y||0} px`;
  if(dom.restrictionBadgeToolsLinked) dom.restrictionBadgeToolsLinked.checked=Boolean(state.restrictionBadgeSettingsLinked);
}
function updateRestrictionBadgeScale(value,{persist=false}={}) {
  const number=Number(value); if(!Number.isFinite(number)) return;
  const normalized=Math.max(50,Math.min(200,number));
  const context=state.restrictionBadgeTuningContext || 'searchGrid';
  if(state.restrictionBadgeSettingsLinked) for(const key of RESTRICTION_BADGE_CONTEXTS) state.restrictionBadgeScales[key]=normalized;
  else state.restrictionBadgeScales[context]=normalized;
  applyRestrictionBadgeStyles(); syncRestrictionBadgeControls();
  if(persist){persistState();saveIconTuningFile();}
}
function updateRestrictionBadgeOffset(axis,value,{persist=false}={}) {
  if(!['x','y'].includes(axis)) return;
  const number=Number(value); if(!Number.isFinite(number)) return;
  const normalized=Math.max(-30,Math.min(30,Math.round(number)));
  const context=state.restrictionBadgeTuningContext || 'searchGrid';
  if(state.restrictionBadgeSettingsLinked) for(const key of RESTRICTION_BADGE_CONTEXTS) state.restrictionBadgeOffsets[key][axis]=normalized;
  else state.restrictionBadgeOffsets[context][axis]=normalized;
  applyRestrictionBadgeStyles(); syncRestrictionBadgeControls();
  if(persist){persistState();saveIconTuningFile();}
}
function nudgeRestrictionBadgeOffset(axis,delta) {
  const context=state.restrictionBadgeTuningContext || 'searchGrid';
  const current=Number(state.restrictionBadgeOffsets?.[context]?.[axis])||0;
  updateRestrictionBadgeOffset(axis,current+delta,{persist:true});
}
function setRestrictionBadgeSettingsLinked(linked) {
  state.restrictionBadgeSettingsLinked=Boolean(linked);
  if(state.restrictionBadgeSettingsLinked) {
    const master=state.restrictionBadgeTuningContext || 'searchGrid';
    const scale=state.restrictionBadgeScales[master]||100;
    const pos={...state.restrictionBadgeOffsets[master]};
    for(const key of RESTRICTION_BADGE_CONTEXTS){state.restrictionBadgeScales[key]=scale;state.restrictionBadgeOffsets[key]={...pos};}
  }
  applyRestrictionBadgeStyles(); syncRestrictionBadgeControls(); persistState(); saveIconTuningFile();
}
function openRestrictionBadgeToolsPopover() {
  if(!dom.restrictionBadgeToolsPopover) return;
  closeSearchFilterPopover(); closeLinkArrowScalePopover(); closeAttributeIconScalePopover();
  applyRestrictionBadgeStyles(); syncRestrictionBadgeControls();
  positionSearchScalePopover(dom.restrictionBadgeToolsPopover);
  dom.restrictionBadgeToolsPopover.classList.remove('hidden');
}
function closeRestrictionBadgeToolsPopover(){dom.restrictionBadgeToolsPopover?.classList.add('hidden');}
function renderLinkArrowFilterOptions() {
  if(!dom.linkArrowFilterGrid) return;
  const selected=state.filters.linkMarkers || new Set();
  const nodes=[];
  for(const [key,label,angle] of LINK_MARKER_LAYOUT) {
    if(key==='center') {
      const hasSelection=selected.size>0;
      const center=el('button',`link-arrow-filter-clear${hasSelection?'':' active'}`,hasSelection?'Any':'All');
      center.type='button'; center.dataset.linkArrowFilterCenter='1';
      center.title=hasSelection?'Clear selected Link Arrow directions':'Select all Link Arrow directions';
      center.setAttribute('aria-label',center.title);
      nodes.push(center); continue;
    }
    const button=el('button',`link-arrow-filter-btn link-arrow-filter-${key}${selected.has(key)?' active':''}`);
    button.type='button'; button.dataset.linkArrowFilter=key; button.title=label;
    button.setAttribute('aria-label',`${label} Link Arrow`);
    button.setAttribute('aria-pressed',selected.has(key)?'true':'false');
    button.style.setProperty('--link-arrow-angle',`${angle}deg`);
    nodes.push(button);
  }
  dom.linkArrowFilterGrid.replaceChildren(...nodes);
  updateLinkFilterSummary();
}
function toggleLinkArrowFilter(key) {
  if(!LINK_MARKER_LAYOUT.some(([value])=>value===key && value!=='center')) return;
  if(state.filters.linkMarkers.has(key)) state.filters.linkMarkers.delete(key); else state.filters.linkMarkers.add(key);
  renderLinkArrowFilterOptions(); updateLinkCriteriaSummary(); updateSearchFilterSummary(); scheduleSearch(true); persistState();
}
function toggleLinkArrowFilterCenter() {
  if(state.filters.linkMarkers.size) state.filters.linkMarkers.clear();
  else for(const [key] of LINK_MARKER_LAYOUT) if(key!=='center') state.filters.linkMarkers.add(key);
  renderLinkArrowFilterOptions(); updateLinkCriteriaSummary(); updateSearchFilterSummary(); scheduleSearch(true); persistState();
}
function clearLinkArrowFilter() {
  state.filters.linkMarkers.clear(); renderLinkArrowFilterOptions(); updateLinkCriteriaSummary(); updateSearchFilterSummary(); scheduleSearch(true); persistState();
}
function updateLinkMaterialSummary() {
  if(!dom.linkMaterialSummary) return;
  const f=state.filters;
  let count=0;
  if(f.linkMaterialMin!=='' && f.linkMaterialMin!=null) count++;
  if(f.linkMaterialMax!=='' && f.linkMaterialMax!=null) count++;
  count+=f.linkMaterialQualifiers?.size || 0;
  if(f.linkMaterialRace) count++;
  if(f.linkMaterialAttribute) count++;
  if(f.linkMaterialPattern) count++;
  count+=f.linkMaterials?.size || 0;
  dom.linkMaterialSummary.textContent=count ? `${count} active` : 'Any materials';
}
function updateLinkCriteriaSummary() {
  if(!dom.linkCriteriaSummary) return;
  const f=state.filters;
  const parts=[];
  const minRating=f.linkRatingMin, maxRating=f.linkRatingMax;
  if(minRating && maxRating && String(minRating)===String(maxRating)) parts.push(`LINK-${minRating}`);
  else if(minRating || maxRating) parts.push(`LINK ${minRating||'1'} through ${maxRating||'8'}`);
  if(f.linkMarkers?.size) parts.push(`${f.linkMarkerMode==='All'?'all':'any'} of ${f.linkMarkers.size} selected arrow direction${f.linkMarkers.size===1?'':'s'}`);
  const materialParts=[];
  if(f.linkMaterialMin) materialParts.push(`minimum ${f.linkMaterialMin}`);
  if(f.linkMaterialMax) materialParts.push(`maximum ${f.linkMaterialMax}`);
  if(f.linkMaterialQualifiers?.size) {
    const labels=[...f.linkMaterialQualifiers].map(value=>LINK_MATERIAL_QUALIFIER_OPTIONS.find(([key])=>key===value)?.[1] || value);
    materialParts.push(`${f.linkMaterialQualifierMode==='All'?'all of':'any of'} ${labels.join(', ')}`);
  }
  if(f.linkMaterialRace) materialParts.push(`${f.linkMaterialRace} material`);
  if(f.linkMaterialAttribute) materialParts.push(`${f.linkMaterialAttribute} material`);
  if(f.linkMaterialPattern) materialParts.push(linkMaterialPatternLabel(f.linkMaterialPattern));
  if(f.linkMaterials?.size) materialParts.push(`${f.linkMaterials.size} exact printed requirement${f.linkMaterials.size===1?'':'s'}`);
  if(materialParts.length) parts.push(`materials: ${materialParts.join(', ')}`);
  dom.linkCriteriaSummary.textContent=parts.length ? `Finding Link Monsters with ${parts.join(' · ')}.` : 'Any Link Monster.';
}
function renderLinkMaterialQualifierOptions() {
  if(!dom.linkMaterialQualifierOptions) return;
  const selected=state.filters.linkMaterialQualifiers || new Set();
  dom.linkMaterialQualifierOptions.replaceChildren(...LINK_MATERIAL_QUALIFIER_OPTIONS.map(([value,label])=>{
    const wrap=el('label','ui-choice-tile link-material-qualifier');
    const input=document.createElement('input'); input.type='checkbox'; input.value=value; input.checked=selected.has(value);
    wrap.append(input,el('span','ui-choice-tile-label',label));
    return wrap;
  }));
  $$('input[name="linkMaterialQualifierMode"]').forEach(r=>r.checked=r.value===state.filters.linkMaterialQualifierMode);
}
function populateLinkMaterialSelectors() {
  const fill=(node,values,current)=>{
    if(!node) return;
    node.replaceChildren(new Option('Any',''),...values.map(value=>new Option(value,value)));
    node.value=values.includes(current)?current:'';
  };
  fill(dom.linkMaterialRaceFilter,availableLinkMaterialRaces(),state.filters.linkMaterialRace || '');
  fill(dom.linkMaterialAttributeFilter,LINK_MATERIAL_ATTRIBUTES.filter(value=>(state.cards || []).some(card=>linkMaterialRequirementInfo(card)?.attributes.includes(value))),state.filters.linkMaterialAttribute || '');
  if(dom.linkMaterialMinFilter) dom.linkMaterialMinFilter.value=state.filters.linkMaterialMin || '';
  if(dom.linkMaterialMaxFilter) dom.linkMaterialMaxFilter.value=state.filters.linkMaterialMax || '';
  if(dom.linkMaterialPatternFilter) dom.linkMaterialPatternFilter.value=state.filters.linkMaterialPattern || '';
  $$('input[name="linkMarkerMode"]').forEach(r=>r.checked=r.value===state.filters.linkMarkerMode);
  renderLinkMaterialQualifierOptions();
  updateLinkCriteriaSummary();
}
function renderLinkMaterialOptions() {
  if(!dom.linkMaterialOptions) return;
  const selected=state.filters.linkMaterials || new Set();
  const query=String(dom.linkMaterialSearch?.value || '').trim().toLocaleLowerCase();
  const requirements=availableLinkMaterialRequirements().filter(value=>!query || value.toLocaleLowerCase().includes(query));
  const grouped=new Map();
  for(const requirement of requirements) {
    const group=linkMaterialGroupLabel(requirement);
    if(!grouped.has(group)) grouped.set(group,[]);
    grouped.get(group).push(requirement);
  }
  const frag=document.createDocumentFragment();
  if(!requirements.length) {
    frag.append(el('div','link-material-empty',query?'No matching Link material requirements.':'No Link material requirements are available.'));
  } else {
    for(const [group,items] of grouped) {
      const section=el('div','link-material-group');
      section.append(el('div','link-material-group-title',group));
      for(const requirement of items) {
        const wrap=el('label','link-material-option');
        const input=document.createElement('input');
        input.type='checkbox'; input.value=requirement; input.checked=selected.has(requirement);
        input.addEventListener('change',()=>{
          if(input.checked) state.filters.linkMaterials.add(requirement); else state.filters.linkMaterials.delete(requirement);
          updateLinkMaterialSummary(); updateLinkCriteriaSummary(); updateLinkFilterSummary(); updateSearchFilterSummary(); scheduleSearch(true); persistState();
        });
        wrap.append(input,el('span','link-material-option-text',requirement));
        section.append(wrap);
      }
      frag.append(section);
    }
  }
  dom.linkMaterialOptions.replaceChildren(frag);
  updateLinkMaterialSummary(); updateLinkCriteriaSummary(); updateLinkFilterSummary();
}
function clearLinkMaterialFilter() {
  state.filters.linkMaterials.clear();
  renderLinkMaterialOptions();
  updateSearchFilterSummary(); scheduleSearch(true); persistState();
}
function clearAllLinkFilters() {
  state.filters.linkRatingMin=''; state.filters.linkRatingMax='';
  state.filters.linkMarkers.clear(); state.filters.linkMarkerMode='All';
  state.filters.linkMaterialMin=''; state.filters.linkMaterialMax=''; state.filters.linkMaterialQualifiers.clear();
  state.filters.linkMaterialQualifierMode='Any'; state.filters.linkMaterialRace=''; state.filters.linkMaterialAttribute=''; state.filters.linkMaterialPattern=''; state.filters.linkMaterials.clear();
  if(dom.linkMaterialSearch) dom.linkMaterialSearch.value='';
  populateFilters(); updateLinkFilterSummary(); updateSearchFilterSummary(); scheduleSearch(true); persistState();
}
function updateXyzMaterialSummary() {
  if(!dom.xyzMaterialSummary) return;
  const f=state.filters;
  let count=0;
  for(const key of ['xyzMaterialMin','xyzMaterialMax','xyzMaterialLevelMin','xyzMaterialLevelMax']) if(f[key]!=='' && f[key]!=null) count++;
  count+=f.xyzMaterialQualifiers?.size || 0;
  if(f.xyzMaterialRace) count++;
  if(f.xyzMaterialAttribute) count++;
  if(f.xyzMaterialPattern) count++;
  count+=f.xyzMaterials?.size || 0;
  dom.xyzMaterialSummary.textContent=count ? `${count} active` : 'Any materials';
}
function updateXyzFilterSummary() {
  if(!dom.xyzFilterSummary) return;
  const f=state.filters;
  const parts=[];
  if(f.xyzMaterialMin) parts.push(`min ${f.xyzMaterialMin}`);
  if(f.xyzMaterialMax) parts.push(`max ${f.xyzMaterialMax}`);
  if(f.xyzMaterialLevelMin || f.xyzMaterialLevelMax) parts.push(`Level ${f.xyzMaterialLevelMin||'1'}-${f.xyzMaterialLevelMax||'13'}`);
  if(f.xyzMaterialQualifiers?.size) parts.push(`${f.xyzMaterialQualifiers.size} qualifier${f.xyzMaterialQualifiers.size===1?'':'s'}`);
  if(f.xyzMaterialRace) parts.push(f.xyzMaterialRace);
  if(f.xyzMaterialAttribute) parts.push(f.xyzMaterialAttribute);
  if(f.xyzMaterialPattern) parts.push(xyzMaterialPatternLabel(f.xyzMaterialPattern));
  if(f.xyzMaterials?.size) parts.push(`${f.xyzMaterials.size} exact`);
  dom.xyzFilterSummary.textContent=parts.length ? parts.join(' · ') : 'Any Xyz';
}
function renderXyzMaterialQualifierOptions() {
  if(!dom.xyzMaterialQualifierOptions) return;
  const selected=state.filters.xyzMaterialQualifiers || new Set();
  dom.xyzMaterialQualifierOptions.replaceChildren(...XYZ_MATERIAL_QUALIFIER_OPTIONS.map(([value,label])=>{
    const wrap=el('label','ui-choice-tile link-material-qualifier');
    const input=document.createElement('input'); input.type='checkbox'; input.value=value; input.checked=selected.has(value);
    wrap.append(input,el('span','ui-choice-tile-label',label));
    return wrap;
  }));
  $$('input[name="xyzMaterialQualifierMode"]').forEach(r=>r.checked=r.value===state.filters.xyzMaterialQualifierMode);
}
function populateXyzMaterialSelectors() {
  const fill=(node,values,current)=>{
    if(!node) return;
    node.replaceChildren(new Option('Any',''),...values.map(value=>new Option(value,value)));
    node.value=values.includes(current)?current:'';
  };
  fill(dom.xyzMaterialRaceFilter,availableXyzMaterialRaces(),state.filters.xyzMaterialRace || '');
  fill(dom.xyzMaterialAttributeFilter,LINK_MATERIAL_ATTRIBUTES.filter(value=>(state.cards || []).some(card=>xyzMaterialRequirementInfo(card)?.attributes.includes(value))),state.filters.xyzMaterialAttribute || '');
  if(dom.xyzMaterialMinFilter) dom.xyzMaterialMinFilter.value=state.filters.xyzMaterialMin || '';
  if(dom.xyzMaterialMaxFilter) dom.xyzMaterialMaxFilter.value=state.filters.xyzMaterialMax || '';
  if(dom.xyzMaterialLevelMinFilter) dom.xyzMaterialLevelMinFilter.value=state.filters.xyzMaterialLevelMin || '';
  if(dom.xyzMaterialLevelMaxFilter) dom.xyzMaterialLevelMaxFilter.value=state.filters.xyzMaterialLevelMax || '';
  if(dom.xyzMaterialPatternFilter) dom.xyzMaterialPatternFilter.value=state.filters.xyzMaterialPattern || '';
  renderXyzMaterialQualifierOptions();
  updateXyzMaterialSummary();
  updateXyzFilterSummary();
}
function renderXyzMaterialOptions() {
  if(!dom.xyzMaterialOptions) return;
  const selected=state.filters.xyzMaterials || new Set();
  const query=String(dom.xyzMaterialSearch?.value || '').trim().toLocaleLowerCase();
  const requirements=availableXyzMaterialRequirements().filter(value=>!query || value.toLocaleLowerCase().includes(query));
  const grouped=new Map();
  for(const requirement of requirements) {
    const group=xyzMaterialGroupLabel(requirement);
    if(!grouped.has(group)) grouped.set(group,[]);
    grouped.get(group).push(requirement);
  }
  const frag=document.createDocumentFragment();
  if(!requirements.length) {
    frag.append(el('div','link-material-empty',query?'No matching Xyz material requirements.':'No Xyz material requirements are available.'));
  } else {
    for(const [group,items] of grouped) {
      const section=el('div','link-material-group');
      section.append(el('div','link-material-group-title',group));
      for(const requirement of items) {
        const wrap=el('label','link-material-option');
        const input=document.createElement('input');
        input.type='checkbox'; input.value=requirement; input.checked=selected.has(requirement);
        input.addEventListener('change',()=>{
          if(input.checked) state.filters.xyzMaterials.add(requirement); else state.filters.xyzMaterials.delete(requirement);
          updateXyzMaterialSummary(); updateXyzFilterSummary(); updateSearchFilterSummary(); scheduleSearch(true); persistState();
        });
        wrap.append(input,el('span','link-material-option-text',requirement));
        section.append(wrap);
      }
      frag.append(section);
    }
  }
  dom.xyzMaterialOptions.replaceChildren(frag);
  updateXyzMaterialSummary(); updateXyzFilterSummary();
}
function clearXyzMaterialFilter() {
  state.filters.xyzMaterials.clear();
  renderXyzMaterialOptions();
  updateSearchFilterSummary(); scheduleSearch(true); persistState();
}
function clearAllXyzFilters() {
  state.filters.xyzMaterialMin=''; state.filters.xyzMaterialMax='';
  state.filters.xyzMaterialLevelMin=''; state.filters.xyzMaterialLevelMax='';
  state.filters.xyzMaterialQualifiers.clear(); state.filters.xyzMaterialQualifierMode='Any';
  state.filters.xyzMaterialRace=''; state.filters.xyzMaterialAttribute=''; state.filters.xyzMaterialPattern=''; state.filters.xyzMaterials.clear();
  if(dom.xyzMaterialSearch) dom.xyzMaterialSearch.value='';
  populateFilters(); updateXyzMaterialSummary(); updateXyzFilterSummary(); updateSearchFilterSummary(); scheduleSearch(true); persistState();
}
function renderEffectOptions() {
  if(!dom.effectOptions) return;
  dom.effectOptions.replaceChildren();
  EFFECT_FILTER_LABELS.forEach(label=>{
    const wrap=el('label');
    const input=document.createElement('input');
    input.type='checkbox';
    input.value=label;
    input.checked=state.filters.effects.has(label);
    input.addEventListener('change',()=>{ input.checked?state.filters.effects.add(label):state.filters.effects.delete(label); updateEffectSummary(); updateSearchFilterSummary(); scheduleSearch(); });
    const text=el('span','effect-option-label-text',label);
    wrap.append(input,text);
    dom.effectOptions.append(wrap);
  });
  $$('input[name="effectMode"]').forEach(r=>r.checked=r.value===state.filters.effectMode);
  updateEffectSummary();
}
function updateEffectSummary() { const count=state.filters.effects.size; if(dom.effectSummary) dom.effectSummary.textContent=count?`${count} selected`:'Any'; }
function updateEffectTextSummary() { if(dom.effectTextSummary) dom.effectTextSummary.textContent=String(state.filters.effectText||'').trim()?'Active':'Any'; }
function resetFilters() {
  state.filters={...state.filters,query:'',category:'',type:'',monsterSubtype:'',ability:'',attribute:'',race:'',archetype:'',effectText:'',cardPool:'TCG',banlist:'TCG',restriction:'',sort:'relevance',direction:'asc',maxResults:500,levelMin:'',levelMax:'',scaleMin:'',scaleMax:'',atkMin:'',atkMax:'',defMin:'',defMax:'',linkRatingMin:'',linkRatingMax:'',linkMarkers:new Set(),linkMarkerMode:'All',linkMaterialMin:'',linkMaterialMax:'',linkMaterialQualifiers:new Set(),linkMaterialQualifierMode:'Any',linkMaterialRace:'',linkMaterialAttribute:'',linkMaterialPattern:'',linkMaterials:new Set(),xyzMaterialMin:'',xyzMaterialMax:'',xyzMaterialLevelMin:'',xyzMaterialLevelMax:'',xyzMaterialQualifiers:new Set(),xyzMaterialQualifierMode:'Any',xyzMaterialRace:'',xyzMaterialAttribute:'',xyzMaterialPattern:'',xyzMaterials:new Set(),effects:new Set(),effectMode:'Any'};
  dom.searchInput.value=''; if(dom.searchScopeQueryFilter) dom.searchScopeQueryFilter.value=''; if(dom.effectTextFilter) dom.effectTextFilter.value=''; if(dom.linkMaterialSearch) dom.linkMaterialSearch.value=''; if(dom.xyzMaterialSearch) dom.xyzMaterialSearch.value=''; populateFilters(); renderEffectOptions(); renderSearchSortModeOptions(); updateSearchFilterSummary(); updateEffectTextSummary(); updateSearchStatSummary(); scheduleSearch(true); persistState();
}
function scheduleSearch(immediate=false) {
  clearTimeout(state.searchTimer);
  state.searchMatchesCache=null;
  state.searchTimer=setTimeout(renderSearch,immediate?0:70);
  persistState();
}
async function loadDatabase(refresh=false) {
  dom.dbStatus.textContent=refresh?'Refreshing card databases…':'Loading card database…';
  $('#refreshDbBtn').disabled=true;
  try {
    let payload;
    let cacheWarning = false;
    let rulesRefreshed = false;
    if (window.__YGO_TEST_CARD_PAYLOAD__) {
      payload = window.__YGO_TEST_CARD_PAYLOAD__;
    } else {
      const resp=await fetch(`/api/cards${refresh?'?refresh=1':''}`,{cache:'no-store'});
      if(!resp.ok){ const data=await resp.json().catch(()=>({})); throw new Error(data.error||`HTTP ${resp.status}`); }
      payload=await resp.json();
      cacheWarning = Boolean(resp.headers.get('X-YGO-Cache-Warning'));
      rulesRefreshed = resp.headers.get('X-YGO-Rules-Refreshed') === '1';
    }
    const cards=(payload.data||[]).map(normalizeCard).filter(c=>Number.isFinite(c.id)&&c.name);
    state.cards=cards; state.indexes=buildCardIndexes(cards); state.databaseLoaded=true; state.searchMatchesCache=null;
    state.archetypeNames=[...new Set(cards.map(c=>c.archetype).filter(Boolean))].sort((a,b)=>b.length-a.length);
    state.raceNames=[...new Set(cards.map(c=>c.race).filter(Boolean))].sort((a,b)=>b.length-a.length);
    state.archetypeTypeProfiles=buildArchetypeTypeProfiles(cards);
    state.cardTextHtmlCache.clear();
    const rushCount=Number(payload.ygo_rush_card_count||0);
    dom.dbStatus.textContent=`${cards.length.toLocaleString()} cards loaded${rushCount?` · Rush Duel ${rushCount.toLocaleString()}`:''}${cacheWarning?' · cached copy':''}`;
    refreshCardPoolSelectors();
    populateFilters(); renderEffectOptions();
    renderDeck(); renderSearch(); renderSelectedCard(); updateAnalysis(); syncTextView();
    toast(refresh?(rulesRefreshed?'Cards, live banlists, and card pools refreshed.':'Card database refreshed; live rule metadata used when available.'):'Card database ready.','good');
  } catch(err) {
    dom.dbStatus.textContent='Card database unavailable';
    toast(`Could not load card database: ${err.message||err}`,'error');
  } finally { $('#refreshDbBtn').disabled=false; }
}
function externalText(text) {
  return String(text ?? '').replace(/(?:\r\n|\r|\n)+$/g,'');
}
async function copyText(text,label='Copied') {
  const output=externalText(text);
  try { await navigator.clipboard.writeText(output); toast(label,'good'); }
  catch { const ta=document.createElement('textarea'); ta.value=output; document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast(label,'good'); }
}
function currentDeckTextForFileName(fileName = '') {
  const lower=String(fileName || '').toLocaleLowerCase();
  if(lower.endsWith('.ydke')) return externalText(encodeYDKE(currentCanonicalSections()));
  if(lower.endsWith('.ydk')) return externalText(sectionsToYDK(currentCanonicalSections(),state.creator));
  return externalText(sectionsToHuman(currentSections(),state.indexes.byId));
}
function setCurrentDeckFile(handle = null, fileName = '', sourcePath = '') {
  state.currentDeckFileHandle=handle || null;
  state.currentDeckFileName=String(fileName || '').trim();
  state.currentDeckFilePath=String(sourcePath || '').trim();
  state.currentDeckBackingDeckName=(state.currentDeckFileName||state.currentDeckFilePath)?String(state.deckName||'').trim():'';
  updateSaveDeckButton();
}
function deckFileExtension(fileName='') {
  const match=String(fileName||'').trim().match(/(\.[^\.\/\\]+)$/);
  return match?match[1]:'.ydk';
}
function renamedDeckTargetName() {
  const ext=deckFileExtension(state.currentDeckFileName||state.currentDeckFilePath);
  return `${safeFilename(state.deckName)}${ext}`;
}
function deckNameChangedFromBackingFile() {
  if(!(state.currentDeckFilePath||state.currentDeckFileHandle||state.currentDeckFileName))return false;
  const bound=String(state.currentDeckBackingDeckName||'').trim();
  const current=String(state.deckName||'').trim();
  return !!bound && current!==bound;
}
function siblingPathForDeck(path,fileName) {
  const value=String(path||'');
  const index=Math.max(value.lastIndexOf('/'),value.lastIndexOf('\\'));
  return index>=0?`${value.slice(0,index+1)}${fileName}`:fileName;
}
function updateSaveDeckButton() {
  if(!dom.saveDeckBtn) return;
  const fileName=state.currentDeckFileName;
  if(deckNameChangedFromBackingFile()){
    dom.saveDeckBtn.title=`Save renamed deck as ${renamedDeckTargetName()} without changing ${fileName||'the originally opened file'}`;
    return;
  }
  dom.saveDeckBtn.title=(state.currentDeckFilePath || state.currentDeckFileHandle) && fileName
    ? `Save changes directly to ${fileName}`
    : fileName
      ? `Save ${fileName}. A file location will be requested because this deck does not have a writable local path.`
      : 'Save the current deck. The first save chooses a file; later saves write to the same file.';
}
async function hostDeckFileRequest(endpoint,payload={}) {
  try {
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'});
    if(response.status===501) return null;
    let data={};
    try { data=await response.json(); } catch {}
    if(!response.ok) throw new Error(data.error || `Host file request failed (${response.status}).`);
    return data;
  } catch(err) {
    if(err instanceof TypeError) return null;
    throw err;
  }
}
async function ensureWritePermission(handle) {
  if(!handle) return false;
  try {
    if(typeof handle.queryPermission==='function') {
      const current=await handle.queryPermission({mode:'readwrite'});
      if(current==='granted') return true;
    }
    if(typeof handle.requestPermission==='function') {
      return (await handle.requestPermission({mode:'readwrite'}))==='granted';
    }
  } catch {}
  return true;
}
async function writeDeckToHandle(handle,fileName) {
  if(!handle || !await ensureWritePermission(handle)) throw new Error('Write permission was not granted.');
  const output=currentDeckTextForFileName(fileName);
  const writable=await handle.createWritable();
  await writable.write(output);
  await writable.close();
  setCurrentDeckFile(handle,fileName || handle.name || state.currentDeckFileName,'');
  rememberRecentDeck(state.currentDeckFileName || fileName || 'Deck',output,state.deckName,'');
  setDirty(false);
  toast(`Saved ${state.currentDeckFileName || fileName || 'deck'}.`,'good');
  return true;
}
async function writeDeckToHostPath(path,fileName) {
  const targetName=String(fileName || '').trim() || String(path || '').split(/[\\/]/).pop() || `${safeFilename(state.deckName)}.ydk`;
  const output=currentDeckTextForFileName(targetName);
  const result=await hostDeckFileRequest('/api/deck-file/save',{path,text:output});
  if(!result) return null;
  if(result.canceled) return false;
  const savedName=result.fileName || targetName;
  const savedPath=result.path || path;
  setCurrentDeckFile(null,savedName,savedPath);
  rememberRecentDeck(savedName,output,state.deckName,savedPath);
  setDirty(false);
  toast(`Saved ${savedName}.`,'good');
  return true;
}
async function saveDeckAsRenamedFile() {
  const targetName=renamedDeckTargetName();
  if(state.currentDeckFilePath){
    const targetPath=siblingPathForDeck(state.currentDeckFilePath,targetName);
    try{return await writeDeckToHostPath(targetPath,targetName);}
    catch(err){toast(`Could not create the renamed deck beside the original file. Choose a save location instead. ${err.message||err}`,'warn');}
  }
  const suggestedName=targetName;
  try {
    const picked=await hostDeckFileRequest('/api/deck-file/save',{suggestedName,pickOnly:true});
    if(picked){
      if(picked.canceled)return false;
      const targetPickedName=picked.fileName||suggestedName;
      const output=currentDeckTextForFileName(targetPickedName);
      const saved=await hostDeckFileRequest('/api/deck-file/save',{path:picked.path,text:output});
      if(!saved||saved.canceled)return false;
      setCurrentDeckFile(null,saved.fileName||targetPickedName,saved.path||picked.path);
      rememberRecentDeck(state.currentDeckFileName,output,state.deckName,state.currentDeckFilePath);
      setDirty(false);toast(`Saved ${state.currentDeckFileName}. The original deck file was left unchanged.`,'good');return true;
    }
  } catch(err){toast(`Desktop Save As dialog was unavailable; using the browser save picker. ${err.message||err}`,'warn');}
  const lower=suggestedName.toLocaleLowerCase();
  const pickerTypes=lower.endsWith('.ydke')
    ? [{description:'YDKE Deck',accept:{'text/plain':['.ydke']}}]
    : lower.endsWith('.ydk')
      ? [{description:'YDK Deck',accept:{'text/plain':['.ydk']}}]
      : [{description:'Readable Deck',accept:{'text/plain':['.txt','.md','.list','.deck','.csv','.tsv']}}];
  try {
    if('showSaveFilePicker' in window){
      const handle=await window.showSaveFilePicker({suggestedName,types:pickerTypes});
      return await writeDeckToHandle(handle,handle.name||suggestedName);
    }
  } catch(err){if(err?.name==='AbortError')return false;toast(`Could not save renamed deck: ${err.message||err}`,'error');return false;}
  await saveTextFile(suggestedName,currentDeckTextForFileName(suggestedName),pickerTypes);
  setDirty(false);return true;
}
async function saveDeckToCurrentFile() {
  if(deckNameChangedFromBackingFile())return saveDeckAsRenamedFile();
  if(state.currentDeckFilePath) {
    try {
      const saved=await writeDeckToHostPath(state.currentDeckFilePath,state.currentDeckFileName);
      if(saved!==null) return saved;
    } catch(err) {
      toast(`Could not write to the opened file directly. Choose a save location instead. ${err.message || err}`,'warn');
      setCurrentDeckFile(null,state.currentDeckFileName,'');
    }
  }
  const existing=state.currentDeckFileHandle;
  if(existing) {
    try {
      return await writeDeckToHandle(existing,state.currentDeckFileName || existing.name || `${safeFilename(state.deckName)}.ydk`);
    } catch(err) {
      if(err?.name==='AbortError') return false;
      toast(`Could not save the opened file: ${err.message || err}`,'error');
      return false;
    }
  }
  const suggestedName=state.currentDeckFileName || `${safeFilename(state.deckName)}.ydk`;
  try {
    const picked=await hostDeckFileRequest('/api/deck-file/save',{suggestedName,pickOnly:true});
    if(picked) {
      if(picked.canceled) return false;
      const targetName=picked.fileName || suggestedName;
      const output=currentDeckTextForFileName(targetName);
      const saved=await hostDeckFileRequest('/api/deck-file/save',{path:picked.path,text:output});
      if(!saved || saved.canceled) return false;
      setCurrentDeckFile(null,saved.fileName || targetName,saved.path || picked.path);
      rememberRecentDeck(state.currentDeckFileName,output,state.deckName,state.currentDeckFilePath);
      setDirty(false);
      toast(`Saved ${state.currentDeckFileName}.`,'good');
      return true;
    }
  } catch(err) {
    toast(`Desktop Save dialog was unavailable; using the browser save picker. ${err.message || err}`,'warn');
  }
  const lower=suggestedName.toLocaleLowerCase();
  const pickerTypes=lower.endsWith('.ydke')
    ? [{description:'YDKE Deck',accept:{'text/plain':['.ydke']}}]
    : lower.endsWith('.ydk')
      ? [{description:'YDK Deck',accept:{'text/plain':['.ydk']}}]
      : [{description:'Readable Deck',accept:{'text/plain':['.txt','.md','.list','.deck','.csv','.tsv']}}];
  try {
    if('showSaveFilePicker' in window) {
      const handle=await window.showSaveFilePicker({suggestedName,types:pickerTypes});
      return await writeDeckToHandle(handle,handle.name || suggestedName);
    }
  } catch(err) {
    if(err?.name==='AbortError') return false;
    toast(`Could not save deck: ${err.message || err}`,'error');
    return false;
  }
  await saveTextFile(suggestedName,currentDeckTextForFileName(suggestedName),pickerTypes);
  return true;
}
async function saveTextFile(suggestedName,text,types) {
  const output=externalText(text);
  try {
    if ('showSaveFilePicker' in window) {
      const handle=await window.showSaveFilePicker({suggestedName,types});
      const writable=await handle.createWritable(); await writable.write(output); await writable.close();
      toast(`Saved ${suggestedName}.`,'good'); return;
    }
  } catch(err) { if(err?.name==='AbortError') return; }
  const blob=new Blob([output],{type:'text/plain;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=suggestedName; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
async function openDeckFile() {
  try {
    const opened=await hostDeckFileRequest('/api/deck-file/open');
    if(opened) {
      if(opened.canceled) return;
      if(loadOpenedDeckText(opened.text,opened.fileName,{remember:true,sourcePath:opened.path})) {
        setCurrentDeckFile(null,opened.fileName,opened.path);
      }
      return;
    }
  } catch(err) {
    toast(`Desktop Open dialog was unavailable; using the browser picker. ${err.message || err}`,'warn');
  }
  try {
    if ('showOpenFilePicker' in window) {
      const [handle]=await window.showOpenFilePicker({types:[{description:'Yu-Gi-Oh deck files',accept:{'text/plain':['.ydk','.ydke','.txt','.md','.list','.deck','.csv','.tsv']}}],multiple:false});
      const file=await handle.getFile(); await readDeckFile(file,{handle}); return;
    }
  } catch(err){ if(err?.name==='AbortError') return; }
  dom.fileInput.click();
}
function parseDeckText(text, nameHint = '') {
  const trimmed=String(text||'').trim();
  if (!trimmed) throw new Error('Clipboard or file is empty.');
  if(trimmed.toLocaleLowerCase().startsWith('ydke://')) return {sections:decodeYDKE(trimmed),issues:[]};
  if(nameHint.toLocaleLowerCase().endsWith('.ydk') || /(^|\n)#main\s*$/im.test(text)) return parseYDK(text);
  return humanToSections(text,state.indexes,{autoExtra:true});
}
function getRecentDecks() {
  try {
    const raw=JSON.parse(localStorage.getItem(RECENT_DECKS_KEY)||'[]');
    if(!Array.isArray(raw)) return [];
    return raw.filter(item=>item&&typeof item.fileName==='string'&&typeof item.text==='string')
      .slice(0,RECENT_DECKS_LIMIT)
      .map(item=>({fileName:item.fileName,deckName:item.deckName||item.fileName.replace(/\.[^.]+$/,''),text:item.text,sourcePath:String(item.sourcePath||''),openedAt:Number(item.openedAt)||0}));
  } catch { return []; }
}
function saveRecentDecks(items) {
  try { localStorage.setItem(RECENT_DECKS_KEY,JSON.stringify(items.slice(0,RECENT_DECKS_LIMIT))); } catch {}
}
function rememberRecentDeck(fileName,text,deckName,sourcePath='') {
  const cleanName=String(fileName||'Deck').trim()||'Deck';
  const key=cleanName.toLocaleLowerCase();
  const items=getRecentDecks().filter(item=>item.fileName.toLocaleLowerCase()!==key);
  items.unshift({fileName:cleanName,deckName:deckName||cleanName.replace(/\.[^.]+$/,''),text:String(text||''),sourcePath:String(sourcePath||''),openedAt:Date.now()});
  saveRecentDecks(items);
  renderRecentDecks();
}
function renderRecentDecks() {
  if(!dom.recentDeckList) return;
  const items=getRecentDecks();
  if(!items.length) {
    const empty=el('div','recent-deck-empty','No recently opened decks.');
    dom.recentDeckList.replaceChildren(empty);
    return;
  }
  const nodes=items.map((item,index)=>{
    const button=el('button','recent-deck-item');
    button.type='button'; button.setAttribute('role','menuitem');
    const name=el('span','recent-deck-name',item.fileName);
    const when=item.openedAt?new Date(item.openedAt).toLocaleString():'';
    const meta=el('span','recent-deck-meta',when);
    button.append(name,meta);
    button.addEventListener('click',()=>openRecentDeck(index));
    return button;
  });
  dom.recentDeckList.replaceChildren(...nodes);
}
function loadOpenedDeckText(text,fileName,{remember=true,sourcePath=''}={}) {
  if(!state.databaseLoaded) { toast('Card database is still loading.','warn'); return false; }
  const displayName=String(fileName||'Deck');
  const nextDeckName=displayName.replace(/\.[^.]+$/,'')||'Deck';
  try {
    const {sections,issues=[]}=parseDeckText(text,displayName);
    state.deckName=nextDeckName; dom.deckName.value=state.deckName;
    const limitIssues=loadSections(sections,{correctPlacement:true});
    resetDeckHistory();
    setDirty(false);
    if(remember) rememberRecentDeck(displayName,text,state.deckName,sourcePath);
    const allIssues=[...issues,...limitIssues];
    if(allIssues.length) toast(`Opened with ${allIssues.length} issue${allIssues.length===1?'':'s'}. ${limitIssues[0]||''}`.trim(),'warn'); else toast(`Opened ${displayName}.`,'good');
    return true;
  } catch(err){ toast(`Could not open deck: ${err.message||err}`,'error'); return false; }
}
async function openRecentDeck(index) {
  const item=getRecentDecks()[Number(index)];
  if(!item) return;
  closeAppMenus();
  setCurrentDeckFile(null,'','');
  if(item.sourcePath) {
    try {
      const opened=await hostDeckFileRequest('/api/deck-file/read',{path:item.sourcePath});
      if(opened) {
        const fileName=opened.fileName || item.fileName;
        const sourcePath=opened.path || item.sourcePath;
        if(loadOpenedDeckText(opened.text,fileName,{remember:false,sourcePath})) {
          setCurrentDeckFile(null,fileName,sourcePath);
          rememberRecentDeck(fileName,opened.text,item.deckName,sourcePath);
          return;
        }
      }
    } catch {
      toast('The original Recent file is unavailable. Loaded the cached deck copy instead.','warn');
    }
  }
  if(loadOpenedDeckText(item.text,item.fileName,{remember:false})) {
    setCurrentDeckFile(null,item.fileName,'');
    rememberRecentDeck(item.fileName,item.text,item.deckName,'');
  }
}
function deckLibraryExtension(name='') {
  const match=String(name||'').toLocaleLowerCase().match(/\.[^.\\/]+$/);
  return match?.[0]||'';
}
function openDeckLibraryDatabase() {
  if(deckLibraryDbPromise)return deckLibraryDbPromise;
  deckLibraryDbPromise=new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)){reject(new Error('The installed browser runtime does not support persistent directory access.'));return;}
    const request=indexedDB.open(DECK_LIBRARY_DB_NAME,1);
    request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(DECK_LIBRARY_STORE))db.createObjectStore(DECK_LIBRARY_STORE,{keyPath:'id'});};
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error('Deck Library storage could not be opened.'));
  });
  return deckLibraryDbPromise;
}
async function deckLibraryGetAllRecords() {
  const db=await openDeckLibraryDatabase();
  return new Promise((resolve,reject)=>{const request=db.transaction(DECK_LIBRARY_STORE,'readonly').objectStore(DECK_LIBRARY_STORE).getAll();request.onsuccess=()=>resolve(Array.isArray(request.result)?request.result:[]);request.onerror=()=>reject(request.error);});
}
async function deckLibraryPutRecord(record) {
  const db=await openDeckLibraryDatabase();
  return new Promise((resolve,reject)=>{const request=db.transaction(DECK_LIBRARY_STORE,'readwrite').objectStore(DECK_LIBRARY_STORE).put(record);request.onsuccess=()=>resolve(record);request.onerror=()=>reject(request.error);});
}
async function deckLibraryDeleteRecord(id) {
  const db=await openDeckLibraryDatabase();
  return new Promise((resolve,reject)=>{const request=db.transaction(DECK_LIBRARY_STORE,'readwrite').objectStore(DECK_LIBRARY_STORE).delete(id);request.onsuccess=()=>resolve();request.onerror=()=>reject(request.error);});
}
async function deckLibraryPermission(handle,{request=false}={}) {
  if(!handle)return'denied';
  try{
    if(typeof handle.queryPermission==='function'){const current=await handle.queryPermission({mode:'read'});if(current==='granted'||!request)return current;}
    if(request&&typeof handle.requestPermission==='function')return await handle.requestPermission({mode:'read'});
  }catch{}
  return typeof handle.values==='function'?'granted':'denied';
}
async function deckLibraryWalk(record,handle,prefix='',depth=0,result={decks:[],invalid:0,oversized:0,limited:false}) {
  if(depth>DECK_LIBRARY_MAX_DEPTH||result.decks.length>=DECK_LIBRARY_MAX_FILES){result.limited=true;return result;}
  for await(const [name,entry] of handle.entries()){
    if(result.decks.length>=DECK_LIBRARY_MAX_FILES){result.limited=true;break;}
    const relative=prefix?`${prefix}/${name}`:name;
    if(entry.kind==='directory'){
      if(!name.startsWith('.'))await deckLibraryWalk(record,entry,relative,depth+1,result);
      continue;
    }
    if(entry.kind!=='file'||!DECK_LIBRARY_EXTENSIONS.has(deckLibraryExtension(name)))continue;
    try{
      const file=await entry.getFile();
      if(file.size>DECK_LIBRARY_MAX_FILE_BYTES){result.oversized+=1;continue;}
      const text=await file.text();
      const parsed=parseDeckText(text,name),duelDeck=duelDeckFromSections(parsed.sections);
      if(![...duelDeck.main,...duelDeck.extra,...duelDeck.side].length){result.invalid+=1;continue;}
      result.decks.push({
        libraryKey:`${record.id}:${relative.toLocaleLowerCase()}`,
        recordId:record.id,directoryName:record.name,relativePath:relative,fileName:name,
        name:name.replace(/\.[^.]+$/,'')||name,text,deck:duelDeck,
        fileHandle:entry,lastModified:Number(file.lastModified)||0,sourcePath:'',sourceLabel:`${record.name}/${relative}`,
      });
    }catch{result.invalid+=1;}
  }
  return result;
}
async function scanDeckLibraryRecord(record,{requestPermission=false}={}) {
  const permission=await deckLibraryPermission(record.handle,{request:requestPermission});
  const next={...record,name:record.name||record.handle?.name||'Deck Folder',permission,lastScanAt:Date.now(),error:''};
  if(permission!=='granted'){next.deckCount=0;next.invalidCount=0;return{record:next,decks:[]};}
  try{
    const result=await deckLibraryWalk(next,next.handle);
    next.deckCount=result.decks.length;next.invalidCount=result.invalid;next.oversizedCount=result.oversized;next.scanLimited=!!result.limited;
    return{record:next,decks:result.decks};
  }catch(error){next.error=String(error?.message||error);next.deckCount=0;return{record:next,decks:[]};}
}
async function refreshDeckLibrary({requestPermission=false,recordId=null}={}) {
  if(deckLibraryRefreshPromise)return deckLibraryRefreshPromise;
  deckLibraryRefreshPromise=(async()=>{
    const nextRecords=[],nextDecks=recordId?deckLibraryDecks.filter(item=>item.recordId!==recordId):[];
    for(const record of deckLibraryRecords){
      if(recordId&&record.id!==recordId){nextRecords.push(record);continue;}
      const scanned=await scanDeckLibraryRecord(record,{requestPermission});nextRecords.push(scanned.record);nextDecks.push(...scanned.decks);
      try{await deckLibraryPutRecord(scanned.record);}catch{}
    }
    deckLibraryRecords=nextRecords;
    deckLibraryDecks=nextDecks.sort((a,b)=>a.name.localeCompare(b.name)||a.sourceLabel.localeCompare(b.sourceLabel));
    const inaccessible=deckLibraryRecords.filter(item=>item.permission!=='granted').length;
    const errors=deckLibraryRecords.filter(item=>item.error).length;
    deckLibraryStatus=`${deckLibraryDecks.length.toLocaleString()} deck${deckLibraryDecks.length===1?'':'s'} indexed from ${deckLibraryRecords.length.toLocaleString()} director${deckLibraryRecords.length===1?'y':'ies'}${inaccessible?` · ${inaccessible} need${inaccessible===1?'s':''} access`:''}${errors?` · ${errors} scan error${errors===1?'':'s'}`:''}.`;
    return deckLibraryDecks;
  })();
  try{return await deckLibraryRefreshPromise;}finally{deckLibraryRefreshPromise=null;renderDeckLibraryDialog();}
}
async function initializeDeckLibrary() {
  if(deckLibraryReadyPromise)return deckLibraryReadyPromise;
  deckLibraryReady=false;
  deckLibraryReadyPromise=(async()=>{
    try{deckLibraryRecords=await deckLibraryGetAllRecords();await refreshDeckLibrary({requestPermission:false});}
    catch(error){deckLibraryRecords=[];deckLibraryDecks=[];deckLibraryStatus=String(error?.message||error);renderDeckLibraryDialog();}
    finally{deckLibraryReady=true;}
    return deckLibraryDecks;
  })();
  return deckLibraryReadyPromise;
}
async function addDeckLibraryDirectory() {
  if(typeof window.showDirectoryPicker!=='function'){toast('Persistent deck directories require a current Microsoft Edge WebView2 Runtime.','error');return;}
  try{
    const handle=await window.showDirectoryPicker({mode:'read',id:'ygo-deck-studio-library'});
    for(const record of deckLibraryRecords){try{
      const same=record.handle?.isSameEntry&&await record.handle.isSameEntry(handle),insideExisting=record.handle?.resolve&&await record.handle.resolve(handle),containsExisting=handle.resolve&&await handle.resolve(record.handle);
      if(same||insideExisting||containsExisting){toast(`${handle.name} overlaps the existing ${record.name} Deck Library directory.`,'warn');await refreshDeckLibrary({recordId:record.id,requestPermission:true});return;}
    }catch{}}
    const record={id:crypto.randomUUID?.()||`deck-dir-${Date.now()}-${Math.random()}`,name:handle.name||'Deck Folder',handle,addedAt:Date.now(),permission:'granted',deckCount:0,invalidCount:0,lastScanAt:0,error:''};
    deckLibraryRecords.push(record);await deckLibraryPutRecord(record);await refreshDeckLibrary({recordId:record.id,requestPermission:true});toast(`Added ${record.name} to the Deck Library.`,'good');
  }catch(error){if(error?.name!=='AbortError')toast(`Could not add deck directory: ${error?.message||error}`,'error');}
}
async function reconnectDeckLibraryDirectory(id) {
  const record=deckLibraryRecords.find(item=>item.id===id);if(!record)return;
  const permission=await deckLibraryPermission(record.handle,{request:true});
  if(permission!=='granted'){toast(`Read access was not granted for ${record.name}.`,'warn');renderDeckLibraryDialog();return;}
  await refreshDeckLibrary({recordId:id,requestPermission:false});
}
async function removeDeckLibraryDirectory(id) {
  const record=deckLibraryRecords.find(item=>item.id===id);if(!record)return;
  deckLibraryRecords=deckLibraryRecords.filter(item=>item.id!==id);deckLibraryDecks=deckLibraryDecks.filter(item=>item.recordId!==id);
  try{await deckLibraryDeleteRecord(id);}catch{}
  deckLibraryStatus=`${deckLibraryDecks.length.toLocaleString()} deck${deckLibraryDecks.length===1?'':'s'} indexed from ${deckLibraryRecords.length.toLocaleString()} director${deckLibraryRecords.length===1?'y':'ies'}.`;
  renderDeckLibraryDialog();toast(`Removed ${record.name} from the Deck Library.`,'good');
}
async function openDeckLibraryEntry(libraryKey) {
  const item=deckLibraryDecks.find(deck=>deck.libraryKey===libraryKey);if(!item)return;
  try{
    const file=await item.fileHandle.getFile(),text=await file.text();
    if(loadOpenedDeckText(text,file.name||item.fileName,{remember:true,sourcePath:''})){
      setCurrentDeckFile(item.fileHandle,file.name||item.fileName,'');
      const dialog=$('#deckLibraryDialog');if(dialog?.open)dialog.close();
    }
  }catch(error){toast(`Could not open library deck: ${error?.message||error}`,'error');}
}
function getDeckLibraryDuelChoices() {
  return deckLibraryDecks.map(item=>({name:item.name,fileName:item.fileName,deck:item.deck,sourcePath:'',sourceLabel:item.sourceLabel,libraryKey:item.libraryKey}));
}
async function chooseDeckLibraryDuelDeck() {
  await initializeDeckLibrary();
  return new Promise(resolve=>{
    const dialog=document.createElement('dialog');dialog.className='modal deck-library-modal';
    dialog.innerHTML='<form method="dialog" class="modal-shell deck-library-shell"><div class="modal-heading"><div><h2>Choose Deck from Library</h2><p>Select an indexed deck from your configured directories.</p></div></div><input class="deck-library-choice-search" type="search" placeholder="Filter library decks" aria-label="Filter library decks"><div class="deck-library-deck-list"></div><div class="modal-actions"><button value="cancel" class="btn">Cancel</button></div></form>';
    const search=dialog.querySelector('input'),list=dialog.querySelector('.deck-library-deck-list');let picked=null;
    const render=()=>{const term=String(search.value||'').trim().toLocaleLowerCase();const items=deckLibraryDecks.filter(item=>!term||`${item.name} ${item.sourceLabel}`.toLocaleLowerCase().includes(term)).slice(0,160);if(!items.length){list.replaceChildren(el('div','deck-library-empty',deckLibraryReady?'No indexed decks match.':'Deck Library is still loading.'));return;}list.replaceChildren(...items.map(item=>{const button=el('button','deck-library-deck');button.type='button';const copy=el('span','deck-library-deck-copy');copy.append(el('strong','',item.name),el('small','',item.sourceLabel));button.append(copy);button.addEventListener('click',()=>{picked={name:item.name,fileName:item.fileName,deck:item.deck,sourcePath:'',sourceLabel:item.sourceLabel,libraryKey:item.libraryKey};dialog.close('selected');});return button;}));};
    search.addEventListener('input',render);dialog.addEventListener('close',()=>{dialog.remove();resolve(dialog.returnValue==='selected'?picked:null);},{once:true});document.body.append(dialog);render();dialog.showModal();requestAnimationFrame(()=>search.focus());
  });
}
function renderDeckLibraryDialog() {
  const dialog=$('#deckLibraryDialog');if(!dialog)return;
  const directoryList=$('#deckLibraryDirectoryList'),deckList=$('#deckLibraryDeckList'),status=$('#deckLibraryStatus'),search=$('#deckLibrarySearch');
  if(status)status.textContent=deckLibraryRefreshPromise?'Scanning configured directories...':(deckLibraryStatus||'No deck directories are configured.');
  if(directoryList){
    if(!deckLibraryRecords.length)directoryList.replaceChildren(el('div','deck-library-empty','No directories configured. Add a folder containing deck files.'));
    else directoryList.replaceChildren(...deckLibraryRecords.map(record=>{
      const row=el('article','deck-library-directory');
      const copy=el('div','deck-library-directory-copy');copy.append(el('strong','',record.name),el('span','',record.permission==='granted'?`${Number(record.deckCount||0).toLocaleString()} deck${Number(record.deckCount||0)===1?'':'s'} indexed${record.error?` · ${record.error}`:''}`:'Read access must be reconnected.'));
      const actions=el('div','deck-library-directory-actions');
      if(record.permission!=='granted'){const reconnect=el('button','btn compact','Reconnect');reconnect.type='button';reconnect.addEventListener('click',()=>reconnectDeckLibraryDirectory(record.id));actions.append(reconnect);}
      const refresh=el('button','btn compact ghost','Refresh');refresh.type='button';refresh.addEventListener('click',()=>refreshDeckLibrary({recordId:record.id,requestPermission:false}));
      const remove=el('button','btn compact ghost','Remove');remove.type='button';remove.addEventListener('click',()=>removeDeckLibraryDirectory(record.id));actions.append(refresh,remove);row.append(copy,actions);return row;
    }));
  }
  if(deckList){
    const query=String(search?.value||'').trim().toLocaleLowerCase();
    const items=deckLibraryDecks.filter(item=>!query||`${item.name} ${item.fileName} ${item.sourceLabel}`.toLocaleLowerCase().includes(query)).slice(0,500);
    if(!items.length)deckList.replaceChildren(el('div','deck-library-empty',deckLibraryRecords.length?'No indexed decks match the current filter.':'Add a deck directory to build the library.'));
    else deckList.replaceChildren(...items.map(item=>{const row=el('button','deck-library-deck');row.type='button';const copy=el('span','deck-library-deck-copy');copy.append(el('strong','',item.name),el('small','',item.sourceLabel));row.append(copy,el('span','deck-library-open-label','Open'));row.addEventListener('click',()=>openDeckLibraryEntry(item.libraryKey));return row;}));
  }
}
function installDeckLibraryUI() {
  if(!$('#deckLibraryDialog')){
    const dialog=document.createElement('dialog');dialog.id='deckLibraryDialog';dialog.className='modal deck-library-modal';dialog.innerHTML=`<form method="dialog" class="modal-shell deck-library-shell"><div class="modal-heading"><div><h2>Deck Library Directories</h2><p>Add folders that Deck Studio scans recursively for supported deck files.</p></div></div><div class="deck-library-toolbar"><button id="deckLibraryAdd" type="button" class="btn">Add Directory...</button><button id="deckLibraryRefresh" type="button" class="btn ghost">Refresh All</button><input id="deckLibrarySearch" type="search" placeholder="Filter indexed decks" aria-label="Filter indexed decks"></div><section class="deck-library-section"><h3>Configured Directories</h3><div id="deckLibraryDirectoryList" class="deck-library-directory-list"></div></section><section class="deck-library-section deck-library-decks-section"><div class="deck-library-section-head"><h3>Indexed Decks</h3><span id="deckLibraryStatus"></span></div><div id="deckLibraryDeckList" class="deck-library-deck-list"></div></section><div class="modal-actions"><button value="cancel" class="btn">Close</button></div></form>`;document.body.append(dialog);
    $('#deckLibraryAdd')?.addEventListener('click',addDeckLibraryDirectory);$('#deckLibraryRefresh')?.addEventListener('click',()=>refreshDeckLibrary({requestPermission:false}));$('#deckLibrarySearch')?.addEventListener('input',renderDeckLibraryDialog);
    const style=document.createElement('style');style.id='deckLibraryStyles';style.textContent=`.deck-library-modal{width:min(980px,94vw)}.deck-library-shell{width:min(980px,94vw);max-height:min(860px,92vh);display:flex;flex-direction:column;gap:14px}.deck-library-toolbar{display:grid;grid-template-columns:auto auto minmax(220px,1fr);gap:10px;align-items:center}.deck-library-toolbar input{min-width:0}.deck-library-section{display:flex;flex-direction:column;gap:8px;min-height:0}.deck-library-section h3{margin:0}.deck-library-section-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px}.deck-library-section-head span{font-size:12px;color:var(--muted);text-align:right}.deck-library-directory-list{display:grid;gap:8px;max-height:210px;overflow:auto}.deck-library-directory{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:11px 12px;border:1px solid var(--border);border-radius:12px;background:var(--surface-2)}.deck-library-directory-copy{display:grid;gap:3px;min-width:0}.deck-library-directory-copy span{font-size:12px;color:var(--muted);overflow-wrap:anywhere}.deck-library-directory-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.deck-library-decks-section{flex:1}.deck-library-deck-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;overflow:auto;min-height:180px;padding-right:3px}.deck-library-deck{display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;border:1px solid var(--border);background:var(--surface-2);color:inherit;border-radius:11px;padding:10px 12px;cursor:pointer}.deck-library-deck:hover{border-color:var(--accent)}.deck-library-deck-copy{display:grid;gap:2px;min-width:0}.deck-library-deck-copy strong,.deck-library-deck-copy small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.deck-library-deck-copy small{color:var(--muted)}.deck-library-open-label{font-size:12px;color:var(--accent);font-weight:700}.deck-library-empty{padding:18px;border:1px dashed var(--border);border-radius:11px;color:var(--muted);text-align:center}@media(max-width:720px){.deck-library-toolbar{grid-template-columns:1fr 1fr}.deck-library-toolbar input{grid-column:1/-1}.deck-library-deck-list{grid-template-columns:1fr}.deck-library-directory{align-items:flex-start;flex-direction:column}.deck-library-directory-actions{justify-content:flex-start}}`;document.head.append(style);
  }
  const anchor=document.querySelector('[data-menu-action="open-data"]');if(anchor&&!document.querySelector('[data-menu-action="deck-directories"]')){const button=document.createElement('button');button.type='button';button.setAttribute('role','menuitem');button.dataset.menuAction='deck-directories';button.innerHTML='<span>Deck Library Directories...</span>';anchor.before(button);}
}
async function openDeckLibraryDialog() {
  closeAppMenus();installDeckLibraryUI();const dialog=$('#deckLibraryDialog');if(!dialog)return [];
  const closed=new Promise(resolve=>dialog.addEventListener('close',()=>resolve(deckLibraryDecks),{once:true}));const ready=initializeDeckLibrary();dialog.setAttribute('aria-busy','true');renderDeckLibraryDialog();if(!dialog.open)dialog.showModal();
  Promise.resolve(ready).catch(()=>{}).finally(()=>{dialog.removeAttribute('aria-busy');renderDeckLibraryDialog();});return closed;
}
async function readDroppedDeck(dataTransfer) {
  if(!dataTransfer) return false;
  const items=[...(dataTransfer.items || [])];
  const fileItem=items.find(item=>item?.kind==='file');
  if(fileItem && typeof fileItem.getAsFileSystemHandle==='function') {
    try {
      const handle=await fileItem.getAsFileSystemHandle();
      if(handle?.kind==='file') {
        const file=await handle.getFile();
        await readDeckFile(file,{handle});
        return true;
      }
    } catch {}
  }
  const file=dataTransfer.files?.[0];
  if(!file) return false;
  await readDeckFile(file);
  return true;
}
async function readDeckFile(file,{handle=null,sourcePath=''}={}) {
  const text=await file.text();
  const fileName=file.name||'Deck';
  if(loadOpenedDeckText(text,fileName,{remember:true,sourcePath})) {
    setCurrentDeckFile(handle,fileName,sourcePath);
  }
}
async function importClipboard() {
  try {
    const text=await navigator.clipboard.readText();
    const {sections,issues=[]}=parseDeckText(text,'clipboard');
    const limitIssues=loadSections(sections,{correctPlacement:true,recordHistory:true});
    const allIssues=[...issues,...limitIssues];
    if(allIssues.length) toast(`Clipboard imported with ${allIssues.length} issue${allIssues.length===1?'':'s'}. ${limitIssues[0]||''}`.trim(),'warn'); else toast('Clipboard deck imported.','good');
  } catch(err) { toast(`Could not import clipboard: ${err.message||err}`,'error'); }
}
async function newDeckAction() {
  if(state.dirty && !await appConfirm('Clear the current deck and start a new one?')) return;
  state.deck=newDeck(); setCurrentDeckFile(null,''); state.loadedDeckOrder=null; state.savedDeckOrder=null; state.nextUid=1; state.selectedCardId=null; state.selectedEntryUid=null; state.selectedEntryUids.clear(); state.selectedArtworkId=null; state.selectionAnchorUid=null; state.deckName='Untitled Deck'; dom.deckName.value=state.deckName; resetDeckHistory(); renderDeck(); renderSelectedCard(); updateAnalysis(); syncTextView(); setDirty(false);
}
function drawHand() {
  const entries=[...state.deck[SECTION_MAIN]];
  if(entries.length<5){ toast('Main Deck needs at least 5 cards to draw a hand.','warn'); return; }
  for(let i=entries.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [entries[i],entries[j]]=[entries[j],entries[i]]; }
  dom.handCards.replaceChildren();
  entries.slice(0,5).forEach(entry=>{ const card=state.indexes.byId.get(Number(entry.id)); const btn=el('button','hand-card'); btn.type='button'; const img=new Image(); img.src=card?imageUrlFor(card,entry.id,false):''; img.alt=card?.name||String(entry.id); btn.append(img); btn.addEventListener('click',()=>card&&openArt(card,entry.id)); dom.handCards.append(btn); });
  if(!dom.handDialog.open) dom.handDialog.showModal();
}
async function handoff(kind) {
  const sections=currentCanonicalSections(); const ydke=encodeYDKE(sections); const ydk=sectionsToYDK(sections,state.creator);
  const config={
    ygoprodeck:{url:`https://ygoprodeck.com/deckbuilder/?y=${encodeURIComponent(ydke.slice(7))}`,copy:ydke,label:'Copied YDKE and opened YGOPRODeck.'},
    duelingbook:{url:'https://www.duelingbook.com/',copy:ydke,label:'Copied YDKE and opened DuelingBook.'},
    duelingnexus:{url:'https://duelingnexus.com/decks',copy:ydk,label:'Copied YDK and opened Dueling Nexus.'},
    konami:{url:'https://www.db.yugioh-card.com/yugiohdb/member_deck.action',copy:ydke,label:'Copied YDKE and opened Konami / Neuron My Deck.'},
  }[kind];
  if(!config)return; await copyText(config.copy,config.label.split(' and ')[0]);
  try{ await fetch(`/api/open-external?url=${encodeURIComponent(config.url)}`); toast(config.label,'good'); }catch{ window.open(config.url,'_blank'); }
}
function showContextMenu(x,y,items) {
  dom.contextMenu.replaceChildren();
  for(const item of items){ if(item.separator){dom.contextMenu.append(document.createElement('hr'));continue;} const b=el('button',item.danger?'danger':'',item.label); b.addEventListener('click',()=>{hideContextMenu();item.action();}); dom.contextMenu.append(b); }
  dom.contextMenu.classList.remove('hidden'); dom.contextMenu.style.left=`${Math.min(x,innerWidth-190)}px`; dom.contextMenu.style.top=`${Math.min(y,innerHeight-dom.contextMenu.offsetHeight-10)}px`;
}
function hideContextMenu(){dom.contextMenu.classList.add('hidden');}
function lineIndexFromPointer(textarea, clientY) {
  const rect=textarea.getBoundingClientRect();
  const style=getComputedStyle(textarea);
  const fontSize=parseFloat(style.fontSize)||14;
  const lineHeight=parseFloat(style.lineHeight)||fontSize*1.35;
  const paddingTop=parseFloat(style.paddingTop)||0;
  return Math.max(0,Math.floor((clientY-rect.top+textarea.scrollTop-paddingTop)/lineHeight));
}
function textLineCardInfo(line,index=null) {
  if(index!=null && state.textLineMap?.[index]?.card) return state.textLineMap[index];
  const raw=String(line||'').trim(); if(!raw) return null;
  if(state.deckView==='ydk') {
    if(!/^\d+$/.test(raw)) return null;
    const id=Number(raw), card=state.indexes.byId.get(id);
    return card?{card,artworkId:id}:null;
  }
  const resolved=humanLineCard(raw,state.indexes);
  const card=resolved?.card;
  return card?{card,artworkId:card.images?.[0]?.id||card.id,quantity:resolved.quantity}:null;
}
function refreshReadableRecognition() {
  if(state.deckView!=='readable') return;
  try {
    const parsed=humanToSections(dom.deckTextArea.value,state.indexes,{autoExtra:true});
    dom.parseIssues.textContent=(parsed.issues||[]).join('\n');
  } catch(err) { dom.parseIssues.textContent=String(err.message||err); }
  if(state.textSelectedLine!=null){
    const info=textLineCardInfo(textLineAtIndex(state.textSelectedLine),state.textSelectedLine);
    if(info) selectCard(info.card,info.entryUid ?? null,info.artworkId);
  }
  if(state.textHoverLine!=null){
    const info=textLineCardInfo(textLineAtIndex(state.textHoverLine),state.textHoverLine);
    if(info) setHoverPreview(info.card,null,info.artworkId); else clearHoverPreview();
  }
}
function scheduleReadableRecognition() {
  clearTimeout(state.readableRecognitionTimer);
  state.readableRecognitionTimer=setTimeout(refreshReadableRecognition,90);
}
function textLineAtIndex(index) { return dom.deckTextArea.value.split(/\r?\n/)[index] ?? ''; }
function positionTextLineMarker(marker,index) {
  if(!marker || index==null || !['readable','ydk'].includes(state.deckView)) {
    marker?.classList.add('hidden');
    return;
  }
  const style=getComputedStyle(dom.deckTextArea);
  const fontSize=parseFloat(style.fontSize)||14;
  const lineHeight=parseFloat(style.lineHeight)||fontSize*1.45;
  const paddingTop=parseFloat(style.paddingTop)||0;
  const top=paddingTop+index*lineHeight-dom.deckTextArea.scrollTop;
  if(top+lineHeight<0 || top>dom.deckTextArea.clientHeight) {
    marker.classList.add('hidden');
    return;
  }
  marker.style.top=`${top}px`;
  marker.style.height=`${lineHeight}px`;
  marker.classList.remove('hidden');
}
function positionTextLineHover(index) { positionTextLineMarker(dom.textLineHover,index); }
function positionTextLineSelection(index) { positionTextLineMarker(dom.textLineSelection,index); }
function previewTextLine(ev) {
  if(!['readable','ydk'].includes(state.deckView)) return;
  const index=lineIndexFromPointer(dom.deckTextArea,ev.clientY);
  state.textHoverLine=index;
  positionTextLineHover(index);
  const info=textLineCardInfo(textLineAtIndex(index),index);
  if(info) setHoverPreview(info.card,info.entryUid ?? null,info.artworkId); else clearHoverPreview();
}
function clearTextLineHover() {
  state.textHoverLine=null;
  dom.textLineHover?.classList.add('hidden');
  clearHoverPreview();
}
function selectCursorTextLine() {
  if(!['readable','ydk'].includes(state.deckView)) return;
  const before=dom.deckTextArea.value.slice(0,dom.deckTextArea.selectionStart||0);
  const index=(before.match(/\n/g)||[]).length;
  state.textSelectedLine=index;
  positionTextLineSelection(index);
  const info=textLineCardInfo(textLineAtIndex(index),index);
  if(info) selectCard(info.card,info.entryUid ?? null,info.artworkId);
}
function setCollapsible(body,button,collapsed,label) {
  if(!body||!button) return;
  body.classList.toggle('collapsed',collapsed);
  button.textContent=collapsed?'v':'^';
  button.setAttribute('aria-expanded',String(!collapsed));
  button.title=`${collapsed?'Expand':'Collapse'} ${label}`;
}
function deckZoneIsCollapsed(section) {
  return Boolean(state.deckZoneCollapsed?.[section]);
}
function syncDeckZoneCollapseControls(section, collapsed) {
  collapsed=Boolean(collapsed);
  if(!state.deckZoneCollapsed) state.deckZoneCollapsed={main:false,extra:false,side:false};
  state.deckZoneCollapsed[section]=collapsed;
  const zone=document.querySelector(`.deck-zone[data-section="${section}"]`);
  zone?.classList.toggle('zone-collapsed',collapsed);
  const gridButton=zone?.querySelector('[data-zone-toggle]');
  if(gridButton){gridButton.textContent=collapsed?'v':'^';gridButton.setAttribute('aria-expanded',String(!collapsed));gridButton.title=`${collapsed?'Expand':'Collapse'} ${SECTION_LABELS[section]}`;}
  const listSection=dom.listDeckView?.querySelector(`.deck-list-section[data-section="${section}"]`);
  listSection?.classList.toggle('list-zone-collapsed',collapsed);
  const listTable=listSection?.querySelector('.deck-table');
  if(listTable){listTable.hidden=collapsed;listTable.setAttribute('aria-hidden',String(collapsed));}
  const listButton=listSection?.querySelector('[data-list-zone-toggle]');
  if(listButton){listButton.textContent=collapsed?'v':'^';listButton.setAttribute('aria-expanded',String(!collapsed));listButton.title=`${collapsed?'Expand':'Collapse'} ${SECTION_LABELS[section]}`;}
}
function setDeckZoneCollapsed(section, collapsed, {persist=true}={}) {
  syncDeckZoneCollapseControls(section,Boolean(collapsed));
  if(persist) savePanelPrefs();
  scheduleDeckLayout();
}
function applyLoadedDeckZoneDefaults() {
  for (const section of [SECTION_EXTRA,SECTION_SIDE]) {
    syncDeckZoneCollapseControls(section,state.deck[section].length === 0);
  }
  scheduleDeckLayout();
}
function isDeckDropTargetElement(target) {
  return Boolean(target?.closest?.('.drop-zone, .deck-zone.zone-collapsed, .deck-list-section'));
}
function setupCollapsibles() {
  const pairs=[
    [$('#selectedPanelBody'),$('#collapseSelectedBtn'),'Card Details'],
    [$('#analysisPanelBody'),$('#collapseAnalysisBtn'),'Analysis'],
  ];
  for(const [body,button,label] of pairs) {
    button?.addEventListener('click',()=>{setCollapsible(body,button,!body.classList.contains('collapsed'),label);savePanelPrefs();scheduleDeckLayout();});
  }
  $$('[data-zone-toggle]').forEach(button=>button.addEventListener('click',()=>{
    const zone=button.closest('.deck-zone');
    setDeckZoneCollapsed(zone.dataset.section,!zone.classList.contains('zone-collapsed'));
  }));
  const prefs=state._pendingPanelPrefs||{};
  for(const [body,button,label] of pairs) setCollapsible(body,button,Boolean(prefs.collapsedSections?.[body?.id]),label);
  for(const section of SECTION_ORDER) {
    syncDeckZoneCollapseControls(section,Boolean(prefs.collapsedZones?.[section]));
  }
  state._pendingPanelPrefs=null;
}
function setupDropZones() {
  $$('.drop-zone').forEach(zone=>{
    zone.addEventListener('dragover',ev=>{
      const hasFile=Boolean(ev.dataTransfer?.files?.length || ev.dataTransfer?.types?.includes('Files'));
      if(hasFile){ev.preventDefault();zone.classList.add('drag-over');ev.dataTransfer.dropEffect='copy';return;}
      if(!state.dragged)return;
      ev.preventDefault();zone.classList.add('drag-over');ev.dataTransfer.dropEffect=state.dragged.source==='search'?'copy':'move';
    });
    zone.addEventListener('dragleave',ev=>{if(!zone.contains(ev.relatedTarget))zone.classList.remove('drag-over');});
    zone.addEventListener('drop',async ev=>{
      const hasFile=Boolean(ev.dataTransfer?.files?.length || ev.dataTransfer?.types?.includes('Files'));
      if(hasFile){
        ev.preventDefault();ev.stopPropagation();zone.classList.remove('drag-over');
        await readDroppedDeck(ev.dataTransfer);finishDrag();return;
      }
      if(!state.dragged)return;
      ev.preventDefault();zone.classList.remove('drag-over');handleDrop(zone.dataset.section,null,false);
    });
  });
  $$('.deck-zone').forEach(zone=>{
    zone.addEventListener('dragover',ev=>{
      if(!zone.classList.contains('zone-collapsed')) return;
      const hasFile=Boolean(ev.dataTransfer?.files?.length || ev.dataTransfer?.types?.includes('Files'));
      if(!hasFile && !state.dragged) return;
      ev.preventDefault();ev.stopPropagation();zone.classList.add('drag-over');
      ev.dataTransfer.dropEffect=hasFile?'copy':(state.dragged.source==='search'?'copy':'move');
    });
    zone.addEventListener('dragleave',ev=>{if(!zone.contains(ev.relatedTarget))zone.classList.remove('drag-over');});
    zone.addEventListener('drop',async ev=>{
      if(!zone.classList.contains('zone-collapsed')) return;
      const hasFile=Boolean(ev.dataTransfer?.files?.length || ev.dataTransfer?.types?.includes('Files'));
      if(hasFile){
        ev.preventDefault();ev.stopPropagation();zone.classList.remove('drag-over');
        await readDroppedDeck(ev.dataTransfer);finishDrag();return;
      }
      if(!state.dragged) return;
      ev.preventDefault();ev.stopPropagation();zone.classList.remove('drag-over');
      handleDrop(zone.dataset.section,null,false);
    });
  });
  dom.removeDrop.addEventListener('dragover',ev=>{if(state.dragged?.source==='deck'){ev.preventDefault();dom.removeDrop.classList.add('drag-over');ev.dataTransfer.dropEffect='move';}});
  dom.removeDrop.addEventListener('dragleave',()=>dom.removeDrop.classList.remove('drag-over'));
  dom.removeDrop.addEventListener('drop',ev=>{ev.preventDefault();dom.removeDrop.classList.remove('drag-over');if(state.dragged?.source==='deck'){state.lastDropHandled=true;removeEntries(state.dragged.uids?.length?state.dragged.uids:[state.dragged.uid]);}finishDrag();});
}
const PANEL_LIMITS = Object.freeze({
  leftMin: 110,
  rightMin: 140,
  deckMin: 80,
  leftMax: 560,
  rightMax: 560,
  pinnedSearchMax: 1400,
  chrome: 18,
});
function clampNumber(value, min, max) { return Math.max(min, Math.min(max, value)); }
function pinnedSearchPaneMinimum() {
  if(!optionDrawerIsPinnedDocked('search') || dom.searchFilterPopover?.classList.contains('hidden')) return PANEL_LIMITS.leftMin;
  const drawer=clampNumber(Number(state.optionDrawers.search.width)||OPTION_DRAWER_LIMITS.search.fallback,OPTION_DRAWER_LIMITS.search.min,OPTION_DRAWER_LIMITS.search.max);
  return Math.ceil(drawer+PANEL_LIMITS.leftMin+searchPinnedLayoutChrome());
}
function pinnedSearchPaneMaximumForDrawer() {
  const drawer=clampNumber(Number(state.optionDrawers.search.width)||OPTION_DRAWER_LIMITS.search.fallback,OPTION_DRAWER_LIMITS.search.min,OPTION_DRAWER_LIMITS.search.max);
  return Math.ceil(drawer+PANEL_LIMITS.leftMax+searchPinnedLayoutChrome());
}
function searchPaneMaximum(workspaceWidth,rightWidth=0) {
  const available=Math.max(PANEL_LIMITS.leftMin,workspaceWidth-rightWidth-PANEL_LIMITS.deckMin-PANEL_LIMITS.chrome);
  const configured=optionDrawerIsPinnedDocked('search') ? pinnedSearchPaneMaximumForDrawer() : PANEL_LIMITS.leftMax;
  return Math.max(PANEL_LIMITS.leftMin,Math.min(configured,available));
}
function paneManualClass(side) { return side === 'left' ? 'hide-search' : 'hide-right'; }
function paneAutoClass(side) { return side === 'left' ? 'auto-hide-search' : 'auto-hide-right'; }
function isPaneManuallyHidden(side) { return dom.workspace.classList.contains(paneManualClass(side)); }
function isPaneAutoHidden(side) { return dom.workspace.classList.contains(paneAutoClass(side)); }
function isPaneHidden(side) { return isPaneManuallyHidden(side) || isPaneAutoHidden(side); }
function responsivePaneTier(width = dom.workspace?.clientWidth || window.innerWidth || 0) {
  const w = Math.max(0, Number(width) || 0);
  if (w < 720) return 'deck-only';
  if (w < 980) return 'single-pane';
  if (w < 1280) return 'compact';
  return 'wide';
}
function applyResponsivePanePolicy(width = dom.workspace?.clientWidth || window.innerWidth || 0) {
  if (!dom.workspace) return 'wide';
  const tier = responsivePaneTier(width);
  state.responsiveTier = tier;
  if (tier === 'wide' || tier === 'compact') state.responsivePaneOverride.right = false;
  if (tier !== 'deck-only') state.responsivePaneOverride.left = false;
  const autoHideRight = (tier === 'single-pane' || tier === 'deck-only') && !state.responsivePaneOverride.right;
  const autoHideLeft = tier === 'deck-only' && !state.responsivePaneOverride.left;
  dom.workspace.classList.toggle('auto-hide-right', autoHideRight);
  dom.workspace.classList.toggle('auto-hide-search', autoHideLeft);
  dom.workspace.dataset.responsiveTier = tier;
  return tier;
}
function currentPanelWidths() {
  const rootStyles=getComputedStyle(document.documentElement);
  return {
    left: parseFloat(rootStyles.getPropertyValue('--left-width')) || dom.searchPanel?.getBoundingClientRect().width || 340,
    right: parseFloat(rootStyles.getPropertyValue('--right-width')) || dom.rightPanel?.getBoundingClientRect().width || 360,
  };
}
function fitResponsivePaneWidths({force=false}={}) {
  if (!dom.workspace) return;
  const workspaceWidth=Math.max(1,dom.workspace.clientWidth);
  const tier=applyResponsivePanePolicy(workspaceWidth);
  const leftVisible=!isPaneHidden('left');
  const rightVisible=!isPaneHidden('right');
  const current=currentPanelWidths();
  if (!state.panelRatios.left) state.panelRatios.left=current.left/Math.max(workspaceWidth,1);
  if (!state.panelRatios.right) state.panelRatios.right=current.right/Math.max(workspaceWidth,1);
  const pinnedLeftMin=leftVisible?pinnedSearchPaneMinimum():0;
  const leftMax=leftVisible?searchPaneMaximum(workspaceWidth,rightVisible?current.right:0):PANEL_LIMITS.leftMax;
  let left=leftVisible ? clampNumber(workspaceWidth*state.panelRatios.left,Math.min(pinnedLeftMin,leftMax),leftMax) : 0;
  let right=rightVisible ? clampNumber(workspaceWidth*state.panelRatios.right,PANEL_LIMITS.rightMin,PANEL_LIMITS.rightMax) : 0;
  const pinnedSearchActive=pinnedSearchPaneMinimum()>PANEL_LIMITS.leftMin;
  if (tier === 'compact') {
    left = leftVisible ? (pinnedSearchActive?left:Math.min(left, 420)) : 0;
    right = rightVisible ? Math.min(right, 350) : 0;
  } else if (tier === 'single-pane') {
    left = leftVisible ? (pinnedSearchActive?left:Math.min(left, 330)) : 0;
    right = rightVisible ? Math.min(right, 300) : 0;
  } else if (tier === 'deck-only') {
    left = leftVisible ? Math.min(left, 300) : 0;
    right = rightVisible ? Math.min(right, 300) : 0;
  }
  const splitterSpace=(leftVisible?5:0)+(rightVisible?5:0)+16;
  const maxSideTotal=Math.max(0,workspaceWidth-PANEL_LIMITS.deckMin-splitterSpace);
  const total=left+right;
  if (total>maxSideTotal) {
    const leftFloor=leftVisible?Math.min(pinnedSearchPaneMinimum(),Math.max(PANEL_LIMITS.leftMin,maxSideTotal-(rightVisible?PANEL_LIMITS.rightMin:0))):0;
    const rightFloor=rightVisible?PANEL_LIMITS.rightMin:0;
    const floorTotal=leftFloor+rightFloor;
    const reducible=Math.max(0,total-floorTotal);
    const need=Math.max(0,total-maxSideTotal);
    if (reducible>0) {
      const scale=Math.max(0,(reducible-need)/reducible);
      left=leftFloor+(left-leftFloor)*scale;
      right=rightFloor+(right-rightFloor)*scale;
    } else {
      left=leftFloor; right=rightFloor;
    }
  }
  const maxSingle=Math.max(0,workspaceWidth-PANEL_LIMITS.deckMin-splitterSpace);
  if (leftVisible&&!rightVisible) left=Math.min(left,maxSingle);
  if (rightVisible&&!leftVisible) right=Math.min(right,maxSingle);
  if (leftVisible) document.documentElement.style.setProperty('--left-width',`${Math.max(0,Math.floor(left))}px`);
  if (rightVisible) document.documentElement.style.setProperty('--right-width',`${Math.max(0,Math.floor(right))}px`);
  state.lastWorkspaceWidth=workspaceWidth;
  updateSearchDrawerWorkspaceReservation();
  if (force) scheduleDeckLayout();
}
function setupSplitters() {
  const bind=(node,side)=>{
    let active=false;
    node.addEventListener('pointerdown',ev=>{
      if (isPaneHidden(side)) return;
      active=true;node.classList.add('dragging');node.setPointerCapture(ev.pointerId);ev.preventDefault();
    });
    node.addEventListener('pointermove',ev=>{
      if(!active)return;
      const workspaceRect=dom.workspace.getBoundingClientRect();
      const leftVisible=!isPaneHidden('left');
      const rightVisible=!isPaneHidden('right');
      const swapped=state.sidePanelsSwapped;
      if(side==='left') {
        const rightWidth=rightVisible?dom.rightPanel.getBoundingClientRect().width:0;
        const maxLeft=searchPaneMaximum(workspaceRect.width,rightWidth);
        const minLeft=Math.min(pinnedSearchPaneMinimum(),maxLeft);
        const rawWidth=swapped ? workspaceRect.right-ev.clientX-4 : ev.clientX-workspaceRect.left-4;
        const width=clampNumber(rawWidth,minLeft,maxLeft);
        if(optionDrawerIsPinnedDocked('search') && !dom.searchFilterPopover?.classList.contains('hidden')) {
          state.optionDrawers.search.pinnedPaneWidth=width;
          state.optionDrawers.search.pinnedPaneManual=true;
          dom.workspace.style.setProperty('--search-options-expanded-width',`${Math.round(width)}px`);
        } else {
          document.documentElement.style.setProperty('--left-width',`${width}px`);
          state.panelRatios.left=width/Math.max(1,workspaceRect.width);
        }
      } else {
        const leftWidth=leftVisible?dom.searchPanel.getBoundingClientRect().width:0;
        const maxRight=Math.max(PANEL_LIMITS.rightMin,workspaceRect.width-leftWidth-PANEL_LIMITS.deckMin-PANEL_LIMITS.chrome);
        const rawWidth=swapped ? ev.clientX-workspaceRect.left-4 : workspaceRect.right-ev.clientX-4;
        const width=clampNumber(rawWidth,PANEL_LIMITS.rightMin,Math.min(PANEL_LIMITS.rightMax,maxRight));
        document.documentElement.style.setProperty('--right-width',`${width}px`);
        state.panelRatios.right=width/Math.max(1,workspaceRect.width);
      }
      updateSearchDrawerWorkspaceReservation();
      scheduleDeckLayout();
    });
    const stop=()=>{if(!active)return;active=false;node.classList.remove('dragging');fitResponsivePaneWidths();updateSearchDrawerWorkspaceReservation();savePanelPrefs();};
    node.addEventListener('pointerup',stop); node.addEventListener('pointercancel',stop);
    node.addEventListener('dblclick',ev=>{
      if(isPaneHidden(side)) return;
      ev.preventDefault();
      ev.stopPropagation();
      setPaneHidden(side,true);
    });
  };
  bind($('#leftSplitter'),'left');bind($('#rightSplitter'),'right');
}
function setPaneHidden(side, hidden, {overrideAuto=false}={}) {
  const manualClass = paneManualClass(side);
  dom.workspace.classList.toggle(manualClass, Boolean(hidden));
  if (hidden) state.responsivePaneOverride[side] = false;
  else if (overrideAuto) state.responsivePaneOverride[side] = true;
  applyResponsivePanePolicy();
  fitResponsivePaneWidths({force:true});
  savePanelPrefs();
}
function updatePanelSwapControls() {
  dom.workspace?.classList.toggle('panels-swapped',state.sidePanelsSwapped);
  if(dom.swapPanelsBtn) {
    const title=state.sidePanelsSwapped?'Return Card Search to the left and Card Details to the right':'Swap Card Details with Card Search';
    dom.swapPanelsBtn.title=title;
    dom.swapPanelsBtn.setAttribute('aria-label',title);
    dom.swapPanelsBtn.setAttribute('aria-pressed',String(state.sidePanelsSwapped));
  }
  const searchRestore=$('#restoreSearchPaneBtn')?.querySelector('[aria-hidden="true"]');
  const detailsRestore=$('#restoreRightPaneBtn')?.querySelector('[aria-hidden="true"]');
  if(searchRestore) searchRestore.textContent=state.sidePanelsSwapped?'‹':'›';
  if(detailsRestore) detailsRestore.textContent=state.sidePanelsSwapped?'›':'‹';
}
function setSidePanelsSwapped(swapped,{persist=true}={}) {
  state.sidePanelsSwapped=Boolean(swapped);
  updatePanelSwapControls();
  fitResponsivePaneWidths({force:true});
  if(persist) savePanelPrefs();
}
function setupPaneCollapseButtons() {
  $('#restoreSearchPaneBtn')?.addEventListener('click',ev=>{ev.stopPropagation();setPaneHidden('left',false,{overrideAuto:true});});
  $('#restoreRightPaneBtn')?.addEventListener('click',ev=>{ev.stopPropagation();setPaneHidden('right',false,{overrideAuto:true});});
  dom.swapPanelsBtn?.addEventListener('click',()=>setSidePanelsSwapped(!state.sidePanelsSwapped));
  updatePanelSwapControls();
}
function closeAppMenus() {
  for(const [menuId,buttonId] of [['appCommandMenu','appMenuBtn'],['websiteCommandMenu','websiteMenuBtn'],['recentDeckMenu','recentDeckBtn']]) {
    document.getElementById(menuId)?.classList.remove('open');
    document.getElementById(buttonId)?.setAttribute('aria-expanded','false');
  }
}
function openHelpDialog() {
  const dialog=$('#helpDialog');
  if(!dialog) return;
  if(!dialog.open) dialog.showModal();
  const content=dialog.querySelector('.help-content');
  if(content) content.scrollTop=0;
}
function deckZoneCountsSnapshot() {
  return Object.fromEntries(SECTION_ORDER.map(section=>[section,state.deck[section]?.length || 0]));
}
function reconcileDeckZoneOccupancy(previousCounts) {
  if(!previousCounts) return;
  for(const section of SECTION_ORDER) {
    const before=Number(previousCounts[section] || 0);
    const after=state.deck[section]?.length || 0;
    if(before>0 && after===0) syncDeckZoneCollapseControls(section,true);
    else if(before===0 && after>0 && deckZoneIsCollapsed(section)) syncDeckZoneCollapseControls(section,false);
  }
}
async function clearDeckAction() {
  const hasCards=SECTION_ORDER.some(section=>state.deck[section].length);
  if(!hasCards) return;
  if(!await appConfirm('Clear the Main, Extra, and Side Decks?')) return;
  const before=captureDeckSnapshot();
  const previousCounts=deckZoneCountsSnapshot();
  state.deck=newDeck(); state.nextUid=1; state.selectedEntryUid=null; state.selectedEntryUids.clear(); state.selectedCardId=null; state.selectedArtworkId=null; state.selectionAnchorUid=null;
  reconcileDeckZoneOccupancy(previousCounts);
  renderDeck(); renderSelectedCard(); updateAnalysis(); syncTextView(); setDirty(); commitDeckHistory(before);
}
function restoreDefaultLayout() {
  dom.workspace.classList.remove('hide-search','hide-right','auto-hide-search','auto-hide-right');
  state.responsivePaneOverride.left=false; state.responsivePaneOverride.right=false;
  setSidePanelsSwapped(false,{persist:false});
  const workspaceWidth=Math.max(1,dom.workspace.clientWidth||window.innerWidth||1);
  state.panelRatios.left=340/workspaceWidth;
  state.panelRatios.right=360/workspaceWidth;
  document.documentElement.style.setProperty('--left-width','340px');
  document.documentElement.style.setProperty('--right-width','360px');
  document.querySelectorAll('.collapsible-body').forEach(body=>body.classList.remove('collapsed'));
  for(const section of SECTION_ORDER) setDeckZoneCollapsed(section,false,{persist:false});
  document.querySelectorAll('.collapse-btn').forEach(button=>{button.textContent='^';button.setAttribute('aria-expanded','true');});
  for(const kind of ['search','deck']) {
    const cfg=state.optionDrawers[kind];
    cfg.pinned=false; cfg.returnPinned=false; cfg.x=null; cfg.y=null; cfg.width=kind==='search'?380:400;
    if(kind==='search') { cfg.pinRestoreLeftWidth=null; cfg.pinRestoreLeftRatio=null; cfg.pinRestoreResultsWidth=null; cfg.pinnedPaneWidth=null; cfg.pinnedPaneManual=false; }
    if(kind==='search') searchOptionsPinned=false; else deckSortPinned=false;
    setOptionDrawerDocked(kind,true,{persist:false});
    syncOptionDrawerControls(kind);
  }
  fitResponsivePaneWidths({force:true});
  savePanelPrefs();
  persistState();
}
function syncCardTextStylingControl() {
  const control=document.querySelector('[data-menu-action="toggle-card-text-styling"]');
  if(control) {
    control.setAttribute('aria-checked',String(state.cardTextStyling));
    const status=control.querySelector('[data-card-text-styling-status]');
    if(status) status.textContent=state.cardTextStyling?'On':'Off';
    control.title=state.cardTextStyling?'Disable bold and colored card-text emphasis':'Enable bold and colored card-text emphasis';
  }
  const inline=dom.cardTextStylingInline;
  if(inline) {
    inline.setAttribute('aria-pressed',String(state.cardTextStyling));
    const label=inline.querySelector('[data-card-text-styling-inline-label]');
    if(label) label.textContent=state.cardTextStyling?'Styled':'Plain';
    inline.title=state.cardTextStyling?'Turn bold and colored card-text emphasis off':'Turn bold and colored card-text emphasis on';
  }
}
function toggleCardTextStyling() {
  state.cardTextStyling=!state.cardTextStyling;
  persistState();
  syncCardTextStylingControl();
  renderSelectedCard({syncSearchSelection:false});
}
function requestApplicationShutdown() {
  state.allowUnloadOnce=true;
  try{navigator.sendBeacon?.('/api/shutdown-request',new Blob([],{type:'text/plain'}));}catch{}
  window.close();
}
function appExitSaveChoice() {
  const dialog=dom.confirmDialog;
  if(!dialog) return Promise.resolve('stay');
  dom.confirmMessage.textContent='Save changes before closing?';
  dom.confirmAcceptBtn.textContent='Save';
  dom.confirmCancelBtn.textContent="Don't Save";
  dom.confirmDismissBtn?.classList.remove('hidden');
  if(dom.confirmDismissBtn) dom.confirmDismissBtn.textContent='Cancel';
  dom.confirmAcceptBtn.value='save';
  dom.confirmCancelBtn.value='discard';
  if(dom.confirmDismissBtn) dom.confirmDismissBtn.value='stay';
  dialog.returnValue='stay';
  return new Promise(resolve=>{
    const onCancel=ev=>{ev.preventDefault();dialog.close('stay');};
    const onBackdrop=ev=>{if(ev.target===dialog) dialog.close('stay');};
    const finish=()=>{
      dialog.removeEventListener('cancel',onCancel);
      dialog.removeEventListener('click',onBackdrop);
      const result=dialog.returnValue || 'stay';
      dom.confirmAcceptBtn.value='confirm';
      dom.confirmCancelBtn.value='cancel';
      dom.confirmDismissBtn?.classList.add('hidden');
      resolve(result);
    };
    dialog.addEventListener('cancel',onCancel,{once:true});
    dialog.addEventListener('click',onBackdrop);
    dialog.addEventListener('close',finish,{once:true});
    dialog.showModal();
    requestAnimationFrame(()=>dom.confirmAcceptBtn?.focus());
  });
}
async function attemptApplicationExit() {
  if(state.dirty) {
    const choice=await appExitSaveChoice();
    if(choice==='stay') return false;
    if(choice==='save') {
      const saved=await saveDeckToCurrentFile();
      if(!saved) return false;
    }
  }
  requestApplicationShutdown();
  return true;
}
async function runMenuAction(action) {
  const exportYdk=()=>saveTextFile(`${safeFilename(state.deckName)}.ydk`,sectionsToYDK(currentCanonicalSections(),state.creator),[{description:'YDK Deck',accept:{'text/plain':['.ydk']}}]);
  const exportReadable=()=>saveTextFile(`${safeFilename(state.deckName)}.txt`,sectionsToHuman(currentSections(),state.indexes.byId),[{description:'Readable Deck',accept:{'text/plain':['.txt']}}]);
  const actions={
    new:()=>newDeckAction(), open:()=>openDeckFile(), save:()=>saveDeckToCurrentFile(), 'import-clipboard':()=>importClipboard(),
    undo:()=>undoDeckAction(), redo:()=>redoDeckAction(),
    'export-ydk':exportYdk, 'export-ydke':()=>$('#exportYdkeBtn').click(), 'save-readable':exportReadable,
    exit:()=>attemptApplicationExit(),
    'remove-selected':()=>{const uids=selectedDeckUids();if(uids.length)removeEntries(uids);else toast('Select a deck card first.','warn');},
    'clear-deck':()=>clearDeckAction(), draw5:()=>drawHand(), 'test-duel':()=>startIntegratedTestDuel(), 'copy-ydk':()=>$('#copyYdkBtn').click(), 'copy-ydke':()=>$('#copyYdkeBtn').click(),
    sort:()=>applyDeckSort(true),
    'toggle-search':()=>setPaneHidden('left',!isPaneHidden('left'),{overrideAuto:true}), 'toggle-details':()=>setPaneHidden('right',!isPaneHidden('right'),{overrideAuto:true}), 'swap-panels':()=>setSidePanelsSwapped(!state.sidePanelsSwapped), 'restore-layout':()=>restoreDefaultLayout(), 'link-arrow-tools':()=>openLinkArrowScalePopover(), 'attribute-icon-tools':()=>openAttributeIconScalePopover(), 'restriction-badge-tools':()=>openRestrictionBadgeToolsPopover(), 'open-icon-tuning-folder':async()=>{try{const response=await fetch('/api/open-data-folder',{method:'POST'});if(!response.ok)throw new Error('open failed');}catch{toast('Could not open the icon tuning folder.','error');}}, theme:()=>$('#themeBtn').click(), 'toggle-card-text-styling':()=>toggleCardTextStyling(),
    'refresh-db':()=>loadDatabase(true), 'deck-directories':()=>openDeckLibraryDialog(), 'open-data':async()=>{try{const response=await fetch('/api/open-data-folder',{method:'POST'});if(!response.ok)throw new Error('open failed');}catch{toast('Could not open the application data folder.','error');}},
    help:()=>openHelpDialog(),
  };
  closeAppMenus();
  await actions[action]?.();
}
function setupRecentDeckMenu() {
  let libraryBtn=$('#deckLibraryBtn');if(!libraryBtn){libraryBtn=el('button','btn ghost','Library');libraryBtn.id='deckLibraryBtn';libraryBtn.type='button';libraryBtn.title='Browse decks from configured Deck Library directories';$('#handBtn')?.before(libraryBtn);}libraryBtn?.addEventListener('click',()=>openDeckLibraryDialog());
  const menu=dom.recentDeckMenu, trigger=dom.recentDeckBtn, panel=dom.recentDeckPanel;
  if(!menu||!trigger||!panel) return;
  renderRecentDecks();
  trigger.addEventListener('click',ev=>{
    ev.stopPropagation();
    const opening=!menu.classList.contains('open');
    closeAppMenus();
    if(opening) {
      renderRecentDecks();
      menu.classList.add('open');
      trigger.setAttribute('aria-expanded','true');
    }
  });
  panel.addEventListener('click',ev=>ev.stopPropagation());
  $('#closeRecentDeckBtn')?.addEventListener('click',()=>closeAppMenus());
}
function setupAppMenus() {
  const menu=$('#appCommandMenu');
  const trigger=$('#appMenuBtn');
  trigger?.addEventListener('click',ev=>{
    ev.stopPropagation();
    const opening=!menu?.classList.contains('open');
    closeAppMenus();
    if(opening){menu?.classList.add('open');trigger.setAttribute('aria-expanded','true');}
  });
  $('#closeAppMenuBtn')?.addEventListener('click',ev=>{ev.stopPropagation();closeAppMenus();trigger?.focus();});
  $$('[data-menu-action]').forEach(item=>item.addEventListener('click',ev=>{ev.stopPropagation();runMenuAction(item.dataset.menuAction);}));
  const webMenu=$('#websiteCommandMenu');
  const webTrigger=$('#websiteMenuBtn');
  webTrigger?.addEventListener('click',ev=>{
    ev.stopPropagation();
    const opening=!webMenu?.classList.contains('open');
    closeAppMenus();
    if(opening){webMenu?.classList.add('open');webTrigger.setAttribute('aria-expanded','true');}
  });
  $('#closeWebsiteMenuBtn')?.addEventListener('click',ev=>{ev.stopPropagation();closeAppMenus();webTrigger?.focus();});
}
let managedTooltip=null;
let managedTooltipShowTimer=0;
let managedTooltipHideTimer=0;
let managedTooltipTarget=null;
let managedTooltipOrigin=null;
let managedTooltipPointer=null;
let managedTooltipSuppressed=null;
function ensureManagedTooltip() {
  if(managedTooltip?.isConnected) return managedTooltip;
  managedTooltip=el('div','app-tooltip');
  managedTooltip.setAttribute('role','tooltip');
  document.body.append(managedTooltip);
  return managedTooltip;
}
function setManagedTooltip(node,text) {
  if(!node) return;
  const value=String(text||'').trim();
  if(value) node.dataset.tooltip=value; else delete node.dataset.tooltip;
  node.removeAttribute('title');
}
function migrateNativeTooltip(node) {
  if(!(node instanceof Element)) return;
  const title=node.getAttribute('title');
  if(title) setManagedTooltip(node,title);
}
function hideManagedTooltip({suppress=false}={}) {
  clearTimeout(managedTooltipShowTimer);
  clearTimeout(managedTooltipHideTimer);
  managedTooltipShowTimer=0; managedTooltipHideTimer=0;
  managedTooltip?.classList.remove('visible');
  if(suppress && managedTooltipTarget) managedTooltipSuppressed=managedTooltipTarget;
  managedTooltipTarget=null; managedTooltipOrigin=null; managedTooltipPointer=null;
}
function positionManagedTooltip(clientX,clientY) {
  const tip=ensureManagedTooltip();
  const gap=12,pad=8,rect=tip.getBoundingClientRect();
  let left=clientX+gap,top=clientY+gap;
  if(left+rect.width+pad>window.innerWidth) left=clientX-rect.width-gap;
  if(top+rect.height+pad>window.innerHeight) top=clientY-rect.height-gap;
  tip.style.left=`${Math.max(pad,left)}px`; tip.style.top=`${Math.max(pad,top)}px`;
}
function installManagedTooltips() {
  document.querySelectorAll('[title]').forEach(migrateNativeTooltip);
  const observer=new MutationObserver(records=>{
    for(const record of records) {
      if(record.type==='attributes'&&record.attributeName==='title') migrateNativeTooltip(record.target);
      if(record.type==='childList') for(const added of record.addedNodes) {
        if(!(added instanceof Element)) continue;
        migrateNativeTooltip(added);
        added.querySelectorAll?.('[title]').forEach(migrateNativeTooltip);
      }
    }
  });
  observer.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['title'],childList:true});
  document.addEventListener('pointerover',event=>{
    const target=event.target.closest?.('[data-tooltip]');
    if(!target || managedTooltipSuppressed===target) return;
    if(managedTooltipTarget===target) {
      managedTooltipPointer={x:event.clientX,y:event.clientY};
      return;
    }
    hideManagedTooltip();
    managedTooltipTarget=target;
    managedTooltipPointer={x:event.clientX,y:event.clientY};
    managedTooltipShowTimer=setTimeout(()=>{
      if(managedTooltipTarget!==target || managedTooltipSuppressed===target) return;
      const point=managedTooltipPointer || {x:event.clientX,y:event.clientY};
      const tip=ensureManagedTooltip(); tip.textContent=target.dataset.tooltip||'';
      if(!tip.textContent){hideManagedTooltip();return;}
      managedTooltipOrigin={x:point.x,y:point.y};
      tip.classList.add('visible'); positionManagedTooltip(point.x,point.y);
      managedTooltipHideTimer=setTimeout(()=>hideManagedTooltip({suppress:true}),TOOLTIP_HIDE_MS);
    },320);
  },true);
  document.addEventListener('pointermove',event=>{
    if(!managedTooltipTarget) return;
    managedTooltipPointer={x:event.clientX,y:event.clientY};
    if(!managedTooltip?.classList.contains('visible') || !managedTooltipOrigin) return;
    if(Math.hypot(event.clientX-managedTooltipOrigin.x,event.clientY-managedTooltipOrigin.y)>TOOLTIP_MOVE_PX){hideManagedTooltip({suppress:true});return;}
    positionManagedTooltip(event.clientX,event.clientY);
  },true);
  document.addEventListener('pointerout',event=>{
    const from=event.target.closest?.('[data-tooltip]');
    if(from && (!event.relatedTarget || !from.contains(event.relatedTarget))){
      if(managedTooltipTarget===from) hideManagedTooltip();
      if(managedTooltipSuppressed===from) managedTooltipSuppressed=null;
    }
  },true);
  for(const eventName of ['pointerdown','wheel','scroll','keydown']) document.addEventListener(eventName,()=>hideManagedTooltip({suppress:true}),true);
  window.addEventListener('blur',()=>hideManagedTooltip());
}
function installNativeTooltips() {
  const defaults={
    newDeckBtn:'Start a new deck', appMenuBtn:'Open application commands', websiteMenuBtn:'Open website integrations', restoreSearchPaneBtn:'Show Card Search pane', restoreRightPaneBtn:'Show Card Details pane',
    themeBtn:'Switch between light and dark appearance', helpBtn:'Open the user manual and application information', resetFiltersBtn:'Reset all card search filters',
    searchFilterBtn:'Open Search Options for scope, filters, result display, and sorting', deckSortFilterBtn:'Choose deck sections, card types, sort field, and order', importClipboardBtn:'Import YDK, YDKE, or readable deck text from the clipboard',
    undoBtn:'Undo the last deck edit (Ctrl+Z)', redoBtn:'Redo the last undone deck edit (Ctrl+Y or Ctrl+Shift+Z)',
    parseTextBtn:'Apply the edited text list to the deck', refreshTextBtn:'Discard text edits and rebuild this list from the deck', saveTextViewBtn:'Export the current text view to a file',
    artworkPrevBtn:'Use the previous available card artwork', artworkNextBtn:'Use the next available card artwork', artworkDropdownBtn:'Choose an alternate printing or artwork',
    addPrimaryBtn:'Add the selected card to its normal Main or Extra Deck zone', addSideBtn:'Add the selected card to the Side Deck', openArtBtn:'Open a larger card image',
  };
  for(const [id,title] of Object.entries(defaults)){const node=document.getElementById(id);if(node&&!node.title)node.title=title;}
  $$('[data-deck-view]').forEach(button=>{if(!button.title)button.title=`Show the deck in ${button.textContent.trim()} view`;});
  $$('[data-search-view]').forEach(button=>{if(!button.title)button.title=`Show search results in ${button.textContent.trim()} view`;});
  $$('[data-analysis]').forEach(button=>{if(!button.title)button.title=`Show ${button.textContent.trim()} information`;});
  installManagedTooltips();
}
function enableBackdropDismiss(dialog) {
  if (!dialog) return;
  dialog.addEventListener('click', ev => {
    if (ev.target === dialog) dialog.close();
  });
}
function installUiSelectionProtection() {
  const editableSelector='textarea, input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="color"]), [contenteditable="true"], .allow-text-selection';
  document.addEventListener('selectstart',ev=>{
    const target=ev.target instanceof Element?ev.target:null;
    if(target?.closest(editableSelector)) return;
    ev.preventDefault();
  },true);
  document.addEventListener('dragstart',ev=>{
    const target=ev.target instanceof Element?ev.target:null;
    if(target?.closest(editableSelector)) return;
    if(target?.closest('[draggable="true"], .deck-card, .search-card')) return;
    if(ev.dataTransfer && target && !target.closest('img')) ev.preventDefault();
  },true);
}
function bindEvents() {
  document.addEventListener('contextmenu',ev=>ev.preventDefault());
  installUiSelectionProtection();
  setupDockedOptionDrawers();
  setupAppMenus(); setupRecentDeckMenu(); installNativeTooltips();
  enableBackdropDismiss(dom.handDialog);
  dom.artDialog.addEventListener('click',ev=>{ if(ev.button===0) dom.artDialog.close(); });
  window.addEventListener('wheel',ev=>{
    if(!dom.artDialog?.open) return;
    ev.preventDefault();
    ev.stopPropagation();
    state.artZoom=Math.max(.6,Math.min(1.75,state.artZoom+(ev.deltaY<0?.1:-.1)));
    applyArtZoom();
  },{passive:false,capture:true});
  dom.modalArt.addEventListener('dragstart',ev=>ev.preventDefault()); dom.modalArt.addEventListener('selectstart',ev=>ev.preventDefault()); dom.modalArt.addEventListener('mousedown',ev=>ev.preventDefault());
  dom.deckName.value=state.deckName; if(dom.deckSortBanlist) dom.deckSortBanlist.value=state.banlist; if(dom.deckSortCardPool) dom.deckSortCardPool.value=state.cardPool; if(dom.deckSortGroupCategories) dom.deckSortGroupCategories.checked=state.deckSortGroupCategories; if(dom.linkArrowGridOverlayToggle) dom.linkArrowGridOverlayToggle.checked=state.linkArrowOverlays.grid; if(dom.linkArrowDetailsOverlayToggle) dom.linkArrowDetailsOverlayToggle.checked=state.linkArrowOverlays.details; applyLinkArrowScaleStyles(); applyLinkArrowOffsetStyles(); applyDetailsPanelLinkIndicatorStyles(); applyAttributeIconScaleStyles(); applyAttributeIconOffsetStyles(); applyRestrictionBadgeStyles(); dom.searchInput.value=state.filters.query; updateDeckSortSummary(); updateSearchFilterSummary();
  document.documentElement.dataset.theme=state.theme;
  syncCardTextStylingControl();
  $('#themeBtn').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=state.theme;persistState();});
  $('#helpBtn').addEventListener('click',()=>$('#helpDialog').showModal());
  $('#newDeckBtn').addEventListener('click',newDeckAction); $('#openDeckBtn').addEventListener('click',openDeckFile); dom.saveDeckBtn?.addEventListener('click',saveDeckToCurrentFile); updateSaveDeckButton();
  dom.undoBtn?.addEventListener('click',undoDeckAction); dom.redoBtn?.addEventListener('click',redoDeckAction); updateHistoryControls();
  $('#handBtn').addEventListener('click',drawHand); $('#testDuelBtn')?.addEventListener('click',()=>{ void startIntegratedTestDuel(); }); $('#redrawBtn').addEventListener('click',drawHand);
  $('#refreshDbBtn').addEventListener('click',()=>loadDatabase(true));
  const syncSearchQuery=(value,{immediate=false,focusMain=false}={})=>{
    state.filters.query=String(value ?? '');
    if(dom.searchInput && dom.searchInput.value!==state.filters.query) dom.searchInput.value=state.filters.query;
    if(dom.searchScopeQueryFilter && dom.searchScopeQueryFilter.value!==state.filters.query) dom.searchScopeQueryFilter.value=state.filters.query;
    updateSearchFilterSummary();
    scheduleSearch(immediate);
    if(focusMain) dom.searchInput?.focus();
  };
  $('#clearSearchBtn').addEventListener('click',()=>syncSearchQuery('',{immediate:true,focusMain:true}));
  dom.searchInput.addEventListener('input',()=>syncSearchQuery(dom.searchInput.value));
  dom.searchScopeQueryFilter?.addEventListener('input',()=>syncSearchQuery(dom.searchScopeQueryFilter.value));
  dom.effectTextFilter?.addEventListener('input',()=>{state.filters.effectText=dom.effectTextFilter.value;updateEffectTextSummary();updateSearchFilterSummary();scheduleSearch();});
  const filterMap={categoryFilter:'category',typeFilter:'type',monsterSubtypeFilter:'monsterSubtype',abilityFilter:'ability',attributeFilter:'attribute',raceFilter:'race',archetypeFilter:'archetype',searchCardPoolFilter:'cardPool',searchBanlistFilter:'banlist',restrictionFilter:'restriction',maxResultsFilter:'maxResults',levelMinFilter:'levelMin',levelMaxFilter:'levelMax',scaleMinFilter:'scaleMin',scaleMaxFilter:'scaleMax',atkMinFilter:'atkMin',atkMaxFilter:'atkMax',defMinFilter:'defMin',defMaxFilter:'defMax',linkRatingMinFilter:'linkRatingMin',linkRatingMaxFilter:'linkRatingMax',linkMaterialMinFilter:'linkMaterialMin',linkMaterialMaxFilter:'linkMaterialMax',linkMaterialRaceFilter:'linkMaterialRace',linkMaterialAttributeFilter:'linkMaterialAttribute',linkMaterialPatternFilter:'linkMaterialPattern',xyzMaterialMinFilter:'xyzMaterialMin',xyzMaterialMaxFilter:'xyzMaterialMax',xyzMaterialLevelMinFilter:'xyzMaterialLevelMin',xyzMaterialLevelMaxFilter:'xyzMaterialLevelMax',xyzMaterialRaceFilter:'xyzMaterialRace',xyzMaterialAttributeFilter:'xyzMaterialAttribute',xyzMaterialPatternFilter:'xyzMaterialPattern'};
  for(const [id,key] of Object.entries(filterMap)) {
    const node=$(`#${id}`);
    if(!node) continue;
    const apply=ev=>{
      state.filters[key]=key==='maxResults'?Number(ev.target.value):ev.target.value;
      if(key==='category') { state.filters.type=''; state.filters.monsterSubtype=''; populateFilters(); }
      else if(key==='type') {
        state.filters.monsterSubtype='';
        if(state.filters.category==='Monster' && state.filters.type==='Maximum') {
          const currentPool=String(state.filters.cardPool || '').trim().toLocaleLowerCase();
          if(currentPool!=='all' && currentPool!=='rush duel') {
            state.filters.cardPool='Rush Duel';
            if(dom.searchCardPoolFilter) dom.searchCardPoolFilter.value='Rush Duel';
          }
        }
        updateSearchFilterContextUI();
      }
      else if(key==='monsterSubtype') updateSearchFilterContextUI();
      if(key.startsWith('link')) { updateLinkMaterialSummary(); updateLinkCriteriaSummary(); updateLinkFilterSummary(); }
      if(key.startsWith('xyz')) { updateXyzMaterialSummary(); updateXyzFilterSummary(); }
      updateSearchFilterContextUI(); updateSearchFilterSummary(); updateSearchStatSummary(); scheduleSearch(true); persistState();
    };
    node.addEventListener(node.tagName==='INPUT'?'input':'change',apply);
  }
  $('#resetFiltersBtn')?.addEventListener('click',resetFilters);
  dom.searchFilterBtn?.addEventListener('click',ev=>{ev.stopPropagation();toggleSearchFilterPopover();});
  $('#closeSearchFilterPopoverBtn')?.addEventListener('click',closeSearchFilterPopover);
  $('#pinSearchFilterPopoverBtn')?.addEventListener('click',()=>setOptionDrawerPinned('search',!searchOptionsPinned));
  $('#dockSearchFilterPopoverBtn')?.addEventListener('click',()=>setOptionDrawerDocked('search',!optionDrawerIsDocked('search')));
  dom.searchFilterPopover?.addEventListener('click',ev=>ev.stopPropagation());
  dom.searchFilterPopover?.querySelectorAll('details').forEach(details=>details.addEventListener('toggle',()=>requestAnimationFrame(refitOpenFilterPopovers)));
  dom.searchSortModeOptions?.addEventListener('click',ev=>{ const button=ev.target.closest?.('[data-search-sort-mode]'); if(button) chooseSearchSortMode(button.dataset.searchSortMode); });
  dom.linkArrowFilterGrid?.addEventListener('click',ev=>{const button=ev.target.closest('button');if(!button)return;if(button.dataset.linkArrowFilterCenter){toggleLinkArrowFilterCenter();return;}if(button.dataset.linkArrowFilter)toggleLinkArrowFilter(button.dataset.linkArrowFilter);});
  $$('input[name="linkMarkerMode"]').forEach(r=>r.addEventListener('change',ev=>{state.filters.linkMarkerMode=ev.target.value;updateLinkFilterSummary();updateLinkCriteriaSummary();updateSearchFilterSummary();scheduleSearch(true);persistState();}));
  dom.linkMaterialQualifierOptions?.addEventListener('change',ev=>{const input=ev.target.closest?.('input[type="checkbox"]');if(!input)return;if(input.checked)state.filters.linkMaterialQualifiers.add(input.value);else state.filters.linkMaterialQualifiers.delete(input.value);updateLinkMaterialSummary();updateLinkCriteriaSummary();updateLinkFilterSummary();updateSearchFilterSummary();scheduleSearch(true);persistState();});
  $$('input[name="linkMaterialQualifierMode"]').forEach(r=>r.addEventListener('change',ev=>{state.filters.linkMaterialQualifierMode=ev.target.value;updateLinkCriteriaSummary();updateSearchFilterSummary();scheduleSearch(true);persistState();}));
  dom.xyzMaterialQualifierOptions?.addEventListener('change',ev=>{const input=ev.target.closest?.('input[type="checkbox"]');if(!input)return;if(input.checked)state.filters.xyzMaterialQualifiers.add(input.value);else state.filters.xyzMaterialQualifiers.delete(input.value);updateXyzMaterialSummary();updateXyzFilterSummary();updateSearchFilterSummary();scheduleSearch(true);persistState();});
  $$('input[name="xyzMaterialQualifierMode"]').forEach(r=>r.addEventListener('change',ev=>{state.filters.xyzMaterialQualifierMode=ev.target.value;updateXyzFilterSummary();updateSearchFilterSummary();scheduleSearch(true);persistState();}));
  [[dom.linkArrowGridOverlayToggle,'grid'],[dom.linkArrowDetailsOverlayToggle,'details']].forEach(([toggle,view])=>toggle?.addEventListener('change',()=>{state.linkArrowOverlays[view]=toggle.checked;renderSearch();persistState();saveIconTuningFile();}));
  $('#closeLinkArrowScalePopoverBtn')?.addEventListener('click',closeLinkArrowScalePopover);
  dom.linkArrowScalePopover?.addEventListener('click',ev=>ev.stopPropagation());
  dom.linkArrowScaleLinked?.addEventListener('change',()=>setLinkArrowScalesLinked(dom.linkArrowScaleLinked.checked));
  [[dom.linkArrowGridScale,'grid'],[dom.linkArrowDetailsScale,'details']].forEach(([slider,view])=>{
    slider?.addEventListener('input',()=>updateLinkArrowScale(view,slider.value));
    slider?.addEventListener('change',()=>updateLinkArrowScale(view,slider.value,{persist:true}));
  });
  dom.linkArrowOffsetLinked?.addEventListener('change',()=>setLinkArrowOffsetsLinked(dom.linkArrowOffsetLinked.checked));
  [[dom.linkArrowGridOffset,'grid','y'],[dom.linkArrowDetailsOffset,'details','y'],[dom.linkArrowGridOffsetX,'grid','x'],[dom.linkArrowDetailsOffsetX,'details','x']].forEach(([slider,view,axis])=>{
    slider?.addEventListener('input',()=>updateLinkArrowOffset(view,axis,slider.value));
    slider?.addEventListener('change',()=>updateLinkArrowOffset(view,axis,slider.value,{persist:true}));
  });
  $('#linkArrowGridOffsetUp')?.addEventListener('click',()=>nudgeLinkArrowOffset('grid','y',-1));
  $('#linkArrowGridOffsetDown')?.addEventListener('click',()=>nudgeLinkArrowOffset('grid','y',1));
  $('#linkArrowGridOffsetLeft')?.addEventListener('click',()=>nudgeLinkArrowOffset('grid','x',-1));
  $('#linkArrowGridOffsetRight')?.addEventListener('click',()=>nudgeLinkArrowOffset('grid','x',1));
  $('#linkArrowDetailsOffsetUp')?.addEventListener('click',()=>nudgeLinkArrowOffset('details','y',-1));
  $('#linkArrowDetailsOffsetDown')?.addEventListener('click',()=>nudgeLinkArrowOffset('details','y',1));
  $('#linkArrowDetailsOffsetLeft')?.addEventListener('click',()=>nudgeLinkArrowOffset('details','x',-1));
  $('#linkArrowDetailsOffsetRight')?.addEventListener('click',()=>nudgeLinkArrowOffset('details','x',1));
  dom.detailsPanelLinkIndicatorToggle?.addEventListener('change',()=>setDetailsPanelLinkIndicatorEnabled(dom.detailsPanelLinkIndicatorToggle.checked));
  dom.detailsPanelLinkIndicatorScale?.addEventListener('input',()=>updateDetailsPanelLinkIndicatorScale(dom.detailsPanelLinkIndicatorScale.value));
  dom.detailsPanelLinkIndicatorScale?.addEventListener('change',()=>updateDetailsPanelLinkIndicatorScale(dom.detailsPanelLinkIndicatorScale.value,{persist:true}));
  dom.detailsPanelLinkIndicatorOffsetX?.addEventListener('input',()=>updateDetailsPanelLinkIndicatorOffset('x',dom.detailsPanelLinkIndicatorOffsetX.value));
  dom.detailsPanelLinkIndicatorOffsetX?.addEventListener('change',()=>updateDetailsPanelLinkIndicatorOffset('x',dom.detailsPanelLinkIndicatorOffsetX.value,{persist:true}));
  dom.detailsPanelLinkIndicatorOffsetY?.addEventListener('input',()=>updateDetailsPanelLinkIndicatorOffset('y',dom.detailsPanelLinkIndicatorOffsetY.value));
  dom.detailsPanelLinkIndicatorOffsetY?.addEventListener('change',()=>updateDetailsPanelLinkIndicatorOffset('y',dom.detailsPanelLinkIndicatorOffsetY.value,{persist:true}));
  $('#detailsPanelLinkIndicatorOffsetUp')?.addEventListener('click',()=>nudgeDetailsPanelLinkIndicatorOffset('y',-1));
  $('#detailsPanelLinkIndicatorOffsetDown')?.addEventListener('click',()=>nudgeDetailsPanelLinkIndicatorOffset('y',1));
  $('#detailsPanelLinkIndicatorOffsetLeft')?.addEventListener('click',()=>nudgeDetailsPanelLinkIndicatorOffset('x',-1));
  $('#detailsPanelLinkIndicatorOffsetRight')?.addEventListener('click',()=>nudgeDetailsPanelLinkIndicatorOffset('x',1));
  $('#closeAttributeIconScalePopoverBtn')?.addEventListener('click',closeAttributeIconScalePopover);
  dom.attributeIconScalePopover?.addEventListener('click',ev=>ev.stopPropagation());
  dom.attributeIconScaleLinked?.addEventListener('change',()=>setAttributeIconScalesLinked(dom.attributeIconScaleLinked.checked));
  [[dom.attributeIconGridScale,'grid'],[dom.attributeIconDetailsScale,'details'],[dom.attributeIconListScale,'list']].forEach(([slider,view])=>{
    slider?.addEventListener('input',()=>updateAttributeIconScale(view,slider.value));
    slider?.addEventListener('change',()=>updateAttributeIconScale(view,slider.value,{persist:true}));
  });
  dom.attributeIconOffsetLinked?.addEventListener('change',()=>setAttributeIconOffsetsLinked(dom.attributeIconOffsetLinked.checked));
  dom.attributeIconOffsetContext?.addEventListener('change',()=>{state.attributeIconTuningContext=dom.attributeIconOffsetContext.value;syncAttributeIconOffsetControls();});
  dom.attributeIconOffsetX?.addEventListener('input',()=>updateAttributeIconOffset('x',dom.attributeIconOffsetX.value));
  dom.attributeIconOffsetX?.addEventListener('change',()=>updateAttributeIconOffset('x',dom.attributeIconOffsetX.value,{persist:true}));
  dom.attributeIconOffsetY?.addEventListener('input',()=>updateAttributeIconOffset('y',dom.attributeIconOffsetY.value));
  dom.attributeIconOffsetY?.addEventListener('change',()=>updateAttributeIconOffset('y',dom.attributeIconOffsetY.value,{persist:true}));
  $('#attributeIconOffsetUp')?.addEventListener('click',()=>nudgeAttributeIconOffset('y',-1));
  $('#attributeIconOffsetDown')?.addEventListener('click',()=>nudgeAttributeIconOffset('y',1));
  $('#attributeIconOffsetLeft')?.addEventListener('click',()=>nudgeAttributeIconOffset('x',-1));
  $('#attributeIconOffsetRight')?.addEventListener('click',()=>nudgeAttributeIconOffset('x',1));
  $('#closeRestrictionBadgeToolsPopoverBtn')?.addEventListener('click',closeRestrictionBadgeToolsPopover);
  dom.restrictionBadgeToolsPopover?.addEventListener('click',ev=>ev.stopPropagation());
  dom.restrictionBadgeToolsLinked?.addEventListener('change',()=>setRestrictionBadgeSettingsLinked(dom.restrictionBadgeToolsLinked.checked));
  dom.restrictionBadgeContext?.addEventListener('change',()=>{state.restrictionBadgeTuningContext=dom.restrictionBadgeContext.value;syncRestrictionBadgeControls();});
  dom.restrictionBadgeScale?.addEventListener('input',()=>updateRestrictionBadgeScale(dom.restrictionBadgeScale.value));
  dom.restrictionBadgeScale?.addEventListener('change',()=>updateRestrictionBadgeScale(dom.restrictionBadgeScale.value,{persist:true}));
  dom.restrictionBadgeOffsetX?.addEventListener('input',()=>updateRestrictionBadgeOffset('x',dom.restrictionBadgeOffsetX.value));
  dom.restrictionBadgeOffsetX?.addEventListener('change',()=>updateRestrictionBadgeOffset('x',dom.restrictionBadgeOffsetX.value,{persist:true}));
  dom.restrictionBadgeOffsetY?.addEventListener('input',()=>updateRestrictionBadgeOffset('y',dom.restrictionBadgeOffsetY.value));
  dom.restrictionBadgeOffsetY?.addEventListener('change',()=>updateRestrictionBadgeOffset('y',dom.restrictionBadgeOffsetY.value,{persist:true}));
  $('#restrictionBadgeOffsetUp')?.addEventListener('click',()=>nudgeRestrictionBadgeOffset('y',-1));
  $('#restrictionBadgeOffsetDown')?.addEventListener('click',()=>nudgeRestrictionBadgeOffset('y',1));
  $('#restrictionBadgeOffsetLeft')?.addEventListener('click',()=>nudgeRestrictionBadgeOffset('x',-1));
  $('#restrictionBadgeOffsetRight')?.addEventListener('click',()=>nudgeRestrictionBadgeOffset('x',1));
  dom.linkMaterialSearch?.addEventListener('input',renderLinkMaterialOptions);
  dom.xyzMaterialSearch?.addEventListener('input',renderXyzMaterialOptions);
  $('#clearXyzMaterialsBtn')?.addEventListener('click',clearXyzMaterialFilter);
  $('#clearAllXyzFiltersBtn')?.addEventListener('click',clearAllXyzFilters);
  $('#clearLinkMaterialsBtn')?.addEventListener('click',clearLinkMaterialFilter);
  $('#clearAllLinkFiltersBtn')?.addEventListener('click',clearAllLinkFilters);
  $('#clearEffectsBtn')?.addEventListener('click',()=>{state.filters.effects.clear();renderEffectOptions();updateSearchFilterSummary();scheduleSearch(true);});
  $$('input[name="effectMode"]').forEach(r=>r.addEventListener('change',ev=>{state.filters.effectMode=ev.target.value;updateSearchFilterSummary();scheduleSearch(true);persistState();}));
  $$('[data-search-view]').forEach(b=>b.addEventListener('click',()=>{
    const requested=b.dataset.searchView;
    if(state.searchView===requested) {
      chooseSearchSortMode(state.filters.sort);
      persistState();
      return;
    }
    state.pendingSearchViewContext=captureSearchViewContext();
    state.searchView=requested;
    syncSearchViewButtons();
    renderSearch();
    persistState();
  }));
  $$('[data-deck-view]').forEach(b=>b.addEventListener('click',()=>setDeckView(b.dataset.deckView)));
  $$('[data-analysis]').forEach(b=>b.addEventListener('click',()=>{state.analysisView=b.dataset.analysis;$$('[data-analysis]').forEach(x=>x.classList.toggle('active',x===b));dom.validationView.classList.toggle('hidden',state.analysisView!=='validation');dom.statisticsView.classList.toggle('hidden',state.analysisView!=='statistics');persistState();}));
  const applyBanlistSelection=(value)=>{
    state.banlist=value;
    if(dom.deckSortBanlist) dom.deckSortBanlist.value=value;
    if(state.deckSort==='limit') applyDeckSort(false); else renderDeck();
    renderSelectedCard();
    updateAnalysis();
    persistState();
  };
  const applyCardPoolSelection=(value)=>{
    state.cardPool=value;
    if(dom.deckSortCardPool) dom.deckSortCardPool.value=value;
    updateAnalysis();
    persistState();
  };
  dom.deckSortBanlist?.addEventListener('change',()=>applyBanlistSelection(dom.deckSortBanlist.value));
  dom.deckSortCardPool?.addEventListener('change',()=>applyCardPoolSelection(dom.deckSortCardPool.value));
  dom.deckSortFilterBtn?.addEventListener('click',ev=>{ev.stopPropagation();toggleDeckSortPopover();});
  $('#closeDeckSortPopoverBtn')?.addEventListener('click',closeDeckSortPopover);
  $('#pinDeckSortPopoverBtn')?.addEventListener('click',()=>setOptionDrawerPinned('deck',!deckSortPinned));
  $('#dockDeckSortPopoverBtn')?.addEventListener('click',()=>setOptionDrawerDocked('deck',!optionDrawerIsDocked('deck')));
  $('#resetDeckSortBtn')?.addEventListener('click',resetDeckSortPopover);
  dom.deckSortGroupCategories?.addEventListener('change',()=>{state.deckSortGroupCategories=dom.deckSortGroupCategories.checked;updateDeckSortSummary();applyDeckSort(false);persistState();});
  dom.deckSortModeOptions?.addEventListener('click',ev=>{
    const button=ev.target.closest?.('[data-deck-sort-mode]');
    if(button) chooseDeckSortMode(button.dataset.deckSortMode);
  });
  dom.deckStoredOrderOptions?.addEventListener('click',ev=>{
    const button=ev.target.closest?.('[data-deck-restore-order]');
    if(button && !button.disabled) restoreStoredDeckOrder(button.dataset.deckRestoreOrder,true);
  });
  dom.deckSortPopover?.addEventListener('click',ev=>ev.stopPropagation());
  dom.deckSortPopover?.querySelectorAll('details').forEach(details=>details.addEventListener('toggle',()=>requestAnimationFrame(refitOpenFilterPopovers)));
  dom.deckSortPopover?.addEventListener('change',ev=>{
    if(ev.target?.name==='deckSortSectionModal') {
      const checked=dom.deckSortPopover.querySelectorAll('input[name="deckSortSectionModal"]:checked');
      if(!checked.length){ev.target.checked=true;toast('At least one deck section must remain selected.','warn');return;}
    }
    if(ev.target?.name==='deckSortFamilyModal') {
      const checked=dom.deckSortPopover.querySelectorAll('input[name="deckSortFamilyModal"]:checked');
      if(!checked.length){ev.target.checked=true;toast('At least one card family must remain selected.','warn');return;}
    }
    if(ev.target?.name==='deckSortTypeModal') updateDeckSortDraftTypeSummary();
    if(ev.target===dom.deckSortBanlist || ev.target===dom.deckSortCardPool) return;
    applyDeckSortPopoverRealtime();
  });
  document.addEventListener('pointerdown',ev=>{
    if(optionDrawerMayAutoDismiss('deck') && !dom.deckSortPopover?.classList.contains('hidden') && !dom.deckSortPopover.contains(ev.target) && !dom.deckSortFilterBtn?.contains(ev.target)) closeDeckSortPopover();
  },true);
  document.addEventListener('pointermove',autoCloseDetachedPopovers,{passive:true});
  document.addEventListener('click',ev=>{
    if(optionDrawerMayAutoDismiss('deck') && !dom.deckSortPopover?.classList.contains('hidden') && !dom.deckSortPopover.contains(ev.target) && !dom.deckSortFilterBtn?.contains(ev.target)) closeDeckSortPopover();
    if(optionDrawerMayAutoDismiss('search') && !dom.searchFilterPopover?.classList.contains('hidden') && !dom.searchFilterPopover.contains(ev.target) && !dom.searchFilterBtn?.contains(ev.target)) closeSearchFilterPopover();
    if(!dom.linkArrowScalePopover?.classList.contains('hidden') && !dom.linkArrowScalePopover.contains(ev.target)) closeLinkArrowScalePopover();
    if(!dom.attributeIconScalePopover?.classList.contains('hidden') && !dom.attributeIconScalePopover.contains(ev.target)) closeAttributeIconScalePopover();
    if(!dom.restrictionBadgeToolsPopover?.classList.contains('hidden') && !dom.restrictionBadgeToolsPopover.contains(ev.target)) closeRestrictionBadgeToolsPopover();
  });
  dom.deckName.addEventListener('input',()=>{state.deckName=dom.deckName.value||'Untitled Deck';setDirty();updateSaveDeckButton();});
  $('#importClipboardBtn').addEventListener('click',importClipboard);
  $('#copyYdkBtn').addEventListener('click',()=>copyText(sectionsToYDK(currentCanonicalSections(),state.creator),'YDK copied.'));
  $('#copyYdkeBtn').addEventListener('click',()=>copyText(encodeYDKE(currentCanonicalSections()),'YDKE copied.'));
  $('#exportYdkBtn').addEventListener('click',()=>saveTextFile(`${safeFilename(state.deckName)}.ydk`,sectionsToYDK(currentCanonicalSections(),state.creator),[{description:'YDK Deck',accept:{'text/plain':['.ydk']}}]));
  $('#exportYdkeBtn').addEventListener('click',()=>saveTextFile(`${safeFilename(state.deckName)}.ydke`,encodeYDKE(currentCanonicalSections()),[{description:'YDKE Deck',accept:{'text/plain':['.ydke']}}]));
  $('#parseTextBtn').addEventListener('click',applyTextToDeck); $('#refreshTextBtn').addEventListener('click',syncTextView);
  $('#saveTextViewBtn').addEventListener('click',()=>{ const isYdk=state.deckView==='ydk'; const ext=isYdk?'.ydk':'.txt'; const text=isYdk?sectionsToYDK(currentCanonicalSections(),state.creator):dom.deckTextArea.value; saveTextFile(`${safeFilename(state.deckName)}${ext}`,text,[{description:isYdk?'YDK Deck':'Readable Deck',accept:{'text/plain':[ext]}}]); });
  dom.artworkDropdownBtn.addEventListener('click',ev=>{ev.stopPropagation();if(dom.artworkDropdownBtn.disabled)return;const opening=dom.artworkMenu.classList.contains('hidden');if(opening){dom.artworkMenu.classList.remove('hidden');dom.artworkDropdownBtn.setAttribute('aria-expanded','true');}else closeArtworkMenu();});
  dom.artworkMenu.addEventListener('pointerleave',restoreCommittedArtworkPreview);
  dom.artworkPrevBtn.addEventListener('click',()=>stepArtwork(-1)); dom.artworkNextBtn.addEventListener('click',()=>stepArtwork(1));
  dom.addPrimaryBtn.addEventListener('click',()=>{const card=selectedCard();if(card)addSearchCard(card,dom.addPrimaryBtn.dataset.section);}); dom.addSideBtn.addEventListener('click',()=>{const card=selectedCard();if(card)addSearchCard(card,SECTION_SIDE);});
  dom.openArtBtn.addEventListener('click',()=>{const card=selectedCard();if(card)openArt(card,state.selectedArtworkId);}); dom.selectedArt.addEventListener('click',()=>{const card=selectedCard();if(card&&!state.hoverPreview)openArt(card,state.selectedArtworkId);});
  dom.cardTextStylingInline?.addEventListener('click',toggleCardTextStyling);
  dom.deckTextArea.addEventListener('mousemove',previewTextLine); dom.deckTextArea.addEventListener('mouseleave',clearTextLineHover);
  dom.deckTextArea.addEventListener('input',()=>{if(state.deckView==='readable'){const before=dom.deckTextArea.value.slice(0,dom.deckTextArea.selectionStart||0);state.textSelectedLine=(before.match(/\n/g)||[]).length;positionTextLineSelection(state.textSelectedLine);scheduleReadableRecognition();}});
  dom.deckTextArea.addEventListener('scroll',()=>{positionTextLineHover(state.textHoverLine);positionTextLineSelection(state.textSelectedLine);renderTextLineAnnotations();});
  dom.deckTextArea.addEventListener('click',selectCursorTextLine); dom.deckTextArea.addEventListener('keyup',ev=>{if(['ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(ev.key))selectCursorTextLine();});
  dom.fileInput.addEventListener('change',async()=>{const file=dom.fileInput.files?.[0];if(file)await readDeckFile(file);dom.fileInput.value='';});
  $$('[data-handoff]').forEach(b=>b.addEventListener('click',()=>handoff(b.dataset.handoff)));
  document.addEventListener('click',ev=>{if(!dom.contextMenu.contains(ev.target))hideContextMenu();if(!dom.artworkDropdown.contains(ev.target))closeArtworkMenu();if(!ev.target.closest('.modern-menu'))closeAppMenus();}); window.addEventListener('blur',()=>{hideContextMenu();closeArtworkMenu();closeAppMenus();});
  window.addEventListener('dragover',ev=>{if(ev.dataTransfer?.types?.includes('Files'))ev.preventDefault();});
  window.addEventListener('drop',async ev=>{
    const hasFile=Boolean(ev.dataTransfer?.files?.length || ev.dataTransfer?.types?.includes('Files'));
    if(!hasFile)return;
    if(isDeckDropTargetElement(ev.target))return;
    ev.preventDefault();await readDroppedDeck(ev.dataTransfer);
  });
  window.addEventListener('keydown',ev=>{
    if(ev.altKey && ev.key==='F4'){ev.preventDefault();attemptApplicationExit();return;}
    if(ev.key==='Escape'){hideContextMenu();closeArtworkMenu();closeAppMenus();closeDeckSortPopover();closeSearchFilterPopover();closeLinkArrowScalePopover();closeAttributeIconScalePopover();closeRestrictionBadgeToolsPopover();}
    if(ev.key==='F1'){ev.preventDefault();openHelpDialog();return;}
    const active=document.activeElement; const editing=['INPUT','TEXTAREA','SELECT'].includes(active?.tagName) || active?.isContentEditable;
    const commandKey=ev.ctrlKey || ev.metaKey;
    if(commandKey&&!editing&&ev.key.toLowerCase()==='z'){ev.preventDefault();ev.shiftKey?redoDeckAction():undoDeckAction();return;}
    if(commandKey&&!editing&&ev.key.toLowerCase()==='y'){ev.preventDefault();redoDeckAction();return;}
    if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='s'){ev.preventDefault();saveDeckToCurrentFile();}
    if(ev.ctrlKey&&ev.key.toLowerCase()==='o'){ev.preventDefault();openDeckFile();}
    if(ev.ctrlKey&&ev.key.toLowerCase()==='n'){ev.preventDefault();newDeckAction();}
    if(ev.ctrlKey&&ev.shiftKey&&ev.key.toLowerCase()==='v'){ev.preventDefault();importClipboard();}
    if(ev.key==='Delete' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){{const uids=selectedDeckUids();if(uids.length){ev.preventDefault();removeEntries(uids);}}}
  });
  document.addEventListener('dragover', ev => {
    if (state.dragged?.source !== 'deck') return;
    if (isDeckDropTargetElement(ev.target)) { document.body.classList.remove('deck-drag-remove'); return; }
    ev.preventDefault(); ev.dataTransfer.dropEffect='move'; document.body.classList.add('deck-drag-remove');
  }, true);
  document.addEventListener('drop', ev => {
    if (state.dragged?.source !== 'deck' || isDeckDropTargetElement(ev.target)) return;
    ev.preventDefault(); ev.stopPropagation(); const uids=state.dragged.uids?.length?state.dragged.uids:[state.dragged.uid]; state.lastDropHandled=true; removeEntries(uids); finishDrag();
  }, true);
  setupDropZones(); setupSplitters(); setupCollapsibles();
  setupPaneCollapseButtons();
  new ResizeObserver(scheduleDeckLayout).observe(dom.visualDeckView);
  const workspaceResizeObserver=new ResizeObserver(()=>{fitResponsivePaneWidths();for(const kind of ['search','deck']) if(optionDrawerIsDocked(kind)) applyDockedDrawerWidth(kind);updateSearchDrawerWorkspaceReservation();scheduleDeckLayout();});
  workspaceResizeObserver.observe(dom.workspace);
  window.addEventListener('resize',()=>{fitResponsivePaneWidths();updateSearchDrawerWorkspaceReservation();for(const kind of ['search','deck']) if(!optionDrawerIsDocked(kind)) clampFloatingDrawerPosition(kind);scheduleDeckLayout();refitOpenFilterPopovers();});
}
function safeFilename(name){return String(name||'YGO Deck').replace(/[<>:"/\\|?*\x00-\x1F]/g,'_').trim()||'YGO Deck';}
function startWindowGeometryTracking() {
  let timer = 0;
  const send = () => {
    timer = 0;
    const width = Math.round(window.outerWidth || 0);
    const height = Math.round(window.outerHeight || 0);
    if (width < 200 || height < 200) return;
    const availWidth = Number(screen.availWidth || 0);
    const availHeight = Number(screen.availHeight || 0);
    const maximized = availWidth > 0 && availHeight > 0 && width >= availWidth - 18 && height >= availHeight - 18;
    const payload = {x:Math.round(window.screenX || 0), y:Math.round(window.screenY || 0), width, height, maximized};
    fetch('/api/window-geometry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store',keepalive:true}).catch(()=>{});
  };
  const schedule = () => { clearTimeout(timer); timer = setTimeout(send, 350); };
  window.addEventListener('resize', schedule);
  window.addEventListener('pagehide', send);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')send();});
  const interval = setInterval(send, 1000);
  setTimeout(send, 500);
  return () => clearInterval(interval);
}
function startHostHeartbeat() {
  const beat = () => fetch('/api/heartbeat', { method:'POST', cache:'no-store', keepalive:true }).catch(() => {});
  beat();
  const timer = setInterval(beat, 1500);
  const requestShutdown = () => {
    try {
      if (navigator.sendBeacon) navigator.sendBeacon('/api/shutdown-request', new Blob([], {type:'text/plain'}));
      else fetch('/api/shutdown-request', {method:'POST', keepalive:true}).catch(() => {});
    } catch {}
  };
  window.addEventListener('beforeunload', ev=>{
    if(state.dirty && !state.allowUnloadOnce) {
      ev.preventDefault();
      ev.returnValue='';
      return '';
    }
    requestShutdown();
  });
  window.addEventListener('pagehide', requestShutdown);
  window.addEventListener('unload', requestShutdown);
  window.addEventListener('pageshow', beat);
  return () => clearInterval(timer);
}
async function boot() {
  startHostHeartbeat();
  queueMicrotask(()=>startApplicationUpdater());
  startWindowGeometryTracking();
  restoreSettings(); await restoreIconTuningFile(); installDeckLibraryUI(); bindEvents(); syncCardTextStylingControl(); fitResponsivePaneWidths({force:true}); renderEffectOptions(); renderLinkArrowFilterOptions(); renderLinkMaterialOptions(); renderSearchSortModeOptions(); updateSearchFilterSummary(); updateSearchStatSummary();
  syncSearchViewButtons();
  setupSearchListColumnResizeObserver();
  setupDeckListColumnResizeObserver();
  $$('[data-analysis]').forEach(b=>b.classList.toggle('active',b.dataset.analysis===state.analysisView));
  dom.validationView.classList.toggle('hidden',state.analysisView!=='validation'); dom.statisticsView.classList.toggle('hidden',state.analysisView!=='statistics');
  setDeckView(state.deckView);
  try {
    const info=await fetch('/api/status').then(r=>r.json());
  } catch {}
  await saveIconTuningFile();
  await loadDatabase(false);
  void initializeDeckLibrary();
}
boot();
const warmDuelController=()=>{try{ensureIntegratedDuelController();}catch(error){console.warn('Test Duel background warm-up failed',error);}};
if(typeof requestIdleCallback==='function')requestIdleCallback(warmDuelController,{timeout:1200});else setTimeout(warmDuelController,0);
function duelDeckFromSections(sections={}) {
  const mapSection=items=>(items||[]).map(item=>({id:Number(item?.id??item)})).filter(item=>Number.isFinite(item.id)&&item.id>0);
  return {main:mapSection(sections.main),extra:mapSection(sections.extra),side:mapSection(sections.side)};
}
let recentDuelDeckChoiceSignature='',recentDuelDeckChoiceCache=[];
function getRecentDuelDeckChoices() {
  const items=getRecentDecks(),signature=items.map(item=>`${item.fileName}:${item.openedAt}:${item.text.length}`).join('|');
  if(signature===recentDuelDeckChoiceSignature)return recentDuelDeckChoiceCache;
  const out=[];for(const item of items){try{const parsed=parseDeckText(item.text,item.fileName);out.push({name:item.deckName||item.fileName.replace(/\.[^.]+$/,''),fileName:item.fileName,deck:duelDeckFromSections(parsed.sections),sourcePath:item.sourcePath||''});}catch{}}
  recentDuelDeckChoiceSignature=signature;recentDuelDeckChoiceCache=out;return out;
}
async function openDuelDeckChoice() {
  let opened=null;
  try{opened=await hostDeckFileRequest('/api/deck-file/open');if(opened?.canceled)return null;}catch{}
  if(!opened){
    try{if('showOpenFilePicker' in window){const [handle]=await window.showOpenFilePicker({types:[{description:'Yu-Gi-Oh deck files',accept:{'text/plain':['.ydk','.ydke','.txt','.md','.list','.deck','.csv','.tsv']}}],multiple:false});const file=await handle.getFile();opened={text:await file.text(),fileName:file.name,path:''};}}catch(error){if(error?.name==='AbortError')return null;throw error;}
  }
  if(!opened)return null;const fileName=opened.fileName||'Opponent Deck.ydk';const parsed=parseDeckText(opened.text,fileName);return{name:fileName.replace(/\.[^.]+$/,'')||'Opponent Deck',fileName,deck:duelDeckFromSections(parsed.sections),sourcePath:opened.path||''};
}
let integratedDuelController = null;
function ensureIntegratedDuelController() {
  if (!integratedDuelController) {
    integratedDuelController = new IntegratedDuelController({
        getDeck: () => ({
          main: state.deck.main.map(entry => ({id:Number(entry.id)})),
          extra: state.deck.extra.map(entry => ({id:Number(entry.id)})),
          side: state.deck.side.map(entry => ({id:Number(entry.id)})),
        }),
        getCardById: id => state.indexes.byId.get(Number(id)) || null,
        getDeckName: () => state.deckName,
        getRecentDuelDecks: () => getRecentDuelDeckChoices(),
        getDeckLibraryDuelDecks: () => getDeckLibraryDuelChoices(),
        getDeckLibraryState: () => ({ready:!!deckLibraryReady, refreshing:!!deckLibraryRefreshPromise}),
        openDuelDeck: () => openDuelDeckChoice(),
        chooseDeckLibraryDuelDeck: () => chooseDeckLibraryDuelDeck(),
        openDeckLibrarySettings: () => openDeckLibraryDialog(),
        refreshDeckLibrary: () => refreshDeckLibrary({requestPermission:false}),
        openCardArt: card => openArt(card),
        toast,
        formatCardText: (text, code) => state.cardTextStyling
          ? highlightCardText(text, state.indexes.byId.get(Number(code)) || null)
          : escapeHtml(normalizeCardEffectLayout(text)),
        getCardTextStyling: () => state.cardTextStyling,
        toggleCardTextStyling: () => toggleCardTextStyling(),
        getCardLimitStatus: (id, banlist = state.banlist) => cardLimitStatus(state.indexes.byId.get(Number(id)) || null, banlist),
        getBanlist: () => state.banlist,
      });
  }
  return integratedDuelController;
}
async function startIntegratedTestDuel() {
  const launchBtn = $('#testDuelBtn');
  try {
    launchBtn?.setAttribute('aria-busy', 'true');
    const controller=ensureIntegratedDuelController();
    const result = controller.start();
    Promise.resolve(result).catch(error => {
      console.error('Test Duel launch failed', error);
      toast(`Test Duel failed to open: ${error?.message || error}`);
    }).finally(() => launchBtn?.removeAttribute('aria-busy'));
    return result;
  } catch (error) {
    launchBtn?.removeAttribute('aria-busy');
    console.error('Test Duel initialization failed', error);
    toast(`Test Duel failed to initialize: ${error?.message || error}`);
    return null;
  }
}


// RC236 native launcher update client. The launcher owns network/download/install work;
// this browser layer owns native-window scheduling and the compact user experience.
function startApplicationUpdater(){
  const cfg=window.__YGO_UPDATE_TEST_TIMINGS__||{},intervalMs=Number(cfg.intervalMs)||300000,focusMs=Number(cfg.focusMs)||120000,heartbeatMs=Number(cfg.heartbeatMs)||5000;
  const client={base:'',lastCheck:0,checking:false,banner:null,status:null,manual:false};
  const busy=()=>({dirty:!!state.dirty,duel_running:!!integratedDuelController?.running,visible:document.visibilityState==='visible',version:'3.0.0-alpha.221-duelcore.1-rc239'});
  const post=async(path,body=null)=>{if(!client.base)throw new Error('Updater service unavailable.');const r=await fetch(client.base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):'{}',cache:'no-store'});if(!r.ok)throw new Error((await r.text()).trim()||`Updater returned ${r.status}.`);return r.json();};
  const get=async path=>{if(!client.base)throw new Error('Updater service unavailable.');const r=await fetch(client.base+path,{cache:'no-store'});if(!r.ok)throw new Error((await r.text()).trim()||`Updater returned ${r.status}.`);return r.json();};
  const discover=async()=>{for(let port=49357;port<49367;port++){const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),350);try{const r=await fetch(`http://127.0.0.1:${port}/api/update/ping`,{cache:'no-store',signal:ctrl.signal});if(r.ok){const j=await r.json();if(j.app_id==='com.techsavage1989.ygo-deck-studio'){client.base=`http://127.0.0.1:${port}`;clearTimeout(timer);return true}}}catch{}clearTimeout(timer)}return false;};
  const ensureUI=()=>{if(client.banner)return client.banner;const b=document.createElement('aside');b.id='appUpdateBanner';b.className='app-update-banner';b.hidden=true;b.innerHTML='<div class="app-update-main"><strong data-update-title>Application Update</strong><span data-update-version></span><ul data-update-notes></ul><span data-update-message></span></div><div class="app-update-actions"><button type="button" class="btn compact ghost" data-update-read hidden>Read more</button><button type="button" class="btn compact ghost" data-update-check>Check again</button><button type="button" class="btn compact" data-update-download hidden>Download</button><button type="button" class="btn compact" data-update-install hidden>Install and restart</button><button type="button" class="icon-btn" data-update-close aria-label="Dismiss update message">×</button></div>';document.body.append(b);client.banner=b;
    b.querySelector('[data-update-close]').onclick=()=>b.hidden=true;b.querySelector('[data-update-check]').onclick=()=>check(true);b.querySelector('[data-update-download]').onclick=download;b.querySelector('[data-update-install]').onclick=install;b.querySelector('[data-update-read]').onclick=()=>{const u=client.status?.latest?.page_url;if(u)fetch(`/api/open-external?url=${encodeURIComponent(u)}`).catch(()=>window.open(u,'_blank'))};
    const helpSection=[...document.querySelectorAll('#appMenuPanel .modern-menu-section')].find(s=>/Database & Help/i.test(s.querySelector('h3')?.textContent||''));if(helpSection&&!helpSection.querySelector('[data-menu-action="check-updates"]')){const btn=document.createElement('button');btn.type='button';btn.setAttribute('role','menuitem');btn.dataset.menuAction='check-updates';btn.innerHTML='<span>Check for Updates</span>';btn.onclick=()=>{closeAppMenus();check(true)};const help=helpSection.querySelector('[data-menu-action="help"]');helpSection.insertBefore(btn,help||null)}return b;};
  const render=(s,{manual=false}={})=>{client.status=s;const b=ensureUI(),title=b.querySelector('[data-update-title]'),ver=b.querySelector('[data-update-version]'),notes=b.querySelector('[data-update-notes]'),msg=b.querySelector('[data-update-message]'),read=b.querySelector('[data-update-read]'),checkBtn=b.querySelector('[data-update-check]'),downloadBtn=b.querySelector('[data-update-download]'),installBtn=b.querySelector('[data-update-install]');notes.replaceChildren();read.hidden=true;downloadBtn.hidden=true;installBtn.hidden=true;checkBtn.hidden=false;b.classList.remove('is-error','is-ready','is-progress');
    const installed=s.installed_version||'3.0.0-alpha.221-duelcore.1-rc239',latest=s.latest?.version||'';ver.textContent=latest&&latest!==installed?`Installed ${installed} · Latest ${latest}`:`Version ${installed}`;msg.textContent=s.message||'';
    if(s.state==='available'||s.state==='downloaded'||s.state==='downloading'){b.hidden=false;if(s.state==='downloaded')b.classList.add('is-ready');if(s.state==='downloading')b.classList.add('is-progress');title.textContent=s.state==='downloaded'?'Update ready to install':'Update available';for(const n of (s.latest?.notes||[]).slice(0,3)){const li=document.createElement('li');li.textContent=n;notes.append(li)}read.hidden=!s.latest?.read_more;downloadBtn.hidden=s.state!=='available';installBtn.hidden=s.state!=='downloaded';checkBtn.hidden=s.state==='downloading';if(s.state==='downloading')msg.textContent=`Downloading update... ${Number(s.download_progress)||0}%`;return}
    if(s.state==='checking'){if(manual){b.hidden=false;title.textContent='Checking for updates';msg.textContent='Contacting the release feed...';b.classList.add('is-progress')}return}
    if(s.state==='up_to_date'){b.hidden=true;if(manual)toast(`YGO Deck Studio ${installed} is up to date.`,'good');return}
    if(s.state==='error'||s.state==='throttled'||s.state==='no_release'){b.hidden=false;b.classList.add('is-error');title.textContent=s.state==='no_release'?'Update feed not published':'Update check unavailable';downloadBtn.hidden=true;installBtn.hidden=true;return}
    b.hidden=true;
  };
  const check=async manual=>{if(client.checking)return;if(!client.base){if(!await discover()){render({state:'error',installed_version:'3.0.0-alpha.221-duelcore.1-rc239',message:'The native update service is unavailable.'},{manual});return}await post('/api/update/hello',busy()).catch(()=>{})}client.checking=true;render({state:'checking',installed_version:'3.0.0-alpha.221-duelcore.1-rc239'},{manual});try{const s=await post(`/api/update/check?manual=${manual?'1':'0'}`);client.lastCheck=Date.now();render(s,{manual})}catch(e){client.lastCheck=Date.now();render({state:'error',installed_version:'3.0.0-alpha.221-duelcore.1-rc239',message:e.message},{manual})}finally{client.checking=false}};
  const download=async()=>{try{ensureUI().querySelector('[data-update-download]').disabled=true;const pending=post('/api/update/download');const poll=setInterval(()=>get('/api/update/status').then(s=>render(s)).catch(()=>{}),500);const s=await pending;clearInterval(poll);render(s)}catch(e){render({state:'error',installed_version:'3.0.0-alpha.221-duelcore.1-rc239',latest:client.status?.latest,message:e.message})}finally{const n=client.banner?.querySelector('[data-update-download]');if(n)n.disabled=false}};
  const install=async()=>{if(state.dirty){toast('Save the current deck before installing the update.','warn');return}if(integratedDuelController?.running){toast('End the active duel before installing the update.','warn');return}if(!await appConfirm('Install the downloaded update and restart YGO Deck Studio?',{acceptLabel:'Install and restart',cancelLabel:'Cancel'}))return;try{await post('/api/update/heartbeat',busy());await post('/api/update/install',busy());state.allowUnloadOnce=true;requestApplicationShutdown()}catch(e){render({state:'error',installed_version:'3.0.0-alpha.221-duelcore.1-rc239',latest:client.status?.latest,message:e.message})}};
  ensureUI();discover().then(async ok=>{if(!ok){render({state:'error',installed_version:'3.0.0-alpha.221-duelcore.1-rc239',message:'The native update service is unavailable.'});return}await post('/api/update/hello',busy()).catch(()=>{});void check(false);setInterval(()=>post('/api/update/heartbeat',busy()).catch(()=>{}),heartbeatMs)});
  window.setInterval(()=>{if(document.visibilityState==='visible'&&navigator.onLine!==false)void check(false)},intervalMs);window.addEventListener('focus',()=>{if(Date.now()-client.lastCheck>=focusMs)void check(false)});window.addEventListener('online',()=>{if(Date.now()-client.lastCheck>=focusMs)void check(false)});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&Date.now()-client.lastCheck>=focusMs)void check(false)});
  window.__YGO_UPDATE_CLIENT__={check,render,client,busy};
}
