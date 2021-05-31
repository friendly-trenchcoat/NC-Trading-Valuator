// ==UserScript==
// @name         Waka Pricer
// @version      1.0
// @description  Automatically label NC items with waka value. Visit ~/waka to refresh values.
// @author       friendly-trenchcoat
// @match        http://www.neopets.com/~waka
// @match        http://www.neopets.com/inventory.phtml*
// @match        http://www.neopets.com/closet.phtml*
// @match        http://www.neopets.com/safetydeposit.phtml*
// @match        http*://items.jellyneo.net/*
// @match        http*://www.jellyneo.net/?go=*
// @match        http*://impress.openneo.net/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

/**
 * Waka is a community resource that tracks the approximate value of NC items, based on real-world trades.
 *
 * The Waka Team aims to maintain the accuracy of the guide as fully as possible, but please remember values are
 * often changing and with certain difficult-to-find or popular items it doesn't hurt to make a value check!
 *
 */

(function () {
    'use strict';
    console.log('Waka Pricer');


    // Store & Fetch waka data
    if (document.URL.includes("~waka")) {
        let items_arr = document.getElementsByClassName("itemList")[0].innerText.split('\n');
        let items = items_arr.reduce((o, item) => {
            let split = item.split(' ~ ');
            if (split.length === 2) o[split[0]] = split[1];
            return o;
        }, {});
        GM_setValue("NEOPETS_WAKA", JSON.stringify(items));
        console.log('Waka values updated.');
    }
    else {
        var WAKA;
        try {
            WAKA = JSON.parse(GM_getValue("NEOPETS_WAKA"));
        }
        catch (err) {
            console.log('Visit waka to populate data: http://www.neopets.com/~waka');
        }
        if (WAKA) {
            createCSS();
            drawValues(WAKA);
        }
    }

    function drawValues(WAKA) {
        // stealin this
        jQuery.fn.justtext = function () {
            return $(this).clone().children().remove().end().text();
        };

        if (document.URL.includes("neopets.com/inventory")) {
            if ($('#navnewsdropdown__2020').length) {
                // Beta Inventory
                $(document).ajaxSuccess(function () {
                    $('.item-subname:contains("wearable"):contains("Neocash"):not(:contains("no trade"))').each(function (i, el) {
                        let $parent = $(el).parent();
                        if (!$parent.find('.waka').length) {
                            const name = $parent.find('.item-name').text();
                            const value = WAKA[name] || '?';
                            $parent.children().eq(0).after(`<div class="waka"><div>${value}</div></div>`);
                        }
                    });
                });
            } else {
                // Classic Inventory
                $('td.wearable:contains(Neocash)').each(function (i, el) {
                    const name = $(el).justtext();
                    const value = WAKA[name] || '?';
                    $(el).append(`<div class="waka"><div>${value}</div></div>`);
                });
            }
        }

        // Closet
        else if (document.URL.includes("neopets.com/closet")) {
            $('td>b:contains("Artifact - 500")').each(function (i, el) {
                const name = $(el).justtext();
                const value = WAKA[name] || '?';
                $(el).parent().prev().append(`<div class="waka"><div>${value}</div></div>`);
            });
        }

        // SDB
        else if (document.URL.includes("neopets.com/safetydeposit")) {
            $('tr[bgcolor="#DFEAF7"]:contains(Neocash)').each(function (i, el) {
                const name = $(el).find('b').first().justtext();
                const value = WAKA[name] || '?';
                $(el).children().eq(0).append(`<div class="waka"><div>${value}</div></div>`);
            });
        }

        // JNIDB
        else if (document.URL.includes("items.jellyneo.net")) {
            $('img.item-result-image.nc').each((i, el) => {
                const name = $(el).attr('title').split(' - r')[0];
                const value = WAKA[name] || '?';
                let $parent = $(el).parent();
                let $next = $parent.next();
                if ($next.is('br')) $next.remove();
                $parent.after(`<div class="waka"><div>${value}</div></div>`);
            });
        }

        // JN Article
        else if (document.URL.includes("www.jellyneo.net")) {
            $('img[src*="/items/"]').each((i, el) => {
                const name = $(el).attr('title') || $(el).attr('alt');
                const value = WAKA[name];
                if (value) {
                    let $parent = $(el).parent();
                    let $next = $parent.next();
                    if ($next.is('br')) $next.remove();
                    $parent.after(`<div class="waka"><div>${value}</div></div>`);
                }
            });
        }

        // Classic DTI Customize
        else if (document.URL.includes("impress.openneo.net/wardrobe")) {
            $(document).ajaxSuccess(function (event, xhr, options) {
                if (options.url.includes('/items')) {
                    $('img.nc-icon').each((i, el) => {
                        let $parent = $(el).parent();
                        if (!$parent.find('.waka').length) {
                            const name = $parent.text().match(/ (\S.*)  i /)[1];
                            const value = WAKA[name] || '?';
                            $parent.children().eq(0).after(`<div class="waka"><div>${value}</div></div>`);
                        }
                    });
                }
            });
        }
        // Classic DTI User Profile
        else if (document.URL.includes("impress.openneo.net/user/")) {
            $('img.nc-icon').each((i, el) => {
                let $parent = $(el).parent();
                if (!$parent.find('.waka').length) {
                    const name = $parent.find('span.name').text();
                    const value = WAKA[name] || '?';
                    $parent.children().eq(0).after(`<div class="waka"><div>${value}</div></div>`);
                }
            });
        }
        // Classic DTI Item
        else if (document.URL.includes("impress.openneo.net/items")) {
            if ($('img.nc-icon').length) {
                const name = $("#item-name").text();
                const value = WAKA[name] || '?';
                $("#item-name").after(`<div class="waka"><div>${value}</div></div>`);
            }
            //$('header#item-header>div').append($(`<a href="https://impress-2020.openneo.net/items/search/${encodeURIComponent(name)}" target="_blank">DTI 2020</a>`));
            $('header#item-header>div').append($(`<a href="https://impress-2020.openneo.net/items/${$('#item-preview-header > a').attr('href').split('=').pop()}" target="_blank">DTI 2020</a>`));
        }
    }

    function createCSS() {
        var css = document.createElement("style");
        css.type = "text/css";
        css.innerHTML = `
            .waka {
                display: flex;
            }
            .waka>div {
                font-family: "Helvetica Neue","Helvetica",Helvetica,Arial,sans-serif;
                font-size: 12px;
                font-weight: bold;
                line-height: normal;
                text-align: center;
                color: #fff;
                background: #8A68AD;
                border-radius: 50px;
                padding: 0.05em 0.5em;
                margin: 3px auto;
            }
        `;
        document.body.appendChild(css);
    }
})();
