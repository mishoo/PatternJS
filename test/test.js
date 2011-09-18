#! /usr/bin/env node

var fs = require("fs"), sys = require("util"), uglify = require("uglify-js"), jsp = uglify.parser, pro = uglify.uglify;

(function test($){

    var ast = [
        1,
        2,
        [ 3,
          "mak",
          "bar","bar","bar","bar",
          "mak","bar"
        ]
    ];
    var pat;

    // note how the regexp looks like:
    // * match anything(1) followed by anything(2); note second one as F2; note the whole as F1
    // * match at least one F2
    // * match
    with ($) pat = COMPILE(
        NAMED("F1", ANYTHING(), NAMED("F2")),
        MORE(REF("F2")),
        REF("F1"), END()
    );

    // with ($) pat = COMPILE(
    //     NAMED("F1", ANYTHING(), "bar"),
    //     MORE("bar"),
    //     REF("F1")
    // );

    // with ($) pat = COMPILE(
    //     NAMED("F1", "bar", "mak")
    // );

    console.log(sys.inspect(pat, null, null));
    console.log("* * * * *");

    $.search(ast, pat, function(data){
        console.log(data);
        console.log(data.$match().content());
    });

    console.log("* * * * *");

})(require("../pattern"));


(function test($){

    // turn most of the names in an UglifyJS AST to uppercase

    (function(){
        if (a <= b) {
            foo();
        } else {
            bar();
        }
    });

    function NOT_NULL(thing){ return thing != null };

    var ast = jsp.parse(test.toString());
    var pat;

    // this regexp matches (most of the) names:
    with ($) pat = COMPILE(
        OR(
            // obviously, plain name here
            [ "name", NAMED("thing") ],

            // the name of a function, and the argument list
            [ OR("function", "defun"),
              OR( NAMED("thing", CHECK(NOT_NULL)),
                  ANYTHING() ),
              NAMED("args") ],

            // the thing in anything.thing is a name
            [ "dot", ANYTHING(), NAMED("thing") ],

            // variables/constants/properties
            [ OR("var", "const", "object"), NAMED("defs") ],

            // this is something else -- turn <= into > and >= into <
            [ OR([ "if",
                   [ "binary", NAMED("operator", OR("<=", ">=")) ],
                   NAMED("t"),
                   NAMED("e") ])],

            // again, something else -- block brackets that only
            // contain one statement can be discarded
            NAMED("one_block", [ "block", [ NAMED("one_stat", ANYTHING()), END() ]])
        )
    );

    console.log(sys.inspect(pat, null, null));
    console.log("* * * * *");

    $.search(ast, pat, function(data){
        if (data.thing) {
            data.thing.replace([ data.thing.first().toUpperCase() ]);
        }
        if (data.defs) {
            data.defs.first().forEach(function(def){
                def[0] = def[0].toUpperCase();
            });
        }
        if (data.args) {
            data.args.replace([ data.args.first().map(function(name){
                return name.toUpperCase();
            }) ]);
        }
        if (data.operator) {
            var op = data.operator;
            op.replace([ op.first() == "<=" ? ">" : "<" ]);
            data.e.swap(data.t);
        }
        if (data.one_block) {
            data.one_block.replace(data.one_stat);
        }
    });

    console.log("* * * * *");
    console.log(pro.gen_code(ast, { beautify: true }));

})(require("../pattern"));
