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
        modal_show_data: false,
        modal_CP: "",
        modal_CE: [],
        modal_link: true,

        sort: 1,
    },
    computed: {
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
        CheckErrorCE(CE) {
            if (this.modal_link == false) {
                return false;
            } else {
                return this.CpList[this.modal_CP].CE_Error.find(element => element == CE)
            }
        },
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
        openDataGeco(cp, ce, link) {
            this.modal_CP = cp;
            this.modal_CE = ce;
            this.modal_link = link;
            this.modal_show_data = true;
        },
        openConfrGeco(cp, result) {
            if (this.CpList[cp].Result == false) {
                this.openDataGeco("Sono identici", [], false);
            } else {
                this.modal_link = true;
                this.modal_CP = cp;
                this.modal_CE = result;
                this.modal_show_data = true;
            }
        },
        loadFileGeCo(selectedFile) {
            let CPs = [];
            var reader = new FileReader();
            let readFile = (index) => {
                if (index >= selectedFile.length) return;
                var file = selectedFile[index];
                reader.onload = (e) => {
                    let multiple = false;
                    if (selectedFile.length > 1) {
                        multiple = true;
                    }
                    this.confrontCE(e.target.result, multiple)
                    CPs.push(selectedFile[index].name);

                    readFile(index + 1);
                }
                reader.readAsText(file);
            }
            readFile(0);

            this.openDataGeco("Load File", CPs, false);
        },
        confrontCE(text, multiple) { //https://github.com/metafloor/bwip-js/wiki/Online-Barcode-API 
            loadGeCoCP = text.split("\n");

            for (let i = 0; i < loadGeCoCP.length; i++) {
                loadGeCoCP[i] = loadGeCoCP[i].replace(/\s/g, '');
            }

            let nameCp = loadGeCoCP[0];
            loadGeCoCP.shift();

            let diff = this.arrayDiff(loadGeCoCP, this.CpList[nameCp].CE);

            /*diff = diff.filter(item => !this.CpList[nameCp].CE_Error.includes(item));
            console.log(diff); remove CE presenti nella lista CE_Error
            */

            for (let i = 0; i < this.CpTable.length; i++) {
                if (this.CpTable[i][0] == nameCp) {
                    this.CpTable[i][4] = true;
                }
            }

            if (diff.length > 0) {
                this.CpList[nameCp].Result = diff;
                if (multiple == false) {
                    this.openDataGeco(nameCp, diff, true);
                }
            } else {
                this.CpList[nameCp].Result = false;
                if (multiple == false) {
                    this.openDataGeco("Sono identici", [], false);
                }
            }
        },
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
                                Result: [],
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
                        this.CpTable.push([element, this.CpList[element].status, this.CpList[element].CE.length, this.CpList[element].CE_Error.length, false]);
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