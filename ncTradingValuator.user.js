// ==UserScript==
// @name         NC Trading Valuator
// @version      2.0
// @description  Automatically label NC items with owls value. Visit ~/Owls and ~/OwlsTwo to refresh values.
// @author       friendly-trenchcoat
// @match        https://www.neopets.com/~Owls
// @match        https://www.neopets.com/~OwlsTwo
// @match        https://www.neopets.com/~owls
// @match        https://www.neopets.com/~owlstwo
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
 * This script is not associated with the wonderful people who run Owls, so if the page format changes I'll need to update it.
 * Previously this script was for /~waka
 * 
 * Owls is a community resource that tracks the approximate value of NC items, based on real-world trades:
 *      GUIDES ARE ONLY GUIDES, NOT LAW.
 *      /~Owls is not updated 24/7 and values or obtainability may have shifted since the last update.
 *      An item listed at 00 - 00 means we do not currently have enough data to assign a value.
 *      Please be aware that values, rarity, and popularity of any NC item are essential to consider and are usually factors in one's 
 *          ability to find specific trades. Use your own discretion and make value check boards if you are unsure about items.
 *      Owls lists the numerical values of items based on trade data reported by the community. We do not update subjectively and 
 *          cannot modify values without trade reports.
 *      Items without values lack values for differing reasons, including lack of data and recency of release. These items are NOT 
 *          uniform in value or rarity: some are low, high, common, or rare. If you need help with an item that does not have a value 
 *          listed, please make a value check board and/or contact a /~Owls team member.
 *
 */

