<template>
  <div id="map"></div>
  <div>
    <router-view></router-view>
  </div>
</template>
<script>
import mapboxgl from 'mapbox-gl';
export default {
  name: 'App',
  mounted() {
    //mapbox的识别码
    mapboxgl.accessToken = 'pk.eyJ1IjoienhwMDYxMSIsImEiOiJjbGI2bzJ0b3kwMnh5M3FvZHppcjBnb3FoIn0.-bw5-bWnBcVLIg-wbB7oQA';
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v10', //地图样式
      center: [-42.6043, 90], //格陵兰岛中心点坐标
      zoom: 2.2, //缩放大小
      scrollZoom: false, // 禁用滚动缩放功能
      dragPan: false, //禁止移动地图
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
        data: './src/data/gate_meta.json',
      });

      // 创建图层并添加到地图对象中
      map.addLayer({
        id: 'circles',
        type: 'circle',
        source: 'gate_meta',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['/', ['get', 'total_discharge'], ['get', 'num_discharge']], // 计算平均discharge
            10, 0.01, // 如果平均discharge为0，圆盘半径为0
            100, 0.1, // 如果平均discharge为10，圆盘半径为5
            1000, 1 // 如果平均discharge为100，圆盘半径为10
          ],
          'circle-color': 'rgba(255, 99, 71, 0.7)', // 浅红色
        }
      });

      map.on('click', 'circles-layer', (e) => {
        const featureId = e.features[0].id; // 获取单击的要素的ID
        const feature = map.getSource('circles-source')._data.features[featureId]; // 获取要素对象
        const speeds = feature.properties.speeds; // 获取所有时间序列的信息

        // 将时间序列的信息显示在地图上
        const popup = new mapboxgl.Popup({ offset: [0, -15] })
          .setLngLat(feature.geometry.coordinates)
          .setHTML(`
      <h3>Discharge Timeline</h3>
      <ul>
        ${speeds.map(speed => `<li>${speed.time}: ${speed.discharge.toFixed(2)}</li>`).join('')}
      </ul>
    `)
          .addTo(map);
      });

      // 处理圆形要素的点击事件
      map.on('click', 'circles', function (e) {
        const speeds = e.features[0].properties.speeds;
        // 显示速度时间序列
        // ...
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
        interactive: true, //可以交互
        clickable: true, //可以点击
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
        }
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
      });

      //点击各个区域时显示出Mass Change的图表
      map.on('click', 'greenlandCw-fill', function (e) {
        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        window.location.href = 'http://localhost:7070/#/cw'
      });

      map.addLayer({
        id: 'greenlandNe-line',
        type: 'line',
        source: 'greenlandNe',
        layout: {},
        'paint': {
          'line-color': '#FF3300'
        },
        interactive: true,
        clickable: true
      });

      map.addLayer({
        id: 'greenlandNe-marker',
        type: 'symbol',
        source: 'greenlandNe',
        layout: {
          'text-field': 'NE', // 名称
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 20
        }
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
      });

      map.on('click', 'greenlandNe-fill', function (e) {
        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        window.location.href = 'http://localhost:7070/#/ne'
      });

      map.addLayer({
        id: 'greenlandNo-line',
        type: 'line',
        source: 'greenlandNo',
        layout: {},
        'paint': {
          'line-color': '#FF3300'
        },
        interactive: true,
        clickable: true
      });

      map.addLayer({
        id: 'greenlandNo-marker',
        type: 'symbol',
        source: 'greenlandNo',
        layout: {
          'text-field': 'NO', // 名称
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 20
        }
      });

      // map.addLayer({
      //   id: 'greenlandNo-fill',
      //   type: 'fill',
      //   source: 'greenlandNo',
      //   layout: {},
      //   'paint': {
      //     'fill-color': 'transparent'
      //   },
      //   interactive: true,
      //   clickable: true,
      // });

      map.on('click', 'greenlandNo-fill', function (e) {
        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        window.location.href = 'http://localhost:7070/#/no'
      });

      map.addLayer({
        id: 'greenlandNw-line',
        type: 'line',
        source: 'greenlandNw',
        layout: {},
        'paint': {
          'line-color': '#FF3300'
        },
        interactive: true,
        clickable: true
      });

      map.addLayer({
        id: 'greenlandNw-marker',
        type: 'symbol',
        source: 'greenlandNw',
        layout: {
          'text-field': 'NW', // 名称
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 20
        }
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
      });

      map.on('click', 'greenlandNw-fill', function (e) {
        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        window.location.href = 'http://localhost:7070/#/nw'
      });

      map.addLayer({
        id: 'greenlandSe-line',
        type: 'line',
        source: 'greenlandSe',
        layout: {},
        'paint': {
          'line-color': '#FF3300'
        },
        interactive: true,
        clickable: true
      });

      map.addLayer({
        id: 'greenlandSe-marker',
        type: 'symbol',
        source: 'greenlandSe',
        layout: {
          'text-field': 'SE', // 名称
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 20
        }
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
      });

      map.on('click', 'greenlandSe-fill', function (e) {
        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        window.location.href = 'http://localhost:7070/#/se'
      });

      map.addLayer({
        id: 'greenlandSw-line',
        type: 'line',
        source: 'greenlandSw',
        layout: {},
        'paint': {
          'line-color': '#FF3300'
        },
        interactive: true,
        clickable: true
      });

      map.addLayer({
        id: 'greenlandSw-marker',
        type: 'symbol',
        source: 'greenlandSw',
        layout: {
          'text-field': 'SW', // 名称
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 20
        }
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
      });

      map.on('click', 'greenlandSw-fill', function (e) {
        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        window.location.href = 'http://localhost:7070/#/sw'
      });


      // 创建一个按钮元素
      var massChangeButton = document.createElement('button');
      massChangeButton.innerHTML = 'Mass Change';
      massChangeButton.id = 'mass-change-button';

      // 将按钮添加到地图容器中
      map.getContainer().appendChild(massChangeButton);

      // 为按钮添加 click 事件处理程序
      massChangeButton.addEventListener('click', function () {
        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        // 在单击时将用户重定向到新页面
        window.location.href = 'http://localhost:7070/#/greenland';
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
        map.setLayoutProperty('Grace_Vel', 'visibility', 'visible');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        window.location.href = 'http://localhost:7070/#/GraceVel';
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
        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'visible');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        window.location.href = 'http://localhost:7070/#/ERate';

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
        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'visible');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        window.location.href = 'http://localhost:7070/#/RRate';
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
        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'visible');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'none');
        window.location.href = 'http://localhost:7070/#/SMBRate';
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
        map.setLayoutProperty('Grace_Vel', 'visibility', 'none');
        map.setLayoutProperty('E_rate', 'visibility', 'none');
        map.setLayoutProperty('R_rate', 'visibility', 'none');
        map.setLayoutProperty('SMB_rate', 'visibility', 'none');
        map.setLayoutProperty('precipitation_rate', 'visibility', 'visible');
        window.location.href = 'http://localhost:7070/#/PRate';
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
  top: 90px;
}

#r-rate-button {
  top: 130px;
}

#smb-rate-button {
  top: 170px;
}

#p-rate-button {
  top: 210px;
}
</style>
