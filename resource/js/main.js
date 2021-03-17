var app = new Vue({
    el: '#app',
    data: {
        CpList: [],
        CpTable: [],
        loadFileData: {},
        page_loadFile: true,
        page_CpList: false,
        btnLoad_isDisabled: false,
        page_CpList_loader: false,

        sort: 1,
    },
    computed: {
        getCpList() {
            return Object.keys(this.CpList);
        },
        geTable() {
            let table = [];
            Object.keys(this.CpList).forEach(element => {
                let temp = [element, this.CpList[element].status, this.CpList[element].CE.length, this.CpList[element].CE_Error.length];
                table.push(temp);
            });
            return table;
        },
    },
    methods: {
        SorteTable(sorted) { //al posto di ataddare il SORT si potrebbe prima convertire CpList in un array, cosi da filtrare in pase al index della colona

            if (Math.abs(sorted) == this.sort) {
                this.CpTable = this.CpTable.reverse();
                this.sort *= -1;
                return;
            }

            this.CpTable = this.CpTable.sort(function (a, b) {
                    var A = a[Math.abs(sorted) - 1];
                    var B = b[Math.abs(sorted) - 1];
                    if (A < B) {
                        return -1;
                    }
                    if (A > B) {
                        return 1;
                    }

                    // names must be equal
                    return 0;
                });

            this.sort = sorted;
        },
        // diff between just two arrays:
        arrayDiff(a, b) {
            var arrays = Array.prototype.slice.call(arguments);
            var diff = [];

            arrays.forEach(function (arr, i) {
                var other = i === 1 ? a : b;
                arr.forEach(function (x) {
                    if (other.indexOf(x) === -1) {
                        diff.push(x);
                    }
                });
            })

            return diff;
        },
        /*
        let loadGeCoCP = [];
        function LoadFileCP() {
            var input = document.querySelector("#inputGeCo");

            var reader = new FileReader();
            reader.onload = function () {
                var text = reader.result;
                loadGeCoCP = text.split("\n");

                for (let i = 0; i < loadGeCoCP.length; i++) {
                    loadGeCoCP[i] = loadGeCoCP[i].replace(/\s/g,'');        
                }

                let nameCP = loadGeCoCP[0].replace(/\s/g,'');
                console.log( arrayDiff(loadGeCoCP, saveListCP[nameCP].CE) );
            };
            reader.readAsText(input.files[0]);
        }
        */
        loadFile(selectedFile) {
            if (selectedFile && window.Worker) {

                this.page_CpList_loader = true;
                this.btnLoad_isDisabled = true;
                const worker = new Worker('resource/js/worker.js'); //https://dog.ceo/dog-api/
                worker.postMessage(selectedFile);
                worker.onmessage = (e) => {

                    this.loadFileData = e.data; //uso worker.js per ricevere già JSON dal file EXCEL, problema consite nel riceve due volte, visto che ci sono pagine diverse(si potrebbe valuitare di utlizare un foglio per un contratto).
                    this.CpList = [];

                    this.loadFileData.forEach(row => {
                        if (this.CpList[row.CASARSID] == undefined) {
                            this.CpList[row.CASARSID] = {
                                status: "OK",
                                CE: [],
                                CE_Error: [],
                            };
                        }

                        if (row.CEID_ASSEGNATO_IMPRESA == "NO") {
                            this.CpList[row.CASARSID].status = "KO";
                            this.CpList[row.CASARSID].CE_Error.push(row.CEID);
                        }

                        this.CpList[row.CASARSID].CE.push(row.CEID);
                    });

                    this.CpTable = [];
                    Object.keys(this.CpList).forEach(element => {
                        this.CpTable.push([element, this.CpList[element].status, this.CpList[element].CE.length, this.CpList[element].CE_Error.length]);
                    });

                    this.page_CpList_loader = false;
                    this.page_loadFile = false;
                    this.page_CpList = true;
                    this.btnLoad_isDisabled = false;

                    worker.terminate();
                }
            }
        },
        backLCList() {
            this.page_loadFile = true;
            this.page_CpList = false;
        },
    }
});