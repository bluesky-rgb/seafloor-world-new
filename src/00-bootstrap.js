(function(){
'use strict';
const $=id=>document.getElementById(id);
if(!window.THREE||!THREE.OrbitControls){$('err').hidden=false;return;}

