"use strict";

const ObjectID  = require('mongoose').Types.ObjectId;
const XLSX      = require('xlsx');
const lodash    = require('lodash');
const language  = require('../language/language');
const moment    = require('moment')

exports.checkValidDate = function checkValidDate(params) {
    var m = moment(params);
    return m.isValid(); // false
}

exports.isEmpty = function (value) {
    return typeof value == 'string'
        && !value.trim()
        || typeof value == 'undefined'
        || value === null
        || value == undefined;
};

exports.isEmptyObject = function (obj) {
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            return false;
        }
    }
    return true;
};

exports.isEmptyObj = obj => Object.keys(obj).length === 0 && obj.constructor === Object;

exports.removeUndefineObject = obj => {
    let newObj = {};
    Object.keys(obj).forEach((key) => {
        if (obj[key] === Object(obj[key])) newObj[key] = this.removeUndefineObject(obj[key]);
        else if (obj[key] !== undefined && obj[key] !== '') newObj[key] = obj[key];
    });
    return newObj;
};

exports.cleanObject = obj => {
    Object.keys(obj).forEach(key => (obj[key] === undefined || obj[key] === '') && delete obj[key])
    return obj;
};


exports.IsJsonString = str => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * kiểm tra mảng array có tồn tại giá trị hay không?
 * @param params
 * @returns {boolean}
 */
exports.checkParamsValidate = function (params) {
    var isParamIsValidate = true;
    params.forEach(function (item, index) {
        if (item == null || item.trim().length == 0) {
            isParamIsValidate = false;
        }
    });

    return isParamIsValidate;
};

exports.currencyFormat = function (number, fixLength) {
    if (fixLength == null) {
        let stringNum = number + '';
        let arrInc = stringNum.split('.');
        let fixNum = 0;
        if (arrInc.length == 2) {
            fixNum = arrInc[1].length;
        }

        fixNum = fixNum > 18 ? 18 : fixNum;

        return (Number(number)).toLocaleString('en-US', { minimumFractionDigits: fixNum });
    } else {
        return (Number(number)).toLocaleString('en-US', { minimumFractionDigits: fixLength });
    }
};

/**
 * Func: Load path image
 * Create: 20/09/2021
*/
exports.loadPathImage = path => {
    const regex = /https?:\/\//g;

    if (regex.test(path))
		return path;

    return `${process.env.AWS_S3_URI}${path}`;
}

// Hàm làm tròn tiền tệ
exports.roundingNumber = function (num, dp, isCurrency) {
    if (arguments.length < 2) throw new Error("2 arguments required");
    num = `${num}`;
    if(!num.includes('.')){
        num = Number(num)/1000;
    }
    num = `${num}`;
    if (num.indexOf('e+') != -1) {
        // Can't round numbers this large because their string representation
        // contains an exponent, like 9.99e+37
        throw new Error("num too large");
    }
    if (num.indexOf('.') == -1) {
        // Nothing to do
        if(isCurrency){
            return  Number(num)*1000
        }
        return Number(num);
    }
 
    var parts = num.split('.'),
        beforePoint = parts[0],
        afterPoint = parts[1],
        shouldRoundUp = afterPoint[dp] >= 5,
        finalNumber;

    if(dp >= `${afterPoint}`.length){
        dp = afterPoint.length - 1;
        console.log({__ : afterPoint[dp]})
        shouldRoundUp = afterPoint[dp] >= 5
    }
    if(dp == 0){
        afterPoint = afterPoint[0];
        finalNumber =  Number(beforePoint);
        if(Number(afterPoint)>=5){
            finalNumber =  finalNumber + 1;
            if(isCurrency){
                return  Number(finalNumber)*1000
            }
            return finalNumber;
        }else{
            if(isCurrency){
                return  Number(finalNumber)*1000
            }
            return finalNumber;
        }
    }else{
        afterPoint = afterPoint.slice(0, dp);
        if (!shouldRoundUp) {
            finalNumber = beforePoint + '.' + afterPoint;
        } else if (/^9+$/.test(afterPoint)) {
            // If we need to round up a number like 1.9999, increment the integer
            // before the decimal point and discard the fractional part.
            finalNumber = Number(beforePoint)+1;
        } else {
            // Starting from the last digit, increment digits until we find one
            // that is not 9, then stop
            var i = dp-1;
            while (true) {
                if (afterPoint[i] == '9') {
                    afterPoint = afterPoint.substr(0, i) +
                                 '0' +
                                 afterPoint.substr(i+1);
                    i--;
                } else {
                    afterPoint = afterPoint.substr(0, i) +
                                 (Number(afterPoint[i]) + 1) +
                                 afterPoint.substr(i+1);
                    break;
                }
            }
     
            finalNumber = beforePoint + '.' + afterPoint;
        }

        if(isCurrency){
            return Number(finalNumber.replace(/0+$/, ''))*1000
        }
      
        // Remove trailing zeroes from fractional part before returning
        return Number(finalNumber.replace(/0+$/, ''));
    }
    
}

