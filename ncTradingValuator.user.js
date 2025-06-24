// ==UserScript==
// @name         NC Trading Valuator
// @version      2.0.2
// @description  Automatically label NC items with crowdsourced trading values. Visit ~/lebron to refresh values.
// @author       friendly-trenchcoat
// @match        https://www.neopets.com/~lebron
// @match        https://www.neopets.com/inventory.phtml*
// @match        https://www.neopets.com/closet.phtml*
// @match        https://www.neopets.com/safetydeposit.phtml*
// @match        https://www.neopets.com/gallery/index.phtml*
// @match        https://items.jellyneo.net/*
// @match        https://www.jellyneo.net/?go=*
// @match        https://impress-2020.openneo.net/*
// @match        https://impress.openneo.net/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

/**
 * This script is not associated with the wonderful people who run the NC trading value guides, so if any page format changes I'll need to update it.
 * Currently for /~lebron [discord: https://discord.gg/KYvNMpawDn]
 * Previously this script was for /~owls and before that /~waka
 * 
 * NC trading value guides are a community resource that tracks the approximate value of NC items, based on real-world trades:
 *      GUIDES ARE ONLY GUIDES, NOT LAW.
 *      Guides are not updated 24/7 and values or obtainability may have shifted since the last update.
 *      Please be aware that values, rarity, and popularity of any NC item are essential to consider and are usually factors in one's 
 *          ability to find specific trades. Use your own discretion and make value check boards if you are unsure about items.
 *      Guides list the numerical values of items based on trade data reported by the community. They do not update subjectively and 
 *          cannot modify values without trade reports.
 *      Items without values lack values for differing reasons, including lack of data and recency of release. These items are NOT 
 *          uniform in value or rarity: some are low, high, common, or rare. If you need help with an item that does not have a value 
 *          listed, please make a value check board and/or check the neopets discord's NC trading channel or the lebron discord.
 *
 */

