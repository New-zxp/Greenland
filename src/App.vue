<template>
  <div id="map"></div>
  <div>
    <router-view></router-view>
  </div>
</template>
<script>
import mapboxgl from 'mapbox-gl';
import * as echarts from 'echarts';
// 引入Turf库
import * as turf from '@turf/turf';
export default {
  name: 'App',
  mounted() {
    //mapbox的识别码
    mapboxgl.accessToken = 'pk.eyJ1IjoienhwMDYxMSIsImEiOiJjbGI2bzJ0b3kwMnh5M3FvZHppcjBnb3FoIn0.-bw5-bWnBcVLIg-wbB7oQA';
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v10', //地图样式
      center: [-42.6043, 90], //格陵兰岛中心点坐标
      zoom: 2, //缩放大小
      doubleClickZoom: false,
      dragRotate: false, // 禁止地图旋转
      // scrollZoom: false
    });
    map.on('load', function () {
      //添加流域边界数据
      map.addSource('greenlandCw', {
        type: 'geojson',
        data: './src/data/cw_boundary.json'
      });

      map.addSource('greenlandNe', {
        type: 'geojson',
        data: './src/data/ne_boundary.json'
      });

      map.addSource('greenlandNo', {
        type: 'geojson',
        data: './src/data/no_boundary.json'
      });

      map.addSource('greenlandNw', {
        type: 'geojson',
        data: './src/data/nw_boundary.json'
      });

      map.addSource('greenlandSe', {
        type: 'geojson',
        data: './src/data/se_boundary.json'
      });

      map.addSource('greenlandSw', {
        type: 'geojson',
        data: './src/data/sw_boundary.json'
      });

      map.addSource('ant-v', {
  type: 'geojson',
  data: './src/data/Ant_V.json'
});

    map.addLayer({
      id: 'ant-v-circle',  // 将图层ID修改为反映其类型
      type: 'circle',
      source: 'ant-v',
      paint: {
        'circle-radius': 8,
        // 使用插值函数将速度属性值映射到一个颜色值范围内
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'speed'],
          -15, 'red',
          0,'white',
          15, 'blue'
        ]
      }
    });


      map.addSource('ap', {
        type: 'geojson',
        data: './src/data/ap.json'
      });

      map.addLayer({
        id: 'ap-line',
        type: 'line',
        source: 'ap',
        layout: {},
        'paint': {
          'line-color': 'red'
          },
        });

        map.addSource('wais', {
        type: 'geojson',
        data: './src/data/wais.json'
      });

      map.addLayer({
        id: 'wais-line',
        type: 'line',
        source: 'wais',
        layout: {},
        'paint': {
          'line-color': 'red'
          },
        });
        
        map.addSource('eais', {
        type: 'geojson',
        data: './src/data/eais.json'
      });

      map.addLayer({
        id: 'eais-line',
        type: 'line',
        source: 'eais',
        layout: {},
        'paint': {
          'line-color': 'red'
          },
        });

        map.addSource('ap-series', {
        type: 'geojson',
        data: './src/data/ap_time_series.json'
      });

      map.addSource('wais-series', {
        type: 'geojson',
        data: './src/data/wais_time_series.json'
      });

      map.addSource('eais-series', {
        type: 'geojson',
        data: './src/data/eais_time_series.json'
      });

// 添加填充图层和点击事件处理程序
function addFillLayer(map, sourceName, layerId, color) {
    map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceName,
        layout: {},
        paint: {
            'fill-color': color,
            'fill-opacity': 0
        }
    });
}

// 添加填充图层
addFillLayer(map, 'ap', 'ap-fill', 'red');
addFillLayer(map, 'wais', 'wais-fill', 'blue');
addFillLayer(map, 'eais', 'eais-fill', 'green');

// 添加点击事件处理程序
map.on('click', 'ap-fill', function (e) {
    fetchDataAndCreateTable('ap_time_series.json','AP');
});

map.on('click', 'wais-fill', function (e) {
    fetchDataAndCreateTable('wais_time_series.json','WAIS');
});

map.on('click', 'eais-fill', function (e) {
    fetchDataAndCreateTable('eais_time_series.json','EAIS');
});

