/*
 * ********** mixT **********
 * 
 * mixT is a string-based template
 *  
 * Created on Tue Dec 12 2017
 * Author: wangxiaokang
 */

(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.mixT = factory();
    }
})(this, function () {
    "use strict";
    var mixT = {
        name: "mixT",
        version: "0.1.0",
        settings: {
            evaluate: /\{\{%([\s\S]+?(\}?)+)\}\}/g,
            interpolate: /\{\{([^%!#\d\/][\s\S]+?)\}\}/g,
            conditional: /\{\{#(if|else)\s*([\s\S]*?)\s*\}\}/g,
            iterate: /\{\{#each(?:\s*([\s\S]+?)\s*(?:as)\s*([\s\S]*?)(?:,([\s\S]*?))?)?\}\}/g,
            blockend: /\{\{\/([\s\S]+?)\}\}/g,
            encode: /\{\{!([\s\S]+?)\}\}/g,
            strip: true,
            varname: "data"
        },
        encodeHTML: function (code) {
            var encodeMap = {
                "&": "&#38;",
                "<": "&#60;",
                ">": "&#62;",
                '"': "&#34;",
                "'": "&#39;",
                "/": "&#47;"
            }, htmlMark = /[&<>"'\/]/g;

            return code ?
                code.toString().replace(htmlMark, function (m) {
                    return encodeMap[m] || m;
                }) : "";
        },
        fix: {
            pre: "'+(",
            suf: ")+'",
            preEncode: "'+mixT.encodeHTML("
        },
        unescape: function (code) {
            return code.replace(/\\('|\\)/g, "$1").replace(/[\r\t\n]/g, " ");
        }
    };

    mixT.compile = function (tmpl, data) {
        var c = mixT.settings,
            fix = mixT.fix,
            unescape = mixT.unescape,
            sid = 0,
            indv,
            str = tmpl.replace(/(^\s*|\s*$)/gm, function (m) {
                return c.strip ? '' : m;
            }).replace(/\n/g, function (m) {
                return c.strip ? '' : '\\n';
            }).replace(/\r/g, function (m) {
                return c.strip ? '' : '\\r';
            }).replace(/\t/g, function (m) {
                return c.strip ? '' : '\\t';
            });

        str = ("var out='" +
            str.replace(c.interpolate, function (m, code) {
                return fix.pre + unescape(code) + fix.suf;
            }).replace(c.encode, function (m, code) {
                return fix.preEncode + unescape(code) + fix.suf;
            }).replace(c.conditional, function (m, ifOrElse, code) {
                if (ifOrElse === 'if') {
                    return "';if(" + unescape(code ? code : 'false') + "){out+='";
                } else if (code) {
                    return "';}else if(" + unescape(code ? code : 'false') + "){out+='";
                } else {
                    return "';}else {out+='";
                }
            }).replace(c.iterate, function (m, iterate, vname, iname) {
                if (!iterate) {
                    return "';}} out+='";
                }

                sid += 1; indv = iname || "i" + sid; iterate = unescape(iterate);

                return "';var arr" + sid + "=" + iterate + ";if(arr" + sid + "){var " + vname + "," + indv + "=-1,l" + sid + "=arr" + sid + ".length;while(" + indv + "+1<l" + sid + "){" + vname + "=arr" + sid + "[++" + indv + "];out+='";

            }).replace(c.blockend, function (m, code) {
                if (code === 'each') {
                    return "';}} out+='";
                }

                return "';}out+='";
            }).replace(c.evaluate, function (m, code) {
                return "';" + unescape(code) + "out+='";
            }) + "';return out;");

        try {
            return !data ? new Function(c.varname, str) : (new Function(c.varname, str))(data);
        } catch (e) {
            if (typeof console !== "undefined") {
                console.warn(e);
            }
        }
    };

    return mixT;
});
