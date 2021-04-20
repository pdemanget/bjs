bjs
===

Bjs lightweight javascript framework.

The intention is to make a pure JS framework with the lowest footprint and allowing additional vanilla javascript.


Usage
=====

Getting started
---------------
first usage without build, starting using pure html.


1. include b.js : `<script defer src="../dist/b.js"></script>`
2. bind an input to a variable using _bbind_ `<input bbind="name" >`
3. display the value of the variable using _bval_ `Your name is <span bval="name"/>`
4. initialise the value in javascript:
  4a. get the bjs instance from _bready_ event
>      document.addEventListener('bready', (event) => {
>      // Get BJS instance in JS
>      const b = event.detail;
  4b. modify the value in scope:
>      b.scope.name = "Bill";

see in file : demo/1st-try.html


starting using pug
------------------

In the webpack settings, add a configuration for your pug files:

    new HtmlWebpackPlugin({
      template: './src/starting.pug',
      filename: 'starting.html',
      title: 'Getting started',
      minify: false,
      inject: false,
    }),



Documentation
=============

Syntax
------
### html
`<script defer src="../dist/b.js"></script>` : includes the framework

Every directives starts with b: bval, bfor....

`<input bbind="name" >`

### js
There is one BJS instance per loading. You could get multiple instance if you start many scopes. The standard is one instance attached to "document".

**get bjs instance**
Trap the event:

>document.addEventListener('bready', (event) => {
>      // Get BJS instance in JS
>      const b = event.detail;// b is an instance of BJS
>});

**BJS attributes**
| Type                       | Attribute       | Description                                                          |
|----------------------------|-----------------|----------------------------------------------------------------------|
| scope:object proxy         | scope           | values for fetch and display                                         |
| {varName,callback[]}:proxy | watchers        | values watched with their callbacks                                  |
| {varName,callback[]}:Map   | filters         | Map of custom filters                                                |
| todo                       | directives      |                                                                      |


**BJS events**
| Type                       | Event           | Description                                                          |
|----------------------------|-----------------|----------------------------------------------------------------------|
| scope:object proxy         | bplugin         | BJS is loading filters and directives before any rendering           |
| scope:object proxy         | bready          | BJS is ready for templates rendering and scope injections            |


**BJS methods**
| Type                       | Method          | Description                                                          |
|----------------------------|-----------------|----------------------------------------------------------------------|
| scope:object proxy         | scope           | values for fetch and display                                         |


**Scope attributes**
The scope attributes can contain any custom var, with dynamic binded or js injection. Additionnaly there are 2 "magic" vars:
| Type                       | Attribute       | Description                                                          |
|----------------------------|-----------------|----------------------------------------------------------------------|
| scope                      | $super          | parent scope if any                                                  |
| BJS                        | $b              | BJS instance                                                         |

**examples**


Directives
----------
- `bval`: display a single value inside the including tag, can be a span a div...
- `bfor`: loop on values


Framework build
================

Installation Note
-----------------
Install the project dependencies using Yarn, then run, test or build the dist:

	$ yarn install
	$ yarn run dev
	$ yarn run test --coverage
	$ yarn run build

The compilation uses webpack for pug and the JS import resolution. We can optionnaly minify it. 