// 函数：获取数据并创建表格
function fetchDataAndCreateTable(sourceName,name) {
    fetch('./src/data/' + sourceName)
        .then(response => response.json())
        .then(data => {
            // 创建表格
            createEChartsTable(data,sourceName,name);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

var currentChart = null; // 全局变量用于保存当前的 ECharts 实例
var chartContainer = null; // 全局变量用于保存当前的 ECharts 容器
var closeButton = null; // 全局变量用于保存当前的 ECharts 容器
var downloadButton = null; // 全局变量用于保存当前的 ECharts 容器

// 函数：销毁当前的 ECharts 实例和容器
function disposeCurrentChart() {
    if (currentChart) {
        currentChart.dispose(); // 销毁当前的 ECharts 实例
        currentChart = null; // 将全局变量置为 null
    }
    if (chartContainer && chartContainer.parentNode) {
        chartContainer.parentNode.removeChild(chartContainer); // 从 DOM 中删除容器元素
        chartContainer = null; // 将全局变量置为 null
    }
}

// 函数：创建 ECharts 表格
function createEChartsTable(data, sourceName,name) {
    // 销毁当前的 ECharts 实例和容器
    disposeCurrentChart();

    var seriesData = [];
    var xAxisData = [];

    data.features.forEach(feature => {
    var properties = feature.properties;
    // 假设属性中有 '时间' 和 'speed' 字段
    var time = properties['时间'];
    var speed = properties[name.toLowerCase()]; // 假设 speed 是你想要的属性名
    // 将时间和 speed 组合成数组，然后加入 seriesData
    seriesData.push([time, speed]);
});


 // 创建 ECharts 容器
    chartContainer = document.createElement('div');
    chartContainer.style.width = '600px'; // 设置表格宽度
    chartContainer.style.height = '400px'; // 设置表格高度
    chartContainer.style.left = '720px'; // 设置表格水平居中
    chartContainer.style.top = '300px'; // 设置表格水平居中
    chartContainer.style.transform = 'translate(-50%, -50%)'; // 居中显示
    chartContainer.style.backgroundColor = 'white'; // 设置表格背景颜色
    chartContainer.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)'; // 添加阴影效果
    document.body.appendChild(chartContainer);

    // 初始化 ECharts 实例
    var chart = echarts.init(chartContainer);

    // 配置表格
    var option = {
        title: {
            text: name + '冰质量变化时间序列',
            left: 'center',
            top: '10px',
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        xAxis: {
      type: 'value',
      data: xAxisData,
      axisLabel: {
        fontSize: 15,
        color: '#333',
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      min: 2000,  // 设置 x 轴最小值
    max: 2025,  // 设置 x 轴最大值
    },
    yAxis: {
      type: 'value',

      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      }
    },
    series: [
      {
        data: seriesData,
        type: "scatter",
        color: 'blue',
        symbolSize: 5, // 设置点的大小
      },]
    };

    // 使用配置项设置 ECharts 图表
    chart.setOption(option);

    // 将当前的 ECharts 实例保存到全局变量中
    currentChart = chart;

      // 添加事件监听器和动态样式绑定
  chartContainer.addEventListener('mousedown', startDrag);

function startDrag(e) {
  const initialX = e.clientX;
  const initialY = e.clientY;
  const initialLeft = chartContainer.offsetLeft; // 获取初始左偏移
  const initialTop = chartContainer.offsetTop; // 获取初始顶部偏移

  function handleMove(e) {
    const offsetX = e.clientX - initialX;
    const offsetY = e.clientY - initialY;

    chartContainer.style.left = initialLeft + offsetX + 'px'; // 设置左偏移
    chartContainer.style.top = initialTop + offsetY + 'px'; // 设置顶部偏移
  }

  function handleUp() {
    window.removeEventListener('mousemove', handleMove);
    window.removeEventListener('mouseup', handleUp);
  }

  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleUp);
}

    // 添加关闭按钮
    closeButton  = document.createElement('button');
    closeButton.textContent = '关闭';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.height = '30px';
    closeButton.style.width = '50px';
    closeButton.style.padding = '5px 10px';
    closeButton.style.border = 'none';
    closeButton.style.backgroundColor = '#ddd';
    closeButton.style.cursor = 'pointer';
    closeButton.style.transition = 'background-color 0.3s'; // 添加过渡效果
    // 添加下载按钮
    downloadButton  = document.createElement('button');
    downloadButton.textContent = '下载';
    downloadButton.style.position = 'absolute';
    downloadButton.style.top = '10px';
    downloadButton.style.right = '70px';
    downloadButton.style.height = '30px';
    downloadButton.style.width = '50px';
    downloadButton.style.padding = '5px 10px';
    downloadButton.style.border = 'none';
    downloadButton.style.backgroundColor = '#ddd';
    downloadButton.style.cursor = 'pointer';
    downloadButton.style.transition = 'background-color 0.3s'; // 添加过渡效果

    closeButton.addEventListener('mouseenter', function() {
        closeButton.style.backgroundColor = '#ccc'; // 鼠标移入时改变颜色
    });

    closeButton.addEventListener('mouseleave', function() {
        closeButton.style.backgroundColor = '#ddd'; // 鼠标移出时恢复原来的颜色
    });

    downloadButton.addEventListener('mouseenter', function() {
        downloadButton.style.backgroundColor = '#ccc'; // 鼠标移入时改变颜色
    });

    downloadButton.addEventListener('mouseleave', function() {
        downloadButton.style.backgroundColor = '#ddd'; // 鼠标移出时恢复原来的颜色
    });

    closeButton.addEventListener('click', function() {
        document.body.removeChild(chartContainer);
        // 销毁当前的 ECharts 实例
        disposeCurrentChart();
    });

    async function downloadFile() {
        const filePath = '/区域时间序列.txt'; // 确保路径正确

        try {
          const response = await fetch(filePath);
          if (!response.ok) throw new Error('Network response was not ok');
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = url;
          a.download = '区域时间序列.txt'; // 设置下载文件的默认名称
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error downloading file:', error);
        }
      }

      downloadButton.addEventListener('click', function() {
        downloadFile();
    });

      
    chartContainer.appendChild(closeButton);
    chartContainer.appendChild(downloadButton);
}


      // 获取地理坐标的像素坐标
      var coordinates = [-65, 58]; // 替换为您想要显示容器的地理坐标
      var pixelCoordinates = map.project(coordinates);

      // 创建colorbar容器
      var container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.width = '280px';

      // 设置容器的位置
      container.style.left = pixelCoordinates.x + 'px';
      container.style.top = pixelCoordinates.y + 'px';

      // 将容器添加到地图容器中
      var mapContainer = document.getElementById('map');
      mapContainer.appendChild(container);

      // 记录初始地图中心点的像素坐标
      var initialPixelCenter = map.project(map.getCenter());

      // 监听地图移动事件
      map.on('move', function () {
        // 获取地理坐标的像素坐标
        var pixelCoordinates = map.project(coordinates);

        // 设置容器的位置
        container.style.left = pixelCoordinates.x + 'px';
        container.style.top = pixelCoordinates.y + 'px';
      });

      // 监听地图缩放事件
      map.on('zoom', function () {
        // 获取当前地图缩放级别
        var zoom = map.getZoom();

        // 获取当前地图中心点的像素坐标
        var currentPixelCenter = map.project(map.getCenter());

        // 计算当前缩放级别相对于初始缩放级别的比例
        var scaleRatio = Math.pow(2, zoom - map.transform.startZoom);

        // 计算容器相对于初始中心点的偏移量
        var offset = currentPixelCenter.sub(initialPixelCenter).mult(1 / scaleRatio);

        // 更新容器的位置
        container.style.left = pixelCoordinates.x + offset.x + 'px';
        container.style.top = pixelCoordinates.y + offset.y + 'px';

        if (zoom <= 2.5) {
          container.style.transform = 'scale(' + zoom / 2 + ')';
        } else {
          container.style.transform = 'scale(' + 2.5 / 2 + ')';
        }
      });

      //添加Grace_vel数据
      map.addSource('Grace_Vel', {
        type: 'geojson',
        data: './src/data/Grace_vel.json'
      });

      //设置colorbar
      var GraceVelcolors = ['red', 'white', 'blue'];
      var GraceVelintervals = [-80, 0, 10];
      let GraceVelgradient = 'linear-gradient(to right, ';
      var GraceVellabel = document.createElement('div');
      GraceVellabel.innerHTML = 'GRACE Mass Change (cm/year)';
      GraceVellabel.style.textAlign = 'center';
      GraceVellabel.style.fontSize = '15px';
      container.appendChild(GraceVellabel);
      var GraceVelcolorbar = document.createElement('div');
      GraceVelcolorbar.style.width = '280px';
      GraceVelcolorbar.style.height = '18px';
      container.appendChild(GraceVelcolorbar);
      for (let i = 0; i < GraceVelcolors.length; i++) {
        GraceVelgradient += GraceVelcolors[i] + ' ' + ((GraceVelintervals[i] - GraceVelintervals[0]) / (GraceVelintervals[GraceVelintervals.length - 1] - GraceVelintervals[0]) * 100) + '%';
        if (i < GraceVelcolors.length - 1) {
          GraceVelgradient += ', ';
        }
        // 添加数字标签
        var label = document.createElement('div');
        label.innerHTML = GraceVelintervals[i];
        label.style.position = 'absolute';
        label.style.bottom = '-25px';
        if (GraceVelintervals[i] === 0) {
          label.style.left = ((GraceVelintervals[i] - GraceVelintervals[0]) / (GraceVelintervals[GraceVelintervals.length - 1] - GraceVelintervals[0]) * 100) + '%';
        } else {
          label.style.left = (i / (GraceVelcolors.length - 1) * 100) + '%';
        }
        label.style.transform = 'translate(-50%, 0%)';
        label.style.fontSize = '15px';
        label.style.color = 'black';
        GraceVelcolorbar.appendChild(label);
      }
      GraceVelgradient += ')';
      GraceVelcolorbar.style.background = GraceVelgradient;

      //在地图上显示出Grace_vel图像
      map.addLayer({
        id: 'Grace_Vel',
        type: 'circle',
        source: 'Grace_Vel',
        paint: {
          'circle-radius': 8,
          // 使用插值函数将速度属性值映射到一个颜色值范围内
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'speed'],
            GraceVelintervals[0], GraceVelcolors[0],
            GraceVelintervals[1], GraceVelcolors[1],
            GraceVelintervals[2], GraceVelcolors[2]
          ]
        },
        layout: {
          visibility: 'visible', // 可见
        },
      });

      //添加E_rate数据并在地图上显示
      map.addSource('E_rate', {
        type: 'geojson',
        data: './src/data/e_rate.json'
      });

      var Ecolors = ['#FF01FF', '#01FFFF'];
      var Eintervals = [-40, 500];
      let Egradient = 'linear-gradient(to right, ';
      var Elabel = document.createElement('div');
      Elabel.innerHTML = 'Evapotranspiration (mm/year)';
      Elabel.style.textAlign = 'center';
      Elabel.style.fontSize = "15px"
      var Ecolorbar = document.createElement('div');
      Ecolorbar.style.width = '280px';
      Ecolorbar.style.height = '18px';
      for (let i = 0; i < Ecolors.length; i++) {
        Egradient += Ecolors[i] + ' ' + ((Eintervals[i] - Eintervals[0]) / (Eintervals[Eintervals.length - 1] - Eintervals[0]) * 100) + '%';
        if (i < Ecolors.length - 1) {
          Egradient += ', ';
        }
        // 添加数字标签
        var label = document.createElement('div');
        label.innerHTML = Eintervals[i];
        label.style.position = 'absolute';
        label.style.bottom = '-25px';
        label.style.left = (i / (Ecolors.length - 1) * 100) + '%';
        label.style.transform = 'translate(-50%, 0%)';
        label.style.fontSize = '15px';
        label.style.color = 'black';
        Ecolorbar.appendChild(label);
      }
      Egradient += ')';
      Ecolorbar.style.background = Egradient;

      map.addLayer({
        id: 'E_rate',
        type: 'circle',
        source: 'E_rate',
        paint: {
          'circle-radius': 4,
          // 使用插值函数将速度属性值映射到一个颜色值范围内
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'speed'],
            Eintervals[0], Ecolors[0],
            Eintervals[1], Ecolors[1],
          ]
        },
        layout: {
          visibility: 'none' // 不可见
        }
      });

      //添加R_rate数据并在地图上显示
      map.addSource('R_rate', {
        type: 'geojson',
        data: './src/data/r_rate.json'
      });

      var Rcolors = ['#FF01FF', '#01FFFF'];
      var Rintervals = [0, 5300];
      let Rgradient = 'linear-gradient(to right, ';
      var Rlabel = document.createElement('div');
      Rlabel.innerHTML = 'Runoff (mm/year)';
      Rlabel.style.textAlign = 'center';
      Rlabel.style.fontSize = "15px"
      var Rcolorbar = document.createElement('div');
      Rcolorbar.style.width = '280px';
      Rcolorbar.style.height = '18px';
      for (let i = 0; i < Rcolors.length; i++) {
        Rgradient += Rcolors[i] + ' ' + ((Rintervals[i] - Rintervals[0]) / (Rintervals[Rintervals.length - 1] - Rintervals[0]) * 100) + '%';
        if (i < Rcolors.length - 1) {
          Rgradient += ', ';
        }
        // 添加数字标签
        var label = document.createElement('div');
        label.innerHTML = Rintervals[i];
        label.style.position = 'absolute';
        label.style.bottom = '-25px';
        label.style.left = (i / (Rcolors.length - 1) * 100) + '%';
        label.style.transform = 'translate(-50%, 0%)';
        label.style.fontSize = '15px';
        label.style.color = 'black';
        Rcolorbar.appendChild(label);
      }
      Rgradient += ')';
      Rcolorbar.style.background = Rgradient;

      map.addLayer({
        id: 'R_rate',
        type: 'circle',
        source: 'R_rate',
        paint: {
          'circle-radius': 4,
          // 使用插值函数将速度属性值映射到一个颜色值范围内
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'speed'],
            Rintervals[0], Rcolors[0],
            Rintervals[1], Rcolors[1],
          ]
        },
        layout: {
          visibility: 'none' // 不可见
        }
      });

      //添加SMB_rate数据并在地图上显示
      map.addSource('SMB_rate', {
        type: 'geojson',
        data: './src/data/smb_rate.json'
      });

      var SMBcolors = ['red', 'white', 'blue'];
      var SMBintervals = [-40, 0, 40];
      let SMBgradient = 'linear-gradient(to right, ';
      var SMBlabel = document.createElement('div');
      SMBlabel.innerHTML = 'SMB (cm/year)';
      SMBlabel.style.textAlign = 'center';
      SMBlabel.style.fontSize = "15px"
      var SMBcolorbar = document.createElement('div');
      SMBcolorbar.style.width = '280px';
      SMBcolorbar.style.height = '18px';
      for (let i = 0; i < SMBcolors.length; i++) {
        SMBgradient += SMBcolors[i] + ' ' + ((SMBintervals[i] - SMBintervals[0]) / (SMBintervals[SMBintervals.length - 1] - SMBintervals[0]) * 100) + '%';
        if (i < SMBcolors.length - 1) {
          SMBgradient += ', ';
        }
        // 添加数字标签
        var label = document.createElement('div');
        label.innerHTML = SMBintervals[i];
        label.style.position = 'absolute';
        label.style.bottom = '-25px';
        label.style.left = (i / (SMBcolors.length - 1) * 100) + '%';
        label.style.transform = 'translate(-50%, 0%)';
        label.style.fontSize = '15px';
        label.style.color = 'black';
        SMBcolorbar.appendChild(label);
      }
      SMBgradient += ')';
      SMBcolorbar.style.background = SMBgradient;

      map.addLayer({
        id: 'SMB_rate',
        type: 'circle',
        source: 'SMB_rate',
        paint: {
          'circle-radius': 4,
          // 使用插值函数将速度属性值映射到一个颜色值范围内
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'speed'],
            SMBintervals[0], SMBcolors[0],
            SMBintervals[1], SMBcolors[1],
            SMBintervals[2], SMBcolors[2],
          ]
        },
        layout: {
          visibility: 'none' // 不可见
        }
      });

      //添加precipitation_rate数据并在地图上显示
      map.addSource('precipitation_rate', {
        type: 'geojson',
        data: './src/data/precipitation_rate.json'
      });

      var Pcolors = ['#FF01FF', '#01FFFF'];
      var Pintervals = [40, 4000];
      let Pgradient = 'linear-gradient(to right, ';
      var Plabel = document.createElement('div');
      Plabel.innerHTML = 'Precipitation (mm/year)';
      Plabel.style.textAlign = 'center';
      Plabel.style.fontSize = "15px"
      var Pcolorbar = document.createElement('div');
      Pcolorbar.style.width = '280px';
      Pcolorbar.style.height = '18px';
      for (let i = 0; i < Pcolors.length; i++) {
        Pgradient += Pcolors[i] + ' ' + ((Pintervals[i] - Pintervals[0]) / (Pintervals[Pintervals.length - 1] - Pintervals[0]) * 100) + '%';
        if (i < Pcolors.length - 1) {
          Pgradient += ', ';
        }
        // 添加数字标签
        var label = document.createElement('div');
        label.innerHTML = Pintervals[i];
        label.style.position = 'absolute';
        label.style.bottom = '-25px';
        label.style.left = (i / (Pcolors.length - 1) * 100) + '%';
        label.style.transform = 'translate(-50%, 0%)';
        label.style.fontSize = '15px';
        label.style.color = 'black';
        Pcolorbar.appendChild(label);
      }
      Pgradient += ')';
      Pcolorbar.style.background = Pgradient;

      map.addLayer({
        id: 'precipitation_rate',
        type: 'circle',
        source: 'precipitation_rate',
        paint: {
          'circle-radius': 8,
          // 使用插值函数将速度属性值映射到一个颜色值范围内
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'speed'],
            Pintervals[0], Pcolors[0],
            Pintervals[1], Pcolors[1],
          ]
        },
        layout: {
          visibility: 'none' // 不可见
        }
      });

      map.addSource('gate_meta', {
        type: 'geojson',
        data: './src/data/gate_meta.json'
      });

      // 获取地理坐标的像素坐标
      var legendCoordinates = [-30, 68]; // 替换为您想要显示容器的地理坐标
      var legendPixelCoordinates = map.project(legendCoordinates);

      //创建容器
      var legendsContainer = document.createElement('div');
      legendsContainer.style.position = 'absolute';
      legendsContainer.style.width = '280px';

      // 设置容器的位置
      legendsContainer.style.left = legendPixelCoordinates.x + 'px';
      legendsContainer.style.top = legendPixelCoordinates.y + 'px';

      mapContainer.appendChild(legendsContainer);

      // 监听地图移动事件
      map.on('move', function () {
        // 获取地理坐标的像素坐标
        var legendCoordinates = [-30, 68]; // 替换为您想要显示容器的地理坐标
        var legendPixelCoordinates = map.project(legendCoordinates);

        // 设置容器的位置
        legendsContainer.style.left = legendPixelCoordinates.x + 'px';
        legendsContainer.style.top = legendPixelCoordinates.y + 'px';
      });

      // 监听地图缩放事件
      map.on('zoom', function () {
        // 获取当前地图缩放级别
        var zoom = map.getZoom();
        if (zoom <= 2.5) {
          legendsContainer.style.transform = 'scale(' + zoom / 2 + ')';
        } else {
          legendsContainer.style.transform = 'scale(' + 2.5 / 2 + ')';
        }
      });

      // 创建图例容器
      var legendContainer = document.createElement('div');
      legendContainer.style.position = 'absolute';
      legendContainer.style.bottom = '20px';
      legendContainer.style.right = '20px';
      legendContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
      legendContainer.style.padding = '10px';
      legendContainer.style.borderRadius = '4px';
      legendsContainer.appendChild(legendContainer);

      // 添加图例标题
      var legendTitle = document.createElement('div');
      legendTitle.textContent = 'Discharge (Gt/yr)';
      legendContainer.appendChild(legendTitle);

      // 定义不同半径值对应的图例样式
      var legendStyles = [
        { radius: 0, label: '0' },
        { radius: 5, label: '5' },
        { radius: 10, label: '10' },
        { radius: 20, label: '20' },
        { radius: 30, label: '30' },
        { radius: 40, label: '40' },
        { radius: 50, label: '50' }
      ];

      // 在图例容器中创建图例元素
      for (var i = 0; i < legendStyles.length; i++) {
        var legendItem = document.createElement('div');
        var legendCircle = document.createElement('span');
        var legendLabel = document.createElement('span');

        legendItem.style.display = 'flex'; // 设置为Flex容器
        legendItem.style.alignItems = 'center'; // 垂直居中对齐

        legendCircle.style.display = 'inline-block';
        legendCircle.style.width = legendStyles[i].radius + 'px';
        legendCircle.style.height = legendStyles[i].radius + 'px';
        legendCircle.style.borderRadius = '50%';
        legendCircle.style.backgroundColor = '#33a3dc';
        legendCircle.style.marginTop = '10px'; // 增加圆圈之间的水平间距

        legendLabel.style.marginLeft = '5px';
        legendLabel.textContent = legendStyles[i].label;

        legendItem.appendChild(legendCircle);
        legendItem.appendChild(legendLabel);
        legendContainer.appendChild(legendItem);
      }

      map.addLayer({
        id: 'gate_meta',
        type: 'circle',
        source: 'gate_meta',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'discharge_mean'],
            0, 0, // 当 discharge_mean 为 0 时，半径为 0
            5, 5,
            10, 10,
            20, 20,
            30, 30,
            40, 40,
            50, 50
          ],
          'circle-color': '#33a3dc',
        },
        layout: {
          // visibility: 'none' // 不可见
        },
      });

      // //显示冰川名称
      // var popup = new mapboxgl.Popup({
      //   closeButton: false,
      //   closeOnClick: false
      // });

      // map.on('mouseenter', 'gate_meta', function (e) {
      //   var coordinates = e.features[0].geometry.coordinates.slice();
      //   var glacierName = e.features[0].properties.name;

      //   // 设置弹出窗口的内容和位置
      //   popup.setLngLat(coordinates)
      //     .setHTML(glacierName)
      //     .addTo(map);
      // });

      // map.on('mouseleave', 'gate_meta', function () {
      //   // 鼠标离开时关闭弹出窗口
      //   popup.remove();
      // });

      // 创建一个变量来控制点击事件处理程序的执行
      let isClickEventEnabled = false;

      map.on('click', 'gate_meta', function (e) {
        if (isClickEventEnabled) {

          // 移除之前创建的表格
          var glacierChartContainer = document.getElementById('glacierChart-container');
          if (glacierChartContainer) {
            glacierChartContainer.parentNode.removeChild(glacierChartContainer);
          }

          var glacierDischargeContainer = document.createElement('div');
          glacierDischargeContainer.id = 'glacierChart-container';
          glacierDischargeContainer.style.position = 'relative';
          glacierDischargeContainer.style.left = '0px';
          glacierDischargeContainer.style.top = '0px';

          mapContainer.appendChild(glacierDischargeContainer);

          // 创建新的表格
          var data = JSON.parse(e.features[0].properties.speeds);
          // var glacierTitle = e.features[0].properties.name;
          var glacierChartContainer = document.createElement('div');
          glacierChartContainer.setAttribute('id', 'dischargeChart');
          glacierChartContainer.style.width = '628px';
          glacierChartContainer.style.height = '400px';
          glacierChartContainer.style.left = '0px';
          glacierChartContainer.style.position = 'absolute';
          glacierChartContainer.style.backgroundColor = 'white';
          glacierChartContainer.style.zIndex = 999;
          glacierDischargeContainer.appendChild(glacierChartContainer);
          var myChart = echarts.init(glacierChartContainer);

          myChart.setOption({
            // title: {
            //   text: glacierTitle,   // 设置标题文本
            //   textStyle: {              // 标题文字样式配置
            //     color: 'black',
            //     fontSize: 15,
            //   },
            //   left: 'center',   // 设置标题水平居中
            // },
            tooltip: {
              trigger: "item",
            },
            xAxis: {
              type: 'time',
              data: data.map(item => item.time),
              min: '1986', // 设置 X 轴的最小值
              max: '2023', // 设置 X 轴的最大值
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
            yAxis: {
              type: 'value',
              name: 'Discharge (Gt/yr)',
              nameLocation: "middle",
              nameTextStyle: {
                fontSize: 15,
              },
              nameGap: 40,
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
              width: '80%',  // 设置宽度为80%
              height: '70%',  // 设置高度为80%
              left: '10%',
              top: '15%',
            },
            series: [
              {
                type: 'scatter',
                name: 'discharge',
                data: data.map(item => [item.time, item.discharge]),
                color: 'red',
                tooltip: {
                  trigger: 'item',
                  formatter: function (params) {
                    const year = params.value[0];
                    const discharge = params.value[1].toFixed(3);
                    return "time:" + year + "<br />" + "discharge: " + discharge;
                  }
                }
              }
            ],
            toolbox: {
              feature: {
                saveAsImage: {},
              },
              itemSize: 18,
              itemGap: 20,
              right: 70,
            },
          });

          // 创建一个按钮元素
          var closeButton = document.createElement('button');
          closeButton.innerHTML = '关闭';
          closeButton.id = 'glacier-close-button';
          closeButton.style.position = 'absolute';
          closeButton.style.left = '580px';
          closeButton.style.top = '5px';
          closeButton.style.zIndex = 999;
          // 将按钮添加到地图容器中
          glacierDischargeContainer.appendChild(closeButton);
          // 添加点击事件监听器
          closeButton.addEventListener('click', function () {
            mapContainer.removeChild(document.getElementById('glacierChart-container'))
          });

          var downloadButton = document.createElement('button');
          downloadButton.innerHTML = '下载数据';
          downloadButton.id = 'download-button';
          downloadButton.style.position = 'absolute';
          downloadButton.style.left = '440px';
          downloadButton.style.top = '5px';
          downloadButton.style.zIndex = 999;

          // 将按钮添加到地图容器中
          glacierDischargeContainer.appendChild(downloadButton);

          // 添加点击事件监听器
          downloadButton.addEventListener('click', function () {
            // 转换为 CSV 格式
            let csvContent = 'Time,Discharge (Gt/yr)\n'; // CSV 标题行
            data.forEach(function (item) {
              csvContent += item.time + ',' + item.discharge + '\n'; // 数据行
            });

            // 创建临时链接
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const blobURL = URL.createObjectURL(blob);

            // 创建下载链接
            const downloadLink = document.createElement('a');
            downloadLink.href = blobURL;
            downloadLink.download = 'glacier_' + '.csv'; // 文件名中添加序号
            downloadLink.style.display = 'none';

            // 将下载链接添加到 DOM 中
            document.body.appendChild(downloadLink);

            // 模拟点击下载链接
            downloadLink.click();

            // 清理临时链接
            URL.revokeObjectURL(blobURL);

            // 从 DOM 中移除下载链接
            document.body.removeChild(downloadLink);
          });


          glacierDischargeContainer.addEventListener('mousedown', startDrag);
          function startDrag(e) {
            e.preventDefault();

            var initialX = e.clientX;
            var initialY = e.clientY;
            var startX = parseInt(glacierDischargeContainer.style.left) || 0;
            var startY = parseInt(glacierDischargeContainer.style.top) || 0;

            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);

            function handleMove(e) {
              var offsetX = e.clientX - initialX;
              var offsetY = e.clientY - initialY;

              glacierDischargeContainer.style.left = startX + offsetX + 'px';
              glacierDischargeContainer.style.top = startY + offsetY + 'px';
            }

            function handleUp() {
              document.removeEventListener('mousemove', handleMove);
              document.removeEventListener('mouseup', handleUp);
            }
          }
        }
      });

      //为各个流域添加边界线
      map.addLayer({
        id: 'greenlandCw-line',
        type: 'line',
        source: 'greenlandCw',
        layout: {},
        'paint': {
          'line-color': '#FF3300'
        },
      });

      //添加各个流域名称
      map.addLayer({
        id: 'greenlandCw-marker',
        type: 'symbol',
        source: 'greenlandCw',
        layout: {
          'text-field': 'CW', // 名称
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 20,
        },
        minzoom: 1, // 只在缩放级别大于等于1时显示
        maxzoom: 3.5  // 缩放级别小于3显示
      });

      //为各个流域添加可点击区域
      map.addLayer({
        id: 'greenlandCw-fill',
        type: 'fill',
        source: 'greenlandCw',
        layout: {},
        'paint': {
          'fill-color': 'transparent'
        },
        interactive: true,
        clickable: true,
        layout: {
        }
      });

      var url = 'http://localhost:7070';

      var cwFlag = true;
      var neFlag = true;
      var noFlag = true;
      var nwFlag = true;
      var seFlag = true;
      var swFlag = true;

      var smb = false;
      var ru = false;
      var ev = false;
      var pr = false;

      //点击各个区域时显示出Mass Change的图表
      map.on('click', 'greenlandCw-fill', function (e) {
        if (cwFlag) {
          map.setLayoutProperty('Grace_Vel', 'visibility', 'visible');
          map.setLayoutProperty('E_rate', 'visibility', 'none');
          map.setLayoutProperty('R_rate', 'visibility', 'none');
          map.setLayoutProperty('SMB_rate', 'visibility', 'none');
          map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
          map.setLayoutProperty('gate_meta', 'visibility', 'visible');
          isClickEventEnabled = false;
          window.location.href = url + '/#/cw'
        } else if (isClickEventEnabled) {
          // 移除之前创建的表格
          var chartContainer = document.getElementById('chart-container');
          if (chartContainer) {
            chartContainer.parentNode.removeChild(chartContainer);
          }

          var dischargeContainer = document.createElement('div');
          dischargeContainer.id = 'chart-container';
          dischargeContainer.style.position = 'relative';
          dischargeContainer.style.left = '0px';
          dischargeContainer.style.top = '0px';


          mapContainer.appendChild(dischargeContainer);

          // 获取边界线图层的边界经纬度坐标
          var boundaryFeatures = map.querySourceFeatures('greenlandCw');

          // 获取圆圈图层的所有圆圈要素
          var circleFeatures = map.querySourceFeatures('gate_meta');

          // 创建一个空数组用于存储合并后的结果
          var mergedArray = [];

          // 检查每个圆圈的中心点是否位于边界线图层的边界内，并打印符合条件的圆圈
          circleFeatures.forEach(function (circle) {
            var circleCenter = circle.geometry.coordinates;

            // 检查中心点是否位于边界线图层的边界内
            if (isPointWithinBoundary(circleCenter, boundaryFeatures)) {
              var data = JSON.parse(circle.properties.speeds);
              mergedArray.push(data);
            }
          });

          const mergedResult = mergedArray.reduce((result, array) => {
            array.forEach((item) => {
              const existingItem = result.find((r) => r.time === item.time);
              if (existingItem) {
                existingItem.discharge += item.discharge;
              } else {
                result.push({ time: item.time, discharge: item.discharge });
              }
            });
            return result;
          }, []);

          // 判断一个点是否位于边界线图层的边界内
          function isPointWithinBoundary(point, boundaryFeatures) {
            var polygon = turf.multiPolygon(boundaryFeatures.map(function (feature) {
              return feature.geometry.coordinates;
            }));
            var pointOnLine = turf.point(point);
            return turf.booleanPointInPolygon(pointOnLine, polygon);
          }

          var data = mergedResult;
          var chartContainer = document.createElement('div');
          chartContainer.setAttribute('id', 'totalChart');
          chartContainer.style.width = '628px';
          chartContainer.style.height = '400px';
          chartContainer.style.left = '0px';
          chartContainer.style.position = 'absolute';
          chartContainer.style.backgroundColor = 'white';
          chartContainer.style.zIndex = 999;
          dischargeContainer.appendChild(chartContainer);
          var myChart = echarts.init(chartContainer);

          myChart.setOption({
            title: {
              text: 'CW',   // 设置标题文本
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
            xAxis: {
              type: 'time',
              data: data.map(item => item.time),
              min: '1986', // 设置 X 轴的最小值
              max: '2023', // 设置 X 轴的最大值
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
            yAxis: {
              type: 'value',
              name: 'Discharge (Gt/yr)',
              nameLocation: "middle",
              nameTextStyle: {
                fontSize: 15,
              },
              nameGap: 40,
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
              width: '80%',  // 设置宽度为80%
              height: '70%',  // 设置高度为80%
              left: '10%',
              top: '15%',
            },
            series: [
              {
                type: 'scatter',
                name: 'discharge',
                data: data.map(item => [item.time, item.discharge]),
                color: 'red',
                tooltip: {
                  trigger: 'item',
                  formatter: function (params) {
                    const year = params.value[0];
                    const discharge = params.value[1].toFixed(3);
                    return "time:" + year + "<br />" + "discharge: " + discharge;
                  }
                }
              }
            ],
            toolbox: {
              feature: {
                saveAsImage: {},
              },
              itemSize: 18,
              itemGap: 20,
              right: 70,
            },
          });

          // 创建一个按钮元素
          var closeButton = document.createElement('button');
          closeButton.innerHTML = '关闭';
          closeButton.id = 'close-button';
          closeButton.style.position = 'absolute';
          closeButton.style.left = '580px';
          closeButton.style.top = '5px';
          closeButton.style.zIndex = 999;
          // 将按钮添加到地图容器中
          dischargeContainer.appendChild(closeButton);
          // 添加点击事件监听器
          closeButton.addEventListener('click', function () {
            document.getElementById('chart-container').style.display = 'none';
          });

          var downloadButton = document.createElement('button');
          downloadButton.innerHTML = '下载数据';
          downloadButton.id = 'download-button';
          downloadButton.style.position = 'absolute';
          downloadButton.style.left = '440px';
          downloadButton.style.top = '5px';
          downloadButton.style.zIndex = 999;

          // 将按钮添加到地图容器中
          dischargeContainer.appendChild(downloadButton);
          // 添加点击事件监听器
          downloadButton.addEventListener('click', function () {
            // 将数据转换为 CSV 格式
            var csvContent = 'data:text/csv;charset=utf-8,';

            // 添加 CSV 标题行
            csvContent += 'Time,Discharge (Gt/yr)\n';

            // 添加数据行
            data.forEach(function (item) {
              csvContent += item.time + ',' + item.discharge + '\n';
            });

            // 创建下载链接并设置文件名
            var dataLink = document.createElement('a');
            dataLink.href = encodeURI(csvContent);
            dataLink.download = 'CW_Discharge.csv';
            dataLink.click();
          });

          dischargeContainer.addEventListener('mousedown', startDrag);
          function startDrag(e) {
            e.preventDefault();

            var initialX = e.clientX;
            var initialY = e.clientY;
            var startX = parseInt(dischargeContainer.style.left) || 0;
            var startY = parseInt(dischargeContainer.style.top) || 0;

            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);

            function handleMove(e) {
              var offsetX = e.clientX - initialX;
              var offsetY = e.clientY - initialY;

              dischargeContainer.style.left = startX + offsetX + 'px';
              dischargeContainer.style.top = startY + offsetY + 'px';
            }

            function handleUp() {
              document.removeEventListener('mousemove', handleMove);
              document.removeEventListener('mouseup', handleUp);
            }
          }
          if (document.getElementById('glacierChart-container') && document.getElementById('glacierChart-container').style.display != 'none') {
            document.getElementById('chart-container').style.display = 'none';
          }
        } else if (smb) {
          var name = 'smb_cw';
          var title = 'CW';
          var yName = 'SMB';
          Promise.all([
            fetch('./src/data/smb/CW_smb.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }

            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (cm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'cw_smb.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
        else if (ru) {
          var name = 'ru_cw';
          var title = 'CW';
          var yName = 'Runoff';
          Promise.all([
            fetch('./src/data/ru/CW_ru.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列


            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }

            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (mm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'cw_ru.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
        else if (ev) {
          var name = 'ev_cw';
          var title = 'CW';
          var yName = 'EVAP + SUBL';
          Promise.all([
            fetch('./src/data/ev/CW_ev.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (mm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'cw_ev.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
        else if (pr) {
          var name = 'pr_cw';
          var title = 'CW';
          var yName = 'Precipitation';
          Promise.all([
            fetch('./src/data/pr/CW_pr.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (mm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'cw_pr.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
      });

      map.addLayer({
        id: 'greenlandNe-line',
        type: 'line',
        source: 'greenlandNe',
        layout: {},
        'paint': {
          'line-color': '#FF3300'
        },
      });

      map.addLayer({
        id: 'greenlandNe-marker',
        type: 'symbol',
        source: 'greenlandNe',
        layout: {
          'text-field': 'NE', // 名称
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 20
        },
        minzoom: 1, // 只在缩放级别大于等于1时显示
        maxzoom: 3.5  // 缩放级别小于3显示
      });

      map.addLayer({
        id: 'greenlandNe-fill',
        type: 'fill',
        source: 'greenlandNe',
        layout: {},
        'paint': {
          'fill-color': 'transparent'
        },
        interactive: true,
        clickable: true,
        layout: {
        }
      });

      //点击各个区域时显示出Mass Change的图表
      map.on('click', 'greenlandNe-fill', function (e) {
        if (neFlag) {
          map.setLayoutProperty('Grace_Vel', 'visibility', 'visible');
          map.setLayoutProperty('E_rate', 'visibility', 'none');
          map.setLayoutProperty('R_rate', 'visibility', 'none');
          map.setLayoutProperty('SMB_rate', 'visibility', 'none');
          map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
          map.setLayoutProperty('gate_meta', 'visibility', 'visible');
          isClickEventEnabled = false;
          window.location.href = url + '/#/ne'
        } else if (isClickEventEnabled) {
          // 移除之前创建的表格
          var chartContainer = document.getElementById('chart-container');
          if (chartContainer) {
            chartContainer.parentNode.removeChild(chartContainer);
          }
          var dischargeContainer = document.createElement('div');
          dischargeContainer.id = 'chart-container';
          dischargeContainer.style.position = 'relative';
          dischargeContainer.style.left = '0px';
          dischargeContainer.style.top = '0px';

          mapContainer.appendChild(dischargeContainer);

          // 获取边界线图层的边界经纬度坐标
          var boundaryFeatures = map.querySourceFeatures('greenlandNe');

          // 获取圆圈图层的所有圆圈要素
          var circleFeatures = map.querySourceFeatures('gate_meta');

          // 创建一个空数组用于存储合并后的结果
          var mergedArray = [];

          // 检查每个圆圈的中心点是否位于边界线图层的边界内，并打印符合条件的圆圈
          circleFeatures.forEach(function (circle) {
            var circleCenter = circle.geometry.coordinates;

            // 检查中心点是否位于边界线图层的边界内
            if (isPointWithinBoundary(circleCenter, boundaryFeatures)) {
              var data = JSON.parse(circle.properties.speeds);
              mergedArray.push(data);
            }
          });

          const mergedResult = mergedArray.reduce((result, array) => {
            array.forEach((item) => {
              const existingItem = result.find((r) => r.time === item.time);
              if (existingItem) {
                existingItem.discharge += item.discharge;
              } else {
                result.push({ time: item.time, discharge: item.discharge });
              }
            });
            return result;
          }, []);

          // 判断一个点是否位于边界线图层的边界内
          function isPointWithinBoundary(point, boundaryFeatures) {
            var polygon = turf.multiPolygon(boundaryFeatures.map(function (feature) {
              return feature.geometry.coordinates;
            }));
            var pointOnLine = turf.point(point);
            return turf.booleanPointInPolygon(pointOnLine, polygon);
          }

          var data = mergedResult;
          var chartContainer = document.createElement('div');
          chartContainer.setAttribute('id', 'totalChart');
          chartContainer.style.width = '628px';
          chartContainer.style.height = '400px';
          chartContainer.style.left = '0px';
          chartContainer.style.position = 'absolute';
          chartContainer.style.backgroundColor = 'white';
          chartContainer.style.zIndex = 999;
          dischargeContainer.appendChild(chartContainer);
          var myChart = echarts.init(chartContainer);

          myChart.setOption({
            title: {
              text: 'NE',   // 设置标题文本
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
            xAxis: {
              type: 'time',
              data: data.map(item => item.time),
              min: '1986', // 设置 X 轴的最小值
              max: '2023', // 设置 X 轴的最大值
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
            yAxis: {
              type: 'value',
              name: 'Discharge (Gt/yr)',
              nameLocation: "middle",
              nameTextStyle: {
                fontSize: 15,
              },
              nameGap: 40,
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
              width: '80%',  // 设置宽度为80%
              height: '70%',  // 设置高度为80%
              left: '10%',
              top: '15%',
            },
            series: [
              {
                type: 'scatter',
                name: 'discharge',
                data: data.map(item => [item.time, item.discharge]),
                color: 'red',
                tooltip: {
                  trigger: 'item',
                  formatter: function (params) {
                    const year = params.value[0];
                    const discharge = params.value[1].toFixed(3);
                    return "time:" + year + "<br />" + "discharge: " + discharge;
                  }
                }
              }
            ],
            toolbox: {
              feature: {
                saveAsImage: {},
              },
              itemSize: 18,
              itemGap: 20,
              right: 70,
            },
          });

          // 创建一个按钮元素
          var closeButton = document.createElement('button');
          closeButton.innerHTML = '关闭';
          closeButton.id = 'close-button';
          closeButton.style.position = 'absolute';
          closeButton.style.left = '580px';
          closeButton.style.top = '5px';
          closeButton.style.zIndex = 999;
          // 将按钮添加到地图容器中
          dischargeContainer.appendChild(closeButton);
          // 添加点击事件监听器
          closeButton.addEventListener('click', function () {
            mapContainer.removeChild(document.getElementById(name + 'container'));
          });

          var downloadButton = document.createElement('button');
          downloadButton.innerHTML = '下载数据';
          downloadButton.id = 'download-button';
          downloadButton.style.position = 'absolute';
          downloadButton.style.left = '440px';
          downloadButton.style.top = '5px';
          downloadButton.style.zIndex = 999;

          // 将按钮添加到地图容器中
          dischargeContainer.appendChild(downloadButton);
          // 添加点击事件监听器
          downloadButton.addEventListener('click', function () {
            // 将数据转换为 CSV 格式
            var csvContent = 'data:text/csv;charset=utf-8,';

            // 添加 CSV 标题行
            csvContent += 'Time,Discharge (Gt/yr)\n';

            // 添加数据行
            data.forEach(function (item) {
              csvContent += item.time + ',' + item.discharge + '\n';
            });

            // 创建下载链接并设置文件名
            var dataLink = document.createElement('a');
            dataLink.href = encodeURI(csvContent);
            dataLink.download = 'NE_Discharge.csv';
            dataLink.click();
          });
          dischargeContainer.addEventListener('mousedown', startDrag);
          function startDrag(e) {
            e.preventDefault();

            var initialX = e.clientX;
            var initialY = e.clientY;
            var startX = parseInt(dischargeContainer.style.left) || 0;
            var startY = parseInt(dischargeContainer.style.top) || 0;

            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);

            function handleMove(e) {
              var offsetX = e.clientX - initialX;
              var offsetY = e.clientY - initialY;

              dischargeContainer.style.left = startX + offsetX + 'px';
              dischargeContainer.style.top = startY + offsetY + 'px';
            }

            function handleUp() {
              document.removeEventListener('mousemove', handleMove);
              document.removeEventListener('mouseup', handleUp);
            }
          }
          if (document.getElementById('glacierChart-container') && document.getElementById('glacierChart-container').style.display != 'none') {
            document.getElementById('chart-container').style.display = 'none';
          }
        }
        else if (smb) {
          var name = 'smb_ne';
          var title = 'NE';
          var yName = 'SMB';
          Promise.all([
            fetch('./src/data/smb/NE_smb.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (cm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'ne_smb.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
        else if (ru) {
          var name = 'ru_ne';
          var title = 'NE';
          var yName = 'Runoff';
          Promise.all([
            fetch('./src/data/ru/NE_ru.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (mm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'ne_ru.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
        else if (ev) {
          var name = 'ev_ne';
          var title = 'NE';
          var yName = 'EVAP + SUBL';
          Promise.all([
            fetch('./src/data/ev/NE_ev.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (mm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'ne_ev.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
        else if (pr) {
          var name = 'pr_ne';
          var title = 'NE';
          var yName = 'Precipitation';
          Promise.all([
            fetch('./src/data/pr/NE_pr.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (mm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'ne_pr.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
      });

      map.addLayer({
        id: 'greenlandNo-line',
        type: 'line',
        source: 'greenlandNo',
        layout: {},
        'paint': {
          'line-color': '#FF3300'
        },
      });

      // 添加各个流域名称
      map.addLayer({
        id: 'greenlandNo-marker',
        type: 'symbol',
        source: 'greenlandNo',
        layout: {
          'text-field': 'NO', // 名称
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 20,
          'text-anchor': 'center',
          'text-offset': [-3, 4.5]
        },
        minzoom: 1, // 只在缩放级别大于等于1时显示
        maxzoom: 3.5  // 缩放级别小于3显示
      });

      map.addLayer({
        id: 'greenlandNo-fill',
        type: 'fill',
        source: 'greenlandNo',
        layout: {},
        'paint': {
          'fill-color': 'transparent'
        },
        interactive: true,
        clickable: true,
        layout: {
        }
      });

      //点击各个区域时显示出Mass Change的图表
      map.on('click', 'greenlandNo-fill', function (e) {
        if (noFlag) {
          map.setLayoutProperty('Grace_Vel', 'visibility', 'visible');
          map.setLayoutProperty('E_rate', 'visibility', 'none');
          map.setLayoutProperty('R_rate', 'visibility', 'none');
          map.setLayoutProperty('SMB_rate', 'visibility', 'none');
          map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
          map.setLayoutProperty('gate_meta', 'visibility', 'visible');
          isClickEventEnabled = false;
          window.location.href = url + '/#/no'
        } else if (isClickEventEnabled) {
          // 移除之前创建的表格
          var chartContainer = document.getElementById('chart-container');
          if (chartContainer) {
            chartContainer.parentNode.removeChild(chartContainer);
          }
          var dischargeContainer = document.createElement('div');
          dischargeContainer.id = 'chart-container';
          dischargeContainer.style.position = 'relative';
          dischargeContainer.style.left = '0px';
          dischargeContainer.style.top = '0px';

          mapContainer.appendChild(dischargeContainer);

          // 获取边界线图层的边界经纬度坐标
          var boundaryFeatures = map.querySourceFeatures('greenlandNo');

          // 获取圆圈图层的所有圆圈要素
          var circleFeatures = map.querySourceFeatures('gate_meta');

          // 创建一个空数组用于存储合并后的结果
          var mergedArray = [];

          // 检查每个圆圈的中心点是否位于边界线图层的边界内，并打印符合条件的圆圈
          circleFeatures.forEach(function (circle) {
            var circleCenter = circle.geometry.coordinates;

            // 检查中心点是否位于边界线图层的边界内
            if (isPointWithinBoundary(circleCenter, boundaryFeatures)) {
              var data = JSON.parse(circle.properties.speeds);
              mergedArray.push(data);
            }
          });

          const mergedResult = mergedArray.reduce((result, array) => {
            array.forEach((item) => {
              const existingItem = result.find((r) => r.time === item.time);
              if (existingItem) {
                existingItem.discharge += item.discharge;
              } else {
                result.push({ time: item.time, discharge: item.discharge });
              }
            });
            return result;
          }, []);

          // 判断一个点是否位于边界线图层的边界内
          function isPointWithinBoundary(point, boundaryFeatures) {
            var polygon = turf.multiPolygon(boundaryFeatures.map(function (feature) {
              return feature.geometry.coordinates;
            }));
            var pointOnLine = turf.point(point);
            return turf.booleanPointInPolygon(pointOnLine, polygon);
          }

          var data = mergedResult;
          var chartContainer = document.createElement('div');
          chartContainer.setAttribute('id', 'totalChart');
          chartContainer.style.width = '628px';
          chartContainer.style.height = '400px';
          chartContainer.style.left = '0px';
          chartContainer.style.position = 'absolute';
          chartContainer.style.backgroundColor = 'white';
          chartContainer.style.zIndex = 999;
          dischargeContainer.appendChild(chartContainer);
          var myChart = echarts.init(chartContainer);

          myChart.setOption({
            title: {
              text: 'NO',   // 设置标题文本
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
            xAxis: {
              type: 'time',
              data: data.map(item => item.time),
              min: '1986', // 设置 X 轴的最小值
              max: '2023', // 设置 X 轴的最大值
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
            yAxis: {
              type: 'value',
              name: 'Discharge (Gt/yr)',
              nameLocation: "middle",
              nameTextStyle: {
                fontSize: 15,
              },
              nameGap: 40,
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
              width: '80%',  // 设置宽度为80%
              height: '70%',  // 设置高度为80%
              left: '10%',
              top: '15%',
            },
            series: [
              {
                type: 'scatter',
                name: 'discharge',
                data: data.map(item => [item.time, item.discharge]),
                color: 'red',
                tooltip: {
                  trigger: 'item',
                  formatter: function (params) {
                    const year = params.value[0];
                    const discharge = params.value[1].toFixed(3);
                    return "time:" + year + "<br />" + "discharge: " + discharge;
                  }
                }
              }
            ],
            toolbox: {
              feature: {
                saveAsImage: {},
              },
              itemSize: 18,
              itemGap: 20,
              right: 70,
            },
          });

          // 创建一个按钮元素
          var closeButton = document.createElement('button');
          closeButton.innerHTML = '关闭';
          closeButton.id = 'close-button';
          closeButton.style.position = 'absolute';
          closeButton.style.left = '580px';
          closeButton.style.top = '5px';
          closeButton.style.zIndex = 999;
          // 将按钮添加到地图容器中
          dischargeContainer.appendChild(closeButton);
          // 添加点击事件监听器
          closeButton.addEventListener('click', function () {
            document.getElementById('chart-container').style.display = 'none';
          });

          var downloadButton = document.createElement('button');
          downloadButton.innerHTML = '下载数据';
          downloadButton.id = 'download-button';
          downloadButton.style.position = 'absolute';
          downloadButton.style.left = '440px';
          downloadButton.style.top = '5px';
          downloadButton.style.zIndex = 999;

          // 将按钮添加到地图容器中
          dischargeContainer.appendChild(downloadButton);
          // 添加点击事件监听器
          downloadButton.addEventListener('click', function () {
            // 将数据转换为 CSV 格式
            var csvContent = 'data:text/csv;charset=utf-8,';

            // 添加 CSV 标题行
            csvContent += 'Time,Discharge (Gt/yr)\n';

            // 添加数据行
            data.forEach(function (item) {
              csvContent += item.time + ',' + item.discharge + '\n';
            });

            // 创建下载链接并设置文件名
            var dataLink = document.createElement('a');
            dataLink.href = encodeURI(csvContent);
            dataLink.download = 'NO_Discharge.csv';
            dataLink.click();
          });
          dischargeContainer.addEventListener('mousedown', startDrag);
          function startDrag(e) {
            e.preventDefault();

            var initialX = e.clientX;
            var initialY = e.clientY;
            var startX = parseInt(dischargeContainer.style.left) || 0;
            var startY = parseInt(dischargeContainer.style.top) || 0;

            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);

            function handleMove(e) {
              var offsetX = e.clientX - initialX;
              var offsetY = e.clientY - initialY;

              dischargeContainer.style.left = startX + offsetX + 'px';
              dischargeContainer.style.top = startY + offsetY + 'px';
            }

            function handleUp() {
              document.removeEventListener('mousemove', handleMove);
              document.removeEventListener('mouseup', handleUp);
            }
          }
          if (document.getElementById('glacierChart-container') && document.getElementById('glacierChart-container').style.display != 'none') {
            document.getElementById('chart-container').style.display = 'none';
          }
        } else if (smb) {
          var name = 'smb_no';
          var title = 'NO';
          var yName = 'SMB';
          Promise.all([
            fetch('./src/data/smb/NO_smb.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (cm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'no_smb.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
        else if (ru) {
          var name = 'ru_no';
          var title = 'No';
          var yName = 'Runoff';
          Promise.all([
            fetch('./src/data/ru/NO_ru.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (mm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'no_ru.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
        else if (ev) {
          var name = 'ev_no';
          var title = 'NO';
          var yName = 'EVAP + SUBL';
          Promise.all([
            fetch('./src/data/ev/NO_ev.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (mm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'no_ev.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
        else if (pr) {
          var name = 'pr_no';
          var title = 'NO';
          var yName = 'Precipitation';
          Promise.all([
            fetch('./src/data/pr/NO_pr.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (mm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'no_pr.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
      });

      map.addLayer({
        id: 'greenlandNw-line',
        type: 'line',
        source: 'greenlandNw',
        layout: {},
        'paint': {
          'line-color': '#FF3300'
        },
      });

      map.addLayer({
        id: 'greenlandNw-marker',
        type: 'symbol',
        source: 'greenlandNw',
        layout: {
          'text-field': 'NW', // 名称
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 20
        },
        minzoom: 1, // 只在缩放级别大于等于1时显示
        maxzoom: 3.5  // 缩放级别小于3显示
      });

      map.addLayer({
        id: 'greenlandNw-fill',
        type: 'fill',
        source: 'greenlandNw',
        layout: {},
        'paint': {
          'fill-color': 'transparent'
        },
        interactive: true,
        clickable: true,
        layout: {
        }
      });

      //点击各个区域时显示出Mass Change的图表
      map.on('click', 'greenlandNw-fill', function (e) {
        if (nwFlag) {
          map.setLayoutProperty('Grace_Vel', 'visibility', 'visible');
          map.setLayoutProperty('E_rate', 'visibility', 'none');
          map.setLayoutProperty('R_rate', 'visibility', 'none');
          map.setLayoutProperty('SMB_rate', 'visibility', 'none');
          map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
          map.setLayoutProperty('gate_meta', 'visibility', 'visible');
          isClickEventEnabled = false;
          window.location.href = url + '/#/nw'
        } else if (isClickEventEnabled) {
          // 移除之前创建的表格
          var chartContainer = document.getElementById('chart-container');
          if (chartContainer) {
            chartContainer.parentNode.removeChild(chartContainer);
          }

          var dischargeContainer = document.createElement('div');
          dischargeContainer.id = 'chart-container';
          dischargeContainer.style.position = 'relative';
          dischargeContainer.style.left = '0px';
          dischargeContainer.style.top = '0px';

          mapContainer.appendChild(dischargeContainer);

          // 获取边界线图层的边界经纬度坐标
          var boundaryFeatures = map.querySourceFeatures('greenlandNw');

          // 获取圆圈图层的所有圆圈要素
          var circleFeatures = map.querySourceFeatures('gate_meta');

          // 创建一个空数组用于存储合并后的结果
          var mergedArray = [];

          // 检查每个圆圈的中心点是否位于边界线图层的边界内，并打印符合条件的圆圈
          circleFeatures.forEach(function (circle) {
            var circleCenter = circle.geometry.coordinates;

            // 检查中心点是否位于边界线图层的边界内
            if (isPointWithinBoundary(circleCenter, boundaryFeatures)) {
              var data = JSON.parse(circle.properties.speeds);
              mergedArray.push(data);
            }
          });

          const mergedResult = mergedArray.reduce((result, array) => {
            array.forEach((item) => {
              const existingItem = result.find((r) => r.time === item.time);
              if (existingItem) {
                existingItem.discharge += item.discharge;
              } else {
                result.push({ time: item.time, discharge: item.discharge });
              }
            });
            return result;
          }, []);

          // 判断一个点是否位于边界线图层的边界内
          function isPointWithinBoundary(point, boundaryFeatures) {
            var polygon = turf.multiPolygon(boundaryFeatures.map(function (feature) {
              return feature.geometry.coordinates;
            }));
            var pointOnLine = turf.point(point);
            return turf.booleanPointInPolygon(pointOnLine, polygon);
          }

          var data = mergedResult;
          var chartContainer = document.createElement('div');
          chartContainer.setAttribute('id', 'totalChart');
          chartContainer.style.width = '628px';
          chartContainer.style.height = '400px';
          chartContainer.style.left = '0px';
          chartContainer.style.position = 'absolute';
          chartContainer.style.backgroundColor = 'white';
          chartContainer.style.zIndex = 999;
          dischargeContainer.appendChild(chartContainer);
          var myChart = echarts.init(chartContainer);

          myChart.setOption({
            title: {
              text: 'NW',   // 设置标题文本
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
            xAxis: {
              type: 'time',
              data: data.map(item => item.time),
              min: '1986', // 设置 X 轴的最小值
              max: '2023', // 设置 X 轴的最大值
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
            yAxis: {
              type: 'value',
              name: 'Discharge (Gt/yr)',
              nameLocation: "middle",
              nameTextStyle: {
                fontSize: 15,
              },
              nameGap: 40,
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
              width: '80%',  // 设置宽度为80%
              height: '70%',  // 设置高度为80%
              left: '10%',
              top: '15%',
            },
            series: [
              {
                type: 'scatter',
                name: 'discharge',
                data: data.map(item => [item.time, item.discharge]),
                color: 'red',
                tooltip: {
                  trigger: 'item',
                  formatter: function (params) {
                    const year = params.value[0];
                    const discharge = params.value[1].toFixed(3);
                    return "time:" + year + "<br />" + "discharge: " + discharge;
                  }
                }
              }
            ],
            toolbox: {
              feature: {
                saveAsImage: {},
              },
              itemSize: 18,
              itemGap: 20,
              right: 70,
            },
          });

          // 创建一个按钮元素
          var closeButton = document.createElement('button');
          closeButton.innerHTML = '关闭';
          closeButton.id = 'close-button';
          closeButton.style.position = 'absolute';
          closeButton.style.left = '580px';
          closeButton.style.top = '5px';
          closeButton.style.zIndex = 999;
          // 将按钮添加到地图容器中
          dischargeContainer.appendChild(closeButton);
          // 添加点击事件监听器
          closeButton.addEventListener('click', function () {
            document.getElementById('chart-container').style.display = 'none';
          });

          var downloadButton = document.createElement('button');
          downloadButton.innerHTML = '下载数据';
          downloadButton.id = 'download-button';
          downloadButton.style.position = 'absolute';
          downloadButton.style.left = '440px';
          downloadButton.style.top = '5px';
          downloadButton.style.zIndex = 999;

          // 将按钮添加到地图容器中
          dischargeContainer.appendChild(downloadButton);
          // 添加点击事件监听器
          downloadButton.addEventListener('click', function () {
            // 将数据转换为 CSV 格式
            var csvContent = 'data:text/csv;charset=utf-8,';

            // 添加 CSV 标题行
            csvContent += 'Time,Discharge (Gt/yr)\n';

            // 添加数据行
            data.forEach(function (item) {
              csvContent += item.time + ',' + item.discharge + '\n';
            });

            // 创建下载链接并设置文件名
            var dataLink = document.createElement('a');
            dataLink.href = encodeURI(csvContent);
            dataLink.download = 'NW_Discharge.csv';
            dataLink.click();
          });
          dischargeContainer.addEventListener('mousedown', startDrag);
          function startDrag(e) {
            e.preventDefault();

            var initialX = e.clientX;
            var initialY = e.clientY;
            var startX = parseInt(dischargeContainer.style.left) || 0;
            var startY = parseInt(dischargeContainer.style.top) || 0;

            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);

            function handleMove(e) {
              var offsetX = e.clientX - initialX;
              var offsetY = e.clientY - initialY;

              dischargeContainer.style.left = startX + offsetX + 'px';
              dischargeContainer.style.top = startY + offsetY + 'px';
            }

            function handleUp() {
              document.removeEventListener('mousemove', handleMove);
              document.removeEventListener('mouseup', handleUp);
            }
          }
          if (document.getElementById('glacierChart-container') && document.getElementById('glacierChart-container').style.display != 'none') {
            document.getElementById('chart-container').style.display = 'none';
          }
        } else if (smb) {
          var name = 'smb_nw';
          var title = 'NW';
          var yName = 'SMB';
          Promise.all([
            fetch('./src/data/smb/NW_smb.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (cm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'nw_smb.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
        else if (ru) {
          var name = 'ru_nw';
          var title = 'NW';
          var yName = 'Runoff';
          Promise.all([
            fetch('./src/data/ru/NW_ru.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (mm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'nw_ru.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
        else if (ev) {
          var name = 'ev_nw';
          var title = 'NW';
          var yName = 'EVAP + SUBL';
          Promise.all([
            fetch('./src/data/ev/NW_ev.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (mm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'nw_ev.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
        else if (pr) {
          var name = 'pr_nw';
          var title = 'NW';
          var yName = 'Precipitation';
          Promise.all([
            fetch('./src/data/pr/NW_pr.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (mm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'nw_pr.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
      });

      map.addLayer({
        id: 'greenlandSe-line',
        type: 'line',
        source: 'greenlandSe',
        layout: {},
        'paint': {
          'line-color': '#FF3300'
        },
      });

      map.addLayer({
        id: 'greenlandSe-marker',
        type: 'symbol',
        source: 'greenlandSe',
        layout: {
          'text-field': 'SE', // 名称
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 20,
          'text-anchor': 'center',
          'text-offset': [0, -0.5]
        },
        minzoom: 1, // 只在缩放级别大于等于1时显示
        maxzoom: 3.5  // 缩放级别小于3显示
      });

      map.addLayer({
        id: 'greenlandSe-fill',
        type: 'fill',
        source: 'greenlandSe',
        layout: {},
        'paint': {
          'fill-color': 'transparent'
        },
        interactive: true,
        clickable: true,
        layout: {
        }
      });

      //点击各个区域时显示出Mass Change的图表
      map.on('click', 'greenlandSe-fill', function (e) {
        if (seFlag) {
          map.setLayoutProperty('Grace_Vel', 'visibility', 'visible');
          map.setLayoutProperty('E_rate', 'visibility', 'none');
          map.setLayoutProperty('R_rate', 'visibility', 'none');
          map.setLayoutProperty('SMB_rate', 'visibility', 'none');
          map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
          map.setLayoutProperty('gate_meta', 'visibility', 'visible');
          isClickEventEnabled = false;
          window.location.href = url + '/#/se'
        } else if (isClickEventEnabled) {
          // 移除之前创建的表格
          var chartContainer = document.getElementById('chart-container');
          if (chartContainer) {
            chartContainer.parentNode.removeChild(chartContainer);
          }
          var dischargeContainer = document.createElement('div');
          dischargeContainer.id = 'chart-container';
          dischargeContainer.style.position = 'relative';
          dischargeContainer.style.left = '0px';
          dischargeContainer.style.top = '0px';

          mapContainer.appendChild(dischargeContainer);

          // 获取边界线图层的边界经纬度坐标
          var boundaryFeatures = map.querySourceFeatures('greenlandSe');

          // 获取圆圈图层的所有圆圈要素
          var circleFeatures = map.querySourceFeatures('gate_meta');

          // 创建一个空数组用于存储合并后的结果
          var mergedArray = [];

          // 检查每个圆圈的中心点是否位于边界线图层的边界内，并打印符合条件的圆圈
          circleFeatures.forEach(function (circle) {
            var circleCenter = circle.geometry.coordinates;

            // 检查中心点是否位于边界线图层的边界内
            if (isPointWithinBoundary(circleCenter, boundaryFeatures)) {
              var data = JSON.parse(circle.properties.speeds);
              mergedArray.push(data);
            }
          });

          const mergedResult = mergedArray.reduce((result, array) => {
            array.forEach((item) => {
              const existingItem = result.find((r) => r.time === item.time);
              if (existingItem) {
                existingItem.discharge += item.discharge;
              } else {
                result.push({ time: item.time, discharge: item.discharge });
              }
            });
            return result;
          }, []);

          // 判断一个点是否位于边界线图层的边界内
          function isPointWithinBoundary(point, boundaryFeatures) {
            var polygon = turf.multiPolygon(boundaryFeatures.map(function (feature) {
              return feature.geometry.coordinates;
            }));
            var pointOnLine = turf.point(point);
            return turf.booleanPointInPolygon(pointOnLine, polygon);
          }

          var data = mergedResult;
          var chartContainer = document.createElement('div');
          chartContainer.setAttribute('id', 'totalChart');
          chartContainer.style.width = '628px';
          chartContainer.style.height = '400px';
          chartContainer.style.left = '0px';
          chartContainer.style.position = 'absolute';
          chartContainer.style.backgroundColor = 'white';
          chartContainer.style.zIndex = 999;
          dischargeContainer.appendChild(chartContainer);
          var myChart = echarts.init(chartContainer);

          myChart.setOption({
            title: {
              text: 'SE',   // 设置标题文本
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
            xAxis: {
              type: 'time',
              data: data.map(item => item.time),
              min: '1986', // 设置 X 轴的最小值
              max: '2023', // 设置 X 轴的最大值
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
            yAxis: {
              type: 'value',
              name: 'Discharge (Gt/yr)',
              nameLocation: "middle",
              nameTextStyle: {
                fontSize: 15,
              },
              nameGap: 40,
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
              width: '80%',  // 设置宽度为80%
              height: '70%',  // 设置高度为80%
              left: '10%',
              top: '15%',
            },
            series: [
              {
                type: 'scatter',
                name: 'discharge',
                data: data.map(item => [item.time, item.discharge]),
                color: 'red',
                tooltip: {
                  trigger: 'item',
                  formatter: function (params) {
                    const year = params.value[0];
                    const discharge = params.value[1].toFixed(3);
                    return "time:" + year + "<br />" + "discharge: " + discharge;
                  }
                }
              }
            ],
            toolbox: {
              feature: {
                saveAsImage: {},
              },
              itemSize: 18,
              itemGap: 20,
              right: 70,
            },
          });

          // 创建一个按钮元素
          var closeButton = document.createElement('button');
          closeButton.innerHTML = '关闭';
          closeButton.id = 'close-button';
          closeButton.style.position = 'absolute';
          closeButton.style.left = '580px';
          closeButton.style.top = '5px';
          closeButton.style.zIndex = 999;
          // 将按钮添加到地图容器中
          dischargeContainer.appendChild(closeButton);
          // 添加点击事件监听器
          closeButton.addEventListener('click', function () {
            document.getElementById('chart-container').style.display = 'none';
          });

          var downloadButton = document.createElement('button');
          downloadButton.innerHTML = '下载数据';
          downloadButton.id = 'download-button';
          downloadButton.style.position = 'absolute';
          downloadButton.style.left = '440px';
          downloadButton.style.top = '5px';
          downloadButton.style.zIndex = 999;

          // 将按钮添加到地图容器中
          dischargeContainer.appendChild(downloadButton);
          // 添加点击事件监听器
          // 添加点击事件监听器
          downloadButton.addEventListener('click', function () {
            // 将数据转换为 CSV 格式
            var csvContent = 'data:text/csv;charset=utf-8,';

            // 添加 CSV 标题行
            csvContent += 'Time,Discharge (Gt/yr)\n';

            // 添加数据行
            data.forEach(function (item) {
              csvContent += item.time + ',' + item.discharge + '\n';
            });

            // 创建下载链接并设置文件名
            var dataLink = document.createElement('a');
            dataLink.href = encodeURI(csvContent);
            dataLink.download = 'SE_Discharge.csv';
            dataLink.click();
          });
          dischargeContainer.addEventListener('mousedown', startDrag);
          function startDrag(e) {
            e.preventDefault();

            var initialX = e.clientX;
            var initialY = e.clientY;
            var startX = parseInt(dischargeContainer.style.left) || 0;
            var startY = parseInt(dischargeContainer.style.top) || 0;

            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);

            function handleMove(e) {
              var offsetX = e.clientX - initialX;
              var offsetY = e.clientY - initialY;

              dischargeContainer.style.left = startX + offsetX + 'px';
              dischargeContainer.style.top = startY + offsetY + 'px';
            }

            function handleUp() {
              document.removeEventListener('mousemove', handleMove);
              document.removeEventListener('mouseup', handleUp);
            }
          }
          if (document.getElementById('glacierChart-container') && document.getElementById('glacierChart-container').style.display != 'none') {
            document.getElementById('chart-container').style.display = 'none';
          }
        } else if (smb) {
          var name = 'smb_se';
          var title = 'SE';
          var yName = 'SMB';
          Promise.all([
            fetch('./src/data/smb/SE_smb.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (cm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'se_smb.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
        else if (ru) {
          var name = 'ru_se';
          var title = 'SE';
          var yName = 'Runoff';
          Promise.all([
            fetch('./src/data/ru/SE_ru.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (mm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'se_ru.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
        else if (ev) {
          var name = 'ev_se';
          var title = 'SE';
          var yName = 'EVAP + SUBL';
          Promise.all([
            fetch('./src/data/ev/SE_ev.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (mm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'se_ev.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
        else if (pr) {
          var name = 'pr_se';
          var title = 'SE';
          var yName = 'Precipitation';
          Promise.all([
            fetch('./src/data/pr/SE_pr.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (mm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'se_pr.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
      });

      map.addLayer({
        id: 'greenlandSw-line',
        type: 'line',
        source: 'greenlandSw',
        layout: {},
        'paint': {
          'line-color': '#FF3300'
        },
      });

      map.addLayer({
        id: 'greenlandSw-marker',
        type: 'symbol',
        source: 'greenlandSw',
        layout: {
          'text-field': 'SW', // 名称
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 20
        },
        minzoom: 1, // 只在缩放级别大于等于1时显示
        maxzoom: 3.5  // 缩放级别小于3显示
      });

      map.addLayer({
        id: 'greenlandSw-fill',
        type: 'fill',
        source: 'greenlandSw',
        layout: {},
        'paint': {
          'fill-color': 'transparent'
        },
        interactive: true,
        clickable: true,
        layout: {
        }
      });

      //点击各个区域时显示出Mass Change的图表
      map.on('click', 'greenlandSw-fill', function (e) {
        if (swFlag) {
          map.setLayoutProperty('Grace_Vel', 'visibility', 'visible');
          map.setLayoutProperty('E_rate', 'visibility', 'none');
          map.setLayoutProperty('R_rate', 'visibility', 'none');
          map.setLayoutProperty('SMB_rate', 'visibility', 'none');
          map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
          map.setLayoutProperty('gate_meta', 'visibility', 'visible');
          isClickEventEnabled = false;
          window.location.href = url + '/#/sw'
        } else if (isClickEventEnabled) {
          // 移除之前创建的表格
          var chartContainer = document.getElementById('chart-container');
          if (chartContainer) {
            chartContainer.parentNode.removeChild(chartContainer);
          }

          var dischargeContainer = document.createElement('div');
          dischargeContainer.id = 'chart-container';
          dischargeContainer.style.position = 'relative';
          dischargeContainer.style.left = '0px';
          dischargeContainer.style.top = '0px';

          mapContainer.appendChild(dischargeContainer);

          // 获取边界线图层的边界经纬度坐标
          var boundaryFeatures = map.querySourceFeatures('greenlandSw');

          // 获取圆圈图层的所有圆圈要素
          var circleFeatures = map.querySourceFeatures('gate_meta');

          // 创建一个空数组用于存储合并后的结果
          var mergedArray = [];

          // 检查每个圆圈的中心点是否位于边界线图层的边界内，并打印符合条件的圆圈
          circleFeatures.forEach(function (circle) {
            var circleCenter = circle.geometry.coordinates;

            // 检查中心点是否位于边界线图层的边界内
            if (isPointWithinBoundary(circleCenter, boundaryFeatures)) {
              var data = JSON.parse(circle.properties.speeds);
              mergedArray.push(data);
            }
          });

          const mergedResult = mergedArray.reduce((result, array) => {
            array.forEach((item) => {
              const existingItem = result.find((r) => r.time === item.time);
              if (existingItem) {
                existingItem.discharge += item.discharge;
              } else {
                result.push({ time: item.time, discharge: item.discharge });
              }
            });
            return result;
          }, []);

          // 判断一个点是否位于边界线图层的边界内
          function isPointWithinBoundary(point, boundaryFeatures) {
            var polygon = turf.multiPolygon(boundaryFeatures.map(function (feature) {
              return feature.geometry.coordinates;
            }));
            var pointOnLine = turf.point(point);
            return turf.booleanPointInPolygon(pointOnLine, polygon);
          }

          var data = mergedResult;
          var chartContainer = document.createElement('div');
          chartContainer.setAttribute('id', 'totalChart');
          chartContainer.style.width = '628px';
          chartContainer.style.height = '400px';
          chartContainer.style.left = '0px';
          chartContainer.style.position = 'absolute';
          chartContainer.style.backgroundColor = 'white';
          chartContainer.style.zIndex = 999;
          dischargeContainer.appendChild(chartContainer);
          var myChart = echarts.init(chartContainer);

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
            xAxis: {
              type: 'time',
              data: data.map(item => item.time),
              min: '1986', // 设置 X 轴的最小值
              max: '2023', // 设置 X 轴的最大值
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
            yAxis: {
              type: 'value',
              name: 'Discharge (Gt/yr)',
              nameLocation: "middle",
              nameTextStyle: {
                fontSize: 15,
              },
              nameGap: 40,
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
              width: '80%',  // 设置宽度为80%
              height: '70%',  // 设置高度为80%
              left: '10%',
              top: '15%',
            },
            series: [
              {
                type: 'scatter',
                name: 'discharge',
                data: data.map(item => [item.time, item.discharge]),
                color: 'red',
                tooltip: {
                  trigger: 'item',
                  formatter: function (params) {
                    const year = params.value[0];
                    const discharge = params.value[1].toFixed(3);
                    return "time:" + year + "<br />" + "discharge: " + discharge;
                  }
                }
              }
            ],
            toolbox: {
              feature: {
                saveAsImage: {},
              },
              itemSize: 18,
              itemGap: 20,
              right: 70,
            },
          });

          // 创建一个按钮元素
          var closeButton = document.createElement('button');
          closeButton.innerHTML = '关闭';
          closeButton.id = 'close-button';
          closeButton.style.position = 'absolute';
          closeButton.style.left = '580px';
          closeButton.style.top = '5px';
          closeButton.style.zIndex = 999;
          // 将按钮添加到地图容器中
          dischargeContainer.appendChild(closeButton);
          // 添加点击事件监听器
          closeButton.addEventListener('click', function () {
            document.getElementById('chart-container').style.display = 'none';
          });

          var downloadButton = document.createElement('button');
          downloadButton.innerHTML = '下载数据';
          downloadButton.id = 'download-button';
          downloadButton.style.position = 'absolute';
          downloadButton.style.left = '440px';
          downloadButton.style.top = '5px';
          downloadButton.style.zIndex = 999;

          // 将按钮添加到地图容器中
          dischargeContainer.appendChild(downloadButton);
          // 添加点击事件监听器
          downloadButton.addEventListener('click', function () {
            // 将数据转换为 CSV 格式
            var csvContent = 'data:text/csv;charset=utf-8,';

            // 添加 CSV 标题行
            csvContent += 'Time,Discharge (Gt/yr)\n';

            // 添加数据行
            data.forEach(function (item) {
              csvContent += item.time + ',' + item.discharge + '\n';
            });

            // 创建下载链接并设置文件名
            var dataLink = document.createElement('a');
            dataLink.href = encodeURI(csvContent);
            dataLink.download = 'SW_Discharge.csv';
            dataLink.click();
          });
          dischargeContainer.addEventListener('mousedown', startDrag);
          function startDrag(e) {
            e.preventDefault();

            var initialX = e.clientX;
            var initialY = e.clientY;
            var startX = parseInt(dischargeContainer.style.left) || 0;
            var startY = parseInt(dischargeContainer.style.top) || 0;

            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);

            function handleMove(e) {
              var offsetX = e.clientX - initialX;
              var offsetY = e.clientY - initialY;

              dischargeContainer.style.left = startX + offsetX + 'px';
              dischargeContainer.style.top = startY + offsetY + 'px';
            }

            function handleUp() {
              document.removeEventListener('mousemove', handleMove);
              document.removeEventListener('mouseup', handleUp);
            }
          }
          if (document.getElementById('glacierChart-container') && document.getElementById('glacierChart-container').style.display != 'none') {
            document.getElementById('chart-container').style.display = 'none';
          }
        } else if (smb) {
          var name = 'smb_sw';
          var title = 'SW';
          var yName = 'SMB';
          Promise.all([
            fetch('./src/data/smb/SW_smb.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (cm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'sw_smb.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
        else if (ru) {
          var name = 'ru_sw';
          var title = 'SW';
          var yName = 'Runoff';
          Promise.all([
            fetch('./src/data/ru/SW_ru.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (mm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'sw_ru.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
        else if (ev) {
          var name = 'ev_sw';
          var title = 'SW';
          var yName = 'EVAP + SUBL';
          Promise.all([
            fetch('./src/data/ev/SW_ev.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (mm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'sw_ev.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
        else if (pr) {
          var name = 'pr_sw';
          var title = 'SW';
          var yName = 'Precipitation';
          Promise.all([
            fetch('./src/data/pr/SW_pr.csv').then(response => response.text()),
          ]).then(([csvData]) => {
            // 解析CSV数据
            const rows = csvData.split('\n'); // 将数据按行分割
            const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

            if (document.getElementById(name + 'container')) {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            }
            var container = document.createElement('div');
            container.id = name + 'container';
            container.style.position = 'relative';
            container.style.left = '0px';
            container.style.top = '0px';

            mapContainer.appendChild(container);

            var chat = document.createElement('div');
            chat.setAttribute('id', name + 'chart');
            chat.style.width = '628px';
            chat.style.height = '400px';
            chat.style.left = '0px';
            chat.style.position = 'absolute';
            chat.style.backgroundColor = 'white';
            chat.style.zIndex = 999;
            container.appendChild(chat);
            var myChart = echarts.init(chat);

            myChart.setOption({
              title: {
                text: title,   // 设置标题文本
                textStyle: {              // 标题文字样式配置
                  color: 'black',
                  fontSize: 15,
                },
                left: 'center',   // 设置标题水平居中
                top: '10px'
              },
              xAxis: {
                type: "value",
                data: ["2000", "2005", "2010", "2015", "2020", "2025"],
                min: 2000,
                max: 2025,
                axisLabel: {
                  fontFamily: 'Arial', // 设置字体
                  fontSize: 15,        // 设置字号
                  color: '#333',        // 设置颜色
                },
                axisLine: {
                  show: false,
                },
                axisTick: {
                  show: false,
                }
              },
              yAxis: {
                type: 'value',
                name: yName + ' (mm/yr)',
                nameLocation: "middle",
                nameTextStyle: {
                  fontSize: 15,
                },
                nameGap: 40,
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
                width: '80%',  // 设置宽度为80%
                height: '70%',  // 设置高度为80%
                left: '10%',
                top: '15%',
              },
              series: [
                {
                  type: "scatter",
                  data: data,
                  itemStyle: {
                    // 修改散点的颜色
                    color: 'rgba(255, 0, 0, 0.8)',
                  },
                },
              ],
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
                itemSize: 18,
                itemGap: 20,
                right: 70,
              },
            });

            // 创建一个按钮元素
            var closeButton = document.createElement('button');
            closeButton.innerHTML = '关闭';
            closeButton.id = name + 'button';
            closeButton.style.position = 'absolute';
            closeButton.style.left = '580px';
            closeButton.style.top = '5px';
            closeButton.style.zIndex = 999;
            // 将按钮添加到地图容器中
            container.appendChild(closeButton);
            // 添加点击事件监听器
            closeButton.addEventListener('click', function () {
              mapContainer.removeChild(document.getElementById(name + 'container'));
            });

            var downloadButton = document.createElement('button');
            downloadButton.innerHTML = '下载数据';
            downloadButton.id = name + 'download-button';
            downloadButton.style.position = 'absolute';
            downloadButton.style.left = '440px';
            downloadButton.style.top = '5px';
            downloadButton.style.zIndex = 999;

            // 将按钮添加到地图容器中
            container.appendChild(downloadButton);

            downloadButton.addEventListener('click', function () {
              // 创建一个临时链接
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
              link.download = 'sw_pr.csv';
              link.target = '_blank';

              // 将链接添加到文档中并模拟点击
              document.body.appendChild(link);
              link.click();

              // 清理临时链接
              document.body.removeChild(link);
            });

            container.addEventListener('mousedown', startDrag);
            function startDrag(e) {
              e.preventDefault();

              var initialX = e.clientX;
              var initialY = e.clientY;
              var startX = parseInt(container.style.left) || 0;
              var startY = parseInt(container.style.top) || 0;

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);

              function handleMove(e) {
                var offsetX = e.clientX - initialX;
                var offsetY = e.clientY - initialY;

                container.style.left = startX + offsetX + 'px';
                container.style.top = startY + offsetY + 'px';
              }

              function handleUp() {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              }
            }
          });
        }
      });

      // 创建一个按钮元素
      var massChangeButton = document.createElement('button');
      massChangeButton.innerHTML = 'Greenland Mass Change';
      massChangeButton.id = 'mass-change-button';

      // 将按钮添加到地图容器中
      map.getContainer().appendChild(massChangeButton);

      // 为按钮添加 click 事件处理程序
      massChangeButton.addEventListener('click', function () {
        cwFlag = true;
        neFlag = true;
        noFlag = true;
        nwFlag = true;
        seFlag = true;
        swFlag = true;

        isClickEventEnabled = false;

        smb = false;
        ru = false;
        ev = false;
        pr = false;

        // 设置地图中心点和缩放级别
        map.setCenter([-42.6043, 90]);
        map.setZoom(2);
        map.setCenter([-42.6043, 90]);
        // //map.scrollZoom.disable()

        if (container.contains(GraceVellabel)) {
          container.removeChild(GraceVellabel);
          container.removeChild(GraceVelcolorbar);
        }

        if (container.contains(Elabel)) {
          container.removeChild(Elabel);
          container.removeChild(Ecolorbar);
        }

        if (container.contains(SMBlabel)) {
          container.removeChild(SMBlabel);
          container.removeChild(SMBcolorbar);
        }

        if (container.contains(Plabel)) {
          container.removeChild(Plabel);
          container.removeChild(Pcolorbar);
        }

        if (container.contains(Rlabel)) {
          container.removeChild(Rlabel);
          container.removeChild(Rcolorbar);
        }

        container.appendChild(GraceVellabel);
        container.appendChild(GraceVelcolorbar);
        legendsContainer.append(legendContainer);

        map.setLayoutProperty('Grace_Vel', 'visibility', 'visible');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        map.setLayoutProperty('gate_meta', 'visibility', 'visible');
        // 在单击时将用户重定向到新页面
        window.location.href = url + '/#/greenland';
      });

      // 创建一个按钮元素
      var eRateButton = document.createElement('button');
      eRateButton.innerHTML = 'EVAP + SUBL';
      eRateButton.classList.add('rate-button');
      eRateButton.id = 'e-rate-button';

      // 将按钮添加到地图容器中
      map.getContainer().appendChild(eRateButton);

      // 添加点击事件监听器
      eRateButton.addEventListener('click', function () {

        var name = 'ev_greenland';
        var title = 'Greenland';
        var yName = 'EVAP + SUBL';
        Promise.all([
          fetch('./src/data/ev/Greenland_ev.csv').then(response => response.text()),
        ]).then(([csvData]) => {
          // 解析CSV数据
          const rows = csvData.split('\n'); // 将数据按行分割
          const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

          if (document.getElementById(name + 'container')) {
            mapContainer.removeChild(document.getElementById(name + 'container'));
          }

          var container = document.createElement('div');
          container.id = name + 'container';
          container.style.position = 'relative';
          container.style.left = '0px';
          container.style.top = '0px';

          mapContainer.appendChild(container);

          var chat = document.createElement('div');
          chat.setAttribute('id', name + 'chart');
          chat.style.width = '628px';
          chat.style.height = '400px';
          chat.style.left = '0px';
          chat.style.position = 'absolute';
          chat.style.backgroundColor = 'white';
          chat.style.zIndex = 999;
          container.appendChild(chat);
          var myChart = echarts.init(chat);

          myChart.setOption({
            title: {
              text: title,   // 设置标题文本
              textStyle: {              // 标题文字样式配置
                color: 'black',
                fontSize: 15,
              },
              left: 'center',   // 设置标题水平居中
              top: '10px'
            },
            xAxis: {
              type: "value",
              data: ["2000", "2005", "2010", "2015", "2020", "2025"],
              min: 2000,
              max: 2025,
              axisLabel: {
                fontFamily: 'Arial', // 设置字体
                fontSize: 15,        // 设置字号
                color: '#333',        // 设置颜色
              },
              axisLine: {
                show: false,
              },
              axisTick: {
                show: false,
              }
            },
            yAxis: {
              type: 'value',
              name: yName + ' (mm/yr)',
              nameLocation: "middle",
              nameTextStyle: {
                fontSize: 15,
              },
              nameGap: 40,
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
              width: '80%',  // 设置宽度为80%
              height: '70%',  // 设置高度为80%
              left: '10%',
              top: '15%',
            },
            series: [
              {
                type: "scatter",
                data: data,
                itemStyle: {
                  // 修改散点的颜色
                  color: 'rgba(255, 0, 0, 0.8)',
                },
              },
            ],
            toolbox: {
              feature: {
                saveAsImage: {},
              },
              itemSize: 18,
              itemGap: 20,
              right: 70,
            },
          });

          // 创建一个按钮元素
          var closeButton = document.createElement('button');
          closeButton.innerHTML = '关闭';
          closeButton.id = name + 'button';
          closeButton.style.position = 'absolute';
          closeButton.style.left = '580px';
          closeButton.style.top = '5px';
          closeButton.style.zIndex = 999;
          // 将按钮添加到地图容器中
          container.appendChild(closeButton);
          // 添加点击事件监听器
          closeButton.addEventListener('click', function () {
            mapContainer.removeChild(document.getElementById(name + 'container'));
          });

          var downloadButton = document.createElement('button');
          downloadButton.innerHTML = '下载数据';
          downloadButton.id = name + 'download-button';
          downloadButton.style.position = 'absolute';
          downloadButton.style.left = '440px';
          downloadButton.style.top = '5px';
          downloadButton.style.zIndex = 999;

          // 将按钮添加到地图容器中
          container.appendChild(downloadButton);

          downloadButton.addEventListener('click', function () {
            // 创建一个临时链接
            const link = document.createElement('a');
            link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
            link.download = 'Greemland_ev.csv';
            link.target = '_blank';

            // 将链接添加到文档中并模拟点击
            document.body.appendChild(link);
            link.click();

            // 清理临时链接
            document.body.removeChild(link);
          });

          container.addEventListener('mousedown', startDrag);
          function startDrag(e) {
            e.preventDefault();

            var initialX = e.clientX;
            var initialY = e.clientY;
            var startX = parseInt(container.style.left) || 0;
            var startY = parseInt(container.style.top) || 0;

            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);

            function handleMove(e) {
              var offsetX = e.clientX - initialX;
              var offsetY = e.clientY - initialY;

              container.style.left = startX + offsetX + 'px';
              container.style.top = startY + offsetY + 'px';
            }

            function handleUp() {
              document.removeEventListener('mousemove', handleMove);
              document.removeEventListener('mouseup', handleUp);
            }
          }
        });

        cwFlag = false;
        neFlag = false;
        noFlag = false;
        nwFlag = false;
        seFlag = false;
        swFlag = false;

        isClickEventEnabled = false;

        smb = false;
        ru = false;
        ev = true;
        pr = false;

        if (container.contains(GraceVellabel)) {
          container.removeChild(GraceVellabel);
          container.removeChild(GraceVelcolorbar);
        }

        if (container.contains(SMBlabel)) {
          container.removeChild(SMBlabel);
          container.removeChild(SMBcolorbar);
        }

        if (container.contains(Plabel)) {
          container.removeChild(Plabel);
          container.removeChild(Pcolorbar);
        }

        if (container.contains(Rlabel)) {
          container.removeChild(Rlabel);
          container.removeChild(Rcolorbar);
        }

        if (legendsContainer.contains(legendContainer)) {
          legendsContainer.removeChild(legendContainer);
        }

        container.append(Elabel);
        container.append(Ecolorbar);

        // 设置地图中心点和缩放级别
        map.setCenter([-42.6043, 90]);
        map.setZoom(2);
        map.setCenter([-42.6043, 90]);
        //map.scrollZoom.disable()

        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'visible');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        map.setLayoutProperty('gate_meta', 'visibility', 'none');
      });

      // 创建一个按钮元素
      var rRateButton = document.createElement('button');
      rRateButton.innerHTML = 'Runoff';
      rRateButton.classList.add('rate-button');
      rRateButton.id = 'r-rate-button';

      // 将按钮添加到地图容器中
      map.getContainer().appendChild(rRateButton);

      // 添加点击事件监听器
      rRateButton.addEventListener('click', function () {

        var name = 'ru_greenland';
        var title = 'Greenland';
        var yName = 'Runoff';
        Promise.all([
          fetch('./src/data/ru/Greenland_ru.csv').then(response => response.text()),
        ]).then(([csvData]) => {
          // 解析CSV数据
          const rows = csvData.split('\n'); // 将数据按行分割
          const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

          if (document.getElementById(name + 'container')) {
            mapContainer.removeChild(document.getElementById(name + 'container'));
          }

          var container = document.createElement('div');
          container.id = name + 'container';
          container.style.position = 'relative';
          container.style.left = '0px';
          container.style.top = '0px';

          mapContainer.appendChild(container);

          var chat = document.createElement('div');
          chat.setAttribute('id', name + 'chart');
          chat.style.width = '628px';
          chat.style.height = '400px';
          chat.style.left = '0px';
          chat.style.position = 'absolute';
          chat.style.backgroundColor = 'white';
          chat.style.zIndex = 999;
          container.appendChild(chat);
          var myChart = echarts.init(chat);

          myChart.setOption({
            title: {
              text: title,   // 设置标题文本
              textStyle: {              // 标题文字样式配置
                color: 'black',
                fontSize: 15,
              },
              left: 'center',   // 设置标题水平居中
              top: '10px'
            },
            xAxis: {
              type: "value",
              data: ["2000", "2005", "2010", "2015", "2020", "2025"],
              min: 2000,
              max: 2025,
              axisLabel: {
                fontFamily: 'Arial', // 设置字体
                fontSize: 15,        // 设置字号
                color: '#333',        // 设置颜色
              },
              axisLine: {
                show: false,
              },
              axisTick: {
                show: false,
              }
            },
            yAxis: {
              type: 'value',
              name: yName + ' (mm/yr)',
              nameLocation: "middle",
              nameTextStyle: {
                fontSize: 15,
              },
              nameGap: 40,
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
              width: '80%',  // 设置宽度为80%
              height: '70%',  // 设置高度为80%
              left: '10%',
              top: '15%',
            },
            series: [
              {
                type: "scatter",
                data: data,
                itemStyle: {
                  // 修改散点的颜色
                  color: 'rgba(255, 0, 0, 0.8)',
                },
              },
            ],
            toolbox: {
              feature: {
                saveAsImage: {},
              },
              itemSize: 18,
              itemGap: 20,
              right: 70,
            },
          });

          // 创建一个按钮元素
          var closeButton = document.createElement('button');
          closeButton.innerHTML = '关闭';
          closeButton.id = name + 'button';
          closeButton.style.position = 'absolute';
          closeButton.style.left = '580px';
          closeButton.style.top = '5px';
          closeButton.style.zIndex = 999;
          // 将按钮添加到地图容器中
          container.appendChild(closeButton);
          // 添加点击事件监听器
          closeButton.addEventListener('click', function () {
            mapContainer.removeChild(document.getElementById(name + 'container'));
          });

          var downloadButton = document.createElement('button');
          downloadButton.innerHTML = '下载数据';
          downloadButton.id = name + 'download-button';
          downloadButton.style.position = 'absolute';
          downloadButton.style.left = '440px';
          downloadButton.style.top = '5px';
          downloadButton.style.zIndex = 999;

          // 将按钮添加到地图容器中
          container.appendChild(downloadButton);

          downloadButton.addEventListener('click', function () {
            // 创建一个临时链接
            const link = document.createElement('a');
            link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
            link.download = 'Greemland_ru.csv';
            link.target = '_blank';

            // 将链接添加到文档中并模拟点击
            document.body.appendChild(link);
            link.click();

            // 清理临时链接
            document.body.removeChild(link);
          });

          container.addEventListener('mousedown', startDrag);
          function startDrag(e) {
            e.preventDefault();

            var initialX = e.clientX;
            var initialY = e.clientY;
            var startX = parseInt(container.style.left) || 0;
            var startY = parseInt(container.style.top) || 0;

            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);

            function handleMove(e) {
              var offsetX = e.clientX - initialX;
              var offsetY = e.clientY - initialY;

              container.style.left = startX + offsetX + 'px';
              container.style.top = startY + offsetY + 'px';
            }

            function handleUp() {
              document.removeEventListener('mousemove', handleMove);
              document.removeEventListener('mouseup', handleUp);
            }
          }
        });

        cwFlag = false;
        neFlag = false;
        noFlag = false;
        nwFlag = false;
        seFlag = false;
        swFlag = false;

        isClickEventEnabled = false;

        smb = false;
        ru = true;
        ev = false;
        pr = false;

        if (container.contains(GraceVellabel)) {
          container.removeChild(GraceVellabel);
          container.removeChild(GraceVelcolorbar);
        }

        if (container.contains(Elabel)) {
          container.removeChild(Elabel);
          container.removeChild(Ecolorbar);
        }

        if (container.contains(SMBlabel)) {
          container.removeChild(SMBlabel);
          container.removeChild(SMBcolorbar);
        }

        if (container.contains(Plabel)) {
          container.removeChild(Plabel);
          container.removeChild(Pcolorbar);
        }

        if (legendsContainer.contains(legendContainer)) {
          legendsContainer.removeChild(legendContainer);
        }

        container.appendChild(Rlabel);
        container.appendChild(Rcolorbar);

        // 设置地图中心点和缩放级别
        map.setCenter([-42.6043, 90]);
        map.setZoom(2);
        map.setCenter([-42.6043, 90]);
        //map.scrollZoom.disable()

        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'visible');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        map.setLayoutProperty('gate_meta', 'visibility', 'none');
      });

      // 创建一个按钮元素
      var smbRateButton = document.createElement('button');
      smbRateButton.innerHTML = 'SMB';
      smbRateButton.classList.add('rate-button');
      smbRateButton.id = 'smb-rate-button';

      // 将按钮添加到地图容器中
      map.getContainer().appendChild(smbRateButton);

      // 添加点击事件监听器
      smbRateButton.addEventListener('click', function () {

        var name = 'smb_greenland';
        var title = 'Greenland';
        var yName = 'SMB';
        Promise.all([
          fetch('./src/data/smb/Greenland_smb.csv').then(response => response.text()),
        ]).then(([csvData]) => {
          // 解析CSV数据
          const rows = csvData.split('\n'); // 将数据按行分割
          const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

          if (document.getElementById(name + 'container')) {
            mapContainer.removeChild(document.getElementById(name + 'container'));
          }

          var container = document.createElement('div');
          container.id = name + 'container';
          container.style.position = 'relative';
          container.style.left = '0px';
          container.style.top = '0px';

          mapContainer.appendChild(container);

          var chat = document.createElement('div');
          chat.setAttribute('id', name + 'chart');
          chat.style.width = '628px';
          chat.style.height = '400px';
          chat.style.left = '0px';
          chat.style.position = 'absolute';
          chat.style.backgroundColor = 'white';
          chat.style.zIndex = 999;
          container.appendChild(chat);
          var myChart = echarts.init(chat);

          myChart.setOption({
            title: {
              text: title,   // 设置标题文本
              textStyle: {              // 标题文字样式配置
                color: 'black',
                fontSize: 15,
              },
              left: 'center',   // 设置标题水平居中
              top: '10px'
            },
            xAxis: {
              type: "value",
              data: ["2000", "2005", "2010", "2015", "2020", "2025"],
              min: 2000,
              max: 2025,
              axisLabel: {
                fontFamily: 'Arial', // 设置字体
                fontSize: 15,        // 设置字号
                color: '#333',        // 设置颜色
              },
              axisLine: {
                show: false,
              },
              axisTick: {
                show: false,
              }
            },
            yAxis: {
              type: 'value',
              name: yName + ' (cm/yr)',
              nameLocation: "middle",
              nameTextStyle: {
                fontSize: 15,
              },
              nameGap: 40,
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
              width: '80%',  // 设置宽度为80%
              height: '70%',  // 设置高度为80%
              left: '10%',
              top: '15%',
            },
            series: [
              {
                type: "scatter",
                data: data,
                itemStyle: {
                  // 修改散点的颜色
                  color: 'rgba(255, 0, 0, 0.8)',
                },
              },
            ],
            toolbox: {
              feature: {
                saveAsImage: {},
              },
              itemSize: 18,
              itemGap: 20,
              right: 70,
            },
          });

          // 创建一个按钮元素
          var closeButton = document.createElement('button');
          closeButton.innerHTML = '关闭';
          closeButton.id = name + 'button';
          closeButton.style.position = 'absolute';
          closeButton.style.left = '580px';
          closeButton.style.top = '5px';
          closeButton.style.zIndex = 999;
          // 将按钮添加到地图容器中
          container.appendChild(closeButton);
          // 添加点击事件监听器
          closeButton.addEventListener('click', function () {
            mapContainer.removeChild(document.getElementById(name + 'container'));
          });

          var downloadButton = document.createElement('button');
          downloadButton.innerHTML = '下载数据';
          downloadButton.id = name + 'download-button';
          downloadButton.style.position = 'absolute';
          downloadButton.style.left = '440px';
          downloadButton.style.top = '5px';
          downloadButton.style.zIndex = 999;

          // 将按钮添加到地图容器中
          container.appendChild(downloadButton);

          downloadButton.addEventListener('click', function () {
            // 创建一个临时链接
            const link = document.createElement('a');
            link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
            link.download = 'Greemland_smb.csv';
            link.target = '_blank';

            // 将链接添加到文档中并模拟点击
            document.body.appendChild(link);
            link.click();

            // 清理临时链接
            document.body.removeChild(link);
          });

          container.addEventListener('mousedown', startDrag);
          function startDrag(e) {
            e.preventDefault();

            var initialX = e.clientX;
            var initialY = e.clientY;
            var startX = parseInt(container.style.left) || 0;
            var startY = parseInt(container.style.top) || 0;

            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);

            function handleMove(e) {
              var offsetX = e.clientX - initialX;
              var offsetY = e.clientY - initialY;

              container.style.left = startX + offsetX + 'px';
              container.style.top = startY + offsetY + 'px';
            }

            function handleUp() {
              document.removeEventListener('mousemove', handleMove);
              document.removeEventListener('mouseup', handleUp);
            }
          }
        });

        cwFlag = false;
        neFlag = false;
        noFlag = false;
        nwFlag = false;
        seFlag = false;
        swFlag = false;

        isClickEventEnabled = false;

        smb = true;
        ru = false;
        ev = false;
        pr = false;

        if (container.contains(GraceVellabel)) {
          container.removeChild(GraceVellabel);
          container.removeChild(GraceVelcolorbar);
        }

        if (container.contains(Elabel)) {
          container.removeChild(Elabel);
          container.removeChild(Ecolorbar);
        }

        if (container.contains(Plabel)) {
          container.removeChild(Plabel);
          container.removeChild(Pcolorbar);
        }

        if (container.contains(Rlabel)) {
          container.removeChild(Rlabel);
          container.removeChild(Rcolorbar);
        }

        if (legendsContainer.contains(legendContainer)) {
          legendsContainer.removeChild(legendContainer);
        }

        container.appendChild(SMBlabel);
        container.appendChild(SMBcolorbar);

        // 设置地图中心点和缩放级别
        map.setCenter([-42.6043, 90]);
        map.setZoom(2);
        map.setCenter([-42.6043, 90]);
        //map.scrollZoom.disable()

        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'visible');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        map.setLayoutProperty('gate_meta', 'visibility', 'none');

      });

      // 创建一个按钮元素
      var pRateButton = document.createElement('button');
      pRateButton.innerHTML = 'Precipitation';
      pRateButton.classList.add('rate-button');
      pRateButton.id = 'p-rate-button';

      // 将按钮添加到地图容器中
      map.getContainer().appendChild(pRateButton);

      // 添加点击事件监听器
      pRateButton.addEventListener('click', function () {

        var name = 'pr_greenland';
        var title = 'Greenland';
        var yName = 'Precipitation';
        Promise.all([
          fetch('./src/data/pr/Greenland_pr.csv').then(response => response.text()),
        ]).then(([csvData]) => {
          // 解析CSV数据
          const rows = csvData.split('\n'); // 将数据按行分割
          const data = rows.map(row => row.split(',')); // 将每行数据按逗号分割成列

          if (document.getElementById(name + 'container')) {
            mapContainer.removeChild(document.getElementById(name + 'container'));
          }

          var container = document.createElement('div');
          container.id = name + 'container';
          container.style.position = 'relative';
          container.style.left = '0px';
          container.style.top = '0px';

          mapContainer.appendChild(container);

          var chat = document.createElement('div');
          chat.setAttribute('id', name + 'chart');
          chat.style.width = '628px';
          chat.style.height = '400px';
          chat.style.left = '0px';
          chat.style.position = 'absolute';
          chat.style.backgroundColor = 'white';
          chat.style.zIndex = 999;
          container.appendChild(chat);
          var myChart = echarts.init(chat);

          myChart.setOption({
            title: {
              text: title,   // 设置标题文本
              textStyle: {              // 标题文字样式配置
                color: 'black',
                fontSize: 15,
              },
              left: 'center',   // 设置标题水平居中
              top: '10px'
            },
            xAxis: {
              type: "value",
              data: ["2000", "2005", "2010", "2015", "2020", "2025"],
              min: 2000,
              max: 2025,
              axisLabel: {
                fontFamily: 'Arial', // 设置字体
                fontSize: 15,        // 设置字号
                color: '#333',        // 设置颜色
              },
              axisLine: {
                show: false,
              },
              axisTick: {
                show: false,
              }
            },
            yAxis: {
              type: 'value',
              name: yName + ' (mm/yr)',
              nameLocation: "middle",
              nameTextStyle: {
                fontSize: 15,
              },
              nameGap: 40,
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
              width: '80%',  // 设置宽度为80%
              height: '70%',  // 设置高度为80%
              left: '10%',
              top: '15%',
            },
            series: [
              {
                type: "scatter",
                data: data,
                itemStyle: {
                  // 修改散点的颜色
                  color: 'rgba(255, 0, 0, 0.8)',
                },
              },
            ],
            toolbox: {
              feature: {
                saveAsImage: {},
              },
              itemSize: 18,
              itemGap: 20,
              right: 70,
            },
          });

          // 创建一个按钮元素
          var closeButton = document.createElement('button');
          closeButton.innerHTML = '关闭';
          closeButton.id = name + 'button';
          closeButton.style.position = 'absolute';
          closeButton.style.left = '580px';
          closeButton.style.top = '5px';
          closeButton.style.zIndex = 999;
          // 将按钮添加到地图容器中
          container.appendChild(closeButton);
          // 添加点击事件监听器
          closeButton.addEventListener('click', function () {
            mapContainer.removeChild(document.getElementById(name + 'container'));
          });

          var downloadButton = document.createElement('button');
          downloadButton.innerHTML = '下载数据';
          downloadButton.id = name + 'download-button';
          downloadButton.style.position = 'absolute';
          downloadButton.style.left = '440px';
          downloadButton.style.top = '5px';
          downloadButton.style.zIndex = 999;

          // 将按钮添加到地图容器中
          container.appendChild(downloadButton);

          downloadButton.addEventListener('click', function () {
            // 创建一个临时链接
            const link = document.createElement('a');
            link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
            link.download = 'Greemland_pr.csv';
            link.target = '_blank';

            // 将链接添加到文档中并模拟点击
            document.body.appendChild(link);
            link.click();

            // 清理临时链接
            document.body.removeChild(link);
          });

          container.addEventListener('mousedown', startDrag);
          function startDrag(e) {
            e.preventDefault();

            var initialX = e.clientX;
            var initialY = e.clientY;
            var startX = parseInt(container.style.left) || 0;
            var startY = parseInt(container.style.top) || 0;

            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);

            function handleMove(e) {
              var offsetX = e.clientX - initialX;
              var offsetY = e.clientY - initialY;

              container.style.left = startX + offsetX + 'px';
              container.style.top = startY + offsetY + 'px';
            }

            function handleUp() {
              document.removeEventListener('mousemove', handleMove);
              document.removeEventListener('mouseup', handleUp);
            }
          }
        });

        cwFlag = false;
        neFlag = false;
        noFlag = false;
        nwFlag = false;
        seFlag = false;
        swFlag = false;

        isClickEventEnabled = false;

        smb = false;
        ru = false;
        ev = false;
        pr = true;

        if (container.contains(GraceVellabel)) {
          container.removeChild(GraceVellabel);
          container.removeChild(GraceVelcolorbar);
        }

        if (container.contains(Elabel)) {
          container.removeChild(Elabel);
          container.removeChild(Ecolorbar);
        }

        if (container.contains(SMBlabel)) {
          container.removeChild(SMBlabel);
          container.removeChild(SMBcolorbar);
        }

        if (container.contains(Rlabel)) {
          container.removeChild(Rlabel);
          container.removeChild(Rcolorbar);
        }

        if (legendsContainer.contains(legendContainer)) {
          legendsContainer.removeChild(legendContainer);
        }

        container.appendChild(Plabel);
        container.appendChild(Pcolorbar);

        // 设置地图中心点和缩放级别
        map.setCenter([-42.6043, 90]);
        map.setZoom(2);
        map.setCenter([-42.6043, 90]);
        //map.scrollZoom.disable()

        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'visible');
        map.setLayoutProperty('gate_meta', 'visibility', 'none');
      });

      // 创建一个按钮元素
      var dischargeButton = document.createElement('button');
      dischargeButton.innerHTML = 'Discharge';
      dischargeButton.classList.add('rate-button');
      dischargeButton.id = 'discharge-button';

      // 将按钮添加到地图容器中
      map.getContainer().appendChild(dischargeButton);

      // 为按钮添加 click 事件处理程序
      dischargeButton.addEventListener('click', function () {

        cwFlag = false;
        neFlag = false;
        noFlag = false;
        nwFlag = false;
        seFlag = false;
        swFlag = false;

        var smb = false;
        var ru = false;
        var ev = false;
        var pr = false;

        map.boxZoom.enable();
        map.dragPan.enable();
        map.scrollZoom.enable();

        // 设置地图中心点和缩放级别
        map.setCenter([-42.6043, 90]);
        map.setZoom(2);
        map.setCenter([-42.6043, 90]);
        map.scrollZoom.enable()

        if (container.contains(GraceVellabel)) {
          container.removeChild(GraceVellabel);
          container.removeChild(GraceVelcolorbar);
        }

        if (container.contains(Elabel)) {
          container.removeChild(Elabel);
          container.removeChild(Ecolorbar);
        }

        if (container.contains(SMBlabel)) {
          container.removeChild(SMBlabel);
          container.removeChild(SMBcolorbar);
        }

        if (container.contains(Rlabel)) {
          container.removeChild(Rlabel);
          container.removeChild(Rcolorbar);
        }

        if (container.contains(Plabel)) {
          container.removeChild(Plabel);
          container.removeChild(Pcolorbar);
        }

        legendsContainer.append(legendContainer);

        isClickEventEnabled = true;

        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        map.setLayoutProperty('gate_meta', 'visibility', 'visible');



      });

    });
  }
}
</script>
<style>
#mass-change-button {
  position: absolute;
  top: 10px;
  left: 10px;
  height: 40px;
  width: 180px;
  z-index: 1;
  padding: 10px;
  background-color: #F0F0EF;
  color: gray;
  border-top: 2px solid gray;
  border-right: 2px solid gray;
  border-left: 2px solid gray;
  border-bottom: 2px solid gray;
  font-size: 14px;
  cursor: pointer;
}

#mass-change-button:hover {
  background-color: rgb(151, 179, 232);
}

.rate-button {
  position: absolute;
  left: 10px;
  height: 40px;
  width: 180px;
  z-index: 1;
  padding: 10px;
  background-color: #F0F0EF;
  color: gray;
  border-top: none;
  border-right: 2px solid gray;
  border-left: 2px solid gray;
  border-bottom: 2px solid gray;
  font-size: 14px;
  cursor: pointer;
}

.rate-button:hover {
  background-color: rgb(151, 179, 232);
}

#e-rate-button {
  top: 170px;
}

#r-rate-button {
  top: 130px;
}

#smb-rate-button {
  top: 90px;
}

#p-rate-button {
  top: 210px;
}

#discharge-button {
  top: 50px;
}
</style>
