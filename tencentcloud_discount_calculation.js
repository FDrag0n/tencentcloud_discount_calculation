// ==UserScript==
// @name         腾讯云代金券优惠力度计算
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在hunyuan大模型辅助下完成
// @author       fdrag0n
// @match        https://console.cloud.tencent.com/expense/voucher
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 定义用于提取数字的正则表达式
    const NUMBER_REGEX = /\d+/;

    // 计算折扣百分比的函数
    function calculateDiscount(numerator, denominator) {
        // 如果分母为0，返回'N/A'，否则计算并返回折扣百分比
        return denominator === 0 ? 'N/A' : ((numerator / denominator) * 100).toFixed(2);
    }

    // 从文本中提取数字的函数
    function extractNumberFromText(text) {
        const match = text.match(NUMBER_REGEX);
        return match ? parseInt(match[0], 10) : null;
    }

    // 处理所有表格行的函数
    function processRows(rows) {
        // 遍历每一行
        rows.forEach((row, index) => {
            // 提取分子（优惠券金额）
            const numeratorElement = row.querySelector('td:nth-child(4) div p:nth-child(1) span span');
            if (!numeratorElement) {
                console.error(`在第 ${index + 1} 行中找不到分子元素`);
                return;
            }
            const numerator = parseFloat(numeratorElement.innerText.replace(/[^\d.-]/g, ''));

            // 提取分母（优惠券阈值）
            const denominatorElement = row.querySelector('td:nth-child(4) div p:nth-child(2) span');
            if (!denominatorElement) {
                console.error(`在第 ${index + 1} 行中找不到分母元素`);
                return;
            }
            const denominatorText = denominatorElement.innerText;
            const denominator = extractNumberFromText(denominatorText);

            if (denominator === null) {
                console.error(`无法从第 ${index + 1} 行的文本中提取数字`);
                return;
            }

            // 计算折扣百分比
            const discountPercentage = calculateDiscount(numerator, denominator);

            // 检查子节点数量，避免插入到错误的位置
            const targetElement = row.querySelector('td:nth-child(4) div p:nth-child(1) span:nth-child(1)');
            if (targetElement && targetElement.nextSibling && targetElement.nextSibling.nodeType === Node.ELEMENT_NODE) {
                console.log(`由于存在多个子节点，跳过第 ${index + 1} 行的插入`);
                return;
            }

            // 将折扣百分比插入到指定的兄弟节点中
            if (targetElement) {
                targetElement.insertAdjacentHTML('afterend', `<span>=${discountPercentage}%</span>`);
                console.log(`折扣百分比已插入第 ${index + 1} 行`);
            } else {
                console.error(`在第 ${index + 1} 行中找不到目标元素`);
            }

            // 输出或使用折扣信息
            console.log(`第 ${index + 1} 行: ${numerator}/${denominator}=${discountPercentage}%`);
        });
    }

    // 观察表格变化的函数
    function observeTableChanges() {
        // 查询目标节点
        const targetNode = document.querySelector('#expense-voucher main div div.app-expense-layout__content-body div div.app-expense-card.expense-card-verify div div div.expense-grid-operation div.app-expense-tabs div:nth-child(3) div.app-expense-table__body table tbody');
        if (!targetNode) {
            console.error('找不到目标节点');
            return;
        }

        // 配置观察选项
        const config = { childList: true, subtree: true };
        // 创建并启动观察者
        const observer = new MutationObserver((mutationsList) => {
            console.log('检测到变化');
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // 每次表格变化时重新处理所有行
                    const rows = targetNode.querySelectorAll('tr');
                    processRows(rows);
                }
            }
        });

        observer.observe(targetNode, config);
    }

    // 初始化函数，页面加载完成后启动观察者
    function init() {
        console.log('页面已加载');
        observeTableChanges();
    }

    // 监听页面加载完成事件
    window.addEventListener('load', init);
    // 监听DOM内容加载完成事件
    document.addEventListener('DOMContentLoaded', init);
})();
