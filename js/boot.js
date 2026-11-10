(function(L){
const U = L.ui, S = U.S;
S.meta = U.loadMeta();
window.__lrt = { s:S, ui:U, core:L.core, L:L };
document.addEventListener('pointerdown', () => { try { AU.init(); } catch (e) {} }, { once:true });
U.go('title');
if (location.search.indexOf('dbg') >= 0) window.__dbg = true;
})(LRT);
