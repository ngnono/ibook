/**
 * User: ngnono
 * Date: 15-2-9
 * Time: 下午2:47
 * To change this template use File | Settings | File Templates.
 */

'use strict';


var _ = require('lodash');
var pinyin = require('pinyin');

var addressWhiteList = /^[A-Z]{1}$/;
var datetimeFormat = 'YYYY-MM-DDTHH:mm:ssZ';

/**
 * 拼音方法
 * @param name
 * @param opts
 * @returns {*}
 * @private
 */
function _proxyPinyin(name, opts) {
    return pinyin(name, opts);
}


/**
 * 根据NAME 获取拼音
 * @param name
 * @returns {*}
 */
function getPinyin(name) {
    //pinyin
    var py = _proxyPinyin(name, {
        style: pinyin.STYLE_NORMAL
    });

    if (py.length === 0) {
        return '';
    }

    return py.join('');
}


/**
 * 获取 通讯录 索引
 * @param name
 * @returns {string}
 */
function getAddressIndex(name) {
    if (name.length !== 0) {
        var firstArray = name[0];
        if (firstArray.length > 0) {
            var f = firstArray[0];
            if (_.isString(f)) {
                if (f.length === 1) {
                    var c1 = f.toUpperCase();
                    if (addressWhiteList.test(c1)) {
                        return c1;
                    }
                }
                else {
                    //first
                    var c2 = f.charAt(0).toUpperCase();

                    if (addressWhiteList.test(c2)) {
                        return c2;
                    }
                }
            }
        }
    }

    return '#';
}


/**
 * 获取 拼音 首字母
 * @param name
 * @returns {*}
 */
function getPinyinAddressIndex(name) {
    var py = _proxyPinyin(name, {
        style: pinyin.STYLE_FIRST_LETTER
    });

    return getAddressIndex(py);
}


/**
 * 获取 拼音的 每个首字母
 * @param name
 * @returns {string}
 */
function getJianPin(name) {
    //pinyin     p y
    var py = _proxyPinyin(name, {
        style: pinyin.STYLE_FIRST_LETTER
    });

    if (py.length === 0) {
        return '';
    }

    return py.join('').toUpperCase();
}


exports.getPinyin = getPinyin;
exports.getJianPin = getJianPin;
exports.getPinyinAddressIndex = getPinyinAddressIndex;
exports.getAddressIndex = getAddressIndex;
exports.datetimeFormat = datetimeFormat;
/**
 * 小本子 联系人类型
 * @type {{Enterprise: string, Customer: string}}
 */
module.exports.xbzContactsType =  {
    /**
     * 企业
     */
    Enterprise: 'enterprise',
    /**
     * 客户
     */
    Customer: 'customer'
};