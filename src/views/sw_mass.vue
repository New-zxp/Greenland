<template>
    <div style="position: relative; z-index: 999;" id="chartDiv" @mousedown="startDrag"
        :style="{ left: chartLeft + 'px', top: chartTop + 'px' }">
        <div id="echarts" style="width: 500px; height: 380px; background-color: white;"></div>
        <button @click="downloadData" style="position: absolute; top: 5px; left: 320px;">下载数据</button>
        <button @click="close" style="position: absolute; top: 5px; left: 450px;">关闭</button>
    </div>
</template>
<script setup>
import { ref, reactive } from 'vue';
import * as echarts from 'echarts';
import regression from 'regression';
import jStat from 'jstat';

const chartLeft = ref(0);
const chartTop = ref(0);

function startDrag(e) {
    const initialX = e.clientX;
    const initialY = e.clientY;
    const initialLeft = chartLeft.value;
    const initialTop = chartTop.value;

    function handleMove(e) {
        const offsetX = e.clientX - initialX;
        const offsetY = e.clientY - initialY;

        chartLeft.value = initialLeft + offsetX;
        chartTop.value = initialTop + offsetY;
    }

    function handleUp() {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
    }

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
}

function downloadData() {
    Promise.all([
        fetch('./src/data/download/sw_GRACE_mass.csv').then(response => response.text()), // 使用 response.text() 解析 CSV 数据
        fetch('./src/data/download/sw_MBM_mass.csv').then(response => response.text()) // 使用 response.text() 解析 CSV 数据
    ]).then(([GraceData, MBMData]) => {
        const graceDataBlob = new Blob([GraceData], { type: 'text/csv' }); // 将数据转换为 Blob 类型并指定 MIME 类型为 'text/csv'
        const mbmDataBlob = new Blob([MBMData], { type: 'text/csv' }); // 将数据转换为 Blob 类型并指定 MIME 类型为 'text/csv'

        const graceDataFileName = 'sw_GRACE_mass.csv';
        const mbmDataFileName = 'sw_MBM_mass.csv';

        const graceDataLink = document.createElement('a');
        graceDataLink.href = window.URL.createObjectURL(graceDataBlob);
        graceDataLink.download = graceDataFileName;
        graceDataLink.click();

        const mbmDataLink = document.createElement('a');
        mbmDataLink.href = window.URL.createObjectURL(mbmDataBlob);
        mbmDataLink.download = mbmDataFileName;
        mbmDataLink.click();
    });
}

function close() {
    // var url = 'https://3707n923f3.goho.co';
    var url = 'http://localhost:7070';
    document.getElementById('chartDiv').style.display = 'none';
    window.location.href =  url + '/#/';
}

