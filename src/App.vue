<template>
  <div id="map"></div>
  <div>
    <router-view></router-view>
  </div>
  <!-- <div id="discharge" style="width: 500px; height: 300px; right: 100px; position: absolute;"></div> -->
</template>
<script>
import mapboxgl from 'mapbox-gl';
import * as echarts from 'echarts';
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
      scrollZoom: false, // 禁用滚动缩放功能
      dragPan: false, //禁止移动地图
      doubleClickZoom: false,
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

      //添加Grace_vel数据
      map.addSource('Grace_Vel', {
        type: 'geojson',
        data: './src/data/Grace_vel.json'
      });

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
            -80, 'red',
            10, 'white'
          ]
        },
        layout: {
          visibility: 'none', // 不可见
        },
      });

      //添加E_rate数据并在地图上显示
      map.addSource('E_rate', {
        type: 'geojson',
        data: './src/data/e_rate.json'
      });

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
            -40, '#FF01FF',
            500, '#01FFFF'
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
            0, '#FF01FF',
            5300, '#01FFFF'
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
            -40, '#FF01FF',
            40, '#01FFFF'
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
            40, '#FF01FF',
            4000, '#01FFFF'
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
          'circle-color': 'rgba(255, 99, 71, 0.7)', // 浅红色
        },
        layout: {
          visibility: 'none' // 不可见
        },
        interactive: true,
        clickable: true,
      });

      var popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      });

      map.on('mouseenter', 'gate_meta', function (e) {
        var coordinates = e.features[0].geometry.coordinates.slice();
        var glacierName = e.features[0].properties.name;

        // 设置弹出窗口的内容和位置
        popup.setLngLat(coordinates)
          .setHTML(glacierName)
          .addTo(map);
      });

      map.on('mouseleave', 'gate_meta', function () {
        // 鼠标离开时关闭弹出窗口
        popup.remove();
      });

      map.on('click', 'gate_meta', function (e) {

        // 移除之前创建的表格
        var chartContainer = document.getElementById('chart-container');
        if (chartContainer) {
          chartContainer.parentNode.removeChild(chartContainer);
        }

        var container = document.createElement('div');
        container.id = 'chart-container';
        document.body.appendChild(container);

        // 创建新的表格
        var data = JSON.parse(e.features[0].properties.speeds);
        var glacierTitle = e.features[0].properties.name;
        var chartContainer = document.createElement('div');
        chartContainer.setAttribute('id', 'chart');
        chartContainer.style.width = '628px';
        chartContainer.style.height = '400px';
        chartContainer.style.left = '0px';
        chartContainer.style.position = 'absolute';
        chartContainer.style.backgroundColor = 'white';
        chartContainer.style.zIndex = 999;
        container.appendChild(chartContainer);
        var myChart = echarts.init(chartContainer);

        myChart.setOption({
          title: {
            text: glacierTitle,   // 设置标题文本
            textStyle: {              // 标题文字样式配置
              color: 'black',
              fontSize: 15,
            },
            left: 'center',   // 设置标题水平居中
          },
          tooltip: {
            trigger: "item",
          },
          xAxis: {
            type: 'category',
            data: data.map(item => item.time),
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
              name: 'time              discharge',
              data: data.map(item => [item.time, item.discharge]),
              color: 'red',
            },
          ],
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

        // 创建一个按钮元素
        var closeButton = document.createElement('button');
        closeButton.innerHTML = '关闭';
        closeButton.id = 'close-button';
        closeButton.style.position = 'absolute';
        closeButton.style.left = '580px';
        closeButton.style.top = '5px';
        closeButton.style.zIndex = 999;
        // 将按钮添加到地图容器中
        container.appendChild(closeButton);
        // 添加点击事件监听器
        closeButton.addEventListener('click', function () {
          document.getElementById('chart-container').style.display = 'none';
        });
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
          'text-size': 20
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
          visibility: 'none' // 不可见
        }
      });

      // var url = 'https://3707n923f3.goho.co';
      var url = 'http://localhost:7070';

      //点击各个区域时显示出Mass Change的图表
      map.on('click', 'greenlandCw-fill', function (e) {
        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        map.setLayoutProperty('gate_meta', 'visibility', 'none');
        window.location.href = url + '/#/cw'
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
          visibility: 'none' // 不可见
        }
      });

      map.on('click', 'greenlandNe-fill', function (e) {
        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        map.setLayoutProperty('gate_meta', 'visibility', 'none');
        window.location.href = url + '/#/ne';
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

      map.addLayer({
        id: 'greenlandNo-marker',
        type: 'symbol',
        source: 'greenlandNo',
        layout: {
          'text-field': 'NO', // 名称
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 20
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
          visibility: 'none' // 不可见
        }
      });

      map.on('click', 'greenlandNo-fill', function (e) {
        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        map.setLayoutProperty('gate_meta', 'visibility', 'none');
        window.location.href = url + '/#/no'
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
          visibility: 'none' // 不可见
        }
      });

      map.on('click', 'greenlandNw-fill', function (e) {
        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        map.setLayoutProperty('gate_meta', 'visibility', 'none');
        window.location.href = url + '/#/nw'
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
          'text-size': 20
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
          visibility: 'none' // 不可见
        }
      });

      map.on('click', 'greenlandSe-fill', function (e) {
        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        map.setLayoutProperty('gate_meta', 'visibility', 'none');
        window.location.href = url + '/#/se'
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
          visibility: 'none' // 不可见
        }
      });

      map.on('click', 'greenlandSw-fill', function (e) {
        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        map.setLayoutProperty('gate_meta', 'visibility', 'none');
        window.location.href = url + '/#/sw'
      });


      // 创建一个按钮元素
      var massChangeButton = document.createElement('button');
      massChangeButton.innerHTML = 'Mass Change';
      massChangeButton.id = 'mass-change-button';

      // 将按钮添加到地图容器中
      map.getContainer().appendChild(massChangeButton);

      // 为按钮添加 click 事件处理程序
      massChangeButton.addEventListener('click', function () {

        map.boxZoom.enable();
        map.dragPan.enable();
        map.scrollZoom.enable();

        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        map.setLayoutProperty('gate_meta', 'visibility', 'none');

        map.setLayoutProperty('greenlandNo-fill', 'visibility', 'visible');
        map.setLayoutProperty('greenlandNe-fill', 'visibility', 'visible');
        map.setLayoutProperty('greenlandNw-fill', 'visibility', 'visible');
        map.setLayoutProperty('greenlandSe-fill', 'visibility', 'visible');
        map.setLayoutProperty('greenlandSw-fill', 'visibility', 'visible');
        map.setLayoutProperty('greenlandCw-fill', 'visibility', 'visible');
        // 在单击时将用户重定向到新页面
        window.location.href = url + '/#/greenland';
      });

      // 创建一个按钮元素
      var graceVelButton = document.createElement('button');
      graceVelButton.innerHTML = 'Grace Vel';
      graceVelButton.classList.add('rate-button');
      graceVelButton.id = 'grace-vel-button';

      // 将按钮添加到地图容器中
      map.getContainer().appendChild(graceVelButton);

      // 添加点击事件监听器
      graceVelButton.addEventListener('click', function () {

        // 禁用地图移动和缩放
        map.boxZoom.disable();
        map.dragPan.disable();
        map.scrollZoom.disable();
        map.doubleClickZoom.disable();

        // 设置地图中心点和缩放级别
        map.setCenter([-42.6043, 90]);
        map.setZoom(2);


        map.setLayoutProperty('Grace_Vel', 'visibility', 'visible');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        map.setLayoutProperty('gate_meta', 'visibility', 'none');
        window.location.href = url + '/#/GraceVel';
      });

      // 创建一个按钮元素
      var eRateButton = document.createElement('button');
      eRateButton.innerHTML = 'E Rate';
      eRateButton.classList.add('rate-button');
      eRateButton.id = 'e-rate-button';

      // 将按钮添加到地图容器中
      map.getContainer().appendChild(eRateButton);

      // 添加点击事件监听器
      eRateButton.addEventListener('click', function () {

        // 禁用地图移动和缩放
        map.boxZoom.disable();
        map.dragPan.disable();
        map.scrollZoom.disable();
        map.doubleClickZoom.disable();
        // 设置地图中心点和缩放级别
        map.setCenter([-42.6043, 90]);
        map.setZoom(2);

        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'visible');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        map.setLayoutProperty('gate_meta', 'visibility', 'none');
        window.location.href = url + '/#/ERate';

      });

      // 创建一个按钮元素
      var rRateButton = document.createElement('button');
      rRateButton.innerHTML = 'R Rate';
      rRateButton.classList.add('rate-button');
      rRateButton.id = 'r-rate-button';

      // 将按钮添加到地图容器中
      map.getContainer().appendChild(rRateButton);

      // 添加点击事件监听器
      rRateButton.addEventListener('click', function () {
        // 禁用地图移动和缩放
        map.boxZoom.disable();
        map.dragPan.disable();
        map.scrollZoom.disable();
        map.doubleClickZoom.disable();
        // 设置地图中心点和缩放级别
        map.setCenter([-42.6043, 90]);
        map.setZoom(2);

        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'visible');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        map.setLayoutProperty('gate_meta', 'visibility', 'none');
        window.location.href = url + '/#/RRate';
      });

      // 创建一个按钮元素
      var smbRateButton = document.createElement('button');
      smbRateButton.innerHTML = 'SMB Rate';
      smbRateButton.classList.add('rate-button');
      smbRateButton.id = 'smb-rate-button';

      // 将按钮添加到地图容器中
      map.getContainer().appendChild(smbRateButton);

      // 添加点击事件监听器
      smbRateButton.addEventListener('click', function () {

        // 禁用地图移动和缩放
        map.boxZoom.disable();
        map.dragPan.disable();
        map.scrollZoom.disable();
        map.doubleClickZoom.disable();
        // 设置地图中心点和缩放级别
        map.setCenter([-42.6043, 90]);
        map.setZoom(2);

        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'visible');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        map.setLayoutProperty('gate_meta', 'visibility', 'none');
        window.location.href = url + '/#/SMBRate';
      });

      // 创建一个按钮元素
      var pRateButton = document.createElement('button');
      pRateButton.innerHTML = 'P Rate';
      pRateButton.classList.add('rate-button');
      pRateButton.id = 'p-rate-button';

      // 将按钮添加到地图容器中
      map.getContainer().appendChild(pRateButton);

      // 添加点击事件监听器
      pRateButton.addEventListener('click', function () {
        // 禁用地图移动和缩放
        map.boxZoom.disable();
        map.dragPan.disable();
        map.scrollZoom.disable();
        map.doubleClickZoom.disable();
        // 设置地图中心点和缩放级别
        map.setCenter([-42.6043, 90]);
        map.setZoom(2);

        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'visible');
        map.setLayoutProperty('gate_meta', 'visibility', 'none');
        window.location.href = url + '/#/PRate';
      });

      // 创建一个按钮元素
      var clearButton = document.createElement('button');
      clearButton.innerHTML = 'Clear';
      clearButton.classList.add('rate-button');
      clearButton.id = 'clear-button';

      // 将按钮添加到地图容器中
      map.getContainer().appendChild(clearButton);

      // 为按钮添加 click 事件处理程序
      clearButton.addEventListener('click', function () {
        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        map.setLayoutProperty('gate_meta', 'visibility', 'none');
        // 在单击时将用户重定向到新页面
        window.location.href = url + '/#/';
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

        // 禁用交互操作
        map.setLayoutProperty('greenlandNo-fill', 'visibility', 'none');
        map.setLayoutProperty('greenlandNe-fill', 'visibility', 'none');
        map.setLayoutProperty('greenlandNw-fill', 'visibility', 'none');
        map.setLayoutProperty('greenlandSe-fill', 'visibility', 'none');
        map.setLayoutProperty('greenlandSw-fill', 'visibility', 'none');
        map.setLayoutProperty('greenlandCw-fill', 'visibility', 'none');

        map.boxZoom.enable();
        map.dragPan.enable();
        map.scrollZoom.enable();

        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        map.setLayoutProperty('gate_meta', 'visibility', 'visible');

        // 在单击时将用户重定向到新页面
        window.location.href = url + '/#/';
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
  width: 120px;
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
  width: 120px;
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

#grace-vel-button {
  top: 50px;
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
  top: 250px;
}

#clear-button {
  top: 290px;
}
</style>