(function () {
    'use strict';
    const guide = 'lebron';
    console.log(`NC Trading Valuator - https://www.neopets.com/~${guide}`);

    let VALUES = GM_getValue("NEOPETS_NC_TRADING");
    VALUES = VALUES ? JSON.parse(VALUES) || {} : {};

    // Store & Fetch guide data
    if (document.URL.toLowerCase().includes(`~${guide}`)) {
        const sections = document.getElementsByClassName("content");
        let items, split, val;
        for (let s = 0; s < sections.length; s++) {
            items = sections[s].innerText.split('\n');
            for (let i = 0; i < items.length; i++) {
                split = items[i].split(' - (');
                if (split.length === 2) {
                    val = split[1].slice(0, -1);
                    val = val.includes('reset') ? 'Reset' : val.replace('Current Dyeable & Buyable', 'Dye & Buy');
                    VALUES[split[0]] = val;
                }
            }
        }
        GM_setValue("NEOPETS_NC_TRADING", JSON.stringify(VALUES));
        console.log(`${document.URL.split('~')[1]} values updated:`, VALUES);
    }
    else {
        if (Object.keys(VALUES).length) {
            createCSS();
            drawValues();
        } else {
            console.log(`Visit ${guide} to populate data: https://www.neopets.com/~${guide}`);
        }
    }

    /* DTI Functions */
    function observeItems(anchor, item, callback) {
        // Handle page rerendering without overdoing it
        let observerFlag = true;
        const check = () => {
            if (observerFlag) {
                if (document.querySelectorAll(item).length) {
                    observerFlag = false;
                    callback();
                    setTimeout(() => {
                        observerFlag = true;
                    }, 100);
                }
            }
        }
        const observer = new MutationObserver(check);
        const ele = document.querySelectorAll(anchor)[0];
        console.debug('>>>', ele);
        if (ele) {
            check();
            observer.observe(ele, { attributes: true, childList: true, subtree: true });
        }
    }
    function buildTag(itemName) {
        const value = VALUES[itemName] || '?';
        const outerDiv = document.createElement('li');
        outerDiv.classList.add('ncval');
        const innerDiv = document.createElement('div');
        innerDiv.textContent = value;
        outerDiv.appendChild(innerDiv);
        return outerDiv;
    }
    function renderTag(el, ncAnchor, nameAnchor, attachmentAnchor) {
        if (
            el.querySelectorAll(ncAnchor).length // is NC
            && !el.querySelectorAll('.ncval').length // already valued
        ) {
            const name = el.querySelectorAll(nameAnchor)[0].innerText;
            el.querySelectorAll(attachmentAnchor)[0].after(buildTag(name));
        }
    }

    /* Main Function */
    function drawValues() {
        // stealin this
        try {
            jQuery.fn.justtext = function () {
                return $(this).clone().children().remove().end().text();
            };
        } catch { }

        if (document.URL.includes("neopets.com/inventory")) {
            if ($('#navnewsdropdown__2020').length) {
                // Beta Inventory
                $(document).ajaxSuccess(function () {
                    $('.item-subname:contains("wearable"):contains("Neocash"):not(:contains("no trade"))').each(function (i, el) {
                        let $parent = $(el).parent();
                        if (!$parent.find('.ncval').length) {
                            const name = $parent.find('.item-name').text();
                            const value = VALUES[name] || '?';
                            $parent.children().eq(0).after(`<div class="ncval"><div>${value}</div></div>`);
                        }
                    });
                });
            } else {
                // Classic Inventory
                $('td.wearable:contains(Neocash)').each(function (i, el) {
                    const name = $(el).justtext();
                    const value = VALUES[name] || '?';
                    $(el).append(`<div class="ncval"><div>${value}</div></div>`);
                });
            }
        }

        // Closet
        else if (document.URL.includes("neopets.com/closet")) {
            $('td>b:contains("Artifact - 500")').each(function (i, el) {
                const name = $(el).justtext();
                const value = VALUES[name] || '?';
                $(el).parent().prev().append(`<div class="ncval"><div>${value}</div></div>`);
            });
        }

        // SDB
        else if (document.URL.includes("neopets.com/safetydeposit")) {
            $('tr[bgcolor="#DFEAF7"]:contains(Neocash)').each(function (i, el) {
                const name = $(el).find('b').first().justtext();
                const value = VALUES[name] || '?';
                $(el).children().eq(0).append(`<div class="ncval"><div>${value}</div></div>`);
            });
        }

        // Gallery
        else if (document.URL.includes("neopets.com/gallery")) {
            $('td>b.textcolor').each(function (i, el) {
                const name = $(el).text();
                const value = VALUES[name];
                if (value) $(el).before(`<div class="ncval"><div>${value}</div></div>`);
            });
        }

        // JNIDB
        else if (document.URL.includes("items.jellyneo.net")) {
            $('img.item-result-image.nc').each((i, el) => {
                const name = $(el).attr('title').split(' - r')[0];
                const value = VALUES[name] || '?';
                let $parent = $(el).parent();
                let $next = $parent.next();
                if ($next.is('br')) $next.remove();
                $parent.after(`<div class="ncval"><div>${value}</div></div>`);
            });
        }

        // JN Article
        else if (document.URL.includes("jellyneo.net")) {
            $('img[src*="/items/"]').each((i, el) => {
                const name = $(el).attr('title') || $(el).attr('alt');
                const value = VALUES[name];
                if (value) {
                    let $parent = $(el).parent();
                    let $next = $parent.next();
                    if ($next.is('br')) $next.remove();
                    $parent.after(`<div class="ncval"><div>${value}</div></div>`);
                }
            });
        }

        // Classic DTI User Profile
        else if (document.URL.includes("impress.openneo.net/user")) {
            $('img.nc-icon').each((i, el) => {
                let $parent = $(el).parent();
                if (!$parent.find('.ncval').length) {
                    const name = $parent.find('span.name').text();
                    const value = VALUES[name] || '?';
                    $parent.children().eq(0).after(`<div class="ncval"><div>${value}</div></div>`);
                }
            });
        }
        // Classic DTI Item
        else if (document.URL.includes("impress.openneo.net/items")) {
            if (document.querySelectorAll('abbr.item-kind[data-type="nc"]').length) {
                const name = document.getElementsByClassName("item-name")[0].innerText;
                document.getElementsByClassName("item-links")[0].prepend(buildTag(name));
            }
        }
        // 2020 DTI User Profile
        else if (document.URL.includes("impress-2020.openneo.net/user")) {
            observeItems('.css-pgxt5v', 'div.css-1y1yt1v', () => {
                document.querySelectorAll('div.css-1y1yt1v').forEach((el, i) => {
                    renderTag(el, '.css-e4lzyf', '.css-2v9k8q', '.css-j752ew');
                });
            });
        }
        // 2020 DTI Items
        else if (document.URL.includes("impress-2020.openneo.net/items")) {
            observeItems('.css-pgxt5v', '.css-1yp4ln, .css-1y1yt1v', () => {
                const profileItem = document.querySelectorAll('.css-1okhqwi')?.[0];
                if (profileItem) { // item profile
                    renderTag(profileItem, '.css-xez38', '.css-kl6jvz', '.css-1yp4ln');
                } else { // search results
                    document.querySelectorAll('.css-1y1yt1v').forEach((el, i) => {
                        renderTag(el, '.css-e4lzyf', '.css-2v9k8q', '.css-j752ew');
                    });
                }
            });
        }
        // Classic DTI Outfits
        else if (document.URL.includes("impress.openneo.net/outfits")) {
            observeItems('#wardrobe-2020-root', '.css-1fs231t', () => {
                document.querySelectorAll('.css-1fs231t').forEach((el, i) => {
                    renderTag(el, '.css-xez38', '.css-121v524', '.css-1yp4ln');
                });
            });
        }
        // 2020 DTI Outfits
        else if (document.URL.includes("impress-2020.openneo.net/outfits")) {
            observeItems('.css-19fyywa', '.css-1fs231t', () => {
                document.querySelectorAll('.css-1fs231t').forEach((el, i) => {
                    renderTag(el, '.css-xez38', '.css-1nacatu', '.css-1yp4ln');
                });
            });
        }
    }

    function createCSS() {
        var css = document.createElement("style");
        css.type = "text/css";
        css.innerHTML = `
            .ncval {
                display: flex;
                margin-top: 3px;
            }
            .ncval>div {
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
            .row p.text-center {
                margin-bottom: 0;
            }
            .css-lwgbrn {
                align-items: center;
            }
        `;
        document.body.appendChild(css);
    }
})();