/**
 * tính khoảng cách giữ 2
 * @param lat1
 * @param long1
 * @param lat2
 * @param long2
 * @returns {number}
 */
exports.getDistanceFromLatLonInKm = function (lat1, long1, lat2, long2) {
    function deg2rad(deg) {
        return deg * (Math.PI / 180)
    }

    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(long2 - long1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
};

exports.randomIntBetween = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

exports.randomIntFromInterval = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

function change_alias(alias) {
    var str = alias;
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, " ");
    str = str.replace(/ + /g, " ");
    str = str.trim();
    return str;
}

exports.colName = function colName(n) {
    var ordA = 'a'.charCodeAt(0);
    var ordZ = 'z'.charCodeAt(0);
    var len = ordZ - ordA + 1;
    
    var s = "";
    while(n >= 0) {
        s = String.fromCharCode(n % len + ordA) + s;
        n = Math.floor(n / len) - 1;
    }
    return s;
}

exports.renderOptionFilter = function renderOptionFilter(input) {
    let outputFilterBox = '';

    switch (input.type) {
        case 'text':
            outputFilterBox += `
                <div class="col-sm-8 d-flex d-none" data-follow="${input.name}" data-type="${input.type}">
                    <select class="form-select input-field-compare">
                        <option value="equal">Bằng</option>
                        <option value="not-equal">Không bằng</option>
                        <option value="start-with">Bắt đầu với</option>
                        <option value="end-with">Kết thúc với</option>
                        <option value="is-contains" selected>Có chứa</option>
                        <option value="not-contains">Không chứa</option>
                        <option value="null">Trống</option>
                    </select>

                    <input type="text" class="form-control input-field-value">
                </div>
            `;
            break;
        case 'number':
            if(input.isEnum === true){
                let outputOptions = '';

                input.dataEnum.map(item => {
                    outputOptions += `<option value="${item.value}">${item.title}</option>`;
                })

                outputFilterBox += `
                    <div class="col-sm-8 d-none" data-follow="${input.name}" data-type="enum">
                        <select class="form-select input-field-compare">
                            <option value="equal" selected>Bằng</option>
                            <option value="not-equal">Không bằng</option>
                            <option value="null">Trống</option>
                        </select>

                        <select class="form-select input-select-value">
                            <option value="-1" disabled selected>Chọn ${input.note || input.name}</option>
                            ${outputOptions}
                        </select>
                    </div>
                `;
            } else{
                outputFilterBox += `
                    <div class="col-sm-8 d-flex d-none" data-follow="${input.name}" data-type="${input.type}">
                        <select class="form-select input-field-compare">
                            <option value="equal" selected>Bằng</option>
                            <option value="not-equal">Không bằng</option>
                            <option value="greater-than">Lớn hơn</option>
                            <option value="less-than">Bé hơn</option>
                            <option value="null">Trống</option>
                        </select>

                        <input type="number" class="form-control input-field-value">
                    </div>
                `;
            }
            break;
        case 'date':
            outputFilterBox += `
                <div class="col-sm-8 d-none" data-follow="${input.name}" data-type="${input.type}">
                    <select class="form-select input-field-compare">
                        <option value="equal" selected>Bằng</option>
                        <option value="not-equal">Không bằng</option>
                        <option value="before">Trước</option>
                        <option value="after">Sau</option>
                        <option value="today">Hôm nay</option>
                        <option value="yesterday">Hôm qua</option>
                        <option value="before-hours">N tiếng trước</option>
                        <option value="before-days">N ngày trước</option>
                        <option value="before-months">N tháng trước</option>
                        <option value="null">Trống</option>
                    </select>

                    <input type="date" class="form-control input-field-value">
                    <input type="number" class="form-control input-field-value d-none">
                </div>
            `;
            break;
        default:
            break;
    }

    return outputFilterBox;
}

exports.replaceAll = function (str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}
/**
 * Hàm chuyển đổi từ name sang slug
 * @param {*} plainText
 * @returns {string} 
 */
exports.convertToSlug = function (plainText) {
    const text_converted_alias = change_alias(plainText);
    const text_split_with_space = text_converted_alias.split(' ');
    const text_joined = text_split_with_space.join('-');
    return text_joined;
}

exports.filterObject = (obj, filter, filterValue) =>
    Object.keys(obj).reduce((acc, val) =>
        (obj[val][filter] === filterValue ? {
            ...acc,
            [val]: obj[val]
        } : acc
        ), {});


