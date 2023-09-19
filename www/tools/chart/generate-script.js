const check = require('../module/check');

exports.createContentScriptListView = (collectionName, collectionDescription, pathSave, folderName, arrChart) => {
    const NAME_COLL_LOWERCASE 		= collectionName.toLowerCase();
    const NAME_COLL_UPPERCASE 		= collectionName.toUpperCase();
    const NAME_COLL_CAPITALIZE 		= collectionName.toCapitalize();
    const FIELD_ID            		= `${NAME_COLL_LOWERCASE}ID`;
    const NAME_COLL                 = collectionName;
    let ajaxInfoChart = ``;
    arrChart.map(chart => {
        switch (chart.data_source) {
            case 'SIMPLE':
                switch (chart.TYPE_NAME) {
                    case 'LEADERBOARD':
                        let listLabel = '';
                        chart.conditionDataSource.label.map(item => {
                            listLabel += `{ "data": "${item}" },`;
                        });

                        ajaxInfoChart += `
                            $('#tableList${chart.name.toCapitalize()}').DataTable({
                                'iDisplayLength': ${Number(chart.conditionDataSource.limit)},
                                "aaSorting": [],
                                ...languageDataTable,
                                "ordering": false,
                                "paging": false,
                                "searching": false,
                                "processing": true,
                                "serverSide": true,
                                "ajax": {
                                    "type": "POST",
                                    "url": '/admin/info-chart?name=${chart.name}',
                                    "dataType": "json",
                                    data: d => {
                                        return d;
                                    }
                                },
                                "columns": [
                                    { "data": "index", "width": "5%" },
                                    ${listLabel}
                                    { "data": "total" }
                                ],
                            });
                        `;
                        break;
                    case 'TIME_BASED':
                        ajaxInfoChart += `
                            $.ajax({
                                url: '/admin/info-chart?name=${chart.name}',
                                method: 'POST',
                                data: {},
                                success: resp => {
                                    console.log({
                                        resp
                                    });
                                    if (!resp.error) {
                                        let { infoChart, data: dataOfChart } = resp;
                                        let data       = [];
                                        let categories = [];
                        `;
                        if (!chart.format_chart) {
                            chart.format_chart = "AREA"; // MẶC ĐỊNH CỦA CHART TIME_BASED LÀ AREA
                        }

                        let typeDataOfView = "item.sum";
                        if (chart.conditionDataSource.view == "COUNT") {
                            typeDataOfView = "item.count";
                        } 

                        switch (chart.format_chart) {
                            case "AREA":
                                ajaxInfoChart += `
                                    dataOfChart && dataOfChart.length && dataOfChart.map(item => {
                                        data = [
                                            ...data,
                                            ${typeDataOfView}
                                        ];
                
                                        let stringDateParse = item._id.year.toString();
                                        switch (infoChart.data_source_obj.timeframe) {
                                            case 'DAY':
                                                stringDateParse += "-" + item._id.month + "-" + item._id.day;
                                                break;
                                            case 'WEEK':
                                                
                                                break;
                                            case 'MONTH':
                                                stringDateParse += "-" + item._id.month;
                                                break;
                                            default:
                                                break;
                                        }
                                        let dateParse = moment(new Date(stringDateParse)).format();
                                        categories = [
                                            ...categories,
                                            dateParse
                                        ];
                                    });
                                    
                                    var options = {
                                            series: [{
                                            name: infoChart.description,
                                            data: data
                                        }
                                        // , {
                                        // 	name: 'series2',
                                        // 	data: [11, 32, 45, 32, 34, 52, 41]
                                        // 	}
                                        ],
                                            chart: {
                                            height: 350,
                                            type: 'area'
                                        },
                                        dataLabels: {
                                            enabled: false
                                        },
                                        stroke: {
                                            curve: 'smooth'
                                        },
                                        xaxis: {
                                            type: 'datetime',
                                            categories,
                                        },
                                        tooltip: {
                                            x: {
                                                format: 'dd/MM/yy HH:mm'
                                            },
                                        },
                                    };
                                `;
                                break;
                            case "COLUMN":
                                ajaxInfoChart += `
                                    dataOfChart && dataOfChart.length && dataOfChart.map(item => {
                                        data = [
                                            ...data,
                                            ${typeDataOfView}
                                        ];
                
                                        let stringDateParse = item._id.year.toString();
                                        switch (infoChart.data_source_obj.timeframe) {
                                            case 'DAY':
                                                stringDateParse += "-" + item._id.month + "-" + item._id.day;
                                                break;
                                            case 'WEEK':
                                                
                                                break;
                                            case 'MONTH':
                                                stringDateParse += "-" + item._id.month;
                                                break;
                                            default:
                                                break;
                                        }
                                        let dateParse = moment(new Date(stringDateParse)).format('DD/MM/YYYY');
                                        categories = [
                                            ...categories,
                                            dateParse
                                        ];
                                    });
                                    var options = {
                                        series: [{
                                        name: infoChart.description,
                                        data: data
                                    }, 
                                    // {
                                    // 	name: 'Revenue',
                                    // 	data: [76, 85, 101, 98, 87, 105, 91, 114, 94]
                                    // }, {
                                    // 	name: 'Free Cash Flow',
                                    // 	data: [35, 41, 36, 26, 45, 48, 52, 53, 41]
                                    // }
                                    ],
                                        chart: {
                                        type: 'bar',
                                        height: 350
                                    },
                                        plotOptions: {
                                        bar: {
                                            horizontal: false,
                                            columnWidth: '55%',
                                            endingShape: 'rounded'
                                        },
                                    },
                                        dataLabels: {
                                        enabled: false
                                    },
                                        stroke: {
                                        show: true,
                                        width: 2,
                                        colors: ['transparent']
                                    },
                                        xaxis: {
                                        categories
                                        // categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
                                    },
                                        yaxis: {
                                        title: {
                                            text: 'Đơn vị tính'
                                        }
                                    },
                                        fill: {
                                        opacity: 1
                                    },
                                        tooltip: {
                                            y: {
                                                formatter: function (val) {
                                                    // return "$ " + val + " thousands"
                                                    return val;
                                                }
                                            }
                                        }
                                    };
                                `;
                                break;
                            case "LINE":
                                ajaxInfoChart += `
                                    let title = '';
                                    dataOfChart && dataOfChart.length && dataOfChart.map(item => {
                                        data = [
                                            ...data,
                                            ${typeDataOfView}
                                        ];
                
                                        let stringDateParse = item._id.year.toString();
                                        switch (infoChart.data_source_obj.timeframe) {
                                            case 'DAY':
                                                title = 'Thống kê theo ngày';
                                                stringDateParse += "-" + item._id.month + "-" + item._id.day;
                                                break;
                                            case 'WEEK':
                                                title = 'Thống kê theo tuần';
                                                break;
                                            case 'MONTH':
                                                title = 'Thống kê theo tháng';
                                                stringDateParse += "-" + item._id.month;
                                                break;
                                            default:
                                                break;
                                        }
                                        let dateParse = moment(new Date(stringDateParse)).format('DD/MM/YYYY');
                                        categories = [
                                            ...categories,
                                            dateParse
                                        ];
                                    });
                                    var options = {
                                        series: [{
                                            name: infoChart.description,
                                            data,
                                        }],	
                                        chart: {
                                            height: 350,
                                            type: 'line',
                                            zoom: {
                                                enabled: false
                                            }
                                        },
                                        dataLabels: {
                                            enabled: false
                                        },
                                        stroke: {
                                            curve: 'straight'
                                        },
                                        title: {
                                            text: title,
                                            align: 'left'
                                        },
                                        grid: {
                                            row: {
                                                colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
                                                opacity: 0.5
                                            },
                                        },
                                        xaxis: {
                                            categories,
                                        }
                                    };
                                `;
                                break;
                            default:
                                break;
                        }

                        ajaxInfoChart += `
                                        var chart = new ApexCharts(document.querySelector("#chart${chart.name.toCapitalize()}"), options);
                                        chart.render();
                                    }
                                }
                            });
                        `;
                        break;
                    default:
                        break;
                }
                break;
            case 'QUERY':
                switch (chart.TYPE_NAME) {
                    case 'LEADERBOARD':
                        let listLabel = '';
                        chart.conditionDataSource.label.map(item => {
                            listLabel += `{ "data": "${item}" },`;
                        });

                        ajaxInfoChart += `
                            $('#tableList${chart.name.toCapitalize()}').DataTable({
                                'iDisplayLength': ${Number(chart.conditionDataSource.limit)},
                                "aaSorting": [],
                                ...languageDataTable,
                                "ordering": false,
                                "paging": false,
                                "searching": false,
                                "processing": true,
                                "serverSide": true,
                                "ajax": {
                                    "type": "POST",
                                    "url": '/admin/info-chart?name=${chart.name}',
                                    "dataType": "json",
                                    data: d => {
                                        return d;
                                    }
                                },
                                "columns": [
                                    { "data": "index", "width": "5%" },
                                    ${listLabel}
                                    { "data": "total" }
                                ],
                            });
                        `;
                    break;
                    case 'TIME_BASED':
                        ajaxInfoChart += `
                            $.ajax({
                                url: '/admin/info-chart?name=${chart.name}',
                                method: 'POST',
                                data: {},
                                success: resp => {
                                    console.log({
                                        resp
                                    });
                                    if (!resp.error) {
                                        let { infoChart, data: dataOfChart } = resp;
                                        let data       = [];
                                        let categories = [];
                        `;
                        if (!chart.format_chart) {
                            chart.format_chart = "AREA"; // MẶC ĐỊNH CỦA CHART TIME_BASED LÀ AREA
                        }

                        let typeDataOfView = "item.sum";
                        if (chart.conditionDataSource.view == "COUNT") {
                            typeDataOfView = "item.count";
                        } 

                        switch (chart.format_chart) {
                            case "AREA":
                                ajaxInfoChart += `
                                    dataOfChart && dataOfChart.length && dataOfChart.map(item => {
                                        if (item.count) {
                                            data = [
                                                ...data,
                                                item.count
                                            ];
                                        } else {
                                            data = [
                                                ...data,
                                                item.sum
                                            ];
                                        }
                
                                        let stringDateParse = item._id.year.toString();
                                        switch (infoChart.data_source_obj.timeframe) {
                                            case 'DAY':
                                                stringDateParse += "-" + item._id.month + "-" + item._id.day;
                                                break;
                                            case 'WEEK':
                                                
                                                break;
                                            case 'MONTH':
                                                stringDateParse += "-" + item._id.month;
                                                break;
                                            default:
                                                break;
                                        }
                                        let dateParse = moment(new Date(stringDateParse)).format();
                                        categories = [
                                            ...categories,
                                            dateParse
                                        ];
                                    });
                                    
                                    var options = {
                                            series: [{
                                            name: infoChart.description,
                                            data: data
                                        }
                                        // , {
                                        // 	name: 'series2',
                                        // 	data: [11, 32, 45, 32, 34, 52, 41]
                                        // 	}
                                        ],
                                            chart: {
                                            height: 350,
                                            type: 'area'
                                        },
                                        dataLabels: {
                                            enabled: false
                                        },
                                        stroke: {
                                            curve: 'smooth'
                                        },
                                        xaxis: {
                                            type: 'datetime',
                                            categories,
                                        },
                                        tooltip: {
                                            x: {
                                                format: 'dd/MM/yy HH:mm'
                                            },
                                        },
                                    };
                                `;
                                break;
                            case "COLUMN":
                                ajaxInfoChart += `
                                    dataOfChart && dataOfChart.length && dataOfChart.map(item => {
                                        if (item.count) {
                                            data = [
                                                ...data,
                                                item.count
                                            ];
                                        } else {
                                            data = [
                                                ...data,
                                                item.sum
                                            ];
                                        }
                
                                        let stringDateParse = item._id.year.toString();
                                        switch (infoChart.data_source_obj.timeframe) {
                                            case 'DAY':
                                                stringDateParse += "-" + item._id.month + "-" + item._id.day;
                                                break;
                                            case 'WEEK':
                                                
                                                break;
                                            case 'MONTH':
                                                stringDateParse += "-" + item._id.month;
                                                break;
                                            default:
                                                break;
                                        }
                                        let dateParse = moment(new Date(stringDateParse)).format('DD/MM/YYYY');
                                        categories = [
                                            ...categories,
                                            dateParse
                                        ];
                                    });
                                    var options = {
                                        series: [{
                                        name: infoChart.description,
                                        data: data
                                    }, 
                                    // {
                                    // 	name: 'Revenue',
                                    // 	data: [76, 85, 101, 98, 87, 105, 91, 114, 94]
                                    // }, {
                                    // 	name: 'Free Cash Flow',
                                    // 	data: [35, 41, 36, 26, 45, 48, 52, 53, 41]
                                    // }
                                    ],
                                        chart: {
                                        type: 'bar',
                                        height: 350
                                    },
                                        plotOptions: {
                                        bar: {
                                            horizontal: false,
                                            columnWidth: '55%',
                                            endingShape: 'rounded'
                                        },
                                    },
                                        dataLabels: {
                                        enabled: false
                                    },
                                        stroke: {
                                        show: true,
                                        width: 2,
                                        colors: ['transparent']
                                    },
                                        xaxis: {
                                        categories
                                        // categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
                                    },
                                        yaxis: {
                                        title: {
                                            text: 'Đơn vị tính'
                                        }
                                    },
                                        fill: {
                                        opacity: 1
                                    },
                                        tooltip: {
                                            y: {
                                                formatter: function (val) {
                                                    // return "$ " + val + " thousands"
                                                    return val;
                                                }
                                            }
                                        }
                                    };
                                `;
                                break;
                            case "LINE":
                                ajaxInfoChart += `
                                    let title = '';
                                    dataOfChart && dataOfChart.length && dataOfChart.map(item => {
                                        if (item.count) {
                                            data = [
                                                ...data,
                                                item.count
                                            ];
                                        } else {
                                            data = [
                                                ...data,
                                                item.sum
                                            ];
                                        }
                
                                        let stringDateParse = item._id.year.toString();
                                        switch (infoChart.data_source_obj.timeframe) {
                                            case 'DAY':
                                                title = 'Thống kê theo ngày';
                                                stringDateParse += "-" + item._id.month + "-" + item._id.day;
                                                break;
                                            case 'WEEK':
                                                title = 'Thống kê theo tuần';
                                                break;
                                            case 'MONTH':
                                                title = 'Thống kê theo tháng';
                                                stringDateParse += "-" + item._id.month;
                                                break;
                                            default:
                                                break;
                                        }
                                        let dateParse = moment(new Date(stringDateParse)).format('DD/MM/YYYY');
                                        categories = [
                                            ...categories,
                                            dateParse
                                        ];
                                    });
                                    var options = {
                                        series: [{
                                            name: infoChart.description,
                                            data,
                                        }],	
                                        chart: {
                                            height: 350,
                                            type: 'line',
                                            zoom: {
                                                enabled: false
                                            }
                                        },
                                        dataLabels: {
                                            enabled: false
                                        },
                                        stroke: {
                                            curve: 'straight'
                                        },
                                        title: {
                                            text: title,
                                            align: 'left'
                                        },
                                        grid: {
                                            row: {
                                                colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
                                                opacity: 0.5
                                            },
                                        },
                                        xaxis: {
                                            categories,
                                        }
                                    };
                                `;
                                break;
                            default:
                                break;
                        }

                        ajaxInfoChart += `
                                        var chart = new ApexCharts(document.querySelector("#chart${chart.name.toCapitalize()}"), options);
                                        chart.render();
                                    }
                                }
                            });
                        `;
                        break;
                    default:
                        break;
                }  
                break;
            case 'API':
                switch (chart.TYPE_NAME) {
                    case 'LEADERBOARD':
                        let listLabel = '';
                        chart.conditionDataSource.label.map(item => {
                            listLabel += `{ "data": "${item}" },`;
                        });

                        ajaxInfoChart += `
                            $('#tableList${chart.name.toCapitalize()}').DataTable({
                                'iDisplayLength': 10,
                                "aaSorting": [],
                                ...languageDataTable,
                                "ordering": false,
                                "paging": false,
                                "searching": false,
                                "processing": true,
                                "serverSide": true,
                                "ajax": {
                                    "type": "POST",
                                    "url": '${chart.conditionDataSource.api}',
                                    "dataType": "json",
                                    data: d => {
                                        return d;
                                    }
                                },
                                "columns": [
                                    { "data": "index", "width": "5%" },
                                    ${listLabel}
                                    { "data": "total" }
                                ],
                            });
                        `;
                        break;
                    case 'TIME_BASED':
                        ajaxInfoChart += `
                            $.ajax({
                                url: '${chart.conditionDataSource.api}',
                                method: 'POST',
                                data: {},
                                success: resp => {
                                    console.log({
                                        resp
                                    });
                                    if (!resp.error) {
                                        let { infoChart, data: dataOfChart } = resp;
                                        let data       = [];
                                        let categories = [];
                        `;
                        if (!chart.format_chart) {
                            chart.format_chart = "AREA"; // MẶC ĐỊNH CỦA CHART TIME_BASED LÀ AREA
                        }

                        let typeDataOfView = "item.sum";
                        if (chart.conditionDataSource.view == "COUNT") {
                            typeDataOfView = "item.count";
                        } 

                        switch (chart.format_chart) {
                            case "AREA":
                                ajaxInfoChart += `
                                    dataOfChart && dataOfChart.length && dataOfChart.map(item => {
                                        if (item.count) {
                                            data = [
                                                ...data,
                                                item.count
                                            ];
                                        } else {
                                            data = [
                                                ...data,
                                                item.sum
                                            ];
                                        }
                
                                        let stringDateParse = item._id.year.toString();
                                        switch (infoChart.data_source_obj.timeframe) {
                                            case 'DAY':
                                                stringDateParse += "-" + item._id.month + "-" + item._id.day;
                                                break;
                                            case 'WEEK':
                                                
                                                break;
                                            case 'MONTH':
                                                stringDateParse += "-" + item._id.month;
                                                break;
                                            default:
                                                break;
                                        }
                                        let dateParse = moment(new Date(stringDateParse)).format();
                                        categories = [
                                            ...categories,
                                            dateParse
                                        ];
                                    });
                                    
                                    var options = {
                                            series: [{
                                            name: infoChart.description,
                                            data: data
                                        }
                                        // , {
                                        // 	name: 'series2',
                                        // 	data: [11, 32, 45, 32, 34, 52, 41]
                                        // 	}
                                        ],
                                            chart: {
                                            height: 350,
                                            type: 'area'
                                        },
                                        dataLabels: {
                                            enabled: false
                                        },
                                        stroke: {
                                            curve: 'smooth'
                                        },
                                        xaxis: {
                                            type: 'datetime',
                                            categories,
                                        },
                                        tooltip: {
                                            x: {
                                                format: 'dd/MM/yy HH:mm'
                                            },
                                        },
                                    };
                                `;
                                break;
                            case "COLUMN":
                                ajaxInfoChart += `
                                    dataOfChart && dataOfChart.length && dataOfChart.map(item => {
                                        if (item.count) {
                                            data = [
                                                ...data,
                                                item.count
                                            ];
                                        } else {
                                            data = [
                                                ...data,
                                                item.sum
                                            ];
                                        }
                
                                        let stringDateParse = item._id.year.toString();
                                        switch (infoChart.data_source_obj.timeframe) {
                                            case 'DAY':
                                                stringDateParse += "-" + item._id.month + "-" + item._id.day;
                                                break;
                                            case 'WEEK':
                                                
                                                break;
                                            case 'MONTH':
                                                stringDateParse += "-" + item._id.month;
                                                break;
                                            default:
                                                break;
                                        }
                                        let dateParse = moment(new Date(stringDateParse)).format('DD/MM/YYYY');
                                        categories = [
                                            ...categories,
                                            dateParse
                                        ];
                                    });
                                    var options = {
                                        series: [{
                                        name: infoChart.description,
                                        data: data
                                    }, 
                                    // {
                                    // 	name: 'Revenue',
                                    // 	data: [76, 85, 101, 98, 87, 105, 91, 114, 94]
                                    // }, {
                                    // 	name: 'Free Cash Flow',
                                    // 	data: [35, 41, 36, 26, 45, 48, 52, 53, 41]
                                    // }
                                    ],
                                        chart: {
                                        type: 'bar',
                                        height: 350
                                    },
                                        plotOptions: {
                                        bar: {
                                            horizontal: false,
                                            columnWidth: '55%',
                                            endingShape: 'rounded'
                                        },
                                    },
                                        dataLabels: {
                                        enabled: false
                                    },
                                        stroke: {
                                        show: true,
                                        width: 2,
                                        colors: ['transparent']
                                    },
                                        xaxis: {
                                        categories
                                        // categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
                                    },
                                        yaxis: {
                                        title: {
                                            text: 'Đơn vị tính'
                                        }
                                    },
                                        fill: {
                                        opacity: 1
                                    },
                                        tooltip: {
                                            y: {
                                                formatter: function (val) {
                                                    // return "$ " + val + " thousands"
                                                    return val;
                                                }
                                            }
                                        }
                                    };
                                `;
                                break;
                            case "LINE":
                                ajaxInfoChart += `
                                    let title = '';
                                    dataOfChart && dataOfChart.length && dataOfChart.map(item => {
                                        if (item.count) {
                                            data = [
                                                ...data,
                                                item.count
                                            ];
                                        } else {
                                            data = [
                                                ...data,
                                                item.sum
                                            ];
                                        }
                
                                        let stringDateParse = item._id.year.toString();
                                        switch (infoChart.data_source_obj.timeframe) {
                                            case 'DAY':
                                                title = 'Thống kê theo ngày';
                                                stringDateParse += "-" + item._id.month + "-" + item._id.day;
                                                break;
                                            case 'WEEK':
                                                title = 'Thống kê theo tuần';
                                                break;
                                            case 'MONTH':
                                                title = 'Thống kê theo tháng';
                                                stringDateParse += "-" + item._id.month;
                                                break;
                                            default:
                                                break;
                                        }
                                        let dateParse = moment(new Date(stringDateParse)).format('DD/MM/YYYY');
                                        categories = [
                                            ...categories,
                                            dateParse
                                        ];
                                    });
                                    var options = {
                                        series: [{
                                            name: infoChart.description,
                                            data,
                                        }],	
                                        chart: {
                                            height: 350,
                                            type: 'line',
                                            zoom: {
                                                enabled: false
                                            }
                                        },
                                        dataLabels: {
                                            enabled: false
                                        },
                                        stroke: {
                                            curve: 'straight'
                                        },
                                        title: {
                                            text: title,
                                            align: 'left'
                                        },
                                        grid: {
                                            row: {
                                                colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
                                                opacity: 0.5
                                            },
                                        },
                                        xaxis: {
                                            categories,
                                        }
                                    };
                                `;
                                break;
                            default:
                                break;
                        }

                        ajaxInfoChart += `
                                        var chart = new ApexCharts(document.querySelector("#chart${chart.name.toCapitalize()}"), options);
                                        chart.render();
                                    }
                                }
                            });
                        `;
                        break;
                    default:
                        break;
                }  
                break;
            default:
                break;
        }
    });

    

    let outputtedFile = `
        <script>
            $(document).ready(function(){
                ${ajaxInfoChart}
            })
        </script>
    `;

    return outputtedFile;
}