Promise.all([
    fetch('./src/data/sw_Grace_mass.json').then(response => response.json()),
    fetch('./src/data/sw_MBM_mass.json').then(response => response.json())
]).then(([GraceData, SMBData]) => {

    // 初始化echarts实例
    var myChart = echarts.init(document.getElementById('echarts'));

    // 绘制图表
    myChart.setOption({
        title: {
            text: 'SW',   // 设置标题文本
            textStyle: {              // 标题文字样式配置
                color: 'black',
                fontSize: 15,
            },
            left: 'center',   // 设置标题水平居中
            top: '10px',
        },
        tooltip: {
            trigger: "item",
        },
        legend: {},
        xAxis: {
            type: "value",
            data: ["2000", "2005", "2010", "2015", "2020", "2025"],
            min: 2000,
            max: 2025,
            axisLabel: {
                fontFamily: 'Arial', // 设置字体
                fontSize: 15,        // 设置字号
                color: '#333',        // 设置颜色
                formatter: function (value) {
                    return value;
                }
            },
            axisLine: {
                show: false,
            },
            axisTick: {
                show: false,
            }
        },
        yAxis: {
            type: "value",
            name: 'Mass Change (Gt)',
            nameLocation: "middle",
            nameTextStyle: {
                fontSize: 15,
            },
            nameGap: 50,
            data: ["-1200", "-900", "-600", "-300", "0", "300"],
            min: -1200,
            max: 300,
            axisLabel: {
                fontFamily: 'Arial', // 设置字体
                fontSize: 15,        // 设置字号
                color: '#333'        // 设置颜色
            },
            axisLine: {
                show: false,
            },
            axisTick: {
                show: false,
            }
        },
        grid: {
            width: '70%',  // 设置宽度为80%
            height: '70%',  // 设置高度为80%
            left: '15%',
            top: '15%',
        },
        series: [
            {
                type: "scatter",
                data: GraceData,
                name: "GRACE",
                itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                },
            },
            {
                type: "scatter",
                data: SMBData,
                name: "SMB",
                itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(65, 105, 225, 0.8)',
                },
            },
        ],
        //图例
        legend: {
            orient: 'vertical',
            top: 60,
            right: 75,
        },
        toolbox: {
            feature: {
                dataView: { readOnly: false },
                saveAsImage: {},
            },
            itemSize: 18,
            itemGap: 20,
            right: 70,
        },
    });

    // 拟合曲线
    const GraceSeriesData = myChart.getOption().series[0].data;
    const SMBSeriesData = myChart.getOption().series[1].data;
    const x1Data = GraceSeriesData.map(item => item[0]);
    const x2Data = SMBSeriesData.map(item => item[0]);
    const y1Data = GraceSeriesData.map(item => item[1]);
    const y2Data = SMBSeriesData.map(item => item[1]);
    const result1 = regression.linear(x1Data.map((item, index) => [item, y1Data[index]]));
    const result2 = regression.linear(x2Data.map((item, index) => [item, y2Data[index]]));
    const [m1, b1] = result1.equation;
    const [m2, b2] = result2.equation;
    const y_pred1 = x1Data.map(item => m1 * item + b1);
    const y_pred2 = x2Data.map(item => m2 * item + b2);
    const residual1 = y1Data.map((item, index) => item - y_pred1[index]);
    const residual2 = y2Data.map((item, index) => item - y_pred2[index]);
    const SE1 = Math.sqrt((1 / (206 - 2)) * residual1.reduce((sum, y1, i) => sum + (y1 - m1 * x1Data[i] - b1) ** 2, 0));
    const SE2 = Math.sqrt((1 / (206 - 2)) * residual2.reduce((sum, y2, i) => sum + (y2 - m2 * x2Data[i] - b2) ** 2, 0));
    const Sxx1 = x1Data.reduce((sum, x1) => sum + (x1 - mean(x1Data)) ** 2, 0);
    const Sxx2 = x2Data.reduce((sum, x2) => sum + (x2 - mean(x2Data)) ** 2, 0);
    const SE_m1 = SE1 / Math.sqrt(Sxx1);
    const SE_m2 = SE2 / Math.sqrt(Sxx2);
    const delta_m1 = t(x1Data.length - 2, 0.025) * SE_m1;
    const delta_m2 = t(x2Data.length - 2, 0.025) * SE_m2;
    

    // 计算均值的辅助函数
    function mean(arr) {
        return arr.reduce((sum, x) => sum + x, 0) / arr.length;
    }

    // 计算t分布的辅助函数
    function t(df, p) {
        let tValue = jStat.studentt.inv(p, df);
        return tValue;
    }

    myChart.setOption({
        series: [
            {
                type: "scatter",
                data: GraceData,
                name: "GRACE",
                itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                },
                symbolSize: 8,
            },
            {
                type: "scatter",
                data: SMBData,
                name: "MBM",
                itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(65, 105, 225, 0.8)',
                },
                symbolSize: 8,
            },
            {
                //拟合曲线
                type: 'line',
                data: x1Data.map(item => [item, m1 * item + b1]),
                lineStyle: {
                    // 修改拟合曲线的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                    width: 5
                },
                showSymbol: false,
                endLabel: {
                    show: true,
                    formatter: 'GRACE Rate = ' + m1.toFixed(1) + " ± " +  Math.abs(delta_m1.toFixed(1)) +  ' Gt/yr',
                    color: 'rgba(255, 0, 0, 0.8)',
                    fontSize: 13,
                },
                animation: false,
                labelLayout(params) {
                    return {
                        x: params.rect.x - 20,
                        y: params.rect.y + params.rect.height / 1.2,
                        verticalAlign: 'middle',
                        align: 'left'
                    }
                },
            },
            {
                type: "line",
                data: x2Data.map(item => [item, m2 * item + b2]),
                lineStyle: {
                    color: 'rgba(65, 105, 225, 0.8)',
                    width: 5
                },
                showSymbol: false,
                endLabel: {
                    show: true,
                    formatter: 'MBM Rate = ' + m2.toFixed(1) + " ± " +  Math.abs(delta_m2.toFixed(1)) +  ' Gt/yr',
                    color: 'rgba(65, 105, 225, 0.8)',
                    fontSize: 13
                },
                animation: false,
                labelLayout(params) {
                    return {
                        x: params.rect.x + 128,
                        y: params.rect.y + params.rect.height / 3.5,
                        verticalAlign: 'middle',
                        align: 'left'
                    }
                },
            },
        ],
    });
})
    .catch(error => {
        console.error(error);
    });

</script>