exports.checkPhoneNumber = (phone) => {
    var vnf_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;
    if (phone !== '') {
        if (vnf_regex.test(phone) == false)
            return false;
        return true;
    } else {
        return false;
    }
}

/**
 * param: email
 * return bolean
 */
exports.checkEmail = email => {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * param: price
 * return number
 */
exports.checkNumber = price => {
    var re = /^[0-9]*$/;
    return re.test(price);
}

/* 
 * Hàm validation các kí tự thực thi script 
 * param: data
 * return boolean
*/
exports.isValidationData = data => {
    const denineString = ['<', '>', '\'', '\"', '&', '\\', '\\\\'];
    const dataAfterSplited = data.split('');
    let temp = 0;
    while (temp < dataAfterSplited.length) {
        if (dataAfterSplited.includes(denineString[temp])) {
            return false;
        }
        temp++;
    }
    return true;
}


exports.formatCurrentcy = x => {
    return x.toLocaleString('it-IT', { style: 'currency', currency: 'VND' });
};


// -----------CHECK NUMBER VALID WITH RANGE --------//
exports.checkNumberIsValidWithRange = ({ arrValid, val }) => {
    // arr: Array, val: Number
    if (val == null || val == '' || val == undefined || Number.isNaN(Number(val))) // kiểm tra val có phải number (lọc các trường hợp ko phải number)
        return false;
    if (!Array.isArray(arrValid) || !arrValid.includes(Number(val))) // kiểm tra val có nằm trong arr valid
        return false;

    return true;
}
 
exports.checkRangeValid = (arr, val) => {
    if (!Array.isArray(arr) || !arr.includes(val))
        return false;
    return true;
}

// Read data from excel file (first sheet in file)
exports.readFileExcel = (pathFileInternal) => {
    let wb      = XLSX.readFile(pathFileInternal);
    let data    = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    return data;
}

// Đọc dữ liệu từ sheet 2 để import data
exports.readFileExcel1 = (pathFileInternal) => {
    let wb      = XLSX.readFile(pathFileInternal);
    let data    = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[1]], { header: 1 });
    return data;
}

let _isValid = input => {
    if (!input)
        return false;
    let inputForCheck = input.toString();
    if (ObjectID.isValid(input.toString())) {
        if (String(new ObjectID(input)) === inputForCheck) 
            return true;
        return false;
    }
    return false;
}

// Khánh sẽ xem xét lại: bị lỗi khi check với req.query
exports.checkObjectIDs = (...params) => {
    let flag = true;
    let arrParams = lodash.flattenDeep(params);
    for(let i = 0; i < arrParams.length; i++) {
        if (!_isValid(arrParams[i]))
            return flag = false
    }
    return flag;
}

/**
 * Tính số ngày giữa 2 ngày
 * Author: DEPV
*/
exports.numberOfNightsBetweenDates = (startDate, endDate) => {
    const start = new Date(startDate) //clone
    const end = new Date(endDate) //clone
    let dayCount = 0
  
    while (end > start) {
      dayCount++
      start.setDate(start.getDate() + 1)
    }
  
    return dayCount
}

exports.replaceExist = (arr, userID, socketID, username) => {
    let newArr;
    let isExist = arr.find(item => Object.is(item.username, username)); // kiểm tra tồn tại

    if (isExist) {
        let arrWithoutExist = arr.filter(item => !Object.is(item.username, username));
        newArr = [...arrWithoutExist, 
            { 
                userID, 
                socketID: [...isExist.socketID, socketID], 
                username }
        ];
    } else {
        newArr = [...arr, 
            {
                userID,
                socketID: [socketID],
                username
            }
        ]
    }
    return newArr;
};

exports.decrypt = hash => {
    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, 'hex'));
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);

    return decrpyted.toString();
}

/**
 * Ex1: 
 *      (*)TH1: Message đã tồn tại trong FUNCTION
 *          => Param => (error, message)
 * Ex2: 
 *      (*)TH2: Message chưa tồn tại trong FUNCTION
 *          => Param => (error, message, title)
 *          example: 
 *              Param: ({error: true, message: "id_invalid", title:"ObjectID không hợp lệ"})
 *              Response: ({error: true, message: "ObjectID không hợp lệ"})
 * 
 * @param {*} error true 
 * @param {*} message "String"  
 * @param {*} message "String"  
 * @returns 
 */

exports.responseJsonError = ({ error, message, lang }) => {
    if (error) {
        if (!lang) {
            lang = "vn"
        }
        let content = language.getLanguage(message, lang);
        return {error, message: content}
    }
}

/**
 * Func: Get extension image
 * Create: 20/09/2021
*/
exports.getExtension = path => {
    const basename = path.split(/[\\/]/).pop();
    const pos = basename.lastIndexOf(".");

    if (basename === "" || pos < 1)
        return "";

    return basename.slice(pos + 1);
}

