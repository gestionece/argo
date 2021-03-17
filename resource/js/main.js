var app = new Vue({
    el: '#app',
    data: {
        CpList: [],
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
    },
    methods: {
        SorteTable(sorted) {
            if (Math.abs(sorted) == this.sort) {
                this.CpList = Object.fromEntries(Object.entries(this.CpList).reverse());
                this.sort *= -1;
                return;
            }

            switch (Math.abs(sorted)) {
                case 1:
                    this.CpList = Object.fromEntries(
                        Object.entries(this.CpList).sort(function (a, b) {
                            var A = a[0];
                            var B = b[0];
                            if (A < B) {
                                return -1;
                            }
                            if (A > B) {
                                return 1;
                            }

                            // names must be equal
                            return 0;
                        }));

                    this.sort = sorted;
                    break;

                case 2:
                    this.CpList = Object.fromEntries(
                        Object.entries(this.CpList).sort(function (a, b) {
                            var A = Object.entries(a[1].status);
                            var B = Object.entries(b[1].status);
                            if (A < B) {
                                return -1;
                            }
                            if (A > B) {
                                return 1;
                            }
                            // names must be equal
                            return 0;
                        }));

                    this.sort = sorted;
                    break;

                case 3:
                    this.CpList = Object.fromEntries(
                        Object.entries(this.CpList).sort((a, b) => a[1].CE.length - b[1].CE.length));

                    this.sort = sorted;
                    break;

                case 4:
                    this.CpList = Object.fromEntries(
                        Object.entries(this.CpList).sort((a, b) => a[1].CE_Error.length - b[1].CE_Error.length));

                    this.sort = sorted;
                    break;

                default:
                    break;
            }
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

                    console.log(this.CpList);
                    console.log(Object.keys(this.CpList));

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