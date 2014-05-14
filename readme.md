
HTML5Calendar - Full-sized drag & drop event calendar
====================================================

This document describes how to modify or contribute to the HTML5Calendar project. 

Quick Links
-----------
 - [Developer documentation][ht5c-docs]
 - [Demos][ht5c-demos]


Getting Set Up
--------------

You will need [Git][git], [Node][node], and NPM installed. For clarification, please view the [jQuery readme][jq-readme], which requires a similar setup.

Also, you will need the [grunt-cli][grunt-cli] and [bower][bower] packages installed globally (`-g`) on your system:

	npm install -g grunt-cli bower

Then, clone HTML5Calendar's git repo:

	git clone git://github.com/scottpledger/html5calendar.git

Enter the directory and install HTML5Calendar's development dependencies:

	cd html5calendar && npm install


Development Workflow
--------------------

After you make code changes, you'll want to compile the JS/CSS so that it can be previewed from the tests and demos. You can either manually rebuild each time you make a change:

	grunt dev

Or, you can run a script that automatically rebuilds whenever you save a source file:

	./build/watch

You can optionally add the `--sourceMap` flag to output source maps for debugging.

When you are finished, run the following command to write the distributable files into the `./build/out/` and `./build/dist/` directories:

	grunt

If you want to clean up the generated files, run:

	grunt clean


Style Guide
-----------

Please follow the [Google JavaScript Style Guide] as closely as possible. With the following exceptions:

```js
if (true) {
}
else { // please put else, else if, and catch on a separate line
}

// please write one-line array literals with a one-space padding inside
var a = [ 1, 2, 3 ];

// please write one-line object literals with a one-space padding inside
var o = { a: 1, b: 2, c: 3 };
```

Other exceptions:

- please ignore anything about Google Closure Compiler or the `goog` library
- please do not write JSDoc comments

Notes about whitespace:

- use *tabs* instead of spaces
- separate functions with *2* blank lines
- separate logical blocks within functions with *1* blank line

Run the command line tool to automatically check your style:

	grunt check


Before Contributing!
--------------------

If you have edited code (including **tests** and **translations**) and would like to submit a pull request, please make sure you have done the following:

1. Conformed to the style guide (successfully run `grunt check`)

2. Written automated tests. View the [Automated Test README]



[ht5c-homepage]: http://scottpledger.github.io/html5calendar/
[ht5c-docs]: http://scottpledger.github.io/html5calendar/docs/readme.html
[ht5c-demos]: http://scottpledger.github.io/html5calendar/demos/index.html
[git]: http://git-scm.com/
[node]: http://nodejs.org/
[grunt-cli]: http://gruntjs.com/getting-started#installing-the-cli
[bower]: http://bower.io/
[jq-readme]: https://github.com/jquery/jquery/blob/master/README.md#what-you-need-to-build-your-own-jquery
[karma]: http://karma-runner.github.io/0.10/index.html
[Google JavaScript Style Guide]: http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
[Automated Test README]: ./tests/automated_test_readme.md
