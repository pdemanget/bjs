files
===
files are divided in layers.

b0.js: injection in DOM, loading
b1 :yaml dependencies
b2 :bindings
b3 :components



Classes
=================
init project:
adding files .bowerrc package.json bower.json


Refacto
=======

ES6
---
removing deprecation

Un arbre non équilibré a été écrit en utilisant « document.write() » provoquant une nouvelle analyse de données provenant du réseau. Pour plus d’informations, consultez https://developer.mozilla.org/en/Optimizing_Your_Pages_for_Speculative_Parsing  b6.html:1

L’utilisation d’XMLHttpRequest de façon synchrone sur le fil d’exécution principal est obsolète à cause de son impact négatif sur la navigation de l’utilisateur final. Consulter http://xhr.spec.whatwg.org/ pour plus d’informations.

HTML
====

Standard Headers/links
<!DOCTYPE html>
<html lang="en"><head><title>reversi</title>
<meta charset="utf-8"/>
<!--
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
-->
<link rel="stylesheet" href="app.css"/>
</head><body>
<script src="b.js"></script>
