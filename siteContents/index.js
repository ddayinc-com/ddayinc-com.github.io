// the JS for a nice interactive "static" page

// add a date formatter helper for JSRender
$.views.helpers("formatDateString", (val) =>
    {return (new Date(val)).toLocaleDateString("en-GB", {timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'short', day: '2-digit'});}
);
// the character used in the hash/anchor string to delimit from the anchor name and the "query string"-like params also specified
var strAnchorHashQSDelimiter = ":";
// keys that are expected/supported via query string in location.hash value for the page, along with the corresponding property in the Records Info objects; for later checking if/how to filter
var oSupportedHashQSKeys_Records = {"number": "RecordNumber", "who": "ChallengerID"};

var dPageHandler = function() {
    // remove focus from <anything that has it>, so as to essentially "reset" nav bar if that's what got us here
    document.activeElement?.blur && document.activeElement.blur();
    // get a couple of vars: just the hash (if any) with no query string, and the query string portion of the hash, if any
    var [strTrimmedHash, strQSFromHash] = location.hash.replace(/^#/, '').split(strAnchorHashQSDelimiter);
    switch (strTrimmedHash.toLowerCase()) {
        case 'records':
            // the template for Record Details
            var tmpl = $.templates({
                markup: "#recordDetailTmp",
                allowCode: true
            });
            // get a URLSearchParms object for easy interaction with query string items from location.hash value
            const oUrlSearchParams = new URLSearchParams(strQSFromHash);
            // make an object whose properties will be used to filter the records data
            var oInfoForFilter = {};

            // if there is a query in the URL and at least of of the keys is in property names of the object of expected/supported keys, use it
            if (strQSFromHash && Object.keys(oSupportedHashQSKeys_Records).some(strThisExpectedKey => oUrlSearchParams.has(strThisExpectedKey))) {
                // console.log("yup, there's a QString w expected key!")
                // for each of the URLSearchParam key/value pairs, if the key is an expected/supported property, add a property/value to the filter info object
                oUrlSearchParams.forEach((oQSValue, strQSKey) => {
                    if (Object.hasOwn(oSupportedHashQSKeys_Records, strQSKey)) {oInfoForFilter[oSupportedHashQSKeys_Records[strQSKey]] = oQSValue};
                });
            }
            else {
                // console.log("nerp, there's no QString, or it doesn't have expected key")
                // the default filter for the records data
                oInfoForFilter.IsPreviousValue = 0;
            }

            $.getJSON("data/recordsInfo.json").done(
                (arrInfoFromJSON) => {
                    // var arrToUse = arrInfoFromJSON.filter(filterFunction);
                    const arrToUse = arrInfoFromJSON.filter(oThisItem =>
                        // for every property/value pair from the filter object, use them to filter this info item
                        Object.entries(oInfoForFilter).every(([filterKey, filterValue]) => oThisItem[filterKey] == filterValue)
                    );
                    // sort by RecordDate (desc), then by ChallengerName; from https://www.benmvp.com/blog/quick-way-sort-javascript-array-multiple-fields/
                    arrToUse.sort((obj0, obj1) => Date.parse(obj1.RecordDate) - Date.parse(obj0.RecordDate) || obj0.ChallengerName.localeCompare(obj1.ChallengerName))
                    // console.log(arrInfoFromJSON);
                    $("#result").html( tmpl.render(arrToUse, true) );
                }
            );
            break;
        case 'challengers':
            $("#result").html($.templates("#challengerSummaryTable").render()).ready(function () {
                var someTable = $('#challengerSummary').DataTable({
                    ajax: {
                        url: 'data/challengerSummaryInfo.json',
                        // expect array of objects at top level (no "parent" property from which to get objects)
                        dataSrc: ""
                    },
                    columns: [
                        {
                            // make ChallengerName link; needs whole "row" so as to use ChallengerName and ChallengerID properties from the "full data source object"; ref: https://datatables.net/reference/option/columns.render
                            data: "ChallengerName",
                            render: function (data, type, row) {
                                if (row.ChallengerID != undefined) {return "<a title='Show all challenges for " + data + "' href='#Records" + strAnchorHashQSDelimiter + "who=" + row.ChallengerID + "'>" + data + "</a>";}
                                else {return data}
                            }
                        },
                        {data: "NumChallenges"},
                        {data: "NumCurrentRecords"},
                        {data: "NumPrevRecords"},
                        {data: "NumDNAG"},
                        {data: "NumTies"},
                        {data: "NumFailures"},
                    ],
                    fixedHeader: {header: false, footer: true},
                    paging: false,
                    responsive: true,
                    language: {
                        // what to put in the search box by default
                        searchPlaceholder: "",
                        search: "Filter:",
                    },
                    // from https://write.corbpie.com/highlight-max-and-min-column-with-datatables/
                    initComplete: function () {
                        let api = this.api();
                        api.columns(":not(:first)").every(function () {
                            let col = this.index();
                            let data = this.data()
                                .unique()
                                .map(function (value) {
                                    return parseInt(value);
                                })
                                .toArray()
                                .sort(function (a, b) {
                                    return b - a;
                                });
                            let length = data.length;
                            api.cells(null, col).every(function () {
                                let cell = parseInt(this.data());
                                // set style of max value
                                if (cell === data[0]) {
                                    $(this.node()).addClass("maxValueForChallengers").addClass("roundieCorners");
                                }
                                // set style of min value
                                // else if (cell === data[length - 1]) {
                                //     $(this.node()).css("background-color", "rgba(255, 85, 85, 0.32)");
                                // }
                            });
                        });
                        // set focus to the search/filter intput textbox
                        $('div.dataTables_filter input').focus();
                    }
                });
            });
            break;
        // show the Challenge rules
        case 'rules':
            //  what Markdown file to render
            var strMDFileRelativePath = './challengeRules.md'
            // break; // not breaking, but falling through to default!

        // default: hash (anchor) for location not specified, or was not one of the expected values
        default:
            // if some other case defined a Markdown file relative path, use it; else, default to something
            var strMDFileToRenderRelativePath = typeof strMDFileRelativePath !== 'undefined' ? strMDFileRelativePath : 'index.md';
            // then, get that Markdown and create some HTML
            $.get({url: strMDFileToRenderRelativePath, dataType: 'text'}).done(
                (strSomeMDContent) => {
                // makeHTML from the string, and set the given element's HTML property value; requires showdown.js
                $("#result").html( '<div class="markdown-body">' + (new showdown.Converter({tables: true}).makeHtml(strSomeMDContent)) + '</div>');
            });

            // $("#result").html("home");
            break;
    } // end switch
}
// when the doc is ready, run the page handler!
$(document).ready(dPageHandler);
// also, register an event listener so that onhashchange, the page handler is run again
window.addEventListener('hashchange', dPageHandler);