(function () {
    'use strict';
    console.log('NC Trading Valuator');


    // Store & Fetch owls data
    if (document.URL.toLowerCase().includes("~owls")) {
        const items = document.getElementsByClassName("tooltip");
        const values = JSON.parse(GM_getValue("NEOPETS_NC_TRADING")) || {};
        let split;
        for (let i = 0; i < items.length; i++) {
            split = items[i].innerText.split(' ~ ');
            if (split.length === 2) {
                values[split[0]] = split[1];
            }
        }
        GM_setValue("NEOPETS_NC_TRADING", JSON.stringify(values));
        console.log(`${document.URL.split('~')[1]} values updated:`, values);
    }
    else {
        var OWLS = JSON.parse(GM_getValue("NEOPETS_NC_TRADING"));
        if (OWLS) {
            createCSS();
            drawValues(OWLS);
        } else {
            console.log('Visit owls to populate data: https://www.neopets.com/~Owls https://www.neopets.com/~OwlsTwo');
        }
    }

    function drawValues(OWLS) {
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
                        if (!$parent.find('.owls').length) {
                            const name = $parent.find('.item-name').text();
                            const value = OWLS[name] || '?';
                            $parent.children().eq(0).after(`<div class="owls"><div>${value}</div></div>`);
                        }
                    });
                });
            } else {
                // Classic Inventory
                $('td.wearable:contains(Neocash)').each(function (i, el) {
                    const name = $(el).justtext();
                    const value = OWLS[name] || '?';
                    $(el).append(`<div class="owls"><div>${value}</div></div>`);
                });
            }
        }

        // Closet
        else if (document.URL.includes("neopets.com/closet")) {
            $('td>b:contains("Artifact - 500")').each(function (i, el) {
                const name = $(el).justtext();
                const value = OWLS[name] || '?';
                $(el).parent().prev().append(`<div class="owls"><div>${value}</div></div>`);
            });
        }

        // SDB
        else if (document.URL.includes("neopets.com/safetydeposit")) {
            $('tr[bgcolor="#DFEAF7"]:contains(Neocash)').each(function (i, el) {
                const name = $(el).find('b').first().justtext();
                const value = OWLS[name] || '?';
                $(el).children().eq(0).append(`<div class="owls"><div>${value}</div></div>`);
            });
        }

        // Gallery
        else if (document.URL.includes("neopets.com/gallery")) {
            $('td>b.textcolor').each(function (i, el) {
                const name = $(el).text();
                const value = OWLS[name];
                if (value) $(el).before(`<div class="owls"><div>${value}</div></div>`);
            });
        }

        // JNIDB
        else if (document.URL.includes("items.jellyneo.net")) {
            $('img.item-result-image.nc').each((i, el) => {
                const name = $(el).attr('title').split(' - r')[0];
                const value = OWLS[name] || '?';
                let $parent = $(el).parent();
                let $next = $parent.next();
                if ($next.is('br')) $next.remove();
                $parent.after(`<div class="owls"><div>${value}</div></div>`);
            });
        }

        // JN Article
        else if (document.URL.includes("www.jellyneo.net")) {
            $('img[src*="/items/"]').each((i, el) => {
                const name = $(el).attr('title') || $(el).attr('alt');
                const value = OWLS[name];
                if (value) {
                    let $parent = $(el).parent();
                    let $next = $parent.next();
                    if ($next.is('br')) $next.remove();
                    $parent.after(`<div class="owls"><div>${value}</div></div>`);
                }
            });
        }

        // Classic DTI Customize
        else if (document.URL.includes("impress.openneo.net/wardrobe")) {
            $(document).ajaxSuccess(function (event, xhr, options) {
                if (options.url.includes('/items')) {
                    $('img.nc-icon').each((i, el) => {
                        let $parent = $(el).parent();
                        if (!$parent.find('.owls').length) {
                            const name = $parent.text().match(/ (\S.*)  i /)[1];
                            const value = OWLS[name] || '?';
                            $parent.children().eq(0).after(`<div class="owls"><div>${value}</div></div>`);
                        }
                    });
                }
            });
        }
        // Classic DTI User Profile
        else if (document.URL.includes("impress.openneo.net/user/")) {
            $('img.nc-icon').each((i, el) => {
                let $parent = $(el).parent();
                if (!$parent.find('.owls').length) {
                    const name = $parent.find('span.name').text();
                    const value = OWLS[name] || '?';
                    $parent.children().eq(0).after(`<div class="owls"><div>${value}</div></div>`);
                }
            });
        }
        // Classic DTI Item
        else if (document.URL.includes("impress.openneo.net/items")) {
            if (document.querySelectorAll('img.nc-icon').length) {
                const name = document.getElementById("item-name").innerText;
                const value = OWLS[name] || '?';
                const outerDiv = document.createElement('div');
                outerDiv.classList.add('owls');
                const innerDiv = document.createElement('div');
                innerDiv.textContent = value;
                outerDiv.appendChild(innerDiv)
                document.getElementById("item-name").after(outerDiv);
            }

            const a = document.createElement('a');
            a.href = `https://impress-2020.openneo.net/items/${document.URL.split('/').pop()}`;
            a.target = '_blank';
            a.textContent = 'DTI 2020';
            document.querySelector('header#item-header').querySelector('div').appendChild(a);

        }
        // 2020 DTI Dress Up
        else if (document.URL.includes("2020.openneo.net/outfits")) {
            const renderBadges = (results) => {
                if (results.length) {
                    let badge_els;
                    results.forEach((el, i) => {
                        badge_els = el.nextElementSibling.querySelectorAll('ul > li');
                        if (badge_els.length > 1 && badge_els[0].textContent.includes('NC') && !badge_els[1].classList.contains('owls')) {
                            const name = el.textContent || el.innerText;
                            const value = OWLS[name] || '?';
                            const outerDiv = document.createElement('li');
                            outerDiv.classList.add('owls');
                            const innerDiv = document.createElement('div');
                            innerDiv.textContent = value;
                            outerDiv.appendChild(innerDiv)
                            el.nextElementSibling.querySelector('ul > li').after(outerDiv);
                        }
                    });
                }
            }

            // Initial render
            let results;
            const wait = setInterval(function () {
                results = document.querySelectorAll('.item-container > div > div > div + div > div:first-child');
                if (results.length) {
                    clearInterval(wait);
                    renderBadges(results);
                }
            }, 500);

            let observerTimer;
            let observerFlag = true;
            const observer = new MutationObserver((mutationsList, observer) => {
                if (observerFlag) {
                    observerFlag = false;
                    const results = document.querySelectorAll('.item-container > div > div > div + div > div:first-child');
                    renderBadges(results);
                    observerTimer = setTimeout(() => {
                        observerFlag = true;
                    }, 1000);
                }
            });
            // Configure and start the observer
            const config = { childList: true, subtree: true };
            observer.observe(document.querySelector('.css-1g4yje1'), config);
        }
    }

    function createCSS() {
        var css = document.createElement("style");
        css.type = "text/css";
        css.innerHTML = `
            .owls {
                display: flex;
            }
            .owls>div {
